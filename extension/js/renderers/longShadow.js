import { ctx, rand, ri, pick, chance, shuffle, clamp, svgRoot, groundScheme, rrange, labDist, hexToOklch, oklchToHex } from '../utils.js';
// Long shadow: little isometric blocks throwing flat shadows right across the page — the 2013 flat-design
// trick, where the shadow is not a blur but a hard silhouette swept a long way in one direction.
//
// The shadow is exactly that sweep: take the rhombus the block STANDS on, copy it far along the light
// direction, and fill the convex hull of the two. Every block on the page shares the one direction, so the
// whole field reads as one light source; the shadows go down first, so they never fall over another block.

const f1 = v => v.toFixed(1);
const SVGNS = 'http://www.w3.org/2000/svg';
const poly = pts => 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z';

// convex hull (monotone chain) — the silhouette and its far copy, wrapped
function hull(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = list => { const h = []; for (const q of list) { while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop(); h.push(q); } return h; };
  const lo = half(p), hi = half([...p].reverse());
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
}

// A block at (x, y) — the top face's centre — w wide, in `levels` cubes stacked. Returns its faces and the
// footprint it stands on, all in canvas coordinates.
function block(x, y, w, levels, squash) {
  const hh = w * squash, H = w * .92;
  const at = (dx, dy) => [x + dx, y + dy];
  const faces = [], top = [at(0, -hh), at(w, 0), at(0, hh), at(-w, 0)];
  for (let i = levels - 1; i >= 0; i--) {
    const dy = i * H;
    faces.push({ k: 'top', p: top.map(([px, py]) => [px, py + dy]) });
    faces.push({ k: 'left', p: [at(-w, dy), at(0, hh + dy), at(0, hh + dy + H), at(-w, dy + H)] });
    faces.push({ k: 'right', p: [at(w, dy), at(0, hh + dy), at(0, hh + dy + H), at(w, dy + H)] });
  }
  // The shadow is cast from the block's FOOTPRINT — the rhombus it stands on — not from its whole silhouette:
  // swept from the silhouette, the band starts up at the top face and the shadow looks like it leaves the
  // cube's upper edge instead of its base.
  const b = (levels - 1) * H + H;
  const foot = [at(0, b - hh), at(w, b), at(0, b + hh), at(-w, b)];
  return { faces, foot, bottom: y + b + hh };
}

