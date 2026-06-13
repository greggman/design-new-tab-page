import { ctx, rand, ri, times, shuffle, circle, el, mix, pick, chance } from '../utils.js';
// Galaxy: logarithmic spiral arms of stars, denser and brighter toward a glowing core, over a faint
// scatter of field stars. The swept arms plus a luminous center make a deep, dimensional spiral.
export default function galaxy() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]), cx = ctx.W / 2 + rand(-.08, .08) * ctx.W, cy = ctx.H / 2 + rand(-.08, .08) * ctx.H;
  const arms = pick([2, 2, 3, 4]), per = ri(60, 120), maxR = ctx.S * rand(.42, .6), twist = rand(2.5, 5) * (chance(.5) ? 1 : -1);
  times(ri(30, 60), () => { const d = ctx.S * rand(.003, .01) * 2; circle({ x: rand(0, 1) * ctx.W, y: rand(0, 1) * ctx.H, w: d, h: d, color: mix(ctx.P.ink, ctx.P.bg, .45), z: 0 }); });
  times(arms, a => { const a0 = a / arms * Math.PI * 2; times(per, i => {
    const t = i / per, rad = maxR * t, spread = (1 - t) * ctx.S * .03;
    const ang = a0 + t * twist * Math.PI * 2 + rand(-.12, .12);
    const x = cx + Math.cos(ang) * rad + rand(-spread, spread), y = cy + Math.sin(ang) * rad + rand(-spread, spread);
    const sz = ctx.S * (.004 + (1 - t) * .013) * 2;
    circle({ x, y, w: sz, h: sz, color: mix(ctx.P.accent, cs[i % cs.length], t), z: 1 });
  }); });
  const g = ctx.S * rand(.2, .34);
  el({ left: cx + 'px', top: cy + 'px', width: g + 'px', height: g + 'px', borderRadius: '50%', background: `radial-gradient(circle, ${mix(ctx.P.accent, '#ffffff', .4)} 0%, transparent 62%)`, mixBlendMode: 'screen', zIndex: 3 }, 'translate(-50%,-50%) scale(.6)', 'translate(-50%,-50%)');
}
