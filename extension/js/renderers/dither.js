import { ctx, ri, rand, times, shuffle, box, mix, clamp, chance, choice } from '../utils.js';
// Dither: an ordered (Bayer-matrix) gradient between two tones — the classic 1-bit / EGA way to
// fake a smooth ramp with hard pixels. The diagonal threshold weave is the signature retro texture.
export default function dither() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]), a = cs[0], b = cs[1] || mix(a, ctx.P.bg, .8);
  const cols = ri(40, 64), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw);
  const M = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const dir = rand(0, Math.PI * 2), c = Math.cos(dir), s = Math.sin(dir), maxD = Math.abs(ctx.W * c) + Math.abs(ctx.H * s);
  times(rows, r => times(cols, q => {
    const x = (q + .5) * cw, y = (r + .5) * cw, t = clamp((x * c + y * s) / maxD, 0, 1);
    const thr = (M[r % 4][q % 4] + .5) / 16;
    box({ x, y, w: cw + 1, h: cw + 1, color: t > thr ? a : b });
  }));
}
