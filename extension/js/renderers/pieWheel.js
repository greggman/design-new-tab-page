import { ctx, thirds, shuffle, rand, ri, wedge, circle, chance, times } from '../utils.js';
export default function pieWheel() {
  const [fx, fy] = thirds(), cs = shuffle([...ctx.POOL, ctx.P.accent]), seg = ri(5, 12), r = ctx.S * rand(.4, .6), off = rand(0, 360);
  times(seg, i => wedge({ x: fx, y: fy, r, color: cs[i % cs.length], start: off + i * 360 / seg, sweep: 360 / seg, z: i }));
  if (chance(.6)) circle({ x: fx, y: fy, w: r * rand(.3, .5), h: r * rand(.3, .5), color: ctx.P.bg, z: seg + 1 });
}
