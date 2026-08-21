import { ctx, ri, rand, shuffle, pick, chance, svgRoot, mix } from '../utils.js';
// Retro arcs: an arc-Truchet — each tile has thick concentric quarter-circle bands radiating from ONE
// corner (a random one of four per tile). The band count, stroke width, radii and per-band colours are
// GLOBAL constants, and arcs are centred on corners, so where neighbouring tiles share a corner their
// rings are the same size and continue seamlessly into larger circles — the structured 70s look. Each
// tile is clipped to itself so the thick strokes don't bleed. Background is shifting vertical stripes.
let uid = 0;
const CORNER = [ // [startX,startY, endX,endY, sweep] for a quarter arc of radius r from each corner
  (x, y, r) => [x + r, y, x, y + r, 1], (x, y, r) => [x - r, y, x, y + r, 0],
  (x, y, r) => [x - r, y, x, y - r, 1], (x, y, r) => [x + r, y, x, y - r, 0],
];
export default function retroArcs() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const cols = ri(5, 9), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw), s = svgRoot();
  const bands = ri(3, 6), sw = cw / bands * rand(.52, .72), off = ri(0, cs.length - 1);  // GLOBAL → tiles match
  // Band radii are r(a) = cw*(a-0.5)/bands, so r(a) + r(bands+1-a) = cw exactly. That means an arc of band a
  // struck from one end of a shared edge ENDS on the same point as an arc of band bands+1-a struck from the
  // other end — the two tiles' arcs join there. For the colour to carry through the join, the band sequence
  // has to be a palindrome: abccba over six bands, abcdcba over seven. Pick colours for the first half and
  // mirror them; without this every seam between opposite-corner tiles changes colour mid-curve.
  const pal = Array.from({ length: Math.ceil(bands / 2) }, (_, i) => cs[(i + off) % cs.length]);
  const bandColor = a => pal[Math.min(a - 1, bands - a)];
  const nb = rand(1) >= .5;  // no background
  const bgCol = i => nb ? 'none' : mix(cs[(i % cs.length + cs.length) % cs.length], ctx.P.bg, .12);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x0 = c * cw, y0 = r * cw;
    const id = `rc${uid++}`, cp = s.node('clipPath', { id });
    s.node('rect', { x: x0, y: y0, width: cw, height: cw }, cp);
    const g = s.node('g', { 'clip-path': `url(#${id})` });
    s.node('rect', { x: x0, y: y0, width: cw, height: cw + 1, fill: bgCol(ri(1, 4) * 2) }, g);      // shifting
    //s.node('rect', { x: x0, y: y0, width: cw / 2 + .5, height: cw + 1, fill: 'none'/*bgCol(2 * c)*/ }, g);      // shifting
    s.node('rect', { x: x0 + cw / 2, y: y0, width: cw / 2 + .5, height: cw + 1, fill: 'none'/*bgCol(2 * c + 1)*/ }, g); // vertical stripes
    const k = ri(0, 3), corner = [[x0, y0], [x0 + cw, y0], [x0 + cw, y0 + cw], [x0, y0 + cw]][k];
    for (let a = bands; a >= 1; a--) {
      const rr = (cw * (a - 0.5)) / bands, [sx, sy, ex, ey, sweep] = CORNER[k](corner[0], corner[1], rr);
      s.node('path', { d: `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${rr.toFixed(1)} ${rr.toFixed(1)} 0 0 ${sweep} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
        fill: 'none', stroke: bandColor(a), 'stroke-width': sw }, g);
    }
  }
}