export default function longShadow() {
  const { ground, fg, gL } = groundScheme();
  const { W, H, S } = ctx, svg = svgRoot();
  const defs = document.createElementNS(SVGNS, 'defs'); svg.appendChild(defs);
  const uid = 'ls' + Math.random().toString(36).slice(2);
  const cs = shuffle(fg.filter(c => labDist(c, ground) > .25).length ? fg.filter(c => labDist(c, ground) > .25) : fg);

  // one light for the whole page: a direction, a length, and a shadow colour a step deeper than the ground
  // The light is high and off to one side, so the shadow always falls DOWN the page, diagonally — away from
  // the light, never back toward it and never upward (which would put the sun under the floor). Straight down
  // is no good either: each shadow would hide behind the block in front of it.
  const dir = pick([Math.PI / 4, Math.PI * .75]) + rand(-.28, .28);
  const len = S * rand(.7, 2), V = [Math.cos(dir) * len, Math.sin(dir) * len];
  const [gLc, gC, gHu] = hexToOklch(ground);
  const shade = oklchToHex(gL > .5 ? Math.max(.04, gLc - rand(.2, .3)) : Math.min(.96, gLc + rand(.14, .22)), gC * 1.15, gHu);
  const fade = true; chance(.45);
  const squash = rand(.45, .6);       // how flat the isometric top face is

  // Faces take one palette colour at three lightnesses: the top brightest, and of the two sides the one
  // FACING the light — the opposite side from where the shadow runs — lighter than the other.
  const litSide = V[0] < 0 ? 'right' : 'left';
  // Lightening a face can walk it INTO the ground colour — a cube whose top and lit side match the ground
  // reads as a broken cube with one face floating — so every tone is pushed clear of the ground afterwards.
  const clear = c => {
    if (labDist(c, ground) >= .17) return c;
    const [, C, Hu] = hexToOklch(c);
    // move it to whichever side of the ground's lightness has the room — pushing a fixed step can run into
    // black or white and leave the face sitting on the ground colour anyway
    const both = [Math.min(.97, gLc + .24), Math.max(.05, gLc - .24)].map(L => oklchToHex(L, C, Hu));
    return both.sort((p, q) => labDist(q, ground) - labDist(p, ground))[0];
  };
  const facing = col => {
    const [L, C, Hu] = hexToOklch(col);
    const bright = clear(oklchToHex(Math.min(.97, L + .12), C * .9, Hu)), dim = clear(oklchToHex(Math.max(.06, L - .16), C, Hu));
    return { top: clear(oklchToHex(Math.min(.98, L + .24), C * .8, Hu)), [litSide]: bright, [litSide === 'right' ? 'left' : 'right']: dim };
  };

  // lay the blocks out: an isometric lattice, or scattered at several sizes
  const blocks = [];
  if (chance(.5)) {
    // wide spacing: packed shoulder to shoulder, the blocks would hide each other's shadows
    const w = S * rand(.05, .095), sx = w * rand(3.4, 5), sy = sx * squash;
    for (let j = -2; j * sy < H + sy * 4; j++) for (let i = -2; i * sx < W + sx * 2; i++) {
      if (chance(.35)) continue;
      blocks.push({ x: i * sx + (j % 2 ? sx / 2 : 0), y: j * sy, w, levels: chance(.25) ? ri(2, 3) : 1 });
    }
  } else {
    const placed = [];
    for (let w = S * rand(.1, .16); w > S * .035; w *= .82)
      for (let t = 0; t < 40; t++) {
        const x = rand(0, 1) * W, y = rand(0, 1) * H;
        if (placed.every(q => Math.hypot(q[0] - x, q[1] - y) > (q[2] + w) * 2.2)) { placed.push([x, y, w]); blocks.push({ x, y, w, levels: chance(.3) ? ri(2, 3) : 1 }); }
      }
  }
  for (const b of blocks) Object.assign(b, block(b.x, b.y, b.w, b.levels, squash), { col: pick(cs) });
  blocks.sort((p, q) => p.bottom - q.bottom);     // far blocks first, so nearer ones overlap them

  // every shadow first, so no shadow lands on top of a block
  rrange(0, blocks.length, i => {
    const b = blocks[i];
    let fill = shade;
    if (fade) {
      const id = `${uid}-${i}`, g = document.createElementNS(SVGNS, 'linearGradient');
      g.setAttribute('id', id); g.setAttribute('gradientUnits', 'userSpaceOnUse');
      g.setAttribute('x1', f1(b.x)); g.setAttribute('y1', f1(b.y)); g.setAttribute('x2', f1(b.x + V[0])); g.setAttribute('y2', f1(b.y + V[1]));
      // hold the shadow solid most of the way, then drop off — fading it evenly leaves it barely there
      for (const [off, op] of [[0, 1], [.5, .85], [1, 0]]) {
        const st = document.createElementNS(SVGNS, 'stop');
        st.setAttribute('offset', off); st.setAttribute('stop-color', shade); st.setAttribute('stop-opacity', op);
        g.appendChild(st);
      }
      defs.appendChild(g);
      fill = `url(#${id})`;
    }
    svg.node('path', { d: poly(hull([...b.foot, ...b.foot.map(([px, py]) => [px + V[0], py + V[1]])])), fill });
  }, { dur: .8, order: 'forward' });

  rrange(0, blocks.length, i => {
    const b = blocks[i], F = facing(b.col);
    for (const f of b.faces) svg.node('path', { d: poly(f.p), fill: F[f.k] });
  }, { dur: .9, order: 'forward' });
}
