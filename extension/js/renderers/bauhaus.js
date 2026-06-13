import { ctx, rand, chance, choice, shuffle, circle, halfDisc, line, shape, mix, blendMode } from '../utils.js';
// Bauhaus poster: a small set of primary forms — bar, disc, edge-anchored semicircle, accent —
// balanced on thirds. Asymmetric balance and a clear focal hierarchy do the work, not quantity.
export default function bauhaus() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), S = ctx.S;
  if (chance(.7)) line({ x: ctx.W * rand(.3, .7), y: ctx.H * rand(.3, .7), len: Math.hypot(ctx.W, ctx.H), rot: choice([0, 90, 45, -45]), thick: S * rand(.018, .045), color: ctx.P.ink, z: 4 });
  circle({ x: choice([1 / 3, 2 / 3]) * ctx.W, y: choice([1 / 3, 2 / 3]) * ctx.H, w: S * rand(.4, .6), h: S * rand(.4, .6), color: cs[0], z: 2 });
  const hr = S * rand(.24, .4), e = choice(['t', 'b', 'l', 'r']);
  const hd = { t: [ctx.W * rand(.3, .7), 0, 180], b: [ctx.W * rand(.3, .7), ctx.H, 0], l: [0, ctx.H * rand(.3, .7), 90], r: [ctx.W, ctx.H * rand(.3, .7), 270] }[e];
  halfDisc({ x: hd[0], y: hd[1], r: hr, color: cs[1 % cs.length], rot: hd[2], z: 1 });
  if (chance(.75)) shape(choice([1 / 4, 3 / 4]) * ctx.W, choice([1 / 4, 3 / 4]) * ctx.H, S * rand(.18, .3), cs, { kind: choice(['triangle', 'diamond', 'square']), color: cs[2 % cs.length], rot: choice([0, 15, 45, 90, 180]), blend: chance(.4) ? blendMode() : null });
  circle({ x: choice([1 / 4, 1 / 2, 3 / 4]) * ctx.W, y: choice([1 / 4, 1 / 2, 3 / 4]) * ctx.H, w: S * rand(.06, .12), h: S * rand(.06, .12), color: ctx.P.accent, z: 6 });
}
