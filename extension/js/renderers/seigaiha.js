import { ctx, rand, times, shuffle, rings, group } from '../utils.js';
// Seigaiha: the traditional overlapping wave-scale pattern. Offset rows of concentric arcs, drawn
// top-to-bottom so each row overlaps the one above — interlocking repetition, fan after fan. The whole
// field is rotated to a random angle so the fans don't always open the same way; the grid is generated
// over the rotated viewport's bounding box so the corners stay covered after the rotation.
export default function seigaiha() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const r = ctx.S * rand(.1, .16), sy = r * rand(.5, .68);
  const angle = rand(0, 360), a = angle * Math.PI / 180, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
  const cx = ctx.W / 2, cy = ctx.H / 2;
  // half-extents of the axis-aligned box that, once rotated by `angle`, still contains the whole viewport
  const hw = (ctx.W / 2) * c + (ctx.H / 2) * s + r * 2, hh = (ctx.W / 2) * s + (ctx.H / 2) * c + sy * 2;
  const x0 = cx - hw, y0 = cy - hh;
  const cols = Math.ceil(2 * hw / r) + 2, rows = Math.ceil(2 * hh / sy) + 2;
  group({ position: 'absolute', left: '0px', top: '0px', width: ctx.W + 'px', height: ctx.H + 'px', transformOrigin: '50% 50%', transform: `rotate(${angle}deg)` }, null, null, () => {
    times(rows, R => times(cols, C => {
      const x = x0 + C * r + (R % 2 ? r / 2 : 0), y = y0 + R * sy;
      rings({ x, y, r, colors: cs, rw: r * rand(.14, .2) });
    }));
  });
}
