import { ctx, rand, ri, times, shuffle, ring, circle, mix, pick, chance, blendMode } from '../utils.js';
// Bubbles: overlapping soap-bubble outlines of varied size, each with a faint translucent fill and a
// small specular highlight. Free-floating and transparent, so they layer without hiding the ground.
export default function bubbles() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), n = ri(10, 22), bl = blendMode();
  times(n, () => {
    const d = ctx.S * rand(.06, .34), x = rand(0, 1) * ctx.W, y = rand(0, 1) * ctx.H, col = pick(cs);
    if (chance(.6)) circle({ x, y, w: d, h: d, color: col, opacity: rand(.08, .2), blend: bl, z: 0 });
    ring({ x, y, d, w: Math.max(2, d * rand(.03, .07)), color: col, z: 1 });
    circle({ x: x - d * .2, y: y - d * .2, w: d * .12, h: d * .12, color: mix(col, '#ffffff', .6), opacity: .7, z: 2 });
  });
}
