import { ctx, rand, ri, pick, chance, shuffle, mix, svgRoot, groundScheme, grid, labDist } from '../utils.js';
// Motif grid: a quilt of square tiles, each a bold flat emblem — four dots, a bar code, a sparkle, an eye, a
// quarter disc, a coin stack, waves, an orbit, a clover, a rosette, a crescent — drawn from a handful of
// strong colours, one of which is the tile's own ground.
//
// Every motif is written in the unit square and handed a tiny drawing kit (disc, rect, polygon, path, petal
// ring), so each one is a few lines and they all scale to whatever tile size the design picks. Tiles clip
// their contents, which lets motifs run off the edge — the quarter discs and stripes that make the style —
// without spilling into the neighbours.

const f1 = v => v.toFixed(1);
const SVGNS = 'http://www.w3.org/2000/svg';

// Each motif gets (K, c) — the kit, and an array of colours for this tile, c[0] being its ground.
const MOTIFS = {
  fourDots: (K, c) => { for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) K.disc(.27 + i * .46, .27 + j * .46, .21, c[1]); },
  bars: (K, c) => { const n = ri(4, 7); for (let i = 0; i < n; i++) K.rect((i + .22) / n, .08, .56 / n, .84, i % 2 || !chance(.3) ? c[1] : c[2]); },
  diagonals: (K, c) => { for (let i = -6; i < 12; i++) K.poly([[i / 6, 0], [i / 6 + .36, 0], [i / 6 - .64, 1], [i / 6 - 1, 1]], i % 2 ? c[1] : c[2]); },
  sparkle: (K, c) => { K.star(.5, .5, .48, .12, 4, c[1]); if (chance(.5)) K.star(.5, .5, .2, .05, 4, c[0]); },
  quarter: (K, c) => { K.quarterDisc(pick([0, 1, 2, 3]), rand(.8, 1.15), c[1]); if (chance(.6)) K.disc(rand(.2, .8), rand(.2, .8), rand(.1, .18), c[2]); },
  coins: (K, c) => { const n = ri(3, 5); for (let i = n; i >= 0; i--) K.ellipse(.5, .22 + i * (.56 / n), .3, .12, c[1 + (i % 2)]); },
  chevrons: (K, c) => { for (let k = 0; k < 2; k++) { const o = .15 + k * .38; K.poly([[o, .18], [o + .26, .5], [o, .82], [o + .1, .82], [o + .36, .5], [o + .1, .18]], c[1]); } },
  eye: (K, c) => {
    K.path(`M${K.p(.06, .5)}Q${K.p(.5, .06)} ${K.p(.94, .5)}Q${K.p(.5, .94)} ${K.p(.06, .5)}Z`, c[1]);
    K.disc(.5, .5, .2, c[2]); K.disc(.5, .5, .09, c[3] ?? c[1]);
  },
  waves: (K, c) => {
    const n = ri(3, 5), amp = .07;
    for (let i = 0; i < n; i++) {
      const y = (i + .5) / n, pts = Array.from({ length: 25 }, (_, k) => [k / 24, y + Math.sin(k / 24 * Math.PI * 4) * amp]);
      K.stroke('M' + pts.map(q => K.p(...q)).join('L'), c[1], .07);
    }
  },
  orbit: (K, c) => { for (const a of [30, -30, 90]) K.ellipseRot(.5, .5, .46, .17, a, c[1], .045); K.disc(.5, .5, .13, c[2]); },
  clover: (K, c) => { for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) K.disc(.33 + i * .34, .33 + j * .34, .25, c[1]); K.disc(.5, .5, .12, c[2]); },
  rosette: (K, c) => { K.petals(.5, .5, .42, ri(6, 9), c[1]); K.disc(.5, .5, .17, c[2]); K.disc(.5, .5, .07, c[1]); },
  checkPlus: (K, c) => {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) K.rect(i / 4, j / 4, .25, .25, c[1]);
    K.rect(.4, .12, .2, .76, c[2]); K.rect(.12, .4, .76, .2, c[2]);
  },
  stack: (K, c) => { for (let i = 2; i >= 0; i--) K.rect(.12 + i * .12, .12 + i * .12, .5, .5, c[1 + (i % 2)]); },
  dotRows: (K, c) => { for (let j = 0; j < 3; j++) { K.rect(.1, .14 + j * .3, .5, .12, c[1]); K.disc(.78, .20 + j * .3, .12, c[2]); } },
  crescent: (K, c) => { K.disc(.5, .5, .42, c[1]); K.disc(.66, .38, .36, c[0]); },
  drop: (K, c) => { K.path(`M${K.p(.5, .06)}C${K.p(.9, .45)} ${K.p(.86, .92)} ${K.p(.5, .92)}C${K.p(.14, .92)} ${K.p(.1, .45)} ${K.p(.5, .06)}Z`, c[1]); },
  plusGrid: (K, c) => { const n = ri(2, 3); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const cx = (i + .5) / n, cy = (j + .5) / n, a = .3 / n; K.rect(cx - a / 3, cy - a, a * .66, a * 2, c[1]); K.rect(cx - a, cy - a / 3, a * 2, a * .66, c[1]); } },
  capsules: (K, c) => { for (let i = 0; i < 2; i++) { const x = .32 + i * .38; K.round(x - .12, .14, .24, .72, .12, c[1]); K.disc(x, .34, .07, c[2]); } },
  dotGrid: (K, c) => { for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) K.disc((i + .5) / 3, (j + .5) / 3, .11, c[1]); },
  halfDiscs: (K, c) => {   // two domes standing on a band
    K.rect(0, .5, 1, .5, c[2]);
    for (let i = 0; i < 2; i++) K.path(`M${K.p(.5 * i, .5)}A${f1(.25 * K.s)} ${f1(.25 * K.s)} 0 0 1 ${K.p(.5 * i + .5, .5)}Z`, c[1 + i % 2]);
  },
  triangles: (K, c) => { K.poly([[0, 1], [.5, .1], [1, 1]], c[1]); if (chance(.6)) K.poly([[.25, 1], [.5, .55], [.75, 1]], c[2]); },
};
const NAMES = Object.keys(MOTIFS);

