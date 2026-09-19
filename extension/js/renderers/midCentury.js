import { ctx, rand, ri, pick, chance, shuffle, mix, svgRoot, groundScheme, rrange, smoothPath, labDist, hexToOklch, oklchToHex, hexToRgb } from '../utils.js';
// Mid-century abstract: the modern-retro print — muted inks (navy, cream, rust, mustard, sage, slate), soft
// organic forms, a little print texture, and nothing left empty. Three renderers share the palette and grain:
//   ribbons — fat meandering tubes and discs overprinted translucently on grid paper; some carry a fine mesh,
//             with a thin tendril and scattered specks on top;
//   waves   — stacked wavy layers (each the region below a flowing curve, painted in order so later ones overlap
//             the earlier), running at a slant; some filled with dot screens, with hairlines tracing the edges
//             and circles floating over them;
//   garden  — a gap-free field of big soft shapes, packed with pebbles decorated as sunbursts, petal flowers or
//             leaves, with sprigs and little stars in the gaps.
// A paper grain goes over everything.

const SVGNS = 'http://www.w3.org/2000/svg';
const add = (parent, tag, attrs) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
};
const f1 = v => v.toFixed(1);
const closed = pts => smoothPath([...pts, pts[0], pts[1]]) + 'Z';
const uid = () => 'mc' + Math.random().toString(36).slice(2);

// a soft, roughly round outline
function pebble(x, y, R, wob = .1) {
  const k = [[2, rand(0, wob), rand(0, 6.3)], [3, rand(0, wob * .7), rand(0, 6.3)]], pts = [];
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r = R * (1 + k.reduce((s, [n, amp, ph]) => s + amp * Math.sin(n * a + ph), 0)); pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  return pts;
}

// dot-screen / mesh patterns, returned as url(#id)
function dotPattern(defs, size, r, color) {
  const id = uid(), p = add(defs, 'pattern', { id, width: f1(size), height: f1(size), patternUnits: 'userSpaceOnUse', patternTransform: `rotate(${ri(0, 45)})` });
  add(p, 'circle', { cx: f1(size / 2), cy: f1(size / 2), r: f1(r), fill: color });
  return `url(#${id})`;
}
function meshPattern(defs, size, color, w) {
  const id = uid(), p = add(defs, 'pattern', { id, width: f1(size), height: f1(size), patternUnits: 'userSpaceOnUse' });
  add(p, 'path', { d: `M0 0H${f1(size)}M0 0V${f1(size)}`, stroke: color, 'stroke-width': f1(w), fill: 'none' });
  return `url(#${id})`;
}

function grain(svg, defs, color, opacity) {
  const id = uid(), [r, g, b] = hexToRgb(color).map(v => (v / 255).toFixed(3));
  const f = add(defs, 'filter', { id, x: 0, y: 0, width: '100%', height: '100%' });
  add(f, 'feTurbulence', { type: 'fractalNoise', baseFrequency: '.85', numOctaves: 2, stitchTiles: 'stitch' });
  add(f, 'feColorMatrix', { type: 'matrix', values: `0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 1.8 0 0 0 -.9` });
  return add(svg, 'rect', { x: 0, y: 0, width: ctx.W, height: ctx.H, filter: `url(#${id})`, opacity, 'pointer-events': 'none' });
}

