import { ctx, rand, ri, times, shuffle, box, ring, line, CLIPS, pick, mix, chance } from '../utils.js';
// Hex grid: a honeycomb of dim cells with a scatter of lit ones and targeting reticles — the
// sci-fi HUD / interface look. Near-background fills with gaps imply a glowing wireframe overlay.
export default function hexGrid() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), w = ctx.S * rand(.08, .13), h = w * 1.1547, sy = h * .75;
  const C = Math.ceil(ctx.W / w) + 2, R = Math.ceil(ctx.H / sy) + 2, base = mix(ctx.P.bg, ctx.P.ink, .12);
  times(R, r => times(C, c => { const x = c * w + (r % 2 ? w / 2 : 0), y = r * sy, hot = chance(.08); box({ x, y, w: w * .9, h: h * .9, color: hot ? pick(cs) : base, clip: CLIPS.hexagon, opacity: hot ? 1 : .92 }); }));
  times(ri(1, 3), () => {
    const x = rand(.2, .8) * ctx.W, y = rand(.2, .8) * ctx.H, d = ctx.S * rand(.12, .22), t = Math.max(2, ctx.S * .004);
    ring({ x, y, d, w: t, color: ctx.P.accent, z: 6 });
    line({ x, y, len: d * 1.4, rot: 0, thick: t, color: ctx.P.accent, z: 6 }); line({ x, y, len: d * 1.4, rot: 90, thick: t, color: ctx.P.accent, z: 6 });
  });
}