export default function motifGrid() {
  const { ground, fg, ink } = groundScheme();
  const { W, H, S } = ctx, svg = svgRoot();
  const defs = document.createElementNS(SVGNS, 'defs'); svg.appendChild(defs);
  const uid = 'mg' + Math.random().toString(36).slice(2);
  // a small poster palette: the scheme's colours plus a pale one, all of them usable as a tile ground
  const pal = [...new Set([...fg, ink, mix(ground, ink, .08)])].filter((c, i, a) => a.findIndex(q => labDist(q, c) < .1) === i);
  const cell = S / ri(3, 6), cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
  const ox = (W - cols * cell) / 2, oy = (H - rows * cell) / 2, gut = cell * rand(0, .16);
  const vocab = shuffle(NAMES).slice(0, ri(8, NAMES.length));

  grid(cols, rows, (i, j) => {
    const x0 = ox + i * cell + gut / 2, y0 = oy + j * cell + gut / 2, s = cell - gut;
    // the tile's own colours: a ground, then the rest ordered by how well they read on it
    const cols4 = shuffle(pal), bg = cols4[0];
    const c = [bg, ...cols4.slice(1).sort((p, q) => labDist(q, bg) - labDist(p, bg))];
    const id = `${uid}-${i}-${j}`, cp = document.createElementNS(SVGNS, 'clipPath');
    cp.setAttribute('id', id);
    const cr = document.createElementNS(SVGNS, 'rect');
    for (const [k, v] of [['x', f1(x0)], ['y', f1(y0)], ['width', f1(s)], ['height', f1(s)]]) cr.setAttribute(k, v);
    cp.appendChild(cr); defs.appendChild(cp);
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('clip-path', `url(#${id})`); svg.appendChild(g);

    svg.node('rect', { x: f1(x0), y: f1(y0), width: f1(s), height: f1(s), fill: bg }, g);
    // the drawing kit, in tile units
    const P = (u, v) => [x0 + u * s, y0 + v * s];
    const K = {
      s,
      p: (u, v) => { const q = P(u, v); return f1(q[0]) + ' ' + f1(q[1]); },
      disc: (u, v, r, col) => { const q = P(u, v); svg.node('circle', { cx: f1(q[0]), cy: f1(q[1]), r: f1(r * s), fill: col }, g); },
      ellipse: (u, v, rx, ry, col) => { const q = P(u, v); svg.node('ellipse', { cx: f1(q[0]), cy: f1(q[1]), rx: f1(rx * s), ry: f1(ry * s), fill: col }, g); },
      ellipseRot: (u, v, rx, ry, deg, col, w) => {
        const q = P(u, v), wrap = document.createElementNS(SVGNS, 'g');
        wrap.setAttribute('transform', `rotate(${deg} ${f1(q[0])} ${f1(q[1])})`); g.appendChild(wrap);
        svg.node('ellipse', { cx: f1(q[0]), cy: f1(q[1]), rx: f1(rx * s), ry: f1(ry * s), fill: 'none', stroke: col, 'stroke-width': f1(w * s) }, wrap);
      },
      rect: (u, v, w, h, col) => { const q = P(u, v); svg.node('rect', { x: f1(q[0]), y: f1(q[1]), width: f1(w * s), height: f1(h * s), fill: col }, g); },
      round: (u, v, w, h, r, col) => { const q = P(u, v); svg.node('rect', { x: f1(q[0]), y: f1(q[1]), width: f1(w * s), height: f1(h * s), rx: f1(r * s), fill: col }, g); },
      poly: (pts, col) => svg.node('path', { d: 'M' + pts.map(q => K.p(...q)).join('L') + 'Z', fill: col }, g),
      path: (d, col) => svg.node('path', { d, fill: col }, g),
      stroke: (d, col, w) => svg.node('path', { d, fill: 'none', stroke: col, 'stroke-width': f1(w * s), 'stroke-linecap': 'round' }, g),
      star: (u, v, R, r, points, col) => {
        const pts = [];
        for (let k = 0; k < points * 2; k++) { const a = k * Math.PI / points - Math.PI / 2, rr = k % 2 ? r : R; pts.push([u + Math.cos(a) * rr, v + Math.sin(a) * rr]); }
        K.poly(pts, col);
      },
      petals: (u, v, R, n, col) => { const q = P(u, v), rr = R * .62 * s, w = 2 * Math.PI * rr / n; svg.node('circle', { cx: f1(q[0]), cy: f1(q[1]), r: f1(rr), fill: 'none', stroke: col, 'stroke-width': f1(R * .72 * s), 'stroke-dasharray': `0 ${f1(w)}`, 'stroke-linecap': 'round' }, g); },
      quarterDisc: (corner, R, col) => {
        const [u, v] = [[0, 0], [1, 0], [1, 1], [0, 1]][corner], q = P(u, v);
        const e1 = P(u + [1, 0, -1, 0][corner] * R, v + [0, 1, 0, -1][corner] * R);
        const e2 = P(u + [0, -1, 0, 1][corner] * R, v + [1, 0, -1, 0][corner] * R);
        svg.node('path', { d: `M${f1(q[0])} ${f1(q[1])}L${f1(e1[0])} ${f1(e1[1])}A${f1(R * s)} ${f1(R * s)} 0 0 1 ${f1(e2[0])} ${f1(e2[1])}Z`, fill: col }, g);
      },
    };
    MOTIFS[pick(vocab)](K, c);
  }, { dur: 1.1 });
}