/* ---------- ribbons ---------- */
function ribbons(svg, defs, P) {
  const { W, H, S } = ctx;
  // grid paper: the pale (or, on a dark scheme, the deep) anchor colour, ruled faintly
  const paper = P.gL > .45 ? P.light : P.dark, rule = P.contrast(paper);
  svg.node('rect', { x: 0, y: 0, width: W, height: H, fill: paper });
  svg.node('rect', { x: 0, y: 0, width: W, height: H, fill: meshPattern(defs, S * rand(.012, .018), mix(paper, rule, .14), Math.max(.6, S * .0008)) });
  const mesh = meshPattern(defs, S * .008, mix(rule, paper, .2), Math.max(.6, S * .0009));
  P = { ...P, cs: P.cs.filter(c => c !== paper) };
  const walk = (n, step) => {
    let x = rand(-.1, 1.1) * W, y = rand(-.1, 1.1) * H, a = rand(0, 6.3); const pts = [[x, y]];
    for (let i = 0; i < n; i++) { a += rand(-1.3, 1.3); x += Math.cos(a) * step; y += Math.sin(a) * step; pts.push([x, y]); }
    return pts;
  };
  const items = [];
  for (let i = Math.round(W * H / (S * S) * rand(18, 26)); i > 0; i--) items.push(pick(['tube', 'tube', 'tube', 'disc', 'blob']));
  rrange(0, items.length, i => {
    const c = pick(P.cs), op = rand(.72, .92);
    if (items[i] === 'tube') {
      const d = smoothPath(walk(ri(3, 6), S * rand(.12, .22))), w = S * rand(.06, .15);
      svg.node('path', { d, fill: 'none', stroke: c, 'stroke-width': f1(w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: op });
      if (chance(.3)) svg.node('path', { d, fill: 'none', stroke: mesh, 'stroke-width': f1(w), 'stroke-linecap': 'round', opacity: .55 });
    } else if (items[i] === 'blob') {
      const d = closed(pebble(rand(0, W), rand(0, H), S * rand(.08, .16), .22));
      svg.node('path', { d, fill: c, opacity: op });
      if (chance(.3)) svg.node('path', { d, fill: mesh, opacity: .5 });
    } else {
      const x = rand(0, W), y = rand(0, H), r = S * rand(.04, .11);
      svg.node('circle', { cx: f1(x), cy: f1(y), r: f1(r), fill: c, opacity: op });
      if (chance(.3)) svg.node('circle', { cx: f1(x), cy: f1(y), r: f1(r), fill: mesh, opacity: .5 });
    }
  }, { dur: 1 });
  // a tendril or two, and specks
  for (let i = ri(1, 2); i > 0; i--) svg.node('path', { d: smoothPath(walk(ri(8, 12), S * .07)), fill: 'none', stroke: pick(P.cs), 'stroke-width': f1(S * rand(.006, .01)), 'stroke-linecap': 'round', opacity: .9 });
  for (let i = ri(15, 30); i > 0; i--) svg.node('circle', { cx: f1(rand(0, W)), cy: f1(rand(0, H)), r: f1(S * rand(.004, .012)), fill: pick([...P.cs, P.ink]) });
}

/* ---------- layers ---------- */
function layers(svg, defs, P) {
  const { W, H, S } = ctx, D = Math.hypot(W, H), ang = pick([rand(-50, -25), rand(25, 50), rand(-12, 12)]);
  const g = add(svg, 'g', { transform: `rotate(${f1(ang)} ${f1(W / 2)} ${f1(H / 2)})` });
  const x0 = W / 2 - D / 2, y0 = H / 2 - D / 2, n = ri(10, 16), sp = D / n;
  svg.node('rect', { x: f1(x0), y: f1(y0), width: f1(D), height: f1(D), fill: pick(P.cs) }, g);
  // one shared slow swell, plus each curve's own waves, so neighbours run roughly together but interlock
  const sw = [rand(.6, 1.3), rand(0, 6.3)], order = shuffle(P.cs);
  rrange(0, n, k => {
    const base = y0 + (k + .6) * sp, A = sp * rand(.3, .7), f = [rand(1.2, 2.6), rand(2.5, 4.5)], ph = [rand(0, 6.3), rand(0, 6.3)], pts = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, x = x0 + u * D;
      pts.push([x, base + sp * 1.4 * Math.sin(sw[0] * u * 6.28 + sw[1]) + A * Math.sin(f[0] * u * 6.28 + ph[0]) + A * .35 * Math.sin(f[1] * u * 6.28 + ph[1])]);
    }
    const top = smoothPath(pts), d = `${top}L${f1(x0 + D)} ${f1(y0 + D)}L${f1(x0)} ${f1(y0 + D)}Z`, c = order[k % order.length];
    svg.node('path', { d, fill: c }, g);
    if (chance(.35)) svg.node('path', { d, fill: dotPattern(defs, S * rand(.012, .022), S * rand(.002, .005), P.contrast(c)), opacity: rand(.5, .9) }, g);
    if (chance(.35)) {
      const off = sp * rand(.15, .35);
      svg.node('path', { d: smoothPath(pts.map(([x, y]) => [x, y + off])), fill: 'none', stroke: P.contrast(c), 'stroke-width': f1(Math.max(.8, S * .0015)), opacity: .7 }, g);
    }
  }, { order: 'forward', dur: .9 });   // forward: each layer must be painted over the one above it
  for (let i = Math.round(W * H / (S * S) * rand(6, 12)); i > 0; i--) {
    const r = S * (chance(.8) ? rand(.008, .025) : rand(.04, .09));
    svg.node('circle', { cx: f1(rand(0, W)), cy: f1(rand(0, H)), r: f1(r), fill: pick([P.light, ...P.cs]), opacity: rand(.6, .95) });
  }
}

