import { ctx, rand, ri, times, shuffle, box, circle, line, mix, pick, chance } from '../utils.js';
// Gears: a few cogwheels — a disc rimmed with radial teeth, a hub hole, and spokes. Mechanical and
// figurative; the wheels sit on the background so it shows around and between them.
export default function gears() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), n = ri(2, 5);
  times(n, () => {
    const x = rand(.18, .82) * ctx.W, y = rand(.22, .78) * ctx.H, R = ctx.S * rand(.1, .22), teeth = ri(8, 16), col = pick(cs);
    times(teeth, i => { const a = i / teeth * 360; box({ x: x + Math.cos(a * Math.PI / 180) * R, y: y + Math.sin(a * Math.PI / 180) * R, w: R * .26, h: R * .34, color: col, rot: a + 90, z: 1 }); });
    circle({ x, y, w: R * 2, h: R * 2, color: col, z: 2 });
    if (chance(.6)) times(ri(4, 7), i => line({ x, y, len: R * 1.5, rot: i * (180 / ri(4, 7)), thick: Math.max(2, R * .1), color: mix(col, ctx.P.bg, .35), z: 3 }));
    circle({ x, y, w: R * rand(.32, .5), h: R * rand(.32, .5), color: ctx.P.bg, z: 4 });
    circle({ x, y, w: R * .16, h: R * .16, color: col, z: 5 });
  });
}
