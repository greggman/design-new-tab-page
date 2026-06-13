import { ctx, rand, ri, times, shuffle, line, mix, clamp, pick } from '../utils.js';
// Flow field: streamlines released across the canvas, each stepping along a smooth sine-driven
// vector field, so the strokes comb into swirling currents. Coherent direction, organic motion.
export default function flowField() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), lines = ri(36, 70), steps = ri(16, 30);
  const stepLen = ctx.S * rand(.012, .024), thick = Math.max(1, ctx.S * .0024);
  const sc = rand(2, 5) / Math.max(ctx.W, ctx.H), ph = rand(0, 6.28), swirl = rand(.5, 1.8);
  const grad = t => { const n = cs.length - 1, f = clamp(t, 0, .999) * n, i = Math.floor(f); return mix(cs[i], cs[i + 1], f - i); };
  const angAt = (x, y) => (Math.sin(x * sc + ph) + Math.cos(y * sc * 1.3 + ph * 1.4)) * Math.PI * swirl;
  times(lines, () => {
    let x = rand(-.05, 1.05) * ctx.W, y = rand(-.05, 1.05) * ctx.H;
    const col = grad(clamp(y / ctx.H, 0, 1));
    times(steps, () => {
      const a = angAt(x, y), nx = x + Math.cos(a) * stepLen, ny = y + Math.sin(a) * stepLen;
      line({ x: (x + nx) / 2, y: (y + ny) / 2, len: stepLen + 1, rot: a * 57.2958, thick, color: col, z: 1 });
      x = nx; y = ny;
    });
  });
}
