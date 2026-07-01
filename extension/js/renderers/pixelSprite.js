import { ctx, ri, rand, times, shuffle, pick, chance, box, mix } from '../utils.js';
// Pixel sprite: a symmetric 8-bit "invader" — a random on/off pattern on the left half mirrored to the
// right, tiled a few times across the canvas.
export default function pixelSprite() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const reps = ri(1, 4), pad = 1;
  const gw = ri(5, 9) | 1, gh = ri(6, 10);            // odd width so it mirrors cleanly
  const cellPx = Math.min(ctx.W / reps, ctx.H) * rand(.6, .85) / Math.max(gw, gh);
  const spriteW = gw * cellPx, gap = (ctx.W - reps * spriteW) / (reps + 1);
  const h = ri(1, 3);
  const sh = gh * cellPx;
  times(reps, rep => {
    const rh = rep % h;
    const rhh = rh == 2 ? -1 : rh;
    const col = pick(cs), ox = gap + rep * (spriteW + gap), oy = (ctx.H - sh) / 2 + rhh * (sh / h);
    const half = Math.ceil(gw / 2), grid = [];
    for (let y = 0; y < gh; y++) { grid[y] = []; for (let x = 0; x < half; x++) grid[y][x] = chance(.5); }
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const on = grid[y][x < half ? x : gw - 1 - x];
      if (on) box({ x: ox + (x + .5) * cellPx, y: oy + (y + .5) * cellPx, w: cellPx - pad, h: cellPx - pad, color: col });
    }
  });
}
