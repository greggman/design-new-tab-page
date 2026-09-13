import { ctx, rand, ri, chance, pick, shuffle, wpick, svgRoot, labDist, readable, hexToOklch, oklchToHex, groundScheme } from '../utils.js';
// Kente: Asante / Ewe strip-woven cloth. A narrow loom makes a long strip a hand-span wide; the cloth is many
// strips sewn edge to edge. Along each strip the weaver alternates warp-faced sections — the warp threads on
// top, so all you see is the strip's own fine lengthwise pinstripes — with weft-faced blocks, where the weft is
// packed down over the warp and carries the motif: bands, checks, stepped zigzags, diamonds, ladders.
//
// What makes it read as kente rather than "stripes and checks" is the sewing: neighbouring strips are laid half a
// repeat out of step, so the motif blocks land beside plain warp and the blocks form a staggered checkerboard
// across the whole cloth. Everything is on a thread grid: each strip is a whole number of units across, every
// motif is a cell function on that grid, and all edges snap to whole pixels, so the steps in a zigzag or diamond
// are the stepped edges of real weaving and neighbouring rectangles never leave an antialiased hairline between.

const NS = 'http://www.w3.org/2000/svg';

// Motifs. Each factory takes the block's grid (nx across, ny down) and returns (i, j) -> slot: 0 is the block's
// ground, 1 and 2 its two thread colours.
const tri = (v, p) => Math.abs((((v % (2 * p)) + 2 * p) % (2 * p)) - p);     // 0..p..0 triangle wave, period 2p
const MOTIFS = {
  bands(nx, ny) {
    const rows = [];
    let s = 0;
    while (rows.length < Math.ceil(ny / 2)) { s = (s + ri(1, 2)) % 3; const t = ri(1, 3); for (let k = 0; k < t; k++) rows.push(s); }
    return (i, j) => rows[Math.min(j, ny - 1 - j)];
  },
  checks(nx, ny) {
    const k = Math.max(1, Math.floor(nx / ri(4, 7))), two = chance(.5);
    return (i, j) => ((Math.floor(i / k) + Math.floor(j / k)) & 1) ? (two && (Math.floor(j / k) >> 1) & 1 ? 2 : 1) : 0;
  },
  // Zigzags and sawtooth rows only lay down as many whole bands as fit the block, centred in it — a band cut off
  // by the block edge leaves loose stitches that read as noise.
  zigzag(nx, ny) {
    const A = Math.max(2, Math.round(nx / ri(3, 5))), t = ri(1, 2), p = A + t + ri(1, 2), ph = ri(0, A);
    const nb = Math.max(1, Math.floor((ny - A - t) / p) + 1), top = Math.floor((ny - (nb - 1) * p - A - t) / 2);
    return (i, j) => { const v = j - top - tri(i + ph, A), m = ((v % p) + p) % p, b = Math.floor(v / p); return m < t && b >= 0 && b < nb ? (b & 1 ? 2 : 1) : 0; };
  },
  sawtooth(nx, ny) {
    const A = Math.max(2, Math.round(nx / ri(3, 5))), g = ri(0, 2), p = A + g;
    const nb = Math.max(1, Math.floor((ny + g) / p)), top = Math.floor((ny - nb * p + g) / 2);
    return (i, j) => { const v = j - top, m = ((v % p) + p) % p, b = Math.floor(v / p); if (m >= A || b < 0 || b >= nb) return 0; return m >= tri(i, A) ? (b & 1 ? 2 : 1) : 0; };
  },
  diamonds(nx, ny) {
    if (chance(.5)) {                                               // one big stepped diamond, concentric rings
      const cx = (nx - 1) / 2, cy = (ny - 1) / 2, R = Math.min(nx, ny) / 2 - .5, t = ri(1, 2);
      return (i, j) => { const d = Math.abs(i - cx) + Math.abs(j - cy); return d > R ? 0 : (Math.floor((R - d) / t) & 1) ? 2 : 1; };
    }
    const s = Math.max(2, Math.round(nx / ri(3, 4))), off = (nx / 2) % s;   // a lattice of small ones
    return (i, j) => { const a = tri(i - off + s / 2, s / 2), b = tri(j + s / 2, s / 2); return a + b <= s / 2 - 1 ? ((a + b) < s / 2 - 2 ? 2 : 1) : 0; };
  },
  hourglass(nx, ny) {
    const cx = (nx - 1) / 2, cy = (ny - 1) / 2, k = nx / ny;
    return (i, j) => { const e = Math.abs(j - cy) * k - Math.abs(i - cx); return e >= 0 ? (e >= 2.5 ? 2 : 1) : 0; };
  },
  ladder(nx, ny) {
    const rail = nx >= 14 ? 2 : 1, step = ri(2, 3);
    return (i, j) => (i >= 1 && i < 1 + rail) || (i <= nx - 2 && i > nx - 2 - rail) ? 1 : (i > rail && i < nx - 1 - rail && j % step === 1 ? 2 : 0);
  },
};

