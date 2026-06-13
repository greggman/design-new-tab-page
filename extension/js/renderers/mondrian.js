import { ctx, times, ri, shuffle, pick, box, rand, chance } from '../utils.js';
export default function mondrian() {
  let rects = [{ x: 0, y: 0, w: ctx.W, h: ctx.H }];
  times(ri(5, 9), () => {
    rects.sort((a, b) => b.w * b.h - a.w * a.h);
    const R = rects.splice(ri(0, Math.min(2, rects.length - 1)), 1)[0];
    if (R.w < ctx.S * .18 && R.h < ctx.S * .18) { rects.push(R); return; }
    if (R.w >= R.h) { const p = rand(.35, .65) * R.w; rects.push({ x: R.x, y: R.y, w: p, h: R.h }, { x: R.x + p, y: R.y, w: R.w - p, h: R.h }); }
    else { const p = rand(.35, .65) * R.h; rects.push({ x: R.x, y: R.y, w: R.w, h: p }, { x: R.x, y: R.y + p, w: R.w, h: R.h - p }); }
  });
  const fills = shuffle([...ctx.POOL, ctx.P.accent]), lw = Math.max(3, ctx.S * rand(.008, .016));
  rects.forEach(R => box({ x: R.x + R.w / 2, y: R.y + R.h / 2, w: R.w, h: R.h, color: chance(.5) ? pick(fills) : ctx.P.bg, border: `${lw}px solid ${ctx.P.ink}` }));
}
