import { ctx, ri, rand, shuffle, box, chance, grid } from '../utils.js';
// Bargello / flame stitch: columns of stacked blocks whose vertical offset follows a peak-and-valley
// wave, so equal colours line up into rippling diagonal flames.
export default function bargello() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const cols = ri(20, 40), cw = ctx.W / cols, bh = ctx.S * rand(.03, .055);
  const rowsNeeded = Math.ceil(ctx.H / bh) + cs.length + 2;
  // per-column vertical shift traces a zigzag → the flame silhouette
  const peaks = ri(2, 5), amp = ctx.S * rand(.06, .16);
  const shift = Array.from({ length: cols }, (_, c) => Math.round(Math.sin(c / cols * peaks * Math.PI * 2) * amp / bh));
  grid(cols, rowsNeeded + cs.length, (c, j) => {
    const r = j - cs.length, y = (r + shift[c]) * bh;
    if (y < -bh || y > ctx.H + bh) return;
    box({ x: (c + .5) * cw, y: y + bh / 2, w: cw + 1, h: bh + 1, color: cs[((r % cs.length) + cs.length) % cs.length] });
  });
}
