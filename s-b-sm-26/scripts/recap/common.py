"""Shared paths and helpers for the NS26 recap pipeline."""

from __future__ import annotations

import math
import re
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
PHOTO_DIR = Path(r"C:\Users\jkrenek\Downloads\ns26\2026 Norsko-Svedsko")
OUT_DIR = Path(r"C:\Users\jkrenek\Downloads\ns26\recap")
WORK_DIR = OUT_DIR / "work"
FRAMES_DIR = WORK_DIR / "frames"
CLIPS_DIR = WORK_DIR / "clips"
MAPS_DIR = WORK_DIR / "maps"

ITINERARY_PATH = REPO_ROOT / "src" / "data" / "itinerary.json"
PLACES_PATH = REPO_ROOT / "src" / "data" / "places.json"
ROUTES_PATH = REPO_ROOT / "src" / "data" / "routes.json"

CATALOG_PATH = OUT_DIR / "catalog.json"
SELECTION_PATH = OUT_DIR / "selection.json"
PREVIEW_PATH = OUT_DIR / "preview.html"
STORYBOARD_PATH = OUT_DIR / "storyboard.json"
VIDEO_PATH = OUT_DIR / "Norsko-Svedsko-2026.mp4"
MUSIC_DIR = OUT_DIR / "music"

WIDTH, HEIGHT = 1920, 1080
FPS = 30

FONT_REGULAR = Path(r"C:\Windows\Fonts\segoeui.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\segoeuib.ttf")
FONT_LIGHT = Path(r"C:\Windows\Fonts\segoeuil.ttf")

NAVY = (11, 18, 32)
NAVY_SOFT = (18, 28, 48)
AMBER = (232, 184, 109)
WHITE = (245, 247, 250)
MUTED = (176, 190, 210)

# Sparse days: take every usable still.
SPARSE_DAYS = {5, 10, 11, 14, 16}

DAY_QUOTAS = {
    1: 5,
    2: 6,
    3: 6,
    4: 8,
    5: 99,
    6: 6,
    7: 5,
    8: 6,
    9: 10,
    10: 99,
    11: 3,
    12: 4,
    13: 2,
    14: 99,
    15: 6,
    16: 99,
    17: 6,
    18: 4,
}

MAP_AFTER_DAYS = {6, 9, 14}

# Always drop these files / time clusters from the recap.
BAN_FILES = {
    "20260726_104937.jpg",
    "20260730_194956.jpg",
    "20260803_184730.jpg",
    "20260804_120414.jpg",
    "20260804_120414(0).jpg",
    "20260805_175357(0).jpg",
    "20260805_175357.jpg",
    "20260808_220409.jpg",
    "20260811_142516.jpg",
    "20260811_142517.jpg",
    "20260811_142526.jpg",
    "20260811_142538.jpg",
    "20260731_173958.jpg",
}
BAN_PREFIXES = (
    "20260726_1049",  # windshield washer burst
)
FORCE_INCLUDE = [
    "20260726_134757.jpg",  # Haga, Göteborg
    "20260730_200616.jpg",  # campsite + water, no ladder
    "20260731_112523.jpg",  # fishing at the pier (with the videos)
    "20260731_174640.jpg",  # full person with the dog
]

VIDEO_PICKS = [
    {"file": "20260726_121305.mp4", "day": 2, "start": 4.0, "duration": 8.0, "label": "Cesta do Osla"},
    {"file": "20260728_161214.mp4", "day": 4, "start": 6.0, "duration": 8.0, "label": "NP Rondane"},
    {"file": "20260731_112355.mp4", "day": 7, "start": 0.0, "duration": None, "label": "Rybaření u mola"},
    {"file": "20260731_112448.mp4", "day": 7, "start": 0.0, "duration": None, "label": "Rybaření u mola"},
]

PHOTO_BOX_H = 860
CAPTION_H = HEIGHT - PHOTO_BOX_H
GEOCODE_CACHE = OUT_DIR / "geocode_cache.json"


def ensure_dirs() -> None:
    for p in (OUT_DIR, WORK_DIR, FRAMES_DIR, CLIPS_DIR, MAPS_DIR, MUSIC_DIR):
        p.mkdir(parents=True, exist_ok=True)


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def parse_exif_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in ("%Y:%m:%d %H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value.strip(), fmt)
        except ValueError:
            continue
    return None


def czech_date(dt: datetime) -> str:
    return f"{dt.day}. {dt.month}. {dt.year}"


def first_sentences(text: str, max_chars: int = 210) -> str:
    chunk = (text or "").strip().split("\n\n")[0]
    chunk = re.sub(r"\s+", " ", chunk).strip()
    if len(chunk) <= max_chars:
        return chunk
    cut = chunk[: max_chars + 1]
    if " " in cut:
        cut = cut.rsplit(" ", 1)[0]
    return cut.rstrip(".,;:") + "…"


def wrap_text(text: str, font, max_width: int) -> list[str]:
    words = text.split()
    if not words:
        return []
    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        trial = f"{current} {word}"
        if font.getlength(trial) <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines
