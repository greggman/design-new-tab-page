import { ctx, ri, rand, pick, chance, svgRoot, lum, mix } from '../utils.js';
// Mobiles: a 1950s atomic "beads on strings" print. Loosely vertical columns of INDEPENDENT motifs —
// each a lopsided gray oval with a contrasting lopsided inner oval, and its own tapering spike up and one
// down (attached at random points across the oval). Spikes carry stacks of 0/3/4/5 thin stroked rings;
// bigger inner ovals hold a narrow shell-fan of rays. Motifs just overlap; they aren't linked.
const K = .5523;
export default function mobiles() {
  const bg = ctx.P.bg;
  // body colour of the ovals + spikes — ONE per composition: sometimes a neutral gray, otherwise a palette tone
  const bodyCand = [ctx.P.accent, ...ctx.POOL].filter(c => Math.abs(lum(c) - lum(bg)) > .2);
  const body = (chance(.4) || !bodyCand.length) ? mix(ctx.P.ink, bg, rand(.42, .52)) : pick(bodyCand);
  const ringCol = mix(body, ctx.P.ink, .5);                           // darker thin rings
  const inks = [...new Set([ctx.P.accent, ...ctx.POOL, ctx.P.ink])].filter(c => Math.abs(lum(c) - lum(body)) > .16);
  if (inks.length < 2) inks.push(ctx.P.accent, ctx.P.ink);
  const s = svgRoot(), f = v => (+v).toFixed(1);
  s.node('rect', { x: 0, y: 0, width: ctx.W, height: ctx.H, fill: bg });
  // lopsided OVAL: a real ellipse whose 4 cardinal anchors each slide tangentially (top/bottom sideways,
  // left/right up-down), joined by κ béziers — smooth and oval, just asymmetric.
  const oval = (cx, cy, rx, ry, amp) => {
    const T = [cx + rand(-amp, amp) * rx, cy - ry], R = [cx + rx, cy + rand(-amp, amp) * ry],
      B = [cx + rand(-amp, amp) * rx, cy + ry], L = [cx - rx, cy + rand(-amp, amp) * ry], kx = K * rx, ky = K * ry;
    return `M ${f(T[0])} ${f(T[1])}`
      + ` C ${f(T[0] + kx)} ${f(T[1])} ${f(R[0])} ${f(R[1] - ky)} ${f(R[0])} ${f(R[1])}`
      + ` C ${f(R[0])} ${f(R[1] + ky)} ${f(B[0] + kx)} ${f(B[1])} ${f(B[0])} ${f(B[1])}`
      + ` C ${f(B[0] - kx)} ${f(B[1])} ${f(L[0])} ${f(L[1] + ky)} ${f(L[0])} ${f(L[1])}`
      + ` C ${f(L[0])} ${f(L[1] - ky)} ${f(T[0] - kx)} ${f(T[1])} ${f(T[0])} ${f(T[1])} Z`;
  };
  const spike = (bx, by, ax, ay, hw) => s.node('polygon', { points: `${f(bx - hw)},${f(by)} ${f(bx + hw)},${f(by)} ${f(ax)},${f(ay)}`, fill: body });
  const rings = (x0, y0, x1, y1, w) => {
    const n = pick([0, 3, 4, 5]), sw = Math.max(1, ctx.S * .003);
    for (let i = 0; i < n; i++) { const t = (i + .5) / n, ew = w * rand(.8, 1.1);
      s.node('ellipse', { cx: f(x0 + (x1 - x0) * t), cy: f(y0 + (y1 - y0) * t), rx: f(ew), ry: f(ew * rand(.28, .4)), fill: 'none', stroke: ringCol, 'stroke-width': f(sw) }); }
  };
  const fan = (cx, cy, rx, ry, col) => {                              // narrow (~70°) shell-fan of rays
    const spread = rand(50, 92) * Math.PI / 180, mid = Math.PI / 2 + rand(-.35, .35);
    const ax = cx + rand(-.18, .18) * rx, ay = cy - ry * rand(.4, .72), Kn = ri(16, 24), sw = Math.max(.6, ctx.S * .0016);
    for (let k = 0; k < Kn; k++) { const a = (k + rand(-0.25, 0.25)) * Math.PI * 2 / Kn; 
      s.node('line', { x1: f(ax), y1: f(ay), x2: f(cx + Math.cos(a) * rx * .92), y2: f(cy + Math.sin(a) * ry * .92), stroke: col, 'stroke-width': f(sw) }); }
  };
  const spacing = ctx.S * rand(.15, .2), N = Math.round(ctx.W * ctx.H / (spacing * spacing)), hw = ctx.S * rand(.012, .022);
  const motifs = [];
  for (let i = 0; i < N; i++) {                                       // independent motifs at random positions
    const big = chance(.5), rx = ctx.S * (big ? rand(.08, .13) : rand(.035, .06)), ry = rx * rand(.55, .72);
    const x = rand(-.03, 1.03) * ctx.W, y = rand(-.03, 1.03) * ctx.H;
    motifs.push({ x, y, rx, ry, big, topX: x + rand(-.25, .25) * rx, botX: x + rand(-.25, .25) * rx });   // spikes attach independently
  }
  for (const b of motifs) {                                          // pass 1: each motif's own spikes + rings (under)
    const uy = b.y - b.ry * .55, dy = b.y + b.ry * .55, upLen = ctx.S * rand(.08, .22), dnLen = ctx.S * rand(.07, .2);
    spike(b.topX, uy, b.topX, uy - upLen, hw);                        // straight up (apex x = base x)
    rings(b.topX, uy - upLen * .92, b.topX, uy - upLen * .1, ctx.S * rand(.014, .026));
    spike(b.botX, dy, b.botX, dy + dnLen, hw);                        // straight down
    rings(b.botX, dy + dnLen * .1, b.botX, dy + dnLen * .92, ctx.S * rand(.014, .026));
  }
  for (const b of motifs) {                                          // pass 2: ovals on top
    s.node('path', { d: oval(b.x, b.y, b.rx, b.ry, rand(.16, .32)), fill: body });
    const inner = pick(inks);
    s.node('path', { d: oval(b.x, b.y, b.rx * rand(.55, .72), b.ry * rand(.55, .72), rand(.18, .36)), fill: inner });
    if (b.big && chance(.7)) fan(b.x, b.y, b.rx * .58, b.ry * .58, lum(inner) > .5 ? mix(inner, '#000000', .5) : mix(inner, '#ffffff', .55));
  }
}
