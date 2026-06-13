import { ctx, rand, ri, choice, pick, times, shape, chance, shuffle, mix } from '../utils.js';
export default function spiral() {
  const [cx, cy] = [ctx.W / 2 + rand(-.08, .08) * ctx.W, ctx.H / 2 + rand(-.08, .08) * ctx.H], cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const arms = choice([1, 1, 2, 3, 4]), per = ri(16, 30), turns = rand(2, 5), maxR = ctx.S * rand(.42, .6);
  const grow = pick(['grow', 'shrink', 'const']), kinds = chance(.5) ? [pick(['circle', 'square', 'diamond', 'triangle', 'hexagon'])] : ['circle', 'square', 'diamond', 'triangle'];
  const cpol = pick(['arm', 'gradient', 'random']);
  times(arms, arm => { const a0 = arm / arms * Math.PI * 2; times(per, i => {
    const t = i / per, ang = a0 + t * turns * Math.PI * 2, rad = maxR * Math.pow(t, .62);
    const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad;
    const sz = ctx.S * (grow === 'grow' ? .025 + t * .075 : grow === 'shrink' ? .1 - t * .07 : .055);
    const col = cpol === 'arm' ? cs[arm % cs.length] : cpol === 'gradient' ? mix(cs[0], cs[cs.length - 1], t) : pick(cs);
    shape(x, y, Math.max(8, sz), ctx.POOL, { kind: pick(kinds), color: col, rot: ang * 57.3 });
  }); });
  if (chance(.5)) shape(cx, cy, ctx.S * rand(.08, .16), cs, { kind: pick(['circle', 'rings', 'donut', 'star', 'hexagon']), color: ctx.P.accent });
}
