import { ctx, rand, ri, times, shuffle, el, box, mix, chance } from '../utils.js';
// Plasma: vivid radial-gradient blobs stacked with a screen (additive) blend on a dark field, so
// overlaps bloom into hot neon — the lava-lamp / liquid-light glow of a chill-out room visual.
export default function plasma() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), n = ri(5, 9);
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: mix(ctx.P.bg, '#000000', .45), z: -1 });
  times(n, i => {
    const d = ctx.S * rand(.3, .82), x = rand(0, 1) * ctx.W, y = rand(0, 1) * ctx.H, col = mix(cs[i % cs.length], '#ffffff', .12);
    el({ left: x + 'px', top: y + 'px', width: d + 'px', height: d + 'px', borderRadius: '50%', background: `radial-gradient(circle, ${col} 0%, transparent 66%)`, filter: `blur(${ctx.S * rand(.02, .05)}px)`, mixBlendMode: 'screen', opacity: rand(.7, 1) }, 'translate(-50%,-50%) scale(.7)', 'translate(-50%,-50%)');
  });
}
