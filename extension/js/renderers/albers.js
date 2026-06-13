import { ctx, rand, ri, times, shuffle, box, mix, chance } from '../utils.js';
// Homage to the Square (Albers): nested squares shifted toward the base, with colors stepped
// evenly between two endpoints. Studies how adjacent flat colors interact — the design is the color.
export default function albers() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const cx = ctx.W / 2 + rand(-.04, .04) * ctx.W, cy = ctx.H / 2 + rand(-.04, .04) * ctx.H;
  const base = Math.min(ctx.W, ctx.H) * rand(.72, .94), layers = ri(3, 5);
  const c0 = cs[0], c1 = cs[1] || mix(cs[0], ctx.P.bg, .55), warm = chance(.5);
  times(layers, i => {
    const t = layers > 1 ? i / (layers - 1) : 0, s = base * (1 - i / layers * .82), offY = (base - s) * .26;
    box({ x: cx, y: cy + offY, w: s, h: s, color: mix(c0, warm ? c1 : mix(c1, ctx.P.bg, .2), t) });
  });
}
