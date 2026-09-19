import { ctx, rand, ri, pick, chance, wpick, svgRoot, groundScheme, rrange, labDist } from '../utils.js';
// Block print: a hand-carved linocut / stamp pattern in one ink on a solid ground — the "tribal geometric"
// look. The cloth is packed with small tiles, jostled at slight angles so the gaps between them run irregular,
// each carrying one simple carved form: squares nested in squares, a thick frame with a window, a block of
// parallel bars, a comb, a square spiral, a diamond, a punched block. Nothing is ruler-straight — every corner
// is nudged by hand — and the ink is printed through a filter that roughens its edges and speckles it with
// the tiny unprinted spots of a hand-inked block.

const SVGNS = 'http://www.w3.org/2000/svg';
const add = (parent, tag, attrs) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
};
const f1 = v => v.toFixed(1);

// Treemap split into roughly square tiles; some stop early so tile sizes vary.
function split(r, min, out) {
  const wide = r.w > r.h, L = wide ? r.w : r.h;
  if (L < min * 2 || (L < min * 3.2 && chance(.35))) { out.push(r); return out; }
  const a = L * rand(.32, .68);
  if (wide) { split({ x: r.x, y: r.y, w: a, h: r.h }, min, out); split({ x: r.x + a, y: r.y, w: r.w - a, h: r.h }, min, out); }
  else { split({ x: r.x, y: r.y, w: r.w, h: a }, min, out); split({ x: r.x, y: r.y + a, w: r.w, h: r.h - a }, min, out); }
  return out;
}

// Carved forms, in tile-local coordinates (origin at the tile centre, half-size hw × hh). `q(x0,y0,x1,y1)` is a
// hand-cut quad; `P` maps a local point to the canvas. Each returns [path d, fill-rule] or a stroked spiral.
const MOTIFS = {
  nested(q, hw, hh) {        // squares within squares: even-odd rings, sometimes a solid centre
    const n = ri(2, 3), solid = chance(.5), count = n * 2 + (solid ? 1 : 0), t = Math.min(hw, hh) / (count + .6);
    let d = '';
    for (let k = 0; k < count; k++) d += q(-hw + k * t, -hh + k * t, hw - k * t, hh - k * t);
    return { d, rule: 'evenodd' };
  },
  frame(q, hw, hh) {         // a thick frame with a window, the window often off-centre
    const m = Math.min(hw, hh), s = m * rand(.28, .5), ox = rand(-1, 1) * (hw - s) * .25, oy = rand(-1, 1) * (hh - s) * .25;
    return { d: q(-hw, -hh, hw, hh) + q(ox - s * hw / m, oy - s * hh / m, ox + s * hw / m, oy + s * hh / m), rule: 'evenodd' };
  },
  bars(q, hw, hh) {          // a block of parallel bars
    const vert = chance(.5), n = ri(3, 6), L = vert ? hw : hh, step = 2 * L / n, bw = step * rand(.5, .65);
    let d = '';
    for (let k = 0; k < n; k++) { const a = -L + k * step + (step - bw) / 2; d += vert ? q(a, -hh, a + bw, hh) : q(-hw, a, hw, a + bw); }
    return { d, rule: 'nonzero' };
  },
  comb(q, hw, hh) {          // a spine with teeth — the E shapes
    const n = ri(3, 4), step = 2 * hh / (n * 2 - 1), sp = hw * rand(.35, .55), side = chance(.5) ? 1 : -1;
    let d = side > 0 ? q(-hw, -hh, -hw + sp, hh) : q(hw - sp, -hh, hw, hh);
    for (let k = 0; k < n; k++) { const y = -hh + k * 2 * step; d += q(-hw, y, hw, y + step); }
    return { d, rule: 'nonzero' };
  },
  diamond(q, hw, hh, P) {    // a diamond with a square hole
    const m = Math.min(hw, hh) * .98, h = m * rand(.25, .4), j = () => rand(-1, 1) * m * .04;
    const dia = pts => 'M' + pts.map(([x, y]) => P(x + j(), y + j())).join('L') + 'Z';
    return { d: dia([[0, -m], [m, 0], [0, m], [-m, 0]]) + dia([[0, -h], [h, 0], [0, h], [-h, 0]]), rule: 'evenodd' };
  },
  punched(q, hw, hh, P) {    // a solid block with a round hole
    const r = Math.min(hw, hh) * rand(.2, .38), cx = rand(-1, 1) * (hw - r) * .4, cy = rand(-1, 1) * (hh - r) * .4;
    const [a, b] = [P(cx - r, cy), P(cx + r, cy)];
    return { d: q(-hw, -hh, hw, hh) + `M${a}A${f1(r)} ${f1(r)} 0 1 0 ${b}A${f1(r)} ${f1(r)} 0 1 0 ${a}Z`, rule: 'evenodd' };
  },
  spiral(q, hw, hh, P) {     // a square spiral (the G shapes)
    const m = Math.min(hw, hh), sw = m * rand(.16, .22), pts = [];
    let x0 = -hw + sw / 2, y0 = -hh + sw / 2, x1 = hw - sw / 2, y1 = hh - sw / 2;
    pts.push([x1, y0], [x0, y0], [x0, y1], [x1, y1]);
    for (let k = 0; k < 3 && y1 - y0 > sw * 3; k++) { y0 += sw * 2; pts.push([x1, y0]); x1 -= sw * 2; if (x1 - x0 < sw * 2) break; pts.push([x0 + sw * 2, y0]); x0 += sw * 2; y1 -= sw * 2; if (y1 - y0 < sw) break; pts.push([x0, y1]); pts.push([x1, y1]); }
    return { d: 'M' + pts.map(([x, y]) => P(x + rand(-1, 1) * m * .02, y + rand(-1, 1) * m * .02)).join('L'), stroke: sw };
  },
  solid(q, hw, hh) { return { d: q(-hw, -hh, hw, hh), rule: 'nonzero' }; },
};
const WEIGHTS = [['nested', 3], ['frame', 3], ['bars', 3], ['comb', 1.2], ['spiral', 1.5], ['diamond', 1], ['punched', 1.2], ['solid', .6]];

