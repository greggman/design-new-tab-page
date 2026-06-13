import { ctx, ri, rand, times, shuffle, pick, circle, chance, clamp } from '../utils.js';
// Halftone: a regular dot grid whose dot size ramps along a gradient (linear or radial).
// The size gradient creates implied tone and depth from a single flat color — a print-shop staple.
export default function halftone() {
  const cols = ri(14, 26), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw) + 1, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const mode = pick(['linear', 'radial']), invert = chance(.5), ang = rand(0, Math.PI * 2);
  const dir = [Math.cos(ang), Math.sin(ang)], [fx, fy] = [rand(.2, .8) * ctx.W, rand(.2, .8) * ctx.H];
  const maxD = Math.hypot(ctx.W, ctx.H), mono = chance(.6) ? cs[0] : null;
  times(rows, r => times(cols, c => {
    const x = (c + .5) * cw, y = (r + .5) * cw;
    let t = mode === 'linear' ? clamp((x * dir[0] + y * dir[1]) / maxD + .5, 0, 1) : clamp(Math.hypot(x - fx, y - fy) / (maxD * .55), 0, 1);
    if (invert) t = 1 - t;
    const rad = cw * (.08 + (1 - t) * .56);
    if (rad < 1) return;
    circle({ x, y, w: rad * 2, h: rad * 2, color: mono || cs[(r + c) % cs.length] });
  }));
}
