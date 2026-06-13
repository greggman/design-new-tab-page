import { ctx, rand, ri, times, shuffle, circle, mix, chance, pick } from '../utils.js';
// Lissajous: the oscilloscope figure — x and y driven by sines at integer frequency ratios, traced
// as a glowing bead of dots. The audio-test-screen look that screamed "electronic" in 1998.
export default function lissajous() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), cx = ctx.W / 2, cy = ctx.H / 2;
  const curves = ri(1, 3);
  times(curves, q => {
    const A = ctx.W * rand(.28, .42), B = ctx.H * rand(.28, .42), a = ri(1, 5), b = ri(1, 5), delta = rand(0, Math.PI), N = ri(220, 380);
    const col = cs[q % cs.length], sz = Math.max(3, ctx.S * rand(.004, .009));
    times(N, i => { const t = i / N * Math.PI * 2; circle({ x: cx + A * Math.sin(a * t + delta), y: cy + B * Math.sin(b * t), w: sz, h: sz, color: chance(.5) ? mix(cs[0], cs[cs.length - 1], i / N) : col, z: q + 1 }); });
  });
}
