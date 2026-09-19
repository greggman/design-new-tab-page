import { ctx, rand, ri, pick, chance, shuffle, wpick, mix, svgRoot, groundScheme, rrange } from '../utils.js';
// Paisley: the boteh — a teardrop whose tail tapers and curls — drawn the way the shawl/bandana tradition does:
// a beaded or scalloped fringe, then nested inset outlines, a bead row, and an interior of veins, a rosette or
// a smaller nested boteh. Botehs are packed (largest first) or set in alternating rows, the gaps between them
// are packed with rosettes and dots down to a few pixels, and a fine dot pattern covers whatever is left, so
// no bare ground shows anywhere.
//
// Geometry lives in "boteh space": bulb radius 1 centred on the origin, the spine heading up (−y) and curling
// as it goes. Every contour is the spine offset by the width profile minus an inset, so all the outlines nest
// perfectly and the inner ones naturally end earlier up the tail. Each boteh is one <g> scaled into place,
// which keeps strokes and dash patterns proportional at every size.
//
// Bead rows and petal rings are single stroked paths with a zero-length dash and round caps — one element for
// a whole row of dots — which is what keeps a design this dense to a couple of thousand nodes.

const SVGNS = 'http://www.w3.org/2000/svg';
const add = (parent, tag, attrs) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
};
const f3 = v => v.toFixed(3);

function makeBoteh() {
  const L = rand(2.2, 2.8), curl = rand(1.9, 3), p = rand(.75, 1.05), n = 72, sp = [];
  let x = 0, y = 0;
  for (let i = 0; i <= n; i++) {
    const u = i / n, th = -Math.PI / 2 + curl * u * u;
    sp.push({ u, x, y, nx: -Math.sin(th), ny: Math.cos(th) });
    x += Math.cos(th) * L / n; y += Math.sin(th) * L / n;
  }
  const w = u => Math.pow(Math.max(0, Math.cos(u * Math.PI / 2)), p);
  return { sp, w };
}

// Closed contour at `inset` inside the outline (negative = outside it).
function contour({ sp, w }, inset) {
  const A = [], B = [];
  for (const q of sp) {
    const d = w(q.u) - inset;
    if (d <= .004) { A.push([q.x, q.y]); break; }
    A.push([q.x + q.nx * d, q.y + q.ny * d]); B.push([q.x - q.nx * d, q.y - q.ny * d]);
  }
  const r0 = w(0) - inset, cap = [];
  for (let i = 1; i < 28; i++) { const a = Math.PI - i / 28 * Math.PI; cap.push([r0 * Math.cos(a), r0 * Math.sin(a)]); }
  return 'M' + [...A, ...B.reverse(), ...cap].map(q => f3(q[0]) + ' ' + f3(q[1])).join('L') + 'Z';
}

// A dotted stroke: zero-length dashes with round caps, `gap` apart, `size` across.
const beads = (size, gap, color) => ({ fill: 'none', stroke: color, 'stroke-width': f3(size), 'stroke-dasharray': `0 ${f3(gap)}`, 'stroke-linecap': 'round' });

function rosette(parent, x, y, r, c, ink) {
  const n = ri(6, 10), pr = r * .66;
  add(parent, 'circle', { cx: f3(x), cy: f3(y), r: f3(pr), ...beads(r * .62, 2 * Math.PI * pr / n, c[0]) });
  add(parent, 'circle', { cx: f3(x), cy: f3(y), r: f3(r * .36), fill: c[1], stroke: ink, 'stroke-width': f3(r * .06) });
  add(parent, 'circle', { cx: f3(x), cy: f3(y), r: f3(r * .13), fill: c[2] });
}

