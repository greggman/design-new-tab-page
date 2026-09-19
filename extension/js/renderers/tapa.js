import { ctx, rand, ri, chance, shuffle, wpick, svgRoot, groundScheme, grid, labDist, hexToRgb } from '../utils.js';
// Tapa / masi: Polynesian bark cloth (tapa in Tonga and Samoa, masi in Fiji). Beaten mulberry bark, stencilled
// in two inks over the bark colour — here any palette colours: the ground from groundScheme as the bark, its
// line colour as the dark ink, and the palette colour standing furthest from both as the second ink. The cloth is ruled into bands and panels; every border carries a row of sawtooth teeth between
// double rules, and every panel is packed with ONE small geometric motif: teeth, diamonds, eight-point
// stars, checks, crosshatch, chevrons, or a dark field with small pale marks.
//
// Each motif is an SVG <pattern> tile, so a panel is a single rect however dense it is. Over everything:
// bark fibre (turbulence stretched along one axis), faint seams where the sheets were pasted together, and a
// slight wobble on the ink edges, since stencils are cut by hand.

const SVGNS = 'http://www.w3.org/2000/svg';
const add = (parent, tag, attrs) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
};
const f1 = v => v.toFixed(1);
const uid = () => 'tp' + Math.random().toString(36).slice(2);

// Pattern tiles. Each takes (p, t, C) — the <pattern>, the tile size, the colours — and returns the tile's
// [w, h] (most are t×t).
const MOTIFS = {
  teeth(p, t, C) {          // two rows of sawtooth: dark teeth up, rust teeth down
    add(p, 'path', { d: `M0 ${f1(t)}L${f1(t / 2)} 0L${f1(t)} ${f1(t)}Z`, fill: C.ink });
    add(p, 'path', { d: `M0 ${f1(t)}L${f1(t)} ${f1(t)}L${f1(t / 2)} ${f1(t * 2)}Z`, fill: C.accent });
    return [t, t * 2];
  },
  diamonds(p, t, C) {
    add(p, 'path', { d: `M${f1(t / 2)} 0L${f1(t)} ${f1(t / 2)}L${f1(t / 2)} ${f1(t)}L0 ${f1(t / 2)}Z`, fill: C.ink });
    add(p, 'path', { d: `M${f1(t / 2)} ${f1(t * .22)}L${f1(t * .78)} ${f1(t / 2)}L${f1(t / 2)} ${f1(t * .78)}L${f1(t * .22)} ${f1(t / 2)}Z`, fill: C.bark });
    add(p, 'rect', { x: f1(t * .42), y: f1(t * .42), width: f1(t * .16), height: f1(t * .16), fill: C.accent });
    return [t, t];
  },
  stars(p, t, C) {          // eight-point star of triangles, rust heart
    const c = t / 2, R = t * .46, r = t * .19, pts = [];
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 - Math.PI / 2, rr = i % 2 ? r : R; pts.push(`${f1(c + Math.cos(a) * rr)} ${f1(c + Math.sin(a) * rr)}`); }
    add(p, 'path', { d: 'M' + pts.join('L') + 'Z', fill: C.ink });
    add(p, 'rect', { x: f1(c - t * .08), y: f1(c - t * .08), width: f1(t * .16), height: f1(t * .16), fill: C.accent, transform: `rotate(45 ${f1(c)} ${f1(c)})` });
    return [t, t];
  },
  checks(p, t, C) {
    const h = t / 2;
    add(p, 'rect', { x: 0, y: 0, width: f1(h), height: f1(h), fill: C.ink });
    add(p, 'rect', { x: f1(h), y: f1(h), width: f1(h), height: f1(h), fill: C.ink });
    add(p, 'rect', { x: f1(h * 1.3), y: f1(h * .3), width: f1(h * .4), height: f1(h * .4), fill: C.accent });
    return [t, t];
  },
  crosshatch(p, t, C) {     // a diagonal lattice with every other diamond filled
    add(p, 'path', { d: `M0 0L${f1(t)} ${f1(t)}M${f1(t)} 0L0 ${f1(t)}`, stroke: C.ink, 'stroke-width': f1(t * .09), fill: 'none' });
    add(p, 'path', { d: `M${f1(t / 2)} ${f1(t * .16)}L${f1(t * .84)} ${f1(t / 2)}L${f1(t / 2)} ${f1(t * .84)}L${f1(t * .16)} ${f1(t / 2)}Z`, fill: C.accent });
    return [t, t];
  },
  chevrons(p, t, C) {
    const h = t / 2;
    add(p, 'path', { d: `M0 ${f1(h * .8)}L${f1(t / 2)} ${f1(h * .15)}L${f1(t)} ${f1(h * .8)}`, stroke: C.ink, 'stroke-width': f1(h * .32), fill: 'none', 'stroke-linejoin': 'miter' });
    add(p, 'circle', { cx: f1(t / 2), cy: f1(h * .82), r: f1(h * .1), fill: C.accent });
    return [t, h];
  },
  dark(p, t, C) {           // the reverse: a dark field with small pale crosses and rust dots
    add(p, 'rect', { x: 0, y: 0, width: f1(t), height: f1(t), fill: C.ink });
    add(p, 'path', { d: `M${f1(t / 2)} ${f1(t * .22)}V${f1(t * .78)}M${f1(t * .22)} ${f1(t / 2)}H${f1(t * .78)}`, stroke: C.pale, 'stroke-width': f1(t * .1), fill: 'none' });
    add(p, 'circle', { cx: 0, cy: 0, r: f1(t * .08), fill: C.accent });
    add(p, 'circle', { cx: f1(t), cy: 0, r: f1(t * .08), fill: C.accent });
    add(p, 'circle', { cx: 0, cy: f1(t), r: f1(t * .08), fill: C.accent });
    add(p, 'circle', { cx: f1(t), cy: f1(t), r: f1(t * .08), fill: C.accent });
    return [t, t];
  },
  bands(p, t, C) {          // small teeth over a row of dots
    add(p, 'path', { d: `M0 ${f1(t * .45)}L${f1(t / 2)} 0L${f1(t)} ${f1(t * .45)}Z`, fill: C.ink });
    add(p, 'circle', { cx: f1(t / 2), cy: f1(t * .72), r: f1(t * .12), fill: C.accent });
    return [t, t];
  },
};

