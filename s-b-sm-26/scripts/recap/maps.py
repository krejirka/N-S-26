"""Render cinematic route-progress map cards from OSRM geometry."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import (
    AMBER,
    FONT_BOLD,
    FONT_REGULAR,
    HEIGHT,
    ITINERARY_PATH,
    MAPS_DIR,
    MUTED,
    NAVY,
    PLACES_PATH,
    ROUTES_PATH,
    SELECTION_PATH,
    WIDTH,
    WHITE,
    ensure_dirs,
)

HIGHLIGHTS = [
    ("hradec_kralove", "Hradec Králové"),
    ("baerum", "Oslo"),
    ("trondheim", "Trondheim"),
    ("furoy", "Svartisen"),
    ("myrkulla", "Myrkulla"),
    ("valkalampi", "Höga Kusten"),
    ("ales_stenar", "Ales Stenar"),
]


def downsample(points: list[list[float]], step: int = 8) -> list[tuple[float, float]]:
    if len(points) <= 2:
        return [(p[0], p[1]) for p in points]
    out = [(points[0][0], points[0][1])]
    for p in points[step::step]:
        out.append((p[0], p[1]))
    last = (points[-1][0], points[-1][1])
    if out[-1] != last:
        out.append(last)
    return out


def load_route_parts() -> tuple[list[dict], dict, dict]:
    routes = json.loads(ROUTES_PATH.read_text(encoding="utf-8"))
    places = json.loads(PLACES_PATH.read_text(encoding="utf-8"))
    itinerary = json.loads(ITINERARY_PATH.read_text(encoding="utf-8"))
    day_segments = places["daySegments"]
    segments_by_id = {s["id"]: s for s in routes["segments"]}
    parts = []
    for day in itinerary["days"]:
        ids = day.get("segmentIds") or day_segments.get(str(day["day"]), [])
        for sid in ids:
            seg = segments_by_id.get(sid)
            if not seg:
                continue
            pts = downsample(seg["geometry"], 12 if seg["kind"] == "road" else 1)
            parts.append({"day": day["day"], "geom": pts, "kind": seg["kind"], "phase": day["phase"]})
    return parts, places["places"], itinerary


def pad_limits(xs: list[float], ys: list[float], frac: float = 0.06) -> tuple:
    xmin, xmax = min(xs), max(xs)
    ymin, ymax = min(ys), max(ys)
    data_w = (xmax - xmin) or 1
    data_h = (ymax - ymin) or 1
    # Keep the route inside the map body: title bar ~150px (14%) and
    # legend ~90px (8%) would otherwise darken amber into gray.
    top_frac, bot_frac, side_frac = 0.18, 0.12, 0.06
    inner_h = 1.0 - top_frac - bot_frac
    extra_y = data_h * (1.0 / inner_h - 1.0)
    ymax += extra_y * (top_frac / (top_frac + bot_frac))
    ymin -= extra_y * (bot_frac / (top_frac + bot_frac))
    xmin -= data_w * side_frac
    xmax += data_w * side_frac
    # Equal lon/lat scale in a 16:9 frame: widen longitude, never clip NS.
    data_w = xmax - xmin
    data_h = ymax - ymin
    target = data_h * (16 / 9)
    if data_w < target:
        extra = (target - data_w) / 2
        xmin -= extra
        xmax += extra
    return xmin, xmax, ymin, ymax


def draw_map_png(
    path: Path,
    parts: list[dict],
    places: dict,
    until_day: int | None,
    title: str,
    subtitle: str,
    photo_pts: list[tuple[float, float]] | None = None,
) -> None:
    fig, ax = plt.subplots(figsize=(WIDTH / 100, HEIGHT / 100), dpi=100)
    fig.patch.set_facecolor("#0b1220")
    ax.set_facecolor("#0b1220")
    fig.subplots_adjust(left=0, right=1, top=1, bottom=0)

    all_xy = [pt for part in parts for pt in part["geom"]]
    xs = [p[0] for p in all_xy]
    ys = [p[1] for p in all_xy]
    xmin, xmax, ymin, ymax = pad_limits(xs, ys)
    ax.set_xlim(xmin, xmax)
    ax.set_ylim(ymin, ymax)
    ax.set_aspect("equal", adjustable="box")
    ax.axis("off")

    complete = until_day is None or until_day >= 18
    if not complete:
        for part in parts:
            if not part["geom"]:
                continue
            xs, ys = zip(*part["geom"])
            ax.plot(xs, ys, color="#334155", linewidth=2.4, solid_capstyle="round", zorder=1)

    for part in parts:
        if until_day is not None and part["day"] > until_day:
            continue
        if not part["geom"]:
            continue
        xs, ys = zip(*part["geom"])
        if part["kind"] == "ferry":
            ax.plot(xs, ys, color="#7dd3fc", linewidth=2.6, linestyle=(0, (6, 5)), zorder=4, solid_capstyle="round")
        else:
            ax.plot(xs, ys, color="#e8b86d", linewidth=3.4, solid_capstyle="round", zorder=3)

    if photo_pts:
        px, py = zip(*photo_pts)
        ax.scatter(px, py, s=12, c="#38bdf8", alpha=0.55, linewidths=0, zorder=5)

    for pid, label in HIGHLIGHTS:
        pl = places[pid]
        ax.scatter([pl["lng"]], [pl["lat"]], s=42, c="#f8fafc", edgecolors="#e8b86d", linewidths=1.2, zorder=6)
        ax.annotate(
            label,
            (pl["lng"], pl["lat"]),
            textcoords="offset points",
            xytext=(8, 6),
            color="#e2e8f0",
            fontsize=9,
        )

    tmp = path.with_suffix(".mpl.png")
    fig.savefig(tmp, dpi=100, facecolor=fig.get_facecolor())
    plt.close(fig)

    im = Image.open(tmp).convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(im, "RGBA")
    draw.rectangle((0, 0, WIDTH, 150), fill=(11, 18, 32, 255))
    draw.rectangle((0, HEIGHT - 90, WIDTH, HEIGHT), fill=(11, 18, 32, 255))
    bold = ImageFont.truetype(str(FONT_BOLD), 42)
    regular = ImageFont.truetype(str(FONT_REGULAR), 22)
    draw.text((72, 36), title, font=bold, fill=AMBER)
    draw.text((72, 92), subtitle, font=regular, fill=WHITE)
    legend = "oranžová = ujeto  ·  azurová = trajekt  ·  tečky = místa fotografií"
    draw.text((72, HEIGHT - 52), legend, font=regular, fill=MUTED)
    im.save(path, quality=92)
    tmp.unlink(missing_ok=True)


def main() -> int:
    ensure_dirs()
    parts, places, itinerary = load_route_parts()
    selection = json.loads(SELECTION_PATH.read_text(encoding="utf-8"))
    photos = selection["photos"]
    meta = itinerary["meta"]

    def pts_until(day: int | None) -> list[tuple[float, float]]:
        out = []
        for p in photos:
            if p.get("lng") is None:
                continue
            if day is not None and (p.get("day") or 0) > day:
                continue
            out.append((p["lng"], p["lat"]))
        return out

    cards = [
        (
            MAPS_DIR / "map_intro.png",
            None,
            "Trasa cesty",
            f"{meta['origin']} → Norsko & Švédsko → {meta['destination']}  ·  {meta['totalDays']} dní  ·  {meta['totalKmExcel']} km",
        ),
        (
            MAPS_DIR / "map_day6.png",
            6,
            "Tam na sever",
            "Hradec Králové → Oslo → Rondane → Innerdalen → Trondheim",
        ),
        (
            MAPS_DIR / "map_day9.png",
            9,
            "Helgeland a Svartisen",
            "Pobřežní silnice 17, trajekty a ledovec Engenbreen",
        ),
        (
            MAPS_DIR / "map_day14.png",
            14,
            "Laponsko — Myrkulla",
            "Čtyři dny u Arvidsjauru: jezera, rybaření, klid",
        ),
        (
            MAPS_DIR / "map_final.png",
            18,
            "Cesta zpět",
            "Höga Kusten · Vimmerby · Ales Stenar · trajekt · Hradec Králové",
        ),
    ]
    for path, until, title, subtitle in cards:
        print(f"map {path.name} until={until}")
        draw_map_png(path, parts, places, until, title, subtitle, pts_until(until if until else 18))
    print(f"Maps in {MAPS_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
