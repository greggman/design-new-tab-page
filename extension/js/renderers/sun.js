import { ctx, rand, ri, pick, chance, shuffle, wpick, mix, svgRoot, groundScheme, rrange, labDist } from '../utils.js';
// Suns, in the "It's a Small World" manner: a disc, then rings of triangles around it. Each triangle's BASE is
// a chord of the disc in the middle — every ring shares that same base circle — and its TIP is swept round by
// some angle, so the triangles lean; each ring leans the opposite way and reaches a different distance out. Where the leaning triangles cross their neighbours they cut the ring into
// a lattice of little facets, and the pattern that appears depends on how far the tips are swept — a small
// sweep gives a plain spiky sun, a sweep of more than one step weaves the rays over each other.
//
// One sweep angle and step are chosen per sun and shared by its rings (alternating sign), which is what keeps
// the whole thing coherent instead of looking like unrelated rings stacked up.

const f1 = v => v.toFixed(1);

function drawSun(svg, x, y, R, C) {
  const n = ri(8, 20), step = Math.PI * 2 / n;
  const sweep = step * rand(.25, .8);          // how far each tip leans round the ring
  const baseW = step * rand(.95, 1.02);         // a full step, so the bases meet and the ring reads as solid
  const nRings = ri(2, 3), cs = shuffle(C.fg);
  const scheme = C.scheme, one = cs[1 % cs.length];
  const phase = rand(0, Math.PI * 2);
  const r = R * rand(.26, .4), rb = r * .82;     // the disc, and the radius the triangle bases start from

  // Every ring's triangles are based on the SAME inner circle and differ only in how far out they reach and
  // which way they lean. Longest first, so the shorter rings sit on top of the longer ones. The bases sit a
  // little INSIDE the disc, which is painted over them afterwards — based on the rim itself, their chords would
  // cut the disc into a polygon.
  const lens = Array.from({ length: nRings }, () => R * rand(.3, .75)).sort((p, q) => q - p);
  lens.forEach((len, k) => {
    const dir = k % 2 ? -1 : 1;                           // each ring leans the opposite way
    const col = scheme === 'each' ? cs[(k + 1) % cs.length] : one;   // one colour per ring, or one for the sun
    let d = '';
    for (let i = 0; i < n; i++) {
      const c = phase + i * step + (k % 2 ? step / 2 : 0);   // every other ring starts half a step round
      const p = (rad, ang) => `${f1(x + Math.cos(ang) * rad)} ${f1(y + Math.sin(ang) * rad)}`;
      d += `M${p(rb, c - baseW / 2)}L${p(rb, c + baseW / 2)}L${p(r + len, c + dir * sweep)}Z`;
    }
    svg.node('path', { d, fill: col });
  });

  // the disc goes on last, over every ring's bases: a couple of concentric circles, sometimes a ring of dots
  const disc = scheme === 'mono' ? one : cs[0], inner = scheme === 'mono' ? C.ground : C.contrast(disc);
  svg.node('circle', { cx: f1(x), cy: f1(y), r: f1(r), fill: disc });
  if (chance(scheme === 'mono' ? .5 : .7)) svg.node('circle', { cx: f1(x), cy: f1(y), r: f1(r * rand(.45, .7)), fill: inner });
  if (scheme !== 'mono' && chance(.45)) {
    const m = ri(6, 14), rr = r * .8;
    svg.node('circle', { cx: f1(x), cy: f1(y), r: f1(rr), fill: 'none', stroke: C.contrast(inner), 'stroke-width': f1(r * .12), 'stroke-dasharray': `0 ${f1(2 * Math.PI * rr / m)}`, 'stroke-linecap': 'round' });
  }
}

export default function sun() {
  const { ground, fg, ink } = groundScheme();
  const { W, H, S } = ctx, svg = svgRoot();
  const all = [...fg, ink];
  const C = { fg: all, ground, contrast: c => all.reduce((best, q) => labDist(q, c) > labDist(best, c) ? q : best, all[0]) };

  // a scatter of little rays and dots in the gaps, so the ground isn't bare between the suns
  const spark = () => {
    const x = rand(0, W), y = rand(0, H), s = S * rand(.01, .03), a = rand(0, 6.28);
    // little four-point sparks and dots
    if (chance(.6)) svg.node('circle', { cx: f1(x), cy: f1(y), r: f1(s * .35), fill: mix(pick(all), ground, .15) });
    else svg.node('path', { d: [0, 1, 2, 3].map(q => { const b = a + q * Math.PI / 2; return `M${f1(x)} ${f1(y)}L${f1(x + Math.cos(b) * s)} ${f1(y + Math.sin(b) * s)}`; }).join(''), stroke: mix(pick(all), ground, .25), 'stroke-width': f1(Math.max(1, S * .0025)), 'stroke-linecap': 'round', fill: 'none' });
  };

  // How every sun on this page is coloured: each ring (and the disc) its own colour; all the rings one colour
  // with the disc its own; or the whole sun one colour, so its leaning rings and disc merge into a single
  // silhouette and only the overlaps read. Chosen once, so the page is consistent.
  C.scheme = wpick([['mono', 2], ['ringsMono', 1.5], ['each', 2.5]]);

  const layout = pick(['single', 'grid', 'packed']);
  const suns = [];
  if (layout === 'single') {
    suns.push([W / 2, H / 2, S * rand(.3, .42)]);
    for (let i = ri(2, 5); i > 0; i--) suns.push([rand(.05, .95) * W, rand(.05, .95) * H, S * rand(.07, .13)]);
  } else if (layout === 'grid') {
    const cell = S * rand(.26, .4), cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
    const ox = (W - (cols - 1) * cell) / 2, oy = (H - (rows - 1) * cell) / 2;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) suns.push([ox + i * cell + (j % 2 ? cell / 2 : 0), oy + j * cell, cell * rand(.42, .5)]);
  } else {
    const placed = [];
    for (let R = S * rand(.24, .34); R > S * .05; R *= .8)
      for (let t = 0; t < 60; t++) {
        const x = rand(-.05, 1.05) * W, y = rand(-.05, 1.05) * H;
        if (placed.every(q => Math.hypot(q[0] - x, q[1] - y) > q[2] + R * 1.05)) { placed.push([x, y, R]); suns.push([x, y, R]); }
      }
  }
  for (let i = Math.round(W * H / (S * S) * rand(10, 20)); i > 0; i--) spark();
  rrange(0, suns.length, i => drawSun(svg, ...suns[i], C), { dur: 1 });
}
