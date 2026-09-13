import { ctx, rand, ri, chance, pick, shuffle, wpick, clamp, svgRoot, labDist, hexToOklch, oklchToHex, groundScheme } from '../utils.js';
// Cut-outs: cut-paper collage — flat organic silhouettes laid on a few large sheets of coloured paper.
//
// Every silhouette is a smooth CLOSED curve through a sparse, jittered control polygon (quadratic through the
// midpoints), which is what gives the scissor-cut read: long confident curves, lobes that are never quite
// symmetric, and crisp notches where a lobe meets a stem. Compound forms (fronds, coral, sprays) are a UNION of
// simple loops — stem ribbon plus finger lobes — written as subpaths of one path, all wound the same way so the
// nonzero fill merges them. The junctions come out as sharp concave corners, exactly where real scissors turn.
//
// Colour is fitted per shape: the sheets under a shape are found by sampling points inside its outline, and
// the shape takes the composition colour that clears every one of them (a shape straddling two sheets has to
// read on both). Only if none does is a colour searched for, keeping hue where it can.

const TAU = Math.PI * 2, f = v => v.toFixed(1);
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const area = pts => { let s = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; };
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
// Smooth closed curve: each control point is a quadratic control, the curve runs through the midpoints.
const closedD = pts => {
  const n = pts.length, m0 = mid(pts[n - 1], pts[0]);
  let d = `M${f(m0[0])} ${f(m0[1])}`;
  for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); d += `Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`; }
  return d + 'Z';
};
// The same curve flattened, for hit-testing what the shape sits on.
const flatten = pts => {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = mid(pts[(i - 1 + n) % n], pts[i]), c = pts[i], b = mid(pts[i], pts[(i + 1) % n]);
    for (let k = 0; k < 4; k++) { const t = k / 4, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); }
  }
  out.b = [Math.min(...out.map(q => q[0])), Math.min(...out.map(q => q[1])), Math.max(...out.map(q => q[0])), Math.max(...out.map(q => q[1]))];
  return out;
};
const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const inShape = (x, y, loops) => loops.some(l => x >= l.b[0] && x <= l.b[2] && y >= l.b[1] && y <= l.b[3] && inPoly(x, y, l));
// A little low-frequency wobble, periodic in s, so a hand-cut edge never repeats a perfect arc.
const wobbler = (amp, per = 1) => { const h = [2, 3, 5].map(k => [rand(-1, 1) * amp / k, rand(0, TAU), k]); return s => h.reduce((v, [a, p, k]) => v + a * Math.sin(k * s * TAU / per + p), 0); };

