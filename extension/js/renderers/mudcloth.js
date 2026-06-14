import { ctx, rand, ri, times, box, line, CLIPS, mix, pick, chance, lum, contrastPair } from '../utils.js';
// Mudcloth (bògòlanfini): a deep ground banded with rows of hand-drawn marks — dashes, X's, zigzags,
// small diamonds, and separator rules. Ground + marks are a contrasting palette pair (so the colors
// vary run to run), with an occasional accent row.
export default function mudcloth() {
  const [light, dark] = contrastPair([...ctx.POOL, ctx.P.accent]);
  const ground = mix(dark, '#000000', .18), mark = light, accent = ctx.P.accent;
  const useAccent = lum(accent) - lum(ground) > .35;
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: ground, z: -1 });
  const rows = ri(5, 9), rh = ctx.H / rows, t = Math.max(2, ctx.S * .004);
  times(rows, r => {
    const y = (r + .5) * rh, m = (useAccent && chance(.22)) ? accent : mark;
    switch (pick(['dash', 'x', 'zig', 'diamond', 'rule', 'dot'])) {
      case 'dash': { const n = ri(12, 26); times(n, i => box({ x: (i + .5) / n * ctx.W, y, w: ctx.W / n * .5, h: rh * .14, color: m })); break; }
      case 'x': { const n = ri(8, 16); times(n, i => { const x = (i + .5) / n * ctx.W; line({ x, y, len: rh * .42, rot: 45, thick: t, color: m }); line({ x, y, len: rh * .42, rot: -45, thick: t, color: m }); }); break; }
      case 'zig': { const n = ri(8, 16), step = ctx.W / n; let px = 0, py = y - rh * .16; times(n, i => { const x = (i + 1) * step, yy = y + (i % 2 ? rh * .16 : -rh * .16); line({ x: (px + x) / 2, y: (py + yy) / 2, len: Math.hypot(x - px, yy - py) + 1, rot: Math.atan2(yy - py, x - px) * 57.2958, thick: t, color: m }); px = x; py = yy; }); break; }
      case 'diamond': { const n = ri(8, 16); times(n, i => box({ x: (i + .5) / n * ctx.W, y, w: rh * .34, h: rh * .34, color: chance(.5) ? m : 'transparent', border: `${t}px solid ${m}`, clip: CLIPS.diamond })); break; }
      case 'rule': { box({ x: ctx.W / 2, y: y - rh * .14, w: ctx.W, h: t, color: m }); box({ x: ctx.W / 2, y: y + rh * .14, w: ctx.W, h: t, color: m }); break; }
      default: { const n = ri(14, 30); times(n, i => box({ x: (i + .5) / n * ctx.W, y, w: rh * .12, h: rh * .12, color: m, radius: '50%' })); }
    }
  });
}
