"""Ken Burns slideshow + map cards + music via ffmpeg."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import (
    CAPTION_H,
    CLIPS_DIR,
    FRAMES_DIR,
    FPS,
    HEIGHT,
    ITINERARY_PATH,
    MAP_AFTER_DAYS,
    MAPS_DIR,
    MUSIC_DIR,
    PHOTO_BOX_H,
    SELECTION_PATH,
    STORYBOARD_PATH,
    VIDEO_PATH,
    WIDTH,
    WORK_DIR,
    ensure_dirs,
)
from frames import video_overlay_png

PHOTO_SEC = 3.1
DAY_SEC = 3.4
TITLE_SEC = 7.5
MAP_INTRO_SEC = 8.0
MAP_SEC = 6.0
OUTRO_SEC = 8.0
CLIP_SEC = 8.0
FADE_CARD = 0.12
FADE_PHOTO = 0.0


def find_ffmpeg() -> tuple[str, str]:
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    extras = [
        Path(r"C:\ffmpeg\bin"),
        Path(r"C:\Program Files\ffmpeg\bin"),
        Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Links",
        Path(os.environ.get("LOCALAPPDATA", ""))
        / "Microsoft"
        / "WinGet"
        / "Packages"
        / "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
        / "ffmpeg-9.0-full_build"
        / "bin",
        Path(r"C:\Program Files\WinGet\Packages"),
    ]
    if not ffmpeg:
        for base in extras:
            if not base.exists():
                continue
            hits = list(base.rglob("ffmpeg.exe")) if base.name == "Packages" else [base / "ffmpeg.exe"]
            for hit in hits:
                if hit.exists():
                    ffmpeg = str(hit)
                    ffprobe = str(hit.with_name("ffprobe.exe"))
                    break
            if ffmpeg:
                break
    if not ffmpeg:
        raise SystemExit("ffmpeg not found — install Gyan.FFmpeg or add ffmpeg to PATH")
    return ffmpeg, ffprobe or "ffprobe"


def run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    if result.returncode != 0:
        err = result.stderr.decode("utf-8", errors="replace")[-2500:]
        print(err)
        raise subprocess.CalledProcessError(result.returncode, cmd, stderr=result.stderr)


def still_clip(ffmpeg: str, image: Path, out: Path, seconds: float, fade: float) -> None:
    fades = ""
    if fade > 0:
        fades = f"fade=t=in:st=0:d={fade},fade=t=out:st={seconds - fade}:d={fade},"
    vf = f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease,pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=0x0b1220,{fades}format=yuv420p"
    run(
        [
            ffmpeg, "-y", "-loglevel", "error",
            "-loop", "1", "-i", str(image),
            "-vf", vf, "-t", f"{seconds:.2f}", "-r", str(FPS),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-an", str(out),
        ]
    )


def probe_duration(ffprobe: str, path: Path) -> float:
    result = subprocess.run(
        [
            ffprobe, "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nw=1:nk=1", str(path),
        ],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())


def video_clip(ffmpeg: str, src: Path, overlay: Path, out: Path, start: float, duration: float) -> None:
    # Letterbox the whole frame into the photo box; caption bar sits below and never fades.
    vf = (
        f"[0:v]scale={WIDTH}:{PHOTO_BOX_H}:force_original_aspect_ratio=decrease,"
        f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:({PHOTO_BOX_H}-ih)/2:color=0x0b1220[v];"
        f"[1:v]format=rgba[ov];[v][ov]overlay=0:0,format=yuv420p"
    )
    run(
        [
            ffmpeg, "-y", "-loglevel", "error",
            "-ss", f"{start:.2f}", "-t", f"{duration:.2f}",
            "-i", str(src), "-i", str(overlay),
            "-filter_complex", vf,
            "-r", str(FPS),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-an", str(out),
        ]
    )


def concat(ffmpeg: str, clips: list[Path], out: Path) -> None:
    lst = WORK_DIR / "concat.txt"
    lines = []
    for c in clips:
        p = c.resolve().as_posix().replace("'", r"'\''")
        lines.append(f"file '{p}'")
    lst.write_text("\n".join(lines) + "\n", encoding="utf-8")
    run(
        [
            ffmpeg, "-y", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(lst),
            "-c", "copy", str(out),
        ]
    )


def mix_music(ffmpeg: str, ffprobe: str, video: Path, tracks: list[Path], out: Path) -> None:
    wavs = []
    for i, track in enumerate(tracks):
        wav = WORK_DIR / f"music_{i}.wav"
        run(
            [
                ffmpeg, "-y", "-loglevel", "error",
                "-i", str(track), "-ac", "2", "-ar", "48000", str(wav),
            ]
        )
        wavs.append(wav)
    lst = WORK_DIR / "music.txt"
    files = wavs * 8
    lst.write_text("\n".join(f"file '{p.resolve().as_posix()}'" for p in files) + "\n", encoding="utf-8")
    music_concat = WORK_DIR / "music_loop.wav"
    run(
        [
            ffmpeg, "-y", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(lst),
            "-c", "copy", str(music_concat),
        ]
    )
    duration = probe_duration(ffprobe, video)
    fade_out_start = max(0.5, duration - 4.0)
    run(
        [
            ffmpeg, "-y", "-loglevel", "error",
            "-i", str(video), "-i", str(music_concat),
            "-filter_complex",
            f"[1:a]volume=0.22,afade=t=in:st=0:d=2.5,afade=t=out:st={fade_out_start:.2f}:d=4[a]",
            "-map", "0:v", "-map", "[a]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
            "-shortest", str(out),
        ]
    )


def build_storyboard(itinerary: dict, selection: dict) -> list[dict]:
    photos = selection["photos"]
    clips = {c["file"]: c for c in selection.get("clips", [])}
    photo_idx = {p["file"]: i for i, p in enumerate(photos, 1)}
    timeline = selection.get("timeline")
    if not timeline:
        timeline = [{"kind": "photo", "file": p["file"]} for p in photos]
        timeline += [{"kind": "video", "file": c["file"]} for c in selection.get("clips", [])]
        timeline.sort(key=lambda e: e["file"])

    def day_of(entry: dict) -> int:
        if entry["kind"] == "photo":
            rec = next((p for p in photos if p["file"] == entry["file"]), None)
            return int(rec.get("day") or 0) if rec else 0
        rec = clips.get(entry["file"]) or {}
        return int(rec.get("day") or 0)

    board: list[dict] = [
        {"kind": "still", "file": "title.jpg", "seconds": TITLE_SEC, "ken": False},
        {"kind": "map", "file": str(MAPS_DIR / "map_intro.png"), "seconds": MAP_INTRO_SEC},
    ]
    map_names = {6: "map_day6.png", 9: "map_day9.png", 14: "map_day14.png"}
    for i, entry in enumerate(timeline):
        if entry["kind"] == "photo":
            n = photo_idx[entry["file"]]
            stem = Path(entry["file"]).stem
            board.append(
                {
                    "kind": "photo",
                    "file": f"photo_{n:03d}_{stem}.jpg",
                    "seconds": PHOTO_SEC,
                    "ken": False,
                }
            )
        else:
            clip = clips[entry["file"]]
            board.append({"kind": "video", "clip": clip, "seconds": clip.get("duration")})
        nxt = day_of(timeline[i + 1]) if i + 1 < len(timeline) else 99
        cur = day_of(entry)
        for md in sorted(MAP_AFTER_DAYS):
            if cur <= md < nxt:
                board.append({"kind": "map", "file": str(MAPS_DIR / map_names[md]), "seconds": MAP_SEC})
    board.append({"kind": "map", "file": str(MAPS_DIR / "map_final.png"), "seconds": MAP_SEC})
    board.append({"kind": "still", "file": "outro.jpg", "seconds": OUTRO_SEC, "ken": False})
    return board


def encode_scene(ffmpeg: str, ffprobe: str, i: int, scene: dict, days: dict) -> tuple[int, Path]:
    out = CLIPS_DIR / f"{i:03d}.mp4"
    if scene["kind"] in ("still", "photo"):
        img = FRAMES_DIR / scene["file"]
        fade = FADE_PHOTO if scene["kind"] == "photo" else FADE_CARD
        still_clip(ffmpeg, img, out, scene["seconds"], fade)
    elif scene["kind"] == "map":
        still_clip(ffmpeg, Path(scene["file"]), out, scene["seconds"], FADE_CARD)
    elif scene["kind"] == "video":
        clip = scene["clip"]
        src = Path(clip["path"])
        start = float(clip.get("start") or 0)
        duration = clip.get("duration")
        if duration is None:
            duration = max(0.8, probe_duration(ffprobe, src) - start)
        overlay = WORK_DIR / f"ov_{i:03d}.png"
        video_overlay_png(days.get(clip.get("day")), clip.get("label") or "Video", overlay, clip.get("locality"))
        video_clip(ffmpeg, src, overlay, out, start, float(duration))
    else:
        raise ValueError(scene["kind"])
    return i, out


def main() -> int:
    ensure_dirs()
    ffmpeg, ffprobe = find_ffmpeg()
    print("ffmpeg", ffmpeg)
    itinerary = json.loads(ITINERARY_PATH.read_text(encoding="utf-8"))
    selection = json.loads(SELECTION_PATH.read_text(encoding="utf-8"))
    days = {d["day"]: d for d in itinerary["days"]}
    board = build_storyboard(itinerary, selection)
    STORYBOARD_PATH.write_text(json.dumps(board, ensure_ascii=False, indent=2), encoding="utf-8")

    clips: list[Path | None] = [None] * len(board)
    done = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = [pool.submit(encode_scene, ffmpeg, ffprobe, i, scene, days) for i, scene in enumerate(board)]
        for fut in as_completed(futs):
            i, out = fut.result()
            clips[i] = out
            done += 1
            if done % 10 == 0 or done == len(board):
                print(f"encoded {done}/{len(board)}")

    silent = WORK_DIR / "silent.mp4"
    concat(ffmpeg, [p for p in clips if p], silent)

    tracks_meta = json.loads((MUSIC_DIR / "credit.json").read_text(encoding="utf-8"))
    tracks = [Path(t["path"]) for t in tracks_meta["tracks"]]
    mix_music(ffmpeg, ffprobe, silent, tracks, VIDEO_PATH)
    print(f"Done -> {VIDEO_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
