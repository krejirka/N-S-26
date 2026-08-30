"""Reverse-geocode every photo/video GPS into a Google-Maps-style place name."""

from __future__ import annotations

import json
import re
import ssl
import sys
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import GEOCODE_CACHE, SELECTION_PATH, ensure_dirs, haversine_m

UA = "n-s-26-recap/1.0 (personal travel video; nominatim)"
CACHE_VER = 3

# Named trip places with a Google-Maps-like label and a sensible radius.
KNOWN = [
    (35000, 62.0764, 9.5828, "Národní park Rondane"),
    (8000, 62.223, 9.542, "Dovrefjell, Hjerkinn"),
    (6000, 66.70, 13.72, "Svartisen, Engenbreen"),
    (700, 66.73898, 13.50291, "Furøy Camping, Halsa"),
    (700, 66.74232, 15.73838, "Graddis Fjellstue"),
    (2500, 65.93973, 18.83578, "Myrkulla, Arvidsjaur"),
    (800, 60.8447, 16.4371, "Jezero Valkalampi, Jädraås"),
    (400, 55.3869, 14.0534, "Ales Stenar, Kåseberga"),
    (5000, 62.719, 8.732, "Innerdalen"),
    (1200, 54.15168, 12.10058, "Trajekt Rostock–Trelleborg"),
    (1200, 55.37342, 13.14212, "Trajekt Rostock–Trelleborg"),
    (350, 59.91772, 10.46122, "Bærum, Tunheimbakken"),
    (600, 65.6641, 13.2694, "Laksforsen"),
]


def cache_key(lat: float, lng: float) -> str:
    return f"{lat:.4f},{lng:.4f}"


def _http_json(url: str) -> dict | list | None:
    req = Request(url, headers={"User-Agent": UA})
    for ctx in (ssl.create_default_context(), ssl._create_unverified_context()):
        try:
            with urlopen(req, timeout=30, context=ctx) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception:
            continue
    return None


def nominatim_reverse(lat: float, lng: float, zoom: int = 18) -> dict | None:
    qs = urlencode(
        {
            "lat": f"{lat:.6f}",
            "lon": f"{lng:.6f}",
            "format": "jsonv2",
            "zoom": str(zoom),
            "addressdetails": 1,
            "extratags": 1,
            "namedetails": 1,
            "accept-language": "cs,en,no,sv",
        }
    )
    hit = _http_json(f"https://nominatim.openstreetmap.org/reverse?{qs}")
    return hit if isinstance(hit, dict) else None


def photon_reverse(lat: float, lng: float) -> dict | None:
    qs = urlencode({"lat": f"{lat:.6f}", "lon": f"{lng:.6f}", "lang": "en"})
    hit = _http_json(f"https://photon.komoot.io/reverse?{qs}")
    if not isinstance(hit, dict):
        return None
    feats = hit.get("features") or []
    if not feats:
        return None
    return feats[0].get("properties") or {}


