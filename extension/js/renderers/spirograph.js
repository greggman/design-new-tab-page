import { ctx, rand, ri, times, shuffle, line, mix, chance } from '../utils.js';
// Spirograph: a hypotrochoid traced by a point on a circle rolling inside another. The looping
// guilloché lacework — security-print and trance-cover ornament alike. Closes after gcd-many turns.
export default function spirograph() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), cx = ctx.W / 2, cy = ctx.H / 2, scale = ctx.S * rand(.18, .28);
  const gcd = (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; };
  const R = ri(5, 9), r = ri(2, 7), d = rand(.45, 1) * r, f = (R - r) / r, amp = (R - r) + d, k = scale / amp;
  const period = Math.PI * 2 * (r / gcd(R, r)), seg = ri(420, 760), thick = Math.max(1.2, ctx.S * .0022);
  let px = 0, py = 0;
  times(seg + 1, i => {
    const th = i / seg * period, x = cx + k * ((R - r) * Math.cos(th) + d * Math.cos(f * th)), y = cy + k * ((R - r) * Math.sin(th) - d * Math.sin(f * th));
    if (i > 0) { const dx = x - px, dy = y - py; line({ x: (px + x) / 2, y: (py + y) / 2, len: Math.hypot(dx, dy) + 1, rot: Math.atan2(dy, dx) * 57.2958, thick, color: mix(cs[0], cs[cs.length - 1], i / seg), z: 1 }); }
    px = x; py = y;
  });
}
