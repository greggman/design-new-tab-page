import { ctx, rand, ri, times, shuffle, box, mix, chance, circle } from '../utils.js';
// Shards: the frame fractured into angular triangles fanning from an off-center origin, like cracked
// glass. Irregular spoke angles plus shared edges give a crystalline, faceted tension.
export default function shards() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]), W = ctx.W, H = ctx.H;
  const cx = rand(.3, .7) * W, cy = rand(.3, .7) * H, n = ri(7, 14), span = Math.hypot(W, H) * 1.3;
  const raw = []; let acc = 0; times(n, () => { acc += rand(.4, 1.2); raw.push(acc); });
  const angs = raw.map(a => a / acc * Math.PI * 2);
  const pct = (px, py) => `${(px / W * 100).toFixed(1)}% ${(py / H * 100).toFixed(1)}%`;
  times(n, i => {
    const a0 = angs[i], a1 = angs[(i + 1) % n] + (i + 1 === n ? Math.PI * 2 : 0);
    const p1 = [cx + Math.cos(a0) * span, cy + Math.sin(a0) * span], p2 = [cx + Math.cos(a1) * span, cy + Math.sin(a1) * span];
    box({ x: W / 2, y: H / 2, w: W, h: H, color: mix(cs[i % cs.length], (i % 2) ? ctx.P.ink : ctx.P.bg, .14), clip: `polygon(${pct(cx, cy)},${pct(...p1)},${pct(...p2)})`, z: i });
  });
  if (chance(.5)) circle({ x: cx, y: cy, w: ctx.S * rand(.05, .12), h: ctx.S * rand(.05, .12), color: ctx.P.accent, z: n + 1 });
}
