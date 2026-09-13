import { ctx, rand, ri, chance, shuffle, wpick, svgRoot, labDist, hexToOklch, oklchToHex, groundScheme } from '../utils.js';
// Hitomezashi sashiko ("one-stitch" sashiko). Every horizontal grid line gets one bit that says whether its
// running stitch starts on or off at the left edge, then alternates on/off one cell at a time; every vertical
// line gets the same from the top. That is the whole pattern — the bit sequences alone decide whether it reads
// as scattered crosses, stepped diagonals, nested diamonds or long maze-like corridors, so most of the variety
// here is in HOW the bits are chosen (random, biased, periodic words, mirrored about the centre).
//
// The stitches always enclose regions that are properly 2-colourable. At any grid vertex exactly one of the two
// horizontal segments and exactly one of the two vertical segments is stitched (each line alternates), so a
// loop around a vertex crosses an even number of stitches. Colour is therefore just parity: walk along the top
// row flipping at each vertical stitch, then down every column flipping at each horizontal stitch. Filling the
// two parities in two tones is what makes hitomezashi striking; the stitches then sit on top as short dashes
// with a gap at each needle hole, like real thread.

const f = v => v.toFixed(1);

// 0/1 sequence of length n in one of several characters. `word` lets both axes share one periodic word.
function bits(n, kind, word) {
  if (kind === 'random') return Array.from({ length: n }, () => +chance(.5));
  if (kind === 'biased') { const p = chance(.5) ? rand(.15, .32) : rand(.68, .85); return Array.from({ length: n }, () => +chance(p)); }
  if (kind === 'periodic') {
    // A short repeated word. Alternating or constant words give the classic regular crosses/steps; longer
    // words give larger repeating motifs.
    const w = word ?? newWord();
    return Array.from({ length: n }, (_, i) => w[i % w.length]);
  }
  // mirrored: a random half reflected about the middle line, so the field has a mirror axis on the canvas centre
  const half = Array.from({ length: Math.ceil(n / 2) }, () => +chance(.5));
  return Array.from({ length: n }, (_, i) => half[Math.min(i, n - 1 - i)]);
}
const newWord = () => {
  const w = Array.from({ length: chance(.15) ? 2 : ri(3, 8) }, () => +chance(.5));   // length 2 is plain diagonal steps: keep it rare
  if (w.every(b => b === w[0])) w[ri(0, w.length - 1)] ^= 1;
  return w;
};

