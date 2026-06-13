import { ctx, rand, ri, times, shuffle, line, circle, mix, chance, pick, thirds } from '../utils.js';
// Zoom lines: ragged rays bursting from a focal point with a clear gap at the core, varied length
// and weight — manga speed-lines / warp-drive blur. Implies violent forward motion toward the eye.
export default function zoomLines() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), [fx, fy] = chance(.5) ? [ctx.W / 2, ctx.H / 2] : thirds();
  const span = Math.hypot(ctx.W, ctx.H), n = ri(60, 140);
  times(n, () => {
    const ang = rand(0, 360), inner = ctx.S * rand(.05, .22), len = span * rand(.3, .9), mid = inner + len / 2;
    line({ x: fx + Math.cos(ang * Math.PI / 180) * mid, y: fy + Math.sin(ang * Math.PI / 180) * mid, len, rot: ang, thick: rand(1, 4), color: chance(.7) ? mix(ctx.P.ink, ctx.P.bg, rand(.2, .6)) : pick(cs), z: 1 });
  });
  if (chance(.6)) circle({ x: fx, y: fy, w: ctx.S * rand(.06, .14), h: ctx.S * rand(.06, .14), color: ctx.P.accent, z: 3 });
}
