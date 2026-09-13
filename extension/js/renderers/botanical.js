import { ctx, rand, ri, pick, chance, shuffle, wpick, clamp, mix, svgRoot, labDist, readable, hexToOklch, oklchToHex, groundScheme } from '../utils.js';
// Botanical: procedural plant specimens drawn the way botanical prints draw them — a herbarium plate of one
// specimen per cell, pressed flowers scattered flat, a meadow growing up from the bottom edge, or one large
// specimen — in fine ink line art, flat silhouettes, silhouettes with the veins cut out, or ink over a colour wash.
//
// Every plant is grown from a few recursive rules in its own unit space (base at the origin, about one unit
// tall): a stem is a centreline whose heading turns smoothly, and things hang off points along it — leaves at
// nodes (alternate or opposite, shrinking toward the tip), pinnae that are themselves little stems with leaflets
// (a bipinnate fern is two levels of that), whorls of rays ending in florets (an umbel), a projected sphere of
// seed stalks (a dandelion clock). The specimen is then fitted into its cell or placed on the canvas.
//
// Stems taper, so they're drawn as filled outlines (a stroke has only one width), and leaves are closed curved
// outlines with real leaf silhouettes — never polylines. Veins in the silhouette style are HOLES: each vein is a
// thin shape wound the opposite way to its leaf, so under the nonzero fill rule it cuts through that leaf only.
// A vein never shows on top of some other leaf that overlaps it, and a leaf and its veins stay in one path.
//
// A meadow runs to thousands of leaves, so nothing here is one element per shape: geometry is poured into one
// path per colour per reveal step (and per depth layer or pressed specimen, where stacking order matters). Each
// piece of a plant carries a growth time — stem first, leaves as the stem reaches them, flowers last — and the
// reveal fades those steps in in order, so plants appear to grow.

const PI = Math.PI, TAU = PI * 2, NS = 'http://www.w3.org/2000/svg';
const f = v => String(Math.round(v * 10) / 10);
const P2 = p => f(p[0]) + ' ' + f(p[1]);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth01 = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/* ---------- stems ---------- */

// A centreline of n+1 points whose heading turns by `bend` over its length (plus an optional S-shaped wiggle).
export function curve(x, y, ang, len, bend = 0, n = 16, wig = 0, power = 1) {
  const head = s => ang + bend * s ** power + wig * Math.sin(s * TAU);
  const pts = [[x, y]], angs = [head(0)], ds = len / n;
  for (let i = 1; i <= n; i++) {
    const a = head((i - .5) / n);
    x += Math.cos(a) * ds; y += Math.sin(a) * ds;
    pts.push([x, y]); angs.push(head(i / n));
  }
  return { pts, angs };
}
// point and heading at fraction s along a centreline
const at = (c, s) => {
  const u = clamp(s, 0, 1) * (c.pts.length - 1), i = Math.min(c.pts.length - 2, Math.floor(u)), k = u - i, p = c.pts[i], q = c.pts[i + 1];
  return [lerp(p[0], q[0], k), lerp(p[1], q[1], k), lerp(c.angs[i], c.angs[i + 1], k)];
};
const sub = (c, s0, s1, n = 6) => { const pts = [], angs = []; for (let i = 0; i <= n; i++) { const [x, y, a] = at(c, lerp(s0, s1, i / n)); pts.push([x, y]); angs.push(a); } return { pts, angs }; };

/* ---------- leaf shapes ----------
   Half an outline, from the base (t=0) to the tip (t=1), in units of the leaf's length (t) and half-width (s);
   the other half is its mirror image. Cubic shapes are cheap; lobed and toothed margins are sampled and smoothed. */
const SH = {
  ovate: { r: .5, h: [['C', [.02, 1.45], [.5, 1.05], [1, 0]]] },
  elliptic: { r: .36, h: [['C', [.12, 1.3], [.78, 1.3], [1, 0]]] },
  lanceolate: { r: .17, h: [['C', [.1, 1.25], [.42, 1.05], [1, 0]]] },
  obovate: { r: .45, h: [['C', [.28, .75], [.78, 1.55], [1, 0]]] },
  round: { r: .72, h: [['C', [-.05, 1.3], [.85, 1.45], [1, 0]]] },
  petal: { r: .28, h: [['C', [.05, .9], [.85, 1.45], [1, 0]]] },
  broadPetal: { r: .55, h: [['C', [.1, .5], [.8, 1.6], [1, 0]]] },
  oblong: { r: .42, h: [['C', [0, 1.15], [.92, 1.3], [1, 0]]] },
  tulip: { r: .38, h: [['C', [.15, 1.05], [.72, 1.5], [1, 0]]] },
  grain: { r: .4, h: [['C', [.05, 1.2], [.6, 1.25], [1, 0]]] },
  // a hanging bell: narrow where it meets its stalk, flared, and a scalloped rim
  bell: { r: .55, s0: .2, h: [['C', [.1, .7], [.6, .6], [.94, 1]], ['Q', [.86, .7], [1.03, .48]], ['Q', [.9, .22], [1, 0]]] },
};
const sampled = (r, prof, m) => {
  const pts = []; for (let i = 0; i <= m; i++) pts.push([i / m, prof(i / m)]);
  const h = []; for (let i = 1; i < m; i++) h.push(['Q', pts[i], i < m - 1 ? [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2] : pts[m]]);
  return { r, h };
};
function leafShape(name) {
  if (name === 'lobed') {
    // oak-like: an ovate envelope pinched into rounded lobes, the sinuses cut in toward the midrib
    const k = ri(3, 5), e = t => t ** .55 * (1 - t) ** .9 / .42;
    return sampled(.55, t => e(t) * (.42 + .58 * Math.abs(Math.sin(PI * (k * t ** .9 + .5))) ** .7), k * 6);
  }
  if (name === 'runcinate') {
    // dandelion: deep teeth that point back toward the base
    const k = ri(4, 6), e = t => t ** .5 * (1 - t) ** .8 / .42;
    return sampled(.25, t => e(t) * (1 - .6 * ((t * k + .15) % 1) ** 1.5), k * 4);
  }
  if (name === 'serrate') {
    const k = ri(9, 14), e = t => t ** .5 * (1 - t) ** 1.2 / .37;
    return sampled(.2, t => e(t) * (1 - .16 * ((t * k) % 1)), k * 3);
  }
  return SH[name];
}
// s(t) along a shape's half outline, for placing veins safely inside it
function profile(sh) {
  if (sh.prof) return sh.prof;
  const tab = [[0, sh.s0 ?? 0]], M = 40;
  let p = tab[0];
  for (const [type, ...q] of sh.h) {
    const e = q[q.length - 1];
    for (let i = 1; i <= M; i++) {
      const u = i / M;
      tab.push(type === 'C' ? [0, 1].map(j => (1 - u) ** 3 * p[j] + 3 * (1 - u) ** 2 * u * q[0][j] + 3 * (1 - u) * u * u * q[1][j] + u ** 3 * e[j])
        : [0, 1].map(j => (1 - u) ** 2 * p[j] + 2 * (1 - u) * u * q[0][j] + u * u * e[j]));
    }
    p = e;
  }
  tab.sort((a, b) => a[0] - b[0]);
  return (sh.prof = t => {
    let i = 0; while (i < tab.length - 2 && tab[i + 1][0] < t) i++;
    const [t0, s0] = tab[i], [t1, s1] = tab[i + 1];
    return Math.max(0, t1 > t0 ? lerp(s0, s1, clamp((t - t0) / (t1 - t0), 0, 1)) : Math.min(s0, s1));
  });
}

