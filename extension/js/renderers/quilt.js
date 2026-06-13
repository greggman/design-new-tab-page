import { ctx, ri, clamp, rand, times, shuffle, box, pick, choice, chance, mix } from '../utils.js';
// Quilt: a patchwork grid where each cell is a pieced block — half-square triangles, four-patch,
// hourglass, or solid. The shared vocabulary of blocks with random color makes a cohesive sampler.
export default function quilt() {
  const cols = ri(4, 8), rows = clamp(Math.round(cols * ctx.H / ctx.W), 3, 8), cw = ctx.W / cols, ch = ctx.H / rows, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const TRI = 'polygon(0 0,100% 0,0 100%)', rots = [0, 90, 180, 270];
  times(rows, r => times(cols, c => {
    const x = (c + .5) * cw, y = (r + .5) * ch, a = pick(cs), b = pick(cs);
    box({ x, y, w: cw + 1, h: ch + 1, color: a });
    switch (pick(['solid', 'hst', 'hst', 'four', 'hour', 'diag'])) {
      case 'hst': box({ x, y, w: cw + 1, h: ch + 1, color: b, clip: TRI, rot: choice(rots) }); break;
      case 'four': box({ x: x - cw / 4, y: y - ch / 4, w: cw / 2 + 1, h: ch / 2 + 1, color: b }); box({ x: x + cw / 4, y: y + ch / 4, w: cw / 2 + 1, h: ch / 2 + 1, color: b }); break;
      case 'hour': box({ x, y, w: cw + 1, h: ch + 1, color: b, clip: 'polygon(0 0,100% 0,50% 50%)', rot: choice([0, 90, 180, 270]) }); box({ x, y, w: cw + 1, h: ch + 1, color: pick(cs), clip: 'polygon(0 100%,100% 100%,50% 50%)' }); break;
      case 'diag': box({ x, y, w: cw + 1, h: ch + 1, color: b, clip: 'polygon(100% 0,100% 100%,0 100%)', rot: choice(rots) }); break;
    }
  }));
}
