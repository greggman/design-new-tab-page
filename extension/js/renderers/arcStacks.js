import { ctx, ri, times, shuffle, rand, choice, halfDisc } from '../utils.js';
export default function arcStacks() {
  const groups = ri(1, 3), cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  times(groups, () => { const x = rand(.2, .8) * ctx.W, y = rand(.25, .9) * ctx.H, R = ctx.S * rand(.22, .42), n = ri(3, 6), rot = choice([0, 90, 180, 270, 45]); times(n, i => halfDisc({ x, y, r: R * (1 - i / (n + 0.4)), color: cs[i % cs.length], rot, z: i })); });
}