/* ---------- primitives (in whatever space the plant is in) ---------- */
const stem = (P, c, w0, w1, t0, t1, role = 'leaf') => P.push({ k: 'stem', pts: c.pts, w0, w1, t0, t1, role });
const leaf = (P, x, y, ang, L, w, sh, t, role = 'leaf', bend = 0) => P.push({ k: 'leaf', x, y, ang, L, w, sh, bend, t, role });
const disc = (P, x, y, r, t, role = 'flower') => P.push({ k: 'disc', x, y, r, t, role });
const line = (P, pts, t, role = 'flower', lw = 1) => P.push({ k: 'line', pts, t, role, lw });

// uniform scale + rotation + translation of a plant (never a reflection — that would flip every winding)
export function place(P, sc, rot, tx, ty) {
  const c = Math.cos(rot), s = Math.sin(rot), T = ([x, y]) => [tx + (x * c - y * s) * sc, ty + (x * s + y * c) * sc];
  return P.map(p => {
    if (p.k === 'stem') return { ...p, pts: p.pts.map(T), w0: p.w0 * sc, w1: p.w1 * sc };
    if (p.k === 'line') return { ...p, pts: p.pts.map(T) };
    const [x, y] = T([p.x, p.y]);
    return p.k === 'leaf' ? { ...p, x, y, ang: p.ang + rot, L: p.L * sc, w: p.w * sc } : { ...p, x, y, r: p.r * sc };
  });
}
// conservative bounds: leaves by a circle that holds all of their control points
export function bounds(P) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const add = (x, y, r = 0) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
  for (const p of P) {
    if (p.k === 'stem') for (const q of p.pts) add(q[0], q[1], Math.max(p.w0, p.w1) / 2);
    else if (p.k === 'line') for (const q of p.pts) add(q[0], q[1]);
    else if (p.k === 'disc') add(p.x, p.y, p.r);
    else add(p.x + Math.cos(p.ang) * p.L / 2, p.y + Math.sin(p.ang) * p.L / 2, Math.hypot(p.L * .56, p.w * 1.6) + Math.abs(p.bend) * p.L);
  }
  return [x0, y0, x1, y1];
}
// Fit a plant into a box by the extent of the paths it will actually draw (every anchor and control point), so a
// specimen fills its cell rather than the loose circles bounds() uses.
const fitBox = (P, [bx, by, bw, bh], rot = 0) => {
  const R = place(P, 100 / Math.max(1e-9, ...(b => [b[2] - b[0], b[3] - b[1]])(bounds(P))), rot, 0, 0);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of R) emit(p, 'silhouette', (k, r, t, d) => pathPoints(d, (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }), { minW: 0 });
  const sc = Math.min(bw / (x1 - x0), bh / (y1 - y0));
  return place(R, sc, 0, bx + bw / 2 - (x0 + x1) / 2 * sc, by + bh / 2 - (y0 + y1) / 2 * sc);
};

/* ---------- plant parts ---------- */
const blossom = (P, x, y, R, t, n = 5) => {
  const r0 = rand(0, TAU);
  for (let k = 0; k < n; k++) leaf(P, x, y, r0 + k * TAU / n, R, R * .62, SH.obovate, t + k * .01, 'flower');
  disc(P, x, y, R * .22, t + .05, 'centre');
};
const flowerHead = (P, x, y, R, t, kind = pick(['daisy', 'cosmos', 'aster'])) => {
  const [n, sh, ratio] = kind === 'cosmos' ? [ri(6, 8), SH.broadPetal, .5] : kind === 'aster' ? [ri(24, 32), SH.petal, .13] : [ri(13, 21), SH.petal, .24];
  // petals start under the rim of the disc, not at the centre, so in a line drawing they don't all cross there
  const r0 = rand(0, TAU), dr = R * (kind === 'cosmos' ? .22 : .3);
  for (let k = 0; k < n; k++) { const a = r0 + k * TAU / n; leaf(P, x + Math.cos(a) * dr * .7, y + Math.sin(a) * dr * .7, a, R - dr * .7, R * ratio, sh, t + (k % 3) * .015, 'flower'); }
  disc(P, x, y, dr, t + .06, 'centre');
};
const berries = (P, x, y, a, R, t) => {
  for (let k = ri(3, 6); k > 0; k--) {
    const ba = a + rand(-1.1, 1.1), bl = R * rand(1.2, 2.6), ex = x + Math.cos(ba) * bl, ey = y + Math.sin(ba) * bl;
    line(P, [[x, y], [lerp(x, ex, .5) + Math.cos(a) * bl * .15, lerp(y, ey, .5) + Math.sin(a) * bl * .15], [ex, ey]], t, 'leaf', 1);
    disc(P, ex, ey, R * rand(.8, 1.1), t + .04, 'flower');
  }
};
const bud = (P, x, y, a, L, t) => {
  leaf(P, x, y, a, L, L * .36, SH.ovate, t, 'flower');
  for (const sd of [-1, 1]) leaf(P, x, y, a + sd * .5, L * .6, L * .14, SH.lanceolate, t, 'leaf', sd * .1);
};
// a feathery compound leaf: a little rachis with narrow leaflets in pairs
const frond = (P, x, y, ang, len, t, sd) => {
  const c = curve(x, y, ang, len, sd * rand(.2, .5), 8), n = ri(4, 6);
  stem(P, c, .006, .002, t, t + .08);
  for (let i = 0; i < n; i++) for (const k of [-1, 1]) {
    const s = (i + .5) / n, [px, py, pa] = at(c, s), L = len * .34 * (1 - .55 * s);
    leaf(P, px, py, pa + k * .8, L, L * .2, SH.lanceolate, t + .05 + s * .05, 'leaf', k * .06);
  }
  const [ex, ey, ea] = at(c, 1);
  leaf(P, ex, ey, ea, len * .18, len * .03, SH.lanceolate, t + .1);
};

/* ---------- specimens: base at the origin, growing up (−y) ----------
   Parts are sized in plant units; `h` stretches only the stem, so a meadow can grow tall plants without giant
   flowers. Seen alone, a specimen is about a unit tall. */