/* ---------- garden ---------- */
function garden(svg, defs, P) {
  const { W, H, S } = ctx;
  // under-layer: big soft shapes covering the whole cloth
  const cell = S * rand(.2, .26);
  for (let i = -1; i * cell < W + cell; i++) for (let j = -1; j * cell < H + cell; j++)
    svg.node('path', { d: closed(pebble((i + rand(.2, .8)) * cell, (j + rand(.2, .8)) * cell, cell * rand(.75, 1), .18)), fill: pick(P.cs) });

  // decorated pebbles, packed
  const peb = [], fits = (x, y, r) => peb.every(p => Math.hypot(p.x - x, p.y - y) >= (p.r + r) * .92);
  for (let r = S * rand(.12, .16); r > S * .05; r *= .85)
    for (let t = 0; t < 80; t++) { const x = rand(-.05, 1.05) * W, y = rand(-.05, 1.05) * H; if (fits(x, y, r)) peb.push({ x, y, r }); }
  const lw = Math.max(1, S * .0022);
  rrange(0, peb.length, i => {
    const { x, y, r } = peb[i], c = pick([P.dark, P.light, ...P.cs]), k = P.contrast(c), k2 = pick(P.cs.filter(q => q !== c)) ?? k;
    svg.node('path', { d: closed(pebble(x, y, r, .07)), fill: c });
    const kind = pick(['sun', 'sun', 'flower', 'leaf', 'plain']);
    if (kind === 'sun') {
      const n = ri(20, 36); let d = '';
      for (let q = 0; q < n; q++) { const a = q / n * Math.PI * 2; d += `M${f1(x + Math.cos(a) * r * .2)} ${f1(y + Math.sin(a) * r * .2)}L${f1(x + Math.cos(a) * r * .82)} ${f1(y + Math.sin(a) * r * .82)}`; }
      svg.node('path', { d, fill: 'none', stroke: k, 'stroke-width': f1(lw * .8), 'stroke-linecap': 'round' });
      svg.node('circle', { cx: f1(x), cy: f1(y), r: f1(r * .13), fill: k2, stroke: k, 'stroke-width': f1(lw * .6) });
    } else if (kind === 'flower') {
      for (const [rr, w, col] of [[r * .62, r * .34, k2], [r * .38, r * .22, k]]) {
        const n = Math.max(8, Math.round(2 * Math.PI * rr / (w * .75)));
        svg.node('circle', { cx: f1(x), cy: f1(y), r: f1(rr), fill: 'none', stroke: col, 'stroke-width': f1(w), 'stroke-dasharray': `0 ${f1(2 * Math.PI * rr / n)}`, 'stroke-linecap': 'round' });
      }
      svg.node('circle', { cx: f1(x), cy: f1(y), r: f1(r * .16), fill: k });
    } else if (kind === 'leaf') {
      const a = rand(0, 6.3), ca = Math.cos(a), sa = Math.sin(a); let d = `M${f1(x - ca * r * .75)} ${f1(y - sa * r * .75)}L${f1(x + ca * r * .75)} ${f1(y + sa * r * .75)}`;
      for (let t = -.5; t <= .55; t += .18) { const px = x + ca * r * t, py = y + sa * r * t, l = r * .45 * Math.cos(t * 1.5); for (const s of [1, -1]) d += `M${f1(px)} ${f1(py)}L${f1(px + ca * l * .6 - s * sa * l)} ${f1(py + sa * l * .6 + s * ca * l)}`; }
      svg.node('path', { d, fill: 'none', stroke: k, 'stroke-width': f1(lw), 'stroke-linecap': 'round' });
    }
  }, { dur: 1 });

  // sprigs and stars in the gaps
  for (let i = Math.round(W * H / (S * S) * rand(8, 14)); i > 0; i--) {
    const x = rand(0, W), y = rand(0, H), s = S * rand(.03, .06), c = pick([P.light, P.dark, ...P.cs]);
    if (chance(.5)) {
      const pts = Array.from({ length: 5 }, (_, q) => { const a = -Math.PI / 2 + q * Math.PI * 4 / 5; return `${f1(x + Math.cos(a) * s * .35)} ${f1(y + Math.sin(a) * s * .35)}`; });
      svg.node('path', { d: 'M' + pts.join('L') + 'Z', fill: c, stroke: c, 'stroke-width': f1(lw), 'stroke-linejoin': 'round' });
    } else {
      const a = rand(-2.2, -.9); let d = `M${f1(x)} ${f1(y)}L${f1(x + Math.cos(a) * s * 1.6)} ${f1(y + Math.sin(a) * s * 1.6)}`;
      for (let t = .3; t < 1.5; t += .3) { const px = x + Math.cos(a) * s * t, py = y + Math.sin(a) * s * t; for (const sd of [.7, -.7]) d += `M${f1(px)} ${f1(py)}L${f1(px + Math.cos(a + sd) * s * .35)} ${f1(py + Math.sin(a + sd) * s * .35)}`; }
      svg.node('path', { d, fill: 'none', stroke: c, 'stroke-width': f1(lw * 1.4), 'stroke-linecap': 'round' });
    }
  }
}

