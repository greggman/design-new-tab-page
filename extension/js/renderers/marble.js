import { ctx, ri, rand, times, shuffle, pick, el, line, mix, chance } from '../utils.js';
// Marble / liquid pour: big soft blurred blobs of colour layered over a ground, then a few fine veins
// threaded across — the look of poured paint or polished stone.
export default function marble() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  el({ left: 0, top: 0, width: ctx.W + 'px', height: ctx.H + 'px', background: mix(ctx.P.bg, cs[0], .12), zIndex: -3 }, null, null, false);
  const blobs = ri(7, 14);
  times(blobs, () => {
    const d = ctx.S * rand(.3, .8);
    el({ left: rand(0, 1) * ctx.W + 'px', top: rand(0, 1) * ctx.H + 'px', width: d + 'px', height: d * rand(.6, 1.4) + 'px',
      borderRadius: '50%', background: pick(cs), filter: `blur(${ctx.S * rand(.05, .1)}px)`, opacity: rand(.45, .8),
      mixBlendMode: ctx.P.dark ? 'screen' : 'multiply', zIndex: -2 }, 'scale(.7)', `rotate(${rand(0, 360)}deg)`);
  });
  // veins
  if (chance(.8)) times(ri(2, 5), () => {
    let x = rand(0, 1) * ctx.W, y = rand(0, 1) * ctx.H; const col = mix(ctx.P.ink, ctx.P.bg, rand(.2, .5)), th = ctx.S * rand(.002, .005);
    let ang = rand(0, 360);
    times(ri(8, 16), () => { const len = ctx.S * rand(.04, .09); const nx = x + Math.cos(ang * Math.PI / 180) * len, ny = y + Math.sin(ang * Math.PI / 180) * len;
      line({ x: (x + nx) / 2, y: (y + ny) / 2, len: len + th, rot: ang, thick: th, color: col, z: 3 }); x = nx; y = ny; ang += rand(-35, 35); });
  });
}