export const GEN = {
  sprig({ h = 1 } = {}) {
    const P = [], sh = leafShape(pick(['ovate', 'elliptic', 'lanceolate', 'obovate', 'lobed', 'round', 'serrate']));
    const c = curve(0, 0, -PI / 2 + rand(-.2, .2) / h, h, rand(-.8, .8) / Math.sqrt(h), 28, rand(0, .1));
    stem(P, c, .016, .005, 0, .75);
    const opp = chance(.4), n = Math.round(ri(5, 9) * Math.max(1, h * .7)), size0 = rand(.2, .26) * (sh.r < .25 ? 1.3 : sh.r > .6 ? .58 : 1), pet = chance(.5) ? rand(.1, .3) : 0;
    for (let i = 0; i < n; i++) {
      const s = .1 + .8 * i / (n - 1), [x, y, a] = at(c, s), tt = .05 + s * .72;
      const L = size0 * (1 - .55 * s * s) * rand(.9, 1.08);
      for (const sd of opp ? [-1, 1] : [i % 2 ? 1 : -1]) {
        const la = a + sd * rand(.55, .95);
        let bx = x, by = y;
        if (pet) { const pl = L * pet; stem(P, curve(x, y, la, pl, 0, 3), .005, .004, tt, tt + .04); bx += Math.cos(la) * pl; by += Math.sin(la) * pl; }
        leaf(P, bx, by, la, L, L * sh.r * rand(.9, 1.1), sh, tt + .06, 'leaf', sd * rand(.05, .25));
      }
    }
    const [x, y, a] = at(c, 1), tip = pick(['bud', 'blossom', 'berries']);
    if (tip === 'bud') bud(P, x, y, a, .07, .85); else if (tip === 'blossom') blossom(P, x, y, .07, .85); else berries(P, x, y, a, .022, .85);
    return P;
  },

  fern(o = {}) {
    const P = [], lean = o.lean ?? rand(-.2, .2), arch = o.arch ?? rand(.2, .7) * (chance(.5) ? 1 : -1), len = o.len ?? o.h ?? 1;
    const c = curve(0, 0, -PI / 2 + lean, len, arch, 40), stipe = rand(.08, .18);
    stem(P, c, .013 * len, .002 * len, 0, .8);
    const bip = o.bip ?? chance(.6), pairs = bip ? ri(11, 18) : ri(16, 26), alt = chance(.6) ? .5 : 0;
    const psh = leafShape(pick(['lanceolate', 'serrate'])), maxL = len * (bip ? rand(.24, .32) : rand(.2, .28));
    for (let i = 0; i < pairs; i++) for (const sd of [-1, 1]) {
      const u = (i + (sd > 0 ? alt : 0)) / pairs, s = stipe + (1 - stipe) * u, [x, y, a] = at(c, s), tt = .05 + s * .8;
      // pinnae longest a third of the way up, tapering to the tip
      const Lp = maxL * (1 - u) ** .8 * (.5 + .5 * smooth01(u / .35)) + .012 * len, pa = a + sd * lerp(1.2, .7, u);
      if (!bip) { leaf(P, x, y, pa, Lp, Lp * psh.r, psh, tt + .05, 'leaf', -sd * rand(.03, .15)); continue; }
      const pc = curve(x, y, pa, Lp, -sd * rand(.15, .35), 8), m = Math.max(3, Math.round(Lp / (.03 * len)));
      stem(P, pc, .0035 * len, .0012 * len, tt, tt + .08);
      const pl0 = Math.min(Lp * .45, .055 * len);
      for (let j = 0; j < m; j++) for (const ps of [-1, 1]) {
        const v = (j + .3 + (ps > 0 ? .35 : 0)) / m, [qx, qy, qa] = at(pc, v), pl = pl0 * (1 - .6 * v);
        leaf(P, qx, qy, qa + ps * rand(.85, 1.05), pl, pl * .4, SH.oblong, tt + .03 + v * .08, 'leaf', ps * .08);
      }
      const [ex, ey, ea] = at(pc, 1);
      leaf(P, ex, ey, ea, pl0 * .5, pl0 * .2, SH.oblong, tt + .12);
    }
    const [x, y, a] = at(c, 1);
    leaf(P, x, y, a, maxL * .12, maxL * .04, SH.lanceolate, .9);
    return P;
  },

  fernClump() {
    const P = [], n = ri(3, 6), bip = chance(.6);
    for (let i = 0; i < n; i++) {
      // fronds fan out from the crown, each arching away from the middle
      const u = i / (n - 1) * 2 - 1, lean = u * rand(.45, .75);
      P.push(...GEN.fern({ lean, arch: Math.sign(u || rand(-1, 1)) * rand(.25, .7), len: rand(.7, 1) * (1 - .2 * Math.abs(u)), bip }));
    }
    // a fiddlehead or two: a young frond still coiled, its heading turning faster and faster toward the tip
    for (let k = ri(0, 2); k > 0; k--) {
      const sd = pick([-1, 1]), c = curve(sd * rand(.02, .06), 0, -PI / 2 + sd * rand(.35, .6), rand(.2, .28), sd * rand(7, 9), 40, 0, 3);
      stem(P, c, .011, .004, .3, .9);
    }
    return P;
  },

  grass({ h = 1, heads } = {}) {
    const P = [];
    for (let b = ri(6, 12); b > 0; b--) {
      const sd = rand(-1, 1), c = curve(sd * .04, 0, -PI / 2 + sd * rand(.05, .55), rand(.45, 1) * (1 - .35 * Math.abs(sd)) * (h > 1 ? h * .75 : 1), (sd * rand(.1, 1.1) + rand(-.15, .15)) / Math.max(1, h ** .5), 14);
      stem(P, c, rand(.016, .028), 0, rand(0, .1), .75);
    }
    const kind = pick(['spike', 'awned', 'panicle', 'cattail']);
    for (let k = heads ?? ri(1, 3); k > 0; k--) GEN.stalk(P, rand(-.03, .03), rand(-.18, .18) / h, rand(.85, 1.2) * h, kind);
    return P;
  },

  // a grass stalk with its seed head (its parts in plant units whatever the stalk's length)
  stalk(P, x, lean, len, kind) {
    const c = curve(x, 0, -PI / 2 + lean, len, rand(-.3, .3), 24), frac = l => Math.min(.6, l / len);
    stem(P, c, .008, .003, 0, .7, 'leaf');
    if (kind === 'spike' || kind === 'awned') {
      // wheat and barley ears: grains paired up the top of the stalk, barley with long awns
      const n = ri(7, 12), s0 = 1 - frac(.28);
      for (let i = 0; i < n; i++) for (const sd of [-1, 1]) {
        const s = s0 + (1 - s0) * (i + (sd > 0 ? .5 : 0)) / n, [gx, gy, a] = at(c, s), ga = a + sd * .42, gl = .055 * (1 - .4 * i / n), tt = .72 + .2 * i / n;
        leaf(P, gx, gy, ga, gl, gl * .42, SH.grain, tt, 'head');
        if (kind === 'awned') { const ex = gx + Math.cos(ga) * gl, ey = gy + Math.sin(ga) * gl, aa = a + sd * .14, al = .16; line(P, [[ex, ey], [ex + Math.cos(aa) * al * .5, ey + Math.sin(aa) * al * .5], [ex + Math.cos(aa + sd * .05) * al, ey + Math.sin(aa + sd * .05) * al]], tt + .05, 'head', .8); }
      }
      const [gx, gy, a] = at(c, 1);
      leaf(P, gx, gy, a, .05, .02, SH.grain, .93, 'head');
    } else if (kind === 'panicle') {
      // loose branching head: whorls of fine branches carrying tiny seeds
      const s0 = 1 - frac(.45);
      for (let i = 0, n = ri(4, 6); i < n; i++) {
        const v = i / (n - 1), s = s0 + (.99 - s0) * v, [bx, by, a] = at(c, s);
        for (const sd of [-1, 1]) {
          const ba = a + sd * rand(.35, .8), bl = .17 * (1 - .7 * v) + .03, bc = curve(bx, by, ba, bl, -sd * .25, 4);
          line(P, [bc.pts[0], bc.pts[2], bc.pts[4]], .7 + .2 * v, 'leaf', .8);
          for (let j = 1; j <= 3; j++) { const [sx, sy, sa] = at(bc, j / 3); leaf(P, sx, sy, sa - sd * .2, .026, .008, SH.grain, .8 + .15 * v, 'head'); }
        }
      }
    } else {
      // bulrush: a velvety cylinder with a bare spike above it
      const s1 = 1 - frac(.12), s0 = s1 - frac(.22), cs = sub(c, s0, s1, 6);
      stem(P, cs, .042, .04, .75, .85, 'head');
      for (const s of [s0, s1]) { const [ex, ey] = at(c, s); disc(P, ex, ey, .02, .85, 'head'); }
    }
  },

  daisy({ h = 1, cluster = false } = {}) {
    const P = [], kind = pick(['daisy', 'cosmos', 'aster']);
    for (let st = cluster ? ri(2, 4) : 1, i = 0; i < st; i++) {
      const u = st === 1 ? 0 : i / (st - 1) * 2 - 1, c = curve(u * .03, 0, -PI / 2 + (u * .35 + rand(-.1, .1)) / h, rand(.7, 1) * (1 - .15 * Math.abs(u)) * h, rand(-.35, .35) / Math.sqrt(h), 24);
      stem(P, c, .012, .006, 0, .7);
      const sh = leafShape(pick(['lanceolate', 'elliptic', 'lobed']));
      for (let k = 0, n = ri(2, 4); k < n; k++) {
        const s = (.12 + .45 * k / Math.max(1, n - 1)) / Math.max(1, h * .8), [x, y, a] = at(c, s), sd = k % 2 ? 1 : -1, L = rand(.15, .22) * (sh.r > .4 ? .7 : 1);
        leaf(P, x, y, a + sd * rand(.5, .85), L, L * sh.r, sh, .1 + s * .6, 'leaf', sd * rand(.08, .25));
      }
      const [x, y] = at(c, 1);
      flowerHead(P, x, y, rand(.085, .12), .76, kind);
    }
    return P;
  },

  tulip({ h = 1 } = {}) {
    const P = [], c = curve(0, 0, -PI / 2 + rand(-.12, .12), rand(.72, .9) * h, rand(-.25, .25), 20);
    stem(P, c, .016, .012, 0, .6);
    for (let k = ri(2, 3), i = 0; i < k; i++) { const sd = i % 2 ? 1 : -1, s0 = i < 2 ? 0 : .12; const [x, y] = at(c, s0); leaf(P, x + sd * .01, y, -PI / 2 + sd * rand(.1, .4), rand(.42, .58) * (i < 2 ? 1 : .75), rand(.06, .085), SH.lanceolate, .2 + s0, 'leaf', sd * rand(.15, .35)); }
    // the cup: three pointed petals, the outer two splayed a little, so the rim shows three tips
    const [x, y, a] = at(c, 1), open = rand(.22, .38), L = rand(.17, .21);
    for (const sd of [-1, 1]) leaf(P, x - Math.sin(a) * sd * .01, y + Math.cos(a) * sd * .01, a + sd * open, L * .94, L * .21, SH.tulip, .75, 'flower', -sd * .08);
    leaf(P, x, y, a, L, L * .24, SH.tulip, .82, 'flower');
    return P;
  },

  bells({ h = 1 } = {}) {
    const P = [], sd = pick([-1, 1]), c = curve(0, 0, -PI / 2 + sd * rand(.05, .25), h, sd * rand(1.1, 1.6), 30);
    stem(P, c, .011, .004, 0, .75);
    if (chance(.5)) for (const k of [-1, 1]) leaf(P, k * .01, 0, -PI / 2 - sd * k * rand(.08, .3), rand(.5, .65), .1, SH.elliptic, .15, 'leaf', -k * sd * rand(.05, .2));
    else for (let i = 0; i < 4; i++) { const s = .12 + .1 * i, [x, y, a] = at(c, s), k = i % 2 ? 1 : -1; leaf(P, x, y, a + k * .7, .2, .07, SH.elliptic, .1 + s, 'leaf', k * .2); }
    const n = ri(5, 9);
    for (let i = 0; i < n; i++) {
      const s = .45 + .52 * i / (n - 1), [x, y, a] = at(c, s), r = .065 * (1 - .45 * i / n), tt = .45 + .45 * s;
      // each bell on its own short stalk that curls over to hang straight down
      const pa = lerp(a, PI / 2, .45), pc = curve(x, y, pa, r * .9, (PI / 2 - pa) * .9, 5), [ex, ey, ea] = at(pc, 1);
      stem(P, pc, .004, .003, tt, tt + .04);
      leaf(P, ex, ey, ea, r * 1.15, r * .55, SH.bell, tt + .05, 'flower');
    }
    return P;
  },

  umbel({ h = 1 } = {}) {
    const P = [], c = curve(0, 0, -PI / 2 + rand(-.1, .1) / h, rand(.62, .75) * h, rand(-.25, .25) / Math.sqrt(h), 20);
    stem(P, c, .012, .006, 0, .55);
    for (let k = 0; k < 2; k++) { const [x, y, a] = at(c, (.12 + .18 * k) / Math.max(1, h * .8)), sd = k ? 1 : -1; frond(P, x, y, a + sd * rand(.6, .9), rand(.2, .26), .15 + .15 * k, sd); }
    // Umbrella of rays whose ends lie on a shallow dome — flat-topped, the way Queen Anne's lace is — each ending in
    // a small dome of florets. Built in a frame turned to the stem's heading at the top.
    const [x, y, a] = at(c, 1), up = a + PI / 2, cu = Math.cos(up), su = Math.sin(up), L = (u, v) => [x + u * cu - v * su, y + u * su + v * cu];
    const nr = ri(9, 14), wd = rand(.2, .27), rise = rand(.13, .19), dome = rand(.02, .06);
    for (let i = 0; i < nr; i++) {
      const u = (i / (nr - 1) * 2 - 1) * rand(.92, 1), [ex, ey] = L(u * wd, -rise - dome * (1 - u * u)), rl = Math.hypot(ex - x, ey - y);
      const rc = curve(x, y, Math.atan2(ey - y, ex - x) + u * .15, rl, -u * .3, 6), [rx, ry] = at(rc, 1);
      stem(P, rc, .003, .002, .55, .65);
      // umbellet: florets packed sunflower-fashion into a small half-dome above the ray's end
      for (let j = 0, m = ri(10, 14); j < m; j++) {
        const q = Math.sqrt((j + .5) / m) * .048, th = j * 2.39996, fu = u * wd + Math.cos(th) * q, fv = -rise - dome * (1 - u * u) - .008 - Math.abs(Math.sin(th)) * q * .8;
        const [fx, fy] = L(fu, fv);
        if (j % 2 === 0) line(P, [[rx, ry], [fx, fy]], .68, 'leaf', .6);
        disc(P, fx, fy, .012, .75 + .1 * Math.abs(u), 'flower');
      }
    }
    return P;
  },

  dandelion({ h = 1 } = {}) {
    const P = [], lsh = leafShape('runcinate');
    for (let k = ri(3, 5); k > 0; k--) { const sd = pick([-1, 1]); leaf(P, 0, 0, -PI / 2 + sd * rand(.3, 1.05), rand(.25, .38), .06, lsh, .1, 'leaf', sd * rand(.05, .2)); }
    const c = curve(0, 0, -PI / 2 + rand(-.15, .15), rand(.68, .9) * h, rand(-.3, .3), 20);
    stem(P, c, .01, .007, .1, .6);
    const [x, y] = at(c, 1);
    if (chance(.35)) { flowerHead(P, x, y, .09, .7, 'aster'); return P; }
    // seed clock: a Fibonacci sphere of seeds seen in projection, each a stalk ending in a tuft
    const N = ri(60, 95), R = rand(.12, .16), tilt = rand(.2, .5);
    for (let k = 0; k < N; k++) {
      const z = 1 - 2 * (k + .5) / N, rr = Math.sqrt(1 - z * z), ph = k * 2.39996;
      const dx = rr * Math.cos(ph), dy = rr * Math.sin(ph) * Math.cos(tilt) + z * Math.sin(tilt), dl = Math.hypot(dx, dy);
      if (dl < .25) continue;                                  // pointing at the viewer: too short to read
      const ex = x + dx * R, ey = y + dy * R, ta = Math.atan2(dy, dx), tt = .7 + .2 * k / N;
      line(P, [[x + dx * R * .12, y + dy * R * .12], [ex, ey]], tt, 'flower', .6);
      for (let j = -2; j <= 2; j++) line(P, [[ex, ey], [ex + Math.cos(ta + j * .32) * .026, ey + Math.sin(ta + j * .32) * .026]], tt + .03, 'flower', .5);
    }
    disc(P, x, y, .018, .7, 'centre');
    return P;
  },

  twig({ depth = 3 } = {}) {
    // sympodial branching: side shoots from alternate nodes, each shorter and splayed wider than its parent
    const P = [], sh = leafShape(pick(['elliptic', 'ovate', 'lanceolate', 'obovate', 'round'])), tip = pick(['berries', 'blossom', 'bud', 'leaf']);
    const Ls = .1 * (sh.r > .6 ? .75 : sh.r < .25 ? 1.3 : 1);
    const grow = (x, y, ang, len, d, t0, w0) => {
      const c = curve(x, y, ang, len, rand(-.45, .45), 14, rand(0, .06)), span = .3 * len / .5;
      stem(P, c, w0, w0 * .5, t0, t0 + span);
      const nodes = Math.max(2, Math.round(len / .075));
      for (let i = 0; i < nodes; i++) {
        const s = (i + .6) / nodes; if (s > .94) break;
        const [px, py, a] = at(c, s), sd = i % 2 ? 1 : -1, tt = t0 + span * s;
        if (d > 0 && i % 2 === 1 && s < .8 && chance(.75)) grow(px, py, a + sd * rand(.55, .95), len * rand(.5, .68), d - 1, tt, w0 * .62);
        else { const L = Ls * rand(.8, 1.1) * (1 - .3 * s); leaf(P, px, py, a + sd * rand(.5, .9), L, L * sh.r, sh, tt + .05, 'leaf', sd * rand(.05, .2)); }
      }
      const [ex, ey, ea] = at(c, 1), tt = Math.min(.95, t0 + span);
      if (tip === 'berries') berries(P, ex, ey, ea, .018, tt); else if (tip === 'blossom') blossom(P, ex, ey, .05, tt);
      else if (tip === 'bud') bud(P, ex, ey, ea, .05, tt); else leaf(P, ex, ey, ea, Ls, Ls * sh.r, sh, tt);
    };
    grow(0, 0, -PI / 2 + rand(-.25, .25), .6, depth, 0, .018);
    return P;
  },

  bigLeaf() {
    const P = [], sh = leafShape(pick(['ovate', 'elliptic', 'obovate', 'lobed', 'round', 'serrate'])), pl = rand(.12, .25);
    const c = curve(0, 0, -PI / 2 + rand(-.3, .3), pl, rand(-.3, .3), 5), [x, y, a] = at(c, 1);
    stem(P, c, .018, .014, 0, .3);
    const L = 1 - pl;
    leaf(P, x, y, a, L, L * sh.r * rand(.85, 1.1), sh, .35, 'leaf', rand(-.12, .12));
    return P;
  },
};

