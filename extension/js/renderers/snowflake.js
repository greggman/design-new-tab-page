import { ctx, rand, ri, pick, chance, shuffle, mix, svgRoot, groundScheme, grid, rrange, labDist } from '../utils.js';
// Snowflakes: real six-fold crystals. One arm is grown in local coordinates — a spine with side branches at
// 60°, each of which can sprout its own, plus hexagonal plates at the hub, at branch nodes and at the tips —
// and then that single arm is stamped six times around the centre, each time also mirrored, which is exactly
// the symmetry a snow crystal has (6-fold with a mirror line down every arm).
//
// Habits, as in the real classification: stellar dendrites (long arms, many branches), sectored plates (big
// hexagonal plates with ribs), fernlike crystals (branches on branches on branches), and simple stars.
// Every flake on a page shares its habit and proportions — one crystal grown in one cloud — but each is
// rolled separately, so they are alike without being identical.

const f1 = v => v.toFixed(1);

// Grow one arm: returns { lines: [[x1,y1,x2,y2]], hexes: [[x,y,r]] } in local coordinates, the spine along +y.
function arm(P) {
  const lines = [], hexes = [];
  const grow = (x, y, ang, len, depth) => {
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    lines.push([x, y, ex, ey]);
    if (depth <= 0) return [ex, ey];
    const n = depth === P.depth ? P.branches : ri(1, 3);
    for (let i = 1; i <= n; i++) {
      const t = P.from + (P.to - P.from) * (n === 1 ? .6 : (i - 1) / (n - 1));
      const bx = x + Math.cos(ang) * len * t, by = y + Math.sin(ang) * len * t;
      const bl = len * P.side * (1 - t * .55);
      grow(bx, by, ang - P.spread, bl, depth - 1);        // one side only — the mirror supplies the other
      if (P.nodePlates) hexes.push([bx, by, bl * .12]);
    }
    return [ex, ey];
  };
  const [tx, ty] = grow(0, 0, Math.PI / 2, 1, P.depth);
  if (P.tipPlate) hexes.push([tx, ty, P.tipPlate]);
  return { lines, hexes };
}

