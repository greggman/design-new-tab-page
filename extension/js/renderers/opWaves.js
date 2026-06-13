import { ctx, rand, ri, shuffle, circle, mix, chance, choice } from '../utils.js';
// Op waves: concentric bands whose widths swell and shrink by a sine of the radius, so a flat target
// appears to pulse and bulge. Bridget-Riley op-art rendered as a hypnotic rave-floor ring pattern.
export default function opWaves() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), a = cs[0], b = cs[1] || mix(a, ctx.P.bg, .5);
  const cx = ctx.W / 2 + (chance(.5) ? rand(-.2, .2) * ctx.W : 0), cy = ctx.H / 2 + (chance(.5) ? rand(-.2, .2) * ctx.H : 0);
  const maxR = Math.hypot(Math.max(cx, ctx.W - cx), Math.max(cy, ctx.H - cy)) * 1.05;
  const baseW = ctx.S * rand(.02, .035), amp = baseW * rand(.45, .85), freq = rand(2, 5);
  const radii = []; let r = baseW;
  while (r < maxR && radii.length < 200) { radii.push(r); r += Math.max(baseW * .35, baseW + amp * Math.sin(r / maxR * freq * Math.PI * 2)); }
  for (let k = radii.length - 1; k >= 0; k--) circle({ x: cx, y: cy, w: radii[k] * 2, h: radii[k] * 2, color: k % 2 ? a : b, z: radii.length - k });
}
