import { ctx, ri, rand, times, shuffle, pick, el, group, CLIPS, POLY } from '../utils.js';
// Drop shapes: one or two big bold shapes placed at random, each with a soft blurred drop-shadow.
// The shadow must live on a WRAPPER, not the shape itself: CSS applies clip-path AFTER filter, so a
// drop-shadow on the clipped element gets clipped away. Wrapper holds the filter, child holds the clip.
export default function dropShapes() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const kinds = shuffle(['circle', 'square', ...POLY]).slice(0, ri(1, 2));
  const n = ri(1, 4), dark = ctx.P.dark;
  times(n, () => {
    const kind = pick(kinds), size = ctx.S * rand(.22, .5);
    const x = rand(.22, .78) * ctx.W, y = rand(.24, .76) * ctx.H, col = pick(cs), rot = rand(0, 360);
    const clip = kind === 'circle' || kind === 'square' ? 'none' : CLIPS[kind];
    const radius = kind === 'circle' ? '50%' : 0;
    const blur = size * rand(.07, .15), sdx = size * rand(.03, .1), sdy = size * rand(.06, .14);
    group({ filter: `drop-shadow(${sdx}px ${sdy}px ${blur}px rgba(0,0,0,${dark ? .55 : .35}))`, zIndex: 2 }, null, null, () => {
      el({ left: x + 'px', top: y + 'px', width: size + 'px', height: size + 'px', background: col, clipPath: clip, borderRadius: radius },
        `translate(-50%,-50%) rotate(${rot}deg) scale(.8)`, `translate(-50%,-50%) rotate(${rot}deg)`);
    });
  });
}