export default function blockPrint() {
  const { ground, fg, ink } = groundScheme();
  const { W, H, S } = ctx, svg = svgRoot(), defs = add(svg, 'defs', {}), id = 'bp' + Math.random().toString(36).slice(2);
  // one ink, occasionally a second from the palette that also stands well clear of the ground
  const second = fg.filter(c => labDist(c, ground) > .3 && labDist(c, ink) > .15);
  const inks = second.length && chance(.3) ? [ink, pick(second)] : [ink];

  // the print: hand-cut edges (low-frequency displacement) and unprinted speckle (fine noise knocked out)
  const f = add(defs, 'filter', { id, x: '-2%', y: '-2%', width: '104%', height: '104%' });
  add(f, 'feTurbulence', { type: 'fractalNoise', baseFrequency: (8 / S).toFixed(4), numOctaves: 2, result: 'wob' });
  add(f, 'feDisplacementMap', { in: 'SourceGraphic', in2: 'wob', scale: f1(S * .006), result: 'cut' });
  add(f, 'feTurbulence', { type: 'fractalNoise', baseFrequency: rand(.3, .5).toFixed(2), numOctaves: 3, seed: ri(0, 999), result: 'grain' });
  add(f, 'feColorMatrix', { in: 'grain', type: 'matrix', values: `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  10 0 0 0 -${rand(6.4, 7).toFixed(2)}`, result: 'specks' });
  add(f, 'feComposite', { in: 'cut', in2: 'specks', operator: 'out' });
  const g = add(svg, 'g', { filter: `url(#${id})` });

  const tiles = split({ x: -S * .05, y: -S * .05, w: W + S * .1, h: H + S * .1 }, S * rand(.07, .1), []);
  tiles.sort((a, b) => Math.hypot(a.x + a.w / 2 - W / 2, a.y + a.h / 2 - H / 2) - Math.hypot(b.x + b.w / 2 - W / 2, b.y + b.h / 2 - H / 2));
  const gap = S * rand(.012, .02);
  rrange(0, tiles.length, i => {
    const t = tiles[i], cx = t.x + t.w / 2, cy = t.y + t.h / 2, hw = t.w / 2 - gap / 2, hh = t.h / 2 - gap / 2;
    if (hw < 4 || hh < 4) return;
    const a = rand(-8, 8) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), j = Math.min(hw, hh) * .06;
    const P = (x, y) => `${f1(cx + x * ca - y * sa)} ${f1(cy + x * sa + y * ca)}`;
    const q = (x0, y0, x1, y1) => { const r = () => rand(-1, 1) * j; return `M${P(x0 + r(), y0 + r())}L${P(x1 + r(), y0 + r())}L${P(x1 + r(), y1 + r())}L${P(x0 + r(), y1 + r())}Z`; };
    const m = MOTIFS[wpick(WEIGHTS)](q, hw, hh, P), c = pick(inks);
    if (m.stroke) svg.node('path', { d: m.d, fill: 'none', stroke: c, 'stroke-width': f1(m.stroke), 'stroke-linejoin': 'miter' }, g);
    else svg.node('path', { d: m.d, fill: c, 'fill-rule': m.rule }, g);
  }, { dur: 1 });
}
