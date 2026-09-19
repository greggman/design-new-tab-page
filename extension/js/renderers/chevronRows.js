import { ctx, ri, rand, shuffle, mix, box, CLIPS, chance, grid, groundScheme, oneSide } from '../utils.js';
// Chevron rows: stacked rows of clipped chevrons with a per-row color gradient. Repetition with
// directional rhythm — the eye travels along the zigzag.
// The ground in the gaps is any palette hue at any lightness; each row blends between two colours, so they all
// sit on one side of the ground's lightness (oneSide) and no stretch of a row fades into it.
export default function chevronRows() {
  const rows = ri(4, 9), rh = ctx.H / rows, { ground, fg } = groundScheme(), cs = oneSide(fg, ground);
  const cols = ri(3, 7), cw = ctx.W / cols, flip = chance(.5), alt = chance(.4);
  grid(cols + 1, rows, (c, r) => {
    box({ x: c * cw, y: (r + .5) * rh, w: cw * 1.06, h: rh * 1.02, color: mix(cs[r % cs.length], cs[(r + 1) % cs.length], c / cols), clip: CLIPS.chevron, rot: (flip ? 180 : 0) + (alt && r % 2 ? 180 : 0) });
  });
}
