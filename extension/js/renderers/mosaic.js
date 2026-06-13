import { ctx, ri, rand, times, shuffle, box, circle, mix, pick, chance, clamp } from '../utils.js';
// Mosaic: square and round tiles set with a thin dark grout showing between them. The visible
// grout lines and slightly rounded tiles read as hand-laid ceramic rather than a flat grid.
export default function mosaic() {
  const cols = ri(8, 16), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw), cs = shuffle([...ctx.POOL, ctx.P.accent]);
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: mix(ctx.P.bg, ctx.P.ink, .5), z: -1 });
  const cpol = pick(['random', 'gradient', 'gradient']), g = cw * rand(.1, .18);
  const grad = t => { const n = cs.length - 1, f = clamp(t, 0, .999) * n, i = Math.floor(f); return mix(cs[i], cs[i + 1], f - i); };
  times(rows, r => times(cols, c => {
    const x = (c + .5) * cw, y = (r + .5) * cw, col = cpol === 'gradient' ? grad((c / cols + r / rows) / 2) : pick(cs);
    if (chance(.13)) circle({ x, y, w: cw - g, h: cw - g, color: col });
    else box({ x, y, w: cw - g, h: cw - g, color: col, radius: chance(.25) ? cw * .16 : 0 });
  }));
}
