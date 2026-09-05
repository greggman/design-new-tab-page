import { ctx, ri, rand, shuffle, pick, chance, bgFull, svgRoot, mix, lum } from '../utils.js';
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
  // One unit half-ellipse in <defs>, instanced per scale and scaled to size. fill=currentColor so each <use>
  // can recolour it with a plain `color`, which is the only property <use> lets an instance override.
  const svg = svgRoot(), NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  const uid = 'sc' + ((Math.random() * 1e9) | 0).toString(36);
  const defs = mk('defs', {}, svg);
  mk('path', { id: uid, d: 'M -1 0 A 1 1 0 0 1 1 0 Z', fill: 'currentColor' }, defs);
  // ONE animated node per row, never per dome. `fin` on every instance is far more expensive than the drawing
  // — and because it animates transform between var(--t0) and var(--t1), animating a node that carries a
  // transform ATTRIBUTE lets transform:none override it and snaps every dome to the origin at unit size,
  // blanking the field. The <use> nodes stay plain geometry; only the row wrapper animates.
  let rowG = svg;
  const dome = (x, baseY, dw, dh, color) => {
    const u = mk('use', { href: `#${uid}`, transform: `translate(${x.toFixed(1)} ${baseY.toFixed(1)}) scale(${(dw / 2).toFixed(2)} ${dh.toFixed(2)})` }, rowG);
    u.style.color = color;
    return u;
  };
  const rows = Math.ceil(ctx.H / pitch) + 2;
  let above = [], left = null;                                // colours of the row above / the scale to the left
  for (let R = 0; R < rows; R++) {
    const baseY = R * pitch, off = (R % 2) ? s / 2 : 0, row = [];
    left = null;
    rowG = mk('g', {}, svg);
    rowG.style.setProperty('--t0', 'none'); rowG.style.setProperty('--t1', 'none'); rowG.style.setProperty('--op', '1');
    rowG.style.animation = `fin .5s ease ${Math.min(R * .03, .45).toFixed(3)}s both`;
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
