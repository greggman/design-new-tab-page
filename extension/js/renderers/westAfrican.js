import { ctx, rand, ri, pick, chance, shuffle, mix, svgRoot, groundScheme, grid, smoothPath } from '../utils.js';
// Two West African cloths (Kente and Mudcloth have their own renderers):
//
// Adinkra (Asante, Ghana): the cloth is ruled into square panels by bands — either stamped with a multi-toothed
// comb (nwomu) or embroidered in coloured strips — and each panel is filled with rows of ONE symbol, pressed on
// with a carved calabash stamp. Stamping is imperfect: every impression sits a little askew and takes a little
// more or less ink. The symbols are the traditional Akan ones, simplified to their stamp silhouettes.
//
// Adire eleko (Yoruba, Nigeria): a starch paste is painted on by hand, the cloth is dyed in indigo, and the paste
// is scraped off, leaving a pale drawing on the dyed ground. The cloth is divided into a grid of panels, each
// painted with one motif — concentric rings, spirals, dot fields, scales (Olokun), ferns, hatching — and a few
// motifs alternate across the grid. Every line is freehand, so all of it wobbles slightly.

const SVGNS = 'http://www.w3.org/2000/svg';
const add = (parent, tag, attrs) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
};
const f2 = v => v.toFixed(2);
// Fade in without svg.node(): its animation sets CSS transform, which would override a transform attribute.
const fade = (e, delay, op = 1) => {
  e.style.setProperty('--t0', 'none'); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', String(op));
  e.style.animation = `fin .45s ease ${delay.toFixed(3)}s both`;
  return e;
};
const spiral = (cx, cy, r0, a0, turns, dir = 1, n = 40) => {
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, a = a0 + dir * t * turns * Math.PI * 2, r = r0 * (1 - t * .92); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
};

/* ---------------- Adinkra ---------------- */

// Stamp silhouettes in a 100×100 box. Each draws into a <symbol>; `cloth` is for cut-outs.
const HEART = 'M50 90C20 68 6 52 6 33C6 18 17 8 30 8C40 8 47 14 50 22C53 14 60 8 70 8C83 8 94 18 94 33C94 52 80 68 50 90Z';
const SYMBOLS = {
  adinkrahene(s) { for (const r of [44, 30, 16]) add(s, 'circle', { cx: 50, cy: 50, r, fill: 'none', stroke: 'currentColor', 'stroke-width': 7 }); },
  akoma(s) { add(s, 'path', { d: HEART, fill: 'currentColor' }); },
  sankofa(s) {
    add(s, 'path', { d: HEART, fill: 'none', stroke: 'currentColor', 'stroke-width': 7 });
    add(s, 'path', { d: smoothPath(spiral(33, 36, 18, -Math.PI / 2, 1.1, 1)), fill: 'none', stroke: 'currentColor', 'stroke-width': 6, 'stroke-linecap': 'round' });
    add(s, 'path', { d: smoothPath(spiral(67, 36, 18, -Math.PI / 2, 1.1, -1)), fill: 'none', stroke: 'currentColor', 'stroke-width': 6, 'stroke-linecap': 'round' });
  },
  dwennimmen(s) {   // ram's horns: four spirals curling out of the centre
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const cx = 50 + sx * 23, cy = 50 + sy * 23, a0 = Math.atan2(50 - cy, 50 - cx);
      add(s, 'path', { d: smoothPath(spiral(cx, cy, 30, a0, 1.25, sx * sy)), fill: 'none', stroke: 'currentColor', 'stroke-width': 7, 'stroke-linecap': 'round' });
    }
  },
  nsoromma(s) {     // star: a disc with eight rays
    add(s, 'circle', { cx: 50, cy: 50, r: 14, fill: 'currentColor' });
    let d = '';
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, p = (r, da) => `${f2(50 + Math.cos(a + da) * r)} ${f2(50 + Math.sin(a + da) * r)}`; d += `M${p(19, -.2)}L${p(47, 0)}L${p(19, .2)}Z`; }
    add(s, 'path', { d, fill: 'currentColor' });
  },
  nkyinkyim(s) { add(s, 'path', { d: 'M28 6L72 20L28 35L72 50L28 65L72 80L28 94', fill: 'none', stroke: 'currentColor', 'stroke-width': 9, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }); },
  eban(s) {         // fence: a square inside a square, braced at the corners
    add(s, 'rect', { x: 8, y: 8, width: 84, height: 84, fill: 'none', stroke: 'currentColor', 'stroke-width': 7 });
    add(s, 'rect', { x: 32, y: 32, width: 36, height: 36, fill: 'currentColor' });
    add(s, 'path', { d: 'M8 8L32 32M92 8L68 32M92 92L68 68M8 92L32 68', stroke: 'currentColor', 'stroke-width': 7 });
  },
  mpatapo(s) {      // knot of reconciliation: a diamond with a loop at each point
    add(s, 'path', { d: 'M50 18L82 50L50 82L18 50Z', fill: 'none', stroke: 'currentColor', 'stroke-width': 7 });
    for (const [x, y] of [[50, 13], [87, 50], [50, 87], [13, 50]]) add(s, 'circle', { cx: x, cy: y, r: 9, fill: 'none', stroke: 'currentColor', 'stroke-width': 6 });
  },
  hwemudua(s) {     // measuring stick: a cross with crossbars
    add(s, 'path', { d: 'M50 6V94M6 50H94M38 20H62M38 80H62M20 38V62M80 38V62', stroke: 'currentColor', 'stroke-width': 8, 'stroke-linecap': 'round' });
    add(s, 'circle', { cx: 50, cy: 50, r: 10, fill: 'currentColor' });
  },
  aya(s) {          // fern: a stem with paired fronds
    let d = 'M50 4V96';
    for (let y = 16; y <= 84; y += 11) d += `M50 ${y}L${f2(26 + y * .08)} ${y - 12}M50 ${y}L${f2(74 - y * .08)} ${y - 12}`;
    add(s, 'path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': 6, 'stroke-linecap': 'round' });
  },
  osram(s, cloth) { // moon and star
    add(s, 'circle', { cx: 46, cy: 52, r: 40, fill: 'currentColor' });
    add(s, 'circle', { cx: 60, cy: 44, r: 33, fill: cloth });
    add(s, 'path', { d: 'M70 30L73 40L83 40L75 46L78 56L70 50L62 56L65 46L57 40L67 40Z', fill: 'currentColor' });
  },
};

