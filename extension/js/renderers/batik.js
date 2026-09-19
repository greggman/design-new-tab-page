import { ctx, rand, ri, pick, chance, shuffle, wpick, mix, svgRoot, groundScheme, grid, rrange } from '../utils.js';
// Batik: Javanese wax-resist dyeing. The wax lines stay the colour the cloth was before the dye, so every
// motif is outlined in one pale (or dark) "wax" colour over the dyed ground; fields are filled with isen-isen
// (rows of dots and dashes); and where the wax cracked, dye crept into fine branching veins — the crackle
// that says "batik" more than any single motif. Three classic motif families:
//   kawung — a lattice of four-petal flowers whose petal tips meet (the palm-fruit cross-section)
//   parang — diagonal bands of slanting S-blades separated by strips of small diamonds
//   ceplok — a grid of eight-petal geometric rosettes with quatrefoils at the corners
// A fine dot lattice (cecek) covers the ground so there is no bare cloth.

const SVGNS = 'http://www.w3.org/2000/svg';
const add = (parent, tag, attrs) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
};
const f2 = v => v.toFixed(2);
// A dotted stroke: zero-length dashes with round caps, `gap` apart, `size` across. Added with add() + fade()
// rather than svg.node(), whose draw-on animation would override the dash pattern while it runs.
const beads = (size, gap, color) => ({ fill: 'none', stroke: color, 'stroke-width': f2(size), 'stroke-dasharray': `0 ${f2(gap)}`, 'stroke-linecap': 'round' });
// The fade-in animates CSS `transform`, which overrides an SVG transform attribute, so anything rotated sits
// inside a <g> that carries the rotation.
const turned = (parent, a, x, y) => add(parent, 'g', { transform: `rotate(${f2(a)} ${f2(x)} ${f2(y)})` });
const fade = (e, delay) => {
  e.style.setProperty('--t0', 'none'); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', e.getAttribute('opacity') ?? '1');
  e.style.animation = `fin .5s ease ${delay.toFixed(3)}s both`;
  return e;
};

function kawung(svg, P) {
  const { W, H, S } = ctx, c = S / rand(3.2, 5.5), lw = P.lw;
  const d = c * .35, rx = c * .33, ry = c * rand(.15, .19);
  grid(Math.ceil(W / c) + 2, Math.ceil(H / c) + 2, (i, j) => {
    const x = (i - .5) * c, y = (j - .5) * c, delay = ctx.cellDelay;
    for (let k = 0; k < 4; k++) {
      const a = 45 + k * 90, t = a * Math.PI / 180, px = x + Math.cos(t) * d, py = y + Math.sin(t) * d, g = turned(svg, a, px, py);
      svg.node('ellipse', { cx: f2(px), cy: f2(py), rx: f2(rx), ry: f2(ry), fill: P.fill[k % 2], stroke: P.wax, 'stroke-width': f2(lw) }, g);
      svg.node('ellipse', { cx: f2(px - rx * .12), cy: f2(py), rx: f2(rx * .6), ry: f2(ry * .48), fill: P.fill[2], stroke: P.wax, 'stroke-width': f2(lw * .7) }, g);
      fade(add(g, 'ellipse', { cx: f2(px), cy: f2(py), rx: f2(rx * .8), ry: f2(ry * .72), ...beads(lw * 1.3, lw * 3.2, P.wax) }), delay);
      svg.node('circle', { cx: f2(px + rx * .62), cy: f2(py), r: f2(ry * .2), fill: P.wax }, g);
    }
    svg.node('circle', { cx: f2(x), cy: f2(y), r: f2(c * .07), fill: P.fill[2], stroke: P.wax, 'stroke-width': f2(lw) });
    // the diamond gap where four flowers' petals meet
    const gx = x + c / 2, gy = y + c / 2;
    for (let k = 0; k < 4; k++) { const t = k * Math.PI / 2; svg.node('circle', { cx: f2(gx + Math.cos(t) * c * .08), cy: f2(gy + Math.sin(t) * c * .08), r: f2(c * .035), fill: P.wax }); }
  });
}

