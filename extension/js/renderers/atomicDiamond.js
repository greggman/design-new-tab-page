import { ctx, ri, rand, pick, chance, svgRoot, mix, hexToOklch, groundScheme } from '../utils.js';
// Atomic diamond: a mid-century scatter of tall motifs on a ground of any colour — solid ones, outlined ones,
// and little atomic starbursts (spokes tipped with beads). The motif shape (diamond / oval / lopsided
// rounded-rect) is chosen once for the whole field. Outlines and spokes draw themselves on. 1950s Eames.
export default function atomicDiamond() {
  // Ground: any palette hue at any lightness (it used to be P.bg, so every render was cream or near-black).
  const { ground, fg: fills, ink, soft, gL } = groundScheme();
  // Every starburst is a fistful of spokes and beads. They're thin, so they take ink eased toward the ground,
  // or a palette colour that clears the ground by LIGHTNESS — hue contrast alone disappears in a stroke.
  const spokeOpts = fills.filter(c => Math.abs(hexToOklch(c)[0] - gL) > .3);
  const spoke = spokeOpts.length && chance(.3) ? pick(spokeOpts) : mix(ink, ground, rand(.08, .22));
  const neutral = soft;                                                 // outline colour
  const s = svgRoot(), f = v => (+v).toFixed(1);
  const mode = pick(['diamond', 'oval', 'rrect']);
  // round every corner of a polygon (quadratic fillets), so a jittered quad reads as a soft rounded rect
  const roundedPoly = (pts, r) => {
    const n = pts.length; let d = '';
    for (let i = 0; i < n; i++) {
      const p = pts[(i - 1 + n) % n], v = pts[i], nx = pts[(i + 1) % n];
      const ux = p[0] - v[0], uy = p[1] - v[1], lu = Math.hypot(ux, uy) || 1;
      const wx = nx[0] - v[0], wy = nx[1] - v[1], lw = Math.hypot(wx, wy) || 1;
      const ra = Math.min(r, lu / 2), rb = Math.min(r, lw / 2);
      const ax = v[0] + ux / lu * ra, ay = v[1] + uy / lu * ra;
      const bx = v[0] + wx / lw * rb, by = v[1] + wy / lw * rb;
      d += (i ? `L ${f(ax)} ${f(ay)}` : `M ${f(ax)} ${f(ay)}`) + ` Q ${f(v[0])} ${f(v[1])} ${f(bx)} ${f(by)}`;
    }
    return d + ' Z';
  };
  // lopsided rounded-rect: the four rectangle corners each nudged a little, then all corners rounded
  const rr = (cx, cy, hw, hh) => { const j = .18, jit = () => 1 + rand(-j, j);
    const pts = [[cx - hw * jit(), cy - hh * jit()], [cx + hw * jit(), cy - hh * jit()], [cx + hw * jit(), cy + hh * jit()], [cx - hw * jit(), cy + hh * jit()]];
    return roundedPoly(pts, hw * rand(.35, .55)); };
  const shape = (cx, cy, hw, hh, a) => {
    if (mode === 'oval') s.node('ellipse', { cx: f(cx), cy: f(cy), rx: f(hw), ry: f(hh), ...a });
    else if (mode === 'diamond') s.node('polygon', { points: `${f(cx)},${f(cy - hh)} ${f(cx + hw)},${f(cy)} ${f(cx)},${f(cy + hh)} ${f(cx - hw)},${f(cy)}`, ...a });
    else s.node('path', { d: rr(cx, cy, hw, hh), ...a });
  };
  const burst = (cx, cy, r) => {                                       // atomic starburst — spokes + bead tips
    const n = ri(6, 9), base = rand(0, 6.28), sw = Math.max(1, r * .06);
    for (let i = 0; i < n; i++) {
      const ang = base + i / n * 2 * Math.PI + rand(-.12, .12), rr2 = r * rand(.55, 1);
      const ex = cx + Math.cos(ang) * rr2, ey = cy + Math.sin(ang) * rr2;
      s.node('line', { x1: f(cx), y1: f(cy), x2: f(ex), y2: f(ey), stroke: spoke, 'stroke-width': f(sw), 'stroke-linecap': 'round' });
      s.node('circle', { cx: f(ex), cy: f(ey), r: f(r * rand(.08, .13)), fill: spoke });
    }
    s.node('circle', { cx: f(cx), cy: f(cy), r: f(r * .12), fill: spoke });
  };
  // random scatter (not a grid); count driven by area so the field stays dense
  const spacing = ctx.S * rand(.095, .125), N = Math.round(ctx.W * ctx.H / (spacing * spacing));
  const sw = Math.max(1.5, ctx.S * .006), bursts = [];
  const size = () => chance(.22) ? ctx.S * rand(.05, .075) : ctx.S * rand(.018, .045);   // ~4× range, mostly small
  for (let i = 0; i < N; i++) {
    const cx = rand(-.03, 1.03) * ctx.W, cy = rand(-.03, 1.03) * ctx.H;
    const kind = pick(['solid', 'solid', 'solid', 'outline', 'outline', 'outline', 'burst', 'burst']);
    if (kind === 'burst') { bursts.push([cx, cy, ctx.S * rand(.025, .055)]); continue; }   // deferred → drawn on top
    const hw = size(), hh = hw * rand(1.6, 2.3);
    if (kind === 'solid') shape(cx, cy, hw, hh, { fill: pick(fills) });
    else shape(cx, cy, hw, hh, { fill: 'none', stroke: neutral, 'stroke-width': f(sw), 'stroke-linejoin': 'round' });
  }
  for (const [cx, cy, r] of bursts) burst(cx, cy, r);   // atoms/stars always on top
}
