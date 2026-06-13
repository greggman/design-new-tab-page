import { ctx, ri, rand, times, shuffle, box, circle, CLIPS, mix, chance, choice } from '../utils.js';
// Mountains: overlapping triangular ranges receding upward, each lighter toward the back. Atmospheric
// perspective — value contrast falling off with distance — builds depth from flat shapes.
export default function mountains() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]), layers = ri(3, 6);
  if (chance(.6)) { const sx = choice([1 / 4, 1 / 3, 2 / 3, 3 / 4]) * ctx.W; circle({ x: sx, y: ctx.H * rand(.18, .34), w: ctx.S * rand(.1, .2), h: ctx.S * rand(.1, .2), color: ctx.P.accent, z: 0 }); }
  times(layers, l => {
    const t = layers > 1 ? l / (layers - 1) : 0, baseY = ctx.H * (.35 + .5 * t);
    const col = mix(mix(cs[l % cs.length], ctx.P.bg, (1 - t) * .4), ctx.P.ink, t * .15);
    box({ x: ctx.W / 2, y: (baseY + ctx.H) / 2, w: ctx.W, h: ctx.H - baseY + 2, color: col, z: l + 1 });
    const peaks = ri(2, 5), pw = ctx.W / peaks;
    times(peaks + 1, p => { const h = ctx.H * rand(.08, .26) * (1.1 - t * .4); box({ x: p * pw + (l % 2 ? pw / 2 : 0), y: baseY - h / 2, w: pw * rand(1.1, 1.9), h, color: col, clip: CLIPS.triangle, z: l + 1 }); });
  });
}
