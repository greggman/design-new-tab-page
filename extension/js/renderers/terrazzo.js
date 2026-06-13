import { ctx, ri, rand, times, shuffle, box, shape, pick, mix, chance } from '../utils.js';
// Terrazzo: dense small chips of mixed shape and color flung evenly across a neutral matrix.
// High count plus uniform dispersion turns randomness into a refined, even surface.
export default function terrazzo() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]), n = ri(70, 150);
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: mix(ctx.P.bg, ctx.P.ink, .05), z: -1 });
  times(n, () => {
    const x = rand(0, 1) * ctx.W, y = rand(0, 1) * ctx.H, sz = ctx.S * rand(.01, .045);
    shape(x, y, sz, ctx.POOL, { kind: pick(['circle', 'circle', 'square', 'triangle', 'diamond', 'pentagon', 'trapezoid']), color: pick(cs), rot: rand(0, 360) });
  });
}