function drawBoteh(g, b, col, ink, style) {
  const lw = .035;
  if (style.fringe === 'beads') add(g, 'path', { d: contour(b, -.12), ...beads(.12, .2, col(4)) });
  else if (style.fringe === 'scallop') add(g, 'path', { d: contour(b, -.03), ...beads(.24, .22, col(4)) });
  add(g, 'path', { d: contour(b, 0), fill: col(0), stroke: ink, 'stroke-width': lw });
  add(g, 'path', { d: contour(b, .15), fill: col(1), stroke: ink, 'stroke-width': lw * .7 });
  add(g, 'path', { d: contour(b, .24), ...beads(.075, .13, col(2)) });
  add(g, 'path', { d: contour(b, .33), fill: col(3), stroke: ink, 'stroke-width': lw * .6 });
  if (style.inner === 'veins') {
    // a comb of short strokes set in from both edges of the inner field, like the striated border of a woven boteh
    let d = '';
    b.sp.forEach((q, i) => {
      const h = b.w(q.u) - .36;
      if (i % 2 || h < .1) return;
      const t = Math.min(.14, h * .45);
      for (const s of [1, -1]) d += `M${f3(q.x + s * q.nx * h)} ${f3(q.y + s * q.ny * h)}L${f3(q.x + s * q.nx * (h - t))} ${f3(q.y + s * q.ny * (h - t))}`;
    });
    if (d) add(g, 'path', { d, fill: 'none', stroke: col(0), 'stroke-width': .035, 'stroke-linecap': 'round' });
    add(g, 'circle', { cx: 0, cy: .05, r: .3, fill: col(2), stroke: ink, 'stroke-width': lw * .6 });
    add(g, 'circle', { cx: 0, cy: .05, r: .12, fill: col(0) });
  } else if (style.inner === 'nested') {
    add(g, 'path', { d: contour(b, .46), fill: col(1), stroke: ink, 'stroke-width': lw * .5 });
    add(g, 'path', { d: contour(b, .54), ...beads(.06, .11, col(4)) });
    add(g, 'path', { d: contour(b, .62), fill: col(2), stroke: ink, 'stroke-width': lw * .5 });
    add(g, 'circle', { cx: 0, cy: .1, r: .14, fill: col(0) });
  } else {
    rosette(g, 0, .02, .5, [col(1), col(2), col(0)], ink);
    // a bead trail running up the tail from the rosette
    let d = '';
    for (const q of b.sp) if (q.u > .3 && b.w(q.u) > .42) d += (d ? 'L' : 'M') + f3(q.x) + ' ' + f3(q.y);
    if (d) add(g, 'path', { d, ...beads(.09, .15, col(2)) });
  }
}

function animate(g, delay) {
  Object.assign(g.style, { transformBox: 'fill-box', transformOrigin: 'center', animation: `fin .6s cubic-bezier(.2,.7,.25,1) ${delay.toFixed(3)}s both` });
  g.style.setProperty('--t0', 'scale(.4)'); g.style.setProperty('--t1', 'none'); g.style.setProperty('--op', '1');
}

