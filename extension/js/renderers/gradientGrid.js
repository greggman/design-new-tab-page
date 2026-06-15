import { ctx, ri, clamp, rand, times, shuffle, box, mix, chance } from '../utils.js';
// Gradient grid: a field of flat tiles bilinearly interpolated between four corner colors. A pure
// color study — adjacent low-contrast steps blend into a smooth wash while staying crisply gridded.
export default function gradientGrid() {
  const h = ri(4, 10) / 10;
  const w = ri(4, 10) / 10;
  const rot = rand(0, 9) * 10;
  const cols = ri(6, 14), rows = clamp(Math.round(cols * ctx.H / ctx.W), 5, 12), cw = ctx.W / cols, ch = ctx.H / rows, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const c00 = cs[0], c10 = cs[1 % cs.length], c01 = cs[2 % cs.length] || cs[0], c11 = cs[3 % cs.length] || cs[1 % cs.length];
  times(rows, r => times(cols, c => {
    const u = cols > 1 ? c / (cols - 1) : 0, v = rows > 1 ? r / (rows - 1) : 0;
    const col = mix(mix(c00, c10, u), mix(c01, c11, u), v);
    box({ x: (c + .5) * cw, y: (r + .5) * ch, w: cw * w + 1, h: ch * h + 1, color: col, rot });
  }));
}
