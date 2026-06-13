import { ctx, rand, ri, times, shuffle, line, box, circle, shape, choice, chance, pick, mix } from '../utils.js';
// Suprematism: Malevich / El Lissitzky — a few bold bars, a dominant square and a disc flung across
// an open ground at dynamic angles, pinned by long thin lines. Asymmetry and diagonal tension.
export default function suprematism() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), S = ctx.S, ang = () => choice([0, 18, -18, 35, -35, 45, -45, 90]);
  times(ri(1, 3), () => line({ x: rand(.2, .8) * ctx.W, y: rand(.2, .8) * ctx.H, len: Math.hypot(ctx.W, ctx.H), rot: rand(0, 180), thick: Math.max(2, S * rand(.004, .011)), color: ctx.P.ink, z: 1 }));
  times(ri(2, 4), () => box({ x: rand(.22, .78) * ctx.W, y: rand(.22, .78) * ctx.H, w: S * rand(.28, .68), h: S * rand(.03, .12), color: pick(cs), rot: ang(), z: ri(2, 5) }));
  box({ x: rand(.32, .68) * ctx.W, y: rand(.32, .68) * ctx.H, w: S * rand(.18, .3), h: S * rand(.18, .3), color: cs[0], rot: choice([0, 12, -12, 45]), z: 6 });
  if (chance(.85)) { const d = S * rand(.1, .22); circle({ x: rand(.2, .8) * ctx.W, y: rand(.2, .8) * ctx.H, w: d, h: d, color: ctx.P.accent, z: 7 }); }
  times(ri(1, 3), () => shape(rand(.15, .85) * ctx.W, rand(.15, .85) * ctx.H, S * rand(.05, .13), cs, { kind: pick(['triangle', 'square', 'diamond', 'circle']), color: pick(cs), rot: ang(), z: 8 }));
}
