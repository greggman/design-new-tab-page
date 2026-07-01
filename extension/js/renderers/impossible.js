import { ctx, ri, rand, times, shuffle, pick, line, box, chance } from '../utils.js';
// Impossible / ambiguous cubes: scattered isometric wireframe cubes. A full 12-edge cube with no
// occlusion reads as a Necker cube — the eye keeps flipping which face is in front.
function edge(a, b, th, col) {
  line({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, len: Math.hypot(b[0] - a[0], b[1] - a[1]) + th, rot: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, thick: th, color: col, z: 2 });
}
function cube(cx, cy, s, th, col) {
  const px = 0.866 * s, py = 0.5 * s;
  const B = [[cx, cy], [cx + px, cy - py], [cx, cy - 2 * py], [cx - px, cy - py]];
  const T = B.map(([x, y]) => [x, y - s]);
  for (let i = 0; i < 4; i++) { edge(B[i], B[(i + 1) % 4], th, col); edge(T[i], T[(i + 1) % 4], th, col); edge(B[i], T[i], th, col); }
}
export default function impossible() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const big = chance(.4);
  if (big) { const s = ctx.S * rand(.34, .5); cube(ctx.W / 2, ctx.H / 2 + s, s, Math.max(3, ctx.S * .012), pick(cs)); return; }
  const n = ri(5, 11);
  times(n, () => { const s = ctx.S * rand(.1, .22); cube(rand(.15, .85) * ctx.W, rand(.2, .9) * ctx.H, s, Math.max(2, ctx.S * .008), pick(cs)); });
}
