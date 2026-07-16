import { ctx, rand, ri, shuffle, svgRoot, mix } from '../utils.js';
// Lissajous: a harmonograph ribbon. One oscilloscope figure (sines at an integer frequency ratio) is
// redrawn many times with the phase creeping between copies, so the family fans out into a woven moiré
// envelope — string-art of a figure turning through itself. Thin flat lines, a colour gradient across the
// sweep, centred with margin so the whole figure reads as one clean shape rather than clipping the frame.
export default function lissajous() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const s = svgRoot(), f = v => (+v).toFixed(1), cx = ctx.W / 2, cy = ctx.H / 2;
  const A = ctx.W * rand(.33, .4), B = ctx.H * rand(.33, .4);            // margin: never reaches the edges
  let a = ri(1, 4), b = ri(1, 4); if (a === b) b = b % 4 + 1;            // avoid a==b (degenerate ellipse/line)
  const delta0 = rand(0, Math.PI), K = ri(16, 30), spread = Math.PI * rand(.5, 1) / Math.max(a, b);
  const c1 = cs[0], c2 = cs[1 % cs.length] || cs[0], w = Math.max(1.2, ctx.S * rand(.0026, .0044)), N = 360;
  for (let kk = 0; kk < K; kk++) {
    const u = kk / (K - 1 || 1), delta = delta0 + (u - .5) * spread;     // phase creeps across the family
    let d = '';
    for (let i = 0; i <= N; i++) { const t = i / N * 2 * Math.PI; d += (i ? ' L ' : 'M ') + f(cx + A * Math.sin(a * t + delta)) + ' ' + f(cy + B * Math.sin(b * t)); }
    s.node('path', { d: d + ' Z', fill: 'none', stroke: mix(c1, c2, u), 'stroke-width': f(w), 'stroke-linecap': 'round', opacity: .9 });
  }
}
