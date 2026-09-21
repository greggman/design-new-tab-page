import { ctx, rand, ri, pick, chance, shuffle, wpick, svgRoot, groundScheme, rrange, labDist } from '../utils.js';
// Voronoi: real cells, not a grid approximation — each cell is the canvas rectangle clipped by the perpendicular
// bisector against every other seed, so the edges are exact and crisp at any size.
//
// What makes one design differ from the next is the seed distribution and what's done with the cells:
//   scatter — plain random points (big and small cells side by side)
//   even    — a few rounds of Lloyd relaxation, which pushes each seed to its cell's centroid: all cells end up
//             a similar size, the organic honeycomb of a giraffe's coat
//   drift   — a jittered grid, more regular still
//   clumps  — seeds gathered around a few foci: dense shards in places, wide plates elsewhere
// and then: leaded glass (a heavy line between cells), shards (cells shrunk from their centre, opening cracks),
// nested (rings of the cell's own outline), or hatch (parallel lines in a per-cell direction).
//
// Colours come by area, by distance from a focus (so the field reads as broad bands), or per cell.

const f1 = v => v.toFixed(1);
const poly = pts => 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z';

// Sutherland–Hodgman clip by the half-plane of points nearer `a` than `b`.
function clipHalf(pts, a, b) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
  const f = p => (p[0] - mx) * dx + (p[1] - my) * dy;   // <= 0 → nearer a
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length], fp = f(p), fq = f(q);
    if (fp <= 0) out.push(p);
    if ((fp <= 0) !== (fq <= 0)) { const t = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  }
  return out;
}
function cellOf(seed, seeds, box) {
  let p = box;
  for (const s of seeds) { if (s === seed) continue; p = clipHalf(p, seed, s); if (p.length < 3) break; }
  return p;
}
function centroid(pts) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length], c = x0 * y1 - x1 * y0;
    a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
  }
  return a ? { area: Math.abs(a) / 2, c: [cx / (3 * a), cy / (3 * a)] } : { area: 0, c: pts[0] };
}
const shrink = (pts, c, k) => pts.map(p => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]);

