import { ctx, rand, ri, times, shuffle, wedge, line, circle, mix, chance, choice } from '../utils.js';
// Shell fan: an Art-Deco sunray shell — concentric arc bands inside a wedge anchored at a corner or
// the bottom edge, split by thin radial rules. The fan occupies one zone, leaving the rest open.
export default function shellFan() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), atCorner = chance(.6);
  const corner = ri(0, 3), pos = [[0, 0], [ctx.W, 0], [ctx.W, ctx.H], [0, ctx.H]][corner];
  const px = atCorner ? pos[0] : ctx.W / 2, py = atCorner ? pos[1] : ctx.H;
  const a0 = atCorner ? [0, 90, 180, 270][corner] : 180, spread = atCorner ? 90 : 180;
  const n = ri(6, 12), maxR = Math.hypot(ctx.W, ctx.H) * (atCorner ? .82 : .72);
  for (let k = n; k >= 1; k--) wedge({ x: px, y: py, r: k / n * maxR, color: cs[k % cs.length], start: a0, sweep: spread, z: n - k });
  const seg = ri(5, 9), t = Math.max(1.5, ctx.S * .0035);
  times(seg + 1, i => line({ x: px, y: py, len: maxR * 2, rot: a0 + i / seg * spread, thick: t, color: ctx.P.bg, z: n + 1 }));
  circle({ x: px, y: py, w: maxR * .12, h: maxR * .12, color: ctx.P.accent, z: n + 2 });
}
