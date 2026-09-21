import { ctx, rand, ri, pick, chance, shuffle, wpick, svgRoot, groundScheme, grid, hexToOklch, oklchToHex } from '../utils.js';
// Iso blocks: the rhombille tiling — a honeycomb where every hexagon is cut by three lines from its centre into
// three identical rhombi. Those three rhombi are the three visible faces of a cube, which is why the field
// flips between flat pattern and a stack of blocks depending on how the faces are coloured.
//
// Each hexagon is dealt one of a few hands: a shaded CUBE (one colour at three lightnesses — the strongest 3-D
// read), three unrelated FACES (flat, so the cube dissolves), a fan of six TRIANGLES, one SOLID hexagon, or
// nothing at all, leaving the ground showing. Any face can come striped instead of solid, the stripes running
// along one of the three isometric directions, which is what keeps it from reading as plain colour blocking.

const f1 = v => v.toFixed(1);
const SVGNS = 'http://www.w3.org/2000/svg';

export default function isoBlocks() {
  const { ground, fg, ink } = groundScheme();
  const { W, H, S } = ctx, svg = svgRoot();
  const defs = document.createElementNS(SVGNS, 'defs'); svg.appendChild(defs);
  const cs = shuffle([...fg, ink]);
  const uid = 'ib' + Math.random().toString(36).slice(2);

  // striped faces: one pattern per (colour, direction), made on demand
  const pats = new Map(), sw = S * rand(.008, .014);
  const stripe = (col, deg) => {
    const key = col + deg;
    if (!pats.has(key)) {
      const id = `${uid}-${pats.size}`, p = document.createElementNS(SVGNS, 'pattern');
      p.setAttribute('id', id); p.setAttribute('width', f1(sw)); p.setAttribute('height', f1(sw));
      p.setAttribute('patternUnits', 'userSpaceOnUse'); p.setAttribute('patternTransform', `rotate(${deg})`);
      const r = document.createElementNS(SVGNS, 'rect');
      r.setAttribute('width', f1(sw * rand(.4, .55))); r.setAttribute('height', f1(sw)); r.setAttribute('fill', col);
      p.appendChild(r); defs.appendChild(p);
      pats.set(key, `url(#${id})`);
    }
    return pats.get(key);
  };

  const a = S * rand(.085, .15);                       // hexagon side
  const dx = a * 1.5, dy = a * Math.sqrt(3);
  const cols = Math.ceil(W / dx) + 2, rows = Math.ceil(H / dy) + 2;
  const corner = (cx, cy, k) => [cx + Math.cos(k * Math.PI / 3) * a, cy + Math.sin(k * Math.PI / 3) * a];
  const striped = rand(.2, .45);                       // how much of the field comes striped
  const gap = chance(.5) ? 0 : S * .004;               // hairline of ground between hexagons
  // how much ground is left showing: a packed field, or a loose one where the blocks float on the page
  const hands = [['cube', 3], ['faces', 2.5], ['tri', 1.5], ['solid', 1.2], ['empty', pick([.5, 1.5, 3.5])]];

  grid(cols, rows, (i, j) => {
    const cx = (i - .5) * dx, cy = (j - .5) * dy + (i % 2 ? dy / 2 : 0);
    const hand = wpick(hands);
    if (hand === 'empty') return;
    const pull = p => gap ? [cx + (p[0] - cx) * (1 - gap / a), cy + (p[1] - cy) * (1 - gap / a)] : p;
    const poly = pts => 'M' + pts.map(pull).map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z';
    const paint = (d, col, deg) => svg.node('path', { d, fill: chance(striped) ? stripe(col, deg) : col });

    if (hand === 'solid') {
      paint(poly([0, 1, 2, 3, 4, 5].map(k => corner(cx, cy, k))), pick(cs), pick([0, 60, 120]));
      return;
    }
    if (hand === 'tri') {
      const c2 = shuffle(cs).slice(0, ri(2, 3));
      for (let k = 0; k < 6; k++) paint(poly([[cx, cy], corner(cx, cy, k), corner(cx, cy, k + 1)]), c2[k % c2.length], k * 60);
      return;
    }
    // three rhombi: one shaded cube, or three unrelated faces
    const base = pick(cs), [L, C, Hh] = hexToOklch(base);
    const shade = [0, -.09, .09].map(d => oklchToHex(Math.min(.95, Math.max(.1, L + d)), C, Hh));
    const faces = hand === 'cube' ? shade : shuffle(cs).slice(0, 3);
    for (let k = 0; k < 3; k++) {
      const pts = [[cx, cy], corner(cx, cy, 2 * k), corner(cx, cy, 2 * k + 1), corner(cx, cy, 2 * k + 2)];
      paint(poly(pts), faces[k % faces.length], 30 + k * 120);
    }
  }, { dur: 1 });

  // a few big flat hexagons over the field, as in the reference's overlapping plates
  if (chance(.5)) for (let i = ri(1, 3); i > 0; i--) {
    const cx = rand(.15, .85) * W, cy = rand(.15, .85) * H, r = a * rand(1.6, 2.6), col = pick(cs);
    const pts = [0, 1, 2, 3, 4, 5].map(k => [cx + Math.cos(k * Math.PI / 3) * r, cy + Math.sin(k * Math.PI / 3) * r]);
    svg.node('path', { d: 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z', fill: chance(.5) ? stripe(col, pick([0, 60, 120])) : col, opacity: rand(.85, 1) });
  }
}
