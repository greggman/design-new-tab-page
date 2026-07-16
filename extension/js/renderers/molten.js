import { ctx, ri, rand, shuffle, chance, svgRoot } from '../utils.js';
// Molten: twisted waves of solid colour. Plain solid bands are warped by an SVG turbulence displacement
// map, so the straight edges fold and swirl into flowing, marbled liquid ribbons. The bands are drawn
// oversized so the displacement never exposes the canvas edge.
let uid = 0;
export default function molten() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent, ctx.P.ink]);
  const s = svgRoot(), f = v => (+v).toFixed(1);
  const scale = Math.min(ctx.W, ctx.H) * rand(.3, .6), bf = rand(.006, .018), id = 'mt' + uid++;
  const filt = s.node('filter', { id, x: '-30%', y: '-30%', width: '160%', height: '160%', 'color-interpolation-filters': 'sRGB' });
  s.node('feTurbulence', { type: chance(.5) ? 'turbulence' : 'fractalNoise', baseFrequency: `${bf.toFixed(4)} ${(bf * rand(.6, 1.5)).toFixed(4)}`, numOctaves: ri(2, 4), seed: ri(0, 999), result: 'n' }, filt);
  s.node('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: f(scale), xChannelSelector: 'R', yChannelSelector: 'G' }, filt);
  const g = s.node('g', { filter: `url(#${id})` });
  const N = ri(8, 16), bh = (ctx.H + 2 * scale) / N;
  let y = -scale, i = 0;
  while (y < ctx.H + scale) {
    const h = bh * rand(.6, 1.5);
    s.node('rect', { x: f(-scale), y: f(y), width: f(ctx.W + 2 * scale), height: f(h + 1), fill: cs[i % cs.length] }, g);
    y += h; i++;
  }
}
