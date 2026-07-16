import { ctx, ri, rand, shuffle, pick, chance, svgRoot, mix, lum } from '../utils.js';
// Ogee: the mid-century "onion" pattern. An interlocking grid of a repeated cell shape — a pointed oval,
// a sharp-tipped tear/ogee, a rounded diamond or a rounded hexagon — columns offset by half so they
// interlock, colours cycling per column, on a light ground that shows through as the wavy negative
// space. One motif per render fills every cell: plain, nested outline + dot, concentric bullseye, or
// nested shapes. Covers the classic reference variants.
export default function ogee() {
  const bg = ctx.P.bg;
  const cs = [...new Set(shuffle([...ctx.POOL, ctx.P.accent, ctx.P.ink]))].filter(c => Math.abs(lum(c) - lum(bg)) > .06);
  if (cs.length < 2) cs.push(mix(bg, ctx.P.ink, .6), ctx.P.accent);
  const s = svgRoot(), f = v => (+v).toFixed(1);
  if (chance(0.5)) s.node('rect', { x: 0, y: 0, width: ctx.W, height: ctx.H, fill: bg });
  const stype = pick(['oval', 'oval', 'tear', 'diamond', 'hex']);
  const cols = ri(4, 9), sw = ctx.W / cols, sh = sw * rand(1.4, 2.0), hh = sh / 2;
  const hw = sw * (stype === 'diamond' || stype === 'hex' ? .62 : .55);
  const mode = pick(['solid', 'ring', 'ring', 'target', 'target', 'nested', 'dot']);
  const mp = [...new Set([bg, ...shuffle(cs)])].slice(0, 4);
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const roundPoly = pts => { const n = pts.length, s0 = mid(pts[n - 1], pts[0]); let d = `M ${f(s0[0])} ${f(s0[1])}`; for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); d += ` Q ${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`; } return d + ' Z'; };
  const path = (cx, cy, W, H) => {
    const t = cy - H, b = cy + H, l = cx - W, r = cx + W;
    if (stype === 'oval' || stype === 'tear') { const k = stype === 'tear' ? H * .03 : H * .2; return `M ${f(cx)} ${f(t)} C ${f(cx + W)} ${f(t + k)} ${f(cx + W)} ${f(b - k)} ${f(cx)} ${f(b)} C ${f(cx - W)} ${f(b - k)} ${f(cx - W)} ${f(t + k)} ${f(cx)} ${f(t)} Z`; }
    if (stype === 'diamond') return roundPoly([[cx, t], [r, cy], [cx, b], [l, cy]]);
    const e = H * .42; return roundPoly([[cx, t], [r, cy - e], [r, cy + e], [cx, b], [l, cy + e], [l, cy - e]]);
  };
  const cc = (x, y, rr, fill) => s.node('circle', { cx: f(x), cy: f(y), r: f(Math.max(.5, rr)), fill });
  const shape = (cx, cy, col) => {
    s.node('path', { d: path(cx, cy, hw, hh), fill: col });
    if (mode === 'ring') { s.node('path', { d: path(cx, cy, hw * .66, hh * .66), fill: mp[1] }); s.node('path', { d: path(cx, cy, hw * .36, hh * .36), fill: col }); if (chance(.7)) cc(cx, cy, hw * .16, mp[2] || bg); }
    else if (mode === 'target') { const n = ri(3, 5); for (let k = 0; k < n; k++) cc(cx, cy, hw * .58 * (1 - k / n), mp[k % mp.length]); }
    else if (mode === 'nested') { [.7, .46, .24].forEach((v, k) => s.node('path', { d: path(cx, cy, hw * v, hh * v), fill: mp[(k + 1) % mp.length] })); }
    else if (mode === 'dot') { cc(cx, cy, hw * .3, mp[1]); if (chance(.6)) cc(cx, cy, hw * .13, mp[2] || bg); }
  };
  for (let i = -1; i <= cols; i++) {
    const cx = (i + .5) * sw, colColor = cs[((i % cs.length) + cs.length) % cs.length], off = i % 2 ? sh / 2 : 0;
    for (let cy = off - sh; cy < ctx.H + sh; cy += sh) shape(cx, cy, colColor);
  }
}
