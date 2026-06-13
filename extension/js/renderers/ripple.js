import { ctx, rand, ri, times, shuffle, ring, circle, chance, choice } from '../utils.js';
// Ripple: full-bleed concentric rings spreading from an off-center point. Either open rings or
// solid alternating discs — the off-center origin makes the radial field feel dynamic, not static.
export default function ripple() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const x = choice([.15, .3, .5, .7, .85]) * ctx.W, y = choice([.15, .3, .5, .7, .85]) * ctx.H;
  const maxR = Math.hypot(Math.max(x, ctx.W - x), Math.max(y, ctx.H - y)) * 1.05;
  const gap = ctx.S * rand(.035, .065), n = Math.ceil(maxR / gap) + 1, filled = chance(.5);
  if (filled) for (let i = n; i >= 1; i--) circle({ x, y, w: i * gap * 2, h: i * gap * 2, color: cs[i % cs.length], z: n - i });
  else times(n, i => ring({ x, y, d: (i + 1) * gap * 2, w: Math.max(2, gap * rand(.3, .5)), color: cs[i % cs.length] }));
}
