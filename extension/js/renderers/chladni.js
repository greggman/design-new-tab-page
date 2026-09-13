import { ctx, rand, ri, pick, chance, shuffle, wpick, svgRoot, groundScheme, labDist, readable, hexToOklch, oklchToHex } from '../utils.js';
// Chladni figures: the nodal lines of a vibrating square plate, where sand thrown on the plate collects. A free
// square plate's modes are well approximated by f(u,v) = cos(nπu)cos(mπv) − s·cos(mπu)cos(nπv) (s = ±1) on the
// unit plate. Modes with the same n²+m² ring at the same frequency, so a real plate mixes them — that mixing is
// what turns the tidy grids into the looped, star-and-rosette figures people recognise, so a plate here sums every
// mode of one degenerate group (see groupTerms for the weights).
//
// The nodal lines are f's zero contour, taken by marching squares with the crossing refined along each cell
// edge, stitched through shared edge ids into long polylines, and drawn as quadratic curves through the edge
// crossings' midpoints. Where nodal lines CROSS (the diagonal of an s = +1 mode and everything that meets it),
// marching squares alone draws two arcs kissing a cell apart; those points are found as saddles of f and the
// chains are re-routed straight through them (see saddles()).
//
// Styles: clean line art; "sand" — grains scattered with density falling off with distance from the nearest
// nodal line (|f|/|∇f|); two-tone regions (f>0 filled, closed loops + even-odd); and a scientific plate of many
// small framed plates in order of increasing mode. One big plate is sized off the long side and cropped; the
// cosine modes reflect cleanly across a plate edge, so a plate smaller than the canvas simply continues mirrored.

const NS = 'http://www.w3.org/2000/svg', PI = Math.PI;
const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
const fade = (e, delay, dur = .5) => {
  e.style.setProperty('--t0', 'none'); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', '1');
  e.style.animation = `fin ${dur}s ease ${delay.toFixed(3)}s both`;
};
const f1 = v => v.toFixed(1);

// Degenerate groups: all (n,m), n<m, sharing n²+m². Pairs with n = m vanish identically for s = +1 and are skipped.
const GROUPS = (() => {
  const g = new Map();
  for (let m = 1; m <= 13; m++) for (let n = 0; n < m; n++) { const k = n * n + m * m; if (!g.has(k)) g.set(k, []); g.get(k).push([n, m]); }
  return [...g.entries()].sort((a, b) => a[0] - b[0]).map(([k, modes]) => ({ k, modes }));
})();

// A plate's field: terms [a, n, m, s]. Returns f, its gradient and its Hessian (uu, uv, vv), in plate units.
export function makeField(terms) {
  const P2 = PI * PI;
  return (u, v) => {
    let f = 0, fu = 0, fv = 0, fuu = 0, fuv = 0, fvv = 0;
    for (const [a, n, m, s] of terms) {
      const cnu = Math.cos(n * PI * u), cmv = Math.cos(m * PI * v), cmu = Math.cos(m * PI * u), cnv = Math.cos(n * PI * v);
      const snu = Math.sin(n * PI * u), smv = Math.sin(m * PI * v), smu = Math.sin(m * PI * u), snv = Math.sin(n * PI * v);
      const p = cnu * cmv, q = cmu * cnv;
      f += a * (p - s * q);
      fu += a * PI * (-n * snu * cmv + s * m * smu * cnv);
      fv += a * PI * (-m * cnu * smv + s * n * cmu * snv);
      fuu -= a * P2 * (n * n * p - s * m * m * q);
      fvv -= a * P2 * (m * m * p - s * n * n * q);
      fuv += a * P2 * n * m * (snu * smv - s * smu * snv);
    }
    return [f, fu, fv, fuu, fuv, fvv];
  };
}

