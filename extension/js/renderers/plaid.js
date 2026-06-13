import { ctx, ri, rand, times, shuffle, box, pick, mix, chance, blendMode } from '../utils.js';
// Plaid / tartan: translucent vertical and horizontal bands overlaid with a multiply/screen blend,
// so the crossings deepen into a woven third color. Order from layered transparency.
export default function plaid() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]), bl = blendMode();
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: mix(cs[0], ctx.P.bg, .35), z: -1 });
  times(ri(4, 9), () => box({ x: rand(0, 1) * ctx.W, y: ctx.H / 2, w: ctx.W * rand(.03, .13), h: ctx.H, color: pick(cs), opacity: rand(.35, .62), blend: bl }));
  times(ri(4, 9), () => box({ x: ctx.W / 2, y: rand(0, 1) * ctx.H, w: ctx.W, h: ctx.H * rand(.03, .13), color: pick(cs), opacity: rand(.35, .62), blend: bl }));
  if (chance(.5)) { const t = Math.max(2, ctx.S * .004); times(ri(3, 6), () => box({ x: rand(0, 1) * ctx.W, y: ctx.H / 2, w: t, h: ctx.H, color: ctx.P.ink, opacity: .4, blend: bl })); times(ri(3, 6), () => box({ x: ctx.W / 2, y: rand(0, 1) * ctx.H, w: ctx.W, h: t, color: ctx.P.ink, opacity: .4, blend: bl })); }
}
