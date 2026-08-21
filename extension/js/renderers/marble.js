import { ctx, ri, rand, chance, pick, shuffle, svgRoot, mix, lum } from '../utils.js';
// Marble: breccia — stone that fractured and healed, so the veining is cut and DISPLACED at every seam.
//
// That displacement is the whole thing. The vein network is defined ONCE, then each fragment clips it to a
// crack polygon and rotates the copy inside that clip a degree or two about the fragment's own centre. The
// outline stays put while the veins inside jog, so every seam breaks the pattern. Blurred blobs — what this
// used to draw — read as lens bokeh, which bokeh.js, plasma.js and aurora.js already cover; marble reads
// because of sharp discontinuity, not softness.
//
// Only the veins go in the reusable group. The body and its cloudiness are painted once underneath: they'd
// look near-identical displaced, and every blurred shape inside the group would otherwise be re-rasterised
// once per fragment.
const NS = 'http://www.w3.org/2000/svg';
const area = p => Math.abs(p.reduce((s, [x, y], i) => { const q = p[(i + 1) % p.length]; return s + (x * q[1] - q[0] * y); }, 0)) / 2;

// Cut a polygon in two along a jagged line between points on two near-opposite edges.
function splitPoly(poly) {
  const m = poly.length;
  let i = ri(0, m - 1), j = (i + Math.floor(m / 2) + ri(-1, 1) + m) % m;
  if (j === i) j = (i + 1) % m;
  if (i > j) [i, j] = [j, i];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const A = lerp(poly[i], poly[(i + 1) % m], rand(.25, .75));
  const B = lerp(poly[j], poly[(j + 1) % m], rand(.25, .75));
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L, amp = L * rand(.03, .09), n = ri(3, 7);
  const cut = [];
  for (let k = 1; k < n; k++) {
    const t = k / n, w = amp * Math.sin(Math.PI * t) * rand(-1, 1);
    cut.push([A[0] + dx * t + nx * w, A[1] + dy * t + ny * w]);
  }
  return [[A, ...poly.slice(i + 1, j + 1), B, ...cut.slice().reverse()],
    [B, ...poly.slice(j + 1), ...poly.slice(0, i + 1), A, ...cut]];
}

