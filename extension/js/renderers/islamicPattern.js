import { ctx, rand, chance, shuffle, wpick, svgRoot, labDist, readable, hexToOklch, oklchToHex, groundScheme } from '../utils.js';
// Islamic pattern: interlocking star-and-rosette strapwork, built with Hankin's method ("polygons in contact",
// E. H. Hankin, 1925). Take an edge-to-edge tiling of regular polygons; from the midpoint of every edge send two
// rays into each tile, each inclined at the same contact angle θ to the edge, and stop each ray where it meets
// the ray coming from the neighbouring edge. Because θ is identical on both sides of every shared edge, a ray
// leaving one tile carries straight on into the next, so the strapwork is one continuous network — which is
// the thing that makes these read as Islamic geometric art rather than stars stamped on a grid.
//
// The base tiling picks the family: octagons + squares (4.8.8) give the classic 8-point khatam, dodecagons +
// triangles (3.12.12) and dodecagons + hexagons + squares (4.6.12) give 12-point rosettes, hexagons give
// 6-point stars. θ then sets how starry they are — small, and the pattern hugs the tile outlines; large, and
// the points reach in toward each tile's centre.

const TAU = Math.PI * 2, SQ3 = Math.sqrt(3);

// Regular n-gon with edge length a centred on (cx,cy); `phi` is the outward normal of one edge. Tiles are placed
// by pointing an edge normal at each neighbour, so every tiling below is exactly edge-to-edge.
const regPoly = (cx, cy, n, a, phi) => {
  const R = a / (2 * Math.sin(Math.PI / n));
  return Array.from({ length: n }, (_, k) => { const t = phi + Math.PI / n + k * TAU / n; return [cx + R * Math.cos(t), cy + R * Math.sin(t)]; });
};

// Hankin construction for one tile: one [edgeMid, meetingPoint, nextEdgeMid] triple per corner.
function hankin(pts, theta) {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; area += p[0] * q[1] - q[0] * p[1]; }
  const sg = area >= 0 ? 1 : -1;                          // which way "into the tile" is, for either winding
  const mid = i => { const p = pts[i % n], q = pts[(i + 1) % n]; return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; };
  const turn = (v, t) => [v[0] * Math.cos(t) - v[1] * Math.sin(t), v[0] * Math.sin(t) + v[1] * Math.cos(t)];
  const out = [];
  for (let i = 0; i < n; i++) {
    const M1 = mid(i), M2 = mid(i + 1), V = pts[(i + 1) % n];
    // Both rays head toward the corner they share, each turned into the tile by θ. They meet on that corner's
    // bisector, somewhere between the corner (θ→0) and the tile's centre (θ→90°).
    const u = turn([V[0] - M1[0], V[1] - M1[1]], sg * theta), v = turn([V[0] - M2[0], V[1] - M2[1]], -sg * theta);
    const den = u[0] * v[1] - u[1] * v[0];
    if (Math.abs(den) < 1e-9) continue;
    const t = ((M2[0] - M1[0]) * v[1] - (M2[1] - M1[1]) * v[0]) / den;
    out.push([M1, [M1[0] + u[0] * t, M1[1] + u[1] * t], M2]);
  }
  return out;
}

// Points of a hexagonal lattice with spacing d covering a box, as (x, y, i, j).
const hexLattice = (d, [x0, y0, x1, y1], fn) => {
  const rh = d * SQ3 / 2;
  for (let j = Math.floor(y0 / rh) - 1; j <= Math.ceil(y1 / rh) + 1; j++) {
    const off = j * d / 2;
    for (let i = Math.floor((x0 - off) / d) - 1; i <= Math.ceil((x1 - off) / d) + 1; i++) fn(i * d + off, j * rh, i, j);
  }
};
const mod = (x, m) => ((x % m) + m) % m;

