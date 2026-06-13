import { ctx, rand, ri, times, shuffle, circle, mix, clamp, chance } from '../utils.js';
// Interference: a dot field where each dot is sized and colored by the summed wavefronts from a few
// point sources — constructive crests vs destructive troughs. Ripple-tank physics as moiré pattern.
export default function interference() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), a = cs[0], b = cs[1] || mix(a, ctx.P.bg, .55);
  const cols = ri(34, 54), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw) + 1;
  const k = rand(.045, .09), srcs = Array.from({ length: ri(2, 3) }, () => [rand(.1, .9) * ctx.W, rand(.1, .9) * ctx.H]);
  times(rows, r => times(cols + 1, c => {
    const x = c * cw, y = (r + .5) * cw;
    let v = 0; srcs.forEach(([sx, sy]) => v += Math.cos(Math.hypot(x - sx, y - sy) * k));
    const t = v / srcs.length;                          // -1..1
    const sz = cw * (.12 + .52 * clamp(Math.abs(t), 0, 1));
    if (sz < 1) return;
    circle({ x, y, w: sz, h: sz, color: t >= 0 ? a : b });
  }));
}