export default function marble() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const svg = svgRoot(), uid = 'mb' + ((Math.random() * 1e9) | 0).toString(36);
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  const defs = mk('defs', {}, svg);
  const body = mix(ctx.P.bg, cs[0], rand(.05, .18));                  // the stone itself, barely tinted
  const pale = lum(body) > .5;
  const veinOf = i => mix(cs[(i + 1) % cs.length], pale ? ctx.P.ink : '#ffffff', rand(.1, .4));
  const ov = ctx.S * .2;                                              // overhang, so rotated copies never expose an edge

  // ---- body + cloudiness, painted once, never displaced ----
  mk('rect', { x: -ov, y: -ov, width: ctx.W + 2 * ov, height: ctx.H + 2 * ov, fill: body }, svg);
  for (let i = 0, n = ri(3, 6); i < n; i++) {
    const d = ctx.S * rand(.45, 1);
    mk('ellipse', {
      cx: rand(-.1, 1.1) * ctx.W, cy: rand(-.1, 1.1) * ctx.H, rx: d, ry: d * rand(.5, 1),
      fill: mix(body, cs[i % cs.length], rand(.1, .26)), opacity: rand(.4, .75),
      style: `filter:blur(${(ctx.S * rand(.07, .13)).toFixed(1)}px)`,
    }, svg);
  }

  // ---- the vein network, defined once and re-used by every fragment ----
  const net = mk('g', { id: uid }, defs);
  const bed = rand(0, Math.PI);                                       // bedding direction: veins run roughly parallel
  let budget = 0;
  const drawVein = (x, y, a, w0, steps, depth, col) => {
    if (budget-- <= 0 || steps < 4) return;
    const seg = ctx.S * rand(.03, .07), P = [], Wd = [], home = a, peak = rand(.25, .75);
    for (let k = 0; k <= steps; k++) {
      // Taper peaks somewhere along the vein rather than always dead centre, so they don't all bulge alike.
      const u = k / steps, sw = u < peak ? u / peak : (1 - u) / (1 - peak);
      P.push([x, y]); Wd.push(w0 * (.25 + .75 * Math.sin(Math.PI * .5 * Math.max(0, sw))) * rand(.7, 1.3));
      x += Math.cos(a) * seg; y += Math.sin(a) * seg;
      // Wander, but pulled back toward the direction it set out in. A pure random walk curls into loops and
      // scribbles; real veining undulates while still running with the bedding.
      a += rand(-.3, .3) + (home - a) * .08;
    }
    // Offset the centreline both ways by the local half-width for a tapered ribbon — a stroked path can only
    // be one constant width, and uniform-width veins are what make fake marble look drawn.
    const L = [], R = [];
    for (let k = 0; k < P.length; k++) {
      const p0 = P[Math.max(0, k - 1)], p1 = P[Math.min(P.length - 1, k + 1)];
      const ux = p1[0] - p0[0], uy = p1[1] - p0[1], um = Math.hypot(ux, uy) || 1;
      const ox = -uy / um * Wd[k], oy = ux / um * Wd[k];
      L.push([P[k][0] + ox, P[k][1] + oy]); R.push([P[k][0] - ox, P[k][1] - oy]);
    }
    const pt = arr => arr.map(q => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
    if (depth === 0) {
      // A wider, fainter copy behind for a soft shoulder. Scaling the offsets rather than blurring: a filter
      // here would be re-rasterised once per fragment.
      const g = 2.6;
      const HL = P.map((p, k) => [p[0] + (L[k][0] - p[0]) * g, p[1] + (L[k][1] - p[1]) * g]);
      const HR = P.map((p, k) => [p[0] + (R[k][0] - p[0]) * g, p[1] + (R[k][1] - p[1]) * g]);
      mk('polygon', { points: pt([...HL, ...HR.reverse()]), fill: col, opacity: .14 }, net);
    }
    mk('polygon', { points: pt([...L, ...R.reverse()]), fill: col, opacity: depth ? rand(.35, .65) : rand(.72, .92) }, net);
    if (depth < 2) for (let b = 0, nb = ri(1, 3); b < nb; b++) {
      const k = ri(2, Math.max(3, steps - 2)), q0 = P[Math.max(0, k - 1)], q1 = P[Math.min(P.length - 1, k + 1)];
      drawVein(P[k][0], P[k][1], Math.atan2(q1[1] - q0[1], q1[0] - q0[0]) + rand(.25, .95) * pick([1, -1]),
        w0 * rand(.35, .6), Math.round(steps * rand(.35, .65)), depth + 1, col);
    }
  };
  // Roots on a jittered grid, each with its OWN branch budget. One shared budget gets eaten by the first few
  // subtrees and the rest of the slab comes out bare.
  const c1 = veinOf(0), c2 = chance(.6) ? veinOf(1) : c1;             // marble often carries two vein colours
  const roots = ri(13, 20), gc = Math.ceil(Math.sqrt(roots)), gr = Math.ceil(roots / gc);
  for (let v = 0; v < roots; v++) {
    budget = ri(4, 8);
    // A quarter of the roots run across the bedding. All of them parallel and the field reads as blades of
    // grass rather than stone.
    const dir = bed + rand(-.85, .85) + (chance(.25) ? Math.PI / 2 : 0);
    drawVein(((v % gc) + rand(-.3, 1.3)) / gc * ctx.W, (Math.floor(v / gc) + rand(-.3, 1.3)) / gr * ctx.H,
      dir, ctx.S * rand(.003, .014), ri(18, 34), 0, chance(.72) ? c1 : c2);
  }

  // ---- fracture the canvas, then clip a rotated copy of the network into each piece ----
  let polys = [[[0, 0], [ctx.W, 0], [ctx.W, ctx.H], [0, ctx.H]]];
  const frags = ri(4, 8);
  while (polys.length < frags) {
    polys.sort((a, b) => area(b) - area(a));
    const [one, two] = splitPoly(polys.shift());
    polys.push(one, two);
  }
  const seam = mix(c1, ctx.P.ink, .35);
  polys.forEach((p, i) => {
    const pts = p.map(q => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
    const cx = p.reduce((s, q) => s + q[0], 0) / p.length, cy = p.reduce((s, q) => s + q[1], 0) / p.length;
    const cp = mk('clipPath', { id: `${uid}c${i}`, clipPathUnits: 'userSpaceOnUse' }, defs);
    mk('polygon', { points: pts }, cp);
    const g = mk('g', { 'clip-path': `url(#${uid}c${i})` }, svg);
    // Small rotation about the fragment's own centre: enough to break every vein crossing the seam, not so
    // much that the piece reads as a separate object.
    mk('use', {
      href: `#${uid}`,
      transform: `rotate(${rand(-2.6, 2.6).toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)}) translate(${(rand(-1, 1) * ctx.S * .012).toFixed(1)} ${(rand(-1, 1) * ctx.S * .012).toFixed(1)})`,
    }, g);
    if (chance(.8)) mk('polygon', { points: pts, fill: 'none', stroke: seam, 'stroke-width': Math.max(.6, ctx.S * rand(.0007, .0018)), opacity: rand(.2, .5) }, svg);
    // <use> and <g> aren't shapes svgRoot animates, so drive the reveal here: fragments settle in one by one.
    g.style.setProperty('--t0', 'none'); g.style.setProperty('--t1', 'none'); g.style.setProperty('--op', '1');
    g.style.animation = `fin .5s ease ${(i * rand(.05, .11)).toFixed(3)}s both`;
  });
}