// Each tiling: [weight, tile spacing in edge lengths, contact-angle range (deg), tiles-across range, builder].
// `k` is the tile's kind (octagon vs square…) and `par` a proper colouring of that kind, so neighbouring tiles
// of the same kind can take different colours.
const TILINGS = {
  '4.8.8': [4, 1 + Math.SQRT2, [56, 72], [3.5, 7], (a, box, push) => {
    const s = a * (1 + Math.SQRT2);
    for (let j = Math.floor(box[1] / s) - 1; j * s < box[3] + s; j++) for (let i = Math.floor(box[0] / s) - 1; i * s < box[2] + s; i++) {
      push(regPoly(i * s, j * s, 8, a, 0), 0, (i + j) & 1);
      push(regPoly((i + .5) * s, (j + .5) * s, 4, a, Math.PI / 4), 1, 0);
    }
  }],
  '3.12.12': [2.5, 2 + SQ3, [62, 80], [2.5, 5], (a, box, push) => {
    const d = a * (2 + SQ3), rh = d * SQ3 / 2;
    hexLattice(d, box, (x, y, i, j) => {
      push(regPoly(x, y, 12, a, 0), 0, mod(i - j, 3));
      push(regPoly(x + d / 2, y + rh / 3, 3, a, Math.atan2(-rh / 3, -d / 2)), 1, 0);
      push(regPoly(x + d, y + 2 * rh / 3, 3, a, -Math.PI / 2), 1, 1);
    });
  }],
  '4.6.12': [2.5, 3 + SQ3, [60, 76], [2, 4], (a, box, push) => {
    const d = a * (3 + SQ3), rh = d * SQ3 / 2;
    hexLattice(d, box, (x, y, i, j) => {
      push(regPoly(x, y, 12, a, 0), 0, mod(i - j, 3));
      push(regPoly(x + d / 2, y, 4, a, 0), 1, 0);                              // squares between dodecagon pairs
      push(regPoly(x + d / 4, y + rh / 2, 4, a, Math.PI / 3), 1, 1);
      push(regPoly(x - d / 4, y + rh / 2, 4, a, 2 * Math.PI / 3), 1, 2);
      push(regPoly(x + d / 2, y + rh / 3, 6, a, Math.atan2(-rh / 3, -d / 2)), 2, 0);   // hexagons in the gaps
      push(regPoly(x + d, y + 2 * rh / 3, 6, a, -Math.PI / 2), 2, 1);
    });
  }],
  '6.6.6': [2, SQ3, [48, 68], [4, 8], (a, box, push) => {
    hexLattice(a * SQ3, box, (x, y, i, j) => push(regPoly(x, y, 6, a, 0), 0, mod(i - j, 3)));
  }],
  '4.4.4.4': [1, 1, [48, 68], [5, 9], (a, box, push) => {
    for (let j = Math.floor(box[1] / a) - 1; j * a < box[3] + a; j++) for (let i = Math.floor(box[0] / a) - 1; i * a < box[2] + a; i++)
      push(regPoly((i + .5) * a, (j + .5) * a, 4, a, 0), 0, (i + j) & 1);
  }],
};

