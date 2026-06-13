import { ctx, ri, rand, times, shuffle, box, mix, chance } from '../utils.js';
// Warp bands: horizontal color strata sampled as vertical slices, every band sharing a sine so the
// layers undulate in parallel — like cut agate or wind-rippled sand. Flow from pure repetition.
export default function warpBands() {
  const slices = ri(80, 140), sw = ctx.W / slices, bands = ri(4, 9), cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const amp = ctx.H * rand(.03, .09), freq = rand(1, 3), ph = rand(0, 6.28), step = rand(0, .9), bh = ctx.H / bands;
  times(slices, s => {
    const x = (s + .5) * sw;
    times(bands, b => {
      const y = (b + .5) / bands * ctx.H + amp * Math.sin(x / ctx.W * freq * 2 * Math.PI + ph + b * step);
      box({ x, y, w: sw + 1, h: bh + amp * 2 + 2, color: mix(cs[b % cs.length], ctx.P.bg, .04), z: b });
    });
  });
}
