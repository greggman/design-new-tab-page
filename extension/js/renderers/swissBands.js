import { ctx, chance, ri, rand, times, box, pick, shuffle, thirds, shape, blendMode } from '../utils.js';
export default function swissBands() {
  const horiz = chance(.4), n = ri(4, 8), cs = shuffle([...ctx.POOL, ctx.POOL[0]]);
  let ws = Array.from({ length: n }, () => rand(.6, 1.7)); const sum = ws.reduce((a, b) => a + b, 0); ws = ws.map(w => w / sum * (horiz ? ctx.H : ctx.W));
  let p = 0; ws.forEach((w, i) => { horiz ? box({ x: ctx.W / 2, y: p + w / 2, w: ctx.W, h: w, color: cs[i % cs.length] }) : box({ x: p + w / 2, y: ctx.H / 2, w, h: ctx.H, color: cs[i % cs.length] }); p += w; });
  times(ri(2, 4), () => { const [fx, fy] = thirds(); shape(fx, fy, ctx.S * rand(.18, .38), [ctx.P.accent, ctx.P.ink], { kind: pick(['circle', 'triangle', 'half', 'wedge', 'diamond', 'ring']), blend: blendMode() }); });
}
