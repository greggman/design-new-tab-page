import { ctx, ri, rand, times, shuffle, box, mix, chance, pick } from '../utils.js';
// Bar stack: an abstract Swiss-style bar chart — evenly-gapped bars of varying height on a shared
// baseline. Aligned base + a single ground rule give it editorial, grid-driven clarity.
export default function barStack() {
  const n = ri(5, 12), cs = shuffle([...ctx.POOL, ctx.P.accent]), gap = ctx.W * rand(.006, .02);
  const bw = (ctx.W - gap * (n + 1)) / n, baseline = ctx.H * rand(.82, .95), grad = chance(.5);
  times(n, i => {
    const h = baseline * rand(.22, 1);
    box({ x: gap + bw / 2 + i * (bw + gap), y: baseline - h / 2, w: bw, h, color: grad ? mix(cs[0], cs[cs.length - 1], i / n) : pick(cs) });
  });
  box({ x: ctx.W / 2, y: baseline, w: ctx.W, h: Math.max(2, ctx.S * .004), color: ctx.P.ink, z: 5 });
}
