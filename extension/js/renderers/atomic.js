import { ctx, ri, rand, times, shuffle, pick, line, circle, box, mix, chance } from '../utils.js';
// Atomic: mid-century "Sputnik" motifs — starbursts of spokes tipped with little balls, plus a couple
// of thin elliptical orbits. Retro 1950s.
function starburst(cx, cy, r, spokes, col, tip) {
  times(spokes, i => {
    const a = i / spokes * 360 + rand(-4, 4), rr = r * rand(.7, 1.1);
    const ex = cx + Math.cos(a * Math.PI / 180) * rr, ey = cy + Math.sin(a * Math.PI / 180) * rr;
    line({ x: (cx + ex) / 2, y: (cy + ey) / 2, len: rr, rot: a, thick: Math.max(1.5, r * .03), color: col, z: 2 });
    circle({ x: ex, y: ey, w: r * .12, h: r * .12, color: tip, z: 3 });
  });
  circle({ x: cx, y: cy, w: r * .22, h: r * .22, color: tip, z: 3 });
}
export default function atomic() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  times(ri(3, 6), () => starburst(rand(.15, .85) * ctx.W, rand(.15, .85) * ctx.H, ctx.S * rand(.08, .18), ri(8, 16), pick(cs), pick(cs)));
  times(ri(1, 3), () => {
    const cx = rand(.2, .8) * ctx.W, cy = rand(.2, .8) * ctx.H, w = ctx.S * rand(.3, .55);
    box({ x: cx, y: cy, w, h: w * rand(.3, .5), radius: '50%', border: `${Math.max(1.5, ctx.S * .004)}px solid ${mix(pick(cs), ctx.P.bg, .2)}`, rot: rand(0, 180), z: 1 });
  });
}
