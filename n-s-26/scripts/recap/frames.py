"""Compose title, day, photo and outro frames with Czech captions."""

from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import (
    AMBER,
    CAPTION_H,
    FONT_BOLD,
    FONT_LIGHT,
    FONT_REGULAR,
    FRAMES_DIR,
    HEIGHT,
    ITINERARY_PATH,
    MUTED,
    NAVY,
    PHOTO_BOX_H,
    SELECTION_PATH,
    WHITE,
    WIDTH,
    czech_date,
    ensure_dirs,
    first_sentences,
    parse_exif_dt,
    wrap_text,
)

WEEKDAYS = {
    "sobota": "sobota",
    "neděle": "neděle",
    "pondělí": "pondělí",
    "úterý": "úterý",
    "středa": "středa",
    "čtvrtek": "čtvrtek",
    "pátek": "pátek",
}


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(str(path), size)
    except OSError:
        return ImageFont.truetype(str(FONT_REGULAR), size)


def navy_bg() -> Image.Image:
    im = Image.new("RGB", (WIDTH, HEIGHT), NAVY)
    draw = ImageDraw.Draw(im)
    draw.rectangle((0, 0, 18, HEIGHT), fill=AMBER)
    return im


def contain_in_box(src: Image.Image, box_w: int, box_h: int) -> Image.Image:
    """Fit the whole photo inside a box (letterbox), never crop."""
    src = ImageOps.exif_transpose(src).convert("RGB")
    scale = min(box_w / src.width, box_h / src.height)
    nw, nh = max(1, int(src.width * scale + 0.5)), max(1, int(src.height * scale + 0.5))
    src = src.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (box_w, box_h), NAVY)
    canvas.paste(src, ((box_w - nw) // 2, (box_h - nh) // 2))
    return canvas


def draw_caption_bar(im: Image.Image, locality: str, meta: str) -> None:
    draw = ImageDraw.Draw(im)
    top = HEIGHT - CAPTION_H
    draw.rectangle((0, top, WIDTH, HEIGHT), fill=NAVY)
    draw.rectangle((0, top, 18, HEIGHT), fill=AMBER)
    f_title = font(FONT_BOLD, 40)
    lines = wrap_text(locality, f_title, WIDTH - 140)[:2]
    y = top + 28
    for line in lines:
        draw.text((64, y), line, font=f_title, fill=WHITE)
        y += 48
    if meta:
        draw.text((64, HEIGHT - 48), meta, font=font(FONT_REGULAR, 22), fill=MUTED)


def gradient_bar(im: Image.Image, top: int) -> None:
    overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for y in range(top, HEIGHT):
        t = (y - top) / max(1, HEIGHT - top)
        alpha = int(40 + 200 * t)
        draw.line((0, y, WIDTH, y), fill=(8, 12, 22, alpha))
    im.paste(Image.alpha_composite(im.convert("RGBA"), overlay).convert("RGB"))


def save(im: Image.Image, path: Path) -> Path:
    im.save(path, quality=93, optimize=True)
    return path


def title_card(meta: dict, days: list[dict]) -> Path:
    im = navy_bg()
    draw = ImageDraw.Draw(im)
    first = datetime.fromisoformat(days[0]["date"])
    last = datetime.fromisoformat(days[-1]["date"])
    draw.text((80, 220), "CESTA", font=font(FONT_LIGHT, 28), fill=AMBER)
    draw.text((80, 270), meta["title"], font=font(FONT_BOLD, 78), fill=WHITE)
    line = f"{meta['totalDays']} dní  ·  {meta['totalKmExcel']:,} km".replace(",", " ")
    draw.text((80, 380), line, font=font(FONT_REGULAR, 36), fill=AMBER)
    route = "Hradec Králové  →  Oslo  →  Trondheim  →  Svartisen  →  Myrkulla  →  Höga Kusten  →  Hradec Králové"
    f_reg = font(FONT_REGULAR, 26)
    y = 480
    for wrapped in wrap_text(route, f_reg, WIDTH - 160):
        draw.text((80, y), wrapped, font=f_reg, fill=MUTED)
        y += 38
    dates = f"{czech_date(first)}  –  {czech_date(last)}"
    draw.text((80, 860), dates, font=font(FONT_REGULAR, 28), fill=WHITE)
    draw.text((80, 910), "fotografie z cesty  ·  trasa z cestovatelského portálu", font=font(FONT_REGULAR, 20), fill=MUTED)
    return save(im, FRAMES_DIR / "title.jpg")


def outro_card(meta: dict, music_credit: str) -> Path:
    im = navy_bg()
    draw = ImageDraw.Draw(im)
    draw.text((80, 180), "Na shledanou u další cesty", font=font(FONT_BOLD, 52), fill=WHITE)
    draw.text((80, 270), meta["title"], font=font(FONT_REGULAR, 32), fill=AMBER)
    highlights = "  ·  ".join(meta["highlights"])
    f_reg = font(FONT_REGULAR, 28)
    y = 380
    for line in wrap_text(highlights, f_reg, WIDTH - 160):
        draw.text((80, y), line, font=f_reg, fill=WHITE)
        y += 42
    stats = f"{meta['totalDays']} dní   ·   {meta['totalKmExcel']:,} km   ·   {meta['origin']} a zpět".replace(",", " ")
    draw.text((80, 620), stats, font=font(FONT_REGULAR, 26), fill=MUTED)
    draw.text((80, 860), music_credit, font=font(FONT_REGULAR, 20), fill=MUTED)
    draw.text((80, 900), "Mapa: OpenStreetMap / OSRM  ·  popisy z itineráře cesty", font=font(FONT_REGULAR, 18), fill=MUTED)
    return save(im, FRAMES_DIR / "outro.jpg")


def day_card(day: dict) -> Path:
    im = navy_bg()
    draw = ImageDraw.Draw(im)
    dt = datetime.fromisoformat(day["date"])
    draw.text((80, 160), f"DEN {day['day']}", font=font(FONT_LIGHT, 28), fill=AMBER)
    draw.text((80, 210), f"{day['weekday']}  {czech_date(dt)}", font=font(FONT_REGULAR, 28), fill=MUTED)
    dest = day["destination"]
    f_title = font(FONT_BOLD, 58)
    y = 280
    for line in wrap_text(dest, f_title, WIDTH - 160):
        draw.text((80, y), line, font=f_title, fill=WHITE)
        y += 70
    bits = []
    if day.get("km"):
        bits.append(f"{day['km']:.0f} km")
    if day.get("lodging"):
        bits.append(str(day["lodging"]))
    if day.get("phase") == "tam":
        bits.append("cesta tam")
    elif day.get("phase") == "zpět":
        bits.append("cesta zpět")
    draw.text((80, y + 10), "  ·  ".join(bits), font=font(FONT_REGULAR, 26), fill=AMBER)
    program = first_sentences(day["program"], 280)
    f_body = font(FONT_REGULAR, 28)
    y = y + 90
    for line in wrap_text(program, f_body, WIDTH - 200):
        draw.text((80, y), line, font=f_body, fill=MUTED)
        y += 40
        if y > 900:
            break
    return save(im, FRAMES_DIR / f"day_{day['day']:02d}.jpg")


def photo_frame(photo: dict, day: dict | None, index: int) -> Path:
    with Image.open(photo["path"]) as src:
        box = contain_in_box(src, WIDTH, PHOTO_BOX_H)
    box = ImageEnhance.Contrast(box).enhance(1.04)
    box = ImageEnhance.Color(box).enhance(1.03)
    im = Image.new("RGB", (WIDTH, HEIGHT), NAVY)
    im.paste(box, (0, 0))
    dt = parse_exif_dt(photo.get("datetime"))
    locality = (photo.get("locality") or photo.get("captionPlace") or (day or {}).get("destination") or "Po cestě").strip()
    if day:
        meta = f"{day['weekday']} {czech_date(dt) if dt else day['date']}"
    elif dt:
        meta = czech_date(dt)
    else:
        meta = ""
    if dt:
        meta = f"{meta}  ·  {dt.strftime('%H:%M')}".strip(" ·")
    draw_caption_bar(im, locality, meta)
    out = FRAMES_DIR / f"photo_{index:03d}_{Path(photo['file']).stem}.jpg"
    return save(im, out)


def video_overlay_png(day: dict | None, label: str, path: Path, locality: str | None = None) -> Path:
    """Opaque caption bar; video is letterboxed into the area above it."""
    im = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    top = HEIGHT - CAPTION_H
    draw.rectangle((0, top, WIDTH, HEIGHT), fill=NAVY + (255,))
    draw.rectangle((0, top, 18, HEIGHT), fill=AMBER + (255,))
    title = (locality or label or "Video").strip()
    f_title = font(FONT_BOLD, 40)
    y = top + 28
    for line in wrap_text(title, f_title, WIDTH - 140)[:2]:
        draw.text((64, y), line, font=f_title, fill=WHITE + (255,))
        y += 48
    meta = ""
    if day:
        dt = datetime.fromisoformat(day["date"])
        meta = f"{day['weekday']} {czech_date(dt)}"
    draw.text((64, HEIGHT - 48), meta or label, font=font(FONT_REGULAR, 22), fill=MUTED + (255,))
    im.save(path)
    return path


def write_preview(photos: list[dict], days: dict) -> None:
    from common import PREVIEW_PATH

    cards = []
    for p in photos:
        d = days.get(p.get("day")) or {}
        loc = p.get("locality") or d.get("destination") or ""
        cards.append(
            f'<figure><img src="file:///{p["path"].replace("\\", "/")}" alt=""><figcaption>{loc}<br>{p["file"]}</figcaption></figure>'
        )
    html = f"""<!doctype html><meta charset="utf-8"><title>NS26 výběr</title>
<style>
body{{margin:0;background:#0b1220;color:#e2e8f0;font-family:Segoe UI,sans-serif}}
h1{{padding:24px 32px 8px}} p{{padding:0 32px;color:#94a3b8}}
main{{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;padding:24px}}
figure{{margin:0;background:#111827;border-radius:12px;overflow:hidden}}
img{{width:100%;height:180px;object-fit:cover;display:block}}
figcaption{{padding:10px 12px;font-size:13px;line-height:1.4}}
</style>
<h1>Výběr fotek — Norsko–Švédsko 2026</h1>
<p>{len(photos)} snímků pro video recenzi</p>
<main>{''.join(cards)}</main>"""
    PREVIEW_PATH.write_text(html, encoding="utf-8")


def main() -> int:
    ensure_dirs()
    itinerary = json.loads(ITINERARY_PATH.read_text(encoding="utf-8"))
    selection = json.loads(SELECTION_PATH.read_text(encoding="utf-8"))
    days = {d["day"]: d for d in itinerary["days"]}
    print("title + outro + day cards")
    title_card(itinerary["meta"], itinerary["days"])
    credit = "Hudba: Midsommar, Amberlight a Clear Skies — Scott Buckley (CC BY 4.0)"
    credit_path = Path(r"C:\Users\jkrenek\Downloads\ns26\recap\music\credit.json")
    if credit_path.exists():
        tracks = json.loads(credit_path.read_text(encoding="utf-8")).get("tracks", [])
        if tracks:
            credit = "  ·  ".join(t["credit"] for t in tracks[:2])
    outro_card(itinerary["meta"], credit)
    for day in itinerary["days"]:
        day_card(day)
    print("photo overlays")
    for i, photo in enumerate(selection["photos"], 1):
        photo_frame(photo, days.get(photo.get("day")), i)
        if i % 15 == 0:
            print(f"  {i}/{len(selection['photos'])}")
    write_preview(selection["photos"], days)
    print(f"Frames in {FRAMES_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
