import { ctx, rand, ri, times, shuffle, box, pick, chance, mix } from '../utils.js';
// Barcode: full-bleed vertical bars of random width, mostly ink with stray color, crossed by a few
// accent bands. The deadpan packaging/UPC motif that techno sleeves used as anti-design design.
export default function barcode() {
  const pool = [...ctx.POOL, ctx.P.accent];
  let x = 0;
  while (x < ctx.W) {
    const w = ctx.W * rand(.003, .018);
    if (chance(.52)) box({ x: x + w / 2, y: ctx.H / 2, w, h: ctx.H, color: chance(.82) ? ctx.P.ink : pick(pool) });
    x += w;
  }
  times(ri(1, 3), () => box({ x: ctx.W / 2, y: rand(.08, .92) * ctx.H, w: ctx.W, h: ctx.H * rand(.02, .07), color: ctx.P.accent, z: 3 }));
  if (chance(.5)) { const n = ri(8, 20), bw = ctx.W * .6 / n, y = rand(.78, .92) * ctx.H, x0 = ctx.W * .2; times(n, i => { if (chance(.6)) box({ x: x0 + (i + .5) * bw, y, w: bw * .7, h: bw * .7, color: ctx.P.ink, z: 4 }); }); }
}
