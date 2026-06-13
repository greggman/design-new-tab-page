import { ctx, rand, ri, times, shuffle, box, ring, circle, mix, chance } from '../utils.js';
// Wireframe tunnel: concentric square or circle outlines shrinking toward a vanishing point, each
// rotated a touch more than the last, so the stack spirals into a vortex. Pure 90s demoscene depth.
export default function wireframeTunnel() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const cx = ctx.W / 2 + rand(-.06, .06) * ctx.W, cy = ctx.H / 2 + rand(-.06, .06) * ctx.H;
  const n = ri(14, 26), poly = chance(.5), maxR = Math.hypot(ctx.W, ctx.H) * .62, twist = rand(2, 11) * (chance(.5) ? 1 : -1), lw = Math.max(1.5, ctx.S * .004);
  times(n, i => {
    const t = i / n, r = maxR * Math.pow(1 - t, 1.7), col = mix(cs[0], cs[cs.length - 1], t);
    if (poly) box({ x: cx, y: cy, w: r * 2, h: r * 2, color: 'transparent', border: `${lw}px solid ${col}`, rot: i * twist, z: i });
    else ring({ x: cx, y: cy, d: r * 2, w: lw, color: col, z: i });
  });
  circle({ x: cx, y: cy, w: ctx.S * rand(.03, .07), h: ctx.S * rand(.03, .07), color: ctx.P.accent, z: n + 1 });
}