export function adinkra() {
  const { ground, fg, ink } = groundScheme();
  const svg = svgRoot(), { W, H, S } = ctx, cs = shuffle(fg);
  const defs = add(svg, 'defs', {}), uid = Math.random().toString(36).slice(2);
  const names = shuffle(Object.keys(SYMBOLS));
  for (const n of names) SYMBOLS[n](add(defs, 'symbol', { id: `${n}-${uid}`, viewBox: '0 0 100 100', overflow: 'visible' }), ground);

  const P = S * rand(.2, .32), embroidered = chance(.55), bw = S * (embroidered ? rand(.035, .055) : rand(.025, .04));
  const step = P + bw, cols = Math.ceil(W / step) + 1, rows = Math.ceil(H / step) + 1;
  const ox = (W - (cols * step - bw)) / 2, oy = (H - (rows * step - bw)) / 2;
  const n = ri(2, 4), sz = P / n;
  grid(cols, rows, (c, r) => {
    const x0 = ox + c * step, y0 = oy + r * step, delay = ctx.cellDelay;
    // one symbol per panel; now and then two, alternating in a checker
    const a = names[(c * 3 + r * 5) % names.length], b = chance(.25) ? pick(names) : a;
    let k = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const s = sz * rand(.72, .8), cx = x0 + (i + .5) * sz + rand(-1, 1) * sz * .03, cy = y0 + (j + .5) * sz + rand(-1, 1) * sz * .03;
      const g = add(svg, 'g', { transform: `rotate(${f2(rand(-5, 5))} ${f2(cx)} ${f2(cy)})`, color: ink });
      fade(add(g, 'use', { href: `#${(i + j) % 2 ? b : a}-${uid}`, x: f2(cx - s / 2), y: f2(cy - s / 2), width: f2(s), height: f2(s) }), delay + k++ * .02, rand(.72, 1));
    }
  });
  // the bands, over the panel edges: embroidered colour strips, or comb-stamped rules
  const band = (x, y, w, h, vert, delay) => {
    if (embroidered) {
      const stripes = [.18, .14, .36, .14, .18], cols3 = [cs[0], cs[1 % cs.length], cs[2 % cs.length] ?? ink, cs[1 % cs.length], cs[0]];
      let t = 0;
      stripes.forEach((f, i) => {
        const e = vert ? { x: f2(x + t * w), y: f2(y), width: f2(f * w + .5), height: f2(h) } : { x: f2(x), y: f2(y + t * h), width: f2(w), height: f2(f * h + .5) };
        fade(add(svg, 'rect', { ...e, fill: cols3[i] }), delay); t += f;
      });
      // a running stitch down the middle
      const mid = vert ? `M${f2(x + w / 2)} ${f2(y)}V${f2(y + h)}` : `M${f2(x)} ${f2(y + h / 2)}H${f2(x + w)}`;
      fade(add(svg, 'path', { d: mid, stroke: ink, 'stroke-width': f2(bw * .08), 'stroke-dasharray': `${f2(bw * .25)} ${f2(bw * .18)}`, fill: 'none' }), delay + .2);
    } else {
      let d = '';
      const teeth = ri(4, 6);
      for (let i = 0; i < teeth; i++) { const f = (i + .5) / teeth; d += vert ? `M${f2(x + f * w)} ${f2(y)}V${f2(y + h)}` : `M${f2(x)} ${f2(y + f * h)}H${f2(x + w)}`; }
      fade(add(svg, 'path', { d, stroke: ink, 'stroke-width': f2(Math.max(1, bw / teeth * .45)), fill: 'none' }), delay, rand(.8, 1));
    }
  };
  for (let c = 1; c < cols; c++) band(ox + c * step - bw, 0, bw, H, true, .9 + c * .04);
  for (let r = 1; r < rows; r++) band(0, oy + r * step - bw, W, bw, false, .9 + r * .04);
}

