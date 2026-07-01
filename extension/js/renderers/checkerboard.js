import { ctx, ri, rand, times, shuffle, box, mix, chance, pick, circle, CLIPS } from '../utils.js';
// Checkerboard: the two-color grid. Often only ONE parity of cells is drawn, leaving the others empty
// so the background shows through — a single-tone lattice with breathing room. The drawn cells can be
// squares, diamonds or dots, and the full two-color version (with optional diagonal color banding) is
// still in the mix.
export default function checkerboard() {
  const cols = ri(4, 10), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw), cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const a = cs[0], b = cs[1] || mix(a, ctx.P.bg, .5);
  const solid = chance(.4);                              // both colors, or leave one parity empty
  const diag = solid && chance(.4);                      // multi-color diagonal banding (solid only)
  const parity = ri(0, 1);                               // which cells to keep when sparse
  const multi = !solid && chance(.5);                    // sparse cells: one color, or cycle the palette
  const shape = solid ? 'square' : pick(['square', 'square', 'diamond', 'circle']);
  const clip = shape === 'diamond' ? CLIPS.diamond : undefined, round = shape === 'circle' ? '50%' : 0;
  const inset = solid ? -1 : cw * rand(0, .12);          // small gutter so the gaps read when sparse
  times(rows, r => times(cols, c => {
    const on = (r + c) % 2;
    if (!solid && on !== parity) return;                 // skipped → background shows through
    const col = solid ? (diag ? cs[(c + r) % cs.length] : (on ? a : b)) : (multi ? cs[(c + r) % cs.length] : a);
    box({ x: (c + .5) * cw, y: (r + .5) * cw, w: cw - inset, h: cw - inset, color: col, radius: round, clip });
  }));
  if (chance(.35)) circle({ x: ri(1, cols - 1) * cw, y: ri(1, rows - 1) * cw, w: cw * rand(1.4, 2.4), h: cw * rand(1.4, 2.4), color: ctx.P.accent, z: 5 });
}