// Terms for a group: every mode of the group. Chladni's figures are prized for their symmetry, so most of the time
// the modes share one s and mix at equal strength (keeping the square's mirror lines); otherwise the weights are
// free and the figure goes organic — still symmetric under a half-turn, since a group shares the parity of n+m.
export function groupTerms(group) {
  const sym = chance(.75), s0 = chance(.5) ? 1 : -1;
  const w = group.modes.map(() => (sym ? 1 : rand(.55, 1)) * (chance(.5) ? 1 : -1));
  w[ri(0, w.length - 1)] = 1;
  return group.modes.map(([n, m], i) => [w[i], n, m, sym || chance(.5) ? s0 : -s0]);
}

// Saddle points where the nodal set crosses itself, or so nearly that the branches would touch once stroked.
// Marching squares can't draw these: an X at 45° to the sampling grid almost never puts all four sign quadrants
// into one cell, so it always comes out as two arcs kissing about a cell apart — a pinch with a hook in it.
// Found by Newton on ∇f = 0 from a seed lattice finer than the pattern, in plate units; returned in px.
export function saddles(field, L, ox, oy, rect, lambda, step) {
  const [rx, ry, rw, rh] = rect, sp = lambda / 7, out = [];
  // Only crossings matter, and f is ~0 at those, so a seed where |f| is already a good part of its amplitude is
  // skipped: f ≈ κ·d₁·d₂ near a crossing, so at the nearest seed (≤ spacing/√2 away) |f| is under ~20% of it.
  let amp = 0;
  for (let i = 0; i < 64; i++) amp = Math.max(amp, Math.abs(field(Math.random(), Math.random())[0]));
  for (let y = ry - sp / 2; y < ry + rh + sp; y += sp) for (let x = rx - sp / 2; x < rx + rw + sp; x += sp) {
    let u = (x - ox) / L, v = (y - oy) / L, ok = false, H = null, g;
    if (Math.abs(field(u, v)[0]) > .25 * amp) continue;
    for (let it = 0; it < 10; it++) {
      g = field(u, v);
      H = [g[3], g[4], g[5]];
      const det = H[0] * H[2] - H[1] * H[1];
      if (Math.abs(det) < 1e-12) break;
      let du = -(H[2] * g[1] - H[1] * g[2]) / det, dv = -(H[0] * g[2] - H[1] * g[1]) / det;
      const m = Math.hypot(du, dv), cap = sp / L;
      if (m > cap) { du *= cap / m; dv *= cap / m; }
      u += du; v += dv;
      if (m * L < 1e-2) { ok = true; break; }
    }
    if (!ok) continue;
    g = field(u, v);
    const det = H[0] * H[2] - H[1] * H[1];
    if (det >= 0) continue;                                   // an extremum, not a saddle
    const tr = H[0] + H[2], root = Math.sqrt(tr * tr / 4 - det), l1 = tr / 2 + root, l2 = tr / 2 - root;
    // f ≈ c + ½λ₁x² + ½λ₂y² about the saddle, so the two branches miss each other by 2√(2|c|/|λ|)
    const gap = 2 * Math.sqrt(2 * Math.abs(g[0]) / Math.abs(g[0] > 0 ? l2 : l1)) * L;
    const px = ox + u * L, py = oy + v * L;
    if (gap > step * 1.2 || px < rx - step || py < ry - step || px > rx + rw + step || py > ry + rh + step) continue;
    if (out.every(q => Math.hypot(q[0] - px, q[1] - py) > step)) out.push([px, py]);
  }
  return out;
}

