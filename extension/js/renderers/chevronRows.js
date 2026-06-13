import { ctx, ri, rand, times, shuffle, mix, box, CLIPS, chance } from '../utils.js';
// Chevron rows: stacked rows of clipped chevrons with a per-row color gradient. Repetition with
// directional rhythm — the eye travels along the zigzag.
export default function chevronRows() {
  const rows = ri(4, 9), rh = ctx.H / rows, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const cols = ri(3, 7), cw = ctx.W / cols, flip = chance(.5), alt = chance(.4);
  times(rows, r => times(cols + 1, c => {
    box({ x: c * cw, y: (r + .5) * rh, w: cw * 1.06, h: rh * 1.02, color: mix(cs[r % cs.length], cs[(r + 1) % cs.length], c / cols), clip: CLIPS.chevron, rot: (flip ? 180 : 0) + (alt && r % 2 ? 180 : 0) });
  }));
}
