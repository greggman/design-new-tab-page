import { ctx, rand, ri, times, shuffle, shape, pick, choice, chance, blendMode } from '../utils.js';
// Kaleidoscope: a random motif placed in one wedge, then mirrored within the wedge and repeated
// around the circle. Reflective + rotational symmetry turns a few shapes into a hypnotic mandala.
export default function kaleidoscope() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), cx = ctx.W / 2, cy = ctx.H / 2;
  const sectors = choice([6, 8, 10, 12]), seg = 360 / sectors, bl = chance(.35) ? blendMode() : null, motif = [];
  times(ri(3, 6), () => motif.push({ rad: ctx.S * rand(.05, .42), ang: rand(0, seg / 2), sz: ctx.S * rand(.04, .12), kind: pick(['circle', 'diamond', 'triangle', 'square', 'kite', 'star', 'hexagon']), col: pick(cs) }));
  times(sectors, s => { const baseA = s * seg; motif.forEach(p => [p.ang, seg - p.ang].forEach(a => { const ang = (baseA + a) * Math.PI / 180; shape(cx + Math.cos(ang) * p.rad, cy + Math.sin(ang) * p.rad, p.sz, ctx.POOL, { kind: p.kind, color: p.col, rot: baseA + a, blend: bl }); })); });
  shape(cx, cy, ctx.S * rand(.08, .16), cs, { kind: pick(['circle', 'rings', 'star', 'donut']), color: ctx.P.accent });
}
