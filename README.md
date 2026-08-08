# PIXEL BLACK HOLE

A WebGL2 **geodesic raytracer** of a black hole with an accretion disk, rendered in a retro 8-color palette. Single-file, zero dependencies, no build step — open it and it runs.

**Live:** https://lucasian-max.github.io/blackhole-pixel/blackhole-pixel.html

## What it is

A real-time raymarch through curved spacetime. Rays are traced backwards from the camera, bent by the hole's gravity, and accumulate light from a thin accretion disk. The disk's far side wraps around the shadow — that arc of light above and below the black disk is pure geodesic bending, not a texture trick.

## Run

Open `blackhole-pixel.html` in any WebGL2 browser (Chrome/Edge/Firefox/Safari 15+). No server, no install.

```bash
# optional local server (needed only for Playwright testing)
python3 -m http.server 9876
# → http://localhost:9876/blackhole-pixel.html
```

## Physics (emergent, not faked)

- **Null geodesics** integrated per-pixel in Schwarzschild spacetime (M = 0.5): `a = -1.5·L²·r/|r|⁵`, conserved photon angular momentum L
- **Shadow** — rays that fall inside the horizon return black; the shadow is ~2.6× wider than the horizon due to lensing
- **Accretion disk** — thin band (r = 3..12), Keplerian orbital speed, brightness ∝ r⁻³ (thin-disk falloff)
- **Doppler beaming** — I ∝ D³, D = 1/(γ(1−β·cosθ)); the approaching side of the disk is visibly brighter (DOPPLER BEAMING slider scales it)
- **Gravitational redshift** — √(1−rₛ/r) dims the inner disk
- **Procedural sky** — fbm noise + star field, seeded (NEW SKY button)

## Controls

| Control | What it does |
|---|---|
| Drag | Orbit camera |
| Scroll | Zoom (DISTANCE) |
| DISK HEAT | Inner-disk temperature → blue-white hot |
| DOPPLER BEAMING | Beaming strength (0 = off, 4 = exaggerated) |
| TILT / DISTANCE | Camera elevation / radius |
| PALETTE | 10 retro palettes (GARGANTUA, NOVA, ICE, …) |
| DITHER / SCANLINES | Ordered dithering to palette / CRT scanlines |
| AUTO-ORBIT / FLY-THROUGH | Cinematic camera paths |
| FILM GRADE | NONE / INTERSTELLAR / NOIR / WARM / COLD (+ letterbox) |
| SAVE PNG | 4× nearest-neighbor export |

## Pipeline

2-pass WebGL2: **raytrace → composite** (film grade, palette quantize, dither, scanlines, vignette, grain, letterbox). Physics renders first; the look is applied second — the simulation is unchanged underneath.

## Status

- ✅ Live on GitHub Pages (private repo, public site)
- ✅ Tagged `v1.0.0`
- ⚠️ **Jets were removed** — the project previously had relativistic jets (Blandford-Znajek, SPIN + JET BRIGHTNESS controls, commit `24c1962`). They were accidentally deleted in the boot-splash removal (`bb91f6e`). Restorable from git history.
- ⚠️ README previously claimed Kerr + bloom + quality selector — all removed; this README describes the current state.

## History

- `v1.0.0` — current: Schwarzschild raytracer, no boot splash, no bloom, quality locked at HIGH (256 steps)
- Earlier: Kerr geodesic integrator (RK4, adaptive step), relativistic jets, bloom pass, boot splash — see git log