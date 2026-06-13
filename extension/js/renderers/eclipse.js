import { ctx, rand, ri, times, shuffle, circle, ring, chance, mix, choice } from '../utils.js';
// Eclipse: a disc carved by a background-colored disc offset across it, leaving a crescent.
// Figure/ground reversal — the negative space becomes the subject.
export default function eclipse() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), n = ri(1, 3);
  times(n, k => {
    const r = ctx.S * rand(.2, .42), x = rand(.22, .78) * ctx.W, y = rand(.26, .74) * ctx.H;
    if (chance(.45)) ring({ x, y, d: r * rand(2.2, 2.7), w: ctx.S * rand(.01, .02), color: mix(ctx.P.ink, ctx.P.bg, .55), z: 0 });
    circle({ x, y, w: r * 2, h: r * 2, color: cs[k % cs.length], z: 1 });
    const ang = rand(0, 6.28), off = r * rand(.35, .75);
    circle({ x: x + Math.cos(ang) * off, y: y + Math.sin(ang) * off, w: r * 2, h: r * 2, color: choice([ctx.P.bg, ctx.P.bg, cs[(k + 1) % cs.length]]), z: 2 });
  });
}
