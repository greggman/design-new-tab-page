import { ctx, rand, ri, times, shuffle, circle, line, pick, mix } from '../utils.js';
// Constellation: scattered nodes linked to their nearest neighbors by thin lines. A network graph
// as composition — dots are accents, the connecting lines carry the eye between them.
export default function constellation() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), n = ri(9, 18), pts = [];
  times(n, () => pts.push([rand(.07, .93) * ctx.W, rand(.08, .92) * ctx.H]));
  const lineCol = mix(ctx.P.ink, ctx.P.bg, .42), thick = Math.max(1.5, ctx.S * .0025);
  pts.forEach((p, i) => {
    const near = pts.map((q, j) => [Math.hypot(p[0] - q[0], p[1] - q[1]), j]).filter(d => d[1] !== i).sort((a, b) => a[0] - b[0]);
    const k = ri(1, 2);
    for (let m = 0; m < k && m < near.length; m++) {
      const q = pts[near[m][1]], dx = q[0] - p[0], dy = q[1] - p[1];
      line({ x: (p[0] + q[0]) / 2, y: (p[1] + q[1]) / 2, len: Math.hypot(dx, dy), rot: Math.atan2(dy, dx) * 57.2958, thick, color: lineCol, z: 1 });
    }
  });
  pts.forEach(p => { const d = ctx.S * rand(.018, .045); circle({ x: p[0], y: p[1], w: d, h: d, color: pick(cs), z: 2 }); });
}
