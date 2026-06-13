import { ctx, rand, choice, pick, times, rings, shape, circle, chance, shuffle } from '../utils.js';
export default function pinwheel() {
  const cx = ctx.W / 2 + rand(-.06, .06) * ctx.W, cy = ctx.H / 2 + rand(-.06, .06) * ctx.H, cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const reps = choice([4, 5, 6, 8]), R = ctx.S * rand(.3, .46), mk = pick(['triangle', 'kite', 'wedge', 'diamond', 'chevron', 'trapezoid']);
  times(reps, i => { const ang = i / reps * 360, rr = R * rand(.5, .85); shape(cx + Math.cos(ang * Math.PI / 180) * rr, cy + Math.sin(ang * Math.PI / 180) * rr, R * rand(.5, .8), ctx.POOL, { kind: mk, color: cs[i % cs.length], rot: ang + 90 }); });
  if (chance(.7)) rings({ x: cx, y: cy, r: R * rand(.25, .4), colors: shuffle(cs) });
  if (chance(.5)) circle({ x: cx, y: cy, w: R * rand(.3, .5), h: R * rand(.3, .5), color: ctx.P.accent, z: 50 });
}
