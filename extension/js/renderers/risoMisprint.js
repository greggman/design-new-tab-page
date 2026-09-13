import { ctx, rand, ri, chance, pick, shuffle, wpick, clamp, svgRoot, labDist, hexToRgb, hexToOklch, oklchToHex, groundScheme } from '../utils.js';
// Riso misprint: a bold poster printed as two or three spot-colour passes that never quite line up.
//
// Each ink is ONE layer group — solids, halftone dots, and its coverage flaws batched into a handful of paths —
// and the whole group is blended onto the paper (multiply on a light sheet, screen on a dark one), so wherever
// two inks cross a third colour appears, as it does when translucent riso inks overprint. Every layer carries a
// few pixels of offset and a fraction of a degree of rotation about the sheet's centre: the misregistration.
// Some shapes are designed to register EXACTLY against another ink — a disc knocked out of one colour and
// filled by another — because that's where misregistration shows: a paper sliver on one side, an overprint
// sliver on the other.
//
// Inks are the palette's hues pulled halfway toward the nearest real riso ink family (fluoro pink, red, orange,
// yellow, green, teal, blue, purple) at that family's lightness and a high chroma, so they read as flat, loud
// spot colours rather than as process colour. Coverage flaws are cut INTO each layer: specks and roller streaks
// in the blend's neutral colour (white under multiply, black under screen), which leave that one ink thin
// without touching the others.

const TAU = Math.PI * 2, f = v => v.toFixed(1), NS = 'http://www.w3.org/2000/svg';
// Riso ink families as [OKLCH hue, lightness].
const FAMILIES = [[0, .7], [28, .64], [55, .77], [100, .9], [150, .72], [195, .7], [255, .58], [305, .56]];
const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const blendRGB = (a, b, mode) => { const x = hexToRgb(a), y = hexToRgb(b); return '#' + x.map((v, i) => { const p = v / 255, q = y[i] / 255, r = mode === 'multiply' ? p * q : p + q - p * q; return Math.round(r * 255).toString(16).padStart(2, '0'); }).join(''); };

