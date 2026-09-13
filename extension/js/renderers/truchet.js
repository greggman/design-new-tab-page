import { ctx, ri, shuffle, choice, box, mix, chance, labDist, readable, grid } from '../utils.js';
// Truchet tiles: a grid of diagonally-split squares in random orientation. Tonal two-tone field
// that reads as a flowing maze — the appeal is local contrast resolving into a global rhythm.
//
// The maze is only there if the two tones are far apart, so the pair is chosen for it rather than taken as the first
// two palette colours (accent can duplicate a POOL colour, and near-neighbours are common — 3 in 10 renders read as
// near-solid). The gradient used to run a→b under b→a, which meets in the MIDDLE of the canvas: the two tones were
// identical along the centre diagonal however far apart the pair was. Now each tone runs along its own ramp, a→a2
// and b→b2, and the pair of ramps is accepted only if the tones stay apart all the way across.
const NEED = .32, NEED_GRAD = .26;
export default function truchet() {
  const cols = ri(5, 12), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw);
  const cs = shuffle([...new Set([...ctx.POOL, ctx.P.accent, ...ctx.P.colors])]);
  const pairs = cs.flatMap((x, i) => cs.flatMap((y, j) => i !== j && labDist(x, y) >= NEED ? [[x, y]] : []));
  let [a, b] = pairs[0] ?? [cs[0], cs[1] ?? ctx.P.ink];
  if (labDist(a, b) < NEED) b = readable([b], a, NEED)[0];
  if (labDist(a, b) < NEED) a = readable([a], b, NEED)[0];
  let a2 = a, b2 = b;
  if (chance(.5)) {
    // Ramp ends: any palette colour, or a tone itself (so one tone can hold while the other travels), or a tone
    // pushed toward light or dark. Accept a pair that visibly moves and keeps the tones apart at every step.
    const ends = [...new Set([...cs, ...[a, b].flatMap(c => [c, mix(c, '#ffffff', .45), mix(c, '#000000', .45)])])];
    const apart = (p, q) => [0, .25, .5, .75, 1].every(t => labDist(mix(a, p, t), mix(b, q, t)) >= NEED_GRAD);
    const ramp = shuffle(ends.flatMap(p => ends.map(q => [p, q]))).find(([p, q]) => labDist(a, p) + labDist(b, q) >= .3 && apart(p, q));
    if (ramp) [a2, b2] = ramp;
  }
  const tri = 'polygon(0 0,100% 0,0 100%)', rots = [0, 90, 180, 270];
  grid(cols, rows, (c, r) => {
    const x = (c + .5) * cw, y = (r + .5) * cw, t = (c / Math.max(1, cols - 1) + r / Math.max(1, rows - 1)) / 2;
    box({ x, y, w: cw + 1, h: cw + 1, color: mix(a, a2, t) });
    box({ x, y, w: cw + 1, h: cw + 1, color: mix(b, b2, t), clip: tri, rot: choice(rots) });
  });
}
