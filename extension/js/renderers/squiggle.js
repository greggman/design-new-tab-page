import { ctx, ri, rand, times, shuffle, pick, box, svgRoot, mix } from '../utils.js';
// Squiggle: thick, round-capped organic lines that wander and loop across a solid ground — even
// coverage, freehand feel. A serpentine backbone (points snaking row-by-row) guarantees the coverage;
// heavy jitter + a Catmull-Rom spline turn it into smooth, varied curves with the odd loop. Not a grid
// tiling — the loop sizes and curvature deliberately vary.
function smooth(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
export default function squiggle() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const bg = pick(cs), lc = cs.find(c => c !== bg) || ctx.P.accent;
  const s = svgRoot();
  const style = pick(['loopy', 'sweep', 'wavy']);
  const rows = style === 'sweep' ? ri(2, 3) : style === 'loopy' ? ri(4, 6) : ri(5, 8);
  const cols = ri(3, 6), jx = style === 'sweep' ? .55 : .38, jy = style === 'loopy' ? .85 : .55;
  const th = ctx.S * rand(.022, .04), ribbons = ri(1, 2), rh = ctx.H / rows, cw = ctx.W / cols;
  times(ribbons, rb => {
    const pts = [];
    for (let r = 0; r < rows; r++) {
      const dir = r % 2 ? -1 : 1;
      for (let ci = 0; ci <= cols; ci++) {
        const col = dir > 0 ? ci : cols - ci;
        pts.push([col / cols * ctx.W * 1.2 - ctx.W * .1 + rand(-jx, jx) * cw, (r + .5) / rows * ctx.H + rand(-jy, jy) * rh]);
      }
    }
    s.node('path', { d: smooth(pts), fill: 'none', stroke: rb ? mix(lc, bg, .35) : lc, 'stroke-width': th, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  });
}
