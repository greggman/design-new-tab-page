import { ctx, ri, clamp, rand, times, shuffle, box, stripe, mix, pick, choice, chance } from '../utils.js';
// Hatch cells: a grid of patches, each filled with parallel hatching at its own angle — engraving /
// pen-and-ink shading. Per-cell direction changes catch the light differently, like brushed metal.
export default function hatchCells() {
  const cols = ri(4, 9), rows = clamp(Math.round(cols * ctx.H / ctx.W), 3, 8), cw = ctx.W / cols, ch = ctx.H / rows, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const mode = pick(['incremental', 'alternate', 'random']);
  times(rows, r => times(cols, c => {
    const x = (c + .5) * cw, y = (r + .5) * ch, col = pick(cs);
    const ang = mode === 'incremental' ? (c + r) * 22.5 : mode === 'alternate' ? ((c + r) % 2 ? 0 : 90) : choice([0, 45, 90, 135]);
    box({ x, y, w: cw + 1, h: ch + 1, color: mix(col, ctx.P.bg, .82) });
    stripe({ x, y, w: cw * .92, h: ch * .92, rot: ang, color: col, lw: ri(3, 7), gap: ri(6, 14) });
  }));
}