function parang(svg, P) {
  const { W, H, S } = ctx, D = Math.hypot(W, H), b = S * rand(.16, .26), p = b * rand(.42, .55), lw = P.lw;
  const g = add(svg, 'g', { transform: `rotate(${pick([45, -45])} ${W / 2} ${H / 2})` });
  const x0 = W / 2 - D / 2, n = Math.ceil(D / b) + 1;
  const bandH = b * .76;
  rrange(0, n, k => {
    const y0 = H / 2 - D / 2 + k * b, delay = ctx.cellDelay, col = P.fill[k % 2], col2 = P.fill[(k + 1) % 2];
    // The blade row: slanting S-blades chained tight along the band, each a filled shape that swells in the
    // middle and tapers to both ends, with a dotted spine and a round head. One path per layer for the whole row.
    const ya = y0 + bandH * .06, yb = y0 + bandH * .94, wmax = p * .3;
    const bez = (t, a, b1, b2, c2) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b1 + 3 * (1 - t) * t * t * b2 + t ** 3 * c2;
    let blades = '', spines = '', heads = '';
    for (let x = x0 - p * 2; x < x0 + D + p; x += p) {
      const X = [x, x + p * 1.9, x + p * .1, x + p * 1.6], Y = [ya, ya, yb, yb], L = [], R = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, e = 1e-3, px = bez(t, ...X), py = bez(t, ...Y);
        const dx = bez(Math.min(1, t + e), ...X) - bez(Math.max(0, t - e), ...X), dy = bez(Math.min(1, t + e), ...Y) - bez(Math.max(0, t - e), ...Y), m = Math.hypot(dx, dy) || 1;
        const w = wmax * Math.sin(Math.PI * t) ** .8 + lw * .5;
        L.push([px - dy / m * w, py + dx / m * w]); R.push([px + dy / m * w, py - dx / m * w]);
        spines += (i === 3 ? 'M' : i > 3 && i < 22 ? 'L' : '') + (i >= 3 && i < 22 ? `${f2(px)} ${f2(py)}` : '');
      }
      blades += 'M' + [...L, ...R.reverse()].map(q => f2(q[0]) + ' ' + f2(q[1])).join('L') + 'Z';
      heads += `M${f2(X[3] + p * .2)} ${f2(yb - p * .1)}a${f2(p * .1)} ${f2(p * .1)} 0 1 0 0.01 0`;
    }
    fade(add(g, 'path', { d: blades, fill: col, stroke: P.wax, 'stroke-width': f2(lw), 'stroke-linejoin': 'round' }), delay);
    fade(add(g, 'path', { d: spines, ...beads(lw * 1.4, lw * 3.4, P.wax) }), delay + .25);
    fade(add(g, 'path', { d: heads, fill: P.fill[2], stroke: P.wax, 'stroke-width': f2(lw) }), delay + .15);
    const nodeAt = attrs => svg.node('path', attrs, g);
    // separator strip: two wax rules with a row of small diamonds (mlinjon) between — drawn as squares in the
    // band's frame, since the whole band is already turned 45°
    const ys = y0 + bandH, hs = b - bandH, dm = hs * .32;
    let rules = `M${f2(x0)} ${f2(ys + hs * .08)}H${f2(x0 + D)}M${f2(x0)} ${f2(ys + hs * .92)}H${f2(x0 + D)}`;
    nodeAt({ d: rules, fill: 'none', stroke: P.wax, 'stroke-width': f2(lw) });
    let dia = '';
    for (let x = x0; x < x0 + D; x += dm * 2.6) { const cy = ys + hs / 2; const h = dm * .72; dia += `M${f2(x - h)} ${f2(cy - h)}h${f2(2 * h)}v${f2(2 * h)}h${f2(-2 * h)}Z`; }
    fade(add(g, 'path', { d: dia, fill: col2, stroke: P.wax, 'stroke-width': f2(lw * .8) }), delay + .2);
  }, { dur: 1 });
}