/* ---------------- Adire eleko ---------------- */

export function adire() {
  const { ground, ink } = groundScheme();
  const svg = svgRoot(), { W, H, S } = ctx;
  const paste = ink, soft = mix(ink, ground, .35);
  const c = S / rand(2.6, 4.2), cols = Math.ceil(W / c) + 1, rows = Math.ceil(H / c) + 1;
  const ox = (W - cols * c) / 2, oy = (H - rows * c) / 2, lw = Math.max(1.2, c * rand(.022, .032)), jit = c * .006;
  const wob = pts => pts.map(([x, y]) => [x + rand(-jit, jit), y + rand(-jit, jit)]);
  const line = (x1, y1, x2, y2, n = 6) => smoothPath(wob(Array.from({ length: n + 1 }, (_, i) => [x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n])));
  const circ = (x, y, r, n = 28) => smoothPath(wob(Array.from({ length: n + 3 }, (_, i) => { const a = i / n * Math.PI * 2; return [x + Math.cos(a) * r, y + Math.sin(a) * r]; })));
  const stroke = (d, delay, w = lw, col = paste) => fade(add(svg, 'path', { d, fill: 'none', stroke: col, 'stroke-width': f2(w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), delay);
  const dots = (d, delay, col = paste) => fade(add(svg, 'path', { d, fill: col }), delay);
  const dot = (x, y, r) => `M${f2(x - r)} ${f2(y)}a${f2(r)} ${f2(r)} 0 1 0 ${f2(2 * r)} 0a${f2(r)} ${f2(r)} 0 1 0 ${f2(-2 * r)} 0`;

  const MOTIFS = {
    rings(x, y, dl, s) { const m = ri(4, 6); let d = ''; for (let i = 1; i <= m; i++) d += circ(x + s / 2, y + s / 2, s * .42 * i / m); stroke(d, dl); dots(dot(x + s / 2, y + s / 2, s * .03), dl); },
    spiral(x, y, dl, s) { stroke(smoothPath(wob(spiral(x + s / 2, y + s / 2, s * .42, rand(0, 6.28), rand(3, 4.5), pick([1, -1]), 120))), dl); },
    dotfield(x, y, dl, s) { const m = ri(5, 7); let d = ''; for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) d += dot(x + (i + .5) * s / m + rand(-jit, jit), y + (j + .5) * s / m + rand(-jit, jit), s / m * rand(.16, .22)); dots(d, dl); },
    hatch(x, y, dl, s) { const m = ri(7, 11); let d = ''; for (let i = 1; i < m; i++) { const t = i / m * 2 * s; d += t < s ? line(x + t, y + s * .04, x + s * .04, y + t) : line(x + s * .96, y + t - s, x + t - s, y + s * .96); } stroke(d, dl, lw * .8); },
    scales(x, y, dl, s) {   // Olokun: rows of overlapping arcs, like scales or waves
      const m = ri(3, 5), r = s / m / 2; let d = '';
      for (let j = 0; j < m * 2; j++) for (let i = 0; i <= m; i++) {
        const cx = x + (i + (j % 2 ? 0 : .5)) * 2 * r, cy = y + (j + 1) * r;
        if (cx - r < x - 1 || cx + r > x + s + 1) continue;
        d += smoothPath(wob(Array.from({ length: 11 }, (_, k) => { const a = Math.PI + k / 10 * Math.PI; return [cx + Math.cos(a) * r * .9, cy + Math.sin(a) * r * .9]; })));
      }
      stroke(d, dl, lw * .85);
    },
    fern(x, y, dl, s) {
      let d = line(x + s / 2, y + s * .06, x + s / 2, y + s * .94, 10);
      for (let t = .14; t < .9; t += .09) { const yy = y + t * s, l = s * .34 * Math.sin(Math.PI * t) + s * .05; d += line(x + s / 2, yy, x + s / 2 - l, yy - s * .09, 3) + line(x + s / 2, yy, x + s / 2 + l, yy - s * .09, 3); }
      stroke(d, dl);
    },
    sun(x, y, dl, s) {
      const cx = x + s / 2, cy = y + s / 2, m = ri(12, 18); let d = circ(cx, cy, s * .2) + circ(cx, cy, s * .12);
      for (let k = 0; k < m; k++) { const a = k / m * Math.PI * 2; d += line(cx + Math.cos(a) * s * .26, cy + Math.sin(a) * s * .26, cx + Math.cos(a) * s * .44, cy + Math.sin(a) * s * .44, 2); }
      stroke(d, dl); dots(dot(cx, cy, s * .05), dl);
    },
    checks(x, y, dl, s) {
      const m = 3, q = s / m; let d = '', dd = '';
      for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
        const px = x + i * q, py = y + j * q;
        if ((i + j) % 2) dd += dot(px + q / 2, py + q / 2, q * .16);
        else d += line(px + q * .2, py + q * .2, px + q * .8, py + q * .8, 3) + line(px + q * .8, py + q * .2, px + q * .2, py + q * .8, 3);
      }
      stroke(d, dl); dots(dd, dl);
    },
    waves(x, y, dl, s) {
      const m = ri(5, 7); let d = '';
      for (let j = 1; j < m; j++) { const yy = y + j * s / m, amp = s / m * .28; d += smoothPath(wob(Array.from({ length: 25 }, (_, k) => [x + s * .04 + k / 24 * s * .92, yy + Math.sin(k / 24 * Math.PI * 4) * amp]))); }
      stroke(d, dl);
    },
  };
  // a small vocabulary per cloth — two to four motifs — laid out in a checker, by row, or scattered
  const vocab = shuffle(Object.keys(MOTIFS)).slice(0, ri(2, 4)), layout = pick(['checker', 'rows', 'diag', 'random']);
  grid(cols, rows, (i, j) => {
    const x = ox + i * c, y = oy + j * c, dl = ctx.cellDelay;
    const k = layout === 'checker' ? (i + j) % vocab.length : layout === 'rows' ? j % vocab.length : layout === 'diag' ? (i + j * 2) % vocab.length : ri(0, vocab.length - 1);
    // each motif is painted a little inside its cell, clear of the doubled grid rules
    const pad = c * .1;
    MOTIFS[vocab[k]](x + pad, y + pad, dl, c - pad * 2);
  });
  // the panel grid: doubled freehand rules
  let d = '';
  for (let i = 0; i <= cols; i++) { const x = ox + i * c; d += line(x - c * .025, oy, x - c * .025, oy + rows * c, rows * 4) + line(x + c * .025, oy, x + c * .025, oy + rows * c, rows * 4); }
  for (let j = 0; j <= rows; j++) { const y = oy + j * c; d += line(ox, y - c * .025, ox + cols * c, y - c * .025, cols * 4) + line(ox, y + c * .025, ox + cols * c, y + c * .025, cols * 4); }
  stroke(d, .8, lw * .8, soft);
}
