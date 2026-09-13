import { ctx, rand, ri, chance, pick, wpick, clamp, svgRoot, smoothPath, labDist, readable, hexToOklch, oklchToHex, groundScheme } from '../utils.js';
// Paper layers: a landscape built like a layered paper-cut shadow box — five to nine sheets, each cut along a
// terrain line (rolling hills, pointed waves, or wind-shaped dunes), stacked back to front.
//
// What sells the stack as physical is the shadow each sheet throws onto the sheet behind it. Only the part of a
// shadow ABOVE the front sheet's edge can ever be seen, so the shadow is a blurred band hugging the cut edge,
// shifted up a touch, rather than a blurred copy of the whole sheet: the blur only has to cover a strip, and
// there is exactly one blurred element per layer.
//
// Colour follows atmospheric perspective relative to the sky: the far sheet sits a small step from the sky colour
// and each nearer sheet moves further away (darker under a light sky, lighter under a dark one), with chroma
// rising toward the front and the hue drifting between two palette hues. Adjacent sheets are held to a minimum
// OKLab distance so every cut edge reads even before its shadow does.

const f = v => v.toFixed(1), NS = 'http://www.w3.org/2000/svg', TAU = Math.PI * 2;
const lerpHue = (a, b, t) => { const d = ((b - a + 540) % 360) - 180; return (a + d * t + 360) % 360; };

// Terrain profiles: x (px) -> height in -1..1 (up is positive). λ is the feature spacing.
const TERRAIN = {
  hills: (lam, W) => {
    const k = [[1, rand(0, TAU), 1], [rand(.35, .6), rand(0, TAU), rand(1.8, 2.6)], [rand(.1, .25), rand(0, TAU), rand(3.5, 5)]];
    const norm = k.reduce((s, q) => s + q[0], 0), big = [rand(.3, .6), rand(0, TAU), W * rand(1.2, 2.2)];
    return x => (k.reduce((s, [a, p, m]) => s + a * Math.sin(TAU * x * m / lam + p), 0) / norm) * (1 - big[0]) + big[0] * Math.sin(TAU * x / big[2] + big[1]);
  },
  // Pointed crests, round troughs, leaning downwind: 1-|sin| has a corner at every zero of sin.
  waves: lam => {
    const ph = rand(0, 1), lean = rand(-.5, .5), sw = [rand(0, TAU), rand(2.5, 5)], amp = [rand(0, TAU), rand(3, 6)];
    return x => {
      const u = x / lam + ph, w = u + lean * Math.sin(TAU * u) / TAU;
      const h = 1 - Math.abs(Math.sin(Math.PI * w)) ** .85;
      return (h * 2 - 1) * (.75 + .25 * Math.sin(TAU * u / amp[1] + amp[0])) * .8 + .2 * Math.sin(TAU * u / sw[1] + sw[0]);
    };
  },
  // Long windward slope, sharp crest, short steep lee face.
  dunes: lam => {
    const ph = rand(0, 1), q = rand(.62, .8), dir = pick([1, -1]), var_ = [rand(0, TAU), rand(2, 4)];
    return x => {
      const u = dir * x / lam + ph, fr = u - Math.floor(u);
      const h = fr < q ? Math.sin(fr / q * Math.PI / 2) ** 1.6 : (1 - (fr - q) / (1 - q)) ** 1.8;
      const size = .65 + .35 * Math.sin(u / var_[1] * TAU + var_[0]);   // varies smoothly: a per-dune size would step at every trough
      return (h * 2 - 1) * size;
    };
  },
};