def overpass_pois(points: list[tuple[float, float]]) -> list[dict]:
    if not points:
        return []
    parts = []
    for lat, lng in points:
        parts.append(f'nwr(around:700,{lat:.5f},{lng:.5f})["tourism"];')
        parts.append(f'nwr(around:700,{lat:.5f},{lng:.5f})["amenity"="camp_site"];')
        parts.append(f'nwr(around:2500,{lat:.5f},{lng:.5f})["boundary"="national_park"];')
        parts.append(f'nwr(around:700,{lat:.5f},{lng:.5f})["leisure"="nature_reserve"];')
        parts.append(f'nwr(around:400,{lat:.5f},{lng:.5f})["historic"];')
        parts.append(f'nwr(around:400,{lat:.5f},{lng:.5f})["natural"="glacier"];')
    query = f"[out:json][timeout:70];({''.join(parts)});out center tags;"
    req = Request(
        "https://overpass-api.de/api/interpreter",
        data=query.encode("utf-8"),
        headers={"User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded"},
    )
    for ctx in (ssl.create_default_context(), ssl._create_unverified_context()):
        try:
            with urlopen(req, timeout=90, context=ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return data.get("elements") or []
        except Exception as exc:
            last = exc
            continue
    print(f"  overpass fail: {last}")
    return []


def _clean_admin(name: str) -> str:
    name = re.sub(r"\s+(kommun|kommune|obec|gmina)\b", "", name, flags=re.I).strip()
    return name


def _city(addr: dict) -> str:
    for key in ("city", "town", "village", "municipality", "hamlet", "city_district"):
        raw = (addr.get(key) or "").strip()
        val = _clean_admin(raw)
        if "kommun" in raw.lower() or "kommune" in raw.lower():
            val = re.sub(r"\s*(kommun|kommune)s?\b", "", raw, flags=re.I).strip()
            if val.endswith("s") and len(val) > 4:
                val = val[:-1]
        val = _clean_admin(val)
        if val:
            return val
    return ""


def _district(addr: dict) -> str:
    for key in ("suburb", "neighbourhood", "quarter", "city_district", "borough"):
        val = (addr.get(key) or "").strip()
        if val:
            return val
    return ""


def known_label(lat: float, lng: float) -> str | None:
    best = None
    best_d = 10**9
    for radius, plat, plng, label in KNOWN:
        d = haversine_m(lat, lng, plat, plng)
        if d <= radius and d < best_d:
            best = label
            best_d = d
    return best


def poi_near(lat: float, lng: float, elements: list[dict]) -> dict | None:
    best = None
    best_score = 10**12
    for el in elements:
        tags = el.get("tags") or {}
        name = (tags.get("name:cs") or tags.get("name:en") or tags.get("name") or "").strip()
        if not name:
            continue
        elat = el.get("lat") or (el.get("center") or {}).get("lat")
        elng = el.get("lon") or (el.get("center") or {}).get("lon")
        if elat is None or elng is None:
            continue
        d = haversine_m(lat, lng, float(elat), float(elng))
        kind = tags.get("tourism") or tags.get("amenity") or tags.get("boundary") or tags.get("leisure") or tags.get("historic") or tags.get("natural") or ""
        max_d = 120
        if kind in {"camp_site", "caravan_site"}:
            max_d = 500
        elif kind in {"viewpoint"}:
            max_d = 250
        elif kind in {"national_park", "nature_reserve", "glacier"}:
            max_d = 2500
        elif kind in {"attraction", "museum"}:
            max_d = 180
        weight = 1.0
        if kind in {"viewpoint", "camp_site", "caravan_site"}:
            weight = 0.4
        elif kind in {"national_park", "nature_reserve", "glacier"}:
            weight = 0.75
        score = d * weight
        if d <= max_d and score < best_score:
            best = {"name": name, "kind": kind, "dist": d, "tags": tags}
            best_score = score
    return best


def format_poi(poi: dict, city: str) -> str:
    name = poi["name"]
    kind = poi["kind"]
    if kind in {"camp_site", "caravan_site"} and "camp" not in name.lower() and "kemp" not in name.lower():
        name = f"Kemp {name}"
    if kind == "national_park" and "park" not in name.lower() and "národní" not in name.lower():
        name = f"Národní park {name}"
    if kind == "viewpoint" and "vyhlíd" not in name.lower() and "view" not in name.lower():
        name = f"Vyhlídka {name}"
    if kind == "glacier" and "breen" not in name.lower() and "glaci" not in name.lower():
        name = f"Ledovec {name}"
    if city and city.lower() not in name.lower():
        return f"{name}, {city}"
    return name


def format_label(hit: dict, photon: dict | None, poi: dict | None, lat: float, lng: float, day: int | None) -> str:
    known = known_label(lat, lng)
    addr = (hit or {}).get("address") or {}
    city = _city(addr)
    district = _district(addr)
    name = ((hit or {}).get("name") or "").strip()
    category = ((hit or {}).get("category") or (hit or {}).get("class") or "").lower()
    typ = ((hit or {}).get("type") or "").lower()
    road = (addr.get("road") or addr.get("pedestrian") or addr.get("trunk") or "").strip()
    extra = (hit or {}).get("extratags") or {}

    if day in {1, 2, 17, 18} and 54.2 < lat < 55.5 and 12.0 < lng < 13.4:
        if not city or "ferry" in typ or extra.get("amenity") == "ferry_terminal":
            return "Trajekt Rostock–Trelleborg"

    if known and known.startswith("Národní park"):
        return known
    if known and known.startswith("Trajekt"):
        return known
    if poi and poi["kind"] in {"national_park", "nature_reserve"} and poi["dist"] < 2500:
        return format_poi(poi, city)
    if known and ("Camping" in known or "Kemp" in known or "Fjellstue" in known or "Myrkulla" in known):
        if not poi or poi["dist"] > 350:
            return known
    if poi and poi["dist"] < 450:
        return format_poi(poi, city)
    if known and poi is None:
        return known

    if photon:
        p_name = (photon.get("name") or "").strip()
        p_key = (photon.get("osm_key") or "").lower()
        p_val = (photon.get("osm_value") or "").lower()
        p_city = photon.get("city") or photon.get("town") or photon.get("village") or city
        useful = p_val in {"camp_site", "caravan_site", "viewpoint", "national_park", "nature_reserve", "glacier", "attraction"}
        if p_name and useful and p_key in {"tourism", "amenity", "leisure", "natural", "boundary"}:
            fake = {"name": p_name, "kind": p_val, "dist": 0, "tags": {}}
            return format_poi(fake, _clean_admin(str(p_city or "")))

    tourism = (addr.get("tourism") or extra.get("tourism") or "").lower()
    amenity = (addr.get("amenity") or extra.get("amenity") or "").lower()
    natural = (addr.get("natural") or extra.get("natural") or "").lower()
    if tourism in {"camp_site", "caravan_site"} or amenity == "camp_site":
        return format_poi({"name": name or city or "kemp", "kind": "camp_site", "dist": 0, "tags": {}}, city)
    if typ == "national_park" or extra.get("boundary") == "national_park":
        return format_poi({"name": name or "národní park", "kind": "national_park", "dist": 0, "tags": {}}, city)
    if tourism == "viewpoint" or typ == "viewpoint":
        return format_poi({"name": name or "vyhlídka", "kind": "viewpoint", "dist": 0, "tags": {}}, city)
    if natural in {"fjord", "bay", "beach", "glacier"}:
        label = name or natural
        return f"{label}, {city}" if city and city.lower() not in label.lower() else label

    if amenity in {"ferry_terminal", "ferry"} or "ferry" in typ:
        if "rostock" in (city + name).lower() or "trelleborg" in (city + name).lower():
            return "Trajekt Rostock–Trelleborg"
        return f"Trajekt {name or city}".strip()

    if amenity in {"rest_area", "services"} or typ in {"rest_area", "services"}:
        where = city or name or road
        return f"Odpočívadlo {where}".strip() if where else "Odpočívadlo u silnice"

    if known:
        return known

    # City / district like Google: "Haga, Göteborg"
    if city and district and district.lower() != city.lower():
        return f"{district}, {city}"
    if name and category in {"tourism", "historic", "amenity", "leisure", "natural"}:
        return f"{name}, {city}" if city and city.lower() not in name.lower() else name
    if city and name and name.lower() != city.lower() and category == "place":
        return f"{name}, {city}" if name.lower() not in city.lower() else city
    if city:
        hamlet = (addr.get("hamlet") or "").strip()
        if hamlet and hamlet.lower() != city.lower():
            return f"{hamlet}, {city}"
        if road and category == "highway":
            return f"{city}, {road}"
        return city
    if name:
        return name
    if road:
        return road
    return "Po cestě"


def ensure_hit(lat: float, lng: float, rec: dict) -> dict:
    hit = rec.get("nominatim")
    if not hit and rec.get("address"):
        hit = {
            "name": rec.get("name"),
            "address": rec.get("address") or {},
            "display_name": rec.get("display"),
        }
        rec["nominatim"] = hit
    if not hit:
        hit = nominatim_reverse(lat, lng, 18) or {}
        time.sleep(1.05)
        rec["nominatim"] = hit
    category = (hit.get("category") or hit.get("class") or "").lower()
    road_only = category in {"highway", "railway"} or not hit.get("name")
    if road_only and not rec.get("nominatim14"):
        wide = nominatim_reverse(lat, lng, 14) or {}
        time.sleep(1.05)
        rec["nominatim14"] = wide
    if not rec.get("photon"):
        rec["photon"] = photon_reverse(lat, lng)
        time.sleep(0.2)
    return rec


def main() -> int:
    ensure_dirs()
    selection = json.loads(SELECTION_PATH.read_text(encoding="utf-8"))
    cache: dict = {}
    if GEOCODE_CACHE.exists():
        raw = json.loads(GEOCODE_CACHE.read_text(encoding="utf-8"))
        cache = raw.get("points", raw) if isinstance(raw, dict) and "points" in raw else raw

    items = list(selection["photos"]) + list(selection.get("clips", []))
    unique: list[tuple[str, float, float, int | None]] = []
    seen = set()
    for item in items:
        if item.get("lat") is None or item.get("lng") is None:
            continue
        key = cache_key(item["lat"], item["lng"])
        if key in seen:
            continue
        seen.add(key)
        unique.append((key, item["lat"], item["lng"], item.get("day")))

    print(f"geocoding {len(unique)} unique GPS points")
    need_net = []
    for i, (key, lat, lng, day) in enumerate(unique, 1):
        rec = cache.get(key) if isinstance(cache.get(key), dict) else {}
        if rec.get("nominatim") or rec.get("address"):
            if not rec.get("nominatim") and rec.get("address"):
                rec["nominatim"] = {
                    "name": rec.get("name"),
                    "address": rec.get("address"),
                    "display_name": rec.get("display"),
                }
            cache[key] = rec
            continue
        need_net.append((key, lat, lng, day))
        rec = ensure_hit(lat, lng, rec)
        cache[key] = rec
        if len(need_net) % 10 == 0:
            print(f"  nominatim {len(need_net)} new")

    print("formatting labels from nominatim / known places")
    elements: list[dict] = []

    for key, lat, lng, day in unique:
        rec = cache.get(key) or {}
        hit = rec.get("nominatim") or {}
        if rec.get("nominatim14"):
            wide = rec["nominatim14"]
            hit = {
                **hit,
                **wide,
                "address": {**(hit.get("address") or {}), **(wide.get("address") or {})},
                "name": wide.get("name") or hit.get("name"),
            }
        poi = poi_near(lat, lng, elements)
        label = format_label(hit, rec.get("photon"), poi, lat, lng, day)
        rec["label"] = label
        rec["v"] = CACHE_VER
        cache[key] = rec
        print(f"  {label}")

    GEOCODE_CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")

    missing = 0
    for item in items:
        if item.get("lat") is None:
            item["locality"] = item.get("destination") or item.get("dayTitle") or "Po cestě"
            missing += 1
            print(f"  NO GPS {item['file']} -> {item['locality']}")
            continue
        rec = cache.get(cache_key(item["lat"], item["lng"])) or {}
        label = rec.get("label") or item.get("destination") or "Po cestě"
        item["locality"] = label
        item["captionPlace"] = label

    selection["photos"] = [x for x in items if x["kind"] == "photo"]
    selection["clips"] = [x for x in items if x["kind"] == "video"]
    SELECTION_PATH.write_text(json.dumps(selection, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"localities set for {len(items)} items ({missing} without GPS)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
