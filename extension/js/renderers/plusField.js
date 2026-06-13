import { ctx, ri, clamp, rand, times, shuffle, box, CLIPS, pick, mix, choice, chance } from '../utils.js';
// Plus field: a grid of plus/cross marks. The cross's negative space lets the background breathe,
// so the grid reads as texture rather than a solid block.
export default function plusField() {
  const cols = ri(4, 9), rows = clamp(Math.round(cols * ctx.H / ctx.W), 3, 9), cw = ctx.W / cols, ch = ctx.H / rows, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const cpol = pick(['random', 'checker', 'gradient', 'mono']), mono = pick(cs), rotInc = chance(.4);
  times(rows, r => times(cols, c => {
    const x = (c + .5) * cw, y = (r + .5) * ch, sz = Math.min(cw, ch) * rand(.62, .94);
    const col = cpol === 'mono' ? mono : cpol === 'checker' ? cs[(c + r) % cs.length] : cpol === 'gradient' ? mix(cs[0], cs[cs.length - 1], (c / cols + r / rows) / 2) : pick(cs);
    box({ x, y, w: sz, h: sz, color: col, clip: CLIPS.cross, rot: rotInc ? (c + r) * 15 : choice([0, 0, 45]) });
  }));
}
