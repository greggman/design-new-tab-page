import { ctx, rand, ri, clamp, times, shuffle, circle, mix, chance } from '../utils.js';
// Dot sphere: a regular dot grid pushed outward and enlarged toward the center by a lens/bulge
// function, so a flat array reads as a 3D orb. The fisheye distortion is peak Y2K cover graphics.
export default function dotSphere() {
  const cols = ri(14, 24), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw) + 1, cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const cx = ctx.W / 2 + rand(-.06, .06) * ctx.W, cy = ctx.H / 2 + rand(-.06, .06) * ctx.H;
  const R = Math.min(ctx.W, ctx.H) * rand(.42, .55), push = rand(.5, 1), grad = chance(.6);
  times(rows, r => times(cols + 1, c => {
    const x0 = c * cw, y0 = (r + .5) * cw, dx = x0 - cx, dy = y0 - cy, t = clamp(Math.hypot(dx, dy) / R, 0, 1);
    const k = 1 + push * (1 - t) * (1 - t), sz = cw * (.18 + .55 * (1 - t));
    if (sz < 1.5) return;
    circle({ x: cx + dx * k, y: cy + dy * k, w: sz, h: sz, color: grad ? mix(cs[0], cs[cs.length - 1], t) : cs[(r + c) % cs.length] });
  }));
}
