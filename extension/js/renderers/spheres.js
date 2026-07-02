import { ctx, ri, rand, times, shuffle, pick, el, mix } from '../utils.js';
// Spheres: scattered shaded balls. Each is a radial gradient (highlight → body → shadow) with a soft
// contact shadow beneath — like Bubbles but rendered as solid 3-tone spheres.
export default function spheres() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const items = [];
  times(ri(5, 16), () => items.push({ x: rand(0, 1) * ctx.W, y: rand(0, 1) * ctx.H, d: ctx.S * rand(.08, .28), c: pick(cs) }));
  items.sort((p, q) => p.d - q.d);                    // draw larger last so they sit in front
  items.forEach(s => {
    const hi = mix(s.c, '#ffffff', .6), sh = mix(s.c, '#000000', .5), lx = rand(28, 42), ly = rand(24, 38);
    el({ left: s.x + 'px', top: (s.y + s.d * .42) + 'px', width: s.d * .9 + 'px', height: s.d * .26 + 'px', background: 'rgba(0,0,0,.28)', borderRadius: '50%', filter: `blur(${s.d * .05}px)`, zIndex: 1 },
      'translate(-50%,-50%) scale(.6)', 'translate(-50%,-50%)');
    el({ left: s.x + 'px', top: s.y + 'px', width: s.d + 'px', height: s.d + 'px', borderRadius: '50%',
      background: `radial-gradient(circle at ${lx}% ${ly}%, ${hi}, ${s.c} 46%, ${sh} 100%)`, zIndex: 2 },
      'translate(-50%,-50%) scale(.7)', 'translate(-50%,-50%)');
  });
}
