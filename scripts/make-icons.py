#!/usr/bin/env python3
"""Generate LocalLoop PWA icons with the standard library only (no Pillow).

Draws the app mark: a warm clay tile with the white "local loop" ring.
Run:  python3 scripts/make-icons.py
"""

import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
CLAY = (196, 85, 43)
CREAM = (251, 247, 241)


def png(width: int, height: int, pixels: bytes) -> bytes:
    def chunk(tag: bytes, data: bytes) -> bytes:
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    raw = b"".join(b"\x00" + pixels[y * width * 3 : (y + 1) * width * 3] for y in range(height))
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def render(size: int, inset: float) -> bytes:
    """inset: fraction of the canvas kept clear around the mark (maskable safe zone)."""
    cx = cy = size / 2
    outer = size * (0.5 - inset)
    ring = outer * 0.82
    dot = outer * 0.34
    px = bytearray()
    for y in range(size):
        for x in range(size):
            d = ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2) ** 0.5
            if inset > 0:
                colour = CLAY  # full-bleed background for maskable icons
            else:
                colour = CLAY if d <= outer else CREAM
            if dot <= d <= ring * 0.78 or d <= dot * 0.55:
                colour = CREAM if inset > 0 else CREAM
            px.extend(colour)
    return png(size, size, bytes(px))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "icon-192.png").write_bytes(render(192, 0.06))
    (OUT / "icon-512.png").write_bytes(render(512, 0.06))
    (OUT / "icon-maskable-512.png").write_bytes(render(512, 0.18))
    (OUT / "apple-touch-icon.png").write_bytes(render(180, 0.06))
    for f in sorted(OUT.iterdir()):
        print(f"{f.name}: {f.stat().st_size} bytes")


if __name__ == "__main__":
    main()