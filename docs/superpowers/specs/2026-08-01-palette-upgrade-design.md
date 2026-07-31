# Design: 8-Color Palette Upgrade

**Date:** 2026-08-01
**Project:** blackhole-pixel
**Status:** Approved (user: "great go ahead", themes confirmed; git init requested)

## Problem

The simulator quantizes every pixel through a 6-color palette ramp. Some
existing palettes (VAPORWAVE) are not clean luminance ramps, so ordered
dithering between non-adjacent brightness colors produces noise instead of
texture. Ramp resolution (6 steps) also causes visible banding on the disk.

## Goal

All palettes become proper 8-color luminance ramps. 4 existing themes rebuilt
+ 6 new themes = 10 palettes total. Palettes designed and validated with the
Aseprite MCP (harmony analysis + visual swatch-strip inspection).

## 1. Ramp architecture

Every palette is an 8-color ramp with strict roles:

| Index | Role |
|-------|------|
| 0 | space black / deepest shadow |
| 1 | sky tint (fbm nebula) |
| 2 | shadow ember / cool edge |
| 3 | cool disk mid |
| 4 | warm disk mid |
| 5 | hot glow |
| 6 | white-hot inner edge |
| 7 | pure white (stars, hottest core) |

Invariant: luminance strictly increases 0 -> 7. Hue drifts toward
white-hot at the inner edge (real accretion disk behavior).

## 2. Theme list (10 total)

Rebuilt to 8-color ramps: GARGANTUA, VAPORWAVE, TERMINAL, AMBER.
New 8-color themes: ICE, NOVA, SUNSET, BLOOD, TOXIC, MONO.

## 3. Code changes

Files: `blackhole-pixel.html` only.

1. `FRAG_SCENE`: `uniform vec3 u_palette[6]` -> `[8]` (sky uses index 1 only)
2. `FRAG_FINAL`: `uniform vec3 u_palette[6]` -> `[8]`; quantize loop
   `for (int i = 0; i < 6; i++)` -> `i < 8`
3. `setPalette()` JS: pack loop `i < 6` -> `i < 8`
4. `PALETTES` object: 10 entries, 8 colors each
5. Swatch UI: unchanged (built dynamically from `PALETTES`)

No other shader/JS changes. `u_palCount` already drives the quantize loop
bound, and all palettes will be exactly 8, so behavior is uniform.

## 4. Aseprite MCP workflow

1. Design candidate hexes per theme
2. `set_palette` on scratch sprite; `analyze_palette_harmonies` to check
   complementary/triadic/analogous coherence + temperature per theme
3. Render each ramp as an 8x8 swatch strip; export PNG; visually inspect
   every palette before shipping (read tool can view images)

## 5. Verification

1. **Ramp check:** Node script parses `PALETTES` from the HTML; asserts
   8 colors each, valid hex, luminance strictly increasing (all 10 palettes)
2. **Browser check:** Playwright loads `file://` URL; assert zero
   console/shader errors; screenshot default view
3. **Visual spot-check:** screenshot 2-3 palettes via swatch clicks

## 6. Rollback

Backup copy `blackhole-pixel.html.bak` before edits. Restore = `cp`.
Git now initialized; committed spec is the checkpoint.

## Out of scope

- No physics changes, no new controls, no layout changes
- No change to SAVE PNG / bloom / grades behavior
- v1 file untouched
