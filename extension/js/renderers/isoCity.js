import { ctx, rand, ri, times, shuffle, box, mix, pick, chance } from '../utils.js';
// Iso city: an isometric grid of extruded blocks at varying heights — a skyline / 3D bar chart.
// Three shaded faces per block plus strict back-to-front draw order give convincing solid depth.
export default function isoCity() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]), gx = ri(5, 8), gy = ri(5, 8);
  const s = ctx.S * rand(.1, .16), hw = s / 2, qh = s / 4, ox = ctx.W / 2, oy = ctx.H * rand(.16, .3);
  const pct = p => `${(p[0] / ctx.W * 100).toFixed(2)}% ${(p[1] / ctx.H * 100).toFixed(2)}%`;
  const poly = (pts, color, z) => box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color, clip: `polygon(${pts.map(pct).join(',')})`, z });
  const cells = []; times(gy, j => times(gx, i => cells.push([i, j])));
  cells.sort((A, B) => (A[0] + A[1]) - (B[0] + B[1]));
  cells.forEach(([i, j], idx) => {
    const cx = ox + (i - j) * hw, cy = oy + (i + j) * qh, base = pick(cs), H = ctx.S * rand(.03, .42), ty = cy - H;
    poly([[cx - hw, ty], [cx, ty + qh], [cx, cy + qh], [cx - hw, cy]], mix(base, '#000000', .34), idx);              // left
    poly([[cx, ty + qh], [cx + hw, ty], [cx + hw, cy], [cx, cy + qh]], mix(base, '#000000', .12), idx);              // right
    poly([[cx, ty - qh], [cx + hw, ty], [cx, ty + qh], [cx - hw, ty]], mix(base, '#ffffff', .2), idx);               // top
  });
}
