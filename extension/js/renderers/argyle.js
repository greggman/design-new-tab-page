import { ctx, ri, rand, times, shuffle, box, CLIPS, mix, chance, stripe, pick } from '../utils.js';
// Argyle: a diagonal lattice of elongated diamonds in banded colors, overlaid with fine cross
// stitching. The three-tone diagonal rhythm and thread lines are the knitwear hallmark.
export default function argyle() {
  const cols = ri(4, 8), w = ctx.W / cols, h = w * rand(1.5, 2.1), rows = Math.ceil(ctx.H / (h / 2)) + 2, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  times(rows, r => times(cols + 1, c => {
    const x = c * w + (r % 2 ? w / 2 : 0), y = r * (h / 2);
    box({ x, y, w: w * .99, h: h * .99, color: cs[(c + r) % cs.length], clip: CLIPS.diamond });
  }));
  if (chance(.7)) { const lc = mix(ctx.P.ink, ctx.P.bg, .35), D = Math.hypot(ctx.W, ctx.H) * 1.3, slope = Math.atan2(h / 2, w) * 57.2958; [slope, -slope].forEach(a => stripe({ x: ctx.W / 2, y: ctx.H / 2, w: D, h: D, rot: a, color: lc, lw: Math.max(1.5, ctx.S * .003), gap: w * .9 })); }
}