export default function islamicPattern() {
  const { ground, fg, ink } = groundScheme();
  const [, spacing, thRange, across, build] = TILINGS[wpick(Object.entries(TILINGS).map(([k, t]) => [k, t[0]]))];
  const a = ctx.S / rand(...across) / spacing;                    // edge length, shared by every tile
  const theta = rand(...thRange) * Math.PI / 180;
  const rotDeg = chance(.35) ? rand(0, 360) : 0;
  const pad = a * spacing;
  const half = Math.hypot(ctx.W, ctx.H) / 2 + pad;               // a rotated field has to cover the corners too
  const box = rotDeg ? [ctx.W / 2 - half, ctx.H / 2 - half, ctx.W / 2 + half, ctx.H / 2 + half] : [-pad, -pad, ctx.W + pad, ctx.H + pad];

  const mode = wpick([['zellige', 3], ['stars', 2], ['lines', 2]]);
  const pal = shuffle(fg);
  const w = a * rand(.09, .2);                                    // strap width

  // ---- geometry, collected into a few paths per layer and band rather than thousands of elements. A path
  // costs the same whether it carries one polygon or two hundred, and the reveal still sweeps down the field.
  const NB = 8, bandOf = y => Math.max(0, Math.min(NB - 1, Math.floor((y - box[1]) / (box[3] - box[1]) * NB)));
  const layers = { tile: [], star: [], strap: [] };
  const add = (layer, band, key, d) => {
    const L = layers[layer][band] ?? (layers[layer][band] = new Map());
    L.set(key, (L.get(key) ?? '') + d);
  };
  const f = v => v.toFixed(1);
  const poly = pts => 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z';
  build(a, box, (pts, k, par) => {
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    if (!rotDeg && (cx < box[0] || cx > box[2] || cy < box[1] || cy > box[3])) return;
    const band = bandOf(cy), corners = hankin(pts, theta);
    // Geometry is keyed by what KIND of surface it is, not by colour — colours are resolved once everything
    // exists, because the strap and the surfaces it crosses have to be fitted to each other.
    if (mode === 'zellige') add('tile', band, `t${k}`, poly(pts));
    if (mode !== 'lines') add('star', band, `s${k}.${par}`, poly(corners.flatMap(([m, x]) => [m, x])));
    // Straps are OPEN runs midpoint→meeting point→midpoint, not the closed star outline. A closed outline puts
    // a join at every edge midpoint, and a mitred join there spikes out across the edge into the neighbouring
    // tile. As open runs with butt ends, the half-strap from this tile and the one from its neighbour meet
    // end-to-end at the midpoint and read as one straight strap passing through.
    add('strap', band, 's', corners.map(([m, x, n]) => `M${f(m[0])} ${f(m[1])}L${f(x[0])} ${f(x[1])}L${f(n[0])} ${f(n[1])}`).join(''));
  });

  // ---- colours. Every colour is checked against what it actually sits on.
  const keysOf = layer => [...new Set(layers[layer].flatMap(m => m ? [...m.keys()] : []))];
  const col = new Map();
  for (const key of keysOf('tile')) col.set(key, pal[+key.slice(1) % pal.length]);
  for (const key of keysOf('star')) {
    const [k, par] = key.slice(1).split('.').map(Number);
    col.set(key, readable([pal[(k + 1 + par) % pal.length]], mode === 'zellige' ? col.get(`t${k}`) : ground, .18)[0]);
  }
  // The strap runs across EVERY surface, so contrast with the ground alone isn't enough. First pick the colour
  // whose worst contrast against all of them is best — trying the ink hue and each palette hue across the whole
  // lightness range. A zellige field can hold light and dark tiles at once, though, and then nothing clears
  // both; so any surface still too close to the strap gives way to it, keeping its hue and moving in lightness.
  const surfaceKeys = [...col.keys()], surfaces = () => [...(mode === 'zellige' ? [] : [ground]), ...surfaceKeys.map(k => col.get(k))];
  const score = c => Math.min(...surfaces().map(x => labDist(c, x)));
  let strap = ink, best = score(ink);
  for (const base of [ink, ...pal]) {
    const [, C, H] = hexToOklch(base);
    for (let L = .06; L <= .97; L += .07) { const c = oklchToHex(L, C * .8, H), sc = score(c); if (sc > best) { best = sc; strap = c; } }
  }
  if (mode === 'lines' && labDist(strap, ground) < .2) strap = ink;   // nothing but ground under it: ink is guaranteed
  for (const key of surfaceKeys) col.set(key, readable([col.get(key)], strap, .14)[0]);
  const inner = chance(.5) ? [...new Set([ground, ...surfaces()])].reduce((best, c) => labDist(c, strap) > labDist(best, strap) ? c : best, ground) : null;
  const innerW = w * rand(.28, .42);                              // hollow strap: a thinner line down the middle

  // ---- draw, layer by layer across the whole field. Band-by-band would let band k+1's tile fills paint over the
  // straps of band k where the two meet.
  const svg = svgRoot();
  const g = rotDeg ? svg.node('g', { transform: `rotate(${rotDeg.toFixed(1)} ${f(ctx.W / 2)} ${f(ctx.H / 2)})` }) : svg;
  const reveal = (e, kind, band, base) => { e.style.animation = `${kind} ${kind === 'draw' ? '.9' : '.5'}s ease ${(base + band * .06).toFixed(2)}s both`; };
  for (let b = 0; b < NB; b++) for (const [key, d] of layers.tile[b] ?? []) {
    // stroked in its own colour so neighbouring fills don't leave a hairline seam between them
    const c = col.get(key);
    reveal(svg.node('path', { d, fill: c, stroke: c, 'stroke-width': 1, 'stroke-linejoin': 'round' }, g), 'fin', b, 0);
  }
  for (let b = 0; b < NB; b++) for (const [key, d] of layers.star[b] ?? [])
    reveal(svg.node('path', { d, fill: col.get(key) }, g), 'fin', b, .1);
  for (let b = 0; b < NB; b++) for (const [, d] of layers.strap[b] ?? []) {
    reveal(svg.node('path', { d, fill: 'none', stroke: strap, 'stroke-width': f(w), 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter', 'stroke-miterlimit': 8 }, g), 'draw', b, .2);
    if (inner) reveal(svg.node('path', { d, fill: 'none', stroke: inner, 'stroke-width': f(innerW), 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter', 'stroke-miterlimit': 8 }, g), 'draw', b, .3);
  }
}
