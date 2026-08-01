# Kerr Black Hole with Relativistic Jets — Design Spec

**Date:** 2026-08-01
**Target file:** `blackhole-pixel.html` (single file, no build)
**Goal:** Upgrade the Schwarzschild raytracer to Kerr (spinning black hole) with relativistic jets, fix the physics bugs that block the upgrade, and fix the pre-existing UI problems. Keep the pixel-art aesthetic (palette quantization, dither, scanlines, film grade) intact.

---

## 1. What's being built

A real-time WebGL2 fragment shader that raytraces photon geodesics through the **Kerr metric** (spinning black hole), with an accretion disk and **relativistic jets** rendered as emissivity fields sampled along the geodesic. Two new controls: **SPIN** (0 → 0.998, the Thorne limit) and **JET BRIGHTNESS** (0 → 4). Everything is palette-quantized through the existing 8-color retro palettes.

The physics is emergent, not faked:
- Photons follow real Kerr null geodesics (4 coupled ODEs, Carter constant Q).
- The photon ring becomes asymmetric with spin (brighter on one side — the EHT M87* look).
- The ISCO migrates inward with prograde spin (from 3R_s at a=0 down to 0.5R_s at a=1).
- Frame-dragging twists the disk's inner edge.
- Jets are a synchrotron-emissivity field in a narrow cone around the spin axis, Doppler-beamed along the axis, gravitationally redshifted climbing out of the well.

---

## 2. The Kerr geodesic integrator (the blocker fix)

### 2.1 Why the current integrator can't be patched

The existing loop (lines 254-308) uses `a = -1.5·L²·r/|r|⁵` — a central-force 3D acceleration that only works because Schwarzschild is spherically symmetric. Kerr is axisymmetric; the geodesic equation has no central-force form. The conserved-`L²` trick (line 257) also breaks — in Kerr only `L_z` is conserved, plus the Carter constant `Q`.

### 2.2 The Kerr geodesic equation

Use the **first-order form** in Boyer-Lindquist coordinates `(t, r, θ, φ)` with conserved quantities `(E, L_z, Q)`:

```
Σ²·(dr/dλ)²  = R(r)     = P(r)² - Δ·(Q + (L_z - aE)²)
Σ²·(dθ/dλ)²  = Θ(θ)     = Q - cos²θ·(L_z²·csc²θ - a²E²)
Σ·(dφ/dλ)    = Φ(r,θ)   = (L_z·csc²θ - aE) + a·P(r)/Δ
Σ·(dt/dλ)    = T(r,θ)   = a·(L_z - aE·sin²θ) + (r² + a²)·P(r)/Δ
```

where:
- `Σ = r² + a²·cos²θ`
- `Δ = r² - 2Mr + a²`
- `P(r) = E·(r² + a²) - a·L_z`
- `M = 0.5` (geometrized units, same as current)
- `a = a_dimless · M` (spin parameter with dimensions of length; `a_dimless` is the slider 0 → 0.998)

For a **null geodesic** (photon), `E` is a scale freedom — set `E = 1` and scale the photon 4-momentum by the camera ray direction. `L_z` and `Q` are determined by the camera position and ray direction at launch.

### 2.3 Initialization from camera ray

At the camera position `(r₀, θ₀, φ₀)` with ray direction `(n_r, n_θ, n_φ)` in the local static-observer frame:

```
E   = 1                                    (scale freedom)
L_z = Σ₀ · sin²θ₀ · (dφ/dλ) / (dt/dλ)     ... projected on spin axis
Q   = Σ₀² · (dθ/dλ)² + cos²θ₀·(a²E² - L_z²·csc²θ₀)
```

The local tetrad for a static observer in Kerr gives the conversion from the Cartesian camera ray to `(dr/dλ, dθ/dλ, dφ/dλ)`. This is the fiddly part — I'll use the standard Bardeen et al. (1972) tetrad.

### 2.4 Integrator

**RK4** (4th-order Runge-Kutta) with **adaptive step size**:
- `dt = 0.02 · r` near and inside the photon ring (`r < 5`).
- `dt = 0.05 · r` outside.
- Cap at 512 steps (up from 256) because Kerr photon-ring orbits are longer.

