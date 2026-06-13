import { ctx, rand, ri, times, shuffle, line, circle, ring, el, mix, chance, choice, pick, thirds } from '../utils.js';
// Star flare: a lens flare — bold anamorphic streaks, a fan of fine rays, a blown-out core glow, and
// ghost rings strung along the flare axis. The cinematic "lens hit" that lit up trance covers.
export default function starFlare() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), [fx, fy] = chance(.5) ? [ctx.W / 2, ctx.H / 2] : thirds();
  const span = Math.hypot(ctx.W, ctx.H), ax = rand(0, 180), acc = ctx.P.accent;
  [0, 90, 45].slice(0, choice([2, 3])).forEach(o => line({ x: fx, y: fy, len: span * 1.6, rot: ax + o, thick: Math.max(2, ctx.S * rand(.004, .009)), color: acc, z: 3 }));
  times(ri(16, 30), () => line({ x: fx, y: fy, len: ctx.S * rand(.15, .5), rot: rand(0, 360), thick: rand(1, 3), color: mix(acc, ctx.P.bg, rand(0, .55)), z: 2 }));
  const g = ctx.S * rand(.18, .32);
  el({ left: fx + 'px', top: fy + 'px', width: g + 'px', height: g + 'px', borderRadius: '50%', background: `radial-gradient(circle, ${mix(acc, '#ffffff', .4)} 0%, transparent 65%)`, mixBlendMode: 'screen', zIndex: 4 }, 'translate(-50%,-50%) scale(.6)', 'translate(-50%,-50%)');
  const ar = ax * Math.PI / 180;
  times(ri(3, 6), () => { const t = rand(-1, 1), x = fx + Math.cos(ar) * t * span * .4, y = fy + Math.sin(ar) * t * span * .4, d = ctx.S * rand(.03, .1); chance(.5) ? ring({ x, y, d, w: Math.max(2, ctx.S * .004), color: mix(pick(cs), ctx.P.bg, .2), z: 2 }) : circle({ x, y, w: d, h: d, color: mix(pick(cs), ctx.P.bg, .35), z: 2 }); });
}