// Re-route chains through each saddle P as a true crossing: cut every point within r of P out of the chains
// that pass it, leaving four loose ends, then join each end through P to the end most nearly opposite it.
function throughSaddles(chains, sads, r) {
  const iso = sads.filter((p, i) => sads.every((q, j) => i === j || Math.hypot(p[0] - q[0], p[1] - q[1]) > 2.1 * r));   // cut discs must not overlap
  for (const P of iso) {
    const near = q => Math.hypot(q[0] - P[0], q[1] - P[1]) < r;
    const hit = [], keep = [];
    for (const c of chains) (c.pts.some(near) ? hit : keep).push(c);
    if (!hit.length) continue;
    const pieces = [];   // {pts, looseA, looseB}
    let bad = false;
    for (const c of hit) {
      let pts = c.pts;
      if (!c.closed && (near(pts[0]) || near(pts[pts.length - 1]))) { bad = true; break; }   // at the grid's edge: leave it
      if (c.closed) {
        const k = pts.findIndex((q, i) => !near(q) && near(pts[(i + pts.length - 1) % pts.length]));
        if (k < 0) { bad = true; break; }
        pts = [...pts.slice(k), ...pts.slice(0, k)];
      }
      let cur = null;
      pts.forEach((q, i) => {
        if (near(q)) { if (cur) { cur.looseB = true; pieces.push(cur); cur = null; } return; }
        if (!cur) cur = { pts: [], looseA: i > 0 || c.closed, looseB: false };
        cur.pts.push(q);
      });
      if (cur) { cur.looseB = c.closed; pieces.push(cur); }
    }
    const ends = [];
    pieces.forEach((pc, i) => { if (pc.looseA) ends.push([i, 0]); if (pc.looseB) ends.push([i, 1]); });
    if (bad || ends.length !== 4) continue;
    const ang = ([i, e]) => { const q = e ? pieces[i].pts[pieces[i].pts.length - 1] : pieces[i].pts[0]; return Math.atan2(q[1] - P[1], q[0] - P[0]); };
    ends.sort((a, b) => ang(a) - ang(b));
    const link = new Map([[ends[0], ends[2]], [ends[2], ends[0]], [ends[1], ends[3]], [ends[3], ends[1]]].map(([a, b]) => [a.join(), b]));
    const used = new Set(), out = [];
    const walk = (i, from) => {   // enter piece i at end `from`, follow links through P
      const pts = [];
      for (;;) {
        used.add(i);
        const seq = from === 0 ? pieces[i].pts : [...pieces[i].pts].reverse();
        pts.push(...seq);
        const nxt = link.get(`${i},${1 - from}`);
        if (!nxt) return { pts, closed: false };
        if (used.has(nxt[0])) return { pts: [...pts, P], closed: true };
        pts.push(P); [i, from] = nxt;
      }
    };
    pieces.forEach((pc, i) => { if (used.has(i)) return; if (!pc.looseA) out.push(walk(i, 0)); else if (!pc.looseB) out.push(walk(i, 1)); });
    pieces.forEach((pc, i) => { if (!used.has(i)) out.push(walk(i, 0)); });
    chains = [...keep, ...out];
  }
  return chains;
}

