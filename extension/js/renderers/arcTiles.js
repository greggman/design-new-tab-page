import { ctx, ri, rand, times, shuffle, box, chance, rawCornerArc } from '../utils.js';
// Arc tiles: the curved Truchet — each cell carries nested quarter-arcs in two opposite corners,
// randomly oriented. The arcs chain across cells into flowing rainbow ribbons.
export default function arcTiles() {
  const cols = ri(4, 9), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw), cs = shuffle([...ctx.POOL, ctx.P.accent]), bands = ri(2, 4);
  times(rows, r => times(cols, c => {
    const X = c * cw, Y = r * cw, t = cw;
    box({ x: X + t / 2, y: Y + t / 2, w: t + 1, h: t + 1, color: cs[0] });
    const corners = chance(.5) ? [[X, Y, 0], [X + t, Y + t, 2]] : [[X + t, Y, 1], [X, Y + t, 3]];
    corners.forEach(([px, py, ci]) => times(bands, b => rawCornerArc(px, py, t / 2 * (1 - b / bands), cs[(b + 1) % cs.length], ci, b + 1)));
  }));
}
