import { ctx, ri, rand, shuffle, pick, chance, clamp, wpick, box, svgRoot, mix } from '../utils.js';
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
  // Size the motif off the SHORT side and derive the column count from it. A raw ri(3,8) ignores both the
  // canvas size and its aspect: at cols=3 on a landscape window each leaf came out 480x720px and the whole
  // design was FOUR motifs, while cols=8 in portrait gave 74. Same parameter, wildly different density.
  const cell = ctx.S / ri(4, 9);
  const cols = Math.max(3, Math.round(ctx.W / cell)), cw = ctx.W / cols;
  // Cap the leaf height too, or a tall leaf on a short canvas leaves barely two rows.
  const leafH = Math.min(cw * rand(1.1, 2.0), ctx.H / 2.4), overlap = rand(.8, 1.0), lwf = rand(.8, .99);
  const p = { mid: rand(.38, .5), side: rand(.84, 1.02), tip: rand(.5, .85), shoulder: rand(.05, .16) };
  const orient = pick(['up', 'down', 'alt', 'alt']), stagger = pick([0, .5, .5, .33]);
  // A plain filled leaf is the boring case — flat colour, no ornament, nothing Deco about it. 'none' is now
  // rare, and two interior treatments are added: nested concentric outlines and a contrasting inner core.
  const veinStyle = wpick([['curved', 3], ['straight', 2], ['nested', 3], ['core', 3], ['none', 1]]);
  const nv = clamp(Math.round(cw / 38), 1, 4);        // fewer veins on a small leaf, or it turns to mush
  const colorMode = pick(['col', 'col', 'random', 'grad', 'mirror']);
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: mix(ctx.P.bg, ctx.P.ink, rand(.03, .14)), z: -2 });
  const bead = chance(.45), beadCol = mix(ctx.P.accent, ctx.P.bg, .1);
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
      const w = cw * lwf;
      s.node('path', { d: ogee(cx, tipY, baseY, w, p), fill: col, stroke: mix(col, ctx.P.ink, .18), 'stroke-width': vw });
      // A smaller leaf concentric with this one, at scale t.
      const inner = t => { const h = baseY - tipY, ih = h * t, it = tipY + (h - ih) / 2; return ogee(cx, it, it + ih, w * t, p); };
      if (veinStyle === 'nested') for (let i = 1, rn = ri(2, 3); i <= rn; i++)
        s.node('path', { d: inner(1 - i * (.74 / rn)), fill: 'none', stroke: vein, 'stroke-width': vw * 1.1 });
      else if (veinStyle === 'core') {
        const t1 = rand(.5, .68), core = mix(cs[(c + 2) % cs.length], col, .15);
        s.node('path', { d: inner(t1), fill: core, stroke: mix(core, ctx.P.ink, .2), 'stroke-width': vw * .8 });
        if (chance(.55)) s.node('path', { d: inner(t1 * .45), fill: mix(col, ctx.P.bg, .25) });
      } else if (veinStyle !== 'none') veins(s, cx, tipY, baseY, w, veinStyle, nv, vein, vw, p);
      // Bead in the channel between columns — the small linking ornament Deco borders always carry.
      if (bead && c < cols - 1) {
        const bx = (c + 1) * cw, by = up ? baseY : tipY, r = cw * .07;
        s.node('path', { d: `M ${bx} ${by - r} L ${bx + r * .62} ${by} L ${bx} ${by + r} L ${bx - r * .62} ${by} Z`, fill: beadCol });
      }
    }
  }
}