export default function voronoi() {
  const { ground, fg, ink } = groundScheme();
  const { W, H, S } = ctx, svg = svgRoot(), defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svg.appendChild(defs);
  const cs = shuffle([...fg, ink]);
  const box = [[-S * .02, -S * .02], [W + S * .02, -S * .02], [W + S * .02, H + S * .02], [-S * .02, H + S * .02]];

  // --- seeds ---
  const dist = wpick([['scatter', 2], ['even', 2.5], ['drift', 1.5], ['clumps', 1.5]]);
  const n = ri(14, dist === 'even' ? 70 : 45);
  let seeds = [];
  if (dist === 'drift') {
    const cols = Math.max(2, Math.round(Math.sqrt(n * W / H))), rows = Math.max(2, Math.round(n / cols));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) seeds.push([(i + rand(.15, .85)) * W / cols, (j + rand(.15, .85)) * H / rows]);
  } else if (dist === 'clumps') {
    const foci = Array.from({ length: ri(2, 4) }, () => [rand(.15, .85) * W, rand(.15, .85) * H]);
    for (let i = 0; i < n; i++) { const f = pick(foci), r = S * rand(0, .3), a = rand(0, 6.28); seeds.push([f[0] + Math.cos(a) * r, f[1] + Math.sin(a) * r]); }
    // plus a scatter over the rest, or everything away from the clumps becomes two or three enormous plates
    for (let i = Math.round(n * .7); i > 0; i--) seeds.push([rand(-.02, 1.02) * W, rand(-.02, 1.02) * H]);
  } else {
    for (let i = 0; i < n; i++) seeds.push([rand(-.02, 1.02) * W, rand(-.02, 1.02) * H]);
  }
  // Lloyd relaxation: move every seed to its cell's centroid, which evens the cells out
  if (dist === 'even') for (let it = ri(2, 4); it > 0; it--) seeds = seeds.map(s => centroid(cellOf(s, seeds, box)).c);

  const cells = seeds.map(s => { const p = cellOf(s, seeds, box); return { p, ...centroid(p) }; }).filter(c => c.p.length >= 3 && c.area > 1);
  const maxA = Math.max(...cells.map(c => c.area)), focus = [rand(.2, .8) * W, rand(.2, .8) * H], maxD = Math.hypot(W, H) * .6;

  // --- colour ---
  const scheme = pick(['area', 'radial', 'random', 'random']);
  const colOf = c => scheme === 'area' ? cs[Math.min(cs.length - 1, Math.floor(c.area / maxA * cs.length * rand(.9, 1.1)))]
    : scheme === 'radial' ? cs[Math.floor(Math.hypot(c.c[0] - focus[0], c.c[1] - focus[1]) / maxD * cs.length * .9 + rand(0, .4)) % cs.length]
      : pick(cs);

  // --- treatment ---
  const style = wpick([['glass', 2], ['shards', 2], ['nested', 1.5], ['hatch', 1.5]]);
  const lead = Math.max(1.5, S * rand(.004, .012));
  const uid = 'vo' + Math.random().toString(36).slice(2);
  rrange(0, cells.length, i => {
    const cell = cells[i], col = colOf(cell) ?? cs[0], k = cs.reduce((b, q) => labDist(q, col) > labDist(b, col) ? q : b, cs[0]);
    if (style === 'glass') {
      svg.node('path', { d: poly(cell.p), fill: col, stroke: ground, 'stroke-width': f1(lead), 'stroke-linejoin': 'round' });
    } else if (style === 'shards') {
      // each cell pulled in from its own centre, and nudged away from the focus, as if the plate were struck there
      const d = Math.hypot(cell.c[0] - focus[0], cell.c[1] - focus[1]), push = Math.min(S * .02, d * .06);
      const off = [(cell.c[0] - focus[0]) / (d || 1) * push, (cell.c[1] - focus[1]) / (d || 1) * push];
      svg.node('path', { d: poly(shrink(cell.p, cell.c, rand(.82, .93)).map(p => [p[0] + off[0], p[1] + off[1]])), fill: col });
    } else if (style === 'nested') {
      const m = ri(2, 4);
      for (let q = 0; q < m; q++) svg.node('path', { d: poly(shrink(cell.p, cell.c, 1 - q * (1 / (m + .5)))), fill: q % 2 ? k : col, stroke: ground, 'stroke-width': f1(lead * .5), 'stroke-linejoin': 'round' });
    } else {
      // parallel lines in a per-cell direction, clipped to the cell, over a flat fill
      svg.node('path', { d: poly(cell.p), fill: col, stroke: ground, 'stroke-width': f1(lead * .6), 'stroke-linejoin': 'round' });
      const id = `${uid}-${i}`, cp = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      cp.setAttribute('id', id);
      const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      shape.setAttribute('d', poly(cell.p)); cp.appendChild(shape); defs.appendChild(cp);
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('clip-path', `url(#${id})`); svg.appendChild(g);
      const a = rand(0, Math.PI), ca = Math.cos(a), sa = Math.sin(a), R = Math.sqrt(cell.area), sp = Math.max(3, S * rand(.008, .016));
      let d = '';
      for (let o = -R * 1.5; o <= R * 1.5; o += sp) d += `M${f1(cell.c[0] + ca * -R * 1.6 - sa * o)} ${f1(cell.c[1] + sa * -R * 1.6 + ca * o)}L${f1(cell.c[0] + ca * R * 1.6 - sa * o)} ${f1(cell.c[1] + sa * R * 1.6 + ca * o)}`;
      svg.node('path', { d, fill: 'none', stroke: k, 'stroke-width': f1(Math.max(1, sp * .28)), opacity: .85 }, g);
    }
  }, { dur: 1 });

  // the seeds themselves, now and then
  if (chance(.3)) for (const c of cells) svg.node('circle', { cx: f1(c.c[0]), cy: f1(c.c[1]), r: f1(Math.max(1.5, S * .006)), fill: ground });
}
