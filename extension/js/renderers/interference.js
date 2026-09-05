import { ctx, rand, ri, shuffle, chance, svgRoot, mix, clamp } from '../utils.js';
// Interference: a dot field where each dot is sized and coloured by the summed wavefronts from a few point
// sources — constructive crests vs destructive troughs. Ripple-tank physics as moiré pattern.
//
// The whole field is a handful of <path> nodes, not one element per dot. Every dot is only ever one of two
// colours, so a row's dots can be appended as subpaths of a single `d` — two paths per row instead of ~55
// divs. That takes the renderer from around 2200 elements to under a hundred, with identical output; a path
// costs the same whether it carries one circle or fifty.
export default function interference() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const a = cs[0], b = cs[1] || mix(a, ctx.P.bg, .55);
  const cols = ri(34, 54), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw) + 1;
  const k = rand(.045, .09);
  const srcs = Array.from({ length: ri(2, 3) }, () => [rand(.1, .9) * ctx.W, rand(.1, .9) * ctx.H]);
  const svg = svgRoot();
  const f = v => v.toFixed(1);
  // one circle as a subpath: two half-arcs, so many dots can share a single `d`
  const dot = (x, y, r) => `M ${f(x - r)} ${f(y)} A ${f(r)} ${f(r)} 0 1 0 ${f(x + r)} ${f(y)} A ${f(r)} ${f(r)} 0 1 0 ${f(x - r)} ${f(y)} Z`;
  for (let r = 0; r < rows; r++) {
    let dA = '', dB = '';
    for (let c = 0; c <= cols; c++) {
      const x = c * cw, y = (r + .5) * cw;
      let v = 0;
      for (const [sx, sy] of srcs) v += Math.cos(Math.hypot(x - sx, y - sy) * k);
      const t = v / srcs.length, sz = cw * (.12 + .52 * clamp(Math.abs(t), 0, 1));
      if (sz < 1) continue;
      if (t >= 0) dA += dot(x, y, sz / 2); else dB += dot(x, y, sz / 2);
    }
    const delay = Math.min(r * .015, .45);
    for (const [d, col] of [[dA, a], [dB, b]]) {
      if (!d) continue;
      const e = svg.node('path', { d, fill: col });
      e.style.setProperty('--t0', 'none'); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', '1');
      e.style.animation = `fin .5s ease ${delay.toFixed(3)}s both`;
    }
  }
}
