import { ctx, ri, rand, times, shuffle, line, mix, chance } from '../utils.js';
// Contour lines: stacked horizontal lines warped by a shared sine, like a topographic map or a
// raked-sand garden. Smooth parallel curves read as a single continuous surface.
export default function contourLines() {
  const n = ri(10, 18), seg = ri(44, 72), cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const amp = ctx.H * rand(.02, .06), freq = rand(1, 3) * Math.PI * 2 / ctx.W;
  const phase0 = rand(0, 6.28), dphase = rand(.15, .55), thick = Math.max(1.5, ctx.S * rand(.0022, .0055));
  times(n, i => {
    const y0 = (i + .5) / n * ctx.H, ph = phase0 + i * dphase, col = mix(cs[0], cs[cs.length - 1], i / n);
    let px = 0, py = y0 + amp * Math.sin(ph);
    times(seg, s => {
      const x = (s + 1) / seg * ctx.W, y = y0 + amp * Math.sin(freq * x + ph), dx = x - px, dy = y - py;
      line({ x: (px + x) / 2, y: (py + y) / 2, len: Math.hypot(dx, dy) + 1, rot: Math.atan2(dy, dx) * 57.2958, thick, color: col, z: 1 });
      px = x; py = y;
    });
  });
}
