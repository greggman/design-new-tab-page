import { ctx, rand, ri, chance, pick, shuffle, wpick, svgRoot, readable, mix, hexToOklch, oklchToHex, groundScheme } from '../utils.js';
// Ice-ray lattice (bīngliè, "cracked ice"): the Chinese window lattice whose bars run at irregular angles, like
// ice breaking up on a pond. Built the way the joiner lays it out: start with the whole window opening and keep
// splitting the largest remaining pane with one straight bar right across it, through a point near its middle at
// a random angle, until every pane is small. Each bar therefore runs from one existing bar to another and every
// joint is a T — the look of the real thing, where no two bars ever cross.
//
// Splitting a convex polygon with a line always leaves two convex polygons, so the panes stay convex and tile the
// opening exactly. What makes it read as ice rather than a random shatter is what gets rejected: a cut that
// leaves a corner sharper than ~30°, a pane far below the target size, or a joint landing right next to an
// existing one (two T's meeting across a bar read as a clumsy cross).

const NS = 'http://www.w3.org/2000/svg';
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
export const area = pts => { let s = 0; for (let i = 0; i < pts.length; i++) s += cross(pts[i], pts[(i + 1) % pts.length]); return Math.abs(s) / 2; };
const centroid = pts => { const n = pts.length; return [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n]; };
export const minAngle = pts => {
  let m = 180;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[(i + pts.length - 1) % pts.length], v = pts[i], q = pts[(i + 1) % pts.length];
    const a = [p[0] - v[0], p[1] - v[1]], b = [q[0] - v[0], q[1] - v[1]];
    m = Math.min(m, Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b))))) * 180 / Math.PI);
  }
  return m;
};
// 2A / (P·√A): ~.5 for a square, .44 for an equilateral triangle, falling toward 0 as a pane stretches into a strip.
export const compact = pts => { let P = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; P += Math.hypot(b[0] - a[0], b[1] - a[1]); } const A = area(pts); return 2 * A / (P * Math.sqrt(A)); };

// Split convex `pts` by the line through p with direction d. Returns [A, B, endpoint1, endpoint2] or null.
function split(pts, p, d) {
  const n = pts.length, s = pts.map(v => cross(d, [v[0] - p[0], v[1] - p[1]]));
  const hits = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    if ((s[i] < 0) !== (s[j] < 0)) {
      const t = s[i] / (s[i] - s[j]);
      hits.push([i, [pts[i][0] + (pts[j][0] - pts[i][0]) * t, pts[i][1] + (pts[j][1] - pts[i][1]) * t]]);
    }
  }
  if (hits.length !== 2) return null;
  const [[i, P], [j, Q]] = hits, A = [P], B = [Q];
  for (let k = i + 1; k <= j; k++) A.push(pts[k]);
  A.push(Q);
  for (let k = j + 1; k <= i + n; k++) B.push(pts[k % n]);
  B.push(P);
  return [A, B, P, Q];
}

