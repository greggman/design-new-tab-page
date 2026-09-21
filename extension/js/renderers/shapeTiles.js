import { ctx, rand, ri, pick, chance, shuffle, wpick, mix, svgRoot, groundScheme, grid, rrange, labDist } from '../utils.js';
// Shape tiles: one shape — half-disc, quarter disc, pointed oval, teardrop, arch, triangle, half-hexagon or
// disc — repeated all over the page, turned in quarter turns, and filled a different way every time: solid,
// ruled along or across, dashed, dotted, concentric, or outline. Laid out as a grid of one shape per cell, or
// as big overlapping shapes at several sizes.
//
// The outlines are REAL arcs (SVG A commands), not sampled polygons, and every inset ring is worked out
// analytically for that shape: a half-disc's ring is a smaller half-disc (its arc radius and its straight edge
// both move in by the same distance, meeting in a sharp corner), a teardrop's is the teardrop scaled about its
// circle centre, a lens's is two arcs of smaller radius about the same two centres. Offsetting a sampled
// polygon along its vertex bisectors — the obvious way — rounds the corners off and drifts the spacing, which
// is what made the earlier rings look lopsided.

const f1 = v => v.toFixed(3);
const SVGNS = 'http://www.w3.org/2000/svg';
// An arc segment. `sw` is SVG's sweep flag exactly as it will be written — 0 curves anticlockwise on screen,
// 1 clockwise — not a direction in unit space that then has to be flipped. The shapes are drawn through a
// y-flip, and juggling the two conventions is what put several of these arcs in backwards. Quarter turns
// don't change the flag, so what each shape stores is what it needs.
const A = (r, sw, to, large = false) => ({ r, sw, to, large });
const L = to => ({ to });

