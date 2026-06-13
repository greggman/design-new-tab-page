import { ctx, rand, ri, shuffle, circle, hslToHex, choice, chance, thirds, rings } from '../utils.js';
// Spectrum rings: concentric discs sweeping continuously through hue — a rainbow target. Ignores the
// palette on purpose for a saturated chromatic gradient; the smooth hue ramp is the whole effect.
export default function spectrumRings() {
  const [cx, cy] = chance(.5) ? [ctx.W / 2, ctx.H / 2] : thirds();
  const maxR = Math.hypot(Math.max(cx, ctx.W - cx), Math.max(cy, ctx.H - cy)) * 1.05;
  const n = ri(20, 42), h0 = ri(0, 359), dir = choice([1, -1]), arc = choice([180, 270, 360]);
  const sat = rand(62, 86), lit = ctx.P.dark ? rand(46, 60) : rand(50, 64);
  for (let k = n; k >= 1; k--) { const t = k / n; circle({ x: cx, y: cy, w: t * maxR * 2, h: t * maxR * 2, color: hslToHex(h0 + dir * t * arc, sat, lit), z: n - k }); }
  if (chance(.5)) rings({ x: cx, y: cy, r: maxR * .14, colors: [ctx.P.bg, hslToHex(h0, sat, lit)], rw: maxR * .03 });
}