/* ---------- compositions ---------- */
const GRID_TYPES = [['sprig', 3], ['fern', 2.5], ['daisy', 1.5], ['tulip', .8], ['bells', 1.2], ['umbel', 1], ['dandelion', 1], ['twig', 2], ['grass', 1.2], ['bigLeaf', 1.2]];
const FAMILIES = [['fern'], ['sprig', 'bigLeaf'], ['daisy', 'tulip', 'bells'], ['grass', 'umbel', 'dandelion'], ['twig', 'sprig']];
// meadow plants: [weight, tallest stem in plant units]
const MEADOW = { wheat: [4, 9], daisy: [2, 6], umbel: [1.4, 7], dandelion: [1, 2.4], fern: [.25, 2], tulip: [.35, 2.5], sprig: [.3, 5] };

export function scene(W, H, comp) {
  const S = Math.min(W, H), items = [];
  if (comp === 'grid') {
    // herbarium plate: rows and columns both from one cell size, so neither orientation stretches the cells
    const cell = S / rand(2.1, 3), cols = Math.max(1, Math.round(W / (cell * .8))), rows = Math.max(1, Math.round(H / cell));
    const cw = W / cols, ch = H / rows, fam = chance(.35) ? pick(FAMILIES) : null, pad = Math.min(cw, ch) * .1;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const type = fam ? pick(fam) : wpick(GRID_TYPES), box = [c * cw, r * ch, cw, ch];
      items.push({ P: fitBox(GEN[type]({ depth: 2 }), [box[0] + pad, box[1] + pad * 1.2, cw - 2 * pad, ch - 2.4 * pad]), box, group: 0, start: (r * cols + c) / (rows * cols) * .35, dur: .8, type });
    }
  } else if (comp === 'pressed') {
    // pressed flat, so each lies at any angle; placed by dart throwing so they touch but rarely overlap
    const R = S * rand(.1, .15), placed = [];
    for (let tries = 0; tries < 1500 && placed.length < 60; tries++) {
      const r = R * rand(.65, 1.3), x = rand(-r * .3, W + r * .3), y = rand(-r * .3, H + r * .3);
      if (placed.every(q => Math.hypot(q[0] - x, q[1] - y) > (q[2] + r) * .72)) placed.push([x, y, r]);
    }
    shuffle(placed).forEach(([x, y, r], i) => {
      const type = wpick([['daisy', 2], ['sprig', 2], ['fern', 1.5], ['bigLeaf', 2], ['bells', 1], ['twig', 1.2], ['umbel', .7], ['tulip', .6]]);
      const P = fitBox(GEN[type]({ depth: 2 }), [x - r * .8, y - r * .8, r * 1.6, r * 1.6], rand(0, TAU));
      // each specimen is its own group (so it stacks whole), so it lands in one or two reveal steps, not a dozen
      items.push({ P, group: i, start: i / placed.length * .9, dur: .15, type });
    });
  } else if (comp === 'meadow') {
    // Three depth layers rooted on the bottom edge, back ones taller, each a dense sward of individual grass blades
    // with flowering stems and seed stalks rising out of it; a fringe of short blades across the very front.
    // Flower and seed-head parts are sized off the canvas, not the plant, so a tall stem doesn't bring a giant
    // flower with it.
    const hmax = Math.min(H * .88, S * 1.25), tall = [[.55, 1], [.4, .78], [.22, .55]];
    const weights = Object.entries(MEADOW).map(([k, v]) => [k, v[0]]);
    for (let L = 0; L < 3; L++) {
      const u = S * rand(.13, .16) * [.72, .86, 1][L], [lo, hi] = tall[L], P = [];
      // the sward: mostly short blades, a few long ones, arching outward as they get longer
      for (let i = Math.round(W / (S * .0055)); i > 0; i--) {
        const x = rand(-S * .03, W + S * .03), bh = hmax * hi * (.1 + .75 * Math.random() ** 2.4), sd = rand(-1, 1);
        const c = curve(x, H, -PI / 2 + sd * rand(0, .2), bh, sd * rand(.3, 1.3) * Math.min(1, bh / (S * .3)), 8, 0, 1.6);
        stem(P, c, S * rand(.004, .009) * [.8, .9, 1][L], 0, rand(0, .3), .7);
      }
      items.push({ P, group: L, start: L * .08, dur: .7, type: 'sward' });
      for (let i = 0, n = Math.round(W / (S * [.045, .055, .07][L])); i < n; i++) {
        const type = wpick(weights), h = Math.min(hmax * rand(lo, hi) / u, MEADOW[type][1] * rand(.6, 1));
        let Q;
        if (type === 'wheat') { Q = []; GEN.stalk(Q, 0, rand(-.2, .2) / h, h, pick(['spike', 'awned', 'panicle', 'cattail'])); }
        else Q = type === 'fern' ? GEN.fern({ len: h, arch: rand(-.5, .5) }) : GEN[type]({ h, heads: 0 });
        items.push({ P: place(Q, u, 0, rand(0, W), H), group: L, start: L * .08 + rand(.1, .35), dur: .8, type });
      }
    }
    const F = [], fh = S * rand(.03, .06);
    for (let i = Math.round(W / (S * .006)); i > 0; i--) {
      const sd = rand(-1, 1), c = curve(rand(-S * .02, W + S * .02), H, -PI / 2 + sd * .45, fh * rand(.35, 1), sd * rand(.2, .9), 8);
      stem(F, c, S * rand(.005, .01), 0, rand(0, .3), .9);
    }
    items.push({ P: F, group: 3, start: 0, dur: .6, type: 'fringe' });
    // Nothing may reach below the ground line: a leaf or blade that droops through it is dropped, and stems that
    // start on it are marked as rooted there.
    const rooted = p => p.k === 'stem' && p.pts[0][1] >= H - .01;
    for (const it of items) it.P = it.P.filter(p => rooted(p) ? p.pts.every((q, i) => !i || q[1] + p.w0 / 2 <= H) : bounds([p])[3] <= H).map(p => rooted(p) ? { ...p, root: true } : p);
  } else {
    const wide = W > H * 1.15;
    const type = wide ? wpick([['fernClump', 3], ['twig', 2], ['bells', 1.5], ['daisy', 1]]) : wpick([['fern', 2], ['fernClump', 1], ['sprig', 2], ['twig', 2], ['bells', 1.5], ['umbel', 1], ['dandelion', 1], ['daisy', 1], ['tulip', .7]]);
    const P = GEN[type](type === 'daisy' ? { cluster: wide || chance(.5) } : {});
    items.push({ P: fitBox(P, [W * .08, H * .06, W * .84, H * .88]), group: 0, start: 0, dur: 1, type });
  }
  return items;
}

