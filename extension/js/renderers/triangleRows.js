import { ctx, ri, times, rand, mix, CLIPS, box, pick, shuffle, chance } from '../utils.js';
export default function triangleRows() {
  const rows = ri(3, 7), cs = shuffle([...ctx.POOL, ctx.P.accent]), rh = ctx.H / rows;
  times(rows, r => { const cols = ri(4, 9), cw = ctx.W / cols; times(cols + 1, c => { const up = chance(.5); box({ x: c * cw, y: (r + .5) * rh, w: cw * 1.05, h: rh * rand(.7, 1), color: mix(cs[r % cs.length], cs[(r + 1) % cs.length], c / cols), clip: CLIPS.triangle, rot: up ? 0 : 180 }); }); });
}
