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
