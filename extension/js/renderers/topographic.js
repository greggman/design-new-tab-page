import { ctx, ri, rand, times, shuffle, pick, circle, mix, chance } from '../utils.js';
// Topographic bands: a few "hills" of nested concentric ellipses stepping through a colour ramp, like
// the filled elevation zones of a contour map.
export default function topographic() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const hills = ri(2, 4), lo = cs[0], hi = cs[cs.length - 1];
  const centers = [];
  times(hills, () => centers.push({ x: rand(.15, .85) * ctx.W, y: rand(.15, .85) * ctx.H, r: ctx.S * rand(.4, .75), sq: rand(.6, 1.3), a: rand(0, 180) }));
  const bands = ri(7, 13);
  for (let b = 0; b < bands; b++) {
    const t = b / (bands - 1);
    centers.forEach(h => {
      const rr = h.r * (1 - t);
      circle({ x: h.x, y: h.y, w: rr * 2, h: rr * 2 * h.sq, rot: h.a, color: mix(lo, hi, t), z: b });
    });
  }
  if (chance(.5)) centers.forEach(h => circle({ x: h.x, y: h.y, w: ctx.S * .02, h: ctx.S * .02, color: ctx.P.ink, z: 99 }));
}