/* ---------- path emission ---------- */
// A closed outline as absolute segments, oriented to the requested winding (+1 / −1) whatever the transform did.
function closed(start, segs, want) {
  let a = 0, prev = start;
  for (const sg of segs) for (let i = 1; i < sg.length; i++) { a += prev[0] * sg[i][1] - sg[i][0] * prev[1]; prev = sg[i]; }
  a += prev[0] * start[1] - start[0] * prev[1];
  if (Math.sign(a) !== want && a !== 0) {
    const rev = [];
    for (let i = segs.length - 1; i >= 0; i--) {
      const from = i ? segs[i - 1][segs[i - 1].length - 1] : start, sg = segs[i];
      rev.push([sg[0], ...sg.slice(1, -1).reverse(), from]);
    }
    segs = rev;
  }
  return 'M' + P2(start) + segs.map(([t, ...q]) => t + q.map(P2).join(' ')).join('') + 'Z';
}
// A circle as two half arcs, both swept clockwise on screen — the same winding closed() gives every filled shape.
const circle = (x, y, r) => `M${f(x + r)} ${f(y)}A${f(r)} ${f(r)} 0 1 1 ${f(x - r)} ${f(y)}A${f(r)} ${f(r)} 0 1 1 ${f(x + r)} ${f(y)}Z`;
// Every point a path passes through or pulls toward (anchors and control points; an arc as its end ± radius).
export function pathPoints(d, cb) {
  const tk = d.match(/[MLQCAZ]|-?\d*\.?\d+/g);
  let cmd = 'M';
  for (let i = 0; i < tk.length;) {
    if (/[A-Z]/.test(tk[i])) { cmd = tk[i++]; continue; }
    if (cmd === 'A') { const r = +tk[i], x = +tk[i + 5], y = +tk[i + 6]; cb(x - r, y - r); cb(x + r, y + r); i += 7; }
    else { cb(+tk[i], +tk[i + 1]); i += 2; }
  }
}

