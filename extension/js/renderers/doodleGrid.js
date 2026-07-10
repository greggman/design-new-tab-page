import { ctx, ri, rand, times, shuffle, pick, chance, lum, svgRoot, mix } from '../utils.js';
// Doodle-patch grid: a grid of patches, each filled with a different hand-drawn stroke texture (dots,
// dashes, waves, grids, loops, rings, squiggles…) in an ink that contrasts the patch colour. SVG.
function tex(n, kind, x, y, w, h, ink, sw) {
  const m = Math.min(w, h) * .14, X = x + m, Y = y + m, W = w - 2 * m, H = h - 2 * m, cap = { 'stroke-linecap': 'round' };
  const j = () => rand(-2, 2);
  if (kind === 'dots') { const gx = ri(3, 6), gy = Math.max(2, Math.round(gx * H / W)); for (let iy = 0; iy < gy; iy++) for (let ix = 0; ix < gx; ix++) n('circle', { cx: X + (ix + .5) / gx * W + j(), cy: Y + (iy + .5) / gy * H + j(), r: Math.min(W / gx, H / gy) * rand(.12, .28), fill: ink }); return; }
  if (kind === 'checks') { const g = ri(3, 6), gy = Math.max(2, Math.round(g * H / W)); for (let iy = 0; iy < gy; iy++) for (let ix = 0; ix < g; ix++) if ((ix + iy) % 2) n('rect', { x: X + ix / g * W, y: Y + iy / gy * H, width: W / g + 1, height: H / gy + 1, fill: ink }); return; }
  if (kind === 'hdash' || kind === 'vdash') { const vert = kind === 'vdash', rows = ri(4, 8); for (let i = 0; i < rows; i++) { const p = (i + .5) / rows, main = vert ? X + p * W : Y + p * H; let q = 0, span = vert ? H : W; while (q < span) { const dl = span * rand(.06, .13); const a = q, b = Math.min(q + dl, span); n('line', vert ? { x1: main + j(), y1: Y + a, x2: main + j(), y2: Y + b, stroke: ink, 'stroke-width': sw, ...cap } : { x1: X + a, y1: main + j(), x2: X + b, y2: main + j(), stroke: ink, 'stroke-width': sw, ...cap }); q = b + span * rand(.04, .09); } } return; }
  if (kind === 'wave') { const rows = ri(3, 6); for (let i = 0; i < rows; i++) { const yy = Y + (i + .5) / rows * H, amp = H / rows * .35, seg = ri(3, 6); let d = `M ${X} ${yy}`; for (let k = 1; k <= seg; k++) { const xx = X + k / seg * W, cx = X + (k - .5) / seg * W, cy = yy + (k % 2 ? amp : -amp); d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${xx.toFixed(1)} ${yy.toFixed(1)}`; } n('path', { d, fill: 'none', stroke: ink, 'stroke-width': sw, ...cap }); } return; }
  if (kind === 'grid') { const gx = ri(3, 6), gy = ri(3, 6); for (let i = 1; i < gx; i++) n('line', { x1: X + i / gx * W + j(), y1: Y, x2: X + i / gx * W + j(), y2: Y + H, stroke: ink, 'stroke-width': sw }); for (let i = 1; i < gy; i++) n('line', { x1: X, y1: Y + i / gy * H + j(), x2: X + W, y2: Y + i / gy * H + j(), stroke: ink, 'stroke-width': sw }); return; }
  if (kind === 'loops') { times(ri(4, 9), () => { const cx = X + rand(0, W), cy = Y + rand(0, H), rr = Math.min(W, H) * rand(.06, .14); n('ellipse', { cx, cy, rx: rr, ry: rr * rand(.6, 1), fill: 'none', stroke: ink, 'stroke-width': sw, transform: `rotate(${ri(0, 180)} ${cx.toFixed(1)} ${cy.toFixed(1)})` }); }); return; }
  if (kind === 'rings') { const rings = ri(2, 4); for (let i = 1; i <= rings; i++) n('circle', { cx: X + W / 2, cy: Y + H / 2, r: Math.min(W, H) / 2 * i / rings, fill: 'none', stroke: ink, 'stroke-width': sw }); return; }
  // squiggle
  let xx = X + rand(0, W), yy = Y + rand(0, H), ang = rand(0, 6.28), d = `M ${xx.toFixed(1)} ${yy.toFixed(1)}`;
  times(ri(6, 12), () => { const len = Math.min(W, H) * rand(.15, .35); if (xx < X) ang = 0; else if (xx > X + W) ang = Math.PI; if (yy < Y) ang = 1.57; else if (yy > Y + H) ang = -1.57; ang += rand(-1, 1); const nx = xx + Math.cos(ang) * len, ny = yy + Math.sin(ang) * len, cx = xx + Math.cos(ang - .3) * len * .5, cy = yy + Math.sin(ang) * len * .5; d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}`; xx = nx; yy = ny; });
  n('path', { d, fill: 'none', stroke: ink, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
}
export default function doodleGrid() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const paper = mix(ctx.P.bg, '#ffffff', ctx.P.dark ? .05 : .45), inkD = mix(ctx.P.ink, ctx.P.bg, .05);
  const cols = ri(4, 7), rows = ri(4, 8), cw = ctx.W / cols, ch = ctx.H / rows, s = svgRoot();
  const kinds = ['dots', 'checks', 'hdash', 'vdash', 'wave', 'grid', 'loops', 'rings', 'squig'];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x0 = c * cw, y0 = r * ch;
    const bg = chance(.5) ? paper : chance(.6) ? pick(cs) : inkD;
    s.node('rect', { x: x0, y: y0, width: cw + 1, height: ch + 1, fill: bg });
    const ink = lum(bg) > .5 ? inkD : mix('#ffffff', bg, .15);
    tex(s.node, pick(kinds), x0, y0, cw, ch, ink, Math.min(cw, ch) * rand(.022, .045));
  }
}
