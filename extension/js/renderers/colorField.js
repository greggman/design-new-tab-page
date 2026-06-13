import { ctx, rand, ri, times, shuffle, el, mix } from '../utils.js';
// Color field: a few soft-edged horizontal blocks inset by a margin, à la Rothko. Slight blur and
// muted, closely-valued colors make the bands hover — restraint and proportion over detail.
export default function colorField() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]), n = ri(2, 4);
  let ws = Array.from({ length: n }, () => rand(.5, 1.6)); const sum = ws.reduce((a, b) => a + b, 0); ws = ws.map(w => w / sum * ctx.H);
  const margin = ctx.W * rand(.06, .14);
  let p = 0;
  ws.forEach((h, i) => {
    el({ left: margin + 'px', top: p + 'px', width: (ctx.W - 2 * margin) + 'px', height: h + 'px', background: mix(cs[i % cs.length], ctx.P.bg, .12), filter: `blur(${ctx.S * rand(.006, .015)}px)`, opacity: rand(.85, 1) }, 'scale(.97)', 'none');
    p += h;
  });
}
