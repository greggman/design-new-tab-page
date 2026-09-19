import { ctx, rand, ri, pick, chance, shuffle, wpick, svgRoot, groundScheme, grid, rrange, labDist } from '../utils.js';
// Haida formline: the Northwest Coast design system. Everything is built from a few swelling, tapering forms —
//   ovoid   — a rounded, slightly squared bean with a flattened, faintly concave base;
//   U-form  — a thick-bottomed U whose arms taper to points;
//   split-U — a U holding a second, smaller U of the secondary colour;
//   eye     — an ovoid holding an inner ovoid eye.
// The primary formline (traditionally black) is thicker along the base than the top — each form is cut from
// the one beneath it with the hole shifted upward — the secondary (traditionally red) fills and outlines the
// in-between forms, and a tertiary colour tints some of the hollows. Designs are bilaterally symmetric: each
// panel is composed on its left half and mirrored, framed by a heavy formline border.
//
// Colours are the scheme's: ground, its line colour as the primary, and palette colours that stand clear of
// both for the secondary and tertiary.

const f1 = v => v.toFixed(1);
// unit-box shapes (0..1), written as absolute x y pairs so they can be mapped point by point
const OVOID = 'M.08 .55C.04 .14 .25 0 .5 0C.75 0 .96 .14 .92 .55C.9 .86 .77 1 .63 .95C.56 .91 .44 .91 .37 .95C.23 1 .1 .86 .08 .55Z';
const U = 'M0 0C0 .72 .16 1 .5 1C.84 1 1 .72 1 0L.87 0C.81 .44 .7 .6 .5 .6C.3 .6 .19 .44 .13 0Z';
const mapPath = (d, f) => d.replace(/(-?\d*\.?\d+)[ ,]+(-?\d*\.?\d+)/g, (_, a, b) => { const [x, y] = f(+a, +b); return f1(x) + ' ' + f1(y); });

export default function haida() {
  const { ground, fg, ink } = groundScheme();
  const { W, H, S } = ctx, svg = svgRoot();
  const apart = c => Math.min(labDist(c, ground), labDist(c, ink)), ranked = shuffle(fg).sort((p, q) => (apart(q) > .15) - (apart(p) > .15));
  const red = ranked[0] ?? ink, teal = ranked.find(c => c !== red && labDist(c, red) > .12) ?? ground;

  // panels: a grid of symmetric designs filling the screen
  const cols = W > H ? ri(2, 3) : ri(1, 2), rows = H > W ? ri(2, 3) : ri(1, 2), pw = W / cols, ph = H / rows;
  const bw = S * rand(.012, .018);
  grid(cols, rows, (c, r) => {
    const x0 = c * pw, y0 = r * ph, cx = x0 + pw / 2, inset = bw * 2.2;
    svg.node('rect', { x: f1(x0 + bw), y: f1(y0 + bw), width: f1(pw - bw * 2), height: f1(ph - bw * 2), rx: f1(pw * .06), fill: 'none', stroke: ink, 'stroke-width': f1(bw * 1.6) });
    // compose the left half as a treemap of cells, then mirror every shape about the panel's centre line
    const cells = [], half = { x: x0 + inset, y: y0 + inset, w: pw / 2 - inset, h: ph - inset * 2 }, min = Math.min(half.w, half.h) * rand(.32, .44);
    (function split(q) {
      const wide = q.w > q.h * 1.1, L = wide ? q.w : q.h;
      if (L < min * 1.9 || (L < min * 2.8 && chance(.4))) { cells.push(q); return; }
      const a = L * rand(.35, .65);
      if (wide) { split({ ...q, w: a }); split({ ...q, x: q.x + a, w: q.w - a }); }
      else { split({ ...q, h: a }); split({ ...q, y: q.y + a, h: q.h - a }); }
    })(half);
    rrange(0, cells.length, i => {
      const q = cells[i], pad = Math.min(q.w, q.h) * .035, bx = q.x + pad, by = q.y + pad, w = q.w - pad * 2, h = q.h - pad * 2;
      const draw = (d, fill) => {
        for (const m of [1, -1]) svg.node('path', { d: mapPath(d, (u, v) => { const x = bx + u * w; return [m > 0 ? x : 2 * cx - x, by + v * h]; }), fill });
      };
      // a unit shape placed into a sub-box of the cell (fractions of the cell), optionally turned in 90° steps
      const sub = (d, sx, sy, sw, sh, rot = 0) => mapPath(d, (u, v) => {
        u = sx + u * sw; v = sy + v * sh;
        for (let k = 0; k < rot; k++) [u, v] = [1 - v, u];   // turn the whole cell, so a U's hollow turns with it
        return [u, v];
      });
      const primary = chance(.7) ? ink : red, hollow = pick([ground, ground, teal, primary === ink ? red : ink]);
      // ovoids are squat — only cells of a similar shape get one; tall or very wide cells get a U, turned to fit
      const asp = w / h, squat = asp > .85 && asp < 2.4;
      const kind = wpick([['eye', squat && w > S * .08 ? 3 : 0], ['ovoid', squat ? 2 : 0], ['U', 2], ['splitU', 1.5]]);
      if (kind === 'eye' || kind === 'ovoid') {
        const flip = kind === 'ovoid' && chance(.25);
        const o = (d, ...b) => { const s = sub(d, ...b); return flip ? mapPath(s, (u, v) => [u, 1 - v]) : s; };
        draw(o(OVOID, 0, 0, 1, 1), primary);
        draw(o(OVOID, .14, .1, .72, .66), hollow);
        if (kind === 'eye') {
          draw(o(OVOID, .27, .22, .46, .42), ink);
          draw(o(OVOID, .38, .33, .24, .18), hollow === ink ? ground : hollow);
        } else draw(o(OVOID, .3, .26, .4, .34), pick([red, teal, ink].filter(c => c !== hollow)));
      } else {
        const rot = asp < .8 ? pick([1, 3]) : asp > 1.25 ? pick([0, 2]) : ri(0, 3);
        draw(sub(U, 0, 0, 1, 1, rot), primary);
        const inner = kind === 'splitU' ? (primary === red ? ink : red) : pick([teal, ground]);
        // the hollow of the U, and in a split-U a second U nested inside it
        draw(sub(OVOID, .2, .06, .6, .48, rot), inner === ground ? ground : hollow);
        if (kind === 'splitU') draw(sub(U, .28, .08, .44, .42, rot), inner);
      }
    }, { dur: .8 });
  }, { order: pick(['random', 'centreOutH', 'radialOut']) });
}
