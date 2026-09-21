import { ctx, rand, ri, pick, chance, shuffle, svgRoot, groundScheme, rrange, labDist } from '../utils.js';
// Dots and bars: a grid packed in three passes — big circles first, then bars in the gaps, then a small dot
// in every square still free.
//
// Sizes follow the grid exactly. A circle covering N×N squares is centred in that block with radius
// (N−1)/2 + 1/4 squares, so a lone 1×1 dot is a quarter of a square across and a 2×2 circle is three
// quarters — each size leaves the same quarter-square of air around it. A bar spanning N squares runs from
// the centre of the first to the centre of the last, overhanging a quarter square at each end (so it is
// N−1+½ squares long, and its ends sit where a dot's edge would), and is half a square thick, ends square.

const f1 = v => v.toFixed(1);

export default function dotsAndBars() {
  const { ground, fg, ink } = groundScheme();
  const { W, H, S } = ctx, svg = svgRoot();
  const pool = [...fg, ink].filter(c => labDist(c, ground) > .22);
  const cs = shuffle(pool.length ? pool : [...fg, ink]);

  const g = S / ri(12, 30);                                    // grid square
  const cols = Math.ceil(W / g) + 1, rows = Math.ceil(H / g) + 1;
  const ox = (W - cols * g) / 2, oy = (H - rows * g) / 2;
  const taken = new Uint8Array(cols * rows);
  const free = (c, r, w, h) => {
    if (c < 0 || r < 0 || c + w > cols || r + h > rows) return false;
    for (let j = r; j < r + h; j++) for (let i = c; i < c + w; i++) if (taken[j * cols + i]) return false;
    return true;
  };
  const claim = (c, r, w, h) => { for (let j = r; j < r + h; j++) for (let i = c; i < c + w; i++) taken[j * cols + i] = 1; };
  const items = [];

  // 1. big circles first, while the grid is still empty enough to fit them
  const bigs = Math.round(cols * rows * rand(.02, .06));
  for (let k = 0; k < bigs; k++) {
    const n = pick([2, 2, 2, 3, 3, 4]);
    for (let t = 0; t < 12; t++) {
      const c = ri(0, cols - n), r = ri(0, rows - n);
      if (!free(c, r, n, n)) continue;
      claim(c, r, n, n);
      items.push({ kind: 'circle', x: ox + (c + n / 2) * g, y: oy + (r + n / 2) * g, rad: ((n - 1) / 2 + .25) * g });
      break;
    }
  }

  // 2. bars over 2–4 free squares, across or down
  const bars = Math.round(cols * rows * rand(.05, .12));
  for (let k = 0, made = 0; k < bars * 8 && made < bars; k++) {
    const n = ri(2, 4), horiz = chance(.5), w = horiz ? n : 1, h = horiz ? 1 : n;
    const c = ri(0, cols - w), r = ri(0, rows - h);
    if (!free(c, r, w, h)) continue;
    claim(c, r, w, h);
    // Centre of the first square to centre of the last, half a square thick, and a quarter square PAST the
    // centre at each end — so a bar's end is as far out as a dot's edge would be, and the two line up.
    const x0 = ox + (c + .5) * g, y0 = oy + (r + .5) * g, long = (n - 1) * g + g / 2;
    items.push({ kind: 'bar', x: x0 - g / 4, y: y0 - g / 4, w: horiz ? long : g / 2, h: horiz ? g / 2 : long });
    made++;
  }

  // 3. a small dot in everything still free
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    if (!taken[r * cols + c]) items.push({ kind: 'dot', x: ox + (c + .5) * g, y: oy + (r + .5) * g, rad: g * .25 });

  // one colour per item, or one for the big shapes and another for the field of dots
  const twoTone = chance(.66), bigCol = cs[0], dotCol = cs[1 % cs.length];
  const colors = {
    circle: bigCol,
    bar: bigCol,
    dot: dotCol,
  };
  if (twoTone && chance(0.33)) {
    colors.bar = cs[2 % cs.length];
  }
  rrange(0, items.length, i => {
    const it = items[i], small = it.kind === 'circle' && it.rad <= g * .26;
    const col = twoTone ? (colors[it.kind]) : pick(cs);
    if (it.kind === 'circle' || it.kind === 'dot') svg.node('circle', { cx: f1(it.x), cy: f1(it.y), r: f1(it.rad), fill: col });
    else svg.node('rect', { x: f1(it.x), y: f1(it.y), width: f1(it.w), height: f1(it.h), fill: col });
  }, { dur: 1.1 });
}
