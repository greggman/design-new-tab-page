import { ctx, rand, ri, times, shuffle, box, mix, chance, pick } from '../utils.js';
// Waveform: a row of bars mirrored about a center axis, heights shaped by summed sines so it reads
// as a captured audio signal / equalizer. The mirror symmetry is the spectrum-analyzer signature.
export default function waveform() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), n = ri(26, 64), cy = ctx.H * rand(.4, .6), gap = ctx.W * .002;
  const bw = (ctx.W - gap * (n + 1)) / n, f1 = rand(1, 4), f2 = rand(2, 7), ph = rand(0, 6.28), grad = chance(.5);
  times(n, i => {
    const t = i / n, env = Math.sin(t * Math.PI), raw = Math.sin(t * Math.PI * 2 * f1 + ph) * .55 + Math.sin(t * Math.PI * 2 * f2) * .3 + rand(-.12, .12);
    const h = Math.max(bw * .5, Math.abs(raw) * env * ctx.H * rand(.6, .85) + bw * .4);
    box({ x: gap + bw / 2 + i * (bw + gap), y: cy, w: bw, h, color: grad ? mix(cs[0], cs[cs.length - 1], t) : pick(cs) });
  });
  box({ x: ctx.W / 2, y: cy, w: ctx.W, h: Math.max(2, ctx.S * .003), color: ctx.P.accent, z: 5 });
}