// Pour one primitive into buckets. put(kind, role, t, d, lw) — kind: fill | line | ink | inkfill | wash.
export function emit(p, style, put, px) {
  const drawn = style === 'ink' || style === 'wash';
  if (p.k === 'stem') {
    const n = p.pts.length - 1, pieces = Math.max(1, Math.round(n / 6));
    const Ls = [], Rs = [];
    p.pts.forEach((q, i) => {
      const a = p.pts[Math.max(0, i - 1)], b = p.pts[Math.min(n, i + 1)], len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      // a blade (tapering to nothing) holds its width and narrows late; a stem tapers evenly
      const u = i / n, hw = p.w1 === 0 && i === n ? 0 : Math.max(px.minW, (p.w1 === 0 ? p.w0 * (1 - u ** 2.2) : lerp(p.w0, p.w1, u ** .9)) / 2);
      // a rooted stem is cut level with the ground rather than square to its lean, so no corner dips below it
      const [nx, ny] = p.root && i === 0 ? [Math.sign(a[1] - b[1] || 1) * hw, 0] : [-(b[1] - a[1]) / len * hw, (b[0] - a[0]) / len * hw];
      Ls.push([q[0] + nx, q[1] + ny]); Rs.push([q[0] - nx, q[1] - ny]);
    });
    // Each side is ONE smooth curve (quadratics through the midpoints of the samples), and a growth piece is a run
    // of those very segments — so where pieces lap, their edges coincide exactly instead of leaving a step.
    const mid = (A, j) => j >= n ? A[n] : j <= 0 ? A[0] : [(A[j][0] + A[j + 1][0]) / 2, (A[j][1] + A[j + 1][1]) / 2];
    const segStart = (A, j) => j === 1 ? A[0] : mid(A, j - 1), segEnd = (A, j) => j === n - 1 ? A[n] : mid(A, j);
    const nseg = Math.max(1, n - 1);
    for (let k = 0; k < pieces; k++) {
      const j0 = 1 + Math.floor(nseg * k / pieces), j1 = Math.min(nseg, Math.floor(nseg * (k + 1) / pieces) + (k < pieces - 1 ? 1 : 0));
      let d;
      if (n < 2) d = closed(Ls[0], [['L', Ls[1]], ['L', Rs[1]], ['L', Rs[0]], ['L', Ls[0]]], 1);
      else {
        const segs = [];
        for (let j = j0; j <= j1; j++) segs.push(['Q', Ls[j], segEnd(Ls, j)]);
        segs.push(['L', segEnd(Rs, j1)]);
        for (let j = j1; j >= j0; j--) segs.push(['Q', Rs[j], segStart(Rs, j)]);
        segs.push(['L', segStart(Ls, j0)]);
        d = closed(segStart(Ls, j0), segs, 1);
      }
      put(drawn ? 'inkfill' : 'fill', p.role, lerp(p.t0, p.t1, (k + .5) / pieces), d);
    }
    return;
  }
  if (p.k === 'line') {
    const [a, b, c] = p.pts, d = c ? `M${P2(a)}Q${P2(b)} ${P2(c)}` : `M${P2(a)}L${P2(b)}`;
    put(drawn ? 'ink' : 'line', p.role, p.t, d, p.lw);
    return;
  }
  if (p.k === 'disc') {
    const { x, y } = p, r = Math.max(p.r, px.minW), d = circle(x, y, r);
    if (!drawn) put('fill', p.role, p.t, d);
    else if (r < 2.5) {
      // too small to outline: a dot, drawn smaller than the disc so a cluster of florets stays a cluster of dots
      put('inkfill', p.role, p.t, circle(x, y, r * .6));
    } else { if (style === 'wash') put('wash', p.role, p.t, d); put('ink', p.role, p.t, d); }
    return;
  }
  // leaf
  if (p.L < .8) return;
  const ca = Math.cos(p.ang), sa = Math.sin(p.ang), sh = p.sh;
  const pt = (t, s) => { const al = t * p.L, ac = s * p.w + p.bend * p.L * t * t; return [p.x + ca * al - sa * ac, p.y + sa * al + ca * ac]; };
  const s0 = sh.s0 ?? 0, up = [], down = [];
  let prev = [0, s0];
  for (const [type, ...q] of sh.h) {
    up.push([type, ...q.map(([t, s]) => pt(t, s))]);
    // mirror: the same segment walked back on the other side
    down.unshift([type, ...q.slice(0, -1).reverse().map(([t, s]) => pt(t, -s)), pt(prev[0], -prev[1])]);
    prev = q[q.length - 1];
  }
  const segs = [...up, ...(prev[1] ? [['L', pt(prev[0], -prev[1])]] : []), ...down, ...(s0 ? [['L', pt(0, s0)]] : [])];
  const outline = closed(pt(0, s0), segs, 1);
  const veins = p.role === 'leaf' && sh !== SH.oblong && sh !== SH.grain;
  if (!drawn) {
    let d = outline;
    // cut veins: a thin lens down the midrib and slivers out toward the margin, wound against the leaf
    if (style === 'veined' && veins && p.L > 16 && p.w > 4.5) {
      const prof = profile(sh), lens = (a, b, hw) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l * hw * 2, ny = (b[0] - a[0]) / l * hw * 2; return closed(a, [['Q', [m[0] + nx, m[1] + ny], b], ['Q', [m[0] - nx, m[1] - ny], a]], -1); };
      const hw = clamp(p.w * .05, .45, 2.2);
      d += lens(pt(.04, 0), pt(.9, 0), hw);
      const nv = clamp(Math.round(p.L / (p.w * 1.1)), 2, 7);
      // Side veins only on a leaf that isn't strongly bent: bending moves a cubic's control points, which isn't quite
      // the same as bending its curve, and on a narrow strap leaf that difference is enough to cut the margin.
      if (p.L > 34 && Math.abs(p.bend) < .2) for (let j = 0; j < nv; j++) for (const sd of [-1, 1]) {
        // a sliver only where the leaf is wide enough to hold it: near a narrow tip it would cut through the margin
        const t0 = .12 + .7 * (j + .5) / nv, t1 = Math.min(.92, t0 + .16), room = prof((t0 + t1) / 2) * p.w;
        if (prof(t1) * p.w * .5 < 2.5) continue;
        d += lens(pt(t0, 0), pt(t1, sd * .5 * prof(t1)), Math.min(hw * .6, room * .1));
      }
    }
    put('fill', p.role, p.t, d);
    return;
  }
  if (style === 'wash') put('wash', p.role, p.t, outline);
  // too small to outline: a single curved stroke down its length reads as a leaf in a fine drawing
  if (p.L < 6) { put('ink', p.role, p.t, `M${P2(pt(0, 0))}Q${P2(pt(.5, .25))} ${P2(pt(1, 0))}`); return; }
  let d = outline;
  if (veins && p.L > 12) {
    d += `M${P2(pt(.02, 0))}Q${P2(pt(.5, 0))} ${P2(pt(.92, 0))}`;
    if (p.L > 30 && Math.abs(p.bend) < .2) {
      const prof = profile(sh), nv = clamp(Math.round(p.L / (p.w * 1.1)), 2, 7);
      for (let j = 0; j < nv; j++) for (const sd of [-1, 1]) {
        const t0 = .1 + .72 * (j + .5) / nv, t1 = Math.min(.94, t0 + .16);
        d += `M${P2(pt(t0, 0))}Q${P2(pt(t0 + .1, sd * .45 * prof(t0 + .1)))} ${P2(pt(t1, sd * .72 * prof(t1)))}`;
      }
    }
  }
  put('ink', p.role, p.t, d);
}