// Strip and block layout, pure so it can be checked: strips tile [0, W] edge to edge, blocks run contiguously down
// each strip from above the top edge to past the bottom, and odd strips run half a repeat out of step.
export function layoutKente(W, H, { n, weft, warp, inlay }) {
  const P = weft + warp, strips = [], phase = ri(0, P - 1);
  for (let s = 0; s < n; s++) {
    const x0 = Math.round(s * W / n), x1 = Math.round((s + 1) * W / n), blocks = [];
    let y = -phase - (s & 1 ? Math.round(P / 2) : 0) - P, k = 0;
    while (y < H) {
      blocks.push({ y0: y, y1: y + weft, kind: 'weft', k });
      y += weft;
      if (inlay) {
        // a narrow weft band inlaid in the middle of the warp section
        const a = Math.floor((warp - inlay) / 2), b = warp - inlay - a;
        blocks.push({ y0: y, y1: y + a, kind: 'warp' }, { y0: y + a, y1: y + a + inlay, kind: 'inlay' }, { y0: y + a + inlay, y1: y + warp, kind: 'warp' });
      } else blocks.push({ y0: y, y1: y + warp, kind: 'warp' });
      y += warp; k++;
    }
    strips.push({ s, x0, x1, blocks });
  }
  return strips;
}

