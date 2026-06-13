import { ctx, ri, rand, times, shuffle, box, mix, chance, choice, pick } from '../utils.js';
// Staircase: columns of monotonically increasing height anchored to the baseline, forming a clean
// diagonal edge. Implied motion and a strong leading line from a simple progression.
export default function staircase() {
  const steps = ri(6, 13), sw = ctx.W / steps, sh = ctx.H / steps, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const flip = chance(.5), cpol = pick(['gradient', 'gradient', 'random']);
  times(steps, i => {
    const idx = flip ? steps - 1 - i : i, h = (i + 1) * sh;
    const col = cpol === 'gradient' ? mix(cs[0], cs[cs.length - 1], i / steps) : pick(cs);
    box({ x: (idx + .5) * sw, y: ctx.H - h / 2, w: sw * 1.04, h, color: col });
  });
}
