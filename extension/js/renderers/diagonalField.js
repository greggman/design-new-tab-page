import { ctx, choice, shuffle, rand, ri, box, times, thirds, chance, rings, shape, pick, blendMode } from '../utils.js';
export default function diagonalField() {
  const ang = choice([28, -28, 35, -35, 45, -45]), cs = shuffle(ctx.POOL), n = ri(3, 6), span = Math.hypot(ctx.W, ctx.H);
  let ws = Array.from({ length: n }, () => rand(.5, 1.5)); const sum = ws.reduce((a, b) => a + b, 0); ws = ws.map(w => w / sum * span * 1.2);
  let p = -span * .1; ws.forEach((w, i) => { box({ x: ctx.W / 2, y: ctx.H / 2, w: span * 1.4, h: w, color: cs[i % cs.length], rot: ang, z: i }); p += w; });
  ctx.root.querySelectorAll('.dband').forEach(e => e.remove());
  const [fx, fy] = thirds();
  if (chance(.8)) (chance(.5) ? rings({ x: fx, y: fy, r: ctx.S * rand(.22, .38), colors: shuffle([ctx.P.accent, ctx.P.ink]) }) : shape(fx, fy, ctx.S * rand(.3, .5), [ctx.P.accent], { kind: pick(['circle', 'donut', 'ring']), blend: blendMode() }));
}
