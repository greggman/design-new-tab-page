import { ctx, rand, ri, times, shuffle, line, ring, box, circle, mix, chance, choice, thirds } from '../utils.js';
// Blueprint: a drafting sheet — a fine graph-paper grid overlaid with schematic motifs (a circle with
// crosshair, an outlined rectangle with corner ticks, a dimension line). Thin line-work over the bg.
export default function blueprint() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), faint = mix(ctx.P.ink, ctx.P.bg, .6), ink = cs[0];
  const g = ctx.S * rand(.05, .09), fine = Math.max(1, ctx.S * .0014), bold = Math.max(2, ctx.S * .003);
  for (let x = g; x < ctx.W; x += g) line({ x, y: ctx.H / 2, len: ctx.H, rot: 90, thick: fine, color: faint, z: 0 });
  for (let y = g; y < ctx.H; y += g) line({ x: ctx.W / 2, y, len: ctx.W, rot: 0, thick: fine, color: faint, z: 0 });
  const [mx, my] = thirds(), R = ctx.S * rand(.14, .24);
  ring({ x: mx, y: my, d: R * 2, w: bold, color: ink, z: 2 });
  line({ x: mx, y: my, len: R * 2.6, rot: 0, thick: fine, color: ink, z: 2 }); line({ x: mx, y: my, len: R * 2.6, rot: 90, thick: fine, color: ink, z: 2 });
  const rx = choice([.22, .3]) * ctx.W, ry = choice([.5, .68]) * ctx.H, rw = ctx.S * rand(.18, .3), rh = ctx.S * rand(.12, .22);
  box({ x: rx, y: ry, w: rw, h: rh, color: 'transparent', border: `${bold}px solid ${ink}`, z: 2 });
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(s => { line({ x: rx + s[0] * rw / 2, y: ry + s[1] * rh / 2, len: g * .7, rot: 0, thick: fine, color: ink, z: 3 }); });
  const dy = ctx.H * rand(.82, .9); line({ x: ctx.W / 2, y: dy, len: ctx.W * .5, rot: 0, thick: fine, color: ink, z: 2 });
  [-1, 1].forEach(s => circle({ x: ctx.W / 2 + s * ctx.W * .25, y: dy, w: ctx.S * .012, h: ctx.S * .012, color: ink, z: 3 }));
}
