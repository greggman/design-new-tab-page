import { ctx, rand, ri, times, shuffle, circle, mix, clamp, chance, pick, thirds } from '../utils.js';
// Stipple: pointillist dots scattered with a density-and-size gradient (denser/larger toward one
// region, sparser away), rendered by rejection sampling. Tone built from countless small marks.
export default function stipple() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), N = ri(600, 1100);
  const mode = pick(['linear', 'radial']), dir = rand(0, 6.28), [fx, fy] = thirds(), diag = Math.hypot(ctx.W, ctx.H);
  times(N, () => {
    const x = rand(0, 1) * ctx.W, y = rand(0, 1) * ctx.H;
    let t = mode === 'linear' ? clamp((Math.cos(dir) * x + Math.sin(dir) * y) / diag + .3, 0, 1) : clamp(Math.hypot(x - fx, y - fy) / (diag * .5), 0, 1);
    if (chance(t)) return;                                  // keep more dots where t is low
    const d = ctx.S * rand(.004, .013) * (1.25 - t) * 2;
    circle({ x, y, w: d, h: d, color: mix(cs[0], cs[cs.length - 1], t) });
  });
}
