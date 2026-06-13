import { ctx, ri, rand, times, shuffle, stripe, box, mix, choice, chance } from '../utils.js';
// Column stripes: the canvas split into vertical columns, each a flat field overlaid with fine
// stripes running horizontal or vertical. Alternating stripe direction sets up a woven rhythm.
export default function columnStripes() {
  const cols = ri(3, 7), cw = ctx.W / cols, cs = shuffle([...ctx.POOL, ctx.P.accent]), altDir = chance(.6);
  times(cols, c => {
    const base = cs[c % cs.length];
    box({ x: (c + .5) * cw, y: ctx.H / 2, w: cw, h: ctx.H, color: mix(base, ctx.P.bg, .16) });
    stripe({ x: (c + .5) * cw, y: ctx.H / 2, w: cw, h: ctx.H, rot: altDir ? (c % 2 ? 90 : 0) : choice([0, 90]), color: mix(base, ctx.P.ink, .32), lw: ri(4, 13), gap: ri(8, 26) });
  });
}