// A tapered ribbon along an axis polyline: one side out, a tip, the other side back, a base. `wl`/`wr` give the
// half-width at u in 0..1. The axis must bend gently relative to the width, or the inner side folds over itself.
function ribbon(axis, wl, wr, tipExt = 0, baseExt = 0) {
  const n = axis.length, L = [], R = [];
  const tan = i => { const a = axis[Math.max(0, i - 1)], b = axis[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  for (let i = 1; i < n - 1; i++) {
    const u = i / (n - 1), [tx, ty] = tan(i), p = axis[i];
    L.push([p[0] - ty * wl(u), p[1] + tx * wl(u)]); R.push([p[0] + ty * wr(u), p[1] - tx * wr(u)]);
  }
  const [ex, ey] = tan(n - 1), [bx, by] = tan(0), e = axis[n - 1], b = axis[0];
  return [...L, [e[0] + ex * tipExt, e[1] + ey * tipExt], ...R.reverse(), [b[0] - bx * baseExt, b[1] - by * baseExt]];
}
// Axis from p along heading a, turning by `bend` radians in total over its length.
const axisOf = (p, a, len, bend, n = 12) => { const out = [p]; let [x, y] = p; for (let i = 1; i < n; i++) { const h = a + bend * (i / (n - 1)); x += Math.cos(h) * len / (n - 1); y += Math.sin(h) * len / (n - 1); out.push([x, y]); } return out; };

/* ---- the shape vocabulary. Each returns loops in a unit frame (radius about 1), later scaled and turned. ---- */
const SHAPES = {
  // Palmate leaf / flower: rounded lobes of unequal size around a centre, with sharp scissor notches between.
  lobed() {
    const n = ri(4, 8), w = wobbler(.05), pts = [], full = chance(.5), span = full ? TAU : rand(4.2, 5.4), a0 = full ? 0 : Math.PI / 2 + (TAU - span) / 2;
    const cuts = [0]; for (let i = 1; i < n; i++) cuts.push(i + rand(-.28, .28)); cuts.push(n);
    const deep = rand(.22, .5);
    for (let i = 0; i < n; i++) {
      const A = a0 + span * cuts[i] / n, B = a0 + span * cuts[i + 1] / n, tip = rand(.72, 1), sk = rand(.35, .65), T = A + (B - A) * sk;
      if (full || i > 0) pts.push([A, deep * rand(.8, 1.2)]);
      pts.push([A + (T - A) * .35, tip * rand(.7, .85)], [T, tip * 1.08], [T + (B - T) * .65, tip * rand(.7, .85)]);
    }
    if (!full) pts.push([a0 + span, deep], [a0 + span + (TAU - span) / 2, .12], [a0, deep]);   // stalk gap
    return [pts.map(([a, r]) => { r *= 1 + w(a / TAU); return [Math.cos(a) * r, Math.sin(a) * r]; })];
  },
  // Starburst: many points of unequal length on irregular spacing.
  star() {
    const n = ri(7, 16), w = wobbler(.12), pts = [], inner = rand(.28, .45), off = rand(0, TAU);
    const ang = Array.from({ length: n }, (_, i) => off + (i + rand(-.25, .25)) * TAU / n);
    for (let i = 0; i < n; i++) {
      const a = ang[i], b = i + 1 < n ? ang[i + 1] : ang[0] + TAU, r = rand(.65, 1.05) * (1 + w(i / n)), sp = (b - a) * rand(.03, .08);
      pts.push([a - sp, r], [a + sp, r * .97], [(a + b) / 2 + rand(-.1, .1) * (b - a), inner * rand(.85, 1.15)]);
    }
    return [pts.map(([a, r]) => [Math.cos(a) * r, Math.sin(a) * r])];
  },
  // Algae frond: a bending stem with fat, round-ended finger lobes alternating up it, shrinking toward the tip.
  frond() {
    const len = 2, bend = rand(-.7, .7), stem = axisOf([0, 1], -Math.PI / 2 + rand(-.25, .25), len, bend, 16), sw = rand(.07, .11);
    const loops = [ribbon(stem, u => sw * (1 - .55 * u), u => sw * (1 - .55 * u), sw * .8, 0)];
    const m = ri(5, 9), lobeLen = rand(.75, 1.1), fat = rand(.2, .3);
    // Mitten profile: narrow where it leaves the stem, fullest past the middle, a round end rather than a point.
    const mitten = (W, c) => u => u < c ? W * (.3 + .7 * Math.sin(Math.PI / 2 * u / c)) : W * Math.sqrt(Math.max(0, 1 - ((u - c) / (1 - c)) ** 2)) + W * .02;
    let side = pick([1, -1]);
    for (let i = 0; i < m; i++) {
      const t = .06 + .86 * (i + rand(.15, .85)) / m, k = Math.floor(t * (stem.length - 1)), p = stem[k], q = stem[Math.min(stem.length - 1, k + 1)];
      const h = Math.atan2(q[1] - p[1], q[0] - p[0]), ll = lobeLen * (1 - .6 * t) * rand(.75, 1.15), a = h + side * rand(.7, 1.2);
      const W = ll * fat * rand(.8, 1.2), asym = rand(.7, 1.3), c = rand(.45, .7), prof = mitten(W, c);
      loops.push(ribbon(axisOf(p, a, ll, -side * rand(.1, .7), 10), u => prof(u) * asym, u => prof(u) / asym, W * .15, 0));
      side = chance(.85) ? -side : side;
    }
    const e = stem[stem.length - 1], pe = stem[stem.length - 2], W = lobeLen * .45 * fat, prof = mitten(W, .55);
    loops.push(ribbon(axisOf(e, Math.atan2(e[1] - pe[1], e[0] - pe[0]), lobeLen * .5, rand(-.4, .4), 10), prof, prof, W * .15, 0));
    return loops.map(l => l.map(([x, y]) => [x * .55, (y - .1) * .55]));
  },
  // Coral: a short trunk forking three or four times, the branches thinning and ending in rounded knobs. Enough
  // generations that it reads as a colony — at two forks a branching form starts to look like a figure.
  coral() {
    const loops = [], depth = wpick([[3, 3], [4, 1]]);
    const grow = (p, a, len, w, d) => {
      const ax = axisOf(p, a, len, rand(-.5, .5), 8), knob = d === 0 ? rand(.15, .5) : 0;
      const prof = u => w * (1 - .25 * u + knob * Math.max(0, (u - .6) / .4) ** 2);
      loops.push(ribbon(ax, prof, prof, prof(1) * .9, w * .4));
      if (d === 0) return;
      const e = ax[ax.length - 1], h = Math.atan2(e[1] - ax[ax.length - 2][1], e[0] - ax[ax.length - 2][0]), k = wpick([[2, 6], [3, 2]]);
      for (let i = 0; i < k; i++) grow(e, h + rand(-.15, .15) + (i / (k - 1) - .5) * rand(.9, 1.5), len * rand(.7, .9), w * .78, d - 1);
      if (chance(.4)) { const m = ax[ri(3, 5)]; grow(m, h + pick([1, -1]) * rand(.7, 1.1), len * rand(.4, .6), w * .7, 0); }   // a side bud
    };
    const s = depth === 4 ? .6 : .8;
    grow([0, 1.1 / s], -Math.PI / 2 + rand(-.2, .2), rand(.35, .5), rand(.1, .14), depth);
    return loops.map(l => l.map(([x, y]) => [x * s, y * s]));
  },
  // Spray of long pointed leaves springing from one base.
  sheaf() {
    const n = ri(3, 6), loops = [], fan = rand(1, 2.2);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / (n - 1) - .5) * fan + rand(-.12, .12), len = rand(1.3, 1.9), W = len * rand(.09, .15), pk = rand(.3, .5);
      const prof = u => W * Math.pow(Math.sin(Math.PI * Math.pow(clamp(u, .02, .98), Math.log(.5) / Math.log(pk))), .85);
      loops.push(ribbon(axisOf([0, .9], a, len, (a + Math.PI / 2) * rand(.2, .8), 12), prof, prof, W * .1, W * .1));
    }
    return loops;
  },
  // Abstract boomerang / crescent: a fat ribbon along an arc, pointed at both ends.
  crescent() {
    const span = rand(1.4, 2.8), Rc = 1, W = rand(.2, .42), a0 = -span / 2, n = 14, asym = rand(.35, .65);
    const axis = Array.from({ length: n }, (_, i) => { const a = a0 + span * i / (n - 1); return [Math.cos(a) * Rc, Math.sin(a) * Rc]; }).map(([x, y]) => [x - .6, y]);
    const w = wobbler(.12), prof = u => W * Math.pow(Math.sin(Math.PI * Math.pow(clamp(u, .02, .98), Math.log(.5) / Math.log(asym))), .75) * (1 + w(u));
    return [ribbon(axis, prof, prof, .02, .02)];
  },
  // Big irregular blob with three to five soft lobes — the free abstract form.
  blob() {
    const n = ri(3, 5), w = wobbler(.08), pts = [], ang = Array.from({ length: n }, (_, i) => (i + rand(-.2, .2)) * TAU / n);
    for (let i = 0; i < n; i++) {
      const a = ang[i], b = i + 1 < n ? ang[i + 1] : ang[0] + TAU, r = rand(.75, 1.05);
      pts.push([a - (b - a) * .12, r * .92], [a + (b - a) * .1, r], [a + (b - a) * .3, r * .88], [(a + b) / 2 + rand(-.1, .1), rand(.35, .6)], [a + (b - a) * .72, r * .7]);
    }
    return [pts.map(([a, r]) => { r *= 1 + w(a / TAU); return [Math.cos(a) * r, Math.sin(a) * r]; })];
  },
  // Small confetti: a lumpy rounded lozenge, used as filler between the big forms.
  chip() {
    const n = ri(4, 6), pts = [];
    for (let i = 0; i < n; i++) { const a = (i + rand(-.2, .2)) * TAU / n, r = rand(.7, 1); pts.push([Math.cos(a) * r, Math.sin(a) * r * rand(.5, 1)]); }
    return [pts];
  },
};

