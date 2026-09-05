import { ctx, rand, ri, shuffle, svgRoot } from '../utils.js';
// Seigaiha: the traditional overlapping wave-scale pattern. Offset rows of concentric arcs, drawn
// top-to-bottom so each row overlaps the one above — interlocking repetition, fan after fan. The whole field
// is rotated so the fans don't always open the same way, and the grid is generated over the rotated
// viewport's bounding box so the corners stay covered.
//
// The fan is defined ONCE and instanced with <use>, and only its visible crescent is drawn. The old version
// built each fan out of rings(), which stacks the concentric bands as a list of spread box-shadows on ONE
// div — up to eighty of them, ~2900 across a full grid. Measured at real density, that technique repaints in
// ~55ms against ~17ms for stroked SVG arcs: box-shadow spread is among the most expensive things Blink
// rasters, since every shadow is its own rounded-rect pass. That was the "comes back slowly after switching
// tabs" case.
export default function seigaiha() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const r = ctx.S * rand(.1, .16), sy = r * rand(.5, .68);
  const angle = rand(0, 360), a = angle * Math.PI / 180, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
  const cx = ctx.W / 2, cy = ctx.H / 2;
  // half-extents of the axis-aligned box that, once rotated by `angle`, still contains the whole viewport
  const hw = (ctx.W / 2) * c + (ctx.H / 2) * s + r * 2, hh = (ctx.W / 2) * s + (ctx.H / 2) * c + sy * 2;
  const x0 = cx - hw, y0 = cy - hh;
  const cols = Math.ceil(2 * hw / r) + 2, rows = Math.ceil(2 * hh / sy) + 2;
  const svg = svgRoot(), NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  const uid = 'sg' + ((Math.random() * 1e9) | 0).toString(36);
  // ---- one fan, described once ----
  const defs = mk('defs', {}, svg);
  const fan = mk('g', { id: uid }, defs);
  // Only the UPPER crescent of a fan is ever visible: rows are pitched closer than a radius apart, so the row
  // in front always covers everything from the centre line down (worst case, between two fans in that row, it
  // still reaches to 0.37r above centre). Drawing full circles paints the hidden half of every fan in the
  // field — the single biggest cost here, well ahead of the element count.
  const rw = r * rand(.14, .2);
  mk('path', { d: `M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0 Z`, fill: cs[0] }, fan);
  let cur = r - rw / 2, i = 1;
  while (cur > rw * .6) {
    mk('path', { d: `M ${-cur.toFixed(1)} 0 A ${cur.toFixed(1)} ${cur.toFixed(1)} 0 0 1 ${cur.toFixed(1)} 0`, fill: 'none', stroke: cs[i % cs.length], 'stroke-width': rw }, fan);
    cur -= rw; i++;
  }
  // ---- instance it across the grid, back to front so each row laps the one above ----
  const g = mk('g', { transform: `rotate(${angle.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})` }, svg);
  for (let R = 0; R < rows; R++) {
    // ONE animated node per row, not per fan. `fin` on every instance meant ~750 concurrently animated
    // elements, which costs more than the drawing does — with them the field repaints at ~30ms, without at
    // ~18ms. Staggering by row keeps the reveal and leaves the fans as plain, un-animated geometry.
    const row = mk('g', {}, g);
    row.style.setProperty('--t0', 'none'); row.style.setProperty('--t1', 'none'); row.style.setProperty('--op', '1');
    row.style.animation = `fin .45s ease ${Math.min(R * .02, .5).toFixed(3)}s both`;
    for (let C = 0; C < cols; C++) {
      const x = x0 + C * r + (R % 2 ? r / 2 : 0), y = y0 + R * sy;
      // transform lives on the <use>, which is NOT animated. Animating a node that carries a transform
      // attribute lets `fin`'s transform:none override it and snaps every instance to the origin.
      mk('use', { href: `#${uid}`, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, row);
    }
  }
}
