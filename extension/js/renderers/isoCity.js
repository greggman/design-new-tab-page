import { ctx, rand, ri, times, shuffle, box, mix, pick, chance, clamp } from '../utils.js';
// Iso city: an isometric grid of extruded blocks at varying heights — a skyline / 3D bar chart.
// Three shaded faces per block plus strict back-to-front draw order give convincing solid depth.
// Heights are measured first so the whole massing is scaled to fit and centered (with a little
// drift), rather than spilling off the top.
export default function isoCity() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]), gx = ri(5, 8), gy = ri(5, 8);
  const s = ctx.S * rand(.1, .16), hw = s / 2, qh = s / 4;
  const cells = [];
  times(gy, j => times(gx, i => { if (chance(.1)) return; cells.push({ i, j, H: ctx.S * rand(.03, .42), base: pick(cs) }); }));
  if (!cells.length) cells.push({ i: 0, j: 0, H: ctx.S * .2, base: cs[0] });
  cells.sort((a, b) => (a.i + a.j) - (b.i + b.j));
  const gX = (i, j) => (i - j) * hw, gY = (i, j) => (i + j) * qh;
  // bounding box of the whole massing (footprint + tallest tops), in raw iso coords
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  cells.forEach(c => {
    const cx = gX(c.i, c.j), cy = gY(c.i, c.j);
    minX = Math.min(minX, cx - hw); maxX = Math.max(maxX, cx + hw);
    minY = Math.min(minY, cy - c.H - qh); maxY = Math.max(maxY, cy + qh);
  });
  const bw = maxX - minX, bh = maxY - minY, bcx = (minX + maxX) / 2, bcy = (minY + maxY) / 2;
  const k = Math.min(1, ctx.W * .9 / bw, ctx.H * .9 / bh);                 // scale to fit with margin
  const hW = bw * k / 2, hH = bh * k / 2;
  const tx = clamp(ctx.W / 2 + rand(-.12, .12) * ctx.W, hW, ctx.W - hW);   // center + drift, kept on-screen
  const ty = clamp(ctx.H / 2 + rand(-.1, .1) * ctx.H, hH, ctx.H - hH);
  const X = x => tx + (x - bcx) * k, Y = y => ty + (y - bcy) * k;
  const pct = p => `${(X(p[0]) / ctx.W * 100).toFixed(2)}% ${(Y(p[1]) / ctx.H * 100).toFixed(2)}%`;
  const poly = (pts, color, z) => box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color, clip: `polygon(${pts.map(pct).join(',')})`, z });
  cells.forEach((c, idx) => {
    const cx = gX(c.i, c.j), cy = gY(c.i, c.j), top = cy - c.H, base = c.base;
    poly([[cx - hw, top], [cx, top + qh], [cx, cy + qh], [cx - hw, cy]], mix(base, '#000000', .34), idx);   // left
    poly([[cx, top + qh], [cx + hw, top], [cx + hw, cy], [cx, cy + qh]], mix(base, '#000000', .12), idx);   // right
    poly([[cx, top - qh], [cx + hw, top], [cx, top + qh], [cx - hw, top]], mix(base, '#ffffff', .2), idx);  // top
  });
}
