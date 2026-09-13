import { ctx, rand, ri, chance, shuffle, wpick, svgRoot, labDist, hexToOklch, oklchToHex, groundScheme } from '../utils.js';
// Asanoha, the Japanese hemp-leaf pattern. Start from a triangular lattice and divide every equilateral triangle
// with lines from its centroid to its three corners. Every lattice point then has twelve lines meeting at it,
// and the long diamonds around it — corner, centroid, neighbouring corner, next centroid, split lengthwise by
// the lattice edge — are the six leaves of the star.
//
// Every diamond is shared by the stars at both of its ends, so a plain line drawing reads as stars everywhere
// at once. To make particular stars read, colour by a 3-colouring of the lattice points ((i - j) mod 3): leaves
// belonging to the points of one class never touch each other, and the lattice edges joining the OTHER two
// classes are exactly the kikko (tortoiseshell) hexagon framework around those stars. That one fact drives the
// fill modes (whole leaves, pinwheeled half-leaves, alternating leaves) and the kikko overlay.
//
// All geometry comes from one lattice formula, so every spoke ends exactly on a lattice point or centroid and
// every facet edge is a drawn line — which also hides the antialiasing seams between neighbouring fills.

const SQ3 = Math.sqrt(3);
const f = v => v.toFixed(2);
const mod = (x, m) => ((x % m) + m) % m;

