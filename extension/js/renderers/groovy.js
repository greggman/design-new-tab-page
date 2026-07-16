import { ctx, ri, rand, shuffle, pick, svgRoot, mix } from '../utils.js';
// Groovy: smooth, large, flowing waves of solid colour. Bands share one big low-frequency wave (so the
// whole field undulates together), and each band's thickness swells and pinches along x — deep enough
// that ribbons taper to nothing and re-emerge, giving the flowing, weaving 70s look. SVG filled bands.
export default function groovy() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent, ctx.P.ink]);
  while (cs.length < 5) cs.push(mix(pick(cs), pick(cs), .5));
  const s = svgRoot(), f = v => (+v).toFixed(1);
  const a1 = ctx.H * rand(.25, .45), a2 = a1 * rand(.25, .55);
  const k1 = rand(1, 2) * 2 * Math.PI / ctx.W, k2 = rand(2, 3.5) * 2 * Math.PI / ctx.W, p1 = rand(0, 6.28), p2 = rand(0, 6.28);
  const flow = x => a1 * Math.sin(k1 * x + p1) + a2 * Math.sin(k2 * x + p2), maxFlow = a1 + a2;
  const N = ri(7, 13), total = ctx.H + 4 * maxFlow + ctx.H * .4, bands = [];
  for (let i = 0; i < N; i++) bands.push({ base: total / N * rand(.55, 1.6), m: rand(.4, .9), k: rand(.8, 2.4) * 2 * Math.PI / ctx.W, p: rand(0, 6.28), col: cs[i % cs.length] });
  const fac = total / bands.reduce((a, b) => a + b.base, 0);
  bands.forEach(b => b.base *= fac);
  const th = (b, x) => Math.max(0, b.base * (1 + b.m * Math.sin(b.k * x + b.p)));
  const SAMP = 110, xs = [];
  for (let j = 0; j <= SAMP; j++) xs.push(j / SAMP * ctx.W);
  let topY = xs.map(x => flow(x) - 2 * maxFlow - ctx.H * .2);
  for (const b of bands) {
    const botY = xs.map((x, j) => topY[j] + th(b, x));
    let d = `M ${f(xs[0])} ${f(topY[0])}`;
    for (let j = 1; j <= SAMP; j++) d += ` L ${f(xs[j])} ${f(topY[j])}`;
    for (let j = SAMP; j >= 0; j--) d += ` L ${f(xs[j])} ${f(botY[j])}`;
    s.node('path', { d: d + ' Z', fill: b.col });
    topY = botY;
  }
}
