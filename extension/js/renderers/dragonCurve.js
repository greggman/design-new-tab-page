import { ctx, rand, ri, pick, shuffle, wpick, mix, svgRoot, labDist, readable, hexToOklch, oklchToHex, groundScheme } from '../utils.js';
// Dragon curve: the Heighway dragon, i.e. a strip of paper folded in half n times and opened out so every
// fold is a right angle. Its turn sequence is the regular paper-folding sequence — turn k (k = 2^j·m, m odd)
// goes one way when m ≡ 1 (mod 4) and the other when m ≡ 3 — and the resulting lattice path never uses the
// same grid edge twice, so however tightly it packs it never crosses itself.
//
// Drawn the classic way: every corner is replaced by a quarter circle joining the midpoints of its two
// edges. Every vertex of the dragon is a turn, so the whole curve becomes a chain of radius-½ arcs. Where the
// path comes back to a lattice point it has visited before, the two arcs bow away from each other, and the
// jagged staircase turns into one ribbon that visibly weaves around itself.
//
// Arrangements: one dragon, whole or enlarged and cropped; the twindragon (a dragon plus its copy turned 180°
// about the midpoint between its ends, so the two join end to end into one closed loop); and four copies
// turned 90° apart about the start point, which fit together using every lattice edge near the centre exactly
// once — scaled so that fully tiled neighbourhood covers the canvas edge to edge.
//
// Styles: an open ribbon; a hollow ribbon (the ground run down its middle); and a filled look, where the
// stroke is as wide as an edge so the ribbon closes up into solid area and colouring by sub-dragon shows the
// way a dragon is tiled by smaller dragons.

const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
const MAXN = 16;

// Paper-folding turns, ±1, for vertex k = 1 … 2^n − 1. Depth n is a prefix of depth n+1, so one table serves
// every depth.
export function foldTurns(n) {
  const t = new Int8Array(2 ** n - 1);
  for (let k = 1; k < 2 ** n; k++) { let m = k; while (!(m & 1)) m >>= 1; t[k - 1] = (m & 2) ? -1 : 1; }
  return t;
}

// Lattice vertices (2^n + 1) and edge directions of the dragon started at (x0,y0) heading d0.
export function dragonPoints(turns, n, d0 = 0, x0 = 0, y0 = 0) {
  const N = 2 ** n, xs = new Int32Array(N + 1), ys = new Int32Array(N + 1), dir = new Uint8Array(N);
  let x = x0, y = y0, d = d0;
  xs[0] = x; ys[0] = y;
  for (let i = 0; i < N; i++) {
    if (i) d = (d + turns[i - 1] + 4) % 4;
    dir[i] = d; x += DX[d]; y += DY[d]; xs[i + 1] = x; ys[i + 1] = y;
  }
  return { xs, ys, dir, N };
}

// The copies making up each arrangement, at depth n.
export function arrangement(layout, turns, n) {
  if (layout === 'four') return [0, 1, 2, 3].map(d => dragonPoints(turns, n, d));
  const A = dragonPoints(turns, n, 0);
  // heading back from A's end in the opposite direction is A turned 180° about the midpoint of its ends
  return layout === 'twin' ? [A, dragonPoints(turns, n, 2, A.xs[A.N], A.ys[A.N])] : [A];
}

// Smallest scale (px per edge) at which every lattice edge inside a W×H view centred on the origin — plus a
// one-edge margin, so a ribbon reaching in from outside is accounted for — belongs to one of `copies`. Each
// edge NOT covered has to fall outside the view on at least one axis; the scale is set by the worst such edge.
export function coverScale(copies, W, H) {
  let lim = 0;
  for (const c of copies) for (let i = 0; i <= c.N; i++) lim = Math.max(lim, Math.abs(c.xs[i]), Math.abs(c.ys[i]));
  lim += 3;
  const side = 2 * lim + 1, idx = (x, y) => (y + lim) * side + (x + lim);
  const hEdge = new Uint8Array(side * side), vEdge = new Uint8Array(side * side);
  for (const c of copies) for (let i = 0; i < c.N; i++) {
    const x0 = c.xs[i], y0 = c.ys[i], x1 = c.xs[i + 1], y1 = c.ys[i + 1];
    if (y0 === y1) hEdge[idx(Math.min(x0, x1), y0)] = 1; else vEdge[idx(x0, Math.min(y0, y1))] = 1;
  }
  let sMin = 0;
  const need = (mx, my) => { sMin = Math.max(sMin, Math.min(W / (2 * Math.max(1e-6, Math.abs(mx) - 1)), H / (2 * Math.max(1e-6, Math.abs(my) - 1)))); };
  for (let y = -lim; y < lim; y++) for (let x = -lim; x < lim; x++) {
    if (!hEdge[idx(x, y)]) need(x + .5, y);
    if (!vEdge[idx(x, y)]) need(x, y + .5);
  }
  return sMin;
}

