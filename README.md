# PIXEL BLACK HOLE

WebGL2 Schwarzschild geodesic raytracer in a retro palette. Single-file, no build.

## Files

- `blackhole-pixel.html` — current version. 3-pass pipeline (geodesic raytrace → bloom → composite). Adds fly-through camera, film grades (INTERSTELLAR/NOIR/WARM/COLD), bloom, anamorphic letterbox, SAVE PNG (4x export).
- `blackhole-pixel-v1.html` — v1, single-pass. Kept for reference; scene physics identical to v2.

## Run

Open `blackhole-pixel.html` in any WebGL2 browser (Chrome/Edge/Firefox/Safari 15+). No server needed.

## Physics (emergent, not faked)

- Photon geodesics integrated in Schwarzschild spacetime (M = 0.5), null path with a = -1.5·L²·r/|r|⁵
- ISCO at r = 3, disk to r = 12, horizon at r = 1 → shadow
- Doppler beaming I ∝ D³, gravitational redshift √(1 - rs/r), thin-disk T ∝ r^-3/4 coloring

## Controls

Drag = orbit · Scroll = zoom · DISK HEAT / DOPPLER BEAMING / TILT / DISTANCE / QUALITY / PALETTE (4) / DITHER / SCANLINES / AUTO-ORBIT / FLY-THROUGH / FILM GRADE / BLOOM / SAVE PNG

---

# Session Handoff (2026-08-01)

## What's done & verified

| Asset | File | Verified |
|---|---|---|
| Theme icon: newsky | `assets/icon-newsky.png` (145B) | 45 px, all `#f5f7ff`, 0 black |
| Theme icon: save | `assets/icon-save.png` (147B) | 172 px, all `#f5f7ff`, 0 black |
| Theme icon: physics | `assets/icon-physics.png` (175B) | 56 px = 52 `#f5f7ff` orbit + 4 `#ffb000` nucleus, 0 black |
| Cursor | `assets/cursor.png` (124B) | 48 px, all `#e4e1d2`, 0 black |

## What's broken

### 1. Boot sprite — `assets/boot.aseprite` + `assets/boot-sheet.png`
- **Current state:** `boot.aseprite` was overwritten with a fresh 64×16 canvas, then has **5 stray test pixels** from MCP-bug debugging: 2 amber `#ff9a2e` at (8,8) and (9,8); 3 dark `#1c1f2e` at (10,8), (11,8), (12,8), (13,8). `boot-sheet.png` is still the old broken export (138B, 84 dark px, zero ring/arc).
- **Intended design:** single 64×16 frame, 4 glyphs at x-offsets 0/16/32/48. Each glyph = 5×5 disk `#1c1f2e` at local (6,6) + 30-px ring `#ff9a2e` (circle r=6, 40 px minus 10 arc) + 10-px arc `#f5f7ff` rotating CW 90° per frame (bottom → right → top → left).
- **Coordinates (regenerated, ready to use):** see Python snippet below.

### 2. HTML CSS bug — `blackhole-pixel.html` line 75
```css
#boot::after{...background:url('assets/boot-sheet.png') no-repeat 0 0;background-size:16px 16px;...}
```
`background-size:16px 16px` is wrong for a 64×16 sheet. Must be `background-size:64px 64px` (4× upscale to 64×64 display, with the existing `-16px` background-position steps).

### 3. MCP bug discovered — `aseprite_batch_operations`
- **Symptom:** `draw_pixels` and `draw_rectangle` inside a batch fail with Python TypeErrors:
  - `draw_pixels` → `"string indices must be integers, not 'str'"`
  - `draw_rectangle` → `"unsupported operand type(s) for -: 'str' and 'int'"`
- **Works:** standalone `draw_pixels`/`draw_rectangle`, and `batch_operations` for `create_canvas` + `save_as`.
- **Workaround:** use standalone tool calls (one per op). Slower but reliable.
- **Long-term fix:** needs someone to patch the MCP server's batch handler for draw ops.

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

## Cleanup needed before close

- [ ] Remove stray pixels from `assets/boot.aseprite` (or just delete it — it's broken anyway)
- [ ] Delete leftover: `boot-sheet1.png`, `boot-sheet2.png`, `boot-f1.png`-`boot-f4.png`, `test-rects.aseprite`, `drawtest.aseprite`/`.png`, `amber-reexport.png`
- [ ] Rebuild `boot.aseprite` + `boot-sheet.png` (see coordinates above)
- [ ] Fix HTML line 75 `background-size`
- [ ] Browser regression: boot spins, icons render, 0 console errors
- [ ] Update `docs/aseprite-usecases.md` (#4 boot = in-progress, #5 cursor = done)

## Feature idea noted (not started)

- Relativistic jets from the black hole poles — user requested, deferred.
