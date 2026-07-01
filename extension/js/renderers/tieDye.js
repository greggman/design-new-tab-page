import { ctx, ri, rand, times, shuffle, chance, el, mix } from '../utils.js';
// Tie-dye: a spiral of colour wound from a focal point (conic gradient) plus a few concentric bleed
// rings, the classic swirl.
export default function tieDye() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const fx = rand(.35, .65) * ctx.W, fy = rand(.35, .65) * ctx.H, span = Math.hypot(ctx.W, ctx.H) * 1.3;
  const arms = ri(5, 9), turns = ri(2, 4);
  // conic sweep repeated a few times to make the pinwheel of colour
  const stops = [];
  const seg = 360 / arms;
  times(arms, i => { const a = i * seg, c = cs[i % cs.length]; stops.push(`${c} ${a}deg ${a + seg}deg`); });
  el({ left: fx + 'px', top: fy + 'px', width: span + 'px', height: span + 'px', borderRadius: '50%',
    background: `conic-gradient(from ${rand(0, 360)}deg, ${stops.join(',')})`, filter: `blur(${ctx.S * .022}px)`, zIndex: -2 },
    'translate(-50%,-50%) scale(.6)', `translate(-50%,-50%) rotate(${rand(-20, 20)}deg)`);
  // spiral pull: overlay faint rotated rings to suggest the wound cloth
  times(turns * arms, i => {
    const rr = span * .5 * (i + 1) / (turns * arms);
    el({ left: fx + 'px', top: fy + 'px', width: rr * 2 + 'px', height: rr * 2 + 'px', borderRadius: '50%',
      border: `${ctx.S * rand(.04, .01)}px solid ${mix(cs[i % cs.length], ctx.P.bg, .35)}`, opacity: .35, zIndex: 1 },
      'translate(-50%,-50%) scale(.7)', 'translate(-50%,-50%)');
  });
}