export default function dragonCurve() {
  const { ground, fg, ink } = groundScheme();
  const W = ctx.W, H = ctx.H, S = ctx.S;
  const layout = wpick([['four', 4], ['single', 3], ['twin', 2]]);
  const style = wpick([['ribbon', 5], ['hollow', 2], ['filled', 2]]);
  const turns = foldTurns(MAXN);

  // ---- depth, scale and placement. Placement is: lattice point (ux,uy) goes to screen (px,py), rotated rotDeg,
  // s px per edge. Edges have to stay readable, and the arrangement has to fill the canvas.
  const minEdge = style === 'filled' ? 3 : style === 'hollow' ? 7 : 4.5;
  const maxEdge = Math.max(minEdge * 1.6, S / (style === 'filled' ? 110 : style === 'hollow' ? 26 : 28));
  const miss = sk => Math.abs(Math.log(sk / Math.min(maxEdge, Math.max(minEdge, sk))));   // 0 when in range
  let n, s, copies, rotDeg, px = W / 2, py = H / 2, ux = 0, uy = 0;
  if (layout === 'four') {
    // Meeting point near the middle but rarely dead centre. An off-centre origin sees further on one side, so
    // cover a canvas grown to match.
    const fx = rand(-.12, .12), fy = rand(-.12, .12);
    px += fx * W; py += fy * H;
    const cands = [];
    for (let k = 10; k <= MAXN; k++) {
      const cs = arrangement(layout, turns, k), sk = coverScale(cs, W * (1 + 2 * Math.abs(fx)), H * (1 + 2 * Math.abs(fy))) * 1.02;
      cands.push([k, sk, cs, sk >= minEdge && sk <= maxEdge ? (sk >= 9 && sk <= 22 ? 4 : 1) : 0]);
    }
    // favour a fine lace (edges ~9–22px); a bolder, shallower fold now and then. If nothing is in range (a
    // huge or tiny canvas), the fold whose covering scale comes closest.
    const ok = cands.filter(c => c[3]);
    [n, s, copies] = ok.length ? wpick(ok.map(c => [c, c[3]])) : cands.reduce((a, b) => miss(b[1]) < miss(a[1]) ? b : a);
    rotDeg = 90 * ri(0, 3);
  } else {
    // A figure rather than a field: usually the whole dragon, sometimes enlarged and cropped to its dense
    // middle. Try the eight 45° orientations at every depth, keep what puts curve into the most of the canvas.
    const zoom = layout === 'single' && Math.random() < .35;
    const crop = zoom ? rand(1.35, 1.8) : rand(.92, 1.12);
    let best = null;
    for (let k = 10; k <= MAXN; k++) {
      const cs = arrangement(layout, turns, k), step = Math.max(1, cs[0].N >> 12);
      for (let r = 0; r < 8; r++) {
        const a = r * Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a);
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, mx = 0, my = 0, cnt = 0;
        for (const c of cs) for (let i = 0; i <= c.N; i += step) {
          const u = c.xs[i] * ca - c.ys[i] * sa, v = c.xs[i] * sa + c.ys[i] * ca;
          if (u < x0) x0 = u; if (u > x1) x1 = u; if (v < y0) y0 = v; if (v > y1) y1 = v;
          mx += u; my += v; cnt++;
        }
        const sk = Math.min(W / (x1 - x0), H / (y1 - y0)) * crop;
        // whole: centre the bounding box. zoomed: centre the mass of the curve, so the crop keeps its dense core
        const cu = zoom ? mx / cnt : (x0 + x1) / 2, cv = zoom ? my / cnt : (y0 + y1) / 2;
        const cell = 40, gw = Math.ceil(W / cell), gh = Math.ceil(H / cell), hit = new Uint8Array(gw * gh);
        for (const c of cs) for (let i = 0; i <= c.N; i += step) {
          const qx = W / 2 + (c.xs[i] * ca - c.ys[i] * sa - cu) * sk, qy = H / 2 + (c.xs[i] * sa + c.ys[i] * ca - cv) * sk;
          if (qx >= 0 && qy >= 0 && qx < W && qy < H) hit[Math.floor(qy / cell) * gw + Math.floor(qx / cell)] = 1;
        }
        // A little noise for variety. An unreadable or oversized edge only wins if nothing else fits, and so does
        // a curve of more than ~70k arcs (a deep twindragon): past that the path data runs to megabytes.
        const score = hit.reduce((p, q) => p + q, 0) / hit.length + rand(0, .05) - (miss(sk) ? 2 + miss(sk) : 0) - (cs.length * 2 ** k > 7e4 ? 1 : 0);
        if (!best || score > best.score) best = { score, k, sk, r, cs, cu, cv };
      }
    }
    ({ k: n, sk: s, cs: copies } = best);
    rotDeg = best.r * 45;
    // (cu,cv) is in rotated lattice space; turn it back to find the lattice point that lands mid-canvas
    const a = best.r * Math.PI / 4;
    ux = best.cu * Math.cos(a) + best.cv * Math.sin(a); uy = -best.cu * Math.sin(a) + best.cv * Math.cos(a);
  }

  // ---- stroke, in edge lengths. Arcs from the two visits to one lattice point pass .414 apart at their
  // closest, so a ribbon has to stay under that to stay open. The filled width is past 1 because at exactly 1
  // pinholes are left where no arc sweeps over a lattice point.
  const w = style === 'ribbon' ? rand(.2, .36) : style === 'hollow' ? rand(.33, .38) : rand(1.12, 1.24);
  const innerW = w * rand(.36, .5);

  // ---- colour
  const pal = shuffle(fg);
  const distinct = (want, min) => {
    // palette colours, ink, then lightness variants of the palette — each made to read on the ground — taken
    // greedily while they stay apart from those already chosen, relaxing the separation if the palette is thin
    const cand = [...pal, ink];
    for (const c of pal) { const [, C, Hh] = hexToOklch(c); for (const L of [.25, .4, .55, .7, .85]) cand.push(oklchToHex(L, C, Hh)); }
    const ok = readable(cand, ground, .2), out = [];
    for (let m = min; out.length < want && m > .01; m *= .7) for (const c of ok) if (out.length < want && out.every(o => labDist(o, c) >= m)) out.push(c);
    while (out.length < want) out.push(out[out.length % Math.max(1, out.length)] ?? ink);
    return out;
  };
  const G = layout === 'four' ? 32 : 64;                       // reveal groups per copy — each one a sub-dragon
  const colourMode = layout === 'four' ? wpick([['copy', 5], ['copyShade', 3]])
    : style === 'filled' ? 'cycle' : wpick([['gradient', 4], ['cycle', 2], ['solid', 2]]);
  const ramp = distinct(colourMode === 'gradient' ? ri(2, 3) : colourMode === 'cycle' ? ri(2, 4) : 4, colourMode === 'gradient' ? .25 : .16);
  const block = colourMode === 'cycle' ? pick(style === 'filled' ? [1, 2, 4, 8] : [1, 2, 4]) : 1;   // sub-dragons per colour
  const colourOf = (copy, g) => {
    if (colourMode === 'solid') return ink;
    if (colourMode === 'copy') return ramp[copy];
    if (colourMode === 'copyShade') {
      // each copy in its own colour, its sub-dragons stepping in lightness so the self-similar tiling shows
      const [L, C, Hh] = hexToOklch(ramp[copy]);
      return readable([oklchToHex(Math.min(.97, Math.max(.05, L + ((g >> 1) & 1 ? .07 : -.07))), C, Hh)], ground, .2)[0];
    }
    if (colourMode === 'cycle') return ramp[Math.floor(g / block) % ramp.length];
    const t = g / (G - 1) * (ramp.length - 1), i = Math.min(ramp.length - 2, Math.floor(t));
    return readable([mix(ramp[i], ramp[i + 1], t - i)], ground, .2)[0];
  };

  // ---- geometry: one path per sub-dragon group per copy, carrying only the fine chunks that reach the canvas.
  const svg = svgRoot(), NS = 'http://www.w3.org/2000/svg';
  // Built with createElementNS, not svg.node(): these are long stroked paths, which node() would give the dash
  // draw-on that breaks on long paths — and the reveal here is per sub-dragon anyway.
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  // The lattice lives in edge units under one static transform. Only its children animate: a CSS animation on
  // the element carrying the transform would override it and collapse the drawing onto the origin.
  const root = mk('g', { transform: `translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${rotDeg}) scale(${s.toFixed(4)}) translate(${(-ux).toFixed(2)} ${(-uy).toFixed(2)})` }, svg);
  const ra = rotDeg * Math.PI / 180, ca = Math.cos(ra), sa = Math.sin(ra);
  const toScreen = (u, v) => [px + ((u - ux) * ca - (v - uy) * sa) * s, py + ((u - ux) * sa + (v - uy) * ca) * s];
  const N = 2 ** n, F = 2 ** Math.max(0, n - 10), per = N / G;
  const h = v => (v > 0 ? '.5' : v < 0 ? '-.5' : '0');
  const layers = [];                                           // [copy, group, d]
  copies.forEach((c, ci) => {
    const ds = new Array(G).fill('');
    for (let a0 = 0; a0 < N; a0 += F) {
      const b = a0 + F;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (let i = a0; i <= b; i++) { const x = c.xs[i], y = c.ys[i]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const [qx, qy] = toScreen((x0 + x1) / 2, (y0 + y1) / 2), rad = (Math.hypot(x1 - x0, y1 - y0) / 2 + 1) * s;
      if (qx + rad < 0 || qy + rad < 0 || qx - rad > W || qy - rad > H) continue;
      // A chunk runs from the midpoint of its first edge to the midpoint of the edge after its last, one arc
      // per turn. It starts a hair early so it laps the previous chunk: butt ends meeting exactly leave a seam.
      const d0 = c.dir[a0];
      let d = a0 === 0 ? `M${c.xs[0]} ${c.ys[0]}l${h(DX[d0])} ${h(DY[d0])}`
        : `M${c.xs[a0] + DX[d0] * .46} ${c.ys[a0] + DY[d0] * .46}l${DX[d0] * .04} ${DY[d0] * .04}`;
      for (let i = a0; i < b; i++) {
        if (i + 1 >= N) { d += `l${h(DX[c.dir[i]])} ${h(DY[c.dir[i]])}`; break; }
        const p = c.dir[i], q = c.dir[i + 1];
        d += `a.5 .5 0 0 ${turns[i] > 0 ? 1 : 0} ${h(DX[p] + DX[q])} ${h(DY[p] + DY[q])}`;
      }
      ds[Math.floor(a0 / per)] += d;
    }
    ds.forEach((d, g) => { if (d) layers.push([ci, g, d]); });
  });

  // Reveal in drawing order, sub-dragon by sub-dragon — the four copies grow out from their shared start together.
  const reveal = (e, g) => {
    e.style.setProperty('--t0', 'none'); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', '1');
    e.style.animation = `fin .35s ease ${(g / G * 1.2).toFixed(3)}s both`;
  };
  const common = { fill: 'none', 'stroke-linecap': 'butt', 'stroke-linejoin': 'round' };
  for (const [ci, g, d] of layers) reveal(mk('path', { ...common, d, stroke: colourOf(ci, g), 'stroke-width': w.toFixed(3) }, root), g);
  // hollow: the ground down the middle, as a second pass so it sits over every overlap of the outer strokes
  if (style === 'hollow') for (const [, g, d] of layers) reveal(mk('path', { ...common, d, stroke: ground, 'stroke-width': innerW.toFixed(3) }, root), g);
}
