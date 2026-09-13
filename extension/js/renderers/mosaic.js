import { ctx, ri, rand, box, circle, mix, pick, chance, clamp, groundScheme, oneSide, grid } from '../utils.js';
// Mosaic: square and round tiles set with grout showing between them. The visible grout lines and slightly
// rounded tiles read as hand-laid ceramic rather than a flat grid.
//
// The grout is the ground: any palette hue at any lightness, with the tiles made to read against it. It used to
// be bg mixed halfway to ink — the same mid-grey on every palette, which gradient tiles passing through a
// greyish mix would fade straight into.
export default function mosaic() {
  const { ground, fg } = groundScheme();
  const cols = ri(8, 16), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw);
  const cpol = pick(['random', 'gradient', 'gradient']), g = cw * rand(.1, .18);
  // a gradient mixes between colours, so they all go to one side of the grout's lightness — see oneSide()
  const cs = cpol === 'gradient' ? oneSide(fg, ground) : fg;
  const grad = t => { const n = cs.length - 1, f = clamp(t, 0, .999) * n, i = Math.floor(f); return mix(cs[i], cs[i + 1], f - i); };
  grid(cols, rows, (c, r) => {
    const x = (c + .5) * cw, y = (r + .5) * cw, col = cpol === 'gradient' ? grad((c / cols + r / rows) / 2) : pick(cs);
    if (chance(.13)) circle({ x, y, w: cw - g, h: cw - g, color: col });
    else box({ x, y, w: cw - g, h: cw - g, color: col, radius: chance(.25) ? cw * .16 : 0 });
  });
}
