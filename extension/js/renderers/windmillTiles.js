import { ctx, ri, clamp, rand, times, shuffle, box, mix, pick, chance } from '../utils.js';
// Windmill tiles: each grid cell split into four triangles meeting at the center, colored in a
// two-tone pinwheel. Rotational symmetry per tile reads as a quilt of spinning blades.
export default function windmillTiles() {
  const cols = ri(3, 7), rows = clamp(Math.round(cols * ctx.H / ctx.W), 2, 7), cw = ctx.W / cols, ch = ctx.H / rows, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const uniform = chance(.4), ua = cs[0], ub = cs[1] || mix(cs[0], ctx.P.ink, .35), tri = 'polygon(0 0,100% 0,50% 50%)';
  times(rows, r => times(cols, c => {
    const x = (c + .5) * cw, y = (r + .5) * ch, s = Math.max(cw, ch) + 1, a = uniform ? ua : pick(cs), b = uniform ? ub : mix(a, (c + r) % 2 ? ctx.P.bg : ctx.P.ink, .38);
    times(4, k => box({ x, y, w: s, h: s, color: k % 2 ? a : b, clip: tri, rot: k * 90 }));
  }));
}
