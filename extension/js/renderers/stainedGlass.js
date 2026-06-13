import { ctx, rand, times, shuffle, box, CLIPS, pick, mix, chance } from '../utils.js';
// Stained glass: jewel-colored triangles set into a dark leading. Drawing the panes slightly
// undersized over an ink ground turns the gaps into came lines — bold color caged by black.
export default function stainedGlass() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]).map(c => mix(c, ctx.P.accent, .08));
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: ctx.P.ink, z: -1 });
  const w = ctx.S * rand(.13, .22), h = w * rand(.85, 1.05), R = Math.ceil(ctx.H / h) + 1, C = Math.ceil(ctx.W / w) * 2 + 2;
  const shrink = rand(.86, .93), grad = chance(.4);
  times(R, r => times(C, c => {
    const col = grad ? mix(cs[r % cs.length], cs[(r + 1) % cs.length], (c / C)) : pick(cs);
    box({ x: c * (w / 2), y: (r + .5) * h, w: w * shrink, h: h * shrink, color: col, clip: CLIPS.triangle, rot: c % 2 ? 180 : 0 });
  }));
}
