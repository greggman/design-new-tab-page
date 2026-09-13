import { ctx, ri, clamp, shuffle, box, mix, pick, chance, labDist, readable, grid } from '../utils.js';
// Windmill tiles: each grid cell split into triangles meeting at the center, colored in two tones.
//
// Per-cell colours: four triangles, a two-tone X that changes colour tile to tile, so each tile reads on its own.
// Two colours for the whole field: the same four-triangle X can't do it — every tile's triangle meets an
// identically coloured one across the seam, and the field fuses into a plain diamond lattice. So that mode is
// a true pinwheel: eight wedges alternating round the centre. Alternating wedges have a handedness, which is
// what makes them spin, and seams no longer line up like colours. `mirror` flips the handedness on every other
// tile, which fuses neighbouring wedges into larger blades that turn opposite ways.
const P = ['0 0', '50% 0', '100% 0', '100% 50%', '100% 100%', '50% 100%', '0 100%', '0 50%'];
const WEDGES = P.map((p, k) => `polygon(${p},${P[(k + 1) % 8]},50% 50%)`);
// The four blades as clip paths on the CELL's own box — top, right, bottom, left, all meeting at the centre — so a
// tile covers exactly its cell at any aspect. (A rotated triangle on a square of side max(cw, ch) spilled into the
// neighbours on non-square cells.)
const BLADES = ['polygon(0 0,100% 0,50% 50%)', 'polygon(100% 0,100% 100%,50% 50%)', 'polygon(100% 100%,0 100%,50% 50%)', 'polygon(0 100%,0 0,50% 50%)'];
export default function windmillTiles() {
  const cols = ri(3, 7), rows = clamp(Math.round(cols * ctx.H / ctx.W), 2, 7), cw = ctx.W / cols, ch = ctx.H / rows, cs = shuffle([...ctx.POOL, ctx.P.accent]);
  if (chance(.4)) {
    // The pair is the whole design, so it has to be far apart: the first pair that clears the bar, else push one away.
    const pairs = cs.flatMap((x, i) => cs.slice(i + 1).map(y => [x, y]));
    let [ua, ub] = pairs.find(([x, y]) => labDist(x, y) >= .3) ?? [cs[0], cs[1] ?? ctx.P.ink];
    if (labDist(ua, ub) < .3) ub = readable([ub], ua, .3)[0];
    const mirror = chance(.5);
    grid(cols, rows, (c, r) => {
      const flip = mirror && (c + r) % 2;
      WEDGES.forEach((clip, k) => box({ x: (c + .5) * cw, y: (r + .5) * ch, w: cw + 1, h: ch + 1, color: (k + flip) % 2 ? ua : ub, clip }));
    });
    return;
  }
  grid(cols, rows, (c, r) => {
    const x = (c + .5) * cw, y = (r + .5) * ch, a = pick(cs), b = mix(a, (c + r) % 2 ? ctx.P.bg : ctx.P.ink, .38);
    BLADES.forEach((clip, k) => box({ x, y, w: cw + 1, h: ch + 1, color: k % 2 ? a : b, clip }));
  });
}
