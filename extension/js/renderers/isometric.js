import { ctx, shuffle, rand, times, ri, chance, isoCube, pick } from '../utils.js';
export default function isometric() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]), s = ctx.S * rand(.1, .17), C = Math.ceil(ctx.W / (s * .7)) + 1, R = Math.ceil(ctx.H / (s * .55)) + 1, floaty = chance(.5);
  times(R, r => times(C, c => { if (floaty && chance(.4)) return; isoCube((c + .5) * s * .7, (r + .5) * s * .55 + (c % 2 ? s * .27 : 0), s, pick(cs)); }));
}
