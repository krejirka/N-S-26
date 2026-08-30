"""Build the Norsko–Švédsko 2026 recap video."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import catalog
import frames
import geocode
import maps
import music
import render
import select_photos


def main() -> int:
    catalog.main()
    select_photos.main()
    geocode.main()
    maps.main()
    frames.main()
    import json
    from common import ITINERARY_PATH, MUSIC_DIR
    from frames import outro_card

    itinerary = json.loads(ITINERARY_PATH.read_text(encoding="utf-8"))
    credit = "Hudba: norská lidová / Edvard Grieg"
    credit_path = MUSIC_DIR / "credit.json"
    if credit_path.exists():
        tracks = json.loads(credit_path.read_text(encoding="utf-8"))["tracks"]
        credit = "  ·  ".join(t["credit"] for t in tracks[:3])
    outro_card(itinerary["meta"], credit)
    render.main()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
