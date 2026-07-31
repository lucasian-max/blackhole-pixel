# 8-Color Palette Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the black hole simulator from 6-color to 8-color luminance-ramp palettes: rebuild 4 existing themes, add 6 new ones (10 total), validated via the Aseprite MCP and a ramp-check test.

**Architecture:** Single-file WebGL2 app (`blackhole-pixel.html`). Change is data + small uniform/loop size bumps: `u_palette[6]` -> `u_palette[8]` in two shaders, quantize loop 6 -> 8, JS pack loop 6 -> 8, and replace the 4-entry `PALETTES` object with 10 8-color ramps. Palette data is designed in Aseprite (harmony analysis + swatch-strip visual inspection), recorded in `docs/palette-data.md`, then pasted into the HTML.

**Tech Stack:** WebGL2 (GLSL ES 3.0), vanilla JS, Node (test only, no deps), Aseprite MCP, Playwright MCP (verification).

## Global Constraints

- Edit ONLY `blackhole-pixel.html` for the sim itself. `blackhole-pixel-v1.html` is reference, untouched.
- Every palette is exactly 8 colors, hex `#RRGGBB`, luminance (0.299R+0.587G+0.114B, /255) strictly increasing index 0 -> 7.
- Palette roles fixed: [0] space black, [1] sky tint, [2] shadow ember, [3] cool mid, [4] warm mid, [5] hot glow, [6] white-hot, [7] pure white.
- Theme list (10): GARGANTUA, VAPORWAVE, TERMINAL, AMBER (rebuilt) + ICE, NOVA, SUNSET, BLOOD, TOXIC, MONO (new).
- No physics, layout, or control changes. Bloom, film grades, SAVE PNG behavior unchanged.
- Backup `blackhole-pixel.html.bak` before first edit (not committed).

---

### Task 1: Backup + Design 10 Palettes in Aseprite

**Files:**
- Create: `docs/palette-data.md` (the Aseprite output record)
- Create: `blackhole-pixel.html.bak` (via cp)

**Interfaces:**
- Produces: `docs/palette-data.md` containing 10 named hex arrays (`NAME: [hex0..hex7]`), each passing the luma-ramp invariant. Task 3 consumes this file verbatim.

- [ ] **Step 1: Backup the sim**

Run: `cp blackhole-pixel.html blackhole-pixel.html.bak`
Expected: `.bak` exists, byte-identical.

- [ ] **Step 2: Create the Aseprite scratch sprite**

Use `aseprite_create_canvas` (8x8, rgb) -> note returned `file_path`.

- [ ] **Step 3: Per theme, design -> set -> analyze**

For each of the 10 themes (GARGANTUA, VAPORWAVE, TERMINAL, AMBER, ICE, NOVA, SUNSET, BLOOD, TOXIC, MONO):
1. Draft 8 hexes following the role mapping in Global Constraints (darkest to pure white; warm themes end orange->white, cold themes end blue-white->white).
2. `aseprite_set_palette` on the scratch sprite with the 8 hexes.
3. `aseprite_analyze_palette_harmonies` on the 8 hexes — sanity check: temperature matches theme (COLD/ICE/NOVA read cool, BLOOD/SUNSET/GARGANTUA warm, TERMINAL/TOXIC/MONO neutral/green), no jarring complementary clash in adjacent ramp steps.
4. Adjust any hex that fails the check; re-run analysis until coherent.

- [ ] **Step 4: Render swatch strips and inspect visually**

For each theme: draw the 8 colors as an 8x8 swatch strip (`aseprite_draw_rectangle` filled, one column per color), export PNG (`aseprite_export_sprite`). Read the PNG with the `read` tool and confirm: gradient reads dark->bright left-to-right with no mid-ramp brightness inversions.

- [ ] **Step 5: Record the final data**

Write all 10 validated arrays to `docs/palette-data.md` in the exact format:
```markdown
# Palette Data (Aseprite-validated)
GARGANTUA: [#000000, #hex1, ..., #hex7]
...
```
Format is load-bearing: Task 3 parses this file.

- [ ] **Step 6: Commit**

```bash
git add docs/palette-data.md
git commit -m "docs: record 8-color palette designs (Aseprite-validated)"
```
`.bak` stays untracked (add `blackhole-pixel.html.bak` to `.gitignore`).

---

### Task 2: Write the Ramp-Check Test (red)

**Files:**
- Create: `test/ramp-check.js`

**Interfaces:**
- Consumes: `blackhole-pixel.html` (PALETTES object) — current state has 4x6 colors, so this test MUST fail before Task 3.
- Produces: exit code 0 when every palette is 8 valid hexes with strictly increasing luma; non-zero otherwise.

- [ ] **Step 1: Write the test**

