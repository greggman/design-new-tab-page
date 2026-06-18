import { ctx, rand, ri, times, shuffle, box, shape, pick, chance, blendMode } from '../utils.js';
// Rosette: petal ellipses arrayed radially in one or more rings, a flower or mandala. Rotational
// symmetry plus a strong center is among the most universally pleasing arrangements.
export default function rosette() {
  const count = ri(1, 3);
  times(count, () => {
    const cx = rand(-0.04,1.04) * ctx.W;
    const cy = rand(-0.04,1.04) * ctx.H;
    const cs = shuffle([ctx.P.accent, ...ctx.POOL]);
    const layers = ri(1, 3), bl = chance(.4) ? blendMode() : null;
    times(layers, L => {
      const petals = pick([6, 8, 10, 12]), pr = ctx.S * (.15 + L * .1), pw = pr * rand(.42, .72), ph = pr * rand(1.4, 1.8);
      times(petals, i => {
        const ang = i / petals * 360 + L * 15, x = cx + Math.cos(ang * Math.PI / 180) * pr * .5, y = cy + Math.sin(ang * Math.PI / 180) * pr * .5;
        box({ x, y, w: pw, h: ph, color: cs[(L + 1) % cs.length], radius: '50%', rot: ang + 90, blend: bl, opacity: rand(.82, 1) });
      });
    });
    shape(cx, cy, ctx.S * rand(.08, .15), cs, { kind: pick(['circle', 'rings', 'donut']), color: ctx.P.accent });
  });
}
