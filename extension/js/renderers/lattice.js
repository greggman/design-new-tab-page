import { ctx, rand, ri, times, shuffle, line, circle, mix, chance, choice } from '../utils.js';
// Lattice: two families of thin parallel lines crossing at ±θ to weave a diamond trellis, with a
// node dot at every intersection. Open and airy — a structural grid that lets the background read.
export default function lattice() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), A = choice([30, 45, 60]) * Math.PI / 180;
  const g = ctx.S * rand(.06, .12), thick = Math.max(1.5, ctx.S * .003), col = cs[0], D = Math.hypot(ctx.W, ctx.H) * 1.3;
  const n1 = [-Math.sin(A), Math.cos(A)], n2 = [Math.sin(A), Math.cos(A)], half = Math.ceil(D / g / 2) + 1;
  const cx = ctx.W / 2, cy = ctx.H / 2;
  times(half * 2 + 1, ii => { const i = ii - half; line({ x: cx + i * g * n1[0], y: cy + i * g * n1[1], len: D, rot: A * 57.2958, thick, color: col, z: 1 }); });
  times(half * 2 + 1, ii => { const i = ii - half; line({ x: cx + i * g * n2[0], y: cy + i * g * n2[1], len: D, rot: -A * 57.2958, thick, color: col, z: 1 }); });
  const nd = ctx.S * rand(.012, .02);
  for (let i = -half; i <= half; i++) for (let j = -half; j <= half; j++) {
    const x = cx + (j - i) * g / (2 * Math.sin(A)), y = cy + (i + j) * g / (2 * Math.cos(A));
    if (x < -nd || x > ctx.W + nd || y < -nd || y > ctx.H + nd) continue;
    circle({ x, y, w: nd, h: nd, color: ctx.P.accent, z: 2 });
  }
}
