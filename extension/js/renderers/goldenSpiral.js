import { ctx, rand, ri, times, shuffle, box, mix, chance, circle } from '../utils.js';
// Golden spiral: squares scaled by 1/φ and rotated a quarter-turn about a shared focus, nesting
// inward. The Fibonacci ratio is the oldest rule for a proportion that simply feels right.
export default function goldenSpiral() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), phi = 1.618, n = ri(7, 11);
  const fx = ctx.W / 2 + rand(-.12, .12) * ctx.W, fy = ctx.H / 2 + rand(-.12, .12) * ctx.H;
  let s = Math.min(ctx.W, ctx.H) * rand(.5, .62);
  const start = ri(0, 3), dirs = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  times(n, i => {
    const k = (start + i) % 4, d = dirs[k];
    box({ x: fx + d[0] * s / 2, y: fy + d[1] * s / 2, w: s, h: s, color: mix(cs[i % cs.length], ctx.P.bg, i / n * .12), z: i });
    s /= phi;
  });
  if (chance(.7)) circle({ x: fx, y: fy, w: s * 2, h: s * 2, color: ctx.P.accent, z: n + 1 });
}
