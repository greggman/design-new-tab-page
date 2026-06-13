import { ctx, ri, rand, times, shuffle, line, mix, pick, choice, chance } from '../utils.js';
// Cross-stitch: a grid of little X's, like an embroidery sampler. Random dropouts and color banding
// keep the field from reading as solid, so the hand-stitched texture comes through.
export default function crossStitch() {
  const cols = ri(8, 18), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw), cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const cpol = pick(['random', 'gradient', 'checker', 'rowband']), thick = Math.max(2, cw * rand(.12, .2)), len = cw * rand(.72, .94);
  times(rows, r => times(cols, c => {
    if (chance(.12)) return;
    const x = (c + .5) * cw, y = (r + .5) * cw;
    const col = cpol === 'gradient' ? mix(cs[0], cs[cs.length - 1], (c / cols + r / rows) / 2) : cpol === 'checker' ? cs[(c + r) % cs.length] : cpol === 'rowband' ? cs[r % cs.length] : pick(cs);
    line({ x, y, len, rot: 45, thick, color: col, z: 1 });
    line({ x, y, len, rot: -45, thick, color: col, z: 1 });
  }));
}
