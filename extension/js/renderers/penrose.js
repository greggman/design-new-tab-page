import { ctx, ri, rand, times, shuffle, box, mix, chance, CLIPS } from '../utils.js';
// Penrose sun: concentric decagonal rings of alternating "thick" and "thin" rhombi radiating from a
// centre — the 5-/10-fold aperiodic look of a Penrose P3 vertex. (Rhombi are approximated with scaled
// diamonds rather than a true de Bruijn tiling.)
export default function penrose() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const cx = rand(0, ctx.W ), cy = rand(0, ctx.H);
  const maxR = Math.hypot(ctx.W, ctx.H) * 1.02;
  const rings = ri(6, 14), sym = 10, rw = maxR / rings;
  times(rings, k => {
    const rr = maxR * (k + 0.6) / rings, n = sym * (k + 1);
    times(n, i => {
      const a = i / n * Math.PI * 2 + (k % 2 ? Math.PI / n : 0);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      const thin = i % 2 === 0;
      box({ x, y, w: rw * (thin ? .52 : .9), h: rw * rand(.72, .92), rot: a * 180 / Math.PI + 90, clip: CLIPS.diamond,
        color: thin ? mix(cs[k % cs.length], ctx.P.bg, .12) : cs[(k + 1) % cs.length] });
    });
  });
  if (chance(.6)) box({ x: cx, y: cy, w: rw * .8, h: rw * .8, color: ctx.P.accent, rot: 45, clip: CLIPS.pentagon });
}
