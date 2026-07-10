import { ctx, ri, rand, shuffle, pick, chance, box, svgRoot, mix } from '../utils.js';
// Arc loops: an arc-Truchet. Each tile connects its edge-midpoints with quarter-circle arcs (radius =
// half the tile, one of two orientations). Every tile uses the same radius and the arcs meet at shared
// edge-midpoints, so neighbours link into one continuous network of rounded loops and meanders — a
// flowing maze. Thick round-capped strokes on a solid ground.
export default function arcLoops() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const bg = pick(cs), lc = cs.find(c => c !== bg) || ctx.P.accent, alt = chance(.4) ? (cs.find(c => c !== bg && c !== lc) || lc) : lc;
  if (ri(1,4) == 2) box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: bg, z: -2 });
  const cols = ri(4, 9), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw);
  const th = cw * rand(.18, .32), r = cw / 2, s = svgRoot();
  const arc = (p, q, sweep, col) => s.node('path', { d: `M ${p[0].toFixed(1)} ${p[1].toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${sweep} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`, fill: 'none', stroke: col, 'stroke-width': th, 'stroke-linecap': 'round' });
  for (let ry = 0; ry < rows; ry++) for (let cx = 0; cx < cols; cx++) {
    const x0 = cx * cw, y0 = ry * cw, col = alt === lc ? lc : (cx + ry) % 2 ? lc : alt;
    const tm = [x0 + cw / 2, y0], rm = [x0 + cw, y0 + cw / 2], bm = [x0 + cw / 2, y0 + cw], lm = [x0, y0 + cw / 2];
    if (chance(.5)) { arc(tm, lm, 1, col); arc(bm, rm, 1, col); }   // arcs hug TL & BR corners
    else { arc(tm, rm, 0, col); arc(bm, lm, 0, col); }             // arcs hug TR & BL corners
  }
}
