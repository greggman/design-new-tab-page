import { ctx, ri, shuffle, rawCornerArc, rand, times } from '../utils.js';
export default function cornerArcs() {
  const corner = ri(0, 3), cs = shuffle([ctx.P.accent, ...ctx.POOL]), n = ri(4, 8), maxR = Math.hypot(ctx.W, ctx.H) * rand(.55, .85);
  const pos = [[0, 0], [ctx.W, 0], [ctx.W, ctx.H], [0, ctx.H]][corner];
  times(n, i => rawCornerArc(pos[0], pos[1], maxR * (1 - i / n), cs[i % cs.length], corner, i));
}
