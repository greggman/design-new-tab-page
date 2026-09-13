import { ctx, rand, ri, chance, pick, shuffle, wpick, svgRoot, readable, hexToOklch, groundScheme } from '../utils.js';
// Greek key (meander fret). Every band is ONE continuous strap on an integer lattice, turning only at right
// angles. The units are periodic Hamiltonian paths through a strip P nodes long and H+1 nodes across: the path
// visits every lattice node of the strip exactly once and steps into the next unit's first node, so parallel
// runs of strap are always exactly one lattice step apart — strap and gap come out equal and uniform, which is
// what makes a meander read as a fret rather than as a doodle of hooks. The unit move strings below were found by
// exhaustive search and hand-picked for the classic running-key and spiral-hook shapes.
//
// No swastika can form: a swastika needs four arms meeting at a crossing, and here every lattice node carries at
// most one path through it (degree ≤ 2) and no two bands ever share a node. Units were also chosen from the plain
// running-key family — no cross-shaped or four-fold motifs.
//
// Nested frames close each band into a ring. A corner is a Hamiltonian path through the (H+1)-square block from its
// outer-left node to its inner-right node (a small S for H=2, a double spiral for H=4 — only possible for even
// H). A side must hold a whole number of units, and each ring is inset d = H+1+g from the last, so its sides are
// 2d shorter: the gap g is chosen so that 2d is a multiple of P, and then every ring fits exactly with square
// corners. (Stretching corners to absorb the remainder instead gives long hairpins that don't read as a key.)

// Moves: 0 forward along the band, 1 away from the baseline, 2 back, 3 toward the baseline. Each string ends with
// the step into the next unit.
const UNITS = [
  { P: 3, H: 2, m: '110032300' },                    // simple key
  { P: 4, H: 2, m: '110003223000' },                 // key with a long top arm
  { P: 4, H: 3, m: '1110003321233000' },             // one-and-a-half-turn spiral hook
  { P: 5, H: 4, m: '0001112230322111000033330' },    // two-turn spiral hook
];
// Interlocking double meander: path A plus its 180° rotation (x,y) → (P-1+s-x, H-y) tile the strip between them.
const DOUBLE = { P: 6, H: 3, s: 0, m: '000012100330' };
// Corner blocks (w × (H+1), outer-left → inner-right), minimum-turn Hamiltonian paths; then one step inward.
// Frames only use the square block, w = H+1.
const corner = (H, w) => (H === 2
  ? '0'.repeat(w - 1) + '1' + '2'.repeat(w - 1) + '1' + '0'.repeat(w - 1)
  : '0'.repeat(w - 1) + '111' + '2'.repeat(w - 2) + '3' + '0'.repeat(w - 3) + '3' + '2'.repeat(w - 2) + '111' + '0'.repeat(w - 1)) + '1';

const STEP = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const f = v => v.toFixed(1);

// Walk a move string from (x,y); `toGlobal(m)` turns a local move into a global direction.
function walk(pts, moves, toGlobal) {
  let [x, y] = pts[pts.length - 1];
  for (const ch of moves) { const [dx, dy] = STEP[toGlobal(+ch)]; x += dx; y += dy; pts.push([x, y]); }
  return pts;
}
// Drop collinear interior points so each straight run is a single segment (clean mitres, smaller paths).
function corners(pts, closed) {
  const out = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    if ((!closed && (i === 0 || i === n - 1)) || (a[0] - p[0]) * (b[1] - p[1]) !== (a[1] - p[1]) * (b[0] - p[0])) out.push(p);
  }
  return out;
}

