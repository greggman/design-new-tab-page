import { ctx, rand, ri, times, shuffle, shape, ring, pick, chance, mix } from '../utils.js';
// Starfield: stars and points scattered across a range of sizes, with a few large focal bursts.
// Size variation creates a depth hierarchy — the eye reads the big ones as near, small ones as far.
export default function starfield() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), n = ri(22, 44);
  times(n, () => {
    const x = rand(0, 1) * ctx.W, y = rand(0, 1) * ctx.H, big = chance(.14), sz = ctx.S * (big ? rand(.06, .12) : rand(.01, .032));
    shape(x, y, sz, cs, { kind: chance(.68) ? 'star' : 'circle', color: big ? ctx.P.accent : pick(cs), rot: rand(0, 72) });
  });
  if (chance(.5)) times(ri(1, 2), () => ring({ x: rand(.15, .85) * ctx.W, y: rand(.15, .85) * ctx.H, d: ctx.S * rand(.12, .26), w: Math.max(2, ctx.S * .006), color: mix(ctx.P.ink, ctx.P.bg, .5) }));
}
