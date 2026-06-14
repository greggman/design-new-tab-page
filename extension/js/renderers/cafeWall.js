import { ctx, rand, ri, times, box, mix, contrastPair } from '../utils.js';
// Café wall illusion: rows of dark tiles on a light ground, each row shifted half a tile from the
// next, with a thin mid-gray mortar line between rows. The offsets + mortar make the rows look wedged
// even though every line is perfectly horizontal. Tile colors are a contrasting pair from the palette.
export default function cafeWall() {
  const [light, dark] = contrastPair([...ctx.POOL, ctx.P.accent]), mortar = mix(light, dark, .5);
  box({ x: ctx.W / 2, y: ctx.H / 2, w: ctx.W, h: ctx.H, color: light, z: -1 });
  const rows = ri(7, 14), rh = ctx.H / rows, cols = ri(6, 12), cw = ctx.W / cols, m = Math.max(1, ctx.S * .004);
  times(rows, r => {
    const off = (r % 2 ? cw * (.5 + rand(-.08, .08)) : 0);
    box({ x: ctx.W / 2, y: r * rh, w: ctx.W, h: m, color: mortar, z: 2 });
    times(cols + 2, c => box({ x: c * 2 * cw - off + cw / 2, y: (r + .5) * rh, w: cw, h: rh, color: dark, z: 1 }));
  });
  box({ x: ctx.W / 2, y: ctx.H, w: ctx.W, h: m, color: mortar, z: 2 });
}
