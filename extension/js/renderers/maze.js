import { ctx, ri, rand, times, shuffle, box, circle, mix, pick, chance } from '../utils.js';
// Maze / circuit: each grid cell sprouts thick connectors toward a random subset of its neighbors,
// so the marks fuse into continuous routed paths. Connectivity reads as intent, not noise.
export default function maze() {
  const cols = ri(6, 14), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw), cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const thick = Math.max(3, cw * rand(.14, .24)), dirs = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }, grad = chance(.6);
  times(rows, r => times(cols, c => {
    const x = (c + .5) * cw, y = (r + .5) * cw, col = grad ? mix(cs[0], cs[cs.length - 1], (c / cols + r / rows) / 2) : pick(cs);
    shuffle(['N', 'S', 'E', 'W']).slice(0, ri(2, 3)).forEach(k => {
      const d = dirs[k];
      box({ x: x + d[0] * cw / 4, y: y + d[1] * cw / 4, w: d[0] ? cw / 2 + thick : thick, h: d[1] ? cw / 2 + thick : thick, color: col });
    });
    if (chance(.22)) circle({ x, y, w: thick * 1.7, h: thick * 1.7, color: ctx.P.accent, z: 3 });
  }));
}
