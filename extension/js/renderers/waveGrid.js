import { ctx, ri, rand, mix, times, pick, shape, choice, shuffle, chance } from '../utils.js';
export default function waveGrid() {
  const rows = ri(4, 8), cols = ri(6, 14), cs = shuffle([...ctx.POOL, ctx.P.accent]), amp = ctx.H * rand(.03, .08), freq = rand(1, 3), cw = ctx.W / cols, ch = ctx.H / rows, k = pick(['circle', 'diamond', 'square', 'triangle', 'half']);
  times(rows, r => times(cols, c => {
    const x = (c + .5) * cw, y = (r + .5) * ch + Math.sin(c / cols * freq * Math.PI * 2 + r * .6) * amp;
    const col = chance(.5) ? mix(cs[r % cs.length], cs[(r + 1) % cs.length], c / cols) : pick(cs);
    shape(x, y, Math.min(cw, ch) * rand(.5, .82), ctx.POOL, { kind: k, color: col, rot: choice([0, 45, 90]) });
  }));
}
