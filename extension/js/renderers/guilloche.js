import { ctx, ri, range, rand, times, shuffle, pick, line, mix, chance } from '../utils.js';
// Guilloché / string art: pencils of straight lines connecting points on two segments. The lines are
// straight but their envelope traces a smooth parabolic curve — the caustic look of banknotes.
function pencil(A0, A1, B0, B1, n, th, col) {
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const ax = A0[0] + (A1[0] - A0[0]) * t, ay = A0[1] + (A1[1] - A0[1]) * t;
    const bx = B0[0] + (B1[0] - B0[0]) * (1 - t), by = B0[1] + (B1[1] - B0[1]) * (1 - t);
    line({ x: (ax + bx) / 2, y: (ay + by) / 2, len: Math.hypot(bx - ax, by - ay) + th, rot: Math.atan2(by - ay, bx - ax) * 180 / Math.PI, thick: th, color: col, z: 2 });
  }
}
export default function guilloche() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const th = Math.max(1, ctx.S * rand(.0015, .003)), n = ri(18, 34);
  let a = 0;
  const c = ri(3, 6);
  const corners = range(c, () => {
    a += rand(Math.PI * .2, Math.PI * .8);
    return [
      ctx.W / 2 + Math.cos(a) * ctx.W * rand(.1, .7),
      ctx.H / 2 + Math.sin(a) * ctx.H * rand(.1, .7),
    ];
  });
  const mid = [
    rand(0, ctx.W), rand(0, ctx.H)
  ];
  // string art in each corner toward the centre → a woven rosette of envelopes
  corners.forEach((c, i) => {
    const nxt = corners[(i + 1) % 4];
    pencil(c, mid, c, nxt, n, th, mix(cs[i % cs.length], ctx.P.bg, .1));
  });
}
