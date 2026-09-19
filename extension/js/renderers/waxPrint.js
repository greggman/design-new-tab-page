import { ctx, rand, ri, pick, chance, shuffle, wpick, mix, svgRoot, groundScheme, rrange } from '../utils.js';
// Wax print (Ankara / "Dutch wax"): the roller-printed cotton worn across West Africa, here in its ornate
// concentric-circle designs ("record", "well", "target"). What makes it read as wax print:
//   • Medallions built from rings of ornament: solid bands, bead rings, scallops, radial ticks, zigzag crowns,
//     two-colour checker bands, fine key lines between.
//   • A small vocabulary: two or three medallion DESIGNS, each stamped many times across the cloth at different
//     sizes — a printed repeat, not a hundred unique circles.
//   • Misregistration: the colour is printed in a separate pass from the dark key lines, so each medallion's
//     colour disc sits a few pixels off its outlines, the same direction everywhere.
// Layout: packed (big to small, no overlaps), a half-drop repeat with small medallions in the gaps, or
// layered (large medallions overlapping, later ones on top). A fine pattern covers the ground behind them.
//
// Rings are single stroked circles — beads, scallops, ticks and checkers are all dash patterns — so a full
// cloth is a few hundred elements.

const SVGNS = 'http://www.w3.org/2000/svg';
const add = (parent, tag, attrs) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
};
const f2 = v => v.toFixed(2);
// a dash period that divides the circumference exactly, so the pattern closes without a seam
const period = (r, want) => { const c = 2 * Math.PI * r; return c / Math.max(3, Math.round(c / want)); };

// A medallion design: rings from the rim inward, as fractions of the radius, each with a type and colours.
function makeDesign(cs, key) {
  const rings = [];
  let r = 1;
  const types = shuffle(['solid', 'beads', 'scallop', 'ticks', 'zigzag', 'checker', 'solid', 'beads']);
  let i = 0;
  while (r > .16) {
    const w = rand(.07, .16), type = types[i++ % types.length];
    rings.push({ type, r, w, c1: cs[i % cs.length], c2: cs[(i + 1) % cs.length], keyLine: chance(.6) });
    r -= w + rand(0, .03);
  }
  return { rings, core: pick(['dot', 'disc', 'target']), wash: cs[ri(0, cs.length - 1)], key };
}

function drawMedallion(g, x, y, R, D, shift, lw) {
  const ring = (rr, attrs) => add(g, 'circle', { cx: f2(x), cy: f2(y), r: f2(rr), fill: 'none', ...attrs });
  // the colour pass, printed slightly off register
  add(g, 'circle', { cx: f2(x + shift[0]), cy: f2(y + shift[1]), r: f2(R * .98), fill: D.wash });
  for (const q of D.rings) {
    const r = q.r * R, w = q.w * R, m = r - w / 2;
    if (w < .8) continue;
    switch (q.type) {
      case 'solid': ring(m, { stroke: q.c1, 'stroke-width': f2(w) }); break;
      case 'beads': ring(m, { stroke: q.c1, 'stroke-width': f2(w * .72), 'stroke-dasharray': `0 ${f2(period(m, w * 1.25))}`, 'stroke-linecap': 'round' }); break;
      case 'scallop':   // overlapping round caps make a scalloped band, over a thin solid core
        ring(m - w * .15, { stroke: q.c2, 'stroke-width': f2(w * .5) });
        ring(m + w * .12, { stroke: q.c1, 'stroke-width': f2(w * .75), 'stroke-dasharray': `0 ${f2(period(m, w * .82))}`, 'stroke-linecap': 'round' });
        break;
      case 'ticks': { const p = period(m, w * .55); ring(m, { stroke: q.c1, 'stroke-width': f2(w), 'stroke-dasharray': `${f2(p * .4)} ${f2(p * .6)}` }); break; }
      case 'checker': { const p = period(m, w * 1.6); ring(m, { stroke: q.c1, 'stroke-width': f2(w) }); ring(m, { stroke: q.c2, 'stroke-width': f2(w), 'stroke-dasharray': `${f2(p / 2)} ${f2(p / 2)}` }); break; }
      case 'zigzag': {  // a crown of triangles pointing outward
        const n = Math.max(8, Math.round(2 * Math.PI * m / (w * 1.1))), pts = [];
        for (let k = 0; k <= n * 2; k++) { const a = k / (n * 2) * Math.PI * 2, rr = k % 2 ? r : r - w; pts.push(`${f2(x + Math.cos(a) * rr)} ${f2(y + Math.sin(a) * rr)}`); }
        add(g, 'path', { d: 'M' + pts.join('L') + 'Z', fill: q.c1, stroke: D.key, 'stroke-width': f2(lw * .6), 'stroke-linejoin': 'round' });
        break;
      }
    }
    if (q.keyLine) ring(r, { stroke: D.key, 'stroke-width': f2(lw) });
  }
  const rc = (D.rings.length ? D.rings[D.rings.length - 1].r - D.rings[D.rings.length - 1].w : .2) * R;
  if (D.core === 'dot') add(g, 'circle', { cx: f2(x), cy: f2(y), r: f2(rc * .55), fill: D.key });
  else if (D.core === 'disc') { add(g, 'circle', { cx: f2(x), cy: f2(y), r: f2(rc), fill: D.rings[0].c2, stroke: D.key, 'stroke-width': f2(lw) }); add(g, 'circle', { cx: f2(x), cy: f2(y), r: f2(rc * .35), fill: D.key }); }
  else for (let k = 3; k >= 1; k--) add(g, 'circle', { cx: f2(x), cy: f2(y), r: f2(rc * k / 3), fill: k % 2 ? D.key : D.rings[0].c1 });
  ring(R, { stroke: D.key, 'stroke-width': f2(lw * 1.3) });
}

