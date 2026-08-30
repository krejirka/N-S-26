"""Scan trip photos, extract EXIF date/GPS, match itinerary days and places."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from PIL import Image
from PIL.ExifTags import GPSTAGS, TAGS

from common import (
    CATALOG_PATH,
    ITINERARY_PATH,
    PHOTO_DIR,
    PLACES_PATH,
    ensure_dirs,
    haversine_m,
    parse_exif_dt,
)


def gps_to_deg(values, ref: str | None) -> float | None:
    try:
        deg, minutes, seconds = values
        result = float(deg) + float(minutes) / 60.0 + float(seconds) / 3600.0
        if ref in ("S", "W"):
            result = -result
        return round(result, 6)
    except (TypeError, ValueError):
        return None


def read_exif(path: Path) -> dict:
    with Image.open(path) as im:
        width, height = im.size
        raw = im.getexif()
        tagged = {TAGS.get(k, k): v for k, v in raw.items()}
        gps_ifd = {}
        try:
            gps_ifd = raw.get_ifd(0x8825) or {}
        except Exception:
            gps_ifd = {}
        if not gps_ifd:
            legacy = im._getexif() or {}
            tagged = {TAGS.get(k, k): v for k, v in legacy.items()} | tagged
            gps_raw = tagged.get("GPSInfo") or {}
            if isinstance(gps_raw, dict):
                gps_ifd = gps_raw
        gps = {GPSTAGS.get(k, k): v for k, v in gps_ifd.items()}

    dt = parse_exif_dt(tagged.get("DateTimeOriginal") or tagged.get("DateTime"))
    lat = lng = None
    if gps.get("GPSLatitude") is not None and gps.get("GPSLongitude") is not None:
        lat = gps_to_deg(gps["GPSLatitude"], gps.get("GPSLatitudeRef"))
        lng = gps_to_deg(gps["GPSLongitude"], gps.get("GPSLongitudeRef"))

    return {
        "file": path.name,
        "path": str(path),
        "kind": "photo",
        "size": path.stat().st_size,
        "width": width,
        "height": height,
        "datetime": dt.isoformat(sep=" ") if dt else None,
        "date": dt.date().isoformat() if dt else None,
        "lat": lat,
        "lng": lng,
        "make": tagged.get("Make"),
        "model": tagged.get("Model"),
    }


def parse_iso6709(value: str | None) -> tuple[float | None, float | None]:
    if not value:
        return None, None
    m = re.search(r"([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)", value)
    if not m:
        return None, None
    return float(m.group(1)), float(m.group(2))


def find_ffprobe() -> str | None:
    hit = shutil.which("ffprobe")
    if hit:
        return hit
    extra = (
        Path(os.environ.get("LOCALAPPDATA", ""))
        / "Microsoft"
        / "WinGet"
        / "Packages"
        / "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
        / "ffmpeg-9.0-full_build"
        / "bin"
        / "ffprobe.exe"
    )
    return str(extra) if extra.exists() else None


def video_gps(path: Path, ffprobe: str | None) -> tuple[float | None, float | None]:
    if not ffprobe:
        return None, None
    try:
        out = subprocess.run(
            [ffprobe, "-v", "quiet", "-print_format", "json", "-show_format", str(path)],
            capture_output=True,
            text=True,
            check=True,
        )
        tags = (json.loads(out.stdout).get("format") or {}).get("tags") or {}
        return parse_iso6709(tags.get("location") or tags.get("location-eng"))
    except Exception:
        return None, None


def nearest_place(lat: float | None, lng: float | None, places: dict) -> dict | None:
    if lat is None or lng is None:
        return None
    best = None
    best_d = 10**12
    for pid, place in places.items():
        d = haversine_m(lat, lng, place["lat"], place["lng"])
        if d < best_d:
            best_d = d
            best = {
                "placeId": pid,
                "placeName": place["name"],
                "country": place.get("country"),
                "distanceM": round(d),
            }
    return best


def main() -> int:
    ensure_dirs()
    itinerary = json.loads(ITINERARY_PATH.read_text(encoding="utf-8"))
    places = json.loads(PLACES_PATH.read_text(encoding="utf-8"))["places"]
    day_by_date = {d["date"]: d for d in itinerary["days"]}

    photos = sorted({p.resolve() for p in PHOTO_DIR.glob("*.jpg")}, key=lambda p: p.name)
    videos = sorted({p.resolve() for p in PHOTO_DIR.glob("*.mp4")}, key=lambda p: p.name)
    items = []

    for i, path in enumerate(photos, 1):
        rec = read_exif(path)
        day = day_by_date.get(rec["date"] or "")
        rec["day"] = day["day"] if day else None
        rec["destination"] = day["destination"] if day else None
        rec["nearest"] = nearest_place(rec["lat"], rec["lng"], places)
        items.append(rec)
        if i % 50 == 0 or i == len(photos):
            print(f"  EXIF {i}/{len(photos)}", flush=True)

    ffprobe = find_ffprobe()
    for path in videos:
        name = path.name
        date = f"{name[:4]}-{name[4:6]}-{name[6:8]}"
        day = day_by_date.get(date)
        lat, lng = video_gps(path, ffprobe)
        items.append(
            {
                "file": name,
                "path": str(path),
                "kind": "video",
                "size": path.stat().st_size,
                "datetime": f"{date} {name[9:11]}:{name[11:13]}:{name[13:15]}",
                "date": date,
                "lat": lat,
                "lng": lng,
                "day": day["day"] if day else None,
                "destination": day["destination"] if day else None,
                "nearest": nearest_place(lat, lng, places),
            }
        )

    gps_n = sum(1 for x in items if x.get("lat") is not None)
    catalog = {
        "meta": itinerary["meta"],
        "photoCount": len(photos),
        "videoCount": len(videos),
        "withGps": gps_n,
        "items": items,
    }
    CATALOG_PATH.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {CATALOG_PATH} ({len(photos)} photos, {gps_n} with GPS, {len(videos)} videos)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
