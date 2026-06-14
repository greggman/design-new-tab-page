import { ctx, rand, ri, times, shuffle, el, mix, pick, chance, blendMode } from '../utils.js';
// Bokeh: soft out-of-focus discs of varying size, blurred and blended so they glow and overlap like
// defocused lights. Depth from blur + transparency rather than hard edges.
export default function bokeh() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), n = ri(12, 24), bl = blendMode();
  times(n, () => {
    const d = ctx.S * rand(.05, .3), x = rand(0, 1) * ctx.W, y = rand(0, 1) * ctx.H, col = pick(cs);
    el({ left: x + 'px', top: y + 'px', width: d + 'px', height: d + 'px', borderRadius: '50%', background: chance(.55) ? `radial-gradient(circle, ${col} 0%, ${col} 52%, transparent 72%)` : col, filter: `blur(${d * rand(.04, .12)}px)`, mixBlendMode: bl, opacity: rand(.32, .78) }, 'translate(-50%,-50%) scale(.8)', 'translate(-50%,-50%)');
  });
}
