import { ctx, shuffle, thirds, rings, rand, times, ri } from '../utils.js';
export default function concentricSquares() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), [fx, fy] = thirds();
  rings({ x: fx, y: fy, r: ctx.S * rand(.36, .55), colors: cs, square: true, rw: ctx.S * rand(.03, .05) });
  times(ri(1, 2), () => rings({ x: rand(.15, .85) * ctx.W, y: rand(.15, .85) * ctx.H, r: ctx.S * rand(.1, .2), colors: shuffle(cs), square: true, rw: ri(6, 14) }));
}