```javascript
#!/usr/bin/env node
// test/ramp-check.js — no deps. Verifies every PALETTES entry in
// blackhole-pixel.html is 8 valid hexes forming a strict luma ramp.
const fs = require('fs');
const html = fs.readFileSync('blackhole-pixel.html', 'utf8');
const m = html.match(/const PALETTES = \{(.|\n)*?\n\};/);
if (!m) { console.error('FAIL: PALETTES object not found'); process.exit(1); }
const body = m[0];
const luma = h => {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};
const hexRe = /#[0-9a-fA-F]{6}/g;
const entries = [...body.matchAll(/([A-Z0-9_]+):\s*\[([^\]]*)\]/g)];
let fails = 0;
for (const e of entries) {
  const name = e[1], hexes = e[2].match(hexRe) || [];
  if (hexes.length !== 8) { console.error(`FAIL ${name}: ${hexes.length} colors (need 8)`); fails++; continue; }
  const lum = hexes.map(luma);
  for (let i = 1; i < 8; i++) {
    if (lum[i] <= lum[i - 1]) { console.error(`FAIL ${name}: luma not strictly increasing at [${i}] (${lum[i-1].toFixed(3)} -> ${lum[i].toFixed(3)})`); fails++; break; }
  }
}
if (fails) { console.error(`\n${fails} palette(s) failed`); process.exit(1); }
console.log(`PASS: ${entries.length} palettes, all 8-color strict luma ramps`);
```

- [ ] **Step 2: Run it — must FAIL**

Run: `node test/ramp-check.js`
Expected: FAIL — current HTML has 4 palettes x 6 colors ("4 colors (need 8)" per palette).

- [ ] **Step 3: Commit**

```bash
git add test/ramp-check.js
git commit -m "test: add 8-color luma-ramp check (red against current palettes)"
```

---

### Task 3: Implement 8-Color Palettes (green)

**Files:**
- Modify: `blackhole-pixel.html`
  - line ~133: `uniform vec3 u_palette[6];` (FRAG_SCENE) -> `u_palette[8];`
  - line ~280: `uniform vec3 u_palette[6];` (FRAG_FINAL) -> `u_palette[8];`
  - line ~301: `for (int i = 0; i < 6; i++){` (quantize) -> `i < 8`
  - line ~405: `for (let i = 0; i < 6; i++){` (setPalette) -> `i < 8`
  - lines ~86-91: replace `PALETTES` object (4 x 6) with the 10 x 8 arrays from `docs/palette-data.md`

**Interfaces:**
- Consumes: `docs/palette-data.md` (Task 1 output), `test/ramp-check.js` (Task 2).
- Produces: working sim with 10 palettes, ramp-check green.

- [ ] **Step 1: Apply the four size bumps**

Edit the 4 lines listed above (2 shader uniform declarations, quantize loop, setPalette loop). Note: `u_palCount` already guards the quantize loop, so intermediate states stay safe.

- [ ] **Step 2: Paste the new palettes**

Replace the `PALETTES` object body with all 10 arrays from `docs/palette-data.md`, preserving the exact JS structure:
```javascript
const PALETTES = {
  GARGANTUA: [...8 hexes...],
  VAPORWAVE: [...], TERMINAL: [...], AMBER: [...],
  ICE: [...], NOVA: [...], SUNSET: [...], BLOOD: [...], TOXIC: [...], MONO: [...]
};
```

- [ ] **Step 3: Run the ramp-check — must PASS**

Run: `node test/ramp-check.js`
Expected: `PASS: 10 palettes, all 8-color strict luma ramps`

- [ ] **Step 4: Commit**

```bash
git add blackhole-pixel.html
git commit -m "feat: 8-color luminance-ramp palettes (10 themes)"
```

---

### Task 4: Browser Verification + Visual Spot-Check

**Files:** none (verification only)

**Interfaces:**
- Consumes: `blackhole-pixel.html` post-Task-3.

- [ ] **Step 1: Load in browser, assert no errors**

Playwright MCP: `browser_navigate` to `file:///Users/mridulvijay/blackhole-pixel/blackhole-pixel.html`.
Then `browser_console_messages` (level error) — expected: empty. The page shows the `#err` div if WebGL2/shader compile fails; a screenshot must NOT contain "WebGL2 is required".

- [ ] **Step 2: Screenshot default view**

`browser_take_screenshot` (full page). Inspect: GARGANTUA disk renders with smooth bands, no posterizing, photon ring visible.

- [ ] **Step 3: Spot-check 3 palettes**

Click swatches (ICE, MONO, BLOOD) via snapshot refs, screenshot after each. Confirm each reads as its theme (ice = blue-white, mono = grayscale, blood = red-orange) with no dither noise on the disk.

- [ ] **Step 4: Fix if needed, else done**

If any check fails: diagnose (backup exists), fix, re-run Tasks 2-4 checks, commit fix. If all pass, no commit needed (already committed in Task 3).

---

## Self-Review Notes (filled by plan author)

- **Spec coverage:** ramp arch + roles -> Global Constraints/Task 3; 10 themes -> Task 1; code changes (2 uniforms, quantize loop, setPalette loop) -> Task 3 steps 1-2; Aseprite workflow -> Task 1 steps 2-5; verification (ramp check, browser, visual) -> Tasks 2/4; rollback (bak + git) -> Task 1 step 1, Task 4 step 4. Out-of-scope items (physics/layout/controls, v1 untouched, SAVE PNG/bloom unchanged) -> Global Constraints. Covered.
- **Placeholders:** no TBD/TODO. The 80 hex values are produced by Task 1 (design work) and consumed via `docs/palette-data.md` — an explicit interface, not a placeholder.
- **Type consistency:** uniform names (`u_palette`, `u_palCount`), loop bounds, and the test's regex (`([A-Z0-9_]+):\s*\[([^\]]*)\]` against `NAME: [hex, ...]`) all match across tasks. Test regex requires palette names uppercase — PALETTES keys are uppercase.