export default function hitomezashi() {
  const { ground, fg, ink } = groundScheme();
  const { W, H, S } = ctx;

  // ---- grid. Odd cell counts, centred on the canvas: horizontal stitches only mirror left-right when the
  // number of cells per line is odd (segment i and its mirror then have the same parity), and a centred grid
  // puts that mirror on the canvas centre. The grid overhangs every edge by at least one cell.
  // Whole-pixel cells and origin, so region edges land on pixel boundaries and stay crisp.
  const c = Math.max(8, Math.round(S / rand(12, 36)));
  const odd = n => n | 1;
  const cols = odd(Math.ceil(W / c) + 2), rows = odd(Math.ceil(H / c) + 2);
  const ox = Math.floor((W - cols * c) / 2), oy = Math.floor((H - rows * c) / 2);

  const seqKind = () => wpick([['random', 3], ['biased', 2], ['periodic', 2.5], ['mirrored', 2.5]]);
  const hk = seqKind(), vk = chance(.55) ? hk : seqKind();
  // Both axes sharing one periodic word makes the field symmetric about the diagonals through its grid corners
  // (swapping i and j swaps the horizontal and vertical stitch rules), so the motifs turn into squared rosettes.
  const word = hk === 'periodic' && vk === hk && chance(.6) ? newWord() : null;
  const hb = bits(rows + 1, hk, word), vb = bits(cols + 1, vk, word);   // one bit per horizontal / vertical grid line
  // Mirror sequences must have a symmetric count of lines to reflect onto themselves — rows+1 is even, so the
  // reflection pairs line j with rows-j, which is what bits() does.

  // hS(i,j): horizontal line j, segment from x=i to x=i+1, is stitched. vS(i,j): vertical line i, y=j..j+1.
  const hS = (i, j) => ((i + hb[j]) & 1) === 0, vS = (i, j) => ((j + vb[i]) & 1) === 0;

  // ---- parity colouring, then connected regions (for the optional third tone).
  const par = new Uint8Array(cols * rows), at = (i, j) => i + j * cols;
  for (let i = 1; i < cols; i++) par[at(i, 0)] = par[at(i - 1, 0)] ^ vS(i, 0);
  for (let j = 1; j < rows; j++) for (let i = 0; i < cols; i++) par[at(i, j)] = par[at(i, j - 1)] ^ hS(i, j);

  const style = wpick([['tonal', 4], ['bold', 3], ['plain', 2]]);   // tonal/bold stitched; plain = fills only
  const stitched = style !== 'plain';
  const third = chance(.4);
  let tone = null;
  if (third) {
    // Union-find over unstitched neighbours. Regions of the stitched-out parity alternate between two tones —
    // by size, so the small enclosed motifs pick out in their own colour, or at random per region.
    const up = Int32Array.from({ length: cols * rows }, (_, k) => k);
    const find = k => { while (up[k] !== k) k = up[k] = up[up[k]]; return k; };
    const join = (a, b) => { a = find(a); b = find(b); if (a !== b) up[a] = b; };
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      if (i && !vS(i, j)) join(at(i, j), at(i - 1, j));
      if (j && !hS(i, j)) join(at(i, j), at(i, j - 1));
    }
    const size = new Map(), root = new Int32Array(cols * rows);
    for (let k = 0; k < cols * rows; k++) { root[k] = find(k); size.set(root[k], (size.get(root[k]) ?? 0) + 1); }
    const bySize = chance(.6), cut = ri(2, 6), coin = new Map();
    tone = k => {
      if (!par[k]) return 0;
      const r = root[k];
      if (bySize) return size.get(r) <= cut ? 2 : 1;
      if (!coin.has(r)) coin.set(r, chance(.4) ? 2 : 1);
      return coin.get(r);
    };
  }
  const toneOf = tone ?? (k => par[k]);

  // ---- colours. Tone 0 is the ground itself. Stitches sit on every tone at once, so when they're shown the
  // thread is far from the ground in LIGHTNESS (`ink`, or a palette hue at ink's lightness) and every other tone
  // is chosen to keep that lightness gap from the thread as well as reading against the ground it borders.
  const [gL, gC, gH] = hexToOklch(ground), [iL] = hexToOklch(ink);
  const thread = stitched && chance(.35) ? oklchToHex(iL, rand(.05, .12), hexToOklch(fg[ri(0, fg.length - 1)])[2]) : ink;
  const fgs = shuffle(fg).map(hexToOklch);
  // Candidates in order of preference, as tiers: the palette colours as they are, then palette hues at other
  // lightnesses, then the ground's own hue lighter or darker. Tonal work (indigo on indigo with white thread)
  // tries the ground's hue first; the first tier with anything acceptable wins, so colours stay close to the
  // palette instead of drifting to whatever lightness happens to pass.
  const steps = Array.from({ length: 31 }, (_, k) => .06 + k * .03);
  const tierFg = fgs.map(([L, C, Hh]) => oklchToHex(L, C, Hh));
  const tierHue = fgs.flatMap(([, C, Hh]) => steps.map(L => oklchToHex(L, C, Hh)));
  const tierGround = steps.map(L => oklchToHex(L, Math.max(gC, .02) * rand(.9, 1.4), gH));
  const tiers = style === 'tonal' ? [tierGround, tierFg, tierHue] : [tierFg, tierHue, tierGround];
  const [lo, hi] = style === 'tonal' ? [.08, .17] : [.2, 1];     // tonal: a quiet second tone; bold: a clear one
  const pickTone = avoid => {
    for (const [dlo, dhi] of [[lo, hi], [.1, 1]]) for (const tier of tiers) {
      const ok = tier.filter(x => {
        const d = labDist(x, ground);
        return d >= dlo && d <= dhi && avoid.every(a => labDist(x, a) >= .1) && (!stitched || Math.abs(hexToOklch(x)[0] - hexToOklch(thread)[0]) >= .32);
      });
      if (ok.length) return ok[ri(0, ok.length - 1)];
    }
    return oklchToHex(gL < .5 ? Math.min(.98, gL + .25) : Math.max(.03, gL - .25), .05, gH);
  };
  const t1 = pickTone([]);
  const toneCol = [ground, t1, third ? pickTone([t1]) : null];

  // ---- geometry, in horizontal bands so the reveal can sweep down the cloth. Each tone's cells in a band are
  // traced into region OUTLINES rather than drawn as rectangles: abutting rectangles leave faint antialiasing
  // seams along every row at fractional scales (and when the page tilts the design), an outline has no interior
  // edges at all. Each band also takes the first row of the band below, so the band boundaries are covered too.
  const NB = 9, band0 = b => Math.floor(b * rows / NB);
  const fill = Array.from({ length: NB }, () => ['', '', '']);
  const P = (x, y) => `${ox + x * c} ${oy + y * c}`;
  for (let b = 0; b < NB; b++) {
    const j0 = band0(b), j1 = Math.min(rows, band0(b + 1) + 1);   // rows j0..j1-1
    for (const t of [1, 2]) {
      const inT = (i, j) => i >= 0 && i < cols && j >= j0 && j < j1 && toneOf(at(i, j)) === t;
      // Boundary edges oriented clockwise around the tone (keyed by start vertex). With one consistent
      // orientation, however loops are chained at pinch vertices the nonzero fill is the same set of cells.
      const out = new Map(), key = (x, y) => x * 4096 + y;
      const edge = (x0, y0, x1, y1) => { const k = key(x0, y0); (out.get(k) ?? out.set(k, []).get(k)).push([x1, y1]); };
      for (let j = j0; j < j1; j++) for (let i = 0; i < cols; i++) if (inT(i, j)) {
        if (!inT(i, j - 1)) edge(i, j, i + 1, j);
        if (!inT(i + 1, j)) edge(i + 1, j, i + 1, j + 1);
        if (!inT(i, j + 1)) edge(i + 1, j + 1, i, j + 1);
        if (!inT(i - 1, j)) edge(i, j + 1, i, j);
      }
      let d = '';
      for (const [k0, list] of out) while (list.length) {
        let x = Math.floor(k0 / 4096), y = k0 % 4096, [nx, ny] = list.pop(), dir = [nx - x, ny - y];
        d += 'M' + P(x, y);
        for (;;) {
          x = nx; y = ny;
          const next = out.get(key(x, y));
          if (!next?.length) break;                                  // back at the start of the loop
          [nx, ny] = next.pop();
          const nd = [nx - x, ny - y];
          if (nd[0] !== dir[0] || nd[1] !== dir[1]) { d += 'L' + P(x, y); dir = nd; }   // corners only
        }
        fill[b][t] += d + 'Z'; d = '';
      }
    }
  }
  const bandOf = j => Math.min(NB - 1, Math.floor(j * NB / rows));   // band0's inverse, for the stitches

  const sw = c * rand(.07, .13), round = chance(.6);
  const gap = c * rand(.14, .24) + (round ? sw / 2 : 0);     // the needle hole, plus the round cap's overhang
  const stitch = Array.from({ length: NB }, () => '');
  if (stitched) {
    for (let j = 0; j <= rows; j++) for (let i = 0; i < cols; i++) if (hS(i, j))
      stitch[bandOf(Math.min(j, rows - 1))] += `M${f(ox + i * c + gap)} ${f(oy + j * c)}h${f(c - 2 * gap)}`;
    for (let i = 0; i <= cols; i++) for (let j = 0; j < rows; j++) if (vS(i, j))
      stitch[bandOf(j)] += `M${f(ox + i * c)} ${f(oy + j * c + gap)}v${f(c - 2 * gap)}`;
  }

  // ---- draw. Bulk paths are created directly and animated a band at a time (s.node would animate each one).
  const svg = svgRoot();
  const NS = 'http://www.w3.org/2000/svg';
  const add = (attrs, delay) => {
    const e = document.createElementNS(NS, 'path');
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    e.style.setProperty('--t0', 'none'); e.style.setProperty('--t1', 'none'); e.style.setProperty('--op', '1');
    e.style.animation = `fin .5s ease ${delay.toFixed(2)}s both`;
    svg.appendChild(e);
  };
  const fromTop = chance(.5);
  for (let b = 0; b < NB; b++) {
    const d0 = (fromTop ? b : NB - 1 - b) * .08;
    for (const t of [1, 2]) if (fill[b][t]) add({ d: fill[b][t], fill: toneCol[t] }, d0);
    if (stitch[b]) add({ d: stitch[b], fill: 'none', stroke: thread, 'stroke-width': f(sw), 'stroke-linecap': round ? 'round' : 'butt' }, d0 + .3);
  }
}
