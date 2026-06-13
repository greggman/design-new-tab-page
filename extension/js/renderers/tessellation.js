import { ctx, pick, shuffle, mix, CLIPS, chance, times, ri, box, POLY, rand, clamp } from '../utils.js';
export default function tessellation() {
  const mode = pick(['hex', 'triangle', 'diamond', 'square']), cs = shuffle([...ctx.POOL, ctx.P.accent]), cA = cs[0], cB = cs[1] || ctx.P.accent, cC = cs[2] || ctx.P.ink;
  const pol = pick(['gradient', 'random', 'banded']);
  const col = (cx, cy, nx, ny) => pol === 'random' ? pick(cs) : pol === 'banded' ? cs[(cx + cy) % cs.length] : mix(mix(cA, cB, clamp((cx / nx + cy / ny) / 2, 0, 1)), cC, chance(.2) ? rand(0, .35) : 0);
  if (mode === 'hex') { const w = ctx.S * rand(.09, .15), h = w * 1.1547, sy = h * .75, C = Math.ceil(ctx.W / w) + 2, R = Math.ceil(ctx.H / sy) + 2; times(R, r => times(C, c => { if (chance(.08)) return; box({ x: c * w + (r % 2 ? w / 2 : 0), y: r * sy, w: w * .96, h: h * .96, color: col(c, r, C, R), clip: CLIPS.hexagon }); })); }
  else if (mode === 'triangle') { const w = ctx.S * rand(.11, .18), h = w * .9, R = Math.ceil(ctx.H / h) + 1, C = Math.ceil(ctx.W / w) * 2 + 2; times(R, r => times(C, c => { if (chance(.06)) return; box({ x: c * (w / 2), y: (r + .5) * h, w, h, color: col(c, r, C, R), clip: CLIPS.triangle, rot: c % 2 ? 180 : 0 }); })); }
  else if (mode === 'diamond') { const w = ctx.S * rand(.11, .17), R = Math.ceil(ctx.H / (w / 2)) + 2, C = Math.ceil(ctx.W / w) + 2; times(R, r => times(C, c => { if (chance(.08)) return; box({ x: c * w + (r % 2 ? w / 2 : 0), y: r * (w / 2), w, h: w, color: col(c, r, C, R), clip: CLIPS.diamond }); })); }
  else { const w = ctx.S * rand(.08, .14), R = Math.ceil(ctx.H / w) + 1, C = Math.ceil(ctx.W / w) + 1; times(R, r => times(C, c => box({ x: (c + .5) * w, y: (r + .5) * w, w: w * .98, h: w * .98, color: col(c, r, C, R) }))); }
}
