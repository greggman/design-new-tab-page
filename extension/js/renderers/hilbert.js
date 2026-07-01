import { ctx, ri, rand, shuffle, pick, chance, line, group, mix } from '../utils.js';
// Hilbert curve: a continuous space-filling path over a 2^n grid, drawn as a ribbon. The whole curve
// is framed by a random zoom / rotation / off-centre pan, and varies in order, thickness and colouring,
// so each render shows a different stretch of the path rather than the same centred square.

function frameT(cx, cy, ext) {
  if (chance(.16)) return 'translate(0px,0px)';
  const zoom = chance(.75) ? rand(1.2, 3.1) : 1;
  const rot = chance(.55) ? (chance(.7) ? rand(-33, 33) : pick([90, 180, 270])) : 0;
  const fx = cx + rand(-.45, .45) * ext, fy = cy + rand(-.45, .45) * ext;
  const tgx = ctx.W * rand(.4, .6), tgy = ctx.H * rand(.4, .6);
  const r = rot * Math.PI / 180, co = Math.cos(r), si = Math.sin(r);
  const mfx = (fx * co - fy * si) * zoom, mfy = (fx * si + fy * co) * zoom;
  return `translate(${(tgx - mfx).toFixed(1)}px,${(tgy - mfy).toFixed(1)}px) rotate(${rot}deg) scale(${zoom.toFixed(3)})`;
}

export default function hilbert() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const order = ri(3, 5), n = 1 << order, pts = [];
  for (let dd = 0; dd < n * n; dd++) {
    let rx, ry, t = dd, x = 0, y = 0;
    for (let s = 1; s < n; s <<= 1) {
      rx = 1 & (t >> 1); ry = 1 & (t ^ rx);
      if (ry === 0) { if (rx === 1) { x = s - 1 - x; y = s - 1 - y; } const tmp = x; x = y; y = tmp; }
      x += s * rx; y += s * ry; t >>= 2;
    }
    pts.push([x, y]);
  }
  const m = Math.min(ctx.W, ctx.H) * rand(.84, .96), ox = (ctx.W - m) / 2, oy = (ctx.H - m) / 2, sc = m / (n - 1);
  const th = Math.max(2, sc * rand(.22, .6));
  const mode = pick(['grad', 'twoTone', 'byDir']);
  group({ transform: frameT(ctx.W / 2, ctx.H / 2, m * .5), transformOrigin: '0px 0px' }, null, null, () => {
    for (let i = 1; i < pts.length; i++) {
      const ax = ox + pts[i - 1][0] * sc, ay = oy + pts[i - 1][1] * sc, bx = ox + pts[i][0] * sc, by = oy + pts[i][1] * sc;
      const col = mode === 'grad' ? mix(cs[0], cs[cs.length - 1], i / pts.length) : mode === 'twoTone' ? cs[i % 2] : (ay === by ? cs[0] : cs[1 % cs.length]);
      line({ x: (ax + bx) / 2, y: (ay + by) / 2, len: Math.hypot(bx - ax, by - ay) + th, rot: Math.atan2(by - ay, bx - ax) * 180 / Math.PI, thick: th, color: col, z: 2 });
    }
  });
}
