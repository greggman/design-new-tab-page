import { ctx, rand, ri, chance, shuffle, wpick, svgRoot, labDist, readable, hexToOklch, oklchToHex, groundScheme } from '../utils.js';
// Celtic knot: interlace built with the knot-grid method. A rectangle of m x n grid dots (dots on even
// coordinates) puts a potential crossing at the midpoint of every dot-grid edge — the unit-lattice points with
// exactly one odd coordinate — and strands run diagonally from crossing to crossing, which is the plain plait.
// A "break" is a wall laid along a grid line: at each site on it the two strands no longer cross but turn back,
// the wall horizontal (H) or vertical (V). The panel's own edge is a wall, so every strand is a closed loop.
//
// Each site owns the unit square around it, and those squares meet only at their corners, where one strand
// passes from one square to the next at exactly 45°. So every piece of strand is local to its square — a
// straight diagonal through a crossing, or a cubic turn corner-to-corner at a break — and the tangents match
// at every shared corner, which is what makes the loops smooth without any global fitting.
//
// Over/under comes from the checkerboard: at a horizontal-edge site (x odd) the "\" diagonal is on top, at a
// vertical-edge site the "/" one. Walking a diagonal, the two kinds alternate; a break only ever joins two
// faces of the same checkerboard colour, so the alternation survives any pattern of breaks.

const NS = 'http://www.w3.org/2000/svg';
const K = .25;                        // bézier handle for a turn, in site units along the 45° tangent

// Break pattern over an m x n dot panel as Map(siteKey -> 'H'|'V'); unlisted interior sites cross.
// `wrap` = [a, b] tiles a period cell of a x b dots instead (for the full field).
function breaks(m, n, { sym, density, frame, wrap }) {
  const X2 = wrap ? 2 * wrap[0] : 2 * m, Y2 = wrap ? 2 * wrap[1] : 2 * n, st = new Map();
  const md = (v, p) => ((v % p) + p) % p;
  const put = (x, y, v) => {
    if (wrap) { x = md(x, X2); y = md(y, Y2); } else if (x <= 0 || y <= 0 || x >= X2 || y >= Y2) return;
    if (!((x + y) & 1)) return;
    // Mirror images keep a site's parity (X2 - x ≡ x mod 2), so an H break reflects to an H break. The diagonal
    // mirror (square panels only) swaps x and y, which turns an H break into a V one.
    let im = [[x, y, v]];
    if (sym.d) im.push([y, x, v === 'H' ? 'V' : 'H']);
    if (sym.x) im = im.flatMap(([a, b, w]) => [[a, b, w], [X2 - a, b, w]]);
    if (sym.y) im = im.flatMap(([a, b, w]) => [[a, b, w], [a, Y2 - b, w]]);
    if (sym.r) im = im.flatMap(([a, b, w]) => [[a, b, w], [X2 - a, Y2 - b, w]]);
    for (let [a, b, w] of im) { if (wrap) { a = md(a, X2); b = md(b, Y2); } st.set(b * 4096 + a, w); }
  };
  const nWalls = Math.round((X2 * Y2 / 4) * density);
  for (let i = 0; i < nWalls; i++) {
    // Walls run along the dot grid only. A wall on the cell-centre grid can sit one unit from a parallel dot-grid
    // wall, and the strand squeezed between them wriggles from side to side instead of running straight.
    const horiz = chance(.5), L = wpick([[1, 6], [2, 3], [3, 1]]);
    const c = 2 * ri(0, (horiz ? Y2 : X2) / 2), a = 2 * ri(0, (horiz ? X2 : Y2) / 2);
    for (let k = 0; k < L; k++) horiz ? put(a + 1 + 2 * k, c, 'H') : put(c, a + 1 + 2 * k, 'V');
  }
  if (frame) {
    // an inner wall ring, left open at its mid-points so the frame knot and the centre knot interlock
    const t = frame, gap = chance(.5);
    for (let x = t + 1; x < X2 - t; x += 2) if (!gap || Math.abs(x - m) > 1) { put(x, t, 'H'); put(x, Y2 - t, 'H'); }
    for (let y = t + 1; y < Y2 - t; y += 2) if (!gap || Math.abs(y - n) > 1) { put(t, y, 'V'); put(X2 - t, y, 'V'); }
  }
  const key = wrap ? (x, y) => md(y, Y2) * 4096 + md(x, X2) : (x, y) => y * 4096 + x;
  return { get: (x, y) => st.get(key(x, y)), del: (x, y) => st.delete(key(x, y)) };
}