export default function asanoha() {
  const { ground, fg, ink } = groundScheme();
  const { W, H, S } = ctx;
  const a = S / rand(3.5, 11);                                   // lattice edge; a star is 2a across
  const rot = chance(.3) ? rand(0, 60) : (chance(.5) ? 0 : 90);  // the lattice repeats every 60°
  const cx = W / 2, cy = H / 2;
  const R = Math.hypot(W, H) / 2 + 2 * a;                        // cover the corners whatever the rotation

  const fillMode = wpick([['lines', 3], ['stars', 2], ['pinwheel', 2.5], ['alternate', 1.5], ['emboss', 2]]);
  const kikko = chance(.35);                                     // heavier hexagon framework over the star class
  const starCls = ri(0, 2);

  // ---- colours. Lines sit on the ground and on every fill, so the fills are held to a lightness gap from the
  // line colour; they're chosen from the palette's own colours first, then its hues at other lightnesses, then the
  // ground's hue (tone-on-tone). Emboss is tonal on purpose: three steps of one hue read as light on relief.
  const [gL, gC, gH] = hexToOklch(ground);
  const emboss = fillMode === 'emboss';
  // Emboss is built rather than searched: three close steps of the ground's own hue read as one material catching
  // light on three faces, where three unrelated colours read as confetti. The ground itself is always one of the
  // faces (left unpainted), so no face can land near it; near either end of the lightness range the other two
  // faces both go to the side with room. The line then takes whichever end is far from all three.
  const dL = rand(.07, .11), shift = gL + dL > .96 ? -1 : gL - dL < .06 ? 1 : 0;
  const faceL = [1, 0, -1].map(k => gL + (k + shift) * dL);
  const embossCols = faceL.map((L, k) => k === 1 + shift ? ground : oklchToHex(L, Math.max(gC, .02), gH));
  let line = fillMode === 'lines' && chance(.4) ? (readableLine(fg, ground) ?? ink) : ink;
  if (emboss) {
    const up = faceL[0] + .32, down = faceL[2] - .32;
    line = oklchToHex(up <= .99 && (down < .02 || chance(gL < .5 ? .85 : .15)) ? rand(up, .99) : rand(.02, down), Math.min(.04, gC), gH);
  }
  const lineL = hexToOklch(line)[0];
  const fgs = shuffle(fg).map(hexToOklch);
  const steps = Array.from({ length: 31 }, (_, k) => .06 + k * .03);
  const tierFg = fgs.map(([L, C, Hh]) => oklchToHex(L, C, Hh));
  const tierHue = fgs.flatMap(([, C, Hh]) => steps.map(L => oklchToHex(L, C, Hh)));
  const tierGround = steps.map(L => oklchToHex(L, Math.max(gC, .025) * 1.2, gH));
  const tonal = chance(.4);
  const tiers = tonal ? [tierGround, tierFg, tierHue] : [tierFg, tierHue, tierGround];
  const pickTone = (avoid, lo, hi) => {
    for (const [dlo, dhi] of [[lo, hi], [.1, 1]]) for (const tier of tiers) {
      const ok = tier.filter(x => {
        const d = labDist(x, ground);
        return d >= dlo && d <= dhi && avoid.every(q => labDist(x, q) >= .1) && Math.abs(hexToOklch(x)[0] - lineL) >= .3;
      });
      if (ok.length) return ok[ri(0, ok.length - 1)];
    }
    return null;
  };
  const [lo, hi] = tonal ? [.08, .2] : [.18, 1];
  const tA = emboss ? null : pickTone([], lo, hi), tB = tA && pickTone([tA], lo, hi);

  // ---- geometry. Lattice point L(i,j) = O + i·e1 + j·e2, in the unrotated frame centred on the canvas.
  const e1 = [a, 0], e2 = [a / 2, a * SQ3 / 2];
  const Lp = (i, j) => [cx + i * e1[0] + j * e2[0], cy + j * e2[1]];
  const jN = Math.ceil(R / e2[1]) + 1;
  const NB = 8, ring = (x, y) => Math.min(NB - 1, Math.floor(Math.hypot(x - cx, y - cy) / R * NB));
  const bands = Array.from({ length: NB }, () => ({ fill: ['', '', ''], thin: '', heavy: '' }));
  const pt = p => `${f(p[0])} ${f(p[1])}`;
  const seg = (p, q) => `M${pt(p)}L${pt(q)}`;
  const tri = (p, q, r) => `M${pt(p)}L${pt(q)}L${pt(r)}Z`;
  const cls = (i, j) => mod(i - j, 3);

  // Which tone (0..2) a facet gets, or -1 for none. A facet is the half-leaf (P, Q, C): lattice edge PQ plus
  // the centroid C of the triangle on one side of it.
  const facetTone = (P, pc, Q, qc, C) => {
    if (emboss) {
      // outward direction of the facet from its edge, one of six; adjacent pairs share a tone like lit faces
      const mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2;
      const k = mod(Math.round(Math.atan2(C[1] - my, C[0] - mx) / (Math.PI / 3) - .5), 6);
      return [0, 0, 1, 1, 2, 2][k];
    }
    const centre = pc === starCls ? P : qc === starCls ? Q : null, other = centre === P ? Q : P;
    if (!centre) return fillMode === 'stars' && tB ? 1 : -1;       // stars: the kikko-side leaves take tone B
    const side = (other[0] - centre[0]) * (C[1] - centre[1]) - (other[1] - centre[1]) * (C[0] - centre[0]) > 0;
    if (fillMode === 'stars') return 0;
    if (fillMode === 'pinwheel') return side ? 0 : (tB ? 1 : -1);
    // alternate: leaf direction index around the star's centre, even leaves A, odd leaves B
    const dir = mod(Math.round(Math.atan2(other[1] - centre[1], other[0] - centre[0]) / (Math.PI / 3)), 6);
    return dir & 1 ? (tB ? 1 : -1) : 0;
  };
  const toneCols = emboss ? embossCols.map(c => c === ground ? null : c) : [tA, tB, null];
  const drawTone = t => fillMode !== 'lines' && toneCols[t];

  for (let j = -jN; j <= jN; j++) {
    const iN = Math.ceil((R + Math.abs(j) * e2[0]) / a) + 1;
    for (let i = -iN - j; i <= iN - j; i++) {
      const P = Lp(i, j), Pr = Lp(i + 1, j), Pu = Lp(i, j + 1), Pd = Lp(i + 1, j + 1);
      if (Math.hypot(P[0] - cx, P[1] - cy) > R + a) continue;
      const c0 = cls(i, j), cR = cls(i + 1, j), cU = cls(i, j + 1), cD = cls(i + 1, j + 1);
      const b = bands[ring(P[0] + a / 2, P[1] + a / 2)];
      // up triangle (P, Pr, Pu) and down triangle (Pr, Pd, Pu), each with its centroid
      for (const [V, cs] of [[[P, Pr, Pu], [c0, cR, cU]], [[Pr, Pd, Pu], [cR, cD, cU]]]) {
        const C = [(V[0][0] + V[1][0] + V[2][0]) / 3, (V[0][1] + V[1][1] + V[2][1]) / 3];
        for (let k = 0; k < 3; k++) {
          const p = V[k], q = V[(k + 1) % 3];
          const t = facetTone(p, cs[k], q, cs[(k + 1) % 3], C);
          if (t >= 0 && drawTone(t)) b.fill[t] += tri(p, q, C);
          b.thin += seg(C, p);                                    // spoke
        }
      }
      // The up triangle's three edges cover every lattice edge exactly once.
      for (const [p, q, cp, cq] of [[P, Pr, c0, cR], [Pr, Pu, cR, cU], [Pu, P, cU, c0]]) {
        if (kikko && cp !== starCls && cq !== starCls) b.heavy += seg(p, q);
        else b.thin += seg(p, q);
      }
    }
  }

  // ---- draw. A few paths per ring, blooming out from the centre; the rotation lives on an un-animated group.
  const svg = svgRoot();
  const NS = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(NS, 'g');
  if (rot) g.setAttribute('transform', `rotate(${f(rot)} ${f(cx)} ${f(cy)})`);
  svg.appendChild(g);
  const add = (attrs, delay) => {
    const e = document.createElementNS(NS, 'path');
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    e.style.setProperty('--t0', 'none'); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', '1');
    e.style.animation = `fin .55s ease ${delay.toFixed(2)}s both`;
    g.appendChild(e);
    return e;
  };
  const w = Math.max(.8, a * rand(.012, .04));
  const heavyW = w * rand(2.5, 4.5);
  const lineAttrs = (width, colour) => ({ fill: 'none', stroke: colour, 'stroke-width': f(width), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  // Layer by layer across all rings, not ring by ring: ring k+1's fills would otherwise paint over half the width
  // of ring k's lines where the two meet.
  for (let b = 0; b < NB; b++) for (let t = 0; t < 3; t++) if (bands[b].fill[t] && toneCols[t]) add({ d: bands[b].fill[t], fill: toneCols[t] }, b * .1);
  for (let b = 0; b < NB; b++) if (bands[b].thin) add({ d: bands[b].thin, ...lineAttrs(w, line) }, b * .1 + .12);
  for (let b = 0; b < NB; b++) if (bands[b].heavy) add({ d: bands[b].heavy, ...lineAttrs(heavyW, line) }, b * .1 + .2);
}

// A palette colour usable for thin lines on the ground: it needs a real lightness gap, not just a hue difference.
function readableLine(fg, ground) {
  const gL = hexToOklch(ground)[0];
  const ok = fg.filter(c => Math.abs(hexToOklch(c)[0] - gL) >= .35);
  return ok.length ? ok[ri(0, ok.length - 1)] : null;
}
