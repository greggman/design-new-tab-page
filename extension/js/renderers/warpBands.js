import { ctx, ri, rand, times, shuffle, box, mix, chance, clamp, blendMode } from '../utils.js';
// Warp bands: flowing strata sampled as vertical slices. Each band has its OWN phase and a wave
// amplitude on the order of its thickness, so layers pinch, swell, and cross — agate / liquid-light.
// Two looks: opaque marbled strata, or translucent silk ribbons that blend with what's behind.
export default function warpBands() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const slices = ri(100, 170), sw = ctx.W / slices, bands = ri(7, 15), bh = ctx.H / bands;
  const ribbon = chance(.45), bl = ribbon ? blendMode() : null, f1 = rand(.7, 2.1), f2 = rand(1.6, 4);
  const P = Array.from({ length: bands }, () => ({ ph: rand(0, 6.28), amp: bh * rand(.5, 1.25), a2: bh * rand(0, .55) }));
  const grad = t => { const n = cs.length - 1; const f = clamp(t, 0, .999) * n, i = Math.floor(f); return mix(cs[i], cs[i + 1], f - i); };
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: ribbon ? ctx.P.bg : grad(0), z: -1 });
  times(slices, s => {
    const x = (s + .5) * sw, u = x / ctx.W;
    times(bands, b => {
      const p = P[b], wave = p.amp * Math.sin(u * f1 * 6.2832 + p.ph) + p.a2 * Math.sin(u * f2 * 6.2832 + p.ph * 1.7);
      const y = (b + .5) / bands * ctx.H + wave;
      box({ x, y, w: sw + 1, h: bh * 1.9, color: grad(bands > 1 ? b / (bands - 1) : 0), opacity: ribbon ? rand(.5, .72) : 1, blend: bl, z: b });
    });
  });
}
