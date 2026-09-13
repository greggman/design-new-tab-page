import { ctx, ri, rand, shuffle, mix, chance, labDist, readable, svgRoot } from '../utils.js';
// Warped checker: a checkerboard on a non-uniform grid whose row and column widths swell and shrink
// by a sine. The regular pattern bending over an invisible bulge is the core op-art illusion.
const NS = 'http://www.w3.org/2000/svg';
export default function checkerWarp() {
  const cols = ri(8, 16), rows = ri(6, 12), grad = chance(.4);
  // The two colours have to be genuinely far apart, or the whole canvas reads as one flat colour. Picking any two
  // palette members didn't guarantee that — accent can duplicate a POOL colour outright, and near-neighbours in
  // lightness and hue are common — so 17 in 80 renders came out near-solid. The gradient needs the higher bar, and
  // it's set by eye rather than by the number: a checker still alternates and so reads at a modest difference, but a
  // gradient has nothing except the distance between its ends, spread across the whole canvas — ends 0.45 apart
  // still read as a faint wash.
  const need = grad ? .62 : .32;
  const cs = shuffle([...new Set([...ctx.POOL, ctx.P.accent, ...ctx.P.colors])]);
  const pairs = cs.flatMap((x, i) => cs.slice(i + 1).map(y => [x, y]));
  const widest = pairs.reduce((m, q) => labDist(...q) > labDist(...m) ? q : m, pairs[0] ?? [cs[0], mix(cs[0], ctx.P.bg, .5)]);
  // A checker takes the first random pair that clears the bar, for variety. A gradient always takes the widest pair,
  // so whatever hue difference the palette has is kept, then pushes it apart in lightness if still short.
  let [a, b] = grad ? widest : (pairs.find(([x, y]) => labDist(x, y) >= need) ?? widest);
  // Push b away from a; if a sits mid-lightness even white or black can be too close, so then pull a the other way too.
  if (labDist(a, b) < need) b = readable([b], a, need)[0];
  if (labDist(a, b) < need) a = readable([a], b, need)[0];
  const edges = (count, total, ph) => {
    const w = []; let sum = 0;
    for (let i = 0; i < count; i++) { const v = 1 + .82 * Math.sin(i / count * Math.PI * 2 + ph); w.push(v); sum += v; }
    const e = [0]; let acc = 0; for (let i = 0; i < count; i++) { acc += w[i] / sum * total; e.push(acc); } return e;
  };
  const xs = edges(cols, ctx.W, rand(0, 6.28)), ys = edges(rows, ctx.H, rand(0, 6.28));
  // SVG rects with crispEdges, not a div per cell. Each div was positioned with a centring transform and animated,
  // so its edges were rasterised with sub-pixel anti-aliasing: two soft edges meeting don't fill the pixel and the
  // ground shows through as a hairline seam — invisible between two similar colours, obvious once the colours are
  // strong. crispEdges rounds each edge to a device pixel, and neighbours share the same edge value, so they meet
  // exactly at any scale.
  const svg = svgRoot();
  svg.setAttribute('shape-rendering', 'crispEdges');
  for (let r = 0; r < rows; r++) {
    // one animated group per row rather than one per cell
    const g = document.createElementNS(NS, 'g');
    g.style.setProperty('--t0', 'none'); g.style.setProperty('--t1', 'none'); g.style.setProperty('--op', '1');
    g.style.animation = `fin .5s ease ${(r * .05).toFixed(2)}s both`;
    svg.appendChild(g);
    for (let c = 0; c < cols; c++) {
      // (cols−1)/(rows−1) so the far corner actually reaches b; over cols/rows the ramp stopped short at ~0.9
      const col = grad ? mix(a, b, (c / (cols - 1) + r / (rows - 1)) / 2) : ((r + c) % 2 ? a : b);
      const e = document.createElementNS(NS, 'rect');
      for (const [k, v] of [['x', xs[c]], ['y', ys[r]], ['width', xs[c + 1] - xs[c]], ['height', ys[r + 1] - ys[r]], ['fill', col]])
        e.setAttribute(k, typeof v === 'number' ? v.toFixed(2) : v);
      g.appendChild(e);
    }
  }
}
