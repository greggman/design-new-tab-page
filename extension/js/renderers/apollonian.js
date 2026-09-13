import { ctx, rand, pick, chance, shuffle, wpick, svgRoot, groundScheme, readable } from '../utils.js';
// Apollonian gasket: start from mutually tangent circles and keep filling every curvilinear triangular gap with
// the one circle tangent to all three sides of it, down to a minimum radius.
//
// Each circle is carried as (k, w): signed curvature and curvature × centre as a complex number (a bounding circle
// that encloses the others has negative k; a straight line has k = 0 and w = its unit normal, pointing away from
// the circles it touches). Descartes' theorem gives k₄ = k₁+k₂+k₃ ± 2√(k₁k₂+k₂k₃+k₃k₁), and the same form in w
// gives the centre — but only the starting circle needs those roots (the branch picked by measuring which one is
// actually tangent). Every gap after that is bounded by three circles that already have one tangent circle on the
// far side, and the two Descartes solutions are roots of one quadratic, so the new circle is simply the other
// root: k' = 2(k₁+k₂+k₃) − k_opp, w' = 2(w₁+w₂+w₃) − w_opp. No square roots, no branch to get wrong.
//
// Compositions: a whole gasket centred; a bounding circle much larger than the canvas and off-centre, so the view
// is a cropped section across many scales; or stacked strip gaskets (the gasket between two parallel lines)
// filling the canvas at an angle. Gaps whose three tangency points lie entirely off-canvas aren't descended into.

const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
const fade = (e, delay, dur = .5) => {
  e.style.setProperty('--t0', 'none'); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', '1');
  e.style.animation = `fin ${dur}s ease ${delay.toFixed(3)}s both`;
};

// circles: { k, wx, wy, r, x, y, depth, par } — par are the three circles of the gap it filled (for testing)
const circ = (k, x, y) => ({ k, wx: k * x, wy: k * y, r: 1 / Math.abs(k), x, y, depth: 0, par: null });
const line = (nx, ny) => ({ k: 0, wx: nx, wy: ny, r: Infinity, x: NaN, y: NaN, depth: 0, par: null });
// tangency point of two tangent generalised circles: (w₁ + w₂)/(k₁ + k₂)
const touch = (a, b) => { const s = a.k + b.k; return [(a.wx + b.wx) / s, (a.wy + b.wy) / s]; };

// Fill the gap (a, b, c), whose already-known tangent circle on the other side is `opp`.
// box = [x0,y0,x1,y1] cull rectangle. Returns the new circles, or null once `cap` is hit (caller raises rmin).
export function fillGaps(seeds, box, rmin, cap) {
  const out = [];
  const stack = seeds.slice();
  while (stack.length) {
    const [a, b, c, opp, depth] = stack.pop();
    const k = 2 * (a.k + b.k + c.k) - opp.k;
    if (k <= 0 || 1 / k < rmin) continue;
    // Everything this gap will ever hold lies inside it, and the gap lies inside the box of its three tangency
    // points — widened by the chord for a gap walled by the (outward-bulging) enclosing circle.
    const p = [touch(a, b), touch(b, c), touch(a, c)];
    let x0 = Math.min(p[0][0], p[1][0], p[2][0]), x1 = Math.max(p[0][0], p[1][0], p[2][0]);
    let y0 = Math.min(p[0][1], p[1][1], p[2][1]), y1 = Math.max(p[0][1], p[1][1], p[2][1]);
    if (a.k < 0 || b.k < 0 || c.k < 0) { const e = Math.max(x1 - x0, y1 - y0); x0 -= e; x1 += e; y0 -= e; y1 += e; }
    if (x1 < box[0] || x0 > box[2] || y1 < box[1] || y0 > box[3]) continue;
    const wx = 2 * (a.wx + b.wx + c.wx) - opp.wx, wy = 2 * (a.wy + b.wy + c.wy) - opp.wy;
    const n = { k, wx, wy, r: 1 / k, x: wx / k, y: wy / k, depth: depth + 1, par: [a, b, c] };
    out.push(n);
    if (out.length >= cap) return null;
    stack.push([a, b, n, c, depth + 1], [a, c, n, b, depth + 1], [b, c, n, a, depth + 1]);
  }
  return out;
}

