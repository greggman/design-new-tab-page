import { ctx, rand, ri, times, shuffle, ring, line, circle, el, mix, chance, choice, thirds } from '../utils.js';
// Radar: a scope — concentric range rings, radial bearing lines, a fading conic sweep, and a few
// blips. Reads as an instrument display; the open scope lets the background through.
export default function radar() {
  const [cx, cy] = chance(.5) ? [ctx.W / 2, ctx.H / 2] : thirds(), cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const col = cs[0], maxR = ctx.S * rand(.38, .55), faint = mix(col, ctx.P.bg, .45), t = Math.max(1.5, ctx.S * .0028);
  const rings = ri(3, 6); times(rings, i => ring({ x: cx, y: cy, d: (i + 1) / rings * maxR * 2, w: t, color: faint, z: 1 }));
  const bear = ri(6, 12); times(bear, i => line({ x: cx, y: cy, len: maxR * 2, rot: i * 360 / bear, thick: t, color: faint, z: 1 }));
  const a0 = rand(0, 360), d = maxR * 2;
  el({ left: cx + 'px', top: cy + 'px', width: d + 'px', height: d + 'px', borderRadius: '50%', background: `conic-gradient(from ${a0.toFixed(1)}deg, ${col} 0deg, transparent 70deg)`, opacity: .4, zIndex: 2 }, 'translate(-50%,-50%) scale(.8)', 'translate(-50%,-50%)');
  times(ri(3, 7), () => { const a = rand(0, 6.28), r = rand(.1, 1) * maxR, s = ctx.S * rand(.012, .026); circle({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, w: s, h: s, color: ctx.P.accent, z: 5 }); });
}
