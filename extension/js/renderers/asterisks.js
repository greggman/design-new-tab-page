import { ctx, ri, rand, times, shuffle, pick, chance, line, circle, box, mix, lum } from '../utils.js';
// Asterisks: a dense all-over field of mid-century "jack" motifs. Each motif is N (2–6) straight lines
// all crossing one shared centre — every line the SAME dark colour but a different length, and each of
// its two ends tipped with a differently-coloured little circle. Small loose dots fill the gaps. The
// motifs sit on a half-drop grid so the field reads as a repeating 1950s atomic print. Div primitives.
function jack(cx, cy, R, nLines, lineCol, tips, thick) {
  const base = rand(0, 180);
  times(nLines, i => {
    const a = base + i * 180 / nLines + rand(-7, 7);            // even-ish angular spread, jittered
    const d1 = R * rand(.42, 1), d2 = R * rand(.42, 1);        // the two arms are different lengths
    const rad = a * Math.PI / 180, dx = Math.cos(rad), dy = Math.sin(rad);
    const e1x = cx + dx * d1, e1y = cy + dy * d1, e2x = cx - dx * d2, e2y = cy - dy * d2;
    line({ x: (e1x + e2x) / 2, y: (e1y + e2y) / 2, len: d1 + d2, rot: a, thick, color: lineCol, z: 2 });
    const t1 = R * rand(.11, .18), t2 = R * rand(.11, .18);
    circle({ x: e1x, y: e1y, w: t1 * 2, h: t1 * 2, color: pick(tips), z: 3 });
    circle({ x: e2x, y: e2y, w: t2 * 2, h: t2 * 2, color: pick(tips), z: 3 });
  });
}
export default function asterisks() {
  const bg = lum(ctx.P.bg) >= lum(ctx.P.ink) ? ctx.P.bg : ctx.P.ink;   // cream ground = lighter of the two
  const lineCol = bg === ctx.P.bg ? ctx.P.ink : ctx.P.bg;              // charcoal spokes = the darker of the two
  const tips = shuffle([...ctx.POOL, ctx.P.accent]).filter(c => Math.abs(lum(c) - lum(bg)) > .12);
  if (tips.length < 2) tips.push(ctx.P.accent, mix(ctx.P.accent, '#000000', .35));
  if (chance(0.75)) box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: bg, z: -1 });
  const cell = ctx.S * rand(.15, .22), thick = Math.max(1.5, cell * .034);
  const cols = Math.ceil(ctx.W / cell) + 1, rows = Math.ceil(ctx.H / cell) + 1;
  times(rows, r => times(cols, c => {
    const drop = (r % 2) * cell * .5;                                  // half-drop every other row
    const cx = c * cell + drop + rand(-.12, .12) * cell, cy = r * cell + rand(-.12, .12) * cell;
    if (chance(.74)) jack(cx, cy, cell * rand(.36, .5), ri(2, 6), lineCol, tips, thick);
    else if (chance(.5)) circle({ x: cx, y: cy, w: cell * rand(.1, .2), h: cell * rand(.1, .2), color: pick(tips), z: 3 });  // lone dot
    times(ri(0, 2), () => circle({ x: cx + rand(-.42, .42) * cell, y: cy + rand(-.42, .42) * cell, w: cell * rand(.05, .1), h: cell * rand(.05, .1), color: pick(tips), z: 3 }));  // filler dots
  }));
}
