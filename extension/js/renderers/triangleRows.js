import { ctx, ri, times, rand, mix, CLIPS, box, pick, shuffle, chance, groundScheme, oneSide } from '../utils.js';
// The ground showing between the triangles is any palette hue at any lightness. Each row blends between two
// colours, so they all sit on one side of the ground's lightness (oneSide) and no stretch of a row fades into it.
export default function triangleRows() {
  const rows = ri(3, 7), { ground, fg } = groundScheme(), cs = oneSide(fg, ground), rh = ctx.H / rows;
  times(rows, r => { const cols = ri(4, 9), cw = ctx.W / cols; times(cols + 1, c => { const up = chance(.5); box({ x: c * cw, y: (r + .5) * rh, w: cw * 1.05, h: rh * rand(.7, 1), color: mix(cs[r % cs.length], cs[(r + 1) % cs.length], c / cols), clip: CLIPS.triangle, rot: up ? 0 : 180 }); }); });
}