// Marching squares over [x0,x0+w]×[y0,y0+h] at `step`; F(x,y) -> value. Returns stitched chains {pts, closed}.
// `outside` forces the outermost ring of samples negative, so every contour closes (for region fills). `sads`
// are crossing points to route the lines through (see saddles()).
export function contour(F, x0, y0, w, h, step, outside = false, sads = null) {
  const nx = Math.ceil(w / step) + 1, ny = Math.ceil(h / step) + 1, sx = w / (nx - 1), sy = h / (ny - 1);
  const val = new Float64Array(nx * ny);
  let amp = 0;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    let v = F(x0 + i * sx, y0 + j * sy);
    if (outside && (i === 0 || j === 0 || i === nx - 1 || j === ny - 1)) v = -1e9;
    val[j * nx + i] = v; if (Math.abs(v) < 1e8) amp = Math.max(amp, Math.abs(v));
  }
  const pos = k => val[k] >= 0;
  const cross = new Array(2 * nx * ny);
  // Crossing point on an edge: linear interpolation, then two regula-falsi steps on the true field.
  const pt = id => {
    let p = cross[id]; if (p) return p;
    const k = id >> 1, i = k % nx, j = (k / nx) | 0, vert = id & 1;
    const ax = x0 + i * sx, ay = y0 + j * sy, bx = vert ? ax : ax + sx, by = vert ? ay + sy : ay;
    let va = val[k], vb = val[vert ? k + nx : k + 1];
    let lo = 0, hi = 1, t;
    const clampV = v => Math.max(-amp * 4, Math.min(amp * 4, v));
    va = clampV(va); vb = clampV(vb);
    for (let it = 0; it < 3; it++) {
      t = lo + (hi - lo) * va / (va - vb);
      if (it === 2 || !(t > lo && t < hi)) break;
      const vt = F(ax + (bx - ax) * t, ay + (by - ay) * t);
      if ((vt >= 0) === (va >= 0)) { lo = t; va = vt; } else { hi = t; vb = vt; }
    }
    p = [ax + (bx - ax) * t, ay + (by - ay) * t]; cross[id] = p; return p;
  };
  const segs = [];
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const k = j * nx + i, a = pos(k), b = pos(k + 1), c = pos(k + nx + 1), d = pos(k + nx);
    const T = 2 * k, R = 2 * (k + 1) + 1, B = 2 * (k + nx), L = 2 * k + 1;
    const e = [];
    if (a !== b) e.push(T); if (b !== c) e.push(R); if (c !== d) e.push(B); if (d !== a) e.push(L);
    if (e.length === 2) segs.push(e);
    else if (e.length === 4) {
      // The saddle of the cell's bilinear interpolant, checked against the real field there. Near a crossing
      // f ≈ κ·d₁·d₂, so a saddle value under ~10% of the corner values means the two branches pass within about a
      // third of a cell of each other — closer than a line is wide — and are drawn as the crossing they read as.
      const va = val[k], vb = val[k + 1], vc2 = val[k + nx + 1], vd = val[k + nx], D = va - vb + vc2 - vd;
      const tx = Math.abs(D) > 1e-12 ? Math.min(1, Math.max(0, (va - vd) / D)) : .5, ty = Math.abs(D) > 1e-12 ? Math.min(1, Math.max(0, (va - vb) / D)) : .5;
      const big = Math.max(Math.abs(va), Math.abs(vb), Math.abs(vc2), Math.abs(vd));
      if (Math.abs(F(x0 + (i + tx) * sx, y0 + (j + ty) * sy)) < .1 * big) { segs.push([T, B], [L, R]); continue; }
      const vc = F(x0 + (i + .5) * sx, y0 + (j + .5) * sy);
      // corner cuts: the corners that DON'T share the centre's sign get cut off
      if (a === (vc >= 0)) segs.push([T, R], [B, L]); else segs.push([L, T], [R, B]);
    }
  }
  // each crossed edge is shared by at most two segments (one per cell either side)
  const atA = new Int32Array(2 * nx * ny).fill(-1), atB = new Int32Array(2 * nx * ny).fill(-1);
  segs.forEach((s, i) => { for (const id of s) { if (atA[id] < 0) atA[id] = i; else atB[id] = i; } });
  const used = new Uint8Array(segs.length), chains = [];
  const free = id => { const a = atA[id], b = atB[id]; return a >= 0 && !used[a] ? a : b >= 0 && !used[b] ? b : null; };
  const walk = (si, from) => {   // follow from segment si leaving through edge `from`'s opposite end
    const ids = [];
    let cur = si, enter = from;
    for (;;) {
      used[cur] = 1;
      const s = segs[cur], exit = s[0] === enter ? s[1] : s[0];
      ids.push(exit);
      const nxt = free(exit);
      if (nxt == null) return ids;
      cur = nxt; enter = exit;
    }
  };
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    const fwd = walk(i, segs[i][0]);
    const closed = fwd[fwd.length - 1] === segs[i][0];
    let ids;
    if (closed) ids = fwd;
    else {
      // extend backwards from the start edge
      const back = [];
      let enter = segs[i][0];
      for (;;) { const nxt = free(enter); if (nxt == null) break; used[nxt] = 1; const s = segs[nxt]; const ex = s[0] === enter ? s[1] : s[0]; back.push(ex); enter = ex; }
      ids = [...back.reverse(), segs[i][0], ...fwd];
    }
    // drop near-duplicate crossings (a line grazing a vertex) — they add wobble to the smoothing, not shape
    const pts = [];
    for (const id of ids) { const p = pt(id), q = pts[pts.length - 1]; if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > step * .3) pts.push(p); }
    if (closed && pts.length > 2) { const p = pts[0], q = pts[pts.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) <= step * .3) pts.pop(); }
    if (pts.length >= 2) chains.push({ pts, closed });
  }
  return sads && sads.length ? throughSaddles(chains, sads, step * 1.5) : chains;
}

