import { ctx, rand, ri, pick, chance, shuffle, svgRoot, groundScheme, rrange, hexToOklch, oklchToHex } from '../utils.js';
// Kilim (the "Aztec" / Navajo eye-dazzler look): a field of triangles on a lattice stretched so each up/down
// pair makes a diamond, coloured by distance — concentric diamond rings around a lattice of centres.
//
// Distance is measured in triangle steps with the diamond (L1) metric, whose level lines run along the
// triangle edges, so every ring is a clean stepped diamond. Centres sit on a centred-rectangular lattice (a
// main centre, and a secondary one in each gap); turned 45°, that lattice is square, so the nearest centre and
// its distance come straight from rounding. Main and secondary centres use their own colour sequences. Within
// a ring the up and down triangles take a light and a dark tone of the ring's colour — the faceted sparkle. Occasional black/white rings separate the colour bands.
//
// Triangles are merged into one path per (ring, centre type, tone), so thousands of triangles are ~100 nodes,
// and the rings reveal in order from the centres out (or in).

const f1 = v => v.toFixed(1);

export default function kilim() {
  const { ground, fg, ink } = groundScheme();
  const { W, H, S } = ctx, svg = svgRoot();
  // Half the time the whole weave is turned 90°: laid out over the swapped extents around the same centre, in a
  // rotated group (the group carries the rotation; the paths' own fade-in animation can't override it).
  const turned = chance(.5), [GW, GH] = turned ? [H, W] : [W, H];
  const g = turned ? svg.node('g', { transform: `rotate(90 ${f1(W / 2)} ${f1(H / 2)})` }) : svg;
  // Where the centre sits: in the middle of a diamond (two triangles back to back), or on the vertex where four
  // diamonds meet (two triangles tip to tip) — a half-cell offset of the ring centres.
  const off = globalThis.__mode === "tip" ? .5 : globalThis.__mode === "back" ? 0 : chance(.5) ? .5 : 0;
  const b = S * rand(.028, .045), h = b * rand(.55, .8), half = b / 2;   // triangle base and height
  const ringW = pick([1, 1, 1, 2]), M = 2 * ringW * ri(3, 6);   // ring width, centre spacing (in diamonds)

  // tones: lighter/darker versions of a colour at the same hue
  const tone = (c, dl) => { const [Lc, C, Hh] = hexToOklch(c); return oklchToHex(Math.min(.97, Math.max(.08, Lc + dl)), C, Hh); };
  const all = shuffle([...new Set([...fg, ink, ground])]);
  const seq = () => {
    const s = shuffle(all).slice(0, ri(3, Math.min(6, all.length)));
    if (chance(.6)) s.splice(ri(1, s.length), 0, pick([ink, ground]));   // a separator ring
    return s;
  };
  const seqs = [seq(), seq()], contrast = rand(.1, .16);

  // grid aligned so a vertex sits at the canvas centre (a main centre)
  const kx0 = -Math.ceil(GW / 2 / half) - 2, ry0 = -Math.ceil(GH / 2 / h) - 1;
  const paths = new Map();   // ring -> Map(color -> d)
  for (let r = ry0; r * h < GH / 2 + h; r++) {
    const y0 = H / 2 + r * h, y1 = y0 + h;
    for (let k = kx0; k * half < GW / 2 + b; k++) {
      const x0 = W / 2 + k * half, up = ((k + r) % 2 + 2) % 2 === 0;
      const cy = up ? y0 + h * 2 / 3 : y0 + h / 3, cx = x0 + half;
      // Diamond coordinates: triangle edges lie on the lines u+v = odd and u−v = odd (u in half-bases, v in rows
      // from the centre), so flooring the centroid's (u+v, u−v) into bands of 2 gives the diamond cell — an up and
      // a down triangle sharing their base. Centres sit at every multiple of M in both, alternating main/secondary;
      // the ring is the L∞ distance in that frame, which is the diamond (L1) distance on screen.
      const u = (cx - W / 2) / half, v = (cy - H / 2) / h;
      const A = Math.floor((u + v + 1) / 2) + off, C = Math.floor((u - v + 1) / 2) + off;
      const ia = Math.round(A / M), ic = Math.round(C / M), dA = A - ia * M, dC = C - ic * M;
      const ring = Math.floor(Math.max(Math.abs(dA), Math.abs(dC)) / ringW), type = ((ia + ic) % 2 + 2) % 2;
      const s = seqs[type], base = s[ring % s.length];
      // the top and bottom halves of each diamond take the light and dark tone
      const col = tone(base, up ? contrast : -contrast);
      const tri = up ? `M${f1(x0)} ${f1(y1)}L${f1(x0 + b)} ${f1(y1)}L${f1(x0 + half)} ${f1(y0)}Z` : `M${f1(x0)} ${f1(y0)}L${f1(x0 + b)} ${f1(y0)}L${f1(x0 + half)} ${f1(y1)}Z`;
      if (!paths.has(ring)) paths.set(ring, new Map());
      const m = paths.get(ring); m.set(col, (m.get(col) ?? '') + tri);
    }
  }
  const rings = [...paths.keys()].sort((p, q) => p - q);
  rrange(0, rings.length, i => {
    // a hairline stroke in the fill colour closes the antialiasing seams between neighbouring triangles
    for (const [col, d] of paths.get(rings[i])) svg.node('path', { d, fill: col, stroke: col, 'stroke-width': .8, 'stroke-linejoin': 'round' }, g);
  }, { order: pick(['forward', 'forward', 'backward']), dur: 1 });
}
