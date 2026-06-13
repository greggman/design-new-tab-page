import { ctx, rand, ri, times, shuffle, line, chance, mix, rings } from '../utils.js';
// Quarter fan: rays sweeping 90° out of one corner, anchored by concentric arcs. A corner-pinned
// radial burst — the asymmetry pulls focus to the origin point.
export default function quarterFan() {
  const corner = ri(0, 3), cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const [px, py] = [[0, 0], [ctx.W, 0], [ctx.W, ctx.H], [0, ctx.H]][corner];
  const start = [0, 90, 180, 270][corner], span = Math.hypot(ctx.W, ctx.H) * 2.2, n = ri(8, 18);
  times(n, i => line({ x: px, y: py, len: span, rot: start + (i + .5) / n * 90, thick: rand(3, 11), color: i % 2 ? cs[i % cs.length] : mix(ctx.P.ink, ctx.P.bg, .5), z: 1 }));
  if (chance(.6)) rings({ x: px, y: py, r: ctx.S * rand(.2, .34), colors: shuffle(cs), rw: ctx.S * rand(.03, .05) });
}
