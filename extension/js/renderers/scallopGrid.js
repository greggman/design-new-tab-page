import { ctx, ri, rand, shuffle, pick, chance, box, bgFull, mix, lum } from '../utils.js';
// Scallop grid: overlapping rows of solid domes — a clamshell / fish-scale skin. Rows sit half a scale out
// of phase and are pitched closer together than a scale is tall, then drawn top-to-bottom so every row laps
// over the one above. That overlap is the whole trick: without it this is just a grid of half-discs with the
// ground showing through the gaps. (Seigaiha is the concentric-arc cousin; these scales are flat colour.)
export default function scallopGrid() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const cols = ri(4, 9), s = ctx.W / cols;                    // horizontal step between scale centres
  const h = s * rand(.55, .85), pr = rand(.5, .7), pitch = h * pr;   // pitch < h ⇒ rows overlap vertically
  // Neighbouring domes have to meet ABOVE the previous row's baseline or a triangular notch of ground shows
  // between them. They meet at h·√(1−(s/w)²) above their own baseline, so that has to clear `pitch` — solve
  // for w and lap a little further still.
  const w = s / Math.sqrt(1 - pr * pr) * rand(1.04, 1.16);
  const cpol = pick(['random', 'gradient', 'checker', 'rows']);
  const inner = chance(.45) ? rand(.42, .62) : 0;             // optional concentric rim inside each scale
  const at = i => cs[((i % cs.length) + cs.length) % cs.length];
  // Every scale gets a slightly oversized dome behind it. Drawn in scale order, that rim lands on the
  // neighbour to the left and the row above, which is what separates one scale from the next — without it
  // any two same-ish colours melt into one blob and a smooth `gradient` field reads as a flat wash.
  const lip = h * .045, rimOf = c => mix(c, lum(c) > .45 ? '#000000' : '#ffffff', .22);
  // Ramp across the WHOLE palette rather than between two endpoints — a two-colour ramp on a muted palette
  // washes the field out to nearly one flat tone.
  const ramp = t => { const k = Math.min(Math.max(t, 0), .999) * (cs.length - 1), i = Math.floor(k); return mix(cs[i], cs[i + 1] ?? cs[i], k - i); };
  // A ground behind the scales: the top row laps off-canvas, and a stray seam anywhere reads as a hole.
  // bgFull, not box — a box scales in from .82 with the reveal and would flash the corners bare on the way.
  bgFull({ background: mix(at(-1), ctx.P.bg, .55) });
  // half-ellipse: horizontal radii 50% of width / vertical radii the full height, so it's a dome not an arch
  const dome = (x, baseY, dw, dh, color) => box({ x, y: baseY - dh / 2, w: dw, h: dh, color, radius: '50% 50% 0 0 / 100% 100% 0 0' });
  const rows = Math.ceil(ctx.H / pitch) + 2;
  let above = [], left = null;                                // colours of the row above / the scale to the left
  for (let R = 0; R < rows; R++) {
    const baseY = R * pitch, off = (R % 2) ? s / 2 : 0, row = [];
    left = null;
    for (let C = -1; C <= cols + 1; C++) {
      const x = C * s + off + s / 2;
      let col;
      if (cpol === 'gradient') col = ramp((C / cols + R / rows) / 2);
      else if (cpol === 'checker') col = at(C + R);
      else if (cpol === 'rows') col = at(R);
      else {
        // A scale that matches its left neighbour or the one it laps over loses its silhouette and the two
        // melt into one blob, so draw only from the colours neither of them used.
        const free = cs.filter(c => c !== left && c !== above[C + 1]);
        col = pick(free.length ? free : cs);
      }
      dome(x, baseY, w + 2 * lip, h + lip, rimOf(col));
      dome(x, baseY, w, h, col);
      if (inner) dome(x, baseY, w * inner, h * inner, mix(col, lum(col) > .5 ? ctx.P.ink : ctx.P.bg, .35));
      row[C + 1] = left = col;
    }
    above = row;
  }
}