RK4 costs 4 evaluations per step but the step can be larger, so net cost is ~2× the current symplectic Euler. At 192×108 this is fine.

### 2.5 Horizon and ergosphere

- **Event horizon:** `r₊ = M + √(M² - a²)`. Photon swallowed when `r < r₊ + 0.01`.
- **Ergosphere (static limit):** `r_ergo(θ) = M + √(M² - a²cos²θ)`. Not needed for the raytracer (photons can still escape the ergosphere), but used for the jet anchoring point (§3.3).

### 2.6 Stopping conditions

1. `r < r₊` → swallowed (black).
2. `r > ESC` (escape radius, 25) → sample procedural sky (lensed starfield, same as current).
3. Step budget exhausted → sample sky (prevents infinite loops near the photon ring).

---

## 3. The accretion disk (polish + Kerr-aware)

### 3.1 Geometry

Thin disk in the equatorial plane (`θ = π/2`, i.e. `y = 0` in the Cartesian-like display). Disk spans from **ISCO(spin)** to `r_outer = 12`.

**ISCO radius as a function of spin** (Bardeen et al. 1972, prograde):
```
r_ISCO(a) = M · { 3 + Z₂ - √[(3-Z₁)(3+Z₁+2Z₂)] }
Z₁ = 1 + (1-a²/M²)^(1/3) · [(1+a/M)^(1/3) + (1-a/M)^(1/3)]
Z₂ = √(3·a²/M² + Z₁²)
```
At `a=0`: `r_ISCO = 3` (matches current). At `a=0.998`: `r_ISCO ≈ 1.24` (Thorne limit).

### 3.2 Emission model

Sampled when the geodesic crosses the equatorial plane (`θ flips through π/2`, detected by sign change of `cosθ`):

- **Temperature:** `T(r) ∝ r^(-3/4) · (1 - √(r_ISCO/r))^(1/4)` (Novikov-Thorne inner-edge factor, goes to zero at ISCO).
- **Brightness:** `I ∝ T⁴ · band(θ) · D⁴ · redshift`, where:
  - `band(θ)` = Gaussian in `cosθ` (thin disk, `h/r ~ 0.05`).
  - `D` = full Kerr Doppler factor (4-vector form, §2.3).
  - `redshift` = `D_grav²` (bolometric, fixes the current `D¹` bug).
- **Color:** derived from the **active palette** (fixes the hardcoded-orange bug). Map `T` to a position on the palette's luma ramp (palette[2] → palette[7]), so the disk uses the same colors as everything else.

### 3.3 Orbital velocity (Kerr-aware)

For the Doppler factor we need the disk material's 4-velocity `u^μ` at the emission point. For a circular prograde equatorial orbit in Kerr, the orbital angular velocity as measured at infinity is:

```
Ω = √M / (r^(3/2) + a·√M)
```

(Bardeen et al. 1972; this is exact for circular equatorial geodesics.) The 4-velocity components in Boyer-Lindquist coordinates:

```
u^t = (r^(3/2) + a·√M) / √(r³ - 3Mr² + 2a·√M·r^(3/2))
u^φ = Ω · u^t
u^r = u^θ = 0
```

The denominator of `u^t` is `√(r³ - 3Mr² + 2a√M·r^(3/2))`; it goes to zero at the ISCO (no stable circular orbit below it). The frame-dragging angular velocity `ω = 2Mar/Σ²` is the angular velocity of locally non-rotating observers; the Doppler factor uses the full `u^μ` above, which already includes the frame-dragging contribution.

---

## 4. Relativistic jets (new)

### 4.1 What they are, physically

Relativistic jets are Poynting-flux-dominated plasma launched along the spin axis by the Blandford-Znajek mechanism (the spinning ergosphere twists magnetic field lines anchored to the disk). They are:
- Collimated along the spin axis (the y-axis in our scene).
- Relativistic (bulk Lorentz factor γ ~ 5-10).
- Synchrotron-emitting (power-law spectrum, not blackbody).
- Doppler-beamed along the axis (bright when viewed down the pole, dim edge-on).
- Extending far past the disk (to the escape radius and beyond).

