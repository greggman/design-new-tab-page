import { ctx, ri, pick, chance, box, groundScheme } from '../utils.js';
// Geo blocks: a mid-century modular grid. Each cell holds a square, a circle, a quarter-disc, or half of
// a pill — and a pill always spans two adjacent cells, so its two halves are paired into a full stadium.
// Solid palette tones on a ground that can be any colour. Bauhaus / 1960s.
export default function geoBlocks() {
  // The ground is any palette hue at any lightness and the block tones are made to read against it. This
  // used to take the palette's darkest tone as the ground, so every Geo blocks was a dark design.
  const cols = groundScheme().fg;
  const nc = ri(8, 12), cell = ctx.W / nc, nr = Math.ceil(ctx.H / cell);
  const used = Array.from({ length: nr }, () => new Array(nc).fill(false));
  const corners = ['100% 0 0 0', '0 100% 0 0', '0 0 100% 0', '0 0 0 100%'];   // which corner is the quarter-disc arc
  const col = () => pick(cols);
  for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
    if (used[r][c]) continue;
    used[r][c] = true;
    const cx = (c + .5) * cell, cy = (r + .5) * cell;
    if (chance(.28)) {                                                  // a pill: claim a second, adjacent cell
      const horiz = chance(.5);
      if (horiz && c + 1 < nc && !used[r][c + 1]) {
        used[r][c + 1] = true;
        box({ x: (c + 1) * cell, y: cy, w: 2 * cell, h: cell, radius: cell / 2, color: col(), z: 1 });
        continue;
      } else if (!horiz && r + 1 < nr && !used[r + 1][c]) {
        used[r + 1][c] = true;
        box({ x: cx, y: (r + 1) * cell, w: cell, h: 2 * cell, radius: cell / 2, color: col(), z: 1 });
        continue;
      }                                                                // didn't fit → fall through to a single-cell shape
    }
    if (chance(.08)) continue;                                         // occasional cell left as bare ground
    const kind = pick(['square', 'square', 'circle', 'circle', 'quarter']);
    if (kind === 'square') box({ x: cx, y: cy, w: cell, h: cell, color: col(), z: 1 });
    else if (kind === 'circle') box({ x: cx, y: cy, w: cell, h: cell, radius: '50%', color: col(), z: 1 });
    else box({ x: cx, y: cy, w: cell, h: cell, radius: pick(corners), color: col(), z: 1 });
  }
}
