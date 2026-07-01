import { ctx, ri, rand, times, shuffle, pick, circle, ring, box, mix, chance } from '../utils.js';
// Leopard: scattered rosettes — a broken dark ring around a warmer inner blotch — over a tawny ground.
export default function leopard() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const ground = mix(ctx.P.bg, cs[cs.length - 1], .35), dark = mix(ctx.P.ink, cs[0], .25), fill = cs[0];
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: ground, z: -2 });
  const n = ri(26, 50);
  times(n, () => {
    const x = rand(0, 1) * ctx.W, y = rand(0, 1) * ctx.H, r = ctx.S * rand(.03, .07);
    // rosette = 2-4 dark arcs around a soft inner fill
    circle({ x, y, w: r * 1.2, h: r * 1.2, color: mix(fill, ground, .3), z: 1 });
    times(ri(3, 5), i => {
      const a = i / 4 * 360 + rand(-20, 20), rr = r * rand(.7, 1);
      circle({ x: x + Math.cos(a * Math.PI / 180) * rr, y: y + Math.sin(a * Math.PI / 180) * rr, w: r * rand(.5, .8), h: r * rand(.5, .8), color: dark, z: 2 });
    });
  });
}
