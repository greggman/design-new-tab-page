import { ctx, ri, clamp, rand, shuffle, box, pick, choice, chance, mix, grid } from '../utils.js';
// Quilt: a patchwork grid where each cell is a pieced block — half-square triangles, four-patch,
// hourglass, or solid. The shared vocabulary of blocks with random color makes a cohesive sampler.
export default function quilt() {
  const cols = ri(4, 8), rows = clamp(Math.round(cols * ctx.H / ctx.W), 3, 8), cw = ctx.W / cols, ch = ctx.H / rows, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  // Every orientation is its own clip on the cell's box rather than one shape rotated. Rotating a cw×ch box by 90°
  // makes it ch×cw, and on a non-square cell that spills into the neighbours — whichever cell was drawn later then won
  // the overlap, so the picture depended on drawing order.
  const CORNER = ['polygon(0 0,100% 0,0 100%)', 'polygon(0 0,100% 0,100% 100%)', 'polygon(100% 0,100% 100%,0 100%)', 'polygon(0 0,100% 100%,0 100%)'];
  const BLADE = ['polygon(0 0,100% 0,50% 50%)', 'polygon(100% 0,100% 100%,50% 50%)', 'polygon(100% 100%,0 100%,50% 50%)', 'polygon(0 100%,0 0,50% 50%)'];
  grid(cols, rows, (c, r) => {
    const x = (c + .5) * cw, y = (r + .5) * ch, a = pick(cs), b = pick(cs);
    box({ x, y, w: cw + 1, h: ch + 1, color: a });
    switch (pick(['solid', 'hst', 'hst', 'four', 'hour', 'diag'])) {
      case 'hst': box({ x, y, w: cw + 1, h: ch + 1, color: b, clip: pick(CORNER) }); break;
      case 'four': box({ x: x - cw / 4, y: y - ch / 4, w: cw / 2 + 1, h: ch / 2 + 1, color: b }); box({ x: x + cw / 4, y: y + ch / 4, w: cw / 2 + 1, h: ch / 2 + 1, color: b }); break;
      case 'hour': box({ x, y, w: cw + 1, h: ch + 1, color: b, clip: pick(BLADE) }); box({ x, y, w: cw + 1, h: ch + 1, color: pick(cs), clip: BLADE[2] }); break;
      case 'diag': box({ x, y, w: cw + 1, h: ch + 1, color: b, clip: pick(CORNER) }); break;
    }
  });
}
