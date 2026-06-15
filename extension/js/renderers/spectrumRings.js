import { ctx, rand, ri, shuffle, circle, hslToHex, choice, chance, thirds, rings } from '../utils.js';
// Spectrum rings: concentric discs sweeping continuously through hue — a rainbow target. Ignores the
// palette on purpose for a saturated chromatic gradient; the smooth hue ramp is the whole effect.
export default function spectrumRings() {
  const [cx, cy] = chance(.1) ? [ctx.W / 2, ctx.H / 2] : thirds();
  const maxR = Math.hypot(Math.max(cx, ctx.W - cx), Math.max(cy, ctx.H - cy)) * 1.05;
  const n = ri(20, 42), h0 = ri(0, 359), dir = choice([1, -1]);
  const step = n;
  // mostly a narrower hue window (a varied family each run) — occasionally a full rainbow sweep
  const arc = choice([180, 360]);//; chance(0.3) ? choice([3, 3]) : rand(55, 175);
  const odd = choice([0.75, 100, 0]);
  const sat = rand(58, 90), lit = ctx.P.dark ? rand(44, 62) : rand(48, 66);
  for (let k = n; k >= 1; k--) {
    const t = k / n;
    const l = lit * (k % 2 ? 1 : odd);
    circle({
      x: cx,
      y: cy,
      w: t * maxR * 2, h: t * maxR * 2,
      color: hslToHex(h0 + dir * t * step * arc, sat, lit * (k % 2 ? 1 : odd)),
      z: 1,
    });
  }
  if (chance(.5)) rings({ x: cx, y: cy, r: maxR * (n * 0.14 | 0) / n, colors: [ctx.P.bg, hslToHex(h0, sat, lit)], rw: maxR * .03 });
}
