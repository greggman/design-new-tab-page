import { ctx, ri, rand, times, shuffle, pick, chance, box, svgRoot, mix } from '../utils.js';
// Blobs + scribbles: scattered organic blobs (smooth closed bézier shapes) on a light ground, some
// with a concentric inner outline, plus single-line spiral scribbles and little dash clusters. SVG.
function blob(cx, cy, r, wob, n) {
  const p = [];
  for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI, rr = r * (1 + rand(-wob, wob)); p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  const mid = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
  let d = `M ${mid(p[n - 1], p[0]).map(v => v.toFixed(1)).join(' ')}`;
  for (let i = 0; i < n; i++) { const m = mid(p[i], p[(i + 1) % n]); d += ` Q ${p[i][0].toFixed(1)} ${p[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`; }
  return d + ' Z';
}
export default function blobScribble() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const bg = mix(ctx.P.bg, '#ffffff', ctx.P.dark ? .04 : .35), ink = mix(ctx.P.ink, bg, .1);
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: bg, z: -2 });
  const s = svgRoot();
  times(ri(6, 14), () => {
    const cx = rand(.1, .9) * ctx.W, cy = rand(.1, .9) * ctx.H, r = ctx.S * rand(.06, .16), col = pick(cs);
    s.node('path', { d: blob(cx, cy, r, rand(.12, .28), ri(6, 9)), fill: col });
    if (chance(.4)) s.node('path', { d: blob(cx, cy, r * rand(.5, .7), rand(.1, .2), ri(6, 9)), fill: 'none', stroke: mix(col, ctx.P.ink, .3), 'stroke-width': Math.max(1, r * .04) });
  });
  times(ri(3, 7), () => {                                  // spiral scribbles
    const cx = rand(.1, .9) * ctx.W, cy = rand(.1, .9) * ctx.H, r = ctx.S * rand(.04, .1), turns = rand(1.5, 3);
    let d = `M ${cx.toFixed(1)} ${cy.toFixed(1)}`;
    for (let i = 1; i <= 40; i++) { const t = i / 40, a = t * turns * 2 * Math.PI, rr = r * t; d += ` L ${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`; }
    s.node('path', { d, fill: 'none', stroke: ink, 'stroke-width': Math.max(1, ctx.S * .003), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  });
  if (chance(.6)) times(ri(1, 3), () => {                  // dash clusters
    const cx = rand(.1, .9) * ctx.W, cy = rand(.1, .9) * ctx.H;
    times(ri(6, 14), () => { const a = rand(0, 6.28), rr = ctx.S * rand(0, .06), x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; s.node('line', { x1: x.toFixed(1), y1: y.toFixed(1), x2: (x + rand(-6, 6)).toFixed(1), y2: (y + rand(4, 10)).toFixed(1), stroke: ink, 'stroke-width': Math.max(1, ctx.S * .002), 'stroke-linecap': 'round' }); });
  });
}
