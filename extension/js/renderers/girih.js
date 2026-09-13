import { ctx, ri, rand, pick, chance, box, mix, group, groundScheme, readable, oneSide, grid } from '../utils.js';
// Girih / Islamic star: an N-fold star-and-cross lattice. Varies by star symmetry (6/8/10/12-point),
// square vs offset grid, filled vs strapwork (outlined) style, connector motif, colouring, and an
// overall rotation — so it's a family of patterns, not one fixed tile.

// clip-path for an N-point star inscribed in the element box (outer radius = half the box).
function starPoly(n, inner) {
  const pts = [];
  for (let i = 0; i < 2 * n; i++) {
    const a = i / (2 * n) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? inner : 0.5;
    pts.push(`${(50 + rr * Math.cos(a) * 100).toFixed(1)}% ${(50 + rr * Math.sin(a) * 100).toFixed(1)}%`);
  }
  return 'polygon(' + pts.join(',') + ')';
}

export default function girih() {
  const N = pick([6, 8, 8, 10, 12]);
  const inner = { 6: .30, 8: .22, 10: .19, 12: .17 }[N] * rand(.9, 1.15);
  const star = starPoly(N, inner);
  const cells = ri(3, 6), c = Math.min(ctx.W, ctx.H) / cells;
  const offset = chance(.4), strap = chance(.4), rot = chance(.6) ? rand(0, 90) : 0;
  const conn = pick(['square', 'square', 'star', 'none']);
  const cmode = pick(['cycle', 'two', 'radial', 'grad']);
  // The ground is any palette hue at any lightness (it used to be bg, or bg a hair toward ink — so every pattern
  // came out as a light version or a dark one). The strapwork hollows are cut in the same colour. The two
  // gradient modes mix between colours, so those go to one side of the ground's lightness — see oneSide().
  const { ground, fg } = groundScheme();
  const cs = cmode === 'radial' || cmode === 'grad' ? oneSide(fg, ground) : fg;
  const a = cs[0], b = cs[1];
  const accent = readable([ctx.P.accent], ground)[0];
  const cx = ctx.W / 2, cy = ctx.H / 2, maxR = Math.hypot(ctx.W, ctx.H) / 2;
  const colorFn = (x, y, i) => cmode === 'two' ? (i % 2 ? a : b)
    : cmode === 'radial' ? mix(cs[0], cs[cs.length - 1], Math.hypot(x - cx, y - cy) / maxR)
    : cmode === 'grad' ? mix(cs[0], cs[cs.length - 1], x / ctx.W)
    : cs[i % cs.length];

  const draw = () => {
    const L = rot ? Math.hypot(ctx.W, ctx.H) * 1.16 : 0;
    const x0 = rot ? cx - L / 2 : 0, y0 = rot ? cy - L / 2 : 0;
    const cols = Math.ceil((rot ? L : ctx.W) / c) + 1, rows = Math.ceil((rot ? L : ctx.H) / c) + 1;
    grid(cols, rows, (cc, r) => {
      const x = x0 + cc * c + (offset && r % 2 ? c / 2 : 0), y = y0 + r * c, col = colorFn(x, y, r + cc);
      box({ x, y, w: c * .96, h: c * .96, color: col, clip: star });
      if (strap) box({ x, y, w: c * .96 * rand(.55, .72), h: c * .96 * rand(.55, .72), color: ground, clip: star });   // hollow → outline strap
      if (conn === 'square') box({ x: x + c / 2, y: y + c / 2, w: c * .32, h: c * .32, rot: 45, color: readable([mix(col, accent, .5)], ground)[0] });
      else if (conn === 'star') box({ x: x + c / 2, y: y + c / 2, w: c * .44, h: c * .44, color: accent, clip: star });
    });
  };
  if (rot) group({ transform: `translate(${cx}px,${cy}px) rotate(${rot}deg) translate(${-cx}px,${-cy}px)`, transformOrigin: '0px 0px' }, null, null, draw);
  else draw();
}
