"""Use every photo and video left in the trip folder, chronological by filename."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import CATALOG_PATH, ITINERARY_PATH, PHOTO_DIR, SELECTION_PATH, ensure_dirs, first_sentences


def name_key(filename: str) -> str:
    m = re.match(r"^(\d{8})_(\d{6})", filename)
    if m:
        return m.group(1) + m.group(2) + filename.lower()
    return filename.lower()


def main() -> int:
    ensure_dirs()
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    itinerary = json.loads(ITINERARY_PATH.read_text(encoding="utf-8"))
    days = {d["day"]: d for d in itinerary["days"]}

    on_disk = {p.name for p in PHOTO_DIR.iterdir() if p.is_file()}
    photos: list[dict] = []
    clips: list[dict] = []
    for item in catalog["items"]:
        if item["file"] not in on_disk:
            continue
        path = PHOTO_DIR / item["file"]
        if not path.exists():
            continue
        rec = dict(item)
        rec["path"] = str(path)
        day = days.get(item.get("day"))
        if day:
            rec["dayTitle"] = day["destination"]
            rec["programShort"] = first_sentences(day["program"])
        if rec["kind"] == "photo":
            photos.append(rec)
        elif rec["kind"] == "video":
            rec["start"] = 0.0
            rec["duration"] = None
            rec["label"] = "Video"
            clips.append(rec)

    photos.sort(key=lambda p: name_key(p["file"]))
    clips.sort(key=lambda p: name_key(p["file"]))
    timeline = sorted(photos + clips, key=lambda p: name_key(p["file"]))

    payload = {
        "photoCount": len(photos),
        "clipCount": len(clips),
        "photos": photos,
        "clips": clips,
        "timeline": [{"kind": x["kind"], "file": x["file"]} for x in timeline],
    }
    SELECTION_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Using all {len(photos)} photos and {len(clips)} clips, chronological by filename")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
