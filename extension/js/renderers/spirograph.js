import { ctx, rand, ri, chance, pick, shuffle, clamp, svgRoot } from '../utils.js';
// Spirograph: hypotrochoids — the curve traced by a pen in a small gear rolling inside a big one. Two to
// four of them, concentric, at different weights, drawing themselves on in sequence.
//
// The whole character of the thing is in the gear ratio. A curve of R and r teeth has R/gcd(R,r) petals and
// closes after r/gcd(R,r) revolutions, so small numbers give almost nothing: the old R=ri(5,9), r=ri(2,7)
// put 23 of its 30 possible pairs under eight petals, and R=6/r=3 draws literally two. A real Spirograph
// ring is 96 teeth against a 63-tooth wheel — 32 petals over 21 revolutions — so the numbers here are that
// size, and rejected unless they're dense enough to read as lacework.
//
// Each curve is cut into arcs that reveal in order, rather than left as one path for svgRoot's stroke
// draw-on. That helper normalises with pathLength="1", and on a curve whose real length is ~30000px that's a
// 30000x scale factor on the dash pattern — right where dashing stops being dependable, and if it silently
// does nothing the "reveal" shows the whole curve at t=0. Cutting the curve up makes the reveal geometric
// instead: arcs fade in along the path, so the pen appears to trace it using only opacity.
//
// Hence fill:transparent rather than fill:none — visually identical, but it keeps svgRoot from classing
// these as stroke-draw-on shapes and pinning stroke-dashoffset to 1, which would hide them permanently once
// the animation below replaces the one it installed.
const gcd = (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; };
export default function spirograph() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const svg = svgRoot();
  // Off-centre as often as not — dead centre every time is what makes a rosette feel like a diagram.
  const cx = ctx.W / 2 + (chance(.6) ? ctx.W * rand(-.19, .19) : 0);
  const cy = ctx.H / 2 + (chance(.6) ? ctx.H * rand(-.17, .17) : 0);
  const n = ri(2, 4);
  // Distinct weights per curve rather than one width for all: a heavy outline over fine lacework is most of
  // what makes these read as drawn rather than plotted.
  const w0 = ctx.S * rand(.0012, .0022), mults = shuffle([.55, 1, 1.7, 2.6]);
  const spin = rand(0, Math.PI * 2);
  // One budget for the whole reveal. Accumulating a per-curve delay instead ran to over 3s on four curves,
  // where the rest of the system settles inside ~1s. Later curves start later, but everything lands by `total`.
  const total = rand(1.1, 1.7);
  for (let c = 0; c < n; c++) {
    let R, r, g, petals, revs, tries = 0;
    do { R = ri(40, 110); r = ri(18, R - 12); g = gcd(R, r); petals = R / g; revs = r / g; }
    while (++tries < 60 && (petals < 16 || revs < 7));
    const d = r * rand(.45, 1);                        // pen offset in the wheel; near r spikes the lobes
    const k = ctx.S * (.46 - c * .055) * rand(.94, 1.04) / ((R - r) + d);
    const f = (R - r) / r, period = Math.PI * 2 * revs;
    const pts = Math.min(6000, Math.max(1600, petals * 60));
    const P = [];
    for (let i = 0; i <= pts; i++) {
      const th = i / pts * period + spin;
      P.push([cx + k * ((R - r) * Math.cos(th) + d * Math.cos(f * th)),
        cy + k * ((R - r) * Math.sin(th) - d * Math.sin(f * th))]);
    }
    const arcs = clamp(Math.round(pts / 260), 8, 26);
    const start = c / n * total * .5, span = total - start;
    const stroke = cs[c % cs.length], width = Math.max(.7, w0 * mults[c % mults.length]);
    const op = rand(.72, .95);
    for (let j = 0; j < arcs; j++) {
      const a = Math.floor(j * pts / arcs), b = Math.floor((j + 1) * pts / arcs);
      let path = '';
      for (let i = a; i <= b; i++) path += `${i === a ? 'M' : 'L'}${P[i][0].toFixed(1)} ${P[i][1].toFixed(1)}`;
      const e = svg.node('path', {
        d: path, fill: 'transparent', stroke, 'stroke-width': width, 'stroke-linecap': 'round',
        'stroke-linejoin': 'round', opacity: op,
      });
      // Overwrite svgRoot's own stagger: arcs must come in ALONG the curve, and each curve after the last.
      e.style.animation = `fin ${(span / arcs * 2.4).toFixed(3)}s ease ${(start + j / arcs * span).toFixed(3)}s both`;
    }
  }
}
