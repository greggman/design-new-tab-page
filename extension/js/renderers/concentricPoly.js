import { ctx, ri, rand, shuffle, pick, chance, box, svgRoot, mix } from '../utils.js';
// Concentric polygon line-art: a tiling of nested regular-polygon outlines (hexagons on a hex grid, or
// diamonds/squares/triangles on a square grid) — clean stroked line-work. SVG.
function pts(cx, cy, r, sides, rot) {
  let p = [];
  for (let i = 0; i < sides; i++) { const a = rot + i / sides * 2 * Math.PI; p.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`); }
  return p.join(' ');
}
export default function concentricPoly() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const bg = chance(.55) ? mix(ctx.P.bg, '#ffffff', ctx.P.dark ? .04 : .3) : mix(ctx.P.ink, ctx.P.bg, .12);
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: bg, z: -2 });
  const shape = pick(['hex', 'hex', 'diamond', 'square', 'tri']);
  const sides = { hex: 6, diamond: 4, square: 4, tri: 3 }[shape];
  const rot = { hex: -Math.PI / 2, diamond: 0, square: Math.PI / 4, tri: -Math.PI / 2 }[shape];
  const R = Math.min(ctx.W, ctx.H) * rand(.07, .14), rings = ri(3, 7), sw = Math.max(1, R * rand(.04, .08));
  const twoTone = chance(.4), c0 = pick(cs), c1 = cs.find(c => c !== c0) || ctx.P.accent, s = svgRoot();
  const tile = (cx, cy) => { for (let k = 1; k <= rings; k++) s.node('polygon', { points: pts(cx, cy, R * k / rings, sides, rot), fill: 'none', stroke: twoTone ? (k % 2 ? c0 : c1) : c0, 'stroke-width': sw }); };
  if (shape === 'hex') {
    const w = Math.sqrt(3) * R, h = 1.5 * R;
    for (let row = 0, y = 0; y < ctx.H + R; y += h, row++) { const ox = row % 2 ? w / 2 : 0; for (let x = -w; x < ctx.W + w; x += w) tile(x + ox, y); }
  } else {
    const step = R * (shape === 'tri' ? 1.5 : 1.9), off = shape === 'diamond';
    for (let row = 0, y = 0; y < ctx.H + step; y += step, row++) { const ox = off && row % 2 ? step / 2 : 0; for (let x = -step; x < ctx.W + step; x += step) tile(x + ox, y); }
  }
}