function animate(g, delay) {
  Object.assign(g.style, { transformBox: 'fill-box', transformOrigin: 'center', animation: `fin .6s cubic-bezier(.2,.7,.25,1) ${delay.toFixed(3)}s both` });
  g.style.setProperty('--t0', 'scale(.3) rotate(-40deg)'); g.style.setProperty('--t1', 'none'); g.style.setProperty('--op', '1');
}

export default function waxPrint() {
  const { ground, fg, ink } = groundScheme();
  const { W, H, S } = ctx, svg = svgRoot(), cs = fg.length >= 3 ? shuffle(fg) : shuffle([...fg, mix(fg[0], ink, .4)]);
  const key = ink, lw = Math.max(1, S * .0028);
  const shift = (a => [Math.cos(a) * S * .006, Math.sin(a) * S * .006])(rand(0, Math.PI * 2));

  // ground pattern: tiny rings or dots in a muted key colour
  const id = 'wx' + Math.random().toString(36).slice(2), pw = S * rand(.02, .035), pc = mix(ground, key, .3);
  const pat = add(add(svg, 'defs', {}), 'pattern', { id, width: f2(pw), height: f2(pw), patternUnits: 'userSpaceOnUse' });
  if (chance(.5)) add(pat, 'circle', { cx: f2(pw / 2), cy: f2(pw / 2), r: f2(pw * .28), fill: 'none', stroke: pc, 'stroke-width': f2(pw * .08) });
  else add(pat, 'circle', { cx: f2(pw / 2), cy: f2(pw / 2), r: f2(pw * .14), fill: pc });
  svg.node('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${id})` });

  const designs = Array.from({ length: ri(2, 3) }, () => makeDesign(shuffle(cs), key));
  const meds = [];
  const layout = wpick([['packed', 2], ['repeat', 2], ['layered', 1]]);
  const fits = (x, y, r, gap) => meds.every(m => Math.hypot(m.x - x, m.y - y) >= m.R + r + gap);
  if (layout === 'layered') {
    // one medallion per cell of a jittered grid, so the overlapping pile covers the cloth evenly; shuffled so
    // which one lands on top is random
    const c = S * rand(.26, .34);
    for (let i = 0; i * c < W + c * .5; i++) for (let j = 0; j * c < H + c * .5; j++)
      meds.push({ x: (i + rand(.2, .8)) * c - c * .25, y: (j + rand(.2, .8)) * c - c * .25, R: c * rand(.62, .9), D: pick(designs) });
    meds.sort(() => Math.random() - .5);
  } else if (layout === 'repeat') {
    const c = S * rand(.3, .44), R = c * .44, D0 = designs[0], D1 = designs[1];
    for (let i = -1; i * c < W + c; i++) for (let j = -1; j * c < H + c; j++) meds.push({ x: i * c, y: j * c + (i % 2 ? c / 2 : 0), R, D: D0 });
    // smaller medallions in the gaps of the half-drop
    for (let i = -1; i * c < W + c; i++) for (let j = -1; j * c < H + c; j++) {
      const x = i * c + c / 2, y = j * c + (i % 2 ? 0 : c / 2) + c / 2, r = c * .19;
      if (fits(x, y, r, 0)) meds.push({ x, y, R: r, D: D1 });
    }
  } else {
    for (let R = S * rand(.24, .32); R > S * .045; R *= .82)
      for (let t = 0; t < 120; t++) { const x = rand(-.05, 1.05) * W, y = rand(-.05, 1.05) * H; if (fits(x, y, R, S * .008)) meds.push({ x, y, R, D: designs[R > S * .12 ? 0 : 1 + ri(0, designs.length - 2)] }); }
  }
  // scatter tiny targets through what's left (not in layered, where everything is covered anyway)
  if (layout !== 'layered')
    for (let r = S * .04; r > S * .012; r *= .8)
      for (let t = 0; t < 300; t++) { const x = rand(0, W), y = rand(0, H); if (fits(x, y, r, S * .005)) meds.push({ x, y, R: r, D: designs[designs.length - 1], small: true }); }

  const order = shuffle(meds.map((_, i) => i));
  rrange(0, meds.length, k => {
    const m = meds[layout === 'layered' ? k : order[k]], g = add(svg, 'g', {});
    drawMedallion(g, m.x, m.y, m.R, m.small ? { ...m.D, rings: m.D.rings.slice(0, 3) } : m.D, shift, lw * Math.min(1, m.R / (S * .08) + .4));
    animate(g, ctx.cellDelay);
  }, { dur: 1.1, order: layout === 'layered' ? 'forward' : undefined });
}