### 4.2 Jet emissivity field

The jet is an emissivity `j(r, θ)` sampled along the geodesic, added to the disk emission:

```
j(r, θ) = jet_brightness · collimation(θ) · radial_profile(r) · beaming(θ, v_jet) · redshift(r)
```

where:
- **`collimation(θ)`**: Gaussian in `|cosθ|` around the spin axis (`θ = 0` or `π`). Opening angle ~8° (half-width). `collimation = exp(-(1 - |cosθ|)² / (2·0.07²))`.
- **`radial_profile(r)`**: power-law `r^(-2)` from the launch radius (`r_ISCO`, where the Blandford-Znajek field lines anchor) to the escape radius. Brightest near the base, fading outward.
- **`beaming`**: the jet plasma moves along the axis at `β_jet ~ 0.95` (γ ~ 3.2). Doppler factor `D_jet = 1/(γ(1 - β_jet·cosψ))` where `ψ` is the angle between the jet axis and the line of sight. Applied as `D_jet³` (bolometric). The counter-jet (pointing away) gets `D_jet` with `β → -β`, so it's dim — physically correct.
- **`redshift`**: same `D_grav²` as the disk, applied to the jet base.
- **Knots**: add a few `sin(r·k + phase)` modulations to `radial_profile` for internal-shock knots (the M87 jet has these). `phase` drifts with `u_time` so the knots slowly move outward.

### 4.3 Jet color

Synchrotron spectrum is a power law, but for the pixel-art aesthetic we map it to the **palette's high-luma end** (palette[5] → palette[7]), so jets look like the "white-hot" end of whatever palette is active. On GARGANTUA they're amber-white; on ICE they're blue-white; on BLOOD they're red-white. This keeps the aesthetic consistent.

### 4.4 The JET BRIGHTNESS slider

`jet_brightness` uniform (0 → 4, default 1.5). Scales the emissivity field without touching the beaming or redshift — so the physics stays honest, you just control how much emission there is. At 0 the jets vanish (pure Schwarzschild-Kerr disk). At 4 they blaze.

---

## 5. The two new controls

| Control | Range | Default | What it does |
|---|---|---|---|
| **SPIN** | 0 → 0.998 | 0.9 | `a_dimless`. 0 = Schwarzschild (current behavior). 0.998 = Thorne limit. Moves ISCO inward, makes the photon ring asymmetric, enables frame-dragging, twists the disk inner edge. |
| **JET BRIGHTNESS** | 0 → 4 | 1.5 | Scales jet emissivity. 0 = no jets. 4 = blazing. Beaming and redshift stay physical. |

The existing controls (DISK HEAT, DOPPLER BEAMING, TILT, DISTANCE, QUALITY, PALETTE, DITHER, SCANLINES, AUTO-ORBIT, FLY-THROUGH, FILM GRADE, BLOOM, SAVE PNG) all stay and keep working.

---

## 6. Polish fixes (ride along)

1. **Gravitational redshift exponent:** `D_grav²` (bolometric) instead of `D_grav¹`. Fixes the undercounting.
2. **Disk color from palette:** replace the hardcoded orange→white ramp with a palette-derived ramp. The jets use the same ramp (high-luma end).
3. **Dead `prevY` code:** remove (the Kerr integrator uses `cosθ` sign-flip detection instead).
4. **Boot splash:** fix `background-size:16px 16px` → `64px 64px` on line 75, and rebuild `boot-sheet.png` (the README has the exact coordinates — 4 glyphs, ring + arc + disk per frame). This is a pre-existing bug the user asked to fix.
5. **Integrator order:** RK4 replaces symplectic Euler (fixes photon-ring drift, required for Kerr anyway).

---

## 7. What stays the same

- **Single file, no build.** Everything in `blackhole-pixel.html`.
- **3-pass pipeline:** pass 1 (raytrace) → pass 2 (bloom) → pass 3 (composite + palette quantize). Only pass 1 changes.
- **Canvas:** 192×108 internal, 768×432 display, pixelated.
- **Palettes:** all 10 stay, all get the disk + jets mapped through them.
- **Film grades, bloom, dither, scanlines, save PNG:** unchanged.
- **Camera:** orbit/zoom/fly-through unchanged. Spin axis = y-axis (already the convention).
- **Physics guide modal:** updated to explain Kerr + jets (new sections on spin, frame-dragging, jets, Blandford-Znajek).

