import { ctx, ri, rand, times, shuffle, box, mix, chance, pick } from '../utils.js';
// Warped checker: a checkerboard on a non-uniform grid whose row and column widths swell and shrink
// by a sine. The regular pattern bending over an invisible bulge is the core op-art illusion.
export default function checkerWarp() {
  const cols = ri(8, 16), rows = ri(6, 12), cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const a = cs[0], b = cs[1] || mix(a, ctx.P.bg, .5), grad = chance(.4);
  const edges = (count, total, ph, k) => {
    const w = []; let sum = 0;
    for (let i = 0; i < count; i++) { const v = 1 + .82 * Math.sin(i / count * Math.PI * 2 + ph); w.push(v); sum += v; }
    const e = [0]; let acc = 0; for (let i = 0; i < count; i++) { acc += w[i] / sum * total; e.push(acc); } return e;
  };
  const xs = edges(cols, ctx.W, rand(0, 6.28)), ys = edges(rows, ctx.H, rand(0, 6.28));
  times(rows, r => times(cols, c => {
    const x0 = xs[c], x1 = xs[c + 1], y0 = ys[r], y1 = ys[r + 1];
    const col = grad ? mix(a, b, (c / cols + r / rows) / 2) : ((r + c) % 2 ? a : b);
    box({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0 + 1, h: y1 - y0 + 1, color: col });
  }));
}
