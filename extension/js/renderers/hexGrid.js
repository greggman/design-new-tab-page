import { ctx, rand, ri, times, box, ring, line, CLIPS, pick, mix, chance, groundScheme, readable, grid } from '../utils.js';
// Hex grid: a honeycomb of dim cells with a scatter of lit ones and targeting reticles — the
// sci-fi HUD / interface look. Near-ground fills with gaps imply a glowing wireframe overlay.
//
// The ground (showing in the gaps) is any palette hue at any lightness; the dim cells are the ground nudged a
// step toward ink so the honeycomb still reads, and everything drawn over them is checked against THAT.
export default function hexGrid() {
  const { ground, fg, ink } = groundScheme();
  const base = mix(ground, ink, .12), cs = readable(fg, base, .22);
  // The reticle is a thin stroke crossing both dim and lit cells, so it needs lightness contrast, not just hue.
  const reticle = readable([ctx.P.accent], base, .38)[0];
  const w = ctx.S * rand(.08, .13), h = w * 1.1547, sy = h * .75;
  const C = Math.ceil(ctx.W / w) + 2, R = Math.ceil(ctx.H / sy) + 2;
  grid(C, R, (c, r) => { const x = c * w + (r % 2 ? w / 2 : 0), y = r * sy, hot = chance(.08); box({ x, y, w: w * .9, h: h * .9, color: hot ? pick(cs) : base, clip: CLIPS.hexagon, opacity: hot ? 1 : .92 }); });
  times(ri(1, 3), () => {
    const x = rand(.2, .8) * ctx.W, y = rand(.2, .8) * ctx.H, d = ctx.S * rand(.12, .22), t = Math.max(2, ctx.S * .004);
    ring({ x, y, d, w: t, color: reticle, z: 6 });
    line({ x, y, len: d * 1.4, rot: 0, thick: t, color: reticle, z: 6 }); line({ x, y, len: d * 1.4, rot: 90, thick: t, color: reticle, z: 6 });
  });
}
