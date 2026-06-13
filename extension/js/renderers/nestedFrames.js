import { ctx, rand, ri, times, shuffle, box, chance } from '../utils.js';
// Nested frames: concentric rectangle outlines that shrink and drift in one direction, creating
// implied perspective and depth from line weight alone. Minimal, architectural.
export default function nestedFrames() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), n = ri(5, 11);
  const cx = ctx.W / 2, cy = ctx.H / 2, baseW = ctx.W * rand(.72, .92), baseH = ctx.H * rand(.72, .92);
  const dx = rand(-1, 1) * ctx.W * .03, dy = rand(-1, 1) * ctx.H * .03, lw = Math.max(2, ctx.S * rand(.004, .01));
  const fill = chance(.35) ? cs[cs.length - 1] : null;
  if (fill) box({ x: cx, y: cy, w: baseW, h: baseH, color: fill, z: 0 });
  times(n, i => {
    const t = i / n;
    box({ x: cx + dx * i, y: cy + dy * i, w: baseW * (1 - t * .85), h: baseH * (1 - t * .85), color: 'transparent', border: `${lw}px solid ${cs[i % cs.length]}`, z: i + 1 });
  });
}
