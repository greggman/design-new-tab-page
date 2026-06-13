import { ctx, ri, clamp, rand, times, shuffle, box, mix, chance } from '../utils.js';
// Rotating squares: a grid where each square's rotation grows with distance from center, producing
// an op-art swirl. Systematic deformation of a regular grid — order bending into motion.
export default function rotatingSquares() {
  const cols = ri(5, 10), rows = clamp(Math.round(cols * ctx.H / ctx.W), 4, 12), cw = ctx.W / cols, ch = ctx.H / rows, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const base = rand(0, 45), spin = rand(2, 8), cx = ctx.W / 2, cy = ctx.H / 2, maxD = Math.hypot(cx, cy), grad = chance(.6);
  times(rows, r => times(cols, c => {
    const x = (c + .5) * cw, y = (r + .5) * ch, d = Math.hypot(x - cx, y - cy) / maxD;
    box({ x, y, w: Math.min(cw, ch) * rand(.6, .82), h: Math.min(cw, ch) * rand(.6, .82), color: grad ? mix(cs[0], cs[cs.length - 1], d) : cs[(c + r) % cs.length], rot: base + d * spin * 90 });
  }));
}
