import { ctx, rand, ri, times, shuffle, box, stripe, pick, mix, chance, blendMode } from '../utils.js';
// Glitch: datamosh — displaced horizontal slices, channel-shifted blocks on a blend, and scanlines.
// Controlled corruption; the offsets read as a signal breaking up, a staple of IDM / breakcore art.
export default function glitch() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]), bl = blendMode();
  times(ri(2, 4), () => box({ x: ctx.W / 2, y: rand(0, 1) * ctx.H, w: ctx.W, h: ctx.H * rand(.08, .26), color: mix(pick(cs), ctx.P.bg, .2), z: 0 }));
  times(ri(12, 24), () => box({ x: ctx.W / 2 + rand(-.12, .12) * ctx.W, y: rand(0, 1) * ctx.H, w: ctx.W, h: ctx.H * rand(.004, .05), color: pick(cs), opacity: rand(.5, 1), blend: chance(.4) ? bl : null, z: 1 }));
  times(ri(4, 9), () => box({ x: rand(.1, .9) * ctx.W, y: rand(.1, .9) * ctx.H, w: ctx.W * rand(.18, .6), h: ctx.H * rand(.02, .12), color: pick(cs), opacity: rand(.4, .8), blend: bl, z: 2 }));
  const D = Math.hypot(ctx.W, ctx.H) * 1.2;
  stripe({ x: ctx.W / 2, y: ctx.H / 2, w: D, h: D, rot: 90, color: mix(ctx.P.ink, ctx.P.bg, .55), lw: Math.max(1, ctx.S * .002), gap: Math.max(2, ctx.S * .004) });
}
