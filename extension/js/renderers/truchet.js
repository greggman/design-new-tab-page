import { ctx, ri, rand, times, shuffle, choice, box, mix, chance, pick } from '../utils.js';
// Truchet tiles: a grid of diagonally-split squares in random orientation. Tonal two-tone field
// that reads as a flowing maze — the appeal is local contrast resolving into a global rhythm.
export default function truchet() {
  const cols = ri(5, 12), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw), cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const a = cs[0], b = cs[1] || mix(a, ctx.P.bg, .45), gradient = chance(.5);
  const tri = 'polygon(0 0,100% 0,0 100%)', rots = [0, 90, 180, 270];
  times(rows, r => times(cols, c => {
    const x = (c + .5) * cw, y = (r + .5) * cw;
    const base = gradient ? mix(a, b, (c / cols + r / rows) / 2) : a;
    box({ x, y, w: cw + 1, h: cw + 1, color: base });
    box({ x, y, w: cw + 1, h: cw + 1, color: gradient ? mix(b, a, (c / cols + r / rows) / 2) : b, clip: tri, rot: choice(rots) });
  }));
}
