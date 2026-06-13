import { ctx, shuffle, thirds, rings, times, ri, rand, line, choice, chance } from '../utils.js';
export default function concentricCircles() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), [fx, fy] = thirds();
  rings({ x: fx, y: fy, r: ctx.S * rand(.36, .58), colors: cs });
  times(ri(1, 3), () => rings({ x: rand(.12, .88) * ctx.W, y: rand(.12, .88) * ctx.H, r: ctx.S * rand(.08, .22), colors: shuffle(cs), rw: ri(5, 12) }));
  if (chance(.5)) times(ri(1, 2), () => line({ x: rand(.3, .7) * ctx.W, y: rand(.3, .7) * ctx.H, len: Math.hypot(ctx.W, ctx.H), rot: choice([0, 90, 45, -45]), thick: ri(4, 9), color: ctx.P.ink, z: 5 }));
}
