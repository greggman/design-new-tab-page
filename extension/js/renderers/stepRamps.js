import { ctx, ri, rand, pick, chance, shuffle, box, bgFull, mix } from '../utils.js';
// Step ramps: the canvas sliced into colour bands whose shared edge is a staircase rather than a straight
// line. Every band follows the SAME step profile, offset by one band thickness, so they nest and the whole
// field reads as stepped diagonals — a ramp, a V, or a zigzag — laid up as separate tiles.
//
// This replaces the old Staircase, which drew one ramp of columns anchored to the baseline and left most of
// the canvas empty: a sorted bar chart. The fix isn't a better ramp, it's making the ramp a boundary between
// filled regions instead of a silhouette against dead ground.
export default function stepRamps() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const cols = ri(7, 16), sw = ctx.W / cols;
  const band = ctx.H / ri(5, 12);
  // How far the profile shifts per column, as a fraction of a band. The whole pattern turns on this ratio and
  // it has to sit NEAR 1 — that's what advances the colour index about one step per column and makes the eye
  // join the blocks into a diagonal. Small fractions (1/4, 1/3) barely shift anything and read as brickwork;
  // exactly 1/2 realigns every other column into a checkerboard. Hence a list, not a range.
  const rise = band * pick([2 / 3, 3 / 4, 1, 1, 1, 5 / 4, 4 / 3]);
  const kind = pick(['ramp', 'ramp', 'v', 'zig']);
  const flipX = chance(.5), flipY = chance(.5);
  const period = ri(3, 7);                          // zigzag half-period, in columns
  // Several bands share a colour, so each diagonal stripe is a few tiles THICK. One-tile stripes only read as
  // a diagonal while the tiles touch and merge; once the gutter separates them, a palette of three or four
  // colours cycling every tile is just a checkerboard.
  const grp = ri(2, 4);
  // Hold the blocks apart. Butted edge to edge the field is just flat colour regions with a stepped border,
  // which reads as basic; a gutter turns the same geometry into laid tiles and the ground becomes grout. Keep
  // it THIN, though — open it up much past a tenth of a module and the eye stops joining the blocks into a
  // continuous diagonal and just sees a grid of loose tiles.
  const gap = Math.max(2, Math.min(sw, band) * rand(.04, .09));
  const mid = (cols - 1) / 2;
  // Profile in pixels: how far this column's bands are pushed down the canvas.
  const profile = c => {
    const i = flipX ? cols - 1 - c : c;
    if (kind === 'v') return Math.abs(i - mid) * rise;
    if (kind === 'zig') { const t = i % (period * 2); return (t < period ? t : period * 2 - t) * rise; }
    return i * rise;
  };
  const at = k => cs[((k % cs.length) + cs.length) % cs.length];
  bgFull({ background: mix(ctx.P.ink, ctx.P.bg, .22) });   // the grout behind the gutters
  for (let c = 0; c < cols; c++) {
    const p = profile(c);
    // Bands are indexed globally off the profile, so band k is the same colour in every column and its edge
    // steps from one column to the next. Run past both edges — the profile pushes bands off-canvas.
    const lo = Math.floor(-p / band) - 1, hi = Math.ceil((ctx.H - p) / band) + 1;
    for (let k = lo; k <= hi; k++) {
      const y = p + (k + .5) * band;
      box({ x: (c + .5) * sw, y: flipY ? ctx.H - y : y, w: sw - gap, h: band - gap, color: at(Math.floor(k / grp)) });
    }
  }
}
