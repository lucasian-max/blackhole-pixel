# PIXEL BLACK HOLE

WebGL2 **Kerr** geodesic raytracer in a retro palette. Single-file, no build.

## Files

- `blackhole-pixel.html` — current version. 3-pass pipeline (geodesic raytrace → bloom → composite). Adds fly-through camera, film grades (INTERSTELLAR/NOIR/WARM/COLD), bloom, anamorphic letterbox, SAVE PNG (4x export).
- `blackhole-pixel-v1.html` — v1, single-pass. Kept for reference; scene physics identical to v2.

## Run

Open `blackhole-pixel.html` in any WebGL2 browser (Chrome/Edge/Firefox/Safari 15+). No server needed.

## Physics (emergent, not faked)

- Photon geodesics integrated in **Kerr spacetime** (M = 0.5, a = 0..0.998), null path with Carter constant Q
- ISCO migrates from r = 3 (a=0) to r ≈ 1.24 (a=0.998), disk to r = 12, horizon at r = M + √(M²-a²) → shadow
- Doppler beaming I ∝ D³, gravitational redshift √(1 - rs/r)², thin-disk T ∝ r^-3/4 (Novikov-Thorne)
- **Relativistic jets** from Blandford-Znajek mechanism: synchrotron emissivity along spin axis, Doppler-beamed, palette-mapped

## Controls

Drag = orbit · Scroll = zoom · DISK HEAT / DOPPLER BEAMING / TILT / DISTANCE / QUALITY / PALETTE (10) / DITHER / SCANLINES / AUTO-ORBIT / FLY-THROUGH / FILM GRADE / BLOOM / **SPIN / JET BRIGHTNESS** / SAVE PNG

---

# Session Handoff (2026-08-01)

## What's done & verified

| Asset | File | Verified |
|---|---|---|
| Theme icon: newsky | `assets/icon-newsky.png` (145B) | 45 px, all `#f5f7ff`, 0 black |
| Theme icon: save | `assets/icon-save.png` (147B) | 172 px, all `#f5f7ff`, 0 black |
| Theme icon: physics | `assets/icon-physics.png` (175B) | 56 px = 52 `#f5f7ff` orbit + 4 `#ffb000` nucleus, 0 black |
| Cursor | `assets/cursor.png` (124B) | 48 px, all `#e4e1d2`, 0 black |
| Boot sprite | `assets/boot-sheet.png` | 64×16, 4 frames, 260 opaque px, ring+arc+disk glyphs |

## What's fixed

### 1. Boot sprite — `assets/boot-sheet.png` ✅ FIXED
- Rebuilt from exact coordinates: 4 glyphs × (30 ring + 10 arc + 25 disk) = 260 opaque px
- HTML CSS bug fixed: `background-size: 64px 64px` (was 16px 16px)
- Boot animation spins correctly, 0 console errors

### 2. MCP bug discovered — `aseprite_batch_operations` (known limitation)
- `draw_pixels` and `draw_rectangle` inside a batch fail with Python TypeErrors
- Workaround: use standalone tool calls (one per op). Slower but reliable.
- Long-term fix: needs someone to patch the MCP server's batch handler for draw ops.

## Boot rebuild — exact coordinates

```python
import math
cx, cy = 8, 8
circle = [(cx+dx, cy+dy) for dy in range(-6,7) for dx in range(-6,7)
          if abs(math.hypot(dx,dy) - 6) < 0.5]  # 40 px
BASE_ARC = [(6,14),(7,14),(8,14),(9,14),(10,14),(11,13),(12,12),(12,13),(13,11),(13,12)]
def rot(p, k):
    dx, dy = p[0]-cx, p[1]-cy
    for _ in range(k%4): dx, dy = dy, -dx
    return (cx+dx, cy+dy)
# Per frame k: ring = circle minus rot(BASE_ARC, k); arc = rot(BASE_ARC, k)
# Per glyph at offset ox: draw ring px (#ff9a2e), then arc px (#f5f7ff), then disk rect (#1c1f2e, 5x5 at (6+ox,6))
# 4 glyphs x (30 ring + 10 arc + 25 disk) = 260 opaque px total
```

## How to serve

```bash
cd /Users/mridulvijay/blackhole-pixel
python3 -m http.server 9876
# Open http://localhost:9876/blackhole-pixel.html
```
(`file://` is blocked by Playwright; use HTTP. Port 9876 was free last check; 8765 is taken by LocalMCP.)

## Feature idea noted (not started)

- Relativistic jets from the black hole poles — **IMPLEMENTED** (Blandford-Znajek, SPIN + JET BRIGHTNESS controls)