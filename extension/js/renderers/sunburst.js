import { ctx, thirds, shuffle, chance, rand, ri, choice, times, line, rings, mix } from '../utils.js';
export default function sunburst() {
  const [fx, fy] = thirds(), cs = shuffle(ctx.POOL), span = Math.hypot(ctx.W, ctx.H);
  const full = chance(.6), arc = full ? 360 : ri(70, 220), off = full ? 0 : rand(0, 360), rays = ri(22, 50);
  times(rays, i => line({ x: fx, y: fy, len: span, rot: off + i * arc / rays, thick: rand(2, 7), color: i % 2 ? cs[i % cs.length] : mix(ctx.P.ink, ctx.P.bg, .5), z: 1 }));
  if (chance(.75)) rings({ x: fx, y: fy, r: ctx.S * rand(.18, .34), colors: shuffle([ctx.P.accent, ...cs]), rw: ri(8, 18) });
}
