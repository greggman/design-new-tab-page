import { ctx, ri, rand, times, shuffle, pick, chance, el, mix } from '../utils.js';
// Koch / Cesàro fractal: each edge's middle third is replaced by a peak, but the PEAK ANGLE is a
// parameter. At 60° it's the classic Koch snowflake; larger angles give tall spiky, self-overlapping
// curves (rendered even-odd so the overlaps read as holes/crosshatch); the base can also be a square
// or pentagon and the bumps can point inward (anti-snowflake).
function seg(a, b, d, out, th) {
  if (d === 0) { out.push(a); return; }
  const dx = (b[0] - a[0]) / 3, dy = (b[1] - a[1]) / 3;
  const p1 = [a[0] + dx, a[1] + dy], p3 = [a[0] + 2 * dx, a[1] + 2 * dy];
  const c = Math.cos(th), s = Math.sin(th);                 // peak = p1 + rotate(middle-third vector, th)
  const peak = [p1[0] + dx * c - dy * s, p1[1] + dx * s + dy * c];
  seg(a, p1, d - 1, out, th); seg(p1, peak, d - 1, out, th); seg(peak, p3, d - 1, out, th); seg(p3, b, d - 1, out, th);
}
function flake(cx, cy, R, rot, depth, sides, th) {
  const v = [], out = [];
  for (let i = 0; i < sides; i++) { const a = rot + i * 2 * Math.PI / sides - Math.PI / 2; v.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
  for (let i = 0; i < sides; i++) seg(v[i], v[(i + 1) % sides], depth, out, th);
  return 'polygon(evenodd,' + out.map(p => `${(p[0] / ctx.W * 100).toFixed(2)}% ${(p[1] / ctx.H * 100).toFixed(2)}%`).join(',') + ')';
}
export default function koch() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const wild = chance(.5);                                  // wild = tall/overlapping spikes
  const sides = pick([3, 3, 3, 4, 5]);
  let th = -(wild ? rand(62, 88) : rand(30, 60)) * Math.PI / 180;
  if (chance(.22)) th = -th;                                // bumps point inward (anti-snowflake)
  const depth = sides >= 4 ? ri(2, 3) : ri(3, 4);
  const n = wild ? 1 : ri(1, 3);
  times(n, () => {
    const R = ctx.S * (n === 1 ? rand(.3, .44) : rand(.16, .34));
    const cx = (n === 1 ? .5 + rand(-.05, .05) : rand(.2, .8)) * ctx.W, cy = (n === 1 ? .5 + rand(-.05, .05) : rand(.2, .8)) * ctx.H;
    const rot = rand(0, Math.PI * 2), col = pick(cs);
    el({ left: '0px', top: '0px', width: ctx.W + 'px', height: ctx.H + 'px', background: col, clipPath: flake(cx, cy, R, rot, depth, sides, th), zIndex: 2 }, 'none', 'none');
    if (!wild && chance(.5)) el({ left: '0px', top: '0px', width: ctx.W + 'px', height: ctx.H + 'px', background: mix(col, ctx.P.bg, .45), clipPath: flake(cx, cy, R * .6, rot, depth, sides, th), zIndex: 3 }, 'none', 'none');
  });
}
