import { ctx, rand, ri, shuffle, el, rings, circle, mix, chance, choice, thirds } from '../utils.js';
// Hypno rays: a hard-edged conic gradient of alternating wedges — a spinning-disc sunburst. Crisp
// high-frequency radial contrast is maximally eye-grabbing; the trance-poster centerpiece.
export default function hypnoRays() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), [cx, cy] = chance(.5) ? [ctx.W / 2, ctx.H / 2] : thirds();
  const n = choice([16, 24, 32, 48]), seg = 360 / n, a = cs[0], b = cs[1] || mix(a, ctx.P.bg, .55), stops = [];
  for (let i = 0; i < n; i++) stops.push(`${i % 2 ? a : b} ${(i * seg).toFixed(2)}deg ${((i + 1) * seg).toFixed(2)}deg`);
  const D = Math.hypot(ctx.W, ctx.H) * 2.2;
  el({ left: cx + 'px', top: cy + 'px', width: D + 'px', height: D + 'px', borderRadius: '50%', background: `conic-gradient(from ${rand(0, 360).toFixed(1)}deg, ${stops.join(',')})`, zIndex: 0 }, 'translate(-50%,-50%) scale(.6)', 'translate(-50%,-50%)');
  if (chance(.7)) rings({ x: cx, y: cy, r: ctx.S * rand(.14, .26), colors: shuffle([ctx.P.accent, ...cs]), rw: ctx.S * rand(.025, .05) });
  else circle({ x: cx, y: cy, w: ctx.S * rand(.1, .18), h: ctx.S * rand(.1, .18), color: ctx.P.accent, z: 5 });
}
