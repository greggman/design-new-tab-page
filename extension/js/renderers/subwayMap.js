import { ctx, ri, rand, times, shuffle, pick, line, circle, mix, chance } from '../utils.js';
// Subway map: a handful of coloured routes running in straight 45°/90° segments with interchange dots,
// in the style of a transit diagram.
export default function subwayMap() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const th = ctx.S * rand(.012, .02), dirs = [0, 45, 90, 135, 180, 225, 270, 315];
  const routes = ri(3, 6);
  times(routes, ri_ => {
    const col = cs[ri_ % cs.length];
    let x = rand(.05, .95) * ctx.W, y = rand(.05, .95) * ctx.H;
    const joints = [[x, y]];
    times(ri(4, 8), () => {
      const a = pick(dirs) * Math.PI / 180, len = ctx.S * rand(.12, .28);
      const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len;
      line({ x: (x + nx) / 2, y: (y + ny) / 2, len: Math.hypot(nx - x, ny - y) + th, rot: a * 180 / Math.PI, thick: th, color: col, z: 2 });
      x = nx; y = ny; joints.push([x, y]);
    });
    joints.forEach(([jx, jy]) => { if (chance(.6)) circle({ x: jx, y: jy, w: th * 1.5, h: th * 1.5, color: ctx.P.bg, border: `${th * .35}px solid ${mix(col, ctx.P.ink, .3)}`, z: 3 }); });
  });
}