// Trace every strand. A site's state at (x,y): border sites always turn, interior ones follow `brk`.
// Each strand is a list of {x, y, c, e, t}: entry corner c, exit corner e (each [±1,±1]), t the site state.
export function traceKnot(m, n, brk) {
  const X2 = 2 * m, Y2 = 2 * n;
  const state = (x, y) => y === 0 || y === Y2 ? 'H' : x === 0 || x === X2 ? 'V' : brk(x, y) ?? 'X';
  const used = new Set(), strands = [];
  const portKey = (x, y, c) => (2 * y + c[1] + 1) * 8192 + (2 * x + c[0] + 1);   // doubled coordinate of the corner
  for (let y = 0; y <= Y2; y++) for (let x = (y + 1) & 1; x <= X2; x += 2) for (const c of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const nx = x + c[0], ny = y + c[1];
    if (nx < 0 || ny < 0 || nx > X2 || ny > Y2 || used.has(portKey(x, y, c))) continue;
    const segs = [], start = portKey(x, y, c);
    let sx = x, sy = y, cc = c;
    for (let guard = 0; guard < 1e6; guard++) {
      const t = state(sx, sy);
      const e = t === 'X' ? [-cc[0], -cc[1]] : t === 'H' ? [-cc[0], cc[1]] : [cc[0], -cc[1]];
      segs.push({ x: sx, y: sy, c: cc, e, t });
      const pk = portKey(sx, sy, e);
      used.add(pk);
      if (pk === start) break;
      sx += e[0]; sy += e[1]; cc = [-e[0], -e[1]];
    }
    strands.push(segs);
  }
  return strands;
}
// Is this strand on top at its crossing? "\" (c[0] === c[1]) wins at horizontal-edge sites.
export const isOver = s => ((s.x & 1) === 1) === (s.c[0] === s.c[1]);