---

## 8. Performance

- Current: 256 steps × 192×108 × symplectic Euler (1 eval/step) = 5.3M evals/frame.
- Kerr: 512 steps × 192×108 × RK4 (4 evals/step) = 42M evals/frame. ~8× cost.
- At 192×108 on a modern GPU this is still real-time (target 30+ fps). The QUALITY slider (LOW=64, MED=128, HIGH=256 steps) will need a new tier or a re-tune — I'll add ULTRA=512 for Kerr and keep the existing tiers mapping to proportionally fewer steps.
- If it's too slow on LOW, I'll add an early-exit when the photon escapes (most pixels escape in <50 steps, only the photon-ring pixels need the full 512).

---

## 9. Testing

- **Visual regression:** at SPIN=0, the scene must look identical to the current Schwarzschild sim (same shadow size, same photon ring, same disk). This is the key correctness check — Kerr at a=0 must reduce to Schwarzschild.
- **Spin effects visible:** at SPIN=0.9, the photon ring must be visibly asymmetric (brighter on one side), the ISCO must be smaller (disk extends closer to the shadow), and the jets must be visible along the spin axis.
- **Jets beamed:** at TILT=4° (looking down the pole) jets must be bright; at TILT=80° (edge-on) jets must be dim (counter-jet invisible).
- **Palette consistency:** disk and jets must use the active palette's colors on all 10 palettes.
- **Boot splash:** spins correctly, no console errors.
- **No regressions:** SAVE PNG, film grades, bloom, dither, scanlines, fly-through all still work.

---

## 10. Out of scope (explicitly)

- **GRMHD / synchrotron transfer equations.** The jets are an emissivity field with a power-law profile, not a full MHD simulation. This is the right call for a real-time shader (a real GRMHD sim takes hours on a cluster).
- **Polarization.** Real jets are highly polarized; we don't render polarization.
- **Multiple disk thicknesses / warps.** Thin disk only (no thick disk, no warped disk).
- **Kerr-Newman (charged).** Kerr only.
- **Relativistic aberration at the camera.** The camera is a static observer; we don't boost the camera. (The fly-through is a position change, not a Lorentz boost.)

---

## 11. File changes

| File | Change |
|---|---|
| `blackhole-pixel.html` | Rewrite pass 1 shader (Kerr integrator + disk + jets), add SPIN + JET BRIGHTNESS controls, fix boot splash line 75, update physics modal text. |
| `assets/boot-sheet.png` | Rebuild from the README's exact coordinates (4 glyphs, ring + arc + disk per frame). |
| `README.md` | Update physics section (Kerr, jets, spin), controls list (SPIN, JET BRIGHTNESS), and mark boot splash fixed. |
| `docs/superpowers/specs/2026-08-01-kerr-jets-design.md` | This file. |

---

## 12. Risks

1. **Kerr integrator correctness.** The first-order Kerr geodesic equations are well-documented (Chandrasekhar, Carter) but the initialization from a Cartesian camera ray requires a tetrad that's easy to get wrong. Mitigation: the SPIN=0 reduction-to-Schwarzschild test (§9) catches most errors.
2. **Performance at high spin.** Photon-ring orbits at a=0.998 are long and the 512-step budget might not be enough for a few pixels. Mitigation: early-exit on escape, and accept that a handful of photon-ring pixels may terminate early (visually: a slightly less sharp ring, not a crash).
3. **Jet aesthetic vs. accuracy.** Real jets at real viewing angles are often too dim to see or too bright (wash out the disk). The JET BRIGHTNESS slider is the escape hatch — the default of 1.5 will be tuned to look good at the default 18° tilt.
4. **Boot splash rebuild.** The README says the MCP batch tool has a bug with draw ops. Mitigation: use standalone Aseprite MCP calls (one per op), which the README says works.
