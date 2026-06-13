import { ctx, ri, rand, times, shuffle, pick, choice, shape, stripe, circle, line, chance, blendMode } from '../utils.js';
// Memphis: 80s postmodern play — bold scattered forms, a hatched patch, a zigzag, and dot clusters.
// Deliberate clash held together by a tight palette and lots of breathing room.
export default function memphis() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  times(ri(6, 11), () => shape(rand(.1, .9) * ctx.W, rand(.1, .9) * ctx.H, ctx.S * rand(.06, .16), cs, { kind: pick(['triangle', 'circle', 'diamond', 'half', 'cross', 'star', 'kite']), color: pick(cs), rot: choice([0, 15, 30, 45, 90, 180]), blend: chance(.25) ? blendMode() : null }));
  stripe({ x: rand(.2, .8) * ctx.W, y: rand(.2, .8) * ctx.H, w: ctx.S * rand(.16, .3), h: ctx.S * rand(.16, .3), rot: choice([0, 45, 90]), color: pick(cs), lw: ri(6, 12), gap: ri(6, 12) });
  times(ri(6, 14), () => { const d = ctx.S * rand(.01, .03); circle({ x: rand(0, 1) * ctx.W, y: rand(0, 1) * ctx.H, w: d, h: d, color: pick(cs), z: 4 }); });
  let px = rand(.1, .4) * ctx.W, py = rand(.3, .7) * ctx.H, step = ctx.S * rand(.04, .07), zc = ctx.P.accent;
  times(ri(4, 8), k => { const x = px + step, y = py + (k % 2 ? step : -step); line({ x: (px + x) / 2, y: (py + y) / 2, len: Math.hypot(step, step) + 2, rot: Math.atan2(y - py, x - px) * 57.2958, thick: ctx.S * rand(.008, .015), color: zc, z: 5 }); px = x; py = y; });
}