// A gasket inside a bounding circle (cx, cy, R): an inner circle A of radius aR touching it at angle θ, a circle B
// touching both, and the two circles tangent to all three (one each side of A–B) from Descartes.
export function boundedSeeds(cx, cy, R, a, b, theta, side) {
  const O = circ(-1 / R, cx, cy);
  const r1 = R * a, A = circ(1 / r1, cx + (R - r1) * Math.cos(theta), cy + (R - r1) * Math.sin(theta));
  // B: centre at R − r2 from O and r1 + r2 from A
  const r2 = (R - r1) * b, d = R - r1, d1 = R - r2, d2 = r1 + r2;
  const along = (d * d + d1 * d1 - d2 * d2) / (2 * d), perp = Math.sqrt(Math.max(0, d1 * d1 - along * along)) * side;
  const ux = Math.cos(theta), uy = Math.sin(theta);
  const B = circ(1 / r2, cx + ux * along - uy * perp, cy + uy * along + ux * perp);
  // C: Descartes, both w roots tried, kept by measured tangency to O, A and B
  const s = O.k + A.k + B.k, kC = s + 2 * Math.sqrt(Math.max(0, O.k * A.k + A.k * B.k + B.k * O.k));
  const mul = (p, q) => [p.wx * q.wx - p.wy * q.wy, p.wx * q.wy + p.wy * q.wx];
  const [qx, qy] = [O, A, B].reduce((acc, _, i, arr) => { const m = mul(arr[i], arr[(i + 1) % 3]); return [acc[0] + m[0], acc[1] + m[1]]; }, [0, 0]);
  const mod = Math.hypot(qx, qy), sr = Math.sqrt((mod + qx) / 2), si = Math.sign(qy || 1) * Math.sqrt(Math.max(0, (mod - qx) / 2));
  const err = c => [[O, -1], [A, 1], [B, 1]].reduce((m, [p, sg]) => m + Math.abs(Math.hypot(c.x - p.x, c.y - p.y) - Math.abs(p.r + sg * c.r)), 0);
  const C = [1, -1].map(sg => { const wx = O.wx + A.wx + B.wx + sg * 2 * sr, wy = O.wy + A.wy + B.wy + sg * 2 * si; return { k: kC, wx, wy, r: 1 / kC, x: wx / kC, y: wy / kC, depth: 0, par: null }; }).sort((p, q) => err(p) - err(q))[0];
  const D = { k: 2 * s - C.k, wx: 2 * (O.wx + A.wx + B.wx) - C.wx, wy: 2 * (O.wy + A.wy + B.wy) - C.wy, depth: 0, par: null };
  Object.assign(D, { r: 1 / D.k, x: D.wx / D.k, y: D.wy / D.k });
  const circles = [O, A, B, C, D];
  const seeds = [];
  for (const E of [C, D]) seeds.push([O, A, E, B, 0], [O, B, E, A, 0], [A, B, E, O, 0]);
  return { circles, seeds };
}

// A strip gasket between two parallel lines, as a chain of equal circles of radius r along direction (tx,ty)
// through (px,py), from index i0 to i1.
export function stripSeeds(px, py, tx, ty, r, i0, i1, phase) {
  const nx = -ty, ny = tx;                                   // normal toward line 1
  const L1 = line(nx, ny), L2 = line(-nx, -ny);
  L1.x0 = px + nx * r; L1.y0 = py + ny * r; L2.x0 = px - nx * r; L2.y0 = py - ny * r;
  const chain = [];
  for (let i = i0; i <= i1; i++) chain.push(circ(1 / r, px + tx * (2 * i + phase) * r, py + ty * (2 * i + phase) * r));
  const seeds = [];
  for (let i = 0; i < chain.length - 1; i++) seeds.push([L1, chain[i], chain[i + 1], L2, 0], [L2, chain[i], chain[i + 1], L1, 0]);
  return { circles: chain, lines: [L1, L2], seeds };
}

const f2 = v => (Math.abs(v) < 20 ? v.toFixed(2) : v.toFixed(1));
// A circle as two semicircular arcs. The chord is written from the ROUNDED radius: a semicircle is ill-conditioned,
// and a radius a rounding δ short of half the chord moves the arc's centre by √(2rδ) — about 14px on a 1900px circle
// at 0.05px of rounding, which is exactly the size of circle an off-centre crop is made of.
const ring = (x, y, r) => { const rs = f2(r), ds = (2 * +rs).toFixed(rs.length - rs.indexOf('.') - 1); return `M${f2(x - +rs)} ${f2(y)}a${rs} ${rs} 0 1 0 ${ds} 0a${rs} ${rs} 0 1 0 -${ds} 0`; };

