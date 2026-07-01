import { ctx, rand, shuffle, box, mix, clamp, chance } from '../utils.js';
// Herringbone: planks laid at alternating ±45°, offset row to row so the courses interlock.
export default function herringbone() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const w = ctx.S * rand(.035, .055), L = w * rand(2.6, 3.4), cell = L / Math.SQRT2;
  const grad = chance(.5);
  let r = 0;
  for (let y = -cell; y < ctx.H + cell; y += cell, r++) {
    const off = (r % 2) ? cell : 0;
    let c = 0;
    for (let x = -cell; x < ctx.W + cell; x += cell, c++) {
      const up = c % 2 === 0;
      const col = grad ? mix(cs[0], cs[cs.length - 1], clamp((x / ctx.W + y / ctx.H) / 2, 0, 1)) : cs[(r + c) % cs.length];
      box({ x: x + off, y, w: L * .94, h: w * .9, color: col, rot: up ? 45 : -45 });
    }
  }
}
