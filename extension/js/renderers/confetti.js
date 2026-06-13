import { ctx, ri, rand, times, shuffle, pick, choice, shape, chance, blendMode } from '../utils.js';
// Confetti: small shapes scattered with generous negative space. Controlled randomness — even
// dispersion and a limited palette keep it festive rather than noisy.
export default function confetti() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), n = ri(22, 46), kinds = ['circle', 'square', 'triangle', 'diamond', 'cross', 'star'];
  const bl = blendMode(), kit = chance(.4) ? [pick(kinds), pick(kinds)] : kinds;
  times(n, () => {
    const x = rand(.04, .96) * ctx.W, y = rand(.05, .95) * ctx.H, sz = ctx.S * rand(.02, .08);
    shape(x, y, sz, ctx.POOL, { kind: pick(kit), color: pick(cs), rot: choice([0, 15, 30, 45, 90, 180]), blend: chance(.3) ? bl : null });
  });
}
