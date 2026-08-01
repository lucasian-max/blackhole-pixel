---
feature-matrix:
  scope: "Aseprite capabilities applied to blackhole-pixel.html (single-file WebGL2 black-hole raytracer, 10 palettes, CRT/terminal UI skin)"
  criteria: [Effort, Impact, Risk, Dependencies, Maintenance, Alternatives]
  scale: "Effort/Risk 1=low..5=high; Impact 1=low..5=high"
---

# Aseprite Use Cases for Pixel Black Hole

Rated for a blind-model-driven, headless Aseprite MCP setup — that constraint
decides everything, because it separates "assets Aseprite must make" from
"stuff code does better."

## Matrix

| # | Feature | Effort | Impact | Risk | Dependencies | Maint. | Alternatives | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | **Theme icons** (16x16 x10, geometric glyphs: ring/flame/snowflake/droplet/moon...) | 2 | 5 | 2 | Aseprite MCP only; no HTML surgery | Low | Hand-drawn by user; CSS shapes | The one case Aseprite is *the* right tool. Blind-safe if shapes stay geometric. Recolorable per palette |
| 2 | **Pixel title logo** (photon-ring glyph or banner) | 1 | 4 | 1 | None | None | `<canvas>` re-render | Cheap, replaces flat h1, keeps phosphor glow |
| 3 | **Starfield background tile** (32x32 tileable) | 1 | 3 | 1 | None | None | 10 lines of JS noise | Aseprite optional — code does it equally well blind |
| 4 | **Boot/splash animation** (4-8 frame disk spritesheet + tag) | 3 | 3 | 2 | Spritesheet export + JSON; frame loop code | Low | CSS keyframes | Real Aseprite win (hand-made frames) but medium wiring; delayed value |
| 5 | **Cursor sprite** (crosshair/pointer over canvas) | 1 | 1 | 1 | None | None | CSS `cursor:` | Trivial, near-zero impact. Filler |
| 6 | **Disk detail texture** (sprite on accretion band) | 4 | 2 | 4 | Shader rewrite of pass 1; breaks "emergent physics" claim | High | Existing quantize pass | Actively harmful — kills the sim's selling point. **No** |
| 7 | **Palette harmony validation** | done | 4 | 0 | Aseprite MCP | None | Node script | *Already delivered* — the setup's proven win. More palettes = reuse it |
| 8 | **Pixel UI chrome** (sprite sliders/buttons/bezel) | 4 | 3 | 3 | Replaces working CSS controls; input styling | Medium | Current CSS skin | CSS already got the CRT look at 1/4 the cost. Aseprite adds hand-crafted polish only |

## Recommendations

1. **#1 Theme icons** — best impact/effort ratio, lowest risk, the only entry
   with no real substitute. Build first.
2. **#2 Pixel logo** — nearly free, visible immediately, exercises the same
   export->integrate pipeline used everywhere else. Ship in the same pass.
3. **#4 Boot animation** — defer until icons+logo are proven.
4. **#3 Starfield tile** — only if the flat background bothers you; code does
   this blind better than Aseprite.
5. **#8 Pixel chrome** — only if icons+logo land and more depth is wanted.
6. **#6 Disk texture — rejected.** Trades the sim's integrity for texture;
   the quantizer already provides pixel character.

## Rationale

Icons win because a 16x16 palette-constrained glyph is the one artifact where
a dedicated pixel-art tool with palette/harmony validation beats hand-rolled
CSS or canvas code — and it is drawable blind with primitives. Everything else
on the list Aseprite can do, but code matches it at equal or better quality
given no image feedback. Aseprite is at its best as the art pipeline (icons,
logo, animation frames) that gets wired in — not the rendering engine. Hence:
assets first, animation when those prove out, and a hard stop at anything that
touches the physics shader.

## Execution notes

- Art direction: geometric glyphs only (rings, crosses, triangles, circles) —
  blind-safe with MCP primitives. Organic art (flames, faces) needs the user's
  hand or the user's eyes on the result.
- Integration: export PNG via MCP -> `assets/` -> wire into swatch buttons /
  `<img>` / CSS `url()`. One-file constraint is relaxed.
- Validation: run `test/ramp-check.js` after any palette change; load page via
  `python3 -m http.server 8917` and check console for 0 errors.