function drawFlake(svg, x, y, R, P, col, op) {
  const { lines, hexes } = arm(P);
  const rot0 = rand(0, Math.PI / 3);
  let d = '', hd = '';
  for (let k = 0; k < 6; k++) for (const m of [1, -1]) {
    const a = rot0 + k * Math.PI / 3, ca = Math.cos(a), sa = Math.sin(a);
    // local (u,v) → canvas, with `m` mirroring the arm about its own spine
    const p = (u, v) => { const ux = u * m * R, uy = -v * R; return `${f1(x + ux * ca - uy * sa)} ${f1(y + ux * sa + uy * ca)}`; };
    for (const [x1, y1, x2, y2] of lines) d += `M${p(x1, y1)}L${p(x2, y2)}`;
    for (const [hx, hy, hr] of hexes) {   // plates go on with the mirror too, or they land on one side only
      const pts = [];
      for (let i = 0; i < 6; i++) { const t = i * Math.PI / 3 + Math.PI / 6; pts.push(p(hx + Math.cos(t) * hr, hy + Math.sin(t) * hr)); }
      hd += 'M' + pts.join('L') + 'Z';
    }
  }
  const w = Math.max(.8, R * P.weight);
  svg.node('path', { d, fill: 'none', stroke: col, 'stroke-width': f1(w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: op });
  if (hd) svg.node('path', { d: hd, fill: col, opacity: op });
  // the hub: a hexagonal plate, sometimes ringed
  const hub = R * P.hub, pts = [];
  for (let i = 0; i < 6; i++) { const t = rot0 + i * Math.PI / 3; pts.push(`${f1(x + Math.cos(t) * hub)} ${f1(y + Math.sin(t) * hub)}`); }
  svg.node('path', { d: 'M' + pts.join('L') + 'Z', fill: P.hollowHub ? 'none' : col, stroke: col, 'stroke-width': f1(w), 'stroke-linejoin': 'round', opacity: op });
}


// ---- mandala flakes: solid, many-coloured, every one different ----
// A wedge design — a handful of filled ornaments (hexes, discs, spikes, diamonds, bars, petals, rings) at
// various radii and off-spine offsets, each with its own colour — stamped six times and mirrored, exactly as
// the crystal arm is. Overlapping ornaments from neighbouring arms are what produce the lace.
const ORNAMENTS = ['hex', 'disc', 'spike', 'diamond', 'bar', 'petal', 'ring', 'tri'];

function mandalaArm(cs) {
  const els = [], n = ri(5, 9);
  for (let i = 0; i < n; i++) {
    const t = .1 + (i + rand(.1, .9)) / n * .95;
    const e = { kind: pick(ORNAMENTS), t, o: chance(.45) ? rand(.04, .3) * t : 0, s: rand(.08, .3) * (1.15 - t * .5), col: pick(cs) };
    els.push(e);
    // echo some ornaments further in, smaller — what fills the flake out into lace rather than a few spokes
    if (chance(.45)) els.push({ ...e, t: t * rand(.4, .7), s: e.s * rand(.45, .75), o: e.o * .6 });
  }
  return els;
}

function drawMandala(svg, x, y, R, els, cs, hubCol) {
  const rot0 = rand(0, Math.PI / 3), fills = new Map(), strokes = new Map();
  const put = (map, col, d) => map.set(col, (map.get(col) ?? '') + d);
  const lw = R * .012;
  for (let k = 0; k < 6; k++) for (const m of [1, -1]) {
    const a = rot0 + k * Math.PI / 3, ca = Math.cos(a), sa = Math.sin(a);
    const p = (u, v) => { const ux = u * m * R, uy = -v * R; return [x + ux * ca - uy * sa, y + ux * sa + uy * ca]; };
    const ps = (u, v) => { const q = p(u, v); return f1(q[0]) + ' ' + f1(q[1]); };
    const ngon = (u, v, r, sides, turn = 0) => {
      const out = [];
      for (let i = 0; i < sides; i++) { const th = turn + i * Math.PI * 2 / sides; out.push(ps(u + Math.cos(th) * r, v + Math.sin(th) * r)); }
      return 'M' + out.join('L') + 'Z';
    };
    for (const e of els) {
      const { kind, t, o, s, col } = e;
      let d = '';
      if (kind === 'hex') d = ngon(o, t, s, 6, Math.PI / 6);
      else if (kind === 'disc') d = ngon(o, t, s, 14);
      else if (kind === 'tri') d = `M${ps(o, t + s)}L${ps(o - s * .85, t - s * .55)}L${ps(o + s * .85, t - s * .55)}Z`;
      else if (kind === 'spike') d = `M${ps(o, t + s * 2)}L${ps(o - s * .3, t - s * .3)}L${ps(o + s * .3, t - s * .3)}Z`;
      else if (kind === 'diamond') d = `M${ps(o, t + s)}L${ps(o + s * .62, t)}L${ps(o, t - s)}L${ps(o - s * .62, t)}Z`;
      else if (kind === 'bar') d = `M${ps(o - s * .28, t - s)}L${ps(o + s * .28, t - s)}L${ps(o + s * .28, t + s)}L${ps(o - s * .28, t + s)}Z`;
      else if (kind === 'petal') d = ngon(o, t, s, 10) ;
      else d = ngon(o, t, s, 12);
      put(e.kind === 'ring' ? strokes : fills, col, d);
    }
    // the spine, and a fine rib at each ornament — the lacework between the solid pieces
    let rib = `M${ps(0, 0)}L${ps(0, 1.02)}`;
    for (const e of els) rib += `M${ps(0, e.t)}L${ps(e.o + e.s * .9, e.t + e.s * .5)}`;
    put(strokes, cs[0], rib);
  }
  for (const [col, d] of fills) svg.node('path', { d, fill: col });
  for (const [col, d] of strokes) svg.node('path', { d, fill: 'none', stroke: col, 'stroke-width': f1(Math.max(.6, lw)), 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  const pts = [];
  for (let i = 0; i < 6; i++) { const th = rot0 + i * Math.PI / 3, r = R * .13; pts.push(`${f1(x + Math.cos(th) * r)} ${f1(y + Math.sin(th) * r)}`); }
  svg.node('path', { d: 'M' + pts.join('L') + 'Z', fill: hubCol });
}

export default function snowflake() {
  const { ground, fg, ink } = groundScheme();
  const { W, H, S } = ctx, svg = svgRoot();
  // ice reads as the palette colours that stand clearest of the ground, plus the line colour
  const cs = shuffle([...fg, ink]).sort((p, q) => labDist(q, ground) - labDist(p, ground)).slice(0, 3);

  // Two ways to show them: a drift of dendritic crystals scattered over the page, all of one habit; or a GRID
  // of solid, many-coloured mandala flakes, every one its own design — the way a plate of crystal photographs
  // is laid out.
  if (chance(.5)) {
    const cols = ri(4, 7), rows = Math.max(2, Math.round(cols * H / W)), cw = W / cols, ch = H / rows;
    const R = Math.min(cw, ch) * rand(.42, .5), rich = shuffle([...fg, ink, mix(ink, ground, .35)]);
    grid(cols, rows, (i, j) => {
      const els = mandalaArm(shuffle(rich));
      drawMandala(svg, (i + .5) * cw, (j + .5) * ch, R * rand(.9, 1), els, shuffle(rich), pick(rich));
    }, { dur: 1.2 });
    return;
  }

  // one habit for the whole drift: the same crystal grown in the same cloud
  const habit = pick(['dendrite', 'sectored', 'fern', 'star']);
  const P = {
    dendrite: { depth: 2, branches: ri(4, 7), side: rand(.3, .45), spread: Math.PI / 3, from: .18, to: .82, weight: .022, hub: rand(.07, .12), tipPlate: 0, nodePlates: chance(.4), hollowHub: chance(.5) },
    sectored: { depth: 1, branches: ri(2, 4), side: rand(.35, .5), spread: Math.PI / 3, from: .3, to: .8, weight: .03, hub: rand(.22, .34), tipPlate: rand(.1, .18), nodePlates: true, hollowHub: chance(.3) },
    fern: { depth: 3, branches: ri(5, 8), side: rand(.32, .42), spread: Math.PI / 3, from: .12, to: .9, weight: .016, hub: rand(.05, .09), tipPlate: 0, nodePlates: false, hollowHub: chance(.6) },
    star: { depth: 1, branches: ri(1, 2), side: rand(.3, .5), spread: Math.PI / 3, from: .45, to: .75, weight: .04, hub: rand(.15, .25), tipPlate: rand(0, .12), nodePlates: false, hollowHub: chance(.4) },
  }[habit];

  // a drift of flakes: a few big ones, more middling, a scatter of small; far ones fainter
  const flakes = [];
  const place = (R, op) => {
    for (let t = 0; t < 40; t++) {
      const x = rand(-.05, 1.05) * W, y = rand(-.05, 1.05) * H;
      if (flakes.every(f => Math.hypot(f.x - x, f.y - y) > (f.R + R) * .78)) { flakes.push({ x, y, R, op }); return; }
    }
  };
  for (let i = ri(1, 3); i > 0; i--) place(S * rand(.16, .26), rand(.85, 1));
  for (let i = ri(4, 8); i > 0; i--) place(S * rand(.08, .15), rand(.7, 1));
  for (let i = ri(8, 16); i > 0; i--) place(S * rand(.03, .07), rand(.45, .85));

  rrange(0, flakes.length, i => {
    const f = flakes[i];
    drawFlake(svg, f.x, f.y, f.R, P, cs[i % cs.length], f.op);
  }, { dur: 1.2 });

  // falling snow behind it all: small dots
  for (let i = Math.round(W * H / (S * S) * rand(25, 50)); i > 0; i--)
    svg.node('circle', { cx: f1(rand(0, W)), cy: f1(rand(0, H)), r: f1(S * rand(.002, .006)), fill: mix(cs[0], ground, rand(.2, .6)) });
}
