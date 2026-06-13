import { ctx, ri, clamp, rand, shuffle, times, halfDisc, pick, mix, choice } from '../utils.js';
export default function scallopGrid() {
  const cols = ri(4, 8), rows = clamp(Math.round(cols * ctx.H / ctx.W), 3, 9), cw = ctx.W / cols, ch = ctx.H / rows, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const cpol = pick(['random', 'gradient', 'checker']);
  times(rows, r => times(cols, c => { const x = (c + .5) * cw, y = (r + .5) * ch, sz = Math.min(cw, ch) * rand(.78, 1); const col = cpol === 'gradient' ? mix(cs[0], cs[cs.length - 1], (c / cols + r / rows) / 2) : cpol === 'checker' ? cs[(c + r) % cs.length] : pick(cs); halfDisc({ x, y, r: sz / 2, color: col, rot: choice([0, 90, 180, 270]) }); }));
}
