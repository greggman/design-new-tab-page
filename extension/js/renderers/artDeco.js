import { ctx, ri, rand, shuffle, pick, chance, box, svgRoot, mix } from '../utils.js';
// Art Deco palmettes: columns of leaf/shield motifs with a fan of veins (1920s wallpaper, ref image
// #1). Heavily parameterised so each render differs: leaf proportions, up / down / alternating
// orientation (the palmette flip), vein style & count, colour mode, column stagger and density.

// Pointed ogee leaf between a `tip` end and a wide `base` end (base can be above OR below the tip).
function ogee(cx, tipY, baseY, w, p) {
  const hw = w / 2, h = baseY - tipY, midY = tipY + h * p.mid;
  return `M ${cx} ${tipY}`
    + ` C ${cx + hw * p.tip} ${tipY + h * p.shoulder} ${cx + hw * p.side} ${midY - h * .12} ${cx + hw * p.side} ${midY}`
    + ` C ${cx + hw * p.side} ${midY + h * .26} ${cx + hw * .5} ${baseY - h * .04} ${cx} ${baseY}`
    + ` C ${cx - hw * .5} ${baseY - h * .04} ${cx - hw * p.side} ${midY + h * .26} ${cx - hw * p.side} ${midY}`
    + ` C ${cx - hw * p.side} ${midY - h * .12} ${cx - hw * p.tip} ${tipY + h * p.shoulder} ${cx} ${tipY} Z`;
}
function veins(s, cx, tipY, baseY, w, style, n, col, vw, p) {
  const h = baseY - tipY, hw = w / 2, f = v => v.toFixed(1);
  s.node('path', { d: `M ${f(cx)} ${f(baseY)} L ${f(cx)} ${f(tipY + h * .1)}`, stroke: col, 'stroke-width': vw * 1.3, fill: 'none', 'stroke-linecap': 'round' });
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1), ex = hw * p.side * .85 * t, ey = tipY + h * (.12 + .5 * (1 - t)), qy = baseY - h * .45;
    const seg = (sx,   d) => s.node('path', { d, stroke: col, 'stroke-width': vw, fill: 'none', 'stroke-linecap': 'round' });
    if (style === 'straight') { seg(0, `M ${f(cx)} ${f(baseY)} L ${f(cx + ex)} ${f(ey)}`); seg(0, `M ${f(cx)} ${f(baseY)} L ${f(cx - ex)} ${f(ey)}`); }
    else { seg(0, `M ${f(cx)} ${f(baseY)} Q ${f(cx + ex * .5)} ${f(qy)} ${f(cx + ex)} ${f(ey)}`); seg(0, `M ${f(cx)} ${f(baseY)} Q ${f(cx - ex * .5)} ${f(qy)} ${f(cx - ex)} ${f(ey)}`); }
  }
}
export default function artDeco() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const cols = ri(3, 8), cw = ctx.W / cols, leafH = cw * rand(1.1, 2.0), overlap = rand(.8, 1.0), lwf = rand(.8, .99);
  const p = { mid: rand(.38, .5), side: rand(.84, 1.02), tip: rand(.5, .85), shoulder: rand(.05, .16) };
  const orient = pick(['up', 'down', 'alt', 'alt']), stagger = pick([0, .5, .5, .33]);
  const veinStyle = pick(['curved', 'curved', 'straight', 'none']), nv = ri(1, 4);
  const colorMode = pick(['col', 'col', 'random', 'grad', 'mirror']);
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: mix(ctx.P.bg, ctx.P.ink, rand(.03, .14)), z: -2 });
  const s = svgRoot(), vein = chance(.7) ? mix(ctx.P.ink, ctx.P.bg, .1) : mix(ctx.P.bg, ctx.P.ink, .04), vw = Math.max(1, cw * rand(.005, .01));
  const colorFor = (c, y, mi) => colorMode === 'col' ? cs[c % cs.length]
    : colorMode === 'mirror' ? cs[Math.min(c, cols - 1 - c) % cs.length]
      : colorMode === 'grad' ? mix(cs[0], cs[cs.length - 1], y / ctx.H)
        : chance(.14) ? ctx.P.accent : pick(cs);
  for (let c = 0; c < cols; c++) {
    const cx = (c + .5) * cw, start = -leafH - (c % 2 ? leafH * stagger : 0);
    let mi = 0;
    for (let y = start; y < ctx.H + leafH; y += leafH * overlap, mi++) {
      const up = orient === 'up' ? true : orient === 'down' ? false : mi % 2 === 0;
      const tipY = up ? y : y + leafH, baseY = up ? y + leafH : y, col = colorFor(c, y, mi);
      s.node('path', { d: ogee(cx, tipY, baseY, cw * lwf, p), fill: col, stroke: mix(col, ctx.P.ink, .18), 'stroke-width': vw });
      if (veinStyle !== 'none') veins(s, cx, tipY, baseY, cw * lwf, veinStyle, nv, vein, vw, p);
    }
  }
}
