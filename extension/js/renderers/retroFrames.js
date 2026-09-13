import { ctx, ri, rand, times, pick, chance, el, box, groundScheme } from '../utils.js';
// Retro frames: a dense scatter of rounded-rectangle frames (somewhere between a rounded rect and an
// oval), each an outline whose hole is offset — the four border widths differ, so the frame is thicker
// on some sides than others. Transparent centres let overlapping frames show through. 1960s mod look.
function frame(cx, cy, w, h, rot, col, base) {
  const bw = () => (base * rand(.4, 1.7)).toFixed(1) + 'px';
  el({ left: cx + 'px', top: cy + 'px', width: w + 'px', height: h + 'px', boxSizing: 'border-box', background: 'transparent',
    borderStyle: 'solid', borderColor: col, borderTopWidth: bw(), borderRightWidth: bw(), borderBottomWidth: bw(), borderLeftWidth: bw(),
    borderRadius: (Math.min(w, h) * rand(.2, .5)).toFixed(1) + 'px' },
    `translate(-50%,-50%) rotate(${rot}deg) scale(.85)`, `translate(-50%,-50%) rotate(${rot}deg)`);
}
export default function retroFrames() {
  // Any palette hue at any lightness for the ground, frame colours made to read against it. This used to be
  // "the lighter of bg and ink", so every Retro frames was a cream design.
  const { fg: cs } = groundScheme();
  times(ri(45, 95), () => {
    const w = ctx.S * rand(.09, .3), h = w * rand(.5, 1.5), cx = rand(-.05, 1.05) * ctx.W, cy = rand(-.05, 1.05) * ctx.H;
    const rot = 0/*chance(.55) ? rand(-24, 24) : 0*/, col = pick(cs);
    if (chance(.86)) frame(cx, cy, w, h, rot, col, Math.min(w, h) * rand(.06, .17));
    else box({ x: cx, y: cy, w: w * rand(.3, .6), h: h * rand(.3, .6), color: col, radius: (Math.min(w, h) * rand(.1, .4)).toFixed(1) + 'px', rot });  // solid accent
  });
}