// Inset a convex polygon by d: offset every edge inward and intersect the neighbours, so corners stay sharp.
// Every resulting vertex must sit on the inner side of EVERY offset edge — otherwise the polygon has folded
// through itself (a trapezoid's short side collapses first, and the corners cross) and the ring is dropped.
function insetPoly(pts, d) {
  const n = pts.length, s = (() => { let a = 0; for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a > 0 ? 1 : -1; })();
  const lines = pts.map((p, i) => {
    const q = pts[(i + 1) % n], e = [q[0] - p[0], q[1] - p[1]], len = Math.hypot(...e) || 1;
    const nx = -e[1] / len * s, ny = e[0] / len * s;                 // inward normal
    return [nx, ny, nx * (p[0] + nx * d) + ny * (p[1] + ny * d)];    // nx·x + ny·y = c
  });
  const out = [];
  for (let i = 0; i < n; i++) {
    const [a1, b1, c1] = lines[(i - 1 + n) % n], [a2, b2, c2] = lines[i];
    const det = a1 * b2 - a2 * b1;
    if (Math.abs(det) < 1e-9) return null;
    out.push([(c1 * b2 - c2 * b1) / det, (a1 * c2 - a2 * c1) / det]);
  }
  for (const [x, y] of out) for (const [a, b, c] of lines) if (a * x + b * y < c - 1e-6) return null;
  let a = 0; for (let i = 0; i < n; i++) { const p = out[i], q = out[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; }
  return a * s > .004 ? out : null;
}
const polyShape = pts => d => { const q = d ? insetPoly(pts, d) : pts; return q && { s: q[0], c: q.slice(1).map(L).concat([L(q[0])]) }; };

// Every shape is a function of the inset distance d, returning { s: start point, c: [segments] } or null once
// it has closed up. All are drawn in the unit square with y pointing up.
const SHAPES = {
  disc: d => { const r = .5 - d; return r > .015 && { s: [.5 - r, .5], c: [A(r, 0, [.5 + r, .5]), A(r, 0, [.5 - r, .5])] }; },
  halfDisc: d => {                                   // flat side down, arc over the top
    // A ring is inset from the straight edge as much as from the arc: the arc's radius drops by d AND the
    // straight edge lifts by d, so the gap is the same all the way round (the ring is a circular segment, not
    // a smaller half-disc sitting on the same base line).
    const R = .5, cy = .25, r = R - d, dx = Math.sqrt(Math.max(0, r * r - d * d));
    return r > .02 && dx > .02 && { s: [.5 - dx, cy + d], c: [L([.5 + dx, cy + d]), A(r, 0, [.5 - dx, cy + d])] };
  },
  quarter: d => {                                    // corner bottom-left; both legs and the arc all move in by d
    const R = 1, r = R - d, e = Math.sqrt(Math.max(0, r * r - d * d));
    return r > .04 && e > d + .02 && { s: [d, d], c: [L([d, e]), A(r, 1, [e, d]), L([d, d])] };
  },
  leaf: d => {                                       // pointed oval: two arcs about two centres
    const hh = .3, rho = (.25 + hh * hh) / (2 * hh), off = rho - hh, r = rho - d;
    const dx = Math.sqrt(Math.max(0, r * r - off * off));
    return r > off + .01 && dx > .01 && { s: [.5 - dx, .5], c: [A(r, 1, [.5 + dx, .5]), A(r, 1, [.5 - dx, .5])] };
  },
  arch: d => {                                       // a box with a semicircle cap on top
    // Base, sides and cap all move in by d — the cap keeps its centre, so the sides stay tangent to it.
    const r = .5 - d;
    return r > .02 && d < .35 && { s: [d, d], c: [L([1 - d, d]), L([1 - d, .5]), A(r, 0, [d, .5]), L([d, d])] };
  },
  drop: d => {                                       // teardrop: the whole shape scaled about its circle centre
    const R = .35, cy = .35, apex = 1, k = (R - d) / R;
    if (k <= .05) return false;
    const r = R * k, ay = cy + (apex - cy) * k, Ld = ay - cy;
    if (Ld < r * 1.12) return false;                 // apex has sunk into the circle: the tangents would cross
    const ang = Math.acos(r / Ld);
    const t1 = [.5 + Math.cos(Math.PI / 2 + ang) * r, cy + Math.sin(Math.PI / 2 + ang) * r];
    const t2 = [.5 + Math.cos(Math.PI / 2 - ang) * r, cy + Math.sin(Math.PI / 2 - ang) * r];
    return { s: [.5, ay], c: [L(t1), A(r, 0, t2, true), L([.5, ay])] };
  },
  triangle: polyShape([[.02, .02], [.98, .02], [.5, .98]]),
  halfHex: polyShape([[.02, .02], [.98, .02], [.75, .98], [.25, .98]]),
};
const FILLS = [
  ['solid', 3],
  ['along', 2],
  ['across', 2],
  ['dash', 1.5],
  ['dots', 1.2],
  ['rings', 2.2],
  ['outline', 1.2],
];

export default function shapeTiles() {
  const { ground, fg, ink } = groundScheme();
  const { W, H, S } = ctx, svg = svgRoot();
  const defs = document.createElementNS(SVGNS, 'defs'); svg.appendChild(defs);
  const cs = shuffle([...fg, ink]);
  const uid = 'st' + Math.random().toString(36).slice(2);

  // line / dash / dot patterns, made on demand per colour and direction
  const pats = new Map(), sp = S * rand(.012, .022);
  const pattern = (kind, col, deg) => {
    const key = kind + col + ((deg % 360 + 360) % 360);
    if (!pats.has(key)) {
      const id = `${uid}-${pats.size}`, p = document.createElementNS(SVGNS, 'pattern');
      p.setAttribute('id', id); p.setAttribute('width', f1(sp)); p.setAttribute('height', f1(sp));
      p.setAttribute('patternUnits', 'userSpaceOnUse'); p.setAttribute('patternTransform', `rotate(${deg})`);
      const add = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); p.appendChild(e); };
      if (kind === 'line') add('rect', { width: f1(sp * .4), height: f1(sp), fill: col });
      else if (kind === 'dash') add('rect', { width: f1(sp * .38), height: f1(sp * .62), y: f1(sp * .19), fill: col });
      else add('circle', { cx: f1(sp / 2), cy: f1(sp / 2), r: f1(sp * .19), fill: col });
      defs.appendChild(p);
      pats.set(key, `url(#${id})`);
    }
    return pats.get(key);
  };

  const shape = pick(Object.keys(SHAPES));

  // Draw one shape: unit space → canvas at (x, y), `size` across, turned `turn` quarter turns. Arcs survive the
  // trip: a quarter turn and a uniform scale keep a circle a circle, so only the radius and the y-flip matter.
  const draw = (x, y, size, turn, fill, col, k) => {
    const lw = Math.max(1, size * .045);
    const P = ([u, v]) => {
      let a = u - .5, b = v - .5;
      for (let t = 0; t < turn; t++) [a, b] = [b, -a];
      return `${f1(x + a * size)} ${f1(y - b * size)}`;
    };
    const d2 = fig => {
      let s = 'M' + P(fig.s);
      for (const seg of fig.c) s += seg.r == null ? 'L' + P(seg.to)
        : `A${f1(seg.r * size)} ${f1(seg.r * size)} 0 ${seg.large ? 1 : 0} ${seg.sw} ${P(seg.to)}`;
      return s + 'Z';
    };
    const base = SHAPES[shape](0);
    if (fill === 'solid') svg.node('path', { d: d2(base), fill: col });
    else if (fill === 'outline') svg.node('path', { d: d2(base), fill: 'none', stroke: col, 'stroke-width': f1(lw * 1.6), 'stroke-linejoin': 'round' });
    else if (fill === 'rings') {
      const step = rand(.05, .095);
      for (let q = 0; q < 10; q++) {
        const fig = SHAPES[shape](step * q);
        if (!fig) break;
        svg.node('path', { d: d2(fig), fill: 'none', stroke: col, 'stroke-width': f1(lw), 'stroke-linejoin': 'round' });
      }
    } else {
      const kind = fill === 'dash' ? 'dash' : fill === 'dots' ? 'dot' : 'line';
      svg.node('path', { d: d2(base), fill: pattern(kind, chance(.25) ? k : col, (fill === 'across' ? 90 : 0) + turn * 90) });
    }
  };
  const colours = () => { const col = pick(cs); return [col, cs.reduce((b, q) => labDist(q, col) > labDist(b, col) ? q : b, cs[0])]; };

  if (chance(.4)) {
    // scatter: the same shape, big, at a few sizes, still only ever on a quarter turn, freely overlapping
    const n = ri(14, 30), items = Array.from({ length: n }, () => ({
      x: rand(0, 1) * W, y: rand(0, 1) * H, size: S * pick([rand(.3, .5), rand(.18, .3), rand(.1, .18)]),
      turn: ri(0, 1) * 2, fill: wpick(FILLS), cols: colours(),
    })).sort((p, q) => q.size - p.size);
    rrange(0, items.length, i => { const t = items[i]; draw(t.x, t.y, t.size, t.turn, t.fill, ...t.cols); }, { dur: 1, order: 'forward' });
    return;
  }

  // grid: one shape per cell
  const cell = S / ri(4, 9), cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
  const ox = (W - cols * cell) / 2, oy = (H - rows * cell) / 2, pad = cell * rand(.02, .1);
  const emptyW = pick([.3, 1, 2]);
  grid(cols, rows, (i, j) => {
    const fill = wpick([...FILLS, ['empty', emptyW]]);
    if (fill === 'empty') return;
    draw(ox + (i + .5) * cell, oy + (j + .5) * cell, cell - pad * 2, ri(0, 3), fill, ...colours());
  }, { dur: 1 });

  // a hairline grid over it all, now and then — the ruled paper those samplers are drawn on
  if (chance(.25)) {
    let d = '';
    for (let i = 0; i <= cols; i++) d += `M${f1(ox + i * cell)} 0V${f1(H)}`;
    for (let j = 0; j <= rows; j++) d += `M0 ${f1(oy + j * cell)}H${f1(W)}`;
    svg.node('path', { d, fill: 'none', stroke: mix(ink, ground, .55), 'stroke-width': f1(Math.max(.6, S * .0012)) });
  }
}
