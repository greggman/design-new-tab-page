import { ctx, ri, rand, pick, chance, shuffle, box, lum, groundScheme } from '../utils.js';
// Nested tiles: a modular grid of concentric shapes. Each cell holds one motif of 2–4 nested shapes, or
// splits into a 2×2 of smaller ones. The shape (rounded square / circle / octagon / hexagon) and the ring
// count are chosen ONCE for the whole composition; each motif's colours vary. Mid-century / 1970s.
const CLIP = {
  octagon: 'polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)',
  hexagon: 'polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)',
};
export default function nestedTiles() {
  // Ground: any palette hue at any lightness. Ring colours: the palette's colours made to read against it,
  // so the outermost ring's silhouette always shows. Picking the ground from the palette's discrete members
  // (as this used to) still clustered it at the few lightnesses those members happen to sit at.
  const { fg: cols } = groundScheme();
  const shapeType = pick(['rrect', 'circle', 'octagon', 'hexagon']), k = pick([3, 3, 4]), rrad = rand(.24, .34);
  const shape = (x, y, sz, color) => {
    if (shapeType === 'circle') box({ x, y, w: sz, h: sz, radius: '50%', color });
    else if (shapeType === 'rrect') box({ x, y, w: sz, h: sz, radius: sz * rrad, color });
    else box({ x, y, w: sz, h: sz, color, clip: CLIP[shapeType] });
  };
  const motif = (x, y, sz) => {
    // `cols` already contrasts with the ground, so the outermost ring always reads. What can still blur is
    // two neighbouring rings landing on the same luminance — pull a contrastier colour forward when so.
    const cs = shuffle(cols);
    for (let i = 1; i < k && i < cs.length; i++) {
      if (Math.abs(lum(cs[i]) - lum(cs[i - 1])) > .1) continue;
      const j = cs.findIndex((c, n) => n > i && Math.abs(lum(c) - lum(cs[i - 1])) > .1);
      if (j > i) [cs[i], cs[j]] = [cs[j], cs[i]];
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