// Crack a convex opening. `sizeAt(x, y)` gives the target pane area there. Returns the panes and the bars, each
// bar tagged with the order it was laid so the reveal can crack the ice in the same order.
export function crack(opening, { sizeAt, minAng = 38, gap }) {
  const panes = [{ pts: opening, limit: sizeAt(...centroid(opening)) * rand(.7, 1.3) }];
  const joints = opening.map(v => v.slice()), bars = [];
  for (let guard = 0; guard < 4000; guard++) {
    let best = null;
    for (const q of panes) if (!q.done && area(q.pts) > q.limit && (!best || area(q.pts) / q.limit > area(best.pts) / best.limit)) best = q;
    if (!best) break;
    let ok = false;
    const A0 = area(best.pts), c = centroid(best.pts);
    // Cut roughly across the pane's long axis (from the vertex covariance), so the halves come out chunky —
    // quads and pentagons like the real lattice — instead of the long shards a free angle keeps producing.
    let sxx = 0, syy = 0, sxy = 0;
    for (const v of best.pts) { const dx = v[0] - c[0], dy = v[1] - c[1]; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
    const across = .5 * Math.atan2(2 * sxy, sxx - syy) + Math.PI / 2;
    for (let tries = 0; tries < 50 && !ok; tries++) {
      const v = pick(best.pts), k = rand(0, .35);
      const p = [c[0] + (v[0] - c[0]) * k, c[1] + (v[1] - c[1]) * k], th = across + rand(-1, 1) * (tries < 25 ? .8 : 1.4);
      const r = split(best.pts, p, [Math.cos(th), Math.sin(th)]);
      if (!r) continue;
      const [A, B, P, Q] = r, a = area(A), b = area(B);
      // no pane much below the size it's aiming at, no sliver corners, no joint crowding another
      if (Math.min(a, b) < Math.min(best.limit * .22, A0 * .3) || minAngle(A) < minAng || minAngle(B) < minAng || compact(A) < .32 || compact(B) < .32) continue;
      if (joints.some(j => Math.hypot(j[0] - P[0], j[1] - P[1]) < gap || Math.hypot(j[0] - Q[0], j[1] - Q[1]) < gap)) continue;
      panes.splice(panes.indexOf(best), 1,
        { pts: A, limit: sizeAt(...centroid(A)) * rand(.7, 1.3) }, { pts: B, limit: sizeAt(...centroid(B)) * rand(.7, 1.3) });
      joints.push(P, Q); bars.push([P, Q]); ok = true;
    }
    if (!ok) best.done = true;
  }
  return { panes: panes.map(q => q.pts), bars };
}

export default function iceRay() {
  const { ground, fg, ink, gL } = groundScheme();
  const W = ctx.W, H = ctx.H, S = ctx.S;
  const cell = S / rand(4.5, 10);                         // typical pane diameter
  const w = Math.max(2.5, cell * rand(.06, .12));         // bar width
  const f = v => v.toFixed(1);

  // ---- openings: the whole field, or a window of framed panels divided by heavier mullions
  const layout = wpick([['field', 4], ['window', 5]]);
  const openings = [];
  let frameD = '', beadD = '', F = 0;
  if (layout === 'field') {
    const m = cell;
    openings.push([[-m, -m], [W + m, -m], [W + m, H + m], [-m, H + m]]);
  } else {
    F = Math.max(w * 2.2, S * rand(.025, .05));
    const P = S * rand(.55, 1.2), cols = Math.max(1, Math.round(W / P)), rows = Math.max(1, Math.round(H / P));
    const pw = (W - F * (cols + 1)) / cols, ph = (H - F * (rows + 1)) / rows;
    frameD = `M0 0H${f(W)}V${f(H)}H0Z`;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = F + c * (pw + F), y = F + r * (ph + F);
      openings.push([[x, y], [x + pw, y], [x + pw, y + ph], [x, y + ph]]);
      frameD += `M${f(x)} ${f(y)}V${f(y + ph)}H${f(x + pw)}V${f(y)}Z`;     // opposite winding: a hole
      beadD += `M${f(x - F / 2)} ${f(y - F / 2)}h${f(pw + F)}v${f(ph + F)}h${f(-pw - F)}Z`;   // down the middle of each mullion
    }
  }
  // Density drifts across the canvas now and then, as real ice crazes finer toward one side.
  const drift = chance(.45) ? [rand(-1, 1), rand(-1, 1)] : [0, 0], dn = Math.hypot(...drift) || 1;
  const sizeAt = (x, y) => cell * cell * 1.3 * Math.pow(2.4, ((x / W - .5) * drift[0] + (y / H - .5) * drift[1]) / dn * (drift[0] || drift[1] ? 1 : 0));
  const gap = Math.max(w * 2.4, cell * .14);

  // ---- decorative inset: a round, square or octagonal pane set into the lattice, its own finer ice inside
  const insets = [];
  if (chance(.4)) {
    const kind = pick(['circle', 'circle', 'square', 'octagon']), diamond = chance(.5);
    const targets = layout === 'field' ? [[W / 2, H / 2, Math.max(S * rand(.14, .24), cell * rand(.9, 1.2))]] : openings.map(o => {
      const x0 = o[0][0], y0 = o[0][1], x1 = o[2][0], y1 = o[2][1];
      return [(x0 + x1) / 2, (y0 + y1) / 2, Math.min(x1 - x0, y1 - y0) * rand(.2, .3)];
    });
    for (const [x, y, r] of targets) {
      let d;
      if (kind === 'circle') d = `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
      else {
        const n = kind === 'square' ? 4 : 8, rr = kind === 'square' ? r * 1.15 : r / Math.cos(Math.PI / 8), rot = kind === 'square' && diamond ? Math.PI / 4 : 0;
        d = 'M' + Array.from({ length: n }, (_, i) => { const t = (i + .5) * 2 * Math.PI / n + rot; return `${f(x + rr * Math.cos(t))} ${f(y + rr * Math.sin(t))}`; }).join('L') + 'Z';
      }
      insets.push({ x, y, r, d, fine: chance(.6) });
    }
  }

  // ---- crack every opening
  const panes = [], bars = [];
  for (const o of openings) {
    const r = crack(o, { sizeAt, gap });
    panes.push(...r.panes);
    r.bars.forEach((b, i) => bars.push([b, i / Math.max(1, r.bars.length)]));
  }
  for (const ins of insets) if (ins.fine) {
    const r = ins.r * 1.2, sq = [[ins.x - r, ins.y - r], [ins.x + r, ins.y - r], [ins.x + r, ins.y + r], [ins.x - r, ins.y + r]];
    // its own ice at a finer grain: a dozen or two panes whatever the size of the inset
    const c = crack(sq, { sizeAt: () => ins.r * ins.r * Math.PI / rand(12, 22), gap: Math.max(w * 1.8, ins.r * .09) });
    ins.bars = c.bars; ins.panes = c.panes;
  }

  // ---- colours. The bars are the wood: ink far from the ground in lightness, or a palette colour pushed there.
  let bar = ink;
  if (chance(.35)) { const [, C, Hh] = hexToOklch(pick(fg)); const c = oklchToHex(gL < .5 ? rand(.82, .94) : rand(.14, .28), C * .8, Hh); if (Math.abs(hexToOklch(c)[0] - gL) > .4) bar = c; }
  // Some panes glazed or papered in colour; each must stand off the ground it replaces and the bars around it.
  const glaze = wpick([[0, 4], [rand(.05, .16), 4], [rand(.25, .45), 1]]);
  const tints = readable(shuffle(fg).map(c => mix(c, ground, rand(0, .45))), ground, .12).map(c => readable([c], bar, .2)[0]).filter(Boolean);
  // A moulding line down the middle of the heavy frame. Only there: on the thin lattice bars it breaks up at
  // every T joint and reads as a doubled line rather than a moulding.
  const bead = frameD && chance(.45) ? readable([mix(bar, ground, .5)], bar, .16)[0] : null;

  // ---- draw
  const svg = svgRoot();
  const mk = (tag, attrs, delay, parent = svg) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (delay != null) { e.style.setProperty('--t0', 'none'); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', '1'); e.style.animation = `fin .45s ease ${delay.toFixed(2)}s both`; }
    parent.appendChild(e);
    return e;
  };
  const poly = pts => 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z';
  let g = svg;
  if (insets.length) {
    // The lattice stops at each inset's rim: clip it out with an even-odd hole, and the rim bar covers the cut.
    const id = 'ir' + Math.floor(Math.random() * 1e9).toString(36);
    const clip = mk('clipPath', { id }, null, mk('defs', {}, null));
    mk('path', { d: `M-9 -9H${W + 9}V${H + 9}H-9Z` + insets.map(i => i.d).join(''), 'clip-rule': 'evenodd' }, null, clip);
    g = mk('g', { 'clip-path': `url(#${id})` }, null);
  }
  const NB = 12;
  const drawLattice = (panesL, barsL, parent, t0, width = w) => {
    if (glaze && tints.length) {
      const byCol = tints.map(() => '');
      for (const q of panesL) if (chance(glaze)) byCol[ri(0, tints.length - 1)] += poly(q);
      byCol.forEach((d, k) => d && mk('path', { d, fill: tints[k] }, t0 + .55, parent));
    }
    const buckets = Array.from({ length: NB }, () => '');
    for (const [[P, Q], t] of barsL) buckets[Math.min(NB - 1, Math.floor(t * NB))] += `M${f(P[0])} ${f(P[1])}L${f(Q[0])} ${f(Q[1])}`;
    buckets.forEach((d, k) => {
      if (!d) return;
      // Round caps: a bar ends on the centreline of the bar it joins, and a cap of radius w/2 there stays
      // entirely inside that bar at any angle — a butt or square end would poke out past it on the acute side.
      mk('path', { d, fill: 'none', stroke: bar, 'stroke-width': f(width), 'stroke-linecap': 'round' }, t0 + k * .06, parent);
    });
  };
  drawLattice(panes, bars, g, .1);
  for (const ins of insets) {
    if (ins.fine) {
      const id = 'ii' + Math.floor(Math.random() * 1e9).toString(36);
      mk('path', { d: ins.d }, null, mk('clipPath', { id }, null, mk('defs', {}, null)));
      drawLattice(ins.panes, ins.bars.map((b, i) => [b, i / ins.bars.length]), mk('g', { 'clip-path': `url(#${id})` }, null), .4, w * .7);
    } else if (tints.length && chance(.5)) mk('path', { d: ins.d, fill: tints[0] }, .6);
    mk('path', { d: ins.d, fill: 'none', stroke: bar, 'stroke-width': f(Math.min(w * rand(1.4, 1.9), w + 8)), 'stroke-linejoin': 'miter' }, .5);
  }
  if (frameD) {
    mk('path', { d: frameD, fill: bar, 'fill-rule': 'evenodd' }, 0);
    if (bead) mk('path', { d: beadD, fill: 'none', stroke: bead, 'stroke-width': f(Math.max(1.2, F * .12)) }, .05);
  }
}
