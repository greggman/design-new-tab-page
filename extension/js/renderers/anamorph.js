import { ctx, ri, rand, shuffle, pick, box, circle, mix, chance, clamp } from '../utils.js';
// Anamorphic bulge: a regular grid of dots/squares displaced and resized by a lens at the centre, so
// the flat field appears to swell into a sphere (Vasarely / op-art).
export default function anamorph() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const cols = ri(16, 26), rows = Math.round(cols * ctx.H / ctx.W);
  const cw = ctx.W / cols, ch = ctx.H / rows;
  const cx = rand(0, ctx.W);
  const cy = rand(0, ctx.H);
  const R = Math.min(ctx.W, ctx.H) * rand(.42, .52), strength = rand(.35, .6);
  const dot = chance(.5), c0 = cs[0], c1 = cs[cs.length - 1];
  for (let r = -5; r < rows + 5; r++) for (let c = -5; c < cols + 5; c++) {
    let x = (c + .5) * cw, y = (r + .5) * ch;
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) / R;
    const push = /*d < 1 ?*/ 1 - strength * (1 - d * d * 0.25);// : 1;   // pull points inward near the centre → bulge
    x = cx + dx * push; y = cy + dy * push;
    const sz = Math.min(cw, ch) * (d < 1 ? 1.15 - .5 * d : .65) * .82;
    const t = clamp(d, 0, 1);
    box({ x, y, w: sz, h: sz, radius: dot ? '50%' : 0, color: mix(c0, c1, t), rot: dot ? 0 : 45 });
  }
}
