import { ctx, ri, rand, times, shuffle, pick, circle, box, mix } from '../utils.js';
// Camouflage: overlapping organic blotches in a few tones. Each patch is a cluster of fat overlapping
// circles, so the silhouettes read as irregular camo blobs.
export default function camouflage() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: mix(ctx.P.bg, cs[cs.length - 1], .5), z: -2 });
  const tones = cs.slice(0, Math.max(2, Math.min(4, cs.length)));
  tones.forEach((col, ti) => {
    const patches = ri(6, 12);
    times(patches, () => {
      const px = rand(0, 1) * ctx.W, py = rand(0, 1) * ctx.H, base = ctx.S * rand(.08, .18);
      times(ri(4, 8), () => {
        const d = base * rand(.5, 1.1);
        circle({ x: px + rand(-base, base) * .8, y: py + rand(-base, base) * .8, w: d, h: d, color: col, z: ti });
      });
    });
  });
}
