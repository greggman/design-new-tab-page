import { ctx, shuffle, ri, stripe, chance, box, thirds, shape, mix, pick, rand, blendMode } from '../utils.js';
export default function crossHatch() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]), layers = ri(2, 4), angles = shuffle([0, 90, 45, 135, 30, 120]).slice(0, layers), D = Math.hypot(ctx.W, ctx.H) * 1.2;
  if (chance(.5)) box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: mix(ctx.P.bg, pick(cs), .15), z: -1 });
  angles.forEach((a, i) => stripe({ x: ctx.W / 2, y: ctx.H / 2, w: D, h: D, rot: a, color: cs[i % cs.length], lw: ri(6, 18), gap: ri(18, 46) }));
  if (chance(.6)) { const [fx, fy] = thirds(); shape(fx, fy, ctx.S * rand(.2, .36), cs, { kind: pick(['circle', 'diamond', 'square']), blend: blendMode() }); }
}
