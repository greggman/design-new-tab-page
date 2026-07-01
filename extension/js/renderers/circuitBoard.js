import { ctx, ri, rand, times, shuffle, pick, line, circle, box, mix, chance } from '../utils.js';
// Circuit board: orthogonal traces walking a grid with pads and vias, plus a few chip rectangles —
// PCB artwork.
function trace(gx, gy, step, cols, rows, steps, th, col) {
  let x = gx, y = gy, dir = ri(0, 3);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  times(steps, () => {
    if (chance(.5)) dir = ri(0, 3);
    const len = ri(1, 4);
    const nx = Math.max(0, Math.min(cols, x + dirs[dir][0] * len)), ny = Math.max(0, Math.min(rows, y + dirs[dir][1] * len));
    const ax = nx * step, ay = ny * step, bx = x * step, by = y * step;
    if (ax !== bx || ay !== by) line({ x: (ax + bx) / 2, y: (ay + by) / 2, len: Math.hypot(ax - bx, ay - by) + th, rot: Math.atan2(ay - by, ax - bx) * 180 / Math.PI, thick: th, color: col, z: 2 });
    x = nx; y = ny;
  });
  return [x * step, y * step];
}
export default function circuitBoard() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const board = mix(ctx.P.bg, ctx.P.ink, .12), trace1 = cs[0], pad = ctx.P.accent;
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: board, z: -2 });
  const step = ctx.S * rand(.04, .06), cols = Math.round(ctx.W / step), rows = Math.round(ctx.H / step);
  const th = Math.max(2, step * .12);
  times(ri(10, 18), () => {
    const [ex, ey] = trace(ri(0, cols), ri(0, rows), step, cols, rows, ri(4, 9), th, pick(cs));
    circle({ x: ex, y: ey, w: step * .5, h: step * .5, color: pad, z: 3 });
  });
  times(ri(3, 6), () => { const w = step * ri(2, 5), h = step * ri(1, 3); box({ x: rand(.1, .9) * ctx.W, y: rand(.1, .9) * ctx.H, w, h, color: mix(ctx.P.ink, board, .3), radius: 2, z: 4 }); });
}