export default function celticKnot() {
  const { ground, fg, ink } = groundScheme();
  const W = ctx.W, H = ctx.H;
  const field = chance(.45);
  const style = wpick([['band', 5], ['hollow', 2], ['gap', 2]]);
  const perStrand = chance(.7);

  // ---- layout: one or more closed panels, or one oversized panel whose border lies off the canvas.
  const panels = [];            // {ox, oy, m, n, brk}
  let u;
  const symPick = sq => wpick([[{ x: 1, y: 1, d: sq }, 6], [{ r: 1, d: sq }, 2], [{ x: 1 }, 1.5], [{ y: 1 }, 1]]);
  const makeBreaks = (m, n, opts, sx = 0, sy = 0) => {
    // Random walls now and then close off a tiny ring, or a loop that only turns and never interlaces. Rather than
    // rejecting the whole pattern (on a big field one bad spot is nearly certain), knock out the breaks along
    // that loop and re-trace. The loop's mirror images are just as bad, so they get repaired in the same pass.
    // Repairs can strip a small panel bare, so roll a few patterns and keep the first that holds on to enough breaks.
    let best = () => undefined, bestN = -1;       // a plain plait is always valid
    for (let attempt = 0; attempt < 8; attempt++) {
      const b = breaks(m, n, opts), brk = (x, y) => b.get(x - sx, y - sy);
      let ok = false;
      for (let pass = 0; pass < 12 && !ok; pass++) {
        const bad = traceKnot(m, n, brk).filter(s => s.length < 10 || !s.some(g => g.t === 'X'));
        ok = !bad.length;
        for (const s of bad) for (const g of s) b.del(g.x - sx, g.y - sy);
      }
      if (!ok) continue;
      let count = 0;
      for (let y = 1; y < 2 * n; y++) for (let x = 1 + (y & 1); x < 2 * m; x += 2) if (brk(x, y)) count++;
      if (count > bestN) { best = brk; bestN = count; }
      if (count >= m * n * opts.density * .5) break;
    }
    return best;
  };
  if (field) {
    u = ctx.S / rand(14, 26);
    const m = 2 * Math.ceil(W / u / 4) + 2, n = 2 * Math.ceil(H / u / 4) + 2;   // even, so the centre is a dot
    const ox = (W - 2 * m * u) / 2, oy = (H - 2 * n * u) / 2;
    if (chance(.5)) {
      // one knot the size of the field, mirrored about the canvas centre
      panels.push({ ox, oy, m, n, brk: makeBreaks(m, n, { sym: { x: 1, y: 1 }, density: rand(.1, .24) }) });
    } else {
      // a repeating motif. The period cell is mirror-symmetric about its origin; shifting by the (even) centre
      // dot puts that axis through the middle of the canvas. An odd shift would swap H-edge and V-edge sites.
      const a = ri(3, 6), b = chance(.7) ? a : ri(3, 6);
      panels.push({ ox, oy, m, n, brk: makeBreaks(m, n, { sym: { x: 1, y: 1, d: a === b && chance(.7) }, density: rand(.1, .22), wrap: [a, b] }, m, n) });
    }
  } else {
    const across = wpick([[1, 4], [2, 3], [3, 1]]);
    const tgt = ctx.S / across;
    const cols = Math.max(1, Math.round(W / tgt)), rows = Math.max(1, Math.round(H / tgt));
    const u0 = ctx.S / rand(20, 36), M = u0 * rand(1.4, 2.2);
    const pw = (W - M * (cols + 1)) / cols, ph = (H - M * (rows + 1)) / rows;
    const m = Math.max(3, Math.round(pw / u0 / 2)), n = Math.max(3, Math.round(ph / u0 / 2));
    u = Math.min(pw / m, ph / n) / 2;
    const symPanel = () => symPick(m === n && chance(.6));
    const same = chance(.5), sym = symPanel(), density = rand(.1, .28);
    const frameOf = () => Math.min(m, n) >= 5 && chance(.35) ? 2 * ri(1, Math.floor((Math.min(m, n) - 3) / 2)) : 0;
    const shared = makeBreaks(m, n, { sym, density, frame: frameOf() });
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cx = M + c * (pw + M) + pw / 2, cy = M + r * (ph + M) + ph / 2;
      panels.push({ ox: cx - m * u, oy: cy - n * u, m, n, brk: same ? shared : makeBreaks(m, n, { sym: symPanel(), density: rand(.1, .28), frame: frameOf() }) });
    }
  }

  // ---- strands, geometry in px
  const bw = u * (style === 'gap' ? rand(.24, .34) : rand(.38, .48));   // band width
  const edge = Math.max(1.3, bw * (style === 'hollow' ? rand(.2, .28) : rand(.14, .22)));   // outline thickness each side
  const gapW = Math.max(2, bw * rand(.35, .6));                    // 'gap' style: clearance around the over strand
  const all = [];                                                   // {segs, ox, oy}
  for (const p of panels) for (const segs of traceKnot(p.m, p.n, p.brk)) all.push({ segs, ox: p.ox, oy: p.oy });

  // Crossing graph between strands, then colour greedily so crossing strands differ where the palette allows.
  const siteOwner = new Map();
  all.forEach((s, i) => { s.i = i; s.nb = new Set(); for (const g of s.segs) if (g.t === 'X') {
    const k = `${s.ox|0},${s.oy|0},${g.x},${g.y}`, o = siteOwner.get(k);
    if (o != null && o !== i) { s.nb.add(o); all[o].nb.add(i); } else siteOwner.set(k, i);
  } });

  // ---- colours. Every colour is checked against what it actually sits on.
  let outline, fills, bgFill = null;
  const spread = cs => { const out = []; for (const c of cs) if (out.every(o => labDist(o, c) >= .12)) out.push(c); return out; };
  if (style === 'band') {
    // The outline is the band's edge on the ground: ink, or a palette colour pushed to the far end of lightness.
    outline = chance(.6) ? ink : (() => { const [, C, Hh] = hexToOklch(shuffle(fg)[0]); return readable([oklchToHex(hexToOklch(ground)[0] < .5 ? .93 : .2, C * .7, Hh)], ground, .3)[0] ?? ink; })();
    fills = spread(readable(shuffle(fg), outline, .22));
    if (!fills.length) fills = readable([ground], outline, .22);
  } else if (style === 'hollow') {
    // The band is just two thin edge lines on the ground, and a thin line needs LIGHTNESS contrast: a colour that
    // only differs from the ground in hue disappears at 1–2px. Push each one's lightness clear of the ground.
    const gL = hexToOklch(ground)[0];
    fills = spread(fg.map(c => { const [L, C, Hh] = hexToOklch(c); return Math.abs(L - gL) >= .34 ? c : oklchToHex(gL < .5 ? Math.min(.97, gL + rand(.38, .5)) : Math.max(.08, gL - rand(.38, .5)), C, Hh); }));
    bgFill = ground;
  } else {
    fills = spread(shuffle(fg));
  }
  if (!perStrand) fills = fills.slice(0, 1);
  const order = [...all].sort((a, b) => b.segs.length - a.segs.length), use = fills.map(() => 0);
  for (const s of order) {
    const clash = fills.map((_, k) => [...s.nb].filter(j => all[j].col === k).length);
    let k = 0;
    for (let j = 1; j < fills.length; j++) if (clash[j] < clash[k] || (clash[j] === clash[k] && use[j] < use[k])) k = j;
    s.col = k; use[k]++;
  }

  // ---- paths, split into reveal bands swept across the canvas. Layer order is global — every base stroke,
  // then every crossing patch — so a later band's base can't paint over an earlier band's crossings.
  const NB = 10, sweep = wpick([['radial', 2], ['diag', 2], ['down', 1]]);
  const R = Math.hypot(W, H) / 2;
  const bandAt = (x, y) => {
    const v = sweep === 'radial' ? Math.hypot(x - W / 2, y - H / 2) / R : sweep === 'diag' ? (x + y) / (W + H) : y / H;
    return Math.max(0, Math.min(NB - 1, Math.floor(v * NB)));
  };
  const f = v => v.toFixed(1);
  const base = Array.from({ length: NB }, () => fills.map(() => ''));
  const over = Array.from({ length: NB }, () => ({ a: fills.map(() => ''), b: fills.map(() => '') }));
  // Crossing patch half-lengths. The wide stroke only has to span the under strand's width; the narrow one runs a
  // little further so the wide stroke's butt end is always hidden beneath it.
  const halfA = bw / 2 + 1.5, halfB = Math.min(u * .7, halfA + Math.max(2, bw * .15));
  for (const s of all) {
    const pt = (g, c, t = .5) => [s.ox + (g.x + c[0] * t) * u, s.oy + (g.y + c[1] * t) * u];
    let run = '', runBand = -1, last = null;
    const flush = () => {
      if (!run) return;
      // nudge the run's end out along its 45° tangent so neighbouring runs overlap instead of leaving a seam
      const q = pt(last, last.e, .5 + 1.2 / u);
      base[runBand][s.col] += run + `L${f(q[0])} ${f(q[1])}`;
      run = '';
    };
    for (const g of s.segs) {
      const [cx, cy] = pt(g, [0, 0], 0), b = bandAt(cx, cy);
      if (b !== runBand) {
        flush(); runBand = b;
        const p0 = pt(g, g.c, .5 + 1.2 / u), p1 = pt(g, g.c);
        run = `M${f(p0[0])} ${f(p0[1])}L${f(p1[0])} ${f(p1[1])}`;
      }
      const p3 = pt(g, g.e);
      if (g.t === 'X') {
        run += `L${f(cx)} ${f(cy)}`;
        if (isOver(g)) {
          // Patch the crossing: a short piece of this strand repainted over the strand passing beneath.
          const d = [g.c[0] / Math.SQRT2, g.c[1] / Math.SQRT2];
          const seg = h => `M${f(cx + d[0] * h)} ${f(cy + d[1] * h)}L${f(cx - d[0] * h)} ${f(cy - d[1] * h)}`;
          over[b].a[s.col] += seg(halfA);
          over[b].b[s.col] += seg(halfB);
        }
      } else {
        const p0 = pt(g, g.c), p1 = [p0[0] - g.c[0] * K * u, p0[1] - g.c[1] * K * u], p2 = [p3[0] - g.e[0] * K * u, p3[1] - g.e[1] * K * u];
        run += `C${f(p1[0])} ${f(p1[1])} ${f(p2[0])} ${f(p2[1])} `;
      }
      run += `${g.t === 'X' ? 'L' : ''}${f(p3[0])} ${f(p3[1])}`;
      last = g;
    }
    flush();
  }

  // ---- draw
  const svg = svgRoot();
  const mk = (d, attrs, band, t0) => {
    const e = document.createElementNS(NS, 'path');
    e.setAttribute('d', d); e.setAttribute('fill', 'none');
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    e.style.setProperty('--t0', 'none'); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', '1');
    e.style.animation = `fin .5s ease ${(t0 + band * .09).toFixed(2)}s both`;
    svg.appendChild(e);
  };
  const common = { 'stroke-linecap': 'butt', 'stroke-linejoin': 'round' };
  const wide = style === 'gap' ? null : bw, narrow = style === 'hollow' ? bw - 2 * edge : style === 'band' ? bw - 2 * edge : bw;
  if (field === false && chance(.5)) {
    // a ruled frame round each panel, like the borders of a manuscript carpet page
    const d = panels.map(p => { const x = p.ox - u * .45, y = p.oy - u * .45, w = 2 * p.m * u + u * .9, h = 2 * p.n * u + u * .9; return `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`; }).join('');
    mk(d, { stroke: style === 'band' ? outline : fills[0], 'stroke-width': f(Math.max(1.2, bw * .12)) }, 0, 0);
  }
  if (wide) for (let b = 0; b < NB; b++) {
    if (style === 'band') { const d = base[b].join(''); if (d) mk(d, { ...common, stroke: outline, 'stroke-width': f(wide) }, b, 0); }
    else base[b].forEach((d, k) => d && mk(d, { ...common, stroke: fills[k], 'stroke-width': f(wide) }, b, 0));
  }
  for (let b = 0; b < NB; b++) {
    if (style === 'hollow') { const d = base[b].join(''); if (d) mk(d, { ...common, stroke: bgFill, 'stroke-width': f(narrow) }, b, .05); }
    else base[b].forEach((d, k) => d && mk(d, { ...common, stroke: fills[k], 'stroke-width': f(narrow) }, b, .05));
  }
  for (let b = 0; b < NB; b++) {
    const o = over[b];
    const da = o.a.join('');
    if (!da) continue;
    if (style === 'band') mk(da, { ...common, stroke: outline, 'stroke-width': f(bw) }, b, .05);
    else if (style === 'gap') mk(da, { ...common, stroke: ground, 'stroke-width': f(bw + 2 * gapW) }, b, .05);
    else o.a.forEach((d, k) => d && mk(d, { ...common, stroke: fills[k], 'stroke-width': f(bw) }, b, .05));
    if (style === 'hollow') { const d = o.b.join(''); if (d) mk(d, { ...common, stroke: bgFill, 'stroke-width': f(narrow) }, b, .05); }
    else o.b.forEach((d, k) => d && mk(d, { ...common, stroke: fills[k], 'stroke-width': f(narrow) }, b, .05));
  }
}
