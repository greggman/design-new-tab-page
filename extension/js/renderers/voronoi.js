import { ctx, ri, rand, group, times, shuffle, pick, box, circle, mix, chance } from '../utils.js';
// Voronoi cells: scatter seed points, then colour a fine grid by its nearest seed. Same-colour cells
// merge into the characteristic cracked-glass / giraffe polygons without needing real geometry.
export default function voronoi() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const k = ri(9, 20), seeds = [];
  times(k, () => seeds.push({ x: rand(0, ctx.W), y: rand(0, ctx.H), c: pick(cs) }));
  const step = ctx.S * rand(.032, .05);
  group({
    //
  }, '', '', () => {
    for (let y = step / 2; y < ctx.H + step; y += step) {
      for (let x = step / 2; x < ctx.W + step; x += step) {
        let best = 1e18, bc = cs[0];
        for (const s of seeds) { const d = (s.x - x) ** 2 + (s.y - y) ** 2; if (d < best) { best = d; bc = s.c; } }
        box({ x, y, w: step + 1.5, h: step + 1.5, color: bc });
      }
    }
  });
  if (chance(.55)) seeds.forEach(s => circle({ x: s.x, y: s.y, w: ctx.S * .012, h: ctx.S * .012, color: mix(s.c, ctx.P.ink, .5), z: 5 }));
}
