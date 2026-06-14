import { ctx, rand, ri, times, shuffle, box, stripe, CLIPS, pick, mix, chance, choice } from '../utils.js';
// Dazzle: razzle-dazzle camouflage — overlapping high-contrast stripe gratings at clashing angles
// plus a few bold angular shapes, designed to disrupt the eye and break up the form. Full bleed.
export default function dazzle() {
  const cs = shuffle([ctx.P.ink, ...ctx.POOL, ctx.P.accent]), D = Math.hypot(ctx.W, ctx.H) * 1.5;
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: pick(cs), z: -1 });
  times(ri(3, 6), () => stripe({ x: ctx.W / 2, y: ctx.H / 2, w: D, h: D, rot: rand(0, 180), color: pick(cs), lw: ri(10, 32), gap: ri(10, 34) }));
  times(ri(2, 5), () => box({ x: rand(.1, .9) * ctx.W, y: rand(.1, .9) * ctx.H, w: ctx.S * rand(.3, .7), h: ctx.S * rand(.12, .42), color: pick(cs), rot: choice([0, 30, 45, 90, 120, 135]), clip: chance(.5) ? CLIPS.chevron : 'none', z: 1 }));
}
