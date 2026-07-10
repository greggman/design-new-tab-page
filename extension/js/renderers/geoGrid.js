import { ctx, ri, rand, shuffle, pick, chance, choice, box, mix } from '../utils.js';
// Geo grid: a grid of geometric motifs (bullseyes, concentric squares/leaves, quarter & three-quarter
// circles, split circles…), each in ≤3 palette colours. Most tracks are one unit; a few rows/columns
// are half-size, and the motifs simply squeeze to fit those cells. Bauhaus / mid-century tile look.
const HALF = ['polygon(0 0,100% 0,100% 50%,0 50%)', 'polygon(0 50%,100% 50%,100% 100%,0 100%)', 'polygon(0 0,50% 0,50% 100%,0 100%)', 'polygon(50% 0,100% 0,100% 100%,50% 100%)'];
function tracks(total, base, hp) {
  const t = []; let sum = 0;
  while (sum < total) { const s = chance(hp) ? base / 2 : base; t.push(s); sum += s; }
  const f = total / sum, out = []; let p = 0;
  for (const s of t) { out.push({ pos: p, size: s * f }); p += s * f; }
  return out;
}
export default function geoGrid() {
  const cs = [...new Set(shuffle([ctx.P.ink, ...ctx.POOL, ctx.P.accent]))], ground = ctx.P.bg;
  const base = Math.min(ctx.W, ctx.H) / ri(6, 10), hp = rand(.1, .25);
  const cols = tracks(ctx.W, base, hp), rows = tracks(ctx.H, base, hp);
  const leaf = () => pick(['0 50% 0 50%', '50% 0 50% 0']);
  for (const r of rows) for (const c of cols) {
    const w = c.size, h = r.size, cx = c.pos + w / 2, cy = r.pos + h / 2, pal = shuffle(cs), rot = choice([0, 90, 180, 270]);
    // at 90/270 the box's w/h swap on screen, so pre-swap them to keep the shape inside a non-square cell
    const S = (fw, fh, rad, col, rt = 0) => { const v = rt === 90 || rt === 270; box({ x: cx, y: cy, w: (v ? h * fh : w * fw) + .5, h: (v ? w * fw : h * fh) + .5, color: col, radius: rad, rot: rt }); };
    const withBg = chance(.3);
    const [f1, f2, f3] = withBg ? [pal[1], pal[2] || pal[1], pal[3] || pal[0]] : [pal[0], pal[1], pal[2] || pal[1]];
    if (withBg) S(1, 1, 0, pal[0]);
    switch (ri(0, 10)) {
      case 0: S(1, 1, '50%', f1); S(.62, .62, '50%', f2); if (chance(.7)) S(.26, .26, '50%', f3); break;                 // bullseye
      case 1: S(1, 1, 0, f1); S(.62, .62, 0, f2); if (chance(.6)) S(.28, .28, 0, f3); break;                             // concentric squares
      case 2: { const lr = leaf(); S(1, 1, lr, f1); S(.58, .58, lr, f2); if (chance(.5)) S(.24, .24, lr, f3); break; }   // concentric leaf
      case 3: S(1, 1, '100% 0 0 0', f1, rot); if (chance(.5)) S(.5, .5, '100% 0 0 0', f2, rot); break;                   // quarter circle
      case 4: S(1, 1, '50% 50% 0 50%', f1, rot); S(.3, .3, '50%', f2); break;                                            // circle w/ one square corner + dot
      case 5: S(1, 1, '50%', f1); box({ x: cx, y: cy, w: w + .5, h: h + .5, color: f2, radius: '50%', clip: pick(HALF) }); break; // split circle
      case 6: S(1, 1, '50% 50% 0 0', f1, rot); if (chance(.5)) S(.5, .5, '50% 50% 0 0', f2, rot); break;                 // semicircle
      case 7: S(1, 1, '50%', f1); S(.42, .42, '50%', chance(.5) ? ground : f2); break;                                   // donut / target
      case 8: S(1, 1, 0, f1); S(.4, .4, 0, f2, 45); break;                                                               // square + inner diamond
      case 9: { const lr = leaf(); S(1, 1, lr, f1); S(.3, .3, '50%', f2); break; }                                       // leaf + dot
      default: S(1, 1, leaf(), f1); S(.52, .52, '50%', f2); if (chance(.6)) S(.2, .2, '50%', f3);                        // eye
    }
  }
}
