import { ctx, ri, rand, times, shuffle, box, mix, chance, pick } from '../utils.js';
// Basketweave: cells alternate horizontal and vertical slats over a recessed groove, like a woven
// mat. The alternating direction creates an over-under rhythm that implies real depth.
export default function weave() {
  const cols = ri(4, 9), unit = ctx.W / cols, rows = Math.ceil(ctx.H / unit), cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const a = cs[0], b = cs[1] || mix(a, ctx.P.ink, .35), groove = mix(ctx.P.bg, ctx.P.ink, .25), slats = ri(2, 4);
  times(rows, r => times(cols, c => {
    const x = (c + .5) * unit, y = (r + .5) * unit, horiz = (r + c) % 2 === 0;
    box({ x, y, w: unit + 1, h: unit + 1, color: groove });
    times(slats, k => {
      const t = (k + .5) / slats, col = k % 2 ? a : b;
      if (horiz) box({ x, y: (r + t) * unit, w: unit * .94, h: unit / slats * .78, color: col });
      else box({ x: (c + t) * unit, y, w: unit / slats * .78, h: unit * .94, color: col });
    });
  }));
}