// Shared by all three: the period palette, the SVG, and the paper grain over the finished print.
function print(draw) {
  const { ground, fg, ink, gL } = groundScheme();
  // period inks: a little chalkier than the palette, plus a deep and a pale member so every design has its
  // navy-and-cream anchors
  const mute = c => { const [L, C, H] = hexToOklch(c); return oklchToHex(L, C * .62, H); };
  const [, C0, H0] = hexToOklch(fg[0]);
  const dark = oklchToHex(rand(.24, .32), Math.min(.08, C0 * .5), H0 + rand(150, 210)), light = oklchToHex(rand(.93, .96), .025, H0 + rand(-20, 20));
  const cs = [...new Set(shuffle(fg).map(mute))];
  const all = [...cs, dark, light, ink];
  const contrast = c => all.reduce((b, q) => labDist(q, c) > labDist(b, c) ? q : b, all[0]);
  const P = { ground, ink, gL, dark, light, cs: [...cs, chance(.6) ? dark : light], contrast };

  const svg = svgRoot(), defs = add(svg, 'defs', {});
  draw(svg, defs, P);
  grain(svg, defs, gL > .5 ? '#000000' : '#ffffff', gL > .5 ? .1 : .07);
}
export const midCenturyRibbons = () => print(ribbons);
export const midCenturyWaves = () => print(layers);
export const midCenturyGarden = () => print(garden);
