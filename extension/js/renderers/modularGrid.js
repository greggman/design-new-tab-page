import { ctx, ri, rand, clamp, pick, choice, times, shuffle, mix, shape, rings, chance } from '../utils.js';
export default function modularGrid() {
  const cols = ri(3, 7), rows = clamp(Math.round(cols * ctx.H / ctx.W), 3, 8), cw = ctx.W / cols, ch = ctx.H / rows, fill = rand(0.62, 0.95);
  const policy = pick(['mixed', 'uniform', 'twoShape']), u = pick([...['triangle','diamond','pentagon','hexagon','octagon','star','cross','chevron','kite','parallelogram','trapezoid'],'circle','half','square']), u2 = pick(['triangle','diamond','pentagon','hexagon','octagon','star','cross','chevron','kite','parallelogram','trapezoid','circle','square']);
  const cpol = pick(['random', 'gradient', 'checker', 'mono']), mono = pick(ctx.POOL);
  const rsys = choice([0, 45, 'r15', 'inc']);
  const fc = chance(0.55) ? [ri(0, cols - 1), ri(0, rows - 1)] : null;
  times(rows, r => times(cols, c => {
    if (fc && c === fc[0] && r === fc[1]) return;
    if (Math.random() > fill) return;
    const x = (c + .5) * cw, y = (r + .5) * ch, sz = Math.min(cw, ch) * rand(0.62, 0.96);
    const col = cpol === 'mono' ? mono : cpol === 'gradient' ? mix(ctx.POOL[0], ctx.POOL[ctx.POOL.length - 1], (c / cols + r / rows) / 2) : cpol === 'checker' ? ctx.POOL[(c + r) % ctx.POOL.length] : pick(ctx.POOL);
    const rot = rsys === 'r15' ? choice([0, 15, 30, 45, 90]) : rsys === 'inc' ? (c + r) * 15 : rsys;
    shape(x, y, sz, ctx.POOL, { kind: policy === 'uniform' ? u : policy === 'twoShape' ? ((c + r) % 2 ? u : u2) : undefined, color: col, rot });
  }));
  if (fc) rings({ x: (fc[0] + .5) * cw, y: (fc[1] + .5) * ch, r: Math.min(cw, ch) * rand(.85, 1.1), colors: shuffle([ctx.P.accent, ...ctx.POOL]) });
}