export default function meander() {
  const { ground, fg, ink, gL } = groundScheme();
  const { W, H: CH, S } = ctx;
  const layout = wpick([['rows', 4], ['frames', 3], ['double', 2.5]]);
  const style = wpick([['solid', 5], ['outlined', 2.5], ['line', 1.2]]);
  const unit = layout === 'double' ? DOUBLE : layout === 'frames' ? pick(UNITS.filter(k => k.H % 2 === 0)) : pick(UNITS);
  const { P, H } = unit;
  // extra lattice rows between bands; frames need 2(H+1+g) to be a multiple of P (see above)
  const g = layout === 'frames' ? pick([1, 2, 3, 4, 5].filter(k => (2 * (H + 1 + k)) % P === 0 && k <= H + 1)) : ri(1, 2);
  // lattice step; frames also keep at least ~4 rings on the short side so the nesting reads
  const u = Math.max(6, Math.min(S / rand(42, 80) * (5 / (H + 1)) ** .5, layout === 'frames' ? S / (12 * (H + 1 + g)) : 1e9));
  const vertical = layout !== 'frames' && chance(.25);
  const A = vertical ? CH : W, B = vertical ? W : CH;               // along-band / across-band canvas extents
  const px = ([a, b]) => vertical ? [b, a] : [a, b];

  // ---- bands, in lattice coordinates (a along, b across; b grows down the screen), each an array of nodes.
  const bands = [];                                                  // { pts, lat, closed, idx, sub }
  let bandB0 = 0;
  if (layout === 'frames') {
    // Outer ring fitted to the canvas with a margin equal to the band spacing, then rings inset by d each.
    const d = H + 1 + g;
    const fit = n => n - ((n - 2 * H - 1) % P + P) % P;             // largest side with a whole number of units
    const X = fit(Math.floor(W / u - (1 + g))), Y = fit(Math.floor(CH / u - (1 + g)));
    const ox = (W - X * u) / 2, oy = (CH - Y * u) / 2;
    for (let r = 0; ; r++) {
      const nX = (X - 2 * r * d - 2 * H - 1) / P, nY = (Y - 2 * r * d - 2 * H - 1) / P;
      if (nX < 2 || nY < 2) break;
      const pts = [[r * d + H + 1, r * d]];
      for (let side = 0; side < 4; side++) {
        const rotG = m => (m + side) % 4;
        for (let k = 0; k < (side % 2 ? nY : nX); k++) walk(pts, unit.m, rotG);
        walk(pts, corner(H, H + 1), rotG);
      }
      pts.pop();                                                     // the walk ends back on the start node
      bands.push({ pts: pts.map(([x, y]) => [ox + x * u, oy + y * u]), lat: pts, closed: true, idx: r, sub: 0 });
    }
  } else {
    const pitch = H + 1 + g, rows = Math.ceil(B / u / pitch) + 2;
    bandB0 = ((B / u) - (rows * pitch - g - 1)) / 2;                 // centre the stack across the canvas
    const nUnits = Math.ceil(A / u / P) + 4;
    for (let i = 0; i < rows; i++) {
      const flip = i % 2 === 1;                                      // alternate rows run the other way
      const start = -2 * P;
      const base = walk([[0, 0]], unit.m.repeat(nUnits), m => m).map(([x, y]) => [x + start, y]);
      const paths = [base];
      if (layout === 'double') { const c = P - 1 + unit.s; paths.push(base.map(([x, y]) => [c - x + (nUnits - 4) * P, H - y])); }
      paths.forEach((p, sub) => {
        const lat = p.map(([x, y]) => [flip ? Math.ceil(A / u) - x : x, (i * pitch) + (H - y)]);   // baseline at the bottom
        const toPx = ([x, y]) => px([x * u, (bandB0 + y) * u]);
        bands.push({ pts: lat.map(toPx), lat, closed: false, idx: i, sub });
      });
    }
  }

  // ---- colours. The strap sits on the ground (or on its own register strip); outlines and thin lines need a
  // lightness gap, not just a hue difference, so they use ink or colours held to |ΔL| ≥ .3.
  const pal = shuffle(fg);
  const ncol = Math.min(pal.length, wpick([[1, 3], [2, 3], [3, 1]]));
  const lightGap = cands => cands.filter(c => Math.abs(hexToOklch(c)[0] - gL) >= .3);
  let straps = pal.slice(0, ncol);
  if (style === 'line') straps = lightGap(straps).length ? lightGap(straps) : [ink];
  const strips = layout !== 'frames' && style === 'solid' && g === 2 && chance(.4);   // outlines are ink, held to the ground only
  const stripCols = strips ? [pal[ncol % pal.length], ground] : null;
  const outline = style === 'outlined' ? ink : null;
  // Fill of an outlined strap sits on the outline; a solid strap on a strip sits on the strip.
  const colourFor = (i, sub) => {
    let c = straps[(layout === 'double' ? sub : i) % straps.length];
    if (outline) c = readable([c], outline, .22)[0];
    else if (strips) c = readable([c], stripCols[i % 2], .22)[0];
    return c;
  };

  // ---- draw.
  const svg = svgRoot();
  const NS = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs, delay, t0) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    // Paths carry no transform attribute, so the reveal can move them: a short slide along the band (or a
    // settle toward the centre for frames) with the fade.
    e.style.setProperty('--t0', t0); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', '1');
    e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center';
    e.style.animation = `fin .7s cubic-bezier(.2,.7,.25,1) ${delay.toFixed(2)}s both`;
    svg.appendChild(e);
    return e;
  };
  const nIdx = Math.max(...bands.map(b => b.idx)) + 1;
  const sw = style === 'line' ? rand(.14, .22) : style === 'outlined' ? rand(.56, .66) : rand(.46, .56);
  const ow = Math.max(1, u * sw * rand(.16, .24));

  // Register strips behind alternate bands, like the painted friezes on a pot: each strip reaches halfway into the
  // gap on either side, so strips and ground alternate as equal registers.
  if (strips) for (let i = 0; i < nIdx; i += 2) {
    const pitch = H + 1 + g, lo = (bandB0 + i * pitch - (g + 1) / 2) * u, size = (H + g + 1) * u;
    const [x, y] = px([-u, lo]), [w, hh] = px([A + 2 * u, size]);
    make('rect', { x: f(x), y: f(y), width: f(w), height: f(hh), fill: stripCols[0] }, i / nIdx * .6, 'none');
  }
  for (const b of bands) {
    const pts = corners(b.pts, b.closed);
    const d = 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L') + (b.closed ? 'Z' : '');
    const delay = (layout === 'frames' ? b.idx : b.idx + b.sub * .5) / nIdx * .8;
    const dir = b.idx % 2 ? -1 : 1, slide = u * 2 * dir;
    const t0 = layout === 'frames' ? 'scale(1.02)' : vertical ? `translateY(${f(-slide)}px)` : `translateX(${f(-slide)}px)`;
    const attrs = { d, fill: 'none', 'stroke-linejoin': 'miter', 'stroke-miterlimit': 4, 'stroke-linecap': 'square' };
    if (outline) {
      make('path', { ...attrs, stroke: outline, 'stroke-width': f(u * sw) }, delay, t0);
      make('path', { ...attrs, stroke: colourFor(b.idx, b.sub), 'stroke-width': f(Math.max(1, u * sw - 2 * ow)) }, delay, t0);
    } else make('path', { ...attrs, stroke: colourFor(b.idx, b.sub), 'stroke-width': f(u * sw) }, delay, t0);
  }
}