function ceplok(svg, P) {
  const { W, H, S } = ctx, c = S / rand(3, 5), lw = P.lw, star = chance(.5);
  grid(Math.ceil(W / c) + 1, Math.ceil(H / c) + 1, (i, j) => {
    const x = i * c, y = j * c, delay = ctx.cellDelay, alt = (i + j) % 2;
    fade(add(svg, 'circle', { cx: f2(x), cy: f2(y), r: f2(c * .45), ...beads(lw * 1.4, lw * 3.6, P.wax) }), delay);
    svg.node('circle', { cx: f2(x), cy: f2(y), r: f2(c * .4), fill: 'none', stroke: P.wax, 'stroke-width': f2(lw) });
    for (let k = 0; k < 8; k++) {
      const a = k * 45 + (star && alt ? 22.5 : 0), t = a * Math.PI / 180, dd = c * .2, px = x + Math.cos(t) * dd, py = y + Math.sin(t) * dd;
      svg.node('ellipse', { cx: f2(px), cy: f2(py), rx: f2(c * .17), ry: f2(c * .075), fill: P.fill[(k + alt) % 2], stroke: P.wax, 'stroke-width': f2(lw) }, turned(svg, a, px, py));
      svg.node('circle', { cx: f2(x + Math.cos(t) * c * .3), cy: f2(y + Math.sin(t) * c * .3), r: f2(c * .018), fill: P.wax });
    }
    svg.node('circle', { cx: f2(x), cy: f2(y), r: f2(c * .09), fill: P.fill[2], stroke: P.wax, 'stroke-width': f2(lw) });
    svg.node('circle', { cx: f2(x), cy: f2(y), r: f2(c * .035), fill: P.wax });
    // quatrefoil where four cells meet
    const qx = x + c / 2, qy = y + c / 2;
    for (let k = 0; k < 4; k++) { const t = k * Math.PI / 2 + Math.PI / 4; svg.node('circle', { cx: f2(qx + Math.cos(t) * c * .06), cy: f2(qy + Math.sin(t) * c * .06), r: f2(c * .045), fill: P.fill[1 - alt], stroke: P.wax, 'stroke-width': f2(lw * .8) }); }
    svg.node('circle', { cx: f2(qx), cy: f2(qy), r: f2(c * .025), fill: P.wax });
  });
}

// Wax crackle: short jagged veins, occasionally branching, drawn as one path over everything.
function crackle(svg, P) {
  const { W, H, S } = ctx, n = Math.round(W * H / (S * S) * rand(40, 90));
  let d = '';
  const vein = (x, y, a, segs) => {
    d += `M${f2(x)} ${f2(y)}`;
    for (let s = 0; s < segs; s++) {
      a += rand(-.7, .7); const l = S * rand(.006, .02); x += Math.cos(a) * l; y += Math.sin(a) * l;
      d += `L${f2(x)} ${f2(y)}`;
      if (chance(.08)) { vein(x, y, a + pick([-1, 1]) * rand(.6, 1.2), ri(2, 5)); d += `M${f2(x)} ${f2(y)}`; }
    }
  };
  for (let i = 0; i < n; i++) vein(rand(0, W), rand(0, H), rand(0, Math.PI * 2), ri(5, 14));
  fade(add(svg, 'path', { d, fill: 'none', stroke: P.crack, 'stroke-width': f2(Math.max(.6, S * .0011)), 'stroke-linejoin': 'round', opacity: rand(.35, .55) }), 1.1);
}

export default function batik() {
  const { ground, fg, ink } = groundScheme();
  const svg = svgRoot(), S = ctx.S, cs = shuffle(fg);
  const fill = [cs[0], cs[1] ?? mix(cs[0], ink, .45), cs[2] ?? mix(cs[0], ground, .5)];
  // the wax colour is the cloth's undyed colour: the line colour groundScheme keeps far from the ground in lightness
  const P = { wax: ink, fill, lw: Math.max(1, S * rand(.0025, .004)) };

  // cecek: a fine dot lattice over the ground, so no bare cloth shows between motifs
  const id = 'bk' + Math.random().toString(36).slice(2), pw = S * rand(.011, .018);
  const pat = add(add(svg, 'defs', {}), 'pattern', { id, width: f2(pw), height: f2(pw), patternUnits: 'userSpaceOnUse' });
  add(pat, 'circle', { cx: f2(pw / 2), cy: f2(pw / 2), r: f2(pw * .16), fill: mix(ground, ink, .45) });
  svg.node('rect', { x: 0, y: 0, width: ctx.W, height: ctx.H, fill: `url(#${id})` });

  ({ kawung, parang, ceplok })[wpick([['kawung', 1], ['parang', 1], ['ceplok', 1]])](svg, P);
  // the dye that seeped into the cracks is the ground colour: it shows across wax lines and fills, vanishes on the ground
  P.crack = ground;
  crackle(svg, P);
}
