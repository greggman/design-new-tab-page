import { ctx, ri, rand, times, shuffle, circle, box, chance, pick, mix } from '../utils.js';
// Polka dots: a uniform hex-offset dot grid on a flat color field. The classic — even spacing and
// one or two colors make a calm, confident texture.
export default function polkaDots() {
  const cols = ri(5, 11), cw = ctx.W / cols, rows = Math.ceil(ctx.H / cw) + 1, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const d = cw * rand(.32, .56), two = chance(.45), field = chance(.6);
  if (field) box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: mix(cs[0], ctx.P.bg, .25), z: -1 });
  const dot = field ? cs[1 % cs.length] : cs[0];
  times(rows, r => times(cols + 1, c => {
    const x = c * cw + (r % 2 ? cw / 2 : 0), y = (r + .5) * cw;
    circle({ x, y, w: d, h: d, color: two ? cs[(r + c) % cs.length] : dot });
  }));
}
