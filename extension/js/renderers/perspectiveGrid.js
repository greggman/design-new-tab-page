import { ctx, rand, ri, times, shuffle, line, box, circle, mix, chance, choice } from '../utils.js';
// Perspective grid: the synthwave floor — verticals converging to a vanishing point on the horizon,
// horizontals compressing toward it, optional setting sun. One-point perspective = instant depth.
export default function perspectiveGrid() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), horizon = ctx.H * rand(.42, .56), vx = ctx.W / 2 + rand(-.12, .12) * ctx.W;
  const grid = cs[0], thick = Math.max(1.5, ctx.S * .0032);
  box({ x: ctx.W / 2, y: (horizon + ctx.H) / 2, w: ctx.W, h: ctx.H - horizon + 1, color: mix(ctx.P.bg, ctx.P.ink, .18), z: 0 });
  if (chance(.65)) { const r = ctx.S * rand(.16, .26), sy = horizon - r * rand(.05, .45); circle({ x: vx, y: sy, w: r * 2, h: r * 2, color: ctx.P.accent, z: 0 }); times(ri(4, 8), i => box({ x: vx, y: sy + r * (.1 + i * .22), w: r * 2.2, h: r * rand(.04, .1), color: mix(ctx.P.bg, ctx.P.ink, .18), z: 1 })); }
  const nV = ri(9, 17);
  times(nV + 1, i => { const bx = i / nV * ctx.W * 2 - ctx.W * .5, dx = bx - vx, dy = ctx.H - horizon; line({ x: (vx + bx) / 2, y: (horizon + ctx.H) / 2, len: Math.hypot(dx, dy), rot: Math.atan2(dy, dx) * 57.2958, thick, color: grid, z: 2 }); });
  const nH = ri(7, 12);
  times(nH, k => line({ x: ctx.W / 2, y: horizon + (ctx.H - horizon) * Math.pow((k + 1) / nH, 2.2), len: ctx.W, rot: 0, thick, color: grid, z: 3 }));
}
