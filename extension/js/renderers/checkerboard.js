import { ctx, ri, rand, times, shuffle, box, mix, chance, pick, circle } from '../utils.js';
// Checkerboard: the elemental two-color grid. Optional diagonal color banding or a lone focal disc
// breaks the strict alternation just enough to give the eye a place to land.
export default function checkerboard() {
  const cols = ri(4, 10), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw), cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const a = cs[0], b = cs[1] || mix(a, ctx.P.bg, .5), diag = chance(.4);
  times(rows, r => times(cols, c => {
    const col = diag ? cs[(c + r) % cs.length] : ((r + c) % 2 ? a : b);
    box({ x: (c + .5) * cw, y: (r + .5) * cw, w: cw + 1, h: cw + 1, color: col });
  }));
  if (chance(.4)) circle({ x: (ri(1, cols - 1)) * cw, y: (ri(1, rows - 1)) * cw, w: cw * rand(1.4, 2.4), h: cw * rand(1.4, 2.4), color: ctx.P.accent, z: 5 });
}
