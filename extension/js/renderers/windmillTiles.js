import { ctx, ri, clamp, rand, shuffle, box, mix, pick, chance, grid } from '../utils.js';
// Windmill tiles: each grid cell split into four triangles meeting at the center, colored in a
// two-tone pinwheel. Rotational symmetry per tile reads as a quilt of spinning blades.
export default function windmillTiles() {
  const cols = ri(3, 7), rows = clamp(Math.round(cols * ctx.H / ctx.W), 2, 7), cw = ctx.W / cols, ch = ctx.H / rows, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const uniform = chance(.4), ua = cs[0], ub = cs[1] || mix(cs[0], ctx.P.ink, .35);
  // The four blades as clip paths on the CELL's own box — top, right, bottom, left, all meeting at the centre — so a
  // tile covers exactly its cell at any aspect. It used to be one rotated triangle on a square of side max(cw, ch):
  // on a non-square cell (portrait clamps rows at 7, so 117×183px happens) the blades spilled ~33px into the
  // neighbours, and whichever cell happened to be drawn later won the overlap.
  const blades = ['polygon(0 0,100% 0,50% 50%)', 'polygon(100% 0,100% 100%,50% 50%)', 'polygon(100% 100%,0 100%,50% 50%)', 'polygon(0 100%,0 0,50% 50%)'];
  grid(cols, rows, (c, r) => {
    const x = (c + .5) * cw, y = (r + .5) * ch, a = uniform ? ua : pick(cs), b = uniform ? ub : mix(a, (c + r) % 2 ? ctx.P.bg : ctx.P.ink, .38);
    blades.forEach((clip, k) => box({ x, y, w: cw + 1, h: ch + 1, color: k % 2 ? a : b, clip }));
  });
}
