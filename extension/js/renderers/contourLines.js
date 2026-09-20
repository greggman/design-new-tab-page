import { ctx, ri, rand, shuffle, mix, chance, svgRoot, smoothPath, rrange } from '../utils.js';
// Contour lines: stacked horizontal lines warped by a shared sine, like a topographic map or a
// raked-sand garden. Smooth parallel curves read as a single continuous surface.
export default function contourLines() {
  const n = ri(10, 18), seg = ri(44, 72), cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const amp = ctx.H * rand(.02, .06), freq = rand(1, 3) * Math.PI * 2 / ctx.W;
  const phase0 = rand(0, 6.28), dphase = rand(.15, .55), thick = Math.max(1.5, ctx.S * rand(.0022, .055));
  const svg = svgRoot(), rtl = chance(.5);   // one SVG path per line; they draw on left→right or right→left
  svg.style.zIndex = 1;
  rrange(0, n, i => {
    const y0 = (i + .5) / n * ctx.H, ph = phase0 + i * dphase, col = mix(cs[0], cs[cs.length - 1], i / n);
    // sample a little past both edges so the line's ends are never visible
    const pts = [];
    for (let s = -1; s <= seg + 1; s++) { const x = s / seg * ctx.W; pts.push([x, y0 + amp * Math.sin(freq * x + ph)]); }
    if (rtl) pts.reverse();
    svg.node('path', { d: smoothPath(pts), fill: 'none', stroke: col, 'stroke-width': thick.toFixed(2) });
  });
}
