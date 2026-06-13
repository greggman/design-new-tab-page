import { ctx, shuffle, ri, rand, times, circle, ring, chance, pick } from '../utils.js';
export default function circlePack() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]), placed = [], target = ri(14, 28);
  let tries = 0;
  while (placed.length < target && tries++ < 600) {
    const r = ctx.S * (placed.length < 3 ? rand(.12, .2) : rand(.03, .11)), x = rand(r, ctx.W - r), y = rand(r, ctx.H - r);
    if (placed.every(p => Math.hypot(p.x - x, p.y - y) > (p.r + r) * .92)) {
      placed.push({ x, y, r });
      chance(.7) ? circle({ x, y, w: r * 2, h: r * 2, color: pick(cs) }) : ring({ x, y, d: r * 2, w: r * rand(.18, .32), color: pick(cs) });
    }
  }
}
