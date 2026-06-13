import { ctx, rand, times, shuffle, rings } from '../utils.js';
// Seigaiha: the traditional overlapping wave-scale pattern. Offset rows of concentric arcs, drawn
// top-to-bottom so each row overlaps the one above — interlocking repetition, fan after fan.
export default function seigaiha() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const r = ctx.S * rand(.1, .16), sy = r * rand(.5, .68);
  const cols = Math.ceil(ctx.W / r) + 2, rows = Math.ceil(ctx.H / sy) + 2;
  times(rows, R => times(cols, C => {
    const x = C * r + (R % 2 ? r / 2 : 0), y = R * sy;
    rings({ x, y, r, colors: cs, rw: r * rand(.14, .2) });
  }));
}