function pattern(defs, motif, t, C, rot = 0) {
  const id = uid(), p = add(defs, 'pattern', { id, patternUnits: 'userSpaceOnUse', patternTransform: rot ? `rotate(${rot})` : null });
  const [w, h] = MOTIFS[motif](p, t, C);
  p.setAttribute('width', f1(w)); p.setAttribute('height', f1(h));
  return `url(#${id})`;
}

// Split the cloth into horizontal bands, some of them split again into panels.
function layout(W, H, S) {
  const panels = [];
  let y = 0;
  while (y < H - 1) {
    const h = Math.min(H - y, S * rand(.16, .42)), rest = H - y - h;
    const bh = rest < S * .12 ? H - y : h;   // don't leave a sliver at the bottom
    const n = chance(.35) ? 1 : ri(2, 4);
    const ws = Array.from({ length: n }, () => rand(.6, 1.4)), sum = ws.reduce((a, b) => a + b, 0);
    let x = 0;
    for (const w of ws) { panels.push({ x, y, w: W * w / sum, h: bh }); x += W * w / sum; }
    y += bh;
  }
  return panels;
}

export default function tapa() {
  const { ground, fg, ink } = groundScheme();
  const { W, H, S } = ctx, svg = svgRoot(), defs = add(svg, 'defs', {});
  // bark = the scheme's ground (any palette hue, any lightness); the printed colours are its line colour and
  // a palette colour that reads against the ground and stands apart from that line colour
  const apart = c => Math.min(labDist(c, ground), labDist(c, ink)), ok = fg.filter(c => apart(c) > .15);
  const accent = ok.length ? ok[Math.floor(Math.random() * ok.length)] : [...fg].sort((p, q) => apart(q) - apart(p))[0];
  const C = { bark: ground, ink, accent, pale: ground };
  svg.node('rect', { x: 0, y: 0, width: W, height: H, fill: C.bark });

  // stencil edges are cut by hand: a slight wobble on everything printed
  const wob = uid(), fw = add(defs, 'filter', { id: wob, x: '-2%', y: '-2%', width: '104%', height: '104%' });
  add(fw, 'feTurbulence', { type: 'fractalNoise', baseFrequency: '.035', numOctaves: 2, result: 'n' });
  add(fw, 'feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: f1(Math.max(1.5, S * .004)) });
  const printed = add(svg, 'g', { filter: `url(#${wob})` });

  const panels = layout(W, H, S), b = S * rand(.03, .045), motifs = shuffle(Object.keys(MOTIFS));
  const tooth = pattern(defs, 'teeth', b * .42, C), toothV = pattern(defs, 'teeth', b * .42, C, 90);
  const lw = Math.max(1, S * .003);
  grid(panels.length, 1, (i) => {
    const P = panels[i];
    // border: double rules with a row of teeth between, drawn as a frame around the panel
    const frame = (x, y, w, h, fill) => svg.node('rect', { x: f1(x), y: f1(y), width: f1(w), height: f1(h), fill }, printed);
    frame(P.x, P.y, P.w, b, tooth); frame(P.x, P.y + P.h - b, P.w, b, tooth);
    frame(P.x, P.y, b, P.h, toothV); frame(P.x + P.w - b, P.y, b, P.h, toothV);
    svg.node('rect', { x: f1(P.x + lw / 2), y: f1(P.y + lw / 2), width: f1(P.w - lw), height: f1(P.h - lw), fill: 'none', stroke: C.ink, 'stroke-width': f1(lw) }, printed);
    svg.node('rect', { x: f1(P.x + b), y: f1(P.y + b), width: f1(P.w - 2 * b), height: f1(P.h - 2 * b), fill: 'none', stroke: C.ink, 'stroke-width': f1(lw) }, printed);
    // the field
    const m = motifs[i % motifs.length], t = S * rand(.035, .07);
    svg.node('rect', { x: f1(P.x + b * 1.35), y: f1(P.y + b * 1.35), width: f1(P.w - 2.7 * b), height: f1(P.h - 2.7 * b), fill: pattern(defs, m, t, C, chance(.2) ? 45 : 0), opacity: rand(.88, 1) }, printed);
  }, { order: wpick([['random', 2], ['edgesInV', 1], ['centreOutH', 1]]) });

  // bark fibre: turbulence stretched along the grain, and the seams where sheets were pasted together
  const fib = uid(), [r, g, bb] = hexToRgb(C.ink).map(v => (v / 255).toFixed(3)), ff = add(defs, 'filter', { id: fib, x: 0, y: 0, width: '100%', height: '100%' });
  add(ff, 'feTurbulence', { type: 'fractalNoise', baseFrequency: `${(.25 / S).toFixed(5)} ${(60 / S).toFixed(5)}`, numOctaves: 3 });
  add(ff, 'feColorMatrix', { type: 'matrix', values: `0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${bb} 1.6 0 0 0 -.75` });
  add(svg, 'rect', { x: 0, y: 0, width: W, height: H, filter: `url(#${fib})`, opacity: .22, 'pointer-events': 'none' });
  for (let x = rand(.15, .3) * W; x < W; x += W * rand(.2, .35))
    add(svg, 'rect', { x: f1(x), y: 0, width: f1(S * rand(.01, .025)), height: H, fill: C.ink, opacity: .05, 'pointer-events': 'none' });
}
