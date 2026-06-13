import { ctx, rand, shuffle, ri, times, ring, shape, chance, mix, pick } from '../utils.js';
export default function orbit() {
  const [cx, cy] = [ctx.W / 2 + rand(-.08, .08) * ctx.W, ctx.H / 2 + rand(-.08, .08) * ctx.H], cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const orbits = ri(1, 3);
  times(orbits, o => { const R = ctx.S * (.16 + o * .14), n = ri(5, 11), off = rand(0, 6.28), sz = ctx.S * rand(.05, .1); if (chance(.6)) ring({ x: cx, y: cy, d: R * 2, w: ri(2, 5), color: mix(ctx.P.ink, ctx.P.bg, .5), z: 0 }); times(n, i => { const ang = off + i / n * 6.28; shape(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, sz, ctx.POOL, { kind: pick(['circle', 'diamond', 'triangle', 'square']), color: cs[(o + i) % cs.length], rot: ang * 57.3 }); }); });
  shape(cx, cy, ctx.S * rand(.16, .26), cs, { kind: pick(['circle', 'rings', 'donut', 'star', 'hexagon']), color: ctx.P.accent });
}
