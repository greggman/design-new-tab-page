import { ctx, rand, ri, shuffle, chance, svgRoot, smoothPath, mix, clamp } from '../utils.js';
// Flow field: streamlines released across the canvas, each stepping along a smooth sine-driven vector field,
// so the strokes comb into swirling currents.
//
// One <path> per streamline, smoothed through the midpoints of its steps. The old version emitted one
// absolutely-positioned div PER STEP — around 1100 of them — and that had two costs. The obvious one is a
// thousand-odd elements to style, lay out and raster. The subtler one is that it can't actually draw a
// curve: each step is a separate straight rectangle with square ends, so a streamline read as a chain of
// vector segments with visible joints rather than a continuous line. A path fixes both, and because a path
// costs the same whether it carries ten points or a hundred, the steps can also be smaller and the lines
// longer than they could be before.
export default function flowField() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const svg = svgRoot();
  const lines = ri(70, 150), steps = ri(40, 90);          // far more, and longer, than the div version could afford
  const stepLen = ctx.S * rand(.006, .013);
  const sc = rand(2, 5) / Math.max(ctx.W, ctx.H), ph = rand(0, 6.28), swirl = rand(.5, 1.8);
  const w0 = ctx.S * rand(.0016, .0032), vary = chance(.6);
  const grad = t => { const n = cs.length - 1, f = clamp(t, 0, .999) * n, i = Math.floor(f); return mix(cs[i], cs[i + 1], f - i); };
  const angAt = (x, y) => (Math.sin(x * sc + ph) + Math.cos(y * sc * 1.3 + ph * 1.4)) * Math.PI * swirl;
  for (let l = 0; l < lines; l++) {
    let x = rand(-.08, 1.08) * ctx.W, y = rand(-.08, 1.08) * ctx.H;
    const P = [[x, y]];
    for (let s = 0; s < steps; s++) {
      const a = angAt(x, y);
      x += Math.cos(a) * stepLen; y += Math.sin(a) * stepLen;
      P.push([x, y]);
    }
    svg.node('path', {
      d: smoothPath(P), fill: 'transparent', stroke: grad(clamp(P[0][1] / ctx.H, 0, 1)),
      'stroke-width': Math.max(.6, w0 * (vary ? rand(.5, 1.9) : 1)),
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: rand(.55, .95),
    });
  }
}