// The whole composition's geometry for a W×H canvas: { circles, bound, lines, rmin }.
export function layout(W, H, comp, style) {
  const S = Math.min(W, H), box = [-2, -2, W + 2, H + 2];
  let circles = [], seeds = [], lines = [], bound = null;
  if (comp === 'strips') {
    const r = S * rand(.2, .4), ang = chance(.5) ? rand(-.5, .5) : pick([0, Math.PI / 2]) + rand(-.08, .08);
    const tx = Math.cos(ang), ty = Math.sin(ang), half = Math.hypot(W, H) / 2 + 2 * r;
    const brick = chance(.6);
    for (let m = -Math.ceil(half / (2 * r)); m <= Math.ceil(half / (2 * r)); m++) {
      const px = W / 2 - ty * 2 * r * m, py = H / 2 + tx * 2 * r * m;
      const st = stripSeeds(px, py, tx, ty, r, -Math.ceil(half / (2 * r)) - 1, Math.ceil(half / (2 * r)) + 1, brick ? (m & 1) : rand(0, 2));
      circles.push(...st.circles); seeds.push(...st.seeds); lines.push(...st.lines);
    }
  } else {
    const classic = comp === 'whole' && chance(.4);
    const a = classic ? 1 / (1 + 2 / Math.sqrt(3)) : rand(.3, .62);
    const b = classic ? a / (1 - a) : rand(.45, 1);
    const theta = rand(0, Math.PI * 2), side = chance(.5) ? 1 : -1;
    let cx = W / 2, cy = H / 2, R = S * rand(.42, .47);
    if (comp === 'crop') {
      // Aim the crop. An arbitrary offset mostly frames the inside of one giant circle; instead build the same
      // gasket at unit size, centre the view on a mid-sized circle's tangency point, and zoom so the view spans a
      // few of that circle's radii — that's what puts a sweep of scales in frame.
      const unit = boundedSeeds(0, 0, 1, a, b, theta, side);
      const pool = [...unit.circles.slice(1), ...fillGaps(unit.seeds, [-2, -2, 2, 2], .008, 6000) || []];
      const far = Math.hypot(W, H) / 2, targets = pool.filter(q => q.r > .03 && q.r < .3);
      let best = -1;
      for (let t = 0; t < 40; t++) {
        const c = pick(targets) || pool[0];
        const nb = c.par ? pick(c.par.filter(q => q.k > 0)) : null;
        const [tx, ty] = nb ? touch(c, nb) : [c.x, c.y];
        const span = Math.min(.6, Math.max(.06, c.r * rand(2.5, 6))), scale = far / span;
        // Score: the share of the canvas that isn't swallowed by one empty giant circle (or lies outside the
        // bounding circle), sampled on a grid. A tangency point can still sit at the edge of a view that's mostly
        // the inside of its circle — especially in portrait — so the best of several aims is kept.
        const toU = (px, py) => [tx + (px - W / 2) / scale, ty + (py - H / 2) / scale];
        const huge = pool.filter(q => q.r * scale > S * .4 && Math.hypot(q.x - tx, q.y - ty) < q.r + far / scale);
        let busy = 0, outside = 0, n = 0;
        for (let gy = .5; gy < 10; gy++) for (let gx = .5; gx < 10; gx++) {
          const [u, v] = toU(gx / 10 * W, gy / 10 * H); n++;
          if (Math.hypot(u, v) > 1) { outside++; continue; }
          if (!huge.some(q => Math.hypot(u - q.x, v - q.y) < q.r)) busy++;
        }
        const score = busy / n - (outside / n > .25 ? .5 : 0) + rand(0, .08);
        if (score > best) { best = score; R = scale; cx = W / 2 - tx * scale; cy = H / 2 - ty * scale; }
      }
    }
    const g = boundedSeeds(cx, cy, R, a, b, theta, side);
    bound = g.circles[0]; circles = g.circles.slice(1); seeds = g.seeds;
  }
  // A gasket holds ~(R/rmin)^1.31 circles — far fewer than it looks — so the floor can go to sub-pixel dust for
  // fills. Outlines stop earlier: below a couple of px a stroked ring is just a blob.
  let rmin = style === 'outline' ? Math.max(1.2, S * rand(.0016, .0026)) : Math.max(.55, S * rand(.0007, .0014)), gen = null;
  for (let tries = 0; tries < 8 && !(gen = fillGaps(seeds, box, rmin, 9000)); tries++) rmin *= 1.35;
  circles = [...circles.filter(c => c.x + c.r > box[0] && c.x - c.r < box[2] && c.y + c.r > box[1] && c.y - c.r < box[3]), ...(gen || [])];
  return { circles, bound, lines, rmin };
}