// Smooth a chain into quadratic pieces through the midpoints of consecutive crossings, handing each piece to
// `emit(start, ctrl, end)`. Open chains start and end exactly on their first and last points.
export function pieces({ pts, closed }, emit) {
  const n = pts.length, mid = (i, j) => [(pts[i][0] + pts[j][0]) / 2, (pts[i][1] + pts[j][1]) / 2];
  if (n < 3) { emit(pts[0], null, pts[n - 1]); return; }
  if (closed) { for (let i = 0; i < n; i++) emit(mid((i + n - 1) % n, i), pts[i], mid(i, (i + 1) % n)); return; }
  for (let i = 1; i < n - 1; i++) emit(i === 1 ? pts[0] : mid(i - 1, i), pts[i], i === n - 2 ? pts[n - 1] : mid(i, i + 1));
}

// Accumulates curve pieces into per-band path strings, continuing a subpath while pieces stay in one band.
function bandPaths(nb) {
  const d = Array.from({ length: nb }, () => ''), last = new Array(nb).fill(null);
  return {
    d,
    add(band, s, c, e) {
      const l = last[band];
      if (!l || Math.abs(l[0] - s[0]) > .01 || Math.abs(l[1] - s[1]) > .01) d[band] += `M${f1(s[0])} ${f1(s[1])}`;
      d[band] += c ? `Q${f1(c[0])} ${f1(c[1])} ${f1(e[0])} ${f1(e[1])}` : `L${f1(e[0])} ${f1(e[1])}`;
      last[band] = e;
    },
  };
}

// A thin-line colour for a surface: the candidate hues, swept across lightness, best worst-case contrast.
function lineFor(surfaces, hues) {
  let best = null, sc = -1;
  for (const base of hues) {
    const [, C, H] = hexToOklch(base);
    for (let L = .08; L <= .97; L += .06) {
      const c = oklchToHex(L, C * .7, H), s = Math.min(...surfaces.map(x => labDist(c, x) + .6 * Math.abs(hexToOklch(c)[0] - hexToOklch(x)[0])));
      if (s > sc) { sc = s; best = c; }
    }
  }
  return best;
}

