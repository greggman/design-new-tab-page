import { ctx, ri, clamp, rand, times, shuffle, rings, chance, circle, pick } from '../utils.js';
// Bullseye grid: a regular grid of concentric-ring targets. Strong repetition of a single radial
// motif; one cell optionally swapped for a solid disc to break the pattern and create a focal point.
export default function bullseyeGrid() {
  const cols = ri(3, 7), rows = clamp(Math.round(cols * ctx.H / ctx.W), 2, 7), cw = ctx.W / cols, ch = ctx.H / rows, cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const fc = chance(.55) ? [ri(0, cols - 1), ri(0, rows - 1)] : null;
  times(rows, r => times(cols, c => {
    const x = (c + .5) * cw, y = (r + .5) * ch, R = Math.min(cw, ch) * rand(.36, .48);
    if (fc && c === fc[0] && r === fc[1]) { circle({ x, y, w: R * 2, h: R * 2, color: ctx.P.accent, z: 3 }); return; }
    rings({ x, y, r: R, colors: shuffle(cs), rw: R * rand(.18, .3) });
  }));
}
