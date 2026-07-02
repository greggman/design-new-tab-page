import { ctx, ri, rand, shuffle, pick, chance, box, mix } from '../utils.js';
// Coin stacks: a receding field of stacks, each a pillar of individual coins. A coin = a face ellipse
// over a slightly-lower rim ellipse (darker), so a thin dark crescent shows between coins — the
// horizontal banding that reads as stacked discs. One colour per stack; laid out in staggered rows
// drawn back-to-front and grown toward the viewer for perspective.
function stack(x, baseY, rx, ry, t, n, main, z) {
  const rim = mix(main, ctx.P.ink, .4);
  for (let i = 0; i < n; i++) {                          // bottom → top, upper coins paint over lower
    const xo = rand(-10, 10);
    const cy = baseY - i * t;
    box({ x: x + xo, y: cy, w: rx * 2, h: ry * 2, color: rim, radius: '50%', z: z + i * 2 });          // rim (shows as crescent)
    box({ x: x + xo, y: cy - t * .5, w: rx * 2, h: ry * 2, color: main, radius: '50%', z: z + i * 2 + 1 }); // coin face
  }
  const topY = baseY - (n - 1) * t - t * .5;
  box({ x: x - rx * .26, y: topY - ry * .24, w: rx * .7, h: ry * .7, color: mix(main, '#ffffff', .42), radius: '50%', opacity: .4, z: z + n * 2 });
}
export default function coinStacks() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const cols = ri(5, 7), cw = ctx.W / cols, persp = chance(.8);
  let y = ctx.H * -.05, row = 0;
  while (y < ctx.H * 1.25) {
    const scale = persp ? .55 + .7 * (y / ctx.H) : 1;
    const rx = cw * .44 * scale, ry = rx * rand(.28, .34), t = ry * rand(.5, .85), n = ri(5, 12), off = row % 2 ? cw / 2 : 0;
    for (let c = -1; c <= cols; c++) stack(c * cw + cw / 2 + off + rand(-.05, .05) * cw, y + ri(0, 20), rx, ry, t, ri(3, 12), pick(cs), row * 100);
    y += ry * rand(4.5, 6.5); row++;
  }
}
