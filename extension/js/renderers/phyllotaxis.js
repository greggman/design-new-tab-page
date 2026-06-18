import { ctx, shuffle, thirds, ri, rand, times, pick, clamp, shape, chance, mix } from '../utils.js';
export default function phyllotaxis() {
  const cx = ctx.W / 2 + rand(-0.2, 0.2) * ctx.W;
  const cy = ctx.H / 2 + rand(-0.2, 0.2) * ctx.H;
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const n = ri(120, 300), c = ctx.S * rand(.028, .045), ga = 137.5 * Math.PI / 180, cpol = pick(['radial', 'angular', 'random']), shrink = chance(.5);
  times(n, i => {
    const ang = i * ga, rad = c * Math.sqrt(i), x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad;
    if (x < -20 || x > ctx.W + 20 || y < -20 || y > ctx.H + 20) return;
    const t = i / n, sz = ctx.S * (shrink ? .05 - t * .03 : .015 + t * .03);
    const col = cpol === 'radial' ? mix(cs[0], cs[cs.length - 1], clamp(rad / (ctx.S * .55), 0, 1)) : cpol === 'angular' ? cs[i % cs.length] : pick(cs);
    shape(x, y, Math.max(5, sz), ctx.POOL, { kind: pick(['circle', 'circle', 'diamond', 'square']), color: col, rot: ang * 57.3 });
  });
}
