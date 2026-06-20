import { ctx, ri, rand, times, box, contrastPair } from '../utils.js';
// Dither: an ordered (Bayer-matrix) gradient between two tones — the classic 1-bit / EGA way to
// fake a smooth ramp with hard pixels. The diagonal threshold weave is the signature retro texture.
export default function dither() {
  const [a, b] =rand(0, 3) < 1 ? ['#ffffff20', '#00000020'] : contrastPair([...ctx.POOL, ctx.P.accent]).map(c => c + '80');
  const cols = ri(40, 64), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw);
  const M = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const dir = rand(0, Math.PI * 2), c = Math.cos(dir), s = Math.sin(dir);
  // normalize the projection over the rectangle's actual corner range so the ramp always spans 0..1
  // across the screen, regardless of direction (otherwise a "negative" direction clamps to solid).
  const minP = Math.min(0, ctx.W * c) + Math.min(0, ctx.H * s), span = (Math.abs(ctx.W * c) + Math.abs(ctx.H * s)) || 1;
  times(rows, r => times(cols, q => {
    const x = (q + .5) * cw, y = (r + .5) * cw, t = (x * c + y * s - minP) / span;
    box({ x, y, w: cw + 1, h: cw + 1, color: t > (M[r % 4][q % 4] + .5) / 16 ? a : b });
  }));
}
