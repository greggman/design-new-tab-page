import { ctx, ri, clamp, rand, times, shuffle, box, mix, chance } from '../utils.js';
// Low-poly: a jittered point grid triangulated into facets, each shaded by a bilinear color gradient
// (with occasional light/dark facet variation). The crystalline gradient-mesh look of 2010s wallpaper.
export default function lowPoly() {
  const cols = ri(5, 9), rows = clamp(Math.round(cols * ctx.H / ctx.W), 4, 8), cw = ctx.W / cols, ch = ctx.H / rows, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const c00 = cs[0], c10 = cs[1 % cs.length], c01 = cs[2 % cs.length] || cs[0], c11 = cs[3 % cs.length] || cs[1 % cs.length];
  const colAt = (u, v) => mix(mix(c00, c10, u), mix(c01, c11, u), v);
  const P = [];
  for (let r = 0; r <= rows; r++) { P[r] = []; for (let c = 0; c <= cols; c++) {
    let x = c * cw, y = r * ch;
    if (c > 0 && c < cols) x += rand(-.38, .38) * cw;
    if (r > 0 && r < rows) y += rand(-.38, .38) * ch;
    P[r][c] = [x, y];
  } }
  const pct = p => `${(p[0] / ctx.W * 100).toFixed(2)}% ${(p[1] / ctx.H * 100).toFixed(2)}%`;
  const tri = (a, b, c, u, v) => box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: mix(colAt(u, v), chance(.5) ? '#ffffff' : '#000000', chance(.4) ? rand(0, .14) : 0), clip: `polygon(${pct(a)},${pct(b)},${pct(c)})` });
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const u = (c + .5) / cols, v = (r + .5) / rows, A = P[r][c], B = P[r][c + 1], C = P[r + 1][c + 1], D = P[r + 1][c];
    if (chance(.5)) { tri(A, B, C, u, v); tri(A, C, D, u, v); } else { tri(A, B, D, u, v); tri(B, C, D, u, v); }
  }
}
