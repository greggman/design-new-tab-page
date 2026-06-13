import { ctx, rand, ri, times, shuffle, box, mix, chance, circle, rings } from '../utils.js';
// Radial bars: a polar bar chart — equal-angle spokes of varying length around a center.
// Radial symmetry plus length variation reads as data made ornamental.
export default function radialBars() {
  const cx = ctx.W / 2 + rand(-.05, .05) * ctx.W, cy = ctx.H / 2 + rand(-.05, .05) * ctx.H, cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const n = ri(18, 44), inner = ctx.S * rand(.05, .12), maxLen = ctx.S * rand(.26, .42), bw = ctx.S * rand(.012, .026);
  times(n, i => {
    const ang = i / n * 360, len = maxLen * rand(.32, 1), rr = inner + len / 2;
    box({ x: cx + Math.cos(ang * Math.PI / 180) * rr, y: cy + Math.sin(ang * Math.PI / 180) * rr, w: bw, h: len, color: mix(cs[i % cs.length], cs[(i + 1) % cs.length], (i % 2) * .4), rot: ang + 90 });
  });
  if (chance(.6)) rings({ x: cx, y: cy, r: inner * rand(.7, 1), colors: shuffle(cs), rw: inner * .4 });
  else circle({ x: cx, y: cy, w: inner * 1.4, h: inner * 1.4, color: ctx.P.accent, z: 5 });
}
