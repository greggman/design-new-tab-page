import { ctx, ri, rand, shuffle, pick, chance, box, mix, CLIPS } from '../utils.js';
// Perspective tunnel: concentric shapes shrinking by a fixed ratio toward an (often off-centre)
// vanishing point, so the spacing tightens with depth — a receding tunnel. Optional per-ring twist
// turns it into a spiral.
export default function perspectiveTunnel() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const vpx = rand(.3, .7) * ctx.W, vpy = rand(.3, .7) * ctx.H;
  const shape = pick(['square', 'square', 'circle', 'hexagon', 'diamond', 'octagon']);
  const clip = shape === 'square' || shape === 'circle' ? undefined : CLIPS[shape];
  const radius = shape === 'circle' ? '50%' : 0;
  const layers = ri(16, 32), ratio = rand(.82, .9);
  const twist = chance(.5) ? rand(1, 6) * (chance(.5) ? 1 : -1) : 0;
  const aspect = ctx.H / ctx.W, c0 = cs[0], c1 = cs[1] || mix(c0, ctx.P.bg, .45);
  let size = Math.hypot(ctx.W, ctx.H) * 1.25;
  let i = 0;
  for (; i < layers && size > 4; i++) { box({ x: vpx, y: vpy, w: size, h: size * aspect, color: i % 2 ? c0 : c1, clip, radius, rot: i * twist, z: i }); size *= ratio; }
}
