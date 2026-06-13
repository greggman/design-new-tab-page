import { ctx, rand, ri, times, shuffle, ring, chance, mix } from '../utils.js';
// Moiré rings: two or three sets of evenly-spaced concentric rings with offset centers. Where the
// sets overlap they interfere, generating emergent secondary patterns from pure repetition.
export default function moireRings() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), sets = ri(2, 3);
  times(sets, s => {
    const x = rand(.28, .72) * ctx.W, y = rand(.28, .72) * ctx.H, n = ri(9, 18);
    const gap = ctx.S * rand(.028, .05), lw = Math.max(2, gap * rand(.28, .5)), col = cs[s % cs.length];
    times(n, i => ring({ x, y, d: (i + 1) * gap * 2, w: lw, color: col, z: s }));
  });
}