export default function paperLayers() {
  let { ground: sky, gL } = groundScheme();
  const W = ctx.W, H = ctx.H, S = ctx.S, pad = S * .1;
  const src = [...new Set([ctx.P.accent, ...ctx.P.colors])].map(hexToOklch);

  /* ---- depth structure. Layer count and heights come from H relative to S, so a portrait canvas gets more
     sheets rather than taller copies of the same ones. ---- */
  const terrain = wpick([['hills', 4], ['waves', 2.5], ['dunes', 2.5]]);
  const n = clamp(Math.round(H / (S * rand(.13, .23))), 5, 9);
  const horizon = H * rand(.28, .45), front = H * rand(.74, .86);
  const lam0 = { hills: W * rand(.5, 1), waves: S * rand(.16, .3), dunes: S * rand(.45, .85) }[terrain];
  const amp0 = { hills: S * rand(.05, .1), waves: S * rand(.025, .05), dunes: S * rand(.035, .07) }[terrain];
  const persp = rand(1, 1.3);

  /* ---- colour ---- */
  // Away from the sky: down under a light sky, up under a dark one. A mid sky goes whichever way has room for
  // every sheet to take a real step — crossing back over the sky's lightness would make two sheets collide.
  // If neither way has room — a mid-tone sky over many sheets — the sky itself moves (same hue and chroma) until
  // it does. Otherwise the front sheets pile up against a lightness bound and the ramp stops reading as depth.
  const room = d => d < 0 ? gL - .2 : .95 - gL, need = (n - 1) * .07 + .1;
  let dir = gL > .55 ? -1 : gL < .4 ? 1 : pick([1, -1]);
  if (room(dir) < need && room(-dir) > room(dir)) dir = -dir;
  if (room(dir) < need) {
    const [, sC, sH] = hexToOklch(sky);
    gL = dir < 0 ? Math.min(.96, .2 + need) : Math.max(.12, .95 - need);
    sky = oklchToHex(gL, sC, sH); ctx.root.style.background = sky;
  }
  // The ramp is rolled a few times and the one whose closest pair of neighbouring sheets is furthest apart wins:
  // near a lightness bound OKLab distance per step shrinks, and a single roll can crowd its front sheets together.
  const ramp = () => {
    // The hue drifts only between neighbouring palette hues: a drift across the wheel paints a rainbow, not distance.
    const hA = pick(src), near = src.filter(c => Math.abs(((c[2] - hA[2] + 540) % 360) - 180) <= 70), hB = pick(near.length ? near : [hA]), Cpal = clamp(Math.max(hA[1], hB[1]), .07, .17);
    const Lb = gL + dir * rand(.07, .11), span = clamp(Math.max((n - 1) * .07, rand(.38, .6)), .12, room(dir) - .09), gam = rand(.85, 1.1);
    const cols = [];
    let worst = 9, prevL = 0;
    for (let k = 0; k < n; k++) {
      const t = k / (n - 1), behind = k ? cols[k - 1] : sky;
      const C = Cpal * (.4 + .7 * t), Hh = lerpHue(hA[2], hB[2], t);
      // Never behind the previous sheet's lightness, even if that sheet had to be pushed past its planned value.
      let L = Lb + dir * span * t ** gam;
      if (k) L = dir < 0 ? Math.min(L, prevL - .03) : Math.max(L, prevL + .03);
      L = clamp(L, .17, .96);
      let c = oklchToHex(L, C, Hh);
      for (let i = 0; i < 20 && labDist(c, behind) < .075; i++) { L = clamp(L + dir * .015, .08, .97); c = oklchToHex(L, C, Hh); }
      // Pinned at a lightness bound: find the step in chroma and hue instead.
      if (labDist(c, behind) < .075) for (const [dc, dh] of [[1.6, 0], [1.6, 35], [1.6, -35], [2.2, 60], [2.2, -60], [.3, 0]]) { const v = oklchToHex(L, clamp(C * dc, .02, .2), Hh + dh); if (labDist(v, behind) > labDist(c, behind)) c = v; }
      cols.push(c); worst = Math.min(worst, labDist(c, behind)); prevL = L;
    }
    return { cols, worst, hA };
  };
  let best = ramp();
  for (let i = 0; i < 12 && best.worst < .075; i++) { const r = ramp(); if (r.worst > best.worst) best = r; }
  const { cols, hA } = best;

  const svg = svgRoot(), uid = Math.random().toString(36).slice(2, 8);
  const el = (tag, attrs, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  const reveal = (e, delay, rise) => {
    e.style.setProperty('--t0', `translateY(${f(rise)}px)`); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', '1');
    e.style.animation = `fin .6s cubic-bezier(.2,.7,.25,1) ${delay.toFixed(2)}s both`;
  };
  const defs = el('defs', {});
  const blur = S * rand(.006, .016), shAlpha = rand(.24, .4);
  const fl = el('filter', { id: `pl-sh-${uid}`, x: '-5%', y: '-150%', width: '110%', height: '400%', 'color-interpolation-filters': 'sRGB' }, defs);
  el('feGaussianBlur', { stdDeviation: f(blur) }, fl);
  const shadowCol = oklchToHex(Math.min(.18, gL * .4), .03, hA[2]);

  /* ---- sky pieces: a sun or moon, some cut-paper clouds, a few birds ---- */
  const skyG = el('g', {});
  reveal(skyG, 0, -S * .02);
  if (chance(.7)) {
    const r = S * rand(.06, .13), sx = W * rand(.15, .85), sy = clamp(horizon - r * rand(.2, 1.6), r * 1.3, H), rings = wpick([[1, 2], [2, 2], [3, 1]]);
    // A sun reads as a light source: lighter than the sky unless the sky is already near white.
    const sunBase = gL > .78 ? readable([ctx.P.accent], sky, .22)[0] : (() => { const [, C0, H0] = hexToOklch(pick([ctx.P.accent, ...ctx.P.colors])); return oklchToHex(clamp(gL + rand(.25, .4), .75, .96), Math.max(C0, .08), H0); })();
    el('circle', { cx: f(sx + blur * .6), cy: f(sy + blur * .6), r: f(r), fill: shadowCol, 'fill-opacity': (shAlpha * .7).toFixed(2) }, skyG);
    for (let i = 0; i < rings; i++) {
      const [L0, C0, H0] = hexToOklch(sunBase), rr = r * (1 + (rings - 1 - i) * rand(.3, .45));
      el('circle', { cx: f(sx), cy: f(sy), r: f(rr), fill: i === rings - 1 ? sunBase : readable([oklchToHex(clamp(L0 + (gL > .5 ? 1 : -1) * .06 * (rings - i), .05, .97), C0 * .7, H0)], sky, .1)[0] }, skyG);
    }
  }
  if (chance(.55)) {
    const cloudCol = readable([oklchToHex(clamp(gL + (gL > .8 ? -.08 : .09), .05, .98), hexToOklch(sky)[1] * .6, hexToOklch(sky)[2])], sky, .08)[0];
    let d = '';
    for (let c = ri(1, 3); c > 0; c--) {
      // Cloud: a union of overlapping discs, biggest in the middle, sitting on a flat base — one outline once
      // filled, since every piece winds the same way.
      const w = S * rand(.16, .3), x0 = rand(-.1, .9) * W, yb = Math.max(w * .45, rand(.25, .85) * horizon), flip = chance(.5);
      const puffs = pick([[[.2, .15], [.45, .26], [.72, .19]], [[.16, .12], [.38, .22], [.62, .27], [.86, .14]], [[.25, .2], [.6, .28], [.85, .15]]]);
      for (const [px, pr] of puffs) {
        const r = pr * w * rand(.9, 1.1), x = x0 + (flip ? 1 - px : px) * w;
        d += `M${f(x - r)} ${f(yb - r)}a${f(r)} ${f(r)} 0 1 1 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 1 ${f(-2 * r)} 0Z`;   // sits on the base line
      }
      const hb = w * .12, xa = x0 + w * .08, xb = x0 + w * .92;
      d += `M${f(xa)} ${f(yb - 2 * hb)}H${f(xb)}A${f(hb)} ${f(hb)} 0 0 1 ${f(xb)} ${f(yb)}H${f(xa)}A${f(hb)} ${f(hb)} 0 0 1 ${f(xa)} ${f(yb - 2 * hb)}Z`;
    }
    el('path', { d, fill: shadowCol, 'fill-opacity': (shAlpha * .6).toFixed(2), transform: `translate(${f(blur * .5)} ${f(blur * .8)})` }, skyG);
    el('path', { d, fill: cloudCol }, skyG);
  }
  if (chance(.35)) {
    const bc = readable([cols[n - 1]], sky, .3)[0], fx = W * rand(.2, .8), fy = horizon * rand(.25, .7);
    let d = '';
    for (let b = ri(3, 7); b > 0; b--) {
      const x = fx + rand(-1, 1) * S * .12, y = fy + rand(-1, 1) * S * .06, s = S * rand(.012, .022), lift = rand(.2, .6);
      // Bird: two thin crescents meeting at the body — a gull glyph cut as a filled shape.
      d += `M${f(x - s)} ${f(y - s * lift)}Q${f(x - s * .5)} ${f(y - s * .7)} ${f(x)} ${f(y)}Q${f(x + s * .5)} ${f(y - s * .7)} ${f(x + s)} ${f(y - s * lift)}Q${f(x + s * .5)} ${f(y - s * .45)} ${f(x)} ${f(y + s * .25)}Q${f(x - s * .5)} ${f(y - s * .45)} ${f(x - s)} ${f(y - s * lift)}Z`;
    }
    el('path', { d, fill: bc }, skyG);
  }

  /* ---- the sheets, back to front ---- */
  const step = Math.max(3, Math.min(W / 180, (terrain === 'hills' ? lam0 : lam0 * .6) / 16));
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1), base = horizon + (front - horizon) * t ** persp;
    // Relief is capped by the spacing to the next sheet, so a big swell can't bury the sheet behind it.
    const gap = (front - horizon) * Math.abs((Math.min(n - 1, k + 1) / (n - 1)) ** persp - (Math.max(0, k - 1) / (n - 1)) ** persp) / (k > 0 && k < n - 1 ? 2 : 1);
    const lam = lam0 * (.55 + .45 * t) * rand(.85, 1.15), amp = Math.min(amp0 * (.5 + .9 * t) * rand(.8, 1.2), gap * 1.05);
    const prof = TERRAIN[terrain](lam, W), off = rand(-W, W);
    const pts = [];
    for (let x = -pad; x <= W + pad + step; x += step) pts.push([x, base - amp * prof(x + off)]);
    const top = smoothPath(pts), lowest = Math.max(...pts.map(p => p[1]));
    const g = el('g', {});
    reveal(g, .1 + k * (.8 / n), S * (.03 + .02 * t));
    // Shadow band: the cut edge, shifted up a little, closed a few blur-widths below the lowest point.
    const lift = blur * rand(.3, .9), sd = smoothPath(pts.map(([x, y]) => [x + blur * .2, y - lift]));
    el('path', { d: `${sd} L${f(W + pad)} ${f(lowest + blur * 4)} L${f(-pad)} ${f(lowest + blur * 4)}Z`, fill: shadowCol, 'fill-opacity': clamp(shAlpha * (.8 + .4 * t), 0, .8).toFixed(2), filter: `url(#pl-sh-${uid})` }, g);
    const sheet = el('path', { d: `${top} L${f(W + pad)} ${f(H + pad)} L${f(-pad)} ${f(H + pad)}Z`, fill: cols[k] }, g);
    sheet.dataset.layer = k;
  }
}
