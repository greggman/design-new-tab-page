import { ctx, ri, shuffle, times, pick, shape, blendMode, chance, rand, loosePt, choice } from '../utils.js';
export default function overlap() {
  const n = ri(3, 6), cs = shuffle([...ctx.POOL, ctx.P.accent]), bl = blendMode();
  times(n, i => { const [x, y] = loosePt(), sz = ctx.S * rand(.32, .85), k = pick(['circle', 'square', 'triangle', 'half', 'wedge', 'ring', 'diamond']); shape(x, y, sz, ctx.POOL, { kind: k, color: cs[i % cs.length], blend: chance(.75) ? bl : null, opacity: chance(.4) ? rand(.78, .95) : 1, rot: choice([0, 30, 45, 90, 180]) }); });
}
