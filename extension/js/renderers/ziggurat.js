import { ctx, ri, rand, chance, shuffle, box, circle, bgFull, mix } from '../utils.js';
// Ziggurat: an Art Deco setback — a symmetric stepped mass, widest at the base and bleeding off both edges,
// each tier a flat colour with an optional inset band. Behind it, a hard-edged ray fan from the apex and
// sometimes a disc sitting on it. Mirrored, the tiers taper away from the centre line into a stepped lozenge.
export default function ziggurat() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const n = ri(5, 10), mirror = chance(.32), taper = rand(.6, .92);
  const cx = ctx.W / 2, w0 = ctx.W * rand(1, 1.14);        // base tier overhangs, so the mass has no side gaps
  const half = mirror ? ctx.H / 2 : ctx.H * rand(.72, 1);
  const th = half / n, inset = th * rand(.14, .24);
  const bands = chance(.55);
  const at = i => cs[((i % cs.length) + cs.length) % cs.length];
  const apexY = mirror ? ctx.H / 2 : ctx.H - half;   // rays fan from the apex, or from the lozenge's waist
  // Sky behind: either a hard ray fan from the apex, or a flat wash. bgFull rather than box — a box scales in
  // from .82 with the reveal and would flash the corners bare on the way.
  if (chance(.5)) {
    const a = mix(at(-1), ctx.P.bg, .35), b = mix(at(-1), ctx.P.bg, .72), seg = rand(4, 9);
    bgFull({ background: `repeating-conic-gradient(from ${rand(0, 2 * seg).toFixed(1)}deg at 50% ${(apexY / ctx.H * 100).toFixed(1)}%, ${a} 0 ${seg.toFixed(2)}deg, ${b} ${seg.toFixed(2)}deg ${(2 * seg).toFixed(2)}deg)` });
  } else bgFull({ background: mix(at(-1), ctx.P.bg, .6) });
  if (chance(.45)) { const d = ctx.S * rand(.22, .4); circle({ x: cx, y: apexY, w: d, h: d, color: mix(at(-2), ctx.P.bg, .18), z: -1 }); }
  const tier = (i, y) => {
    const w = w0 * (1 - taper * i / (n - 1));
    box({ x: cx, y, w, h: th + 1, color: at(i) });     // +1: exact abutment leaves sub-pixel seams between tiers
    if (bands) box({ x: cx, y, w: Math.max(6, w - inset * 2), h: Math.max(3, th - inset * 2), color: at(i + 1) });
  };
  if (mirror) {
    // The widest tier is SHARED across the waist. Running two full stacks out from the centre instead draws
    // tier 0 twice back to back, and the lozenge gets a double-height slab through its middle.
    tier(0, ctx.H / 2);
    for (let i = 1; i < n; i++) { tier(i, ctx.H / 2 - i * th); tier(i, ctx.H / 2 + i * th); }
  } else for (let i = 0; i < n; i++) tier(i, ctx.H - (i + .5) * th);
}