export default function cutouts() {
  const { ground, gL } = groundScheme({ minDist: .2 });
  const W = ctx.W, H = ctx.H, S = ctx.S;
  const src = [...new Set([ctx.P.accent, ...ctx.P.colors])];
  const [, gC, gH] = hexToOklch(ground);

  /* ---- the sheets. Field 0 is the painted ground; the rest are rectangles laid over it, with corners nudged
     a touch so they read as cut and pinned, not ruled. Outer edges run well past the canvas. ---- */
  const J = () => rand(-1, 1) * S * .006, out = S * .05;
  const quad = (x0, y0, x1, y1) => [[x0 + J(), y0 + J()], [x1 + J(), y0 + J()], [x1 + J(), y1 + J()], [x0 + J(), y1 + J()]];
  const ex = (v, lo, hi) => v <= lo + 1 ? lo - out : v >= hi - 1 ? hi + out : v;
  const cellQuad = (x0, y0, x1, y1) => quad(ex(x0, 0, W), ex(y0, 0, H), ex(x1, 0, W), ex(y1, 0, H));
  const layout = wpick([['single', 1.2], ['split', 2], ['checker', 2.5], ['bands', 2], ['inset', 1.5]]);
  const fieldCol = () => {                          // another sheet: a palette hue, clearly but not loudly apart
    for (let t = 0; t < 40; t++) {
      const tonal = chance(.4), [, C, Hh] = tonal ? [0, gC, gH] : hexToOklch(pick(src));
      const c = oklchToHex(clamp(gL + rand(-.35, .35), .12, .96), C * rand(.5, 1.1), Hh);
      if (labDist(c, ground) > .1 && labDist(c, ground) < .4) return c;
    }
    return oklchToHex(gL < .5 ? gL + .2 : gL - .2, gC, gH);
  };
  const fields = [{ q: [[-out, -out], [W + out, -out], [W + out, H + out], [-out, H + out]], c: ground }];
  const cellsX = n => { const w = Array.from({ length: n }, () => rand(.7, 1.3)), s = w.reduce((a, b) => a + b); let acc = 0; return [0, ...w.map(v => (acc += v) / s)]; };
  let cells = null;
  if (layout === 'split') {
    const c = fieldCol(), vert = chance(W >= H ? .7 : .3), at = rand(.35, .65), t = rand(-1, 1) * S * .02;
    fields.push({ q: vert ? quad(W * at + t, -out, W + out, H + out) : quad(-out, H * at + t, W + out, H + out), c });
    if (vert) { fields.at(-1).q[0][0] = W * at + t; fields.at(-1).q[3][0] = W * at - t; } else { fields.at(-1).q[0][1] = H * at + t; fields.at(-1).q[1][1] = H * at - t; }
  } else if (layout === 'checker') {
    const cell = S * rand(.3, .5), nx = Math.max(2, Math.round(W / cell)), ny = Math.max(2, Math.round(H / cell));
    const xs = cellsX(nx).map(v => v * W), ys = cellsX(ny).map(v => v * H), cs = [fieldCol()];
    if (chance(.35)) { const c2 = fieldCol(); if (labDist(c2, cs[0]) > .1) cs.push(c2); }
    cells = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      cells.push([(xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2, Math.min(xs[i + 1] - xs[i], ys[j + 1] - ys[j])]);
      if ((i + j) & 1) fields.push({ q: cellQuad(xs[i], ys[j], xs[i + 1], ys[j + 1]), c: cs[(i + j * 3) % cs.length] });
    }
  } else if (layout === 'bands') {
    const vert = W >= H ? chance(.75) : chance(.25), len = vert ? W : H, n = clamp(Math.round(len / (S * rand(.35, .6))), 2, 6);
    const ps = cellsX(n).map(v => v * len), cs = [fieldCol()]; for (let t = 0; t < 10 && cs.length < 2; t++) { const c = fieldCol(); if (labDist(c, cs[0]) > .1) cs.push(c); }
    const order = [ground, ...cs]; let prev = 0;
    for (let i = 1; i < n; i++) {                 // band 0 is the ground; each band differs from its neighbour
      let k; do k = ri(0, order.length - 1); while (k === prev && order.length > 1); prev = k;
      if (k === 0) continue;
      fields.push({ q: vert ? cellQuad(ps[i], 0, ps[i + 1], H) : cellQuad(0, ps[i], W, ps[i + 1]), c: order[k] });
    }
  } else if (layout === 'inset') {
    const m = () => S * rand(.05, .16), c = fieldCol();
    fields.push({ q: quad(m(), m(), W - m(), H - m()), c });
    if (chance(.5)) { const c2 = fieldCol(), x = rand(.1, .5) * W, y = rand(.1, .5) * H; if (labDist(c2, c) > .1) fields.push({ q: quad(x, y, x + rand(.25, .45) * W, y + rand(.25, .45) * H), c: c2 }); }
  }
  const fieldAt = (x, y) => { for (let i = fields.length - 1; i > 0; i--) if (inPoly(x, y, fields[i].q)) return fields[i].c; return ground; };
  const fieldCols = [...new Set(fields.map(o => o.c))];

  /* ---- composition colours: the candidates that best clear every sheet at once, so most shapes keep them. ---- */
  const cand = [];
  for (const c0 of src) { const [, C, Hh] = hexToOklch(c0); for (let L = .14; L <= .97; L += .04) cand.push(oklchToHex(L, C * rand(.9, 1.1), Hh)); }
  cand.push(oklchToHex(.96, .015, gH), oklchToHex(.16, .03, gH));
  const minTo = (c, cols) => Math.min(...cols.map(x => labDist(c, x)));
  const scored = cand.map(c => [c, minTo(c, fieldCols), hexToOklch(c)[1]]);
  const top = Math.max(...scored.map(o => o[1])), bar = Math.min(.24, top * .9);
  const nCols = wpick([[1, 2], [2, 4], [3, 3]]), comp = [];
  // Random among everything that clears the sheets, leaning toward chroma — ranking by contrast alone always
  // lands on near-white and near-black, and the form reads as a silhouette rather than as coloured paper.
  let pool = scored.filter(o => o[1] >= bar);
  while (comp.length < nCols && pool.length) {
    const c = wpick(pool.map(o => [o[0], o[1] * (o[2] + .025) ** 1.3]));
    comp.push(c); pool = pool.filter(o => labDist(o[0], c) > .18);
  }

  /* ---- placement. One or two form families per composition keeps it a series, not a sampler. ---- */
  const kinds = [['frond', 3], ['lobed', 2.5], ['star', 2], ['coral', 2], ['sheaf', 2], ['crescent', 1], ['blob', 1.5]];
  const fam = []; const nf = ri(2, 3); while (fam.length < nf) { const k = wpick(kinds); if (!fam.includes(k)) fam.push(k); }
  const mode = cells && chance(.6) ? 'panels' : wpick([['scatter', 3], ['hero', 2]]);
  const placed = [];
  const tryPlace = (x, y, r, kind, strict = .85) => {
    if (placed.some(p => Math.hypot(p.x - x, p.y - y) < (p.r + r) * strict)) return false;
    placed.push({ x, y, r, kind }); return true;
  };
  if (mode === 'panels') {
    for (const [x, y, s] of shuffle(cells)) if (chance(.9)) tryPlace(x + rand(-.1, .1) * s, y + rand(-.1, .1) * s, s * rand(.36, .5), pick(fam), .6);
  } else if (mode === 'hero') {
    const n = ri(1, 3);
    for (let t = 0; t < 60 && placed.length < n; t++) tryPlace(rand(.2, .8) * W, rand(.2, .8) * H, S * rand(.28, .45) * (n === 1 ? 1.3 : 1), pick(fam.filter(k => ['frond', 'coral', 'lobed', 'sheaf'].includes(k)).concat('frond')), .8);
    const small = Math.round(W * H / (S * S) * rand(5, 14)), filler = pick([['chip'], ['star'], ['chip', 'star']]);
    for (let t = 0, k = placed.length + small; t < 400 && placed.length < k; t++) tryPlace(rand(-.03, 1.03) * W, rand(-.03, 1.03) * H, S * rand(.03, .08), pick(filler), 1.3);
  } else {
    const cell = S * rand(.2, .32), n = Math.round(W * H / (cell * cell));
    for (let t = 0; t < n * 30 && placed.length < n; t++) tryPlace(rand(-.02, 1.02) * W, rand(-.02, 1.02) * H, cell * rand(.3, .6), pick(fam));
    if (chance(.6)) for (let t = 0; t < 200; t++) tryPlace(rand(0, 1) * W, rand(0, 1) * H, S * rand(.02, .045), 'chip', 1.2);
  }

  /* ---- build, colour and draw each shape ---- */
  const svg = svgRoot(), NS = 'http://www.w3.org/2000/svg';
  const mk = (d, fill, delay, t0) => {
    const e = document.createElementNS(NS, 'path');
    e.setAttribute('d', d); e.setAttribute('fill', fill);
    e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center';
    e.style.setProperty('--t0', t0); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', '1');
    e.style.animation = `fin .55s cubic-bezier(.2,.7,.25,1) ${delay.toFixed(2)}s both`;
    svg.appendChild(e); return e;
  };
  fields.slice(1).forEach((o, i) => { const d = 'M' + o.q.map(p => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z'; const e = mk(d, o.c, i * .04, 'none'); e.dataset.field = '1'; });
  const drawn = [], order = shuffle(placed).sort((a, b) => (a.kind === 'chip') - (b.kind === 'chip'));
  order.forEach((p, idx) => {
    const a = rand(0, TAU) * (p.kind === 'frond' || p.kind === 'coral' || p.kind === 'sheaf' ? rand(0, .35) : 1) * (chance(.5) ? 1 : -1);
    const flip = chance(.5) ? -1 : 1, sc = p.r;
    const raw = SHAPES[p.kind](), all = raw.flat();
    // Recentre on the bounding box and scale its longer half-side to 1, so every kind honours its placement radius.
    const bx = [Math.min(...all.map(q => q[0])), Math.max(...all.map(q => q[0]))], by = [Math.min(...all.map(q => q[1])), Math.max(...all.map(q => q[1]))];
    const cx = (bx[0] + bx[1]) / 2, cy = (by[0] + by[1]) / 2, k = 2 / Math.max(bx[1] - bx[0], by[1] - by[0]);
    const loops = raw.map(l => l.map(([x, y]) => { const [u, v] = rot([(x - cx) * k * flip, (y - cy) * k], a); return [p.x + u * sc, p.y + v * sc]; }))
      .map(l => area(l) < 0 ? l.reverse() : l);             // one winding for every loop, so the union fills solid
    const flat = loops.map(flatten);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const l of flat) for (const [x, y] of l) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    // What the shape actually sits on: sample inside its outline, take the sheet (or earlier shape) under each.
    const under = new Map(), st = Math.max(2, Math.max(x1 - x0, y1 - y0) / 22);
    const pts = flat.flatMap(l => l.filter((_, i) => i % 2 === 0));      // the outline too: thin tips can fall between grid samples
    for (let y = Math.max(0, y0); y <= Math.min(H, y1); y += st) for (let x = Math.max(0, x0); x <= Math.min(W, x1); x += st) if (inShape(x, y, flat)) pts.push([x, y]);
    for (const [x, y] of pts) {
      if (x < 0 || y < 0 || x > W || y > H) continue;
      const top = drawn.findLast(q => x >= q.b[0] && x <= q.b[2] && y >= q.b[1] && y <= q.b[3] && inShape(x, y, q.flat));
      // Paper on paper needs a wider gap than paper on a sheet: two cut forms of near colour fuse into one blob.
      if (top) under.set(top.c, .32); else if (!under.has(fieldAt(x, y))) under.set(fieldAt(x, y), .22);
    }
    // …and the reverse: the tip of an earlier form poking under this one can slip between both sample sets.
    for (const q of drawn) if (!under.has(q.c) && q.b[0] < x1 && q.b[2] > x0 && q.b[1] < y1 && q.b[3] > y0 && q.flat.some(l => l.some(([x, y]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && inShape(x, y, flat)))) under.set(q.c, .32);
    if (!under.size) return;
    const surf = [...under], margin = o => Math.min(...surf.map(([x, t]) => labDist(o, x) - t));
    let c = shuffle(comp).find(o => margin(o) >= 0);
    if (!c) {                                     // nothing in the set clears these sheets: the nearest candidate that does
      const ok = cand.filter(o => margin(o) >= 0), ref = pick(comp);
      c = ok.length ? ok.reduce((b, o) => labDist(o, ref) < labDist(b, ref) ? o : b) : cand.reduce((b, o) => margin(o) > margin(b) ? o : b);
    }
    drawn.push({ b: [x0, y0, x1, y1], flat, c });
    const t0 = `scale(${rand(.86, .94).toFixed(2)}) rotate(${rand(-6, 6).toFixed(1)}deg)`;
    const e = mk(loops.map(closedD).join(''), c, .2 + .75 * idx / Math.max(1, order.length), t0);
    e.dataset.shape = p.kind;
  });
}