export default function apollonian() {
  const { ground, fg, ink, soft } = groundScheme();
  const W = ctx.W, H = ctx.H, S = ctx.S, tick = Math.max(1, S / 900);
  const comp = wpick([['crop', 4], ['whole', 2], ['strips', 2]]);
  const style = wpick([['filled', 4], ['outline', 3], ['mixed', 3]]);
  const pal = shuffle(fg);
  const { circles, bound, lines, rmin } = layout(W, H, comp, style);

  // ---- colour. A filled enclosing disc is the surface every circle sits on; otherwise the ground is.
  const discFill = bound && style !== 'outline' && chance(.45) ? pal[0] : null;
  const surface = discFill || ground;
  let cols = readable(discFill ? pal.slice(1) : pal, surface, .2);
  if (cols.length < 2) cols = readable([...cols, ink, soft], surface, .2);
  const lineCol = readable([ink], surface, .35)[0];
  const rmax = Math.min(S * .6, Math.max(...circles.map(c => c.r)));   // giant crop circles count as canvas-sized
  const byDepth = comp !== 'strips' && chance(.35);
  const q = rand(.55, 1);
  const colourOf = c => cols[(byDepth ? c.depth : Math.max(0, Math.floor(Math.log2(rmax / c.r) * q))) % cols.length];
  const NB = 8, bandOf = c => Math.max(0, Math.min(NB - 1, Math.floor(Math.log(rmax / c.r) / Math.log(rmax / rmin) * NB)));
  const inset = style === 'filled' && chance(.55) ? rand(.05, .12) : 0;
  const fillCut = style === 'mixed' ? S * rand(.025, .07) : 0;

  // ---- batch: one path per (band, colour) for fills, per (band, width) for outlines
  const layers = new Map();
  const add = (key, d) => layers.set(key, (layers.get(key) || '') + d);
  for (const c of circles) {
    const b = bandOf(c);
    const filled = style === 'filled' || (style === 'mixed' && c.r > fillCut);
    if (filled) {
      const g = inset ? Math.min(c.r * inset, Math.max(.5, S * .002)) + c.r * inset * .3 : 0;
      add(`f|${b}|${colourOf(c)}`, ring(c.x, c.y, c.r - g));
    } else {
      const wd = Math.max(.6, Math.min(3.2, Math.sqrt(c.r) * .22)) * tick, lvl = Math.round(wd * 2) / 2;
      add(`s|${b}|${lvl}`, ring(c.x, c.y, Math.max(.3, c.r - lvl / 2)));
    }
  }

  const svg = svgRoot();
  if (bound) {
    if (discFill) fade(mk('path', { d: ring(bound.x, bound.y, bound.r), fill: discFill }, svg), 0, .5);
    else if (style !== 'filled') fade(mk('path', { d: ring(bound.x, bound.y, bound.r), fill: 'transparent', stroke: lineCol, 'stroke-width': (2.4 * tick).toFixed(1) }, svg), 0, .5);
  }
  if (comp === 'strips' && style !== 'filled') {
    const half = Math.hypot(W, H);
    let d = '';
    for (const L of lines) d += `M${f2(L.x0 - L.wy * half)} ${f2(L.y0 + L.wx * half)}L${f2(L.x0 + L.wy * half)} ${f2(L.y0 - L.wx * half)}`;
    fade(mk('path', { d, fill: 'transparent', stroke: lineCol, 'stroke-width': (2 * tick).toFixed(1) }, svg), 0, .5);
  }
  const keys = [...layers.keys()].sort((p, q2) => +p.split('|')[1] - +q2.split('|')[1]);
  for (const key of keys) {
    const [kind, b, v] = key.split('|');
    const delay = .08 + +b * .13;
    const attrs = kind === 'f' ? { d: layers.get(key), fill: v } : { d: layers.get(key), fill: 'transparent', stroke: lineCol, 'stroke-width': v };
    fade(mk('path', attrs, svg), delay, .5);
  }
}
