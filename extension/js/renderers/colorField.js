import { ctx, rand, ri, shuffle, el, bgFull, mix } from '../utils.js';
// Color field: two to four soft rectangles hovering on a stained ground, à la Rothko. Three things do the
// work, and the old version had none of them: the fields are separated by ground rather than stacked flush
// (touching bands read as a flag, not as forms floating in space), there's a margin on ALL four sides so the
// ground frames them, and each field is drawn twice — a large diffuse halo under a tighter core — which is
// what gives the edge that feathered glow instead of a crisp cut.
export default function colorField() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const n = ri(2, 4);
  // Stained ground, not the flat palette bg — the fields have to sit on something with colour in it.
  bgFull({ background: mix(cs[cs.length - 1], ctx.P.bg, rand(.42, .7)) });
  const mx = ctx.W * rand(.1, .18), my = ctx.H * rand(.07, .13);
  const gap = ctx.H * rand(.025, .055);
  let ws = Array.from({ length: n }, () => rand(.55, 1.5));
  const sum = ws.reduce((a, b) => a + b, 0), avail = ctx.H - 2 * my - gap * (n - 1);
  ws = ws.map(w => w / sum * avail);
  let p = my;
  ws.forEach((h, i) => {
    // Each field is inset slightly differently. Perfectly flush edges read as a printed stripe; a painting
    // has hand-placed rectangles that don't quite line up.
    const jx = ctx.W * rand(-.012, .012), x = mx + jx, w = ctx.W - 2 * mx - jx * 2 + ctx.W * rand(-.02, .01);
    const c = mix(cs[i % cs.length], ctx.P.bg, rand(.05, .2));
    const layer = (grow, blur, op) => el({
      left: (x - grow) + 'px', top: (p - grow) + 'px', width: (w + grow * 2) + 'px', height: (h + grow * 2) + 'px',
      background: c, filter: `blur(${blur.toFixed(1)}px)`, opacity: op,
    }, 'scale(.985)', 'none');
    layer(ctx.S * .022, ctx.S * rand(.028, .05), rand(.45, .68));   // diffuse halo
    layer(0, ctx.S * rand(.004, .009), rand(.9, 1));                // core
    p += h + gap;
  });
}
