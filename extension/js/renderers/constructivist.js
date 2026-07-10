import { ctx, ri, rand, times, shuffle, pick, chance, svgRoot, lum } from '../utils.js';
// Constructivist: a vertical-column collage on a dark ground — blocks, pills (rounded-end bars), dot
// columns, thin/segmented/2-tone lines, and circles (some clipped by a ground rect), mostly running
// vertically with a few horizontal accents. Bauhaus / mid-century poster. SVG.
export default function constructivist() {
  const [bg, light] = lum(ctx.P.bg) < lum(ctx.P.ink) ? [ctx.P.bg, ctx.P.ink] : [ctx.P.ink, ctx.P.bg];
  const cs = shuffle([light, light, ...ctx.POOL, ctx.P.accent]), col = () => pick(cs);
  const s = svgRoot(), f = v => (+v).toFixed(1);
  if (chance(0.25)) s.node('rect', { x: 0, y: 0, width: ctx.W, height: ctx.H, fill: bg });
  const rr = (x, y, w, h, fill, round = 0) => s.node('rect', { x: f(x), y: f(y), width: f(Math.max(1, w)), height: f(Math.max(1, h)), rx: f(round), ry: f(round), fill });
  const cc = (cx, cy, r, fill) => s.node('circle', { cx: f(cx), cy: f(cy), r: f(Math.max(.5, r)), fill });
  const ln = (x1, y1, x2, y2, w, stroke) => s.node('line', { x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2), stroke, 'stroke-width': f(w), 'stroke-linecap': 'round' });
  const dotsV = (x, y0, y1, r, c) => { const gap = r * rand(2.2, 3.2); for (let y = y0; y <= y1; y += gap) cc(x, y, r, c); };
  const segV = (x, y0, y1, th, ca, cb) => { const t = (y1 - y0) / 3; rr(x - th / 2, y0, th, t, ca, th / 2); dotsV(x, y0 + t + th, y0 + 2 * t - th, th * .6, pick([cb, light, ca])); rr(x - th / 2, y0 + 2 * t, th, t, cb, th / 2); };

  const base = ctx.W / rand(7, 12);
  for (let x = 0; x < ctx.W;) {
    const w = Math.min(base * rand(.35, 2.4), ctx.W - x), cx = x + w / 2, x0 = x;
    x += w;
    switch (pick(['block', 'block', 'pills', 'dots', 'lines', 'circles', 'segs'])) {
      case 'block': { const y0 = rand(0, .3) * ctx.H, y1 = rand(.6, 1) * ctx.H; rr(x0 + w * .02, y0, w * rand(.7, .98), y1 - y0, col(), chance(.4) ? w / 2 : 0); if (chance(.35)) rr(x0 + w * .04, y0, w * rand(.4, .7), (y1 - y0) * rand(.3, .6), col()); break; }
      case 'pills': { let y = rand(0, .15) * ctx.H; while (y < ctx.H * rand(.7, 1)) { const hh = ctx.S * rand(.08, .2), pw = w * rand(.45, .8); rr(cx - pw / 2, y, pw, hh, col(), pw / 2); y += hh + ctx.S * rand(.02, .05); } break; }
      case 'dots': dotsV(cx + rand(-w * .2, w * .2), rand(0, .1) * ctx.H, rand(.7, 1) * ctx.H, w * rand(.12, .22), col()); break;
      case 'lines': times(ri(1, 3), i => { const lx = x0 + (i + 1) / 4 * w + rand(-w * .08, w * .08), y0 = rand(0, .25) * ctx.H, y1 = rand(.55, 1) * ctx.H; if (chance(.4)) segV(lx, y0, y1, ctx.S * rand(.012, .022), col(), col()); else ln(lx, y0, lx, y1, ctx.S * rand(.008, .018), col()); }); break;
      case 'circles': { let y = rand(0, .12) * ctx.H; while (y < ctx.H * rand(.7, 1)) { const r = w * rand(.3, .48); cc(cx, y + r, r, col()); if (chance(.45)) cc(cx, y + r, r * rand(.35, .55), col()); y += r * 2 + ctx.S * rand(.02, .06); } break; }
      case 'segs': segV(cx, rand(0, .2) * ctx.H, rand(.6, 1) * ctx.H, ctx.S * rand(.016, .03), col(), col()); break;
    }
  }
  // big circles spanning columns, some sliced flat by a ground-coloured rect
  times(ri(2, 5), () => { const r = ctx.S * rand(.12, .28), bx = rand(.1, .9) * ctx.W, by = rand(.12, .9) * ctx.H; cc(bx, by, r, col()); if (chance(.5)) cc(bx, by, r * rand(.3, .55), col()); if (chance(.0005)) rr(bx - r - 2, by + (chance(.5) ? 0 : -r), r * 2 + 4, r, bg); });
  // horizontal pill-stack accents (the opposite-direction repeats)
  times(ri(1, 3), () => { const ax = rand(.02, .55) * ctx.W, ay = rand(.05, .9) * ctx.H, n = ri(3, 6), th = ctx.S * rand(.013, .026), len = ctx.S * rand(.1, .24); for (let i = 0; i < n; i++) rr(ax, ay + i * th * rand(1.7, 2.4), len * rand(.7, 1.1), th, col(), th / 2); });
}
