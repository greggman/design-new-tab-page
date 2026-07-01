import { ctx, ri, rand, shuffle, pick, chance, box, mix, group, CLIPS } from '../utils.js';
// Sierpiński: a self-similar fractal — either the triangle gasket or the square carpet. The whole
// figure is then framed by a random zoom / rotation / off-centre pan so each render shows a different
// slice of the fractal instead of the same centred image.

// Transform for the wrapping group: map a focal point of the figure onto a near-centre screen point at
// a random zoom & rotation (origin is the group's 0,0 corner). Occasionally the plain centred view.
function frameT(cx, cy, ext) {
  if (chance(.16)) return 'translate(0px,0px)';
  const zoom = chance(.72) ? rand(1.15, 2.9) : 1;
  const rot = chance(.55) ? (chance(.7) ? rand(-33, 33) : pick([90, 180, 270])) : 0;
  const fx = cx + rand(-.45, .45) * ext, fy = cy + rand(-.45, .45) * ext;
  const tgx = ctx.W * rand(.4, .6), tgy = ctx.H * rand(.4, .6);
  const r = rot * Math.PI / 180, co = Math.cos(r), si = Math.sin(r);
  const mfx = (fx * co - fy * si) * zoom, mfy = (fx * si + fy * co) * zoom;
  return `translate(${(tgx - mfx).toFixed(1)}px,${(tgy - mfy).toFixed(1)}px) rotate(${rot}deg) scale(${zoom.toFixed(3)})`;
}

export default function sierpinski() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const carpet = chance(.35);
  const grad = chance(.55);
  const colorAt = (x, y) => grad ? mix(cs[0], cs[cs.length - 1], (x / ctx.W + y / ctx.H) / 2) : pick(cs);
  const base = Math.min(ctx.W, ctx.H);
  group({ transform: frameT(ctx.W / 2, ctx.H / 2, base * .5), transformOrigin: '0px 0px' }, null, null, () => {
    if (carpet) {
      const depth = ri(2, 3), S = base * rand(.8, .95);
      const rec = (x, y, s, d) => {
        if (d === 0) { box({ x, y, w: s * .98, h: s * .98, color: colorAt(x, y) }); return; }
        const ns = s / 3;
        for (let iy = -1; iy <= 1; iy++) for (let ix = -1; ix <= 1; ix++) if (ix || iy) rec(x + ix * ns, y + iy * ns, ns, d - 1);
      };
      rec(ctx.W / 2, ctx.H / 2, S, depth);
    } else {
      const depth = ri(4, 5), S = base * rand(.82, .96), flip = chance(.5) ? 1 : -1;
      const rec = (x, y, s, d) => {
        const hh = s * 0.866;
        if (d === 0) { box({ x, y, w: s, h: hh, clip: CLIPS.triangle, rot: flip < 0 ? 180 : 0, color: colorAt(x, y) }); return; }
        const ns = s / 2, nh = hh / 2;
        rec(x, y - flip * nh / 2, ns, d - 1);
        rec(x - ns / 2, y + flip * nh / 2, ns, d - 1);
        rec(x + ns / 2, y + flip * nh / 2, ns, d - 1);
      };
      rec(ctx.W / 2, ctx.H / 2, S, depth);
    }
  });
}
