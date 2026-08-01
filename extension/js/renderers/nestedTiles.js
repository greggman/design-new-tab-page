import { ctx, ri, rand, pick, chance, shuffle, box, lum } from '../utils.js';
// Nested tiles: a modular grid of concentric shapes. Each cell holds one motif of 2–4 nested shapes, or
// splits into a 2×2 of smaller ones. The shape (rounded square / circle / octagon / hexagon) and the ring
// count are chosen ONCE for the whole composition; each motif's colours vary. Mid-century / 1970s.
const CLIP = {
  octagon: 'polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)',
  hexagon: 'polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)',
};
export default function nestedTiles() {
  const bg = lum(ctx.P.bg) >= lum(ctx.P.ink) ? ctx.P.bg : ctx.P.ink;
  const cols = [...new Set([ctx.P.bg, ctx.P.ink, ctx.P.accent, ...ctx.P.colors])];
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: bg, z: -1 });
  const shapeType = pick(['rrect', 'circle', 'octagon', 'hexagon']), k = pick([3, 3, 4]), rrad = rand(.24, .34);
  const shape = (x, y, sz, color) => {
    if (shapeType === 'circle') box({ x, y, w: sz, h: sz, radius: '50%', color });
    else if (shapeType === 'rrect') box({ x, y, w: sz, h: sz, radius: sz * rrad, color });
    else box({ x, y, w: sz, h: sz, color, clip: CLIP[shapeType] });
  };
  const motif = (x, y, sz) => {
    const cs = shuffle(cols);
    // keep the OUTERMOST ring off the ground colour so the motif's silhouette always reads
    if (Math.abs(lum(cs[0]) - lum(bg)) <= .12) {
      const j = cs.findIndex(c => Math.abs(lum(c) - lum(bg)) > .12);
      if (j > 0) [cs[0], cs[j]] = [cs[j], cs[0]];
    }
    for (let i = 0; i < k; i++) shape(x, y, sz * (1 - i * (.72 / k)), cs[i % cs.length]);
  };
  const nc = ri(3, 5), cell = ctx.W / nc, nr = Math.ceil(ctx.H / cell);
  for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
    const cx = (c + .5) * cell, cy = (r + .5) * cell;
    if (chance(.5)) {                                                    // split into a 2×2 of smaller motifs
      const q = cell / 2;
      for (let dy = -1; dy <= 1; dy += 2) for (let dx = -1; dx <= 1; dx += 2) motif(cx + dx * q / 2, cy + dy * q / 2, q * .9);
    } else {
      motif(cx, cy, cell * .9);
    }
  }
}
