import { ctx, thirds, nested, ri, times, shape, pick, shuffle, rand, CLIPS, POLY } from '../utils.js';
export default function nestedPolys() {
  const [fx, fy] = thirds();
  nested({ x: fx, y: fy, r: ctx.S * rand(.36, .55), clip: CLIPS[pick(['triangle', 'hexagon', 'diamond', 'pentagon', 'octagon'])], colors: shuffle([ctx.P.accent, ...ctx.POOL]), layers: ri(4, 7) });
  times(ri(1, 3), () => shape(rand(.1, .9) * ctx.W, rand(.1, .9) * ctx.H, ctx.S * rand(.1, .22), ctx.POOL, { kind: pick([...POLY, 'circle', 'half', 'ring']) }));
}