export default function botanical() {
  const { ground, fg, ink } = groundScheme();
  const W = ctx.W, H = ctx.H, S = ctx.S;
  const comp = wpick([['grid', 3], ['pressed', 2.5], ['meadow', 3], ['single', 2]]);
  const style = comp === 'meadow' ? wpick([['silhouette', 4], ['veined', 1], ['ink', 1]])
    : comp === 'grid' ? wpick([['ink', 3], ['wash', 2], ['silhouette', 2], ['veined', 2]])
    : comp === 'pressed' ? wpick([['silhouette', 2], ['veined', 3], ['wash', 2], ['ink', 1]]) : wpick([['ink', 2], ['wash', 2], ['silhouette', 1.5], ['veined', 2.5]]);
  const items = scene(W, H, comp);

  // ---- colour. Leaves and stems in one colour; flowers in another that reads on the ground and on the leaves;
  // flower centres against the petals they sit on.
  const pal = shuffle(fg);
  const scheme = seed => {
    const at = i => pal[(seed + i) % pal.length];
    const leafC = readable([at(0)], ground, comp === 'meadow' ? .34 : .28)[0];
    // the next palette colour that stands apart from the leaves; failing that, the leaf hue turned and shifted
    const [lL, , lH] = hexToOklch(leafC);
    let flowerC = [1, 2, 3].map(at).find(c => labDist(c, leafC) > .15) ?? oklchToHex(clamp(lL + (lL > .5 ? -.3 : .3), .08, .95), .12, (lH + 150) % 360);
    flowerC = readable([flowerC], ground, .22)[0];
    if (labDist(flowerC, leafC) < .15) flowerC = readable([flowerC], leafC, .15)[0];
    const centreC = readable([at(2) === flowerC ? ink : at(2)], flowerC, .22)[0];
    // seed heads between the two, leaning to the flower colour so they part from the stalks they sit on
    let headC = readable([mix(leafC, flowerC, .7)], ground, .2)[0];
    if (labDist(headC, leafC) < .15) headC = flowerC;
    return { leaf: leafC, flower: flowerC, head: headC, centre: centreC };
  };
  const base = scheme(0);
  const fade = [.5, .25, 0, 0];                                // meadow depth layers ease toward the ground
  const colourFor = (group, kind, role) => {
    if (kind === 'ink' || kind === 'inkfill') return ink;
    const sc = comp === 'pressed' ? scheme(group) : base;
    let c = sc[role];
    if (kind === 'wash') {
      // a pale tint of the colour: clearly off the ground, clearly not the ink
      c = mix(c, ground, .5);
      if (labDist(c, ground) < .08) c = readable([c], ground, .08)[0];
      if (labDist(c, ink) < .22) c = mix(c, ground, .5);
      return c;
    }
    if (comp === 'meadow' && fade[group]) {
      const t = fade[group];
      c = mix(c, ground, t);
      // each layer has to part from the layer in front of it, which is what overlaps it
      if (role === 'leaf') c = readable([c], colourFor(group + 1, kind, role), .08)[0];
      if (role === 'centre') c = readable([c], mix(sc.flower, ground, t), .12)[0];
    }
    return c;
  };

  // ---- pour everything into buckets: one per (group, kind, role, reveal step, line weight)
  const NB = 10, WINDOW = 1.2, buckets = new Map();
  const px = { minW: Math.max(.35, S / 3000) };
  const RANK = { wash: 0, fill: 1, line: 2, inkfill: 3, ink: 4 }, ROLE = { leaf: 0, head: 1, flower: 2, centre: 3 };
  for (const it of items) {
    const put = (kind, role, t, d, lw = 0) => {
      const bin = clamp(Math.floor((it.start + clamp(t, 0, 1) * it.dur) / WINDOW * NB), 0, NB - 1);
      const key = `${it.group}|${RANK[kind]}|${ROLE[role]}|${bin}|${lw}`;
      let b = buckets.get(key);
      if (!b) buckets.set(key, b = { group: it.group, kind, role, bin, lw, d: [] });
      b.d.push(d);
    };
    for (const p of it.P) emit(p, style, put, px);
  }

  // ---- draw. Groups back to front; within a group washes, fills, lines, ink.
  const svg = svgRoot();
  const inkW = clamp(S / 900 * (comp === 'single' ? 1.5 : comp === 'meadow' ? .8 : 1), .6, 2.2), lineW = clamp(S / 1000 * (comp === 'single' ? 1.4 : 1), .45, 1.6);
  const sorted = [...buckets.values()].sort((a, b) => a.group - b.group || RANK[a.kind] - RANK[b.kind] || ROLE[a.role] - ROLE[b.role] || a.bin - b.bin);
  for (const b of sorted) {
    const e = document.createElementNS(NS, 'path'), c = colourFor(b.group, b.kind, b.role), stroked = b.kind === 'ink' || b.kind === 'line';
    e.setAttribute('d', b.d.join(''));
    if (stroked) {
      e.setAttribute('fill', 'none'); e.setAttribute('stroke', c); e.setAttribute('stroke-linecap', 'round'); e.setAttribute('stroke-linejoin', 'round');
      e.setAttribute('stroke-width', f(b.kind === 'ink' ? inkW * (b.lw ? Math.max(.55, b.lw) : 1) : lineW * b.lw * (comp === 'meadow' ? [.7, .85, 1, 1][b.group] : 1)));
    } else e.setAttribute('fill', c);
    // built with createElementNS, not svg.node(): thousands of shapes ride in a few paths, and the reveal is
    // one fade per growth step rather than an animation per shape
    e.style.setProperty('--t0', 'none'); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', '1');
    e.style.animation = `fin .3s ease ${(b.bin * WINDOW / NB).toFixed(3)}s both`;
    svg.appendChild(e);
  }
}
