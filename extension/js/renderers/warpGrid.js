import { ctx, rand, ri, times, shuffle, line, circle, mix, clamp, chance } from '../utils.js';
// Warp grid: a graph-paper lattice bulged outward by a lens function, so the straight rules curve
// around an invisible sphere. The line-art cousin of the dot sphere — pure op-art volume.
export default function warpGrid() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), n = ri(10, 18), seg = 40;
  const cx = ctx.W / 2 + rand(-.05, .05) * ctx.W, cy = ctx.H / 2 + rand(-.05, .05) * ctx.H;
  const R = Math.min(ctx.W, ctx.H) * rand(.42, .55), push = rand(.45, .9), thick = Math.max(1.5, ctx.S * .0026), col = cs[0];
  const warp = (x, y) => { const dx = x - cx, dy = y - cy, t = clamp(Math.hypot(dx, dy) / R, 0, 1), k = 1 + push * (1 - t) * (1 - t); return [cx + dx * k, cy + dy * k]; };
  const polyline = pts => { for (let i = 1; i < pts.length; i++) { const A = pts[i - 1], B = pts[i], dx = B[0] - A[0], dy = B[1] - A[1]; line({ x: (A[0] + B[0]) / 2, y: (A[1] + B[1]) / 2, len: Math.hypot(dx, dy) + 1, rot: Math.atan2(dy, dx) * 57.2958, thick, color: col, z: 1 }); } };
  times(n + 1, i => { const gx = i / n * ctx.W, pts = []; times(seg + 1, k => pts.push(warp(gx, k / seg * ctx.H))); polyline(pts); });
  times(n + 1, i => { const gy = i / n * ctx.H, pts = []; times(seg + 1, k => pts.push(warp(k / seg * ctx.W, gy))); polyline(pts); });
  if (chance(.6)) circle({ x: cx, y: cy, w: ctx.S * .04, h: ctx.S * .04, color: ctx.P.accent, z: 2 });
}
