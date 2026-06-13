import { ctx, ri, times, pick, box, rand, shuffle, mix, chance } from '../utils.js';
export default function brickWall() {
  const rows = ri(6, 12), cs = shuffle([...ctx.POOL, ctx.P.accent]), rh = ctx.H / rows, cpol = pick(['gradient', 'random', 'rowband']);
  times(rows, r => { const cols = ri(4, 8), bw = ctx.W / cols, off = r % 2 ? bw / 2 : 0; times(cols + 1, c => {
    const col = cpol === 'gradient' ? mix(cs[0], cs[cs.length - 1], r / rows) : cpol === 'rowband' ? cs[r % cs.length] : pick(cs);
    box({ x: c * bw - off + bw / 2, y: (r + .5) * rh, w: bw * .94, h: rh * .86, color: col, radius: chance(.3) ? Math.min(bw, rh) * .2 : 0 });
  }); });
}