export default function kente() {
  const { ground, fg, ink } = groundScheme();
  const W = ctx.W, H = ctx.H, S = ctx.S;

  // ---- the thread palette: kente is saturated, so the palette's colours get their chroma pushed up.
  const vivid = c => { const [L, C, Hh] = hexToOklch(c); return oklchToHex(L, Math.min(.3, C * rand(1.1, 1.5)), Hh); };
  const cloth = [];
  for (const c of shuffle([...fg.map(vivid), ink, ground])) if (cloth.every(o => labDist(o, c) >= .14)) cloth.push(c);
  const nCol = Math.min(cloth.length, ri(3, 5));
  const pal = cloth.slice(0, Math.max(3, nCol));
  while (pal.length < 3) pal.push(readable([oklchToHex(rand(.2, .9), .15, rand(0, 360))], pal[0], .25)[0]);
  const on = (bg, avoid = []) => {
    // a thread colour that reads on `bg`; prefer ones not already used in this block
    const ok = shuffle(pal.filter(c => labDist(c, bg) >= .22));
    return ok.find(c => !avoid.includes(c)) ?? ok[0] ?? readable([pick(pal)], bg, .22)[0];
  };

  // ---- strips
  const n = Math.max(4, Math.round(W / (S / rand(6, 11))));
  const sw = W / n;
  const nx = 2 * Math.round(Math.max(6, Math.min(13, sw / rand(4.5, 8) / 2)));   // thread units across a strip
  const unit = sw / nx;
  const weft = Math.round(sw * rand(.9, 1.4));
  const warp = chance(.55) ? weft : Math.round(weft * rand(1.1, 1.35));
  const inlay = chance(.35) ? Math.max(3, Math.round(unit * ri(2, 3))) : 0;
  const strips = layoutKente(W, H, { n, weft, warp, inlay });

  const kinds = shuffle(Object.keys(MOTIFS)).slice(0, ri(2, 4)), nyWeft = Math.max(4, Math.round(weft / unit));
  const nTypes = wpick([[2, 5], [3, 2]]);
  // Strip types get different warp colours where the palette allows, and weft blocks avoid every warp colour, so a
  // motif block always stands out from the plain warp beside and above it — that contrast IS the checkerboard.
  const bases = shuffle(pal);
  const types = Array.from({ length: nTypes }, (_, ti) => {
    const base = bases[ti % bases.length], pin1 = on(base), pin2 = on(base, [pin1]);
    // Warp pinstripes: half the strip as [units, slot] runs, mirrored. Mostly single-thread pins between short runs
    // of the base colour, with the odd wider stripe — a warp face is dense with fine lines, not a few broad ones.
    const half = [];
    let u = 0;
    const dense = rand(.35, .6);
    if (chance(.7)) { half.push([1, 1]); u++; }
    while (u < nx / 2) {
      const g = Math.min(nx / 2 - u, chance(dense) ? 1 : ri(2, 3)); half.push([g, 0]); u += g;
      if (u < nx / 2) { const t = Math.min(nx / 2 - u, chance(.8) ? 1 : 2); half.push([t, chance(.6) ? 1 : 2]); u += t; }
    }
    const stripes = [...half, ...half.slice().reverse()];
    // each weft block in turn: its ground and two thread colours, and its motif
    const blocks = Array.from({ length: ri(2, 3) }, (_, q) => {
      const free = pal.filter(c => !bases.slice(0, nTypes).includes(c) && labDist(c, base) >= .12);
      const bg = free.length && chance(.8) ? pick(free) : pick(pal.filter(c => c !== base)) ?? base, c1 = on(bg), c2 = on(bg, [c1]);
      const kind = kinds[(q + ti) % kinds.length];
      // built once per strip type, so every strip of this type carries the identical block — it's one loom setup
      return { bg, c1, c2, f: MOTIFS[kind](nx, nyWeft), border: chance(.4) };
    });
    return { base, cols: [base, pin1, pin2], stripes, blocks, inlay: { bg: on(base), c: base } };
  });
  const typeOf = s => nTypes === 3 ? types[[0, 1, 0, 2][s % 4]] : types[s & 1];

  // ---- geometry, one path per (layer, reveal group, colour). Grounds go in the lower layer, threads above.
  const G = Math.min(n, 8), groupOf = s => Math.floor(s * G / n);
  const layers = [new Map(), new Map()], tex = [[], []];             // tex: [horizontal, vertical] per group
  const rect = (L, g, col, x0, y0, x1, y1) => {
    if (x1 <= x0 || y1 <= y0) return;
    const key = g + '|' + col, m = layers[L];
    m.set(key, (m.get(key) ?? '') + `M${x0} ${y0}h${x1 - x0}v${y1 - y0}h${x0 - x1}z`);
  };
  const pitch = Math.max(2.2, unit * rand(.45, .6));
  for (const st of strips) {
    const T = typeOf(st.s), g = groupOf(st.s), X = i => st.x0 + Math.round(i * (st.x1 - st.x0) / nx);
    tex[0][g] ??= ''; tex[1][g] ??= '';
    for (const b of st.blocks) {
      const y0 = Math.max(b.y0, -2), y1 = Math.min(b.y1, H + 2);
      if (y1 <= y0) continue;
      if (b.kind === 'warp') {
        rect(0, g, T.base, st.x0, y0, st.x1, y1);
        let i = 0;
        for (const [w, slot] of T.stripes) { if (slot) rect(1, g, T.cols[slot], X(i), y0, X(i + w), y1); i += w; }
        for (let x = st.x0 + pitch / 2; x < st.x1; x += pitch) tex[1][g] += `M${x.toFixed(1)} ${y0}V${y1}`;
        continue;
      }
      if (b.kind === 'inlay') {
        rect(0, g, T.inlay.bg, st.x0, y0, st.x1, y1);
        const t = Math.max(1, Math.round((b.y1 - b.y0) / 3));
        rect(1, g, T.inlay.c, st.x0, b.y0 + t, st.x1, b.y1 - t);
        continue;
      }
      // weft-faced block: fill its ground, then run-length the motif's cells row by row
      const B = T.blocks[b.k % T.blocks.length], ny = nyWeft, f = B.f;
      const Y = j => b.y0 + Math.round(j * (b.y1 - b.y0) / ny), cols = [B.bg, B.c1, B.c2];
      rect(0, g, B.bg, st.x0, y0, st.x1, y1);
      for (let j = 0; j < ny; j++) {
        const ya = Y(j), yb = Y(j + 1);
        if (yb < -2 || ya > H + 2) continue;
        let run = 0, slot = B.border && (j === 0 || j === ny - 1) ? 2 : f(0, j);
        for (let i = 1; i <= nx; i++) {
          const sl = i === nx ? -1 : B.border && (j === 0 || j === ny - 1) ? 2 : f(i, j);
          if (sl !== slot) { if (slot > 0) rect(1, g, cols[slot], X(run), ya, X(i), yb); run = i; slot = sl; }
        }
      }
      for (let y = y0 + pitch / 2; y < y1; y += pitch) tex[0][g] += `M${st.x0} ${y.toFixed(1)}H${st.x1}`;
    }
  }

  // ---- draw
  const svg = svgRoot();
  const grp = () => { const e = document.createElementNS(NS, 'g'); svg.appendChild(e); return e; };
  const mk = (parent, attrs, delay) => {
    const e = document.createElementNS(NS, 'path');
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    e.style.setProperty('--t0', 'none'); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', '1');
    e.style.animation = `fin .5s ease ${delay.toFixed(2)}s both`;
    parent.appendChild(e);
  };
  const order = chance(.5) ? i => i : i => G - 1 - i;   // strips sewn on from either side
  const delayOf = g => order(g) * .12;
  const lower = grp(), upper = grp(), texG = grp();
  for (const [key, d] of layers[0]) { const [g, col] = key.split('|'); mk(lower, { d, fill: col }, delayOf(+g)); }
  for (const [key, d] of layers[1]) { const [g, col] = key.split('|'); mk(upper, { d, fill: col }, delayOf(+g) + .08); }
  // Woven texture: hairlines along the weft in the weft-faced blocks and along the warp elsewhere, a shade darker
  // than whatever thread they cross.
  const texOp = rand(.07, .13).toFixed(2);
  for (let g = 0; g < G; g++) for (const dir of [0, 1]) if (tex[dir][g]) mk(texG, { d: tex[dir][g], fill: 'none', stroke: '#000', 'stroke-opacity': texOp, 'stroke-width': .7 }, delayOf(g) + .15);
  // seams: a darker line where each strip is sewn to the next
  let seam = '';
  for (let s = 1; s < n; s++) { const x = strips[s].x0; seam += `M${x} 0V${H}`; }
  if (seam) mk(texG, { d: seam, fill: 'none', stroke: '#000', 'stroke-opacity': rand(.3, .45).toFixed(2), 'stroke-width': Math.max(1, S * .0016).toFixed(1) }, .9);
}
