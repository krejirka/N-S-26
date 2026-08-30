"""Download luminous Nordic-summer piano (Ola Gjeilo-like mood, CC-BY)."""

from __future__ import annotations

import json
import ssl
import sys
from pathlib import Path
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import MUSIC_DIR, ensure_dirs

# Ola Gjeilo recordings are copyrighted, so this uses CC-BY piano/strings
# in the same luminous Nordic-summer register (midsummer, clear skies, warm light).
CANDIDATES = [
    {
        "url": "https://www.scottbuckley.com.au/library/wp-content/uploads/2020/08/sb_midsommar.mp3",
        "file": "buckley-midsommar.mp3",
        "credit": "Hudba: Midsommar — Scott Buckley (CC BY 4.0, scottbuckley.com.au)",
        "insecure_ssl": True,
    },
    {
        "url": "https://www.scottbuckley.com.au/library/wp-content/uploads/2025/03/Amberlight.mp3",
        "file": "buckley-amberlight.mp3",
        "credit": "Hudba: Amberlight — Scott Buckley (CC BY 4.0, scottbuckley.com.au)",
        "insecure_ssl": True,
    },
    {
        "url": "https://www.scottbuckley.com.au/library/wp-content/uploads/2024/02/ClearSkies.mp3",
        "file": "buckley-clear-skies.mp3",
        "credit": "Hudba: Clear Skies — Scott Buckley (CC BY 4.0, scottbuckley.com.au)",
        "insecure_ssl": True,
    },
    {
        "url": "https://www.scottbuckley.com.au/library/wp-content/uploads/2022/02/Glow.mp3",
        "file": "buckley-glow.mp3",
        "credit": "Hudba: Glow — Scott Buckley (CC BY 4.0, scottbuckley.com.au)",
        "insecure_ssl": True,
    },
    {
        "url": "https://www.scottbuckley.com.au/library/wp-content/uploads/2023/07/Effervescence.mp3",
        "file": "buckley-effervescence.mp3",
        "credit": "Hudba: Effervescence — Scott Buckley (CC BY 4.0, scottbuckley.com.au)",
        "insecure_ssl": True,
    },
]


def download(url: str, dest: Path, insecure: bool = False) -> bool:
    try:
        ctx = ssl._create_unverified_context() if insecure else ssl.create_default_context()
        req = Request(url, headers={"User-Agent": "Mozilla/5.0 ns26-recap/1.0"})
        with urlopen(req, timeout=60, context=ctx) as resp:
            data = resp.read()
        if len(data) < 40_000:
            print(f"  too small ({len(data)} bytes)")
            return False
        dest.write_bytes(data)
        return True
    except Exception as exc:
        print(f"  fail {url}: {exc}")
        return False


def main() -> int:
    ensure_dirs()
    meta_path = MUSIC_DIR / "credit.json"
    got = []
    seen = set()
    for cand in CANDIDATES:
        dest = MUSIC_DIR / cand["file"]
        if dest.exists() and dest.stat().st_size > 40_000:
            print(f"have {dest.name}")
            if dest.name not in seen:
                got.append({**cand, "path": str(dest)})
                seen.add(dest.name)
            if len(got) >= 4:
                break
            continue
        print(f"get {cand['file']}")
        if download(cand["url"], dest, cand.get("insecure_ssl", False)):
            print(f"  ok {dest.stat().st_size} bytes")
            if dest.name not in seen:
                got.append({**cand, "path": str(dest)})
                seen.add(dest.name)
        if len(got) >= 4:
            break
    if not got:
        raise SystemExit("Could not download any background music")
    meta_path.write_text(json.dumps({"tracks": got}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Music credit file {meta_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