export default function paisley() {
  const { ground, fg, ink } = groundScheme();
  const cs = shuffle(fg.length >= 3 ? fg : [...fg, mix(fg[0], fg[fg.length - 1], .5), mix(fg[0], ink, .4)]);
  const W = ctx.W, H = ctx.H, S = ctx.S, svg = svgRoot();

  // fine dot lattice over the ground: the last line of defence against bare background
  const id = 'pz' + Math.random().toString(36).slice(2), pw = S * rand(.012, .02), pc = mix(ground, pick(cs), .4);
  const pat = add(add(svg, 'defs', {}), 'pattern', { id, width: f3(pw), height: f3(pw), patternUnits: 'userSpaceOnUse' });
  add(pat, 'circle', { cx: f3(pw / 2), cy: f3(pw / 2), r: f3(pw * .2), fill: pc });
  for (const [x, y] of [[0, 0], [pw, 0], [0, pw], [pw, pw]]) add(pat, 'circle', { cx: f3(x), cy: f3(y), r: f3(pw * .09), fill: pc });
  svg.node('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${id})` });

  // Occupied space as circles (botehs approximated by circles along the spine), bucketed in a coarse grid so the
  // thousands of packing attempts only test nearby circles.
  const cell = S * .08, buckets = new Map();
  const cells = (x, y, r, f) => { for (let i = Math.floor((x - r) / cell); i <= Math.floor((x + r) / cell); i++) for (let j = Math.floor((y - r) / cell); j <= Math.floor((y + r) / cell); j++) f(i + ',' + j); };
  const occupy = c => cells(c[0], c[1], c[2], k => { if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(c); });
  const fits = (x, y, r) => {
    let ok = true;
    cells(x, y, r, k => { if (ok) for (const c of buckets.get(k) ?? []) if ((c[0] - x) ** 2 + (c[1] - y) ** 2 < (c[2] + r) ** 2) { ok = false; break; } });
    return ok;
  };
  // dense: smaller botehs packed tighter and the gaps filled down to specks — no ground left to see
  const mode = wpick([['packed', 2], ['dense', 2], ['rows', 1]]), dense = mode === 'dense', margin = dense ? .14 : .2;
  const place = (x, y, R, rot, flip, force) => {
    const b = makeBoteh(), a = rot * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), cir = [];
    for (let i = 0; i < b.sp.length; i += 6) {
      const q = b.sp[i], lx = q.x * flip * R, ly = q.y * R;
      cir.push([x + lx * ca - ly * sa, y + lx * sa + ly * ca, (b.w(q.u) + margin) * R]);
    }
    if (!force && !cir.every(c => fits(...c))) return null;
    cir.forEach(occupy);
    return { b, x, y, R, rot, flip };
  };
  const botehs = [];
  if (mode !== 'rows') {
    let R = S * (dense ? rand(.07, .1) : rand(.09, .14));
    while (R >= S * (dense ? .02 : .03)) {
      for (let t = 0; t < (dense ? 160 : 90); t++) { const bt = place(rand(-.1, 1.1) * W, rand(-.1, 1.1) * H, R * rand(.9, 1.1), rand(0, 360), chance(.5) ? 1 : -1); if (bt) botehs.push(bt); }
      R *= .84;
    }
  } else {
    const R = S * rand(.07, .11), sx = R * 2.7, sy = R * 3.4, tilt = rand(-25, 25), flip = chance(.5) ? 1 : -1;
    // Alternate rows turn 180°. A boteh's middle sits ~0.7R up the spine from the bulb it's positioned by, so
    // shift each one to put its MIDDLE on the grid point — else flipped rows pair up bulb-to-bulb with gaps between.
    for (let r = -1; r * sy < H + sy; r++) for (let c = -1; c * sx < W + sx; c++) {
      const rot = tilt + (r % 2 ? 180 : 0), a = rot * Math.PI / 180;
      botehs.push(place(c * sx + (r % 2 ? sx / 2 : 0) - .4 * R * Math.sin(a), r * sy + .4 * R * Math.cos(a), R, rot, flip, true));
    }
  }

  // fill the gaps between botehs with rosettes and dots, largest first
  const fill = [];
  for (let r = S * .045; r > S * (dense ? .0035 : .006); r *= .8)
    for (let t = 0; t < (dense ? 2500 : 500); t++) { const x = rand(0, W), y = rand(0, H); if (fits(x, y, r)) { occupy([x, y, r]); fill.push([x, y, r]); } }

  const style = { fringe: pick(['beads', 'scallop', 'none']), inner: pick(['veins', 'nested', 'rosette']) };
  const mixed = chance(.5);   // every boteh alike (a formal repeat) or each with its own fringe and interior
  const key = pick([b => b.x, b => b.y, b => Math.hypot(b.x - W / 2, b.y - H / 2), b => -b.R]);
  botehs.sort((p, q) => key(p) - key(q));
  rrange(0, botehs.length, i => {
    const bt = botehs[i], o = ri(0, cs.length - 1), col = k => cs[(o + k) % cs.length];
    const outer = add(svg, 'g', {}), g = add(outer, 'g', { transform: `translate(${f3(bt.x)} ${f3(bt.y)}) rotate(${f3(bt.rot)}) scale(${f3(bt.flip * bt.R)} ${f3(bt.R)})` });
    drawBoteh(g, bt.b, col, ink, mixed ? { fringe: pick(['beads', 'scallop', 'none']), inner: pick(['veins', 'nested', 'rosette']) } : style);
    animate(outer, ctx.cellDelay);
  }, { dur: 1 });
  rrange(0, fill.length, i => {
    const [x, y, r] = fill[i], g = add(svg, 'g', {}), o = ri(0, cs.length - 1), c = [0, 1, 2].map(k => cs[(o + k) % cs.length]);
    if (r > S * .012) rosette(g, x, y, r * .95, c, ink);
    else add(g, 'circle', { cx: f3(x), cy: f3(y), r: f3(r * .8), fill: c[0], stroke: ink, 'stroke-width': f3(r * .12) });
    animate(g, .35 + ctx.cellDelay);
  }, { dur: .9, order: 'random' });
}
