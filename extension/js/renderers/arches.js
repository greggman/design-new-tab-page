import { ctx, rand, pick, chance, box } from '../utils.js';
// Arches: a 70s tile print. A grid built left-to-right, top-to-bottom. Every tile is a solid colour OR a
// single quarter-circle (no half-circles). Normally a tile's top colour = the tile-above's bottom colour,
// so a solid continues its column and a quarter-circle (disc = new colour flowing down, base = colour
// above, showing in the corner) is the only way a column changes colour. Rules:
//   • a standalone quarter-circle is a top-LEFT; a top-RIGHT only appears right of a top-left, completing
//     a two-wide rounded arch whose two halves are their own colours;
//   • right of a top-left you can only be a solid (colour ≠ the top-left's right side) or that top-right;
//   • no three same-colour solids in a row horizontally;
//   • a solid is a bit likelier directly under a quarter-circle;
//   • ~10% of the time the vertical rule is broken with a BOTTOM quarter-circle: its bottom (not top)
//     equals the colour above, a new colour sits on top, and a bottom-left's left colour ≠ the left tile's
//     right colour.
const NL = '100% 0 0 0', NR = '0 100% 0 0';                          // TOP quarter-circles: curve at the top (notch top-left / top-right)
const BL = '0 0 0 100%', BR = '0 0 100% 0';                          // BOTTOM quarter-circles: curve at the bottom (notch bottom-left / -right)
export default function arches() {
  const cs = [...new Set([ctx.P.bg, ctx.P.ink, ctx.P.accent, ...ctx.P.colors])];
  const cell = Math.max(20, Math.round(ctx.S * rand(.075, .12)));
  const cols = Math.ceil(ctx.W / cell) + 1, rows = Math.ceil(ctx.H / cell) + 1;
  const other = a => { let c; do { c = pick(cs); } while (c === a && cs.length > 1); return c; };
  const solid = (C, R, color) => box({ x: (C + .5) * cell, y: (R + .5) * cell, w: cell + 2, h: cell + 2, color });
  const qc = (C, R, disc, base, radius) => { solid(C, R, base); box({ x: (C + .5) * cell, y: (R + .5) * cell, w: cell + 2, h: cell + 2, color: disc, radius }); };
  const above = Array.from({ length: cols }, () => pick(cs));
  const qcAbove = new Array(cols).fill(false);                       // was the tile directly above a quarter-circle?
  for (let R = 0; R < rows; R++) {
    let arch = null, runColor = null, runLen = 0, prevRight = null;  // arch: top-left's right colour to my left; run: horizontal same-colour solids; prevRight: left tile's right colour
    for (let C = 0; C < cols; C++) {
      const top = above[C];                                          // colour above me
      if (chance(.1)) {                                              // BREAK: bottom quarter-circle — bottom keeps `top`, new colour on top
        let nx = other(top), side = chance(.5);                      // side true = bottom-left
        if (side) { let g = 0; while (nx === prevRight && g++ < 8) nx = other(top); }   // bottom-left: left colour ≠ left tile's right
        qc(C, R, nx, top, side ? BL : BR);                          // base = colour above (keeps the bottom); disc = new colour, curving at the bottom
        above[C] = top; qcAbove[C] = true; arch = null; runColor = null; runLen = 0; prevRight = nx;
        continue;
      }
      const solidP = qcAbove[C] ? .72 : .5;                          // solid likelier under a quarter-circle
      const forbidSolid = runColor === top && runLen >= 2;          // no 3rd same-colour solid in a row
      const canSolid = !forbidSolid && (arch === null || top !== arch);
      if (canSolid && chance(solidP)) {                              // solid → continues my column colour
        solid(C, R, top); above[C] = top; qcAbove[C] = false;
        runLen = runColor === top ? runLen + 1 : 1; runColor = top; arch = null; prevRight = top;
      } else {                                                       // top-right completes an arch; else a fresh top-left
        const bot = other(top), tr = arch !== null;
        qc(C, R, bot, top, tr ? NR : NL); above[C] = bot; qcAbove[C] = true;
        runColor = null; runLen = 0; arch = tr ? null : bot; prevRight = bot;
      }
    }
  }
}
