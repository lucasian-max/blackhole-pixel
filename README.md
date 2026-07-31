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
