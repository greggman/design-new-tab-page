import { ctx, rand, ri, shuffle, pick, chance, wpick, contrastPair, el } from '../utils.js';
// Houndstooth: the broken-check textile (conic quadrants + a diagonal repeating-linear gradient for
// the teeth, per Alvaro Montoro's recipe). Beyond colour/scale it varies by composition: a full field
// on the bias, striped colourways, a colour-blocked grid, or a base field with a houndstooth disc.

const img = (a, b, dir) =>
  `conic-gradient(${a} 25%, #0000 0 50%, ${b} 0 75%, #0000 0),` +
  `repeating-linear-gradient(${dir}deg, ${a} 0 12.5%, ${b} 0 25%, ${a} 0 37.5%, ${b} 0 62.5%)`;

// draw a houndstooth-filled rectangle (or disc, via extra.borderRadius), optionally rotated. Animates
// in (fade + slight zoom, staggered) via el's `fin` keyframe like the other renderers.
function field(x, y, w, h, size, a, b, dir, rot, extra) {
  const T = rot ? `rotate(${rot}deg)` : 'scale(1)';
  el({ left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', backgroundColor: b,
    backgroundImage: img(a, b, dir), backgroundSize: `${size}px ${size}px`, ...extra },
    `${T} scale(.94)`, T);
}
const pair = cs => contrastPair(shuffle(cs));           // [lighter, darker]
const dir = () => chance(.5) ? 135 : 45;                // which diagonal the teeth lean
const sz = () => ctx.S * rand(.05, .13);

export default function houndstooth() {
  const cs = [...ctx.POOL, ctx.P.accent, ctx.P.ink];
  const mode = wpick([['full', 3], ['bands', 2.4], ['blocks', 2.4], ['shape', 1.6]]);

  if (mode === 'full') {
    const [a, b] = pair(cs), rot = chance(.5) ? pick([90, rand(-26, 26)]) : 0;
    const w = rot ? Math.hypot(ctx.W, ctx.H) * 1.15 : ctx.W, h = rot ? w : ctx.H;
    field((ctx.W - w) / 2, (ctx.H - h) / 2, w, h, sz(), a, b, dir(), rot, { zIndex: -2 });

  } else if (mode === 'bands') {
    const horiz = chance(.5), n = ri(2, 4), d = dir(), total = horiz ? ctx.H : ctx.W;
    const segs = []; let acc = 0;
    for (let i = 0; i < n; i++) { const s = rand(.7, 1.3); segs.push(s); acc += s; }
    let p = 0;
    for (const s of segs) {
      const len = s / acc * total, [a, b] = pair(cs);
      if (horiz) field(0, p, ctx.W, len + 1, sz(), a, b, d, 0, { zIndex: -2 });
      else field(p, 0, len + 1, ctx.H, sz(), a, b, d, 0, { zIndex: -2 });
      p += len;
    }

  } else if (mode === 'blocks') {
    const cols = ri(2, 3), rows = ri(2, 3), cw = ctx.W / cols, ch = ctx.H / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [a, b] = pair(cs);
      field(c * cw, r * ch, cw + 1, ch + 1, sz(), a, b, dir(), 0, { zIndex: -2 });
    }

  } else {
    const [a, b] = pair(cs);
    field(0, 0, ctx.W, ctx.H, sz(), a, b, dir(), 0, { zIndex: -3 });
    const [a2, b2] = pair(cs), d = ctx.S * rand(.5, .85);
    field(ctx.W / 2 - d / 2 + rand(-.15, .15) * ctx.W, ctx.H / 2 - d / 2 + rand(-.1, .1) * ctx.H,
      d, d, ctx.S * rand(.04, .1), a2, b2, dir(), pick([0, 90, rand(-30, 30)]), { borderRadius: '50%', zIndex: -1 });
  }
}
