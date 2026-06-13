import { ctx, rand, ri, times, shuffle, choice, chance, box, circle, line, mix } from '../utils.js';
// Sunrise: a horizon line splits sky and ground, with a sun placed on a third and graded sky bands.
// A landscape archetype — strong horizontal anchor plus one focal circle.
export default function sunrise() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), horizon = ctx.H * rand(.52, .72);
  const sky = cs[0], n = ri(3, 6);
  times(n, i => box({ x: ctx.W / 2, y: (i + .5) / n * horizon, w: ctx.W, h: horizon / n + 1, color: mix(sky, ctx.P.bg, .12 + i / n * .55) }));
  box({ x: ctx.W / 2, y: (horizon + ctx.H) / 2, w: ctx.W, h: ctx.H - horizon + 1, color: mix(cs[1 % cs.length], ctx.P.ink, .18) });
  const sx = ctx.W * choice([1 / 3, 1 / 2, 2 / 3]), r = ctx.S * rand(.15, .26);
  circle({ x: sx, y: horizon, w: r * 2, h: r * 2, color: ctx.P.accent, z: 3 });
  if (chance(.5)) { const m = ri(3, 6); times(m, i => line({ x: sx, y: horizon - r - ctx.S * (.02 + i * .03), len: r * 2 * (1 - i * .12), rot: 0, thick: ctx.S * rand(.006, .012), color: ctx.P.accent, z: 2 })); }
}
