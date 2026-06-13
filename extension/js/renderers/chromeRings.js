import { ctx, rand, ri, times, shuffle, el, circle, mix, chance } from '../utils.js';
// Chrome rings: concentric discs each filled with a conic gradient cycling light→dark→light, faking
// a polished metal reflection. Stacked smaller and smaller, they read as a beveled chrome target —
// the liquid-metal Y2K finish.
export default function chromeRings() {
  const light = mix(ctx.P.accent, '#ffffff', .55), midc = ctx.P.accent, dark = mix(ctx.P.ink, '#000000', .25);
  const cx = ctx.W / 2 + rand(-.05, .05) * ctx.W, cy = ctx.H / 2 + rand(-.05, .05) * ctx.H;
  const n = ri(3, 6); let r = Math.min(ctx.W, ctx.H) * rand(.42, .55);
  times(n, i => {
    const grad = `conic-gradient(from ${rand(0, 360).toFixed(1)}deg, ${dark}, ${light}, ${midc}, ${dark}, ${light}, ${midc}, ${dark})`;
    el({ left: cx + 'px', top: cy + 'px', width: r * 2 + 'px', height: r * 2 + 'px', borderRadius: '50%', background: grad, boxShadow: `inset 0 ${r * .06}px ${r * .12}px rgba(255,255,255,.35), inset 0 -${r * .06}px ${r * .12}px rgba(0,0,0,.4)`, zIndex: i }, 'translate(-50%,-50%) scale(.7)', 'translate(-50%,-50%)');
    r *= rand(.56, .72);
  });
  if (chance(.7)) circle({ x: cx - r * .3, y: cy - r * .3, w: r * .7, h: r * .7, color: mix(light, '#ffffff', .4), z: n + 1, opacity: .8 });
}