export default function chladni() {
  const { ground, fg, ink, soft } = groundScheme();
  const W = ctx.W, H = ctx.H, S = ctx.S;
  const layout = wpick([['single', 5], ['plates', 2.4]]);
  let style = wpick(layout === 'single' ? [['lines', 3], ['sand', 4], ['regions', 2.5]] : [['lines', 3], ['sand', 2], ['regions', 2]]);
  const svg = svgRoot();
  const pal = shuffle(fg);
  const tick = Math.max(1, S / 900);

  // ---- a plate drawn into rectangle [px,py,pw,ph] with plate side L and plate origin (ox,oy). Everything a style
  // draws is split into `nb` reveal bands by distance from (rcx,rcy).
  const drawPlate = ({ terms, ox, oy, L, rect, nb, rcx, rcy, rmax, delay0, spread, parent, lineCol, lineW, fillCol, dots, grainCol, grain2 }) => {
    const field = makeField(terms);
    const F = (x, y) => field((x - ox) / L, (y - oy) / L)[0];
    const k2 = terms.reduce((m, t) => Math.max(m, Math.hypot(t[1], t[2])), 1);
    const lambda = 2 * L / k2;                                   // shortest wavelength across the plate, in px
    const [rx, ry, rw, rh] = rect;
    const band = (x, y) => Math.min(nb - 1, Math.floor(Math.hypot(x - rcx, y - rcy) / rmax * nb));
    const step = Math.max(2, Math.min(4, lambda / 60));
    const delay = b => delay0 + spread * b / Math.max(1, nb - 1);
    const sads = style === 'sand' ? null : saddles(field, L, ox, oy, rect, lambda, step);

    let regionChains = null;
    if (style === 'regions') {
      // closed loops (outer sample ring forced negative) filled even-odd = exactly the f>0 regions. A big plate is
      // revealed through annular clip bands, each overlapping the next by a pixel so no seam shows.
      const pad = step * 2;
      const chains = regionChains = contour(F, rx - pad, ry - pad, rw + 2 * pad, rh + 2 * pad, step, true, sads);
      let d = '';
      for (const ch of chains) { const bp = bandPaths(1); pieces(ch, (s, c, e) => bp.add(0, s, c, e)); d += bp.d[0] + 'Z'; }
      if (nb === 1) {   // a small plate: its own stagger across the grid is the reveal
        fade(mk('path', { d, 'fill-rule': 'evenodd', fill: fillCol, 'clip-path': parent.__clip }, parent), delay0, .6);
        if (!lineCol) return;
      }
      const uid = 'ch' + ((Math.random() * 1e9) | 0).toString(36);
      const defs = nb > 1 ? mk('defs', {}, parent) : null;
      if (nb > 1) mk('path', { id: uid, d, 'fill-rule': 'evenodd' }, defs);
      for (let b = 0; b < nb && nb > 1; b++) {
        const r0 = Math.max(0, b * rmax / nb - 1), r1 = b === nb - 1 ? rmax * 3 : (b + 1) * rmax / nb + 1;
        const ring = (r, cw) => `M${f1(rcx + r)} ${f1(rcy)}A${f1(r)} ${f1(r)} 0 1 ${cw} ${f1(rcx - r)} ${f1(rcy)}A${f1(r)} ${f1(r)} 0 1 ${cw} ${f1(rcx + r)} ${f1(rcy)}Z`;
        const cp = mk('clipPath', { id: `${uid}b${b}` }, defs);
        mk('path', { d: ring(r1, 1) + (r0 > 0 ? ring(r0, 0) : ''), 'clip-rule': 'evenodd' }, cp);
        const use = mk('use', { href: '#' + uid, fill: fillCol, 'clip-path': `url(#${uid}b${b})` }, parent);
        fade(use, delay(b), .6);
      }
      if (!lineCol) return;
    }

    if (style === 'lines' || style === 'regions') {
      // Regions reuse their closed loops: the only difference from the open lines is the run along the forced-
      // negative outer ring, which lies outside the plate (clipped) or past the canvas edge.
      const pad = step;
      const chains = regionChains || contour(F, rx - pad, ry - pad, rw + 2 * pad, rh + 2 * pad, step, false, sads);
      const bp = bandPaths(nb);
      for (const ch of chains) pieces(ch, (s, c, e) => bp.add(band(c ? c[0] : s[0], c ? c[1] : s[1]), s, c, e));
      const clipAttr = parent.__clip ? { 'clip-path': parent.__clip } : {};
      const gg = mk('g', clipAttr, parent);
      bp.d.forEach((d, b) => {
        if (!d) return;
        // fill 'transparent', not 'none': these runs can be very long, and must not be classed as draw-on strokes
        const e = mk('path', { d, fill: 'transparent', stroke: lineCol, 'stroke-width': f1(lineW), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gg);
        fade(e, delay(b) + (style === 'regions' ? .25 : 0));
      });
      return;
    }

    // ---- sand. Distance to the nearest nodal line ≈ |f|/|∇f|; the gradient is floored at a fraction of its
    // typical size so grains also heap where the plate barely moves (around crossings), as real sand does.
    let g2 = 0;
    for (let i = 0; i < 300; i++) { const [, a, b] = field(Math.random(), Math.random()); g2 += a * a + b * b; }
    const gRms = Math.sqrt(g2 / 300) / L;
    const dist = (x, y) => { const [f, a, b] = field((x - ox) / L, (y - oy) / L); return Math.abs(f) / Math.hypot(Math.hypot(a, b) / L, .35 * gRms); };
    const sigma = Math.max(1.5 * tick, lambda * dots.width), p0 = dots.bg;
    const cs = Math.max(2, Math.min(9, sigma * .9));
    const nxC = Math.ceil(rw / cs), nyC = Math.ceil(rh / cs);
    const pm = new Float32Array(nxC * nyC);
    let tot = 0;
    for (let j = 0; j < nyC; j++) for (let i = 0; i < nxC; i++) {
      const d0 = dist(rx + (i + .5) * cs, ry + (j + .5) * cs);
      tot += Math.exp(-((d0 / sigma) ** 2)) + p0;
      pm[j * nxC + i] = Math.exp(-((Math.max(0, d0 - cs * .8) / sigma) ** 2)) + p0;
    }
    // Grain density is set at the core of a line (grains per px²), so a line reads equally solid however long
    // or complex the figure is; only an overall budget can thin it.
    const K = Math.min(dots.rho / (tick * tick), dots.max / (tot * cs * cs)) * cs * cs;
    const bp = Array.from({ length: nb }, () => []), bp2 = Array.from({ length: nb }, () => []);
    for (let j = 0; j < nyC; j++) for (let i = 0; i < nxC; i++) {
      const pmax = pm[j * nxC + i], lam = K * pmax;
      let k = Math.floor(lam + Math.random());
      while (k-- > 0) {
        const x = rx + (i + Math.random()) * cs, y = ry + (j + Math.random()) * cs;
        const p = Math.exp(-((dist(x, y) / sigma) ** 2)) + p0;
        if (Math.random() * pmax > p) continue;
        const b = band(x, y);
        (grain2 && Math.random() < dots.second ? bp2 : bp)[b].push(`M${f1(x)} ${f1(y)}h0`);
      }
    }
    const gg = mk('g', parent.__clip ? { 'clip-path': parent.__clip } : {}, parent);
    for (let b = 0; b < nb; b++) {
      for (const [list, col, wd] of [[bp[b], grainCol, dots.size], [bp2[b], grain2, dots.size * 1.25]]) {
        if (!list.length) continue;
        const e = mk('path', { d: list.join(''), fill: 'none', stroke: col, 'stroke-width': f1(wd), 'stroke-linecap': 'round' }, gg);
        fade(e, delay(b), .55);
      }
    }
  };

  if (layout === 'single') {
    // A plate somewhat bigger than the canvas's long side, cropped — or a smaller plate continuing mirrored.
    const tiled = chance(.3);
    const L = tiled ? S * rand(.8, 1) : Math.max(W, H) * rand(1, 1.2);
    const ox = (W - L) / 2, oy = (H - L) / 2;
    // (0,m) on its own is just a diagonal lattice of straight lines — fine as one plate among many, flat as the whole canvas
    const cand = GROUPS.filter(g => g.k >= (tiled ? 20 : 34) && g.k <= (style === 'sand' ? 120 : 150) && g.modes.some(([n]) => n > 0));
    const group = chance(.6) ? pick(cand.filter(g => g.modes.length > 1)) : pick(cand);
    const terms = groupTerms(group);
    const nb = 10, rmax = Math.hypot(W, H) / 2;
    const common = { terms, ox, oy, L, rect: [0, 0, W, H], nb, rcx: W / 2, rcy: H / 2, rmax, delay0: 0, spread: .9, parent: svg };
    if (style === 'lines') drawPlate({ ...common, lineCol: ink, lineW: S * rand(.0022, .0055) });
    else if (style === 'regions') {
      const fillCol = pal[0];
      const withLine = chance(.55);
      drawPlate({ ...common, fillCol, lineCol: withLine ? lineFor([ground, fillCol], [ink, ...pal]) : null, lineW: S * rand(.0015, .004) });
    } else {
      const second = chance(.45) ? readable([pal[0]], ground, .22)[0] : null;
      drawPlate({ ...common, grainCol: ink, grain2: second, dots: { rho: rand(.2, .34), max: W * H / 1296000 * 60000, width: rand(.012, .03), bg: rand(.003, .012), size: tick * rand(1.3, 2), second: rand(.15, .35) } });
    }
    return;
  }

  // ---- a scientific plate: a grid of square plates, both counts from one pitch, in order of increasing mode.
  const across = ri(3, 5), gap = rand(.12, .22);
  const pitch = S / (across + gap * 1.2);
  const cols = Math.max(1, Math.floor((W - pitch * gap) / pitch)), rows = Math.max(1, Math.floor((H - pitch * gap) / pitch));
  const plate = pitch * (1 - gap);
  if (style === 'sand' && plate < 120) style = 'lines';   // grains can't draw a figure on a postage stamp
  const x0 = (W - (cols * pitch - pitch * gap)) / 2, y0 = (H - (rows * pitch - pitch * gap)) / 2;
  const n = cols * rows;
  // Walk up the groups from a random start, taking each group's figures; ascending order reads as a catalogue.
  const pool = GROUPS.filter(g => g.k >= 5 && g.k <= 170), start = ri(2, 12), list = [];
  for (let gi = start; list.length < n; gi = gi + 1 < pool.length ? gi + 1 : start) {
    const g = pool[gi];
    list.push(groupTerms(g));
    if (g.modes.length > 1 && list.length < n && chance(.5)) list.push(groupTerms(g));   // a second mixing of the same frequency
  }
  const fillPlates = style === 'regions' || chance(.45);
  const framed = !fillPlates || chance(.35);
  const plateCols = fillPlates ? pal : [];
  const lineW = plate * rand(.008, .016);
  let k = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++, k++) {
    const px = x0 + c * pitch, py = y0 + r * pitch;
    const delay0 = (r + c) * .07 * Math.min(1, 10 / (rows + cols));
    const g = mk('g', {}, svg);
    // plate fill and frame: the plate square is also the clip for grains and line caps
    const uid = 'cp' + ((Math.random() * 1e9) | 0).toString(36);
    const cp = mk('clipPath', { id: uid }, mk('defs', {}, g));
    mk('rect', { x: f1(px), y: f1(py), width: f1(plate), height: f1(plate) }, cp);
    g.__clip = `url(#${uid})`;
    let surface = ground;
    if (fillPlates && style !== 'regions') {
      surface = plateCols[k % plateCols.length];
      fade(mk('rect', { x: f1(px), y: f1(py), width: f1(plate), height: f1(plate), fill: surface }, g), delay0, .45);
    }
    const terms = list[k];
    const common = { terms, ox: px, oy: py, L: plate, rect: [px, py, plate, plate], nb: style === 'lines' ? 3 : 1, rcx: px + plate / 2, rcy: py + plate / 2, rmax: plate * .71, delay0: delay0 + .1, spread: .35, parent: g };
    if (style === 'lines') drawPlate({ ...common, lineCol: lineFor([surface], [ink, ...pal]), lineW });
    else if (style === 'regions') {
      const fillCol = plateCols[k % plateCols.length];
      drawPlate({ ...common, fillCol, lineCol: chance(.5) ? lineFor([ground, fillCol], [ink, ...pal]) : null, lineW: lineW * .7 });
    } else {
      drawPlate({ ...common, grainCol: lineFor([surface], [ink, ...pal]), grain2: null, dots: { rho: rand(.22, .3), max: plate * plate / 1296000 * 90000, width: .03, bg: .004, size: tick * 1.35, second: 0 } });
    }
    if (framed) {
      const fc = surface === ground ? soft : lineFor([surface, ground], [ink]);
      fade(mk('rect', { x: f1(px), y: f1(py), width: f1(plate), height: f1(plate), fill: 'transparent', stroke: fc, 'stroke-width': f1(Math.max(1, tick * 1.2)) }, g), delay0, .45);
    }
  }
}
