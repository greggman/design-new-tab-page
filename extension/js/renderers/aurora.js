import { ctx, rand, ri, times, shuffle, el, chance } from '../utils.js';
// Aurora: large soft radial-gradient blobs blended together. The lone soft-edged system among the
// hard-edged ones — relies on color harmony and luminosity gradients for a calm, atmospheric depth.
export default function aurora() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), n = ri(3, 6), blend = ctx.P.dark ? 'screen' : 'multiply';
  times(n, i => {
    const d = ctx.S * rand(.42, .92), x = rand(0, 1) * ctx.W, y = rand(0, 1) * ctx.H, col = cs[i % cs.length];
    el({ left: x + 'px', top: y + 'px', width: d + 'px', height: d + 'px', borderRadius: '50%', background: `radial-gradient(circle, ${col} 0%, transparent 70%)`, filter: `blur(${ctx.S * rand(.03, .07)}px)`, mixBlendMode: blend, opacity: rand(.6, .95) }, 'translate(-50%,-50%) scale(.7)', 'translate(-50%,-50%)');
  });
}
