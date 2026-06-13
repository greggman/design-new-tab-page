import { ctx, rand, ri, shuffle, choice, chance, box, circle, mix, pick } from '../utils.js';
// Tangram: the frame divided by diagonals into large flat color planes, with a smaller quadrant
// subdivided again. Bold geometric blocking — few shapes, high contrast, strong silhouette.
export default function tangram() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]), W = ctx.W, H = ctx.H;
  box({ x: W / 2, y: H / 2, w: W, h: H, color: cs[0] });
  const big = choice(['polygon(0 0,100% 0,0 100%)', 'polygon(0 0,100% 0,100% 100%)', 'polygon(100% 0,100% 100%,0 100%)', 'polygon(0 0,0 100%,100% 100%)']);
  box({ x: W / 2, y: H / 2, w: W, h: H, color: cs[1 % cs.length], clip: big });
  const q = choice([[.25, .25], [.75, .25], [.25, .75], [.75, .75]]);
  const qw = W / 2, qh = H / 2;
  box({ x: q[0] * W, y: q[1] * H, w: qw, h: qh, color: cs[2 % cs.length], z: 2 });
  box({ x: q[0] * W, y: q[1] * H, w: qw, h: qh, color: cs[3 % cs.length] || mix(cs[2 % cs.length], ctx.P.ink, .25), clip: choice(['polygon(0 0,100% 0,0 100%)', 'polygon(100% 0,100% 100%,0 100%)']), z: 3 });
  if (chance(.6)) circle({ x: choice([1 / 3, 2 / 3]) * W, y: choice([1 / 3, 2 / 3]) * H, w: ctx.S * rand(.14, .24), h: ctx.S * rand(.14, .24), color: ctx.P.accent, z: 5 });
}