// ---- geometry, all as path data. Fills wind clockwise (on screen), knockouts anticlockwise, so one nonzero path
// can carry a shape, its hole, and something else of the same ink overlapping either.
const circ = (x, y, r, hole = false) => { const s = hole ? 0 : 1; return `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 ${s} ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 ${s} ${f(-2 * r)} 0Z`; };
const polyArea = P => { let s = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; s += p[0] * q[1] - q[0] * p[1]; } return s; };
const poly = (P, hole = false) => { if ((polyArea(P) > 0) === hole) P = P.slice().reverse(); return 'M' + P.map(p => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z'; };
// Pie sector from angle a0 to a1 (a1 > a0, screen angles, so increasing = clockwise).
const sector = (cx, cy, r, a0, a1) => { const p = a => [cx + r * Math.cos(a), cy + r * Math.sin(a)], [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${f(cx)} ${f(cy)}L${f(x0)} ${f(y0)}A${f(r)} ${f(r)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${f(x1)} ${f(y1)}Z`; };
const rectP = (cx, cy, w, h, a = 0) => [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };

export default function risoMisprint() {
  const { ground, fg, gL } = groundScheme();
  // Riso stock is paper, not a painted colour: keep the ground's hue and light/dark side, but bring it to what
  // paper actually comes in — white to cream, a pale tinted stock, or black stock for the screen-printed look.
  const [, gC, gH] = hexToOklch(ground), dark = gL < .3;
  const paper = dark ? oklchToHex(rand(.17, .25), Math.min(gC, .025), gH) : wpick([[oklchToHex(rand(.93, .97), Math.min(gC, .025), gH), 3], [oklchToHex(rand(.86, .91), Math.min(gC, .06), gH), 1]]);
  ctx.root.style.background = paper;
  const W = ctx.W, H = ctx.H, S = ctx.S, mode = dark ? 'screen' : 'multiply';
  const print = c => blendRGB(c, paper, mode);

  /* ---- inks ---- */
  const nInk = wpick([[2, 4], [3, 5]]);
  const inks = [];
  const hues = shuffle([...new Set([ctx.P.accent, ...fg, ...ctx.P.colors])].map(c => hexToOklch(c)[2]));
  const tryInk = (H0, pull, strict = true) => {
    const [fh, fl] = FAMILIES.reduce((b, fam) => hueGap(fam[0], H0) < hueGap(b[0], H0) ? fam : b);
    let d = ((fh - H0 + 540) % 360) - 180, Hh = (H0 + d * pull + 360) % 360, L = clamp(fl + rand(-.04, .04), .3, .92);
    // Move lightness until the printed ink clears the paper — darker under multiply, lighter under screen.
    const C = rand(.16, .22);
    let c = oklchToHex(L, C, Hh);
    for (let k = 0; k < 20 && labDist(print(c), paper) < .2; k++) { L += mode === 'multiply' ? -.03 : .03; c = oklchToHex(L, C, Hh); }
    if (labDist(print(c), paper) < .2) return null;
    // Distinct from every ink so far, and distinct once overprinted on it.
    for (const o of inks) {
      const both = blendRGB(c, print(o), mode);
      if (labDist(print(c), print(o)) < .16 || labDist(both, print(c)) < .13 || labDist(both, print(o)) < .13) return null;
      // Complementary inks multiply to near-black, and the charm of an overprint is the NEW colour it makes.
      if (strict && mode === 'multiply' && hexToOklch(both)[0] < .3) return null;
    }
    return c;
  };
  for (const H0 of hues) { if (inks.length >= nInk) break; const c = tryInk(H0, .5); if (c) inks.push(c); }
  // A palette with too little hue spread still gets a second ink: its hue, snapped all the way to a family
  // on the far side of the wheel. That's how real two-colour riso jobs are specced anyway.
  for (const [fh] of shuffle(FAMILIES)) { if (inks.length >= 2) break; if (inks.every(o => hueGap(hexToOklch(o)[2], fh) > 60)) { const c = tryInk(fh, 1); if (c) inks.push(c); } }
  for (const [fh] of shuffle(FAMILIES)) { if (inks.length >= 2) break; const c = tryInk(fh, 1, false); if (c) inks.push(c); }
  if (inks.length < 2) inks.push(oklchToHex(mode === 'multiply' ? .45 : .85, .15, (hexToOklch(inks[0] || paper)[2] + 180) % 360));
  const N = inks.length;

  /* ---- composition: per ink, a list of solid path data and halftone fields. ---- */
  const L = inks.map(() => ({ solid: [], tone: [] }));
  const cx = W / 2, cy = H / 2, long = Math.max(W, H), landscape = W >= H;
  const I = () => ri(0, N - 1);
  // A halftone field: `inside(x,y)` bounds it, `dens(x,y)` in 0..1 sets dot area.
  const lin = (a, lo = 0, hi = 1, span) => { const ux = Math.cos(a), uy = Math.sin(a), ext = Math.abs(ux) * W + Math.abs(uy) * H, o = -ext / 2; span = span || ext; return (x, y) => clamp(lo + (hi - lo) * (((x - cx) * ux + (y - cy) * uy) - o) / span, 0, 1); };
  const rad = (px, py, r, lo = 1, hi = 0) => (x, y) => clamp(lo + (hi - lo) * Math.hypot(x - px, y - py) / r, 0, 1);
  const tone = (i, inside, dens) => L[i].tone.push({ inside, dens });
  const disc = (x, y, r) => (px, py) => (px - x) ** 2 + (py - y) ** 2 < r * r;
  const kind = wpick([['orbs', 3], ['bars', 2.5], ['grid', 3], ['arcs', 2], ['gradient', 2], ['blocks', 2.5]]);
  const halftone = kind === 'gradient' || chance(.7);

  if (kind === 'orbs') {
    const order = shuffle([...inks.keys()]), rr = S * rand(.26, .38), spread = rand(.35, .6) * rr, a0 = rand(0, TAU);
    order.forEach((i, k) => {
      const a = a0 + k * TAU / N, x = cx + Math.cos(a) * spread * (landscape ? 1.5 : 1), y = cy + Math.sin(a) * spread * (landscape ? 1 : 1.5), r = rr * rand(.85, 1.15);
      if (halftone && k === 0) tone(i, disc(x, y, r), chance(.5) ? rad(x - r * .4, y - r * .4, r * 1.6, 1, .05) : lin(rand(0, TAU), -.1, 1.1, r * 2));
      else if (k === 1 && chance(.6)) { const j = order[(k + 1) % N], ir = r * rand(.35, .55); L[i].solid.push(circ(x, y, r) + circ(x, y, ir, true)); L[j].solid.push(circ(x, y, ir)); }   // registered knockout
      else L[i].solid.push(circ(x, y, r));
    });
    // A row of small dots or a crossing bar keeps the big discs from floating.
    const i = I(), bar = chance(.5), ang = pick([0, Math.PI / 2, rand(-.5, .5)]);
    if (bar) L[i].solid.push(poly(rectP(cx, cy + rand(-.25, .25) * H, long * 1.6, S * rand(.04, .09), ang)));
    else { const n = ri(5, 9), gap = long * .8 / n, y = rand(.15, .85) * H; for (let k = 0; k < n; k++) L[i].solid.push(landscape ? circ(W * .1 + (k + .5) * gap, y, gap * .28) : circ(y * W / H, H * .1 + (k + .5) * gap, gap * .28)); }
  } else if (kind === 'bars') {
    const ang = pick([0, Math.PI / 2, Math.PI / 4, -Math.PI / 4, rand(-1.4, 1.4)]), bw = S * rand(.04, .1), pitch = bw * rand(1.7, 2.6);
    const i0 = I(), half = chance(.4), R = Math.hypot(W, H) / 2 + pitch, ux = Math.cos(ang + Math.PI / 2), uy = Math.sin(ang + Math.PI / 2);
    const i1 = (i0 + 1) % N, r = S * rand(.25, .42), x = pick([.33, .5, .67]) * W, y = pick([.38, .5, .62]) * H;
    // Half-field bars stop partway across the disc, so the two inks always cross.
    const cut = (x - cx) * ux + (y - cy) * uy + rand(-.3, .3) * r, side = pick([1, -1]);
    for (let t = -R; t <= R; t += pitch) { if (half && (t - cut) * side < 0) continue; L[i0].solid.push(poly(rectP(cx + ux * t, cy + uy * t, R * 2.2, bw, ang))); }
    if (halftone && chance(.5)) tone(i1, disc(x, y, r), rad(x, y, r, 1, .15)); else L[i1].solid.push(circ(x, y, r));
    const i2 = (i0 + 2) % N;                                                          // with two inks, the bars' own ink
    if (halftone) tone(i2, () => true, lin(ang + Math.PI / 2 + rand(-.6, .6), -.2, 1));
    else L[i2].solid.push(poly(rectP(rand(.3, .7) * W, rand(.3, .7) * H, S * rand(.4, .7), S * rand(.3, .6), rand(-.2, .2))));
  } else if (kind === 'grid') {
    const cell = S / rand(2.6, 4.2), cols = Math.max(2, Math.round(W / cell)), rows = Math.max(2, Math.round(H / cell)), cw = W / cols, ch = H / rows, m = Math.min(cw, ch);
    const motifs = wpick([[['disc', 'half', 'quarter', 'ring', 'bar'], 3], [['quarter', 'half'], 2], [['disc', 'ring', 'tone'], 2]]);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = (c + .5) * cw, y = (r + .5) * ch, i = I(), j = (i + ri(1, N - 1)) % N, mo = pick(halftone ? [...motifs, 'tone'] : motifs), rot = ri(0, 3) * Math.PI / 2;
      if (chance(.45)) L[j].solid.push(poly(rectP(x, y, cw + 1, ch + 1)));                       // a flood cell behind
      if (mo === 'disc') L[i].solid.push(circ(x, y, m * rand(.36, .46)));
      else if (mo === 'half') { const R0 = m * .46; L[i].solid.push(sector(x - Math.cos(rot) * R0 * .2, y - Math.sin(rot) * R0 * .2, R0, rot - Math.PI / 2, rot + Math.PI / 2)); }
      else if (mo === 'quarter') { const sx = pick([-1, 1]), sy = pick([-1, 1]), a = Math.atan2(-sy, -sx); L[i].solid.push(sector(x + sx * cw / 2, y + sy * ch / 2, m, a - Math.PI / 4, a + Math.PI / 4)); }   // from a cell corner
      else if (mo === 'ring') { const R0 = m * .44, ir = R0 * rand(.4, .6); L[i].solid.push(circ(x, y, R0) + circ(x, y, ir, true)); if (chance(.6)) L[j].solid.push(circ(x, y, ir)); }
      else if (mo === 'bar') L[i].solid.push(poly(rectP(x, y, pick([cw + 1, m * .3]), pick([ch + 1, m * .3]))));
      else if (mo === 'tone') tone(i, disc(x, y, m * .46), rad(x, y, m * .46, 1, .1));
    }
  } else if (kind === 'arcs') {
    const px = pick([0, .5, 1, rand(.2, .8)]) * W, py = pick([H, H, 0, rand(.6, 1) * H]), bw = S * rand(.05, .1), far = Math.hypot(Math.max(px, W - px), Math.max(py, H - py));
    const reach = far * rand(.55, 1.05), order = shuffle([...inks.keys()]);
    let k = 0;
    // Each band is a little wider than the step, so neighbouring inks overlap in a thin overprinted seam.
    const wide = rand(1.15, 1.45);
    for (let r = reach; r > bw * 1.2; r -= bw, k++) if (k % N !== N - 1 || N === 2 || chance(.5)) L[order[k % N]].solid.push(circ(px, py, r) + circ(px, py, Math.max(1, r - bw * wide * (k % N === 1 ? 1 : .5)), true));
    const i = order[k % N], sr = S * rand(.18, .3), sx = clamp(px + rand(-.3, .3) * W, sr, W - sr), sy = clamp(py === 0 ? rand(.55, .8) * H : rand(.2, .45) * H, sr, H - sr);
    if (halftone) tone(i, disc(sx, sy, sr * 1.5), rad(sx, sy, sr * 1.5, 1.1, 0)); else L[i].solid.push(circ(sx, sy, sr));
    if (halftone && N > 2) tone(order[(k + 1) % N], () => true, lin(Math.atan2(py - cy, px - cx), -.15, .7));
  } else if (kind === 'gradient') {
    const a = rand(0, TAU), order = shuffle([...inks.keys()]);
    // Two screens fading in from opposite sides: pure ink at each end, an overprinted blend through the middle.
    tone(order[0], () => true, lin(a, rand(-.7, -.4), rand(.95, 1.1)));
    tone(order[1], () => true, lin(a + Math.PI + rand(-.6, .6), rand(-.7, -.4), rand(.95, 1.1)));
    const i = N > 2 ? order[2] : order[0], sh = pick(['disc', 'block', 'bars']);
    if (sh === 'disc') { const r = S * rand(.22, .34); L[i].solid.push(circ(rand(.35, .65) * W, rand(.35, .65) * H, r)); }
    else if (sh === 'block') L[i].solid.push(poly(rectP(cx + rand(-.1, .1) * W, cy + rand(-.1, .1) * H, W * rand(.3, .55), H * rand(.3, .55), rand(-.15, .15))));
    else { const n = ri(3, 6), bw = S * rand(.03, .06); for (let k = 0; k < n; k++) L[i].solid.push(poly(rectP(cx, H * (.2 + .6 * k / (n - 1)), W * rand(.4, .8), bw))); }
  } else {                                                                                            // blocks
    const n = ri(3, 5), order = shuffle([...inks.keys()]);
    for (let k = 0; k < n; k++) {
      // Stratified along the long side so the blocks span the sheet and each overlaps its neighbour.
      const t = (k + .5 + rand(-.25, .25)) / n, along = long / n * rand(1.3, 2), across = Math.min(W, H) * rand(.35, .75), off = rand(.28, .72);
      const i = order[k % N], x = landscape ? t * W : off * W, y = landscape ? off * H : t * H, w = landscape ? along : across, h = landscape ? across : along, a = rand(-.14, .14), P = rectP(x, y, w, h, a);
      if (halftone && k === n - 1) tone(i, (px, py) => inPoly(px, py, P), lin(a + pick([0, Math.PI / 2]), -.1, 1.1, Math.max(w, h)));
      else if (k === 0 && chance(.6)) { const r = Math.min(w, h) * rand(.25, .38), j = order[(k + 1) % N]; L[i].solid.push(poly(P) + circ(x, y, r, true)); L[j].solid.push(circ(x, y, r)); }
      else L[i].solid.push(poly(P));
    }
  }

  // Every ink specced for the job has to print something: an ink the composition skipped gets a bold disc or bar.
  L.forEach((l, i) => {
    if (l.solid.length || l.tone.length) return;
    if (chance(.5)) l.solid.push(circ(rand(.25, .75) * W, rand(.25, .75) * H, S * rand(.14, .26)));
    else l.solid.push(poly(rectP(cx + rand(-.2, .2) * W, cy + rand(-.2, .2) * H, long * 1.5, S * rand(.06, .12), pick([0, Math.PI / 2, rand(-.6, .6)]))));
  });

  /* ---- print ---- */
  const svg = svgRoot();
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  el('rect', { x: -20, y: -20, width: W + 40, height: H + 40, fill: paper }, svg);   // the sheet, so blending has something to land on
  const hole = mode === 'multiply' ? '#ffffff' : '#000000', pad = S * .04;
  const screenAngles = shuffle([15, 45, 75, 0]).map(d => d * Math.PI / 180);
  const pitch = Math.max(5, S / rand(55, 90), Math.sqrt(W * H / 7000));   // caps a full-bleed screen near 7000 dots
  const feedV = chance(.5);                                                           // paper feed direction, for streaks
  const mis = rand(.6, 1.6);                                                          // how badly this job registers
  inks.forEach((ink, i) => {
    // Misregistration: a few px of offset and a fraction of a degree, about the sheet's centre. It lives on this
    // outer group, which is never animated (a CSS animation would override the transform attribute).
    const dx = i === 0 ? 0 : rand(-1, 1) * S * .006 * mis, dy = i === 0 ? 0 : rand(-1, 1) * S * .006 * mis, rot = i === 0 ? 0 : rand(-.45, .45) * mis;
    const outer = el('g', { transform: `translate(${f(dx)} ${f(dy)}) rotate(${rot.toFixed(2)} ${f(cx)} ${f(cy)})` }, svg);
    outer.style.mixBlendMode = mode; outer.style.isolation = 'isolate';
    const g = el('g', {}, outer);
    g.style.setProperty('--t0', `translate(${f(rand(-1, 1) * S * .02)}px, ${f(S * .03)}px)`); g.style.setProperty('--t1', 'none'); g.style.setProperty('--op', '1');
    g.style.animation = `fin .5s cubic-bezier(.2,.7,.25,1) ${(.05 + i * .38).toFixed(2)}s both`;
    if (L[i].solid.length) el('path', { d: L[i].solid.join(''), fill: ink }, g);
    if (L[i].tone.length) {
      const sa = screenAngles[i], ca = Math.cos(sa), sn = Math.sin(sa), R = Math.hypot(W, H) / 2 + pad;
      let d = '';
      for (let v = -R; v <= R; v += pitch) for (let u = -R; u <= R; u += pitch) {
        const x = cx + u * ca - v * sn, y = cy + u * sn + v * ca;
        if (x < -pad || y < -pad || x > W + pad || y > H + pad) continue;
        let dens = 0;
        for (const t of L[i].tone) if (t.inside(x, y)) dens = Math.max(dens, t.dens(x, y));
        const r = pitch * .56 * Math.sqrt(dens);                                          // dot AREA follows density
        if (r > .35) d += circ(x, y, r);
      }
      if (d) el('path', { d, fill: ink }, g);
    }
    // Uneven coverage: specks and roller streaks knocked out of this ink only, thicker in a few bands along the feed.
    const bands = Array.from({ length: ri(2, 4) }, () => [rand(0, 1), rand(.03, .12)]);
    const streak = t => .25 + bands.reduce((s, [c, w]) => s + Math.exp(-(((t - c) / w) ** 2)), 0);
    let sp = '';
    const nS = Math.round(W * H / rand(250, 600));
    for (let k = 0; k < nS; k++) {
      const x = rand(0, W), y = rand(0, H);
      if (Math.random() * 1.6 > streak(feedV ? x / W : y / H)) continue;
      sp += circ(x, y, rand(.35, 1.1));
    }
    if (sp) el('path', { d: sp, fill: hole, 'fill-opacity': rand(.45, .75).toFixed(2) }, g);
    let st = '';
    for (const [c, w] of bands) if (chance(.7)) {
      const at = c * (feedV ? W : H), th = S * w * rand(.1, .4), t2 = th * rand(.3, 1);
      st += poly(feedV ? [[at, -pad], [at + th, -pad], [at + t2, H + pad], [at, H + pad]] : [[-pad, at], [W + pad, at], [W + pad, at + t2], [-pad, at + th]]);
    }
    if (st) el('path', { d: st, fill: hole, 'fill-opacity': rand(.1, .22).toFixed(2) }, g);
  });
}
