import { ctx, rand, shuffle, labDist, rings, circle, mix, chance, choice, thirds, svgRoot, rrange } from '../utils.js';
// Hypno rays: a fan of hard-edged alternating wedges — a spinning-disc sunburst. Crisp
// high-frequency radial contrast is maximally eye-grabbing; the trance-poster centerpiece.
export default function hypnoRays() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), [cx, cy] = chance(.5) ? [ctx.W / 2, ctx.H / 2] : thirds();
  const n = choice([16, 24, 32, 48]), seg = Math.PI * 2 / n, a = cs[0];
  // The two ray colours must actually differ: accent often duplicates (or nearly matches) a pool colour, so
  // cs[1] alone can give one-colour rays. Take a random clearly-different colour, else the most different one,
  // and if even that is too close, push it toward whichever extreme is further from a.
  const far = cs.slice(1).filter(c => labDist(a, c) > .15);
  let b = far.length ? choice(far) : cs.slice(1).sort((x, y) => labDist(a, y) - labDist(a, x))[0];
  if (!b || labDist(a, b) < .15) b = mix(a, labDist(a, ctx.P.ink) > labDist(a, ctx.P.bg) ? ctx.P.ink : ctx.P.bg, .55);
  // one SVG triangle per ray, reaching far enough past the canvas that its straight outer edge is never seen
  const R = Math.hypot(ctx.W, ctx.H) * 1.1, a0 = rand(0, Math.PI * 2), svg = svgRoot();
  const pt = ang => `${(cx + Math.cos(ang) * R).toFixed(1)},${(cy + Math.sin(ang) * R).toFixed(1)}`;
  rrange(0, n, i => {
    const col = i % 2 ? a : b;
    // a 1px stroke in the fill color overlaps neighbours slightly, hiding anti-aliasing seams between rays
    svg.node('polygon', { points: `${cx.toFixed(1)},${cy.toFixed(1)} ${pt(a0 + i * seg)} ${pt(a0 + (i + 1) * seg)}`, fill: col, stroke: col, 'stroke-width': 1, 'stroke-linejoin': 'round' });
  });
  if (chance(.7)) rings({ x: cx, y: cy, r: ctx.S * rand(.14, .26), colors: shuffle([ctx.P.accent, ...cs]), rw: ctx.S * rand(.025, .05) });
  else circle({ x: cx, y: cy, w: ctx.S * rand(.1, .18), h: ctx.S * rand(.1, .18), color: ctx.P.accent, z: 5 });
}
