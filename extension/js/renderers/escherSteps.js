import { ctx, ri, rand, pick, chance, shuffle, svgRoot, mix } from '../utils.js';
// Escher steps: a solid staircase climbing across the canvas in axonometric projection. Each step shows three
// faces — lit tread on top, mid riser facing the viewer, dark flank down the side.
//
// Three things have to hold or it stops reading as stairs at all:
//
// 1. The riser height is deliberately NOT the ground-cell height. In a true isometric projection the axis
//    vectors sum to zero (ex + ey + ez = 0), so a stair rising one unit per unit forward runs along exactly
//    −ey, the same screen line the staircase's own width runs along; the treads collapse and you get a thin
//    diagonal ribbon. Offsetting the riser (vh ≠ 2·hh) makes this dimetric and the treads open up.
// 2. The steps carry a solid body below them. Treads alone — floating slabs — read as a folded ribbon,
//    because nothing establishes which way is down.
// 3. The flight rises AWAY from the viewer: tread height counts DOWN as i counts up. Built the intuitive way
//    round, each step is both nearer and taller than the one behind it, so it buries all but one unit of that
//    step's riser — (thick−1)/thick of every riser in the flight. Sorting cannot save that; the back-to-front
//    order is already correct, the geometry is what's wrong. Rising away, each nearer step is LOWER and can
//    never cover the tread or riser above it, so the whole flight stays visible.
export default function escherSteps() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const u = ctx.S / ri(6, 10);                             // one ground unit, in px
  const hw = u * .5, hh = u * .25;                         // ground cell half-width / half-depth on screen
  const vh = u * rand(.55, .85);                           // riser height — never u*.5, see (1)
  const sy = vh + hh;                                      // screen drop per step, coming toward the viewer
  const depth = ri(3, 7);                                  // tread width, in units
  const thick = ri(2, 4);                                  // how far the solid body hangs below each tread
  // A flight big enough for the steps to read can't also fill the frame — one is a diagonal band with dead
  // space either side. Run two or three parallel flights rather than shrinking the steps to fit.
  const ribbons = ri(2, 3);
  const grade = chance(.55);                               // drift the base colour along the climb
  const dir = pick([1, -1]);
  const steps = Math.max(3, Math.ceil(Math.max((ctx.W + 2 * u) / hw - depth, (ctx.H + 2 * u - depth * hh) / sy)));
  const ox = ctx.W / 2 - (steps - depth) * hw / 2;
  const oy = ctx.H / 2 - ((steps + depth) * hh - steps * vh) / 2;
  const svg = svgRoot();
  const root = dir < 0 ? svg.node('g', { transform: `translate(${ctx.W},0) scale(-1,1)` }) : svg;
  for (let rb = 0; rb < ribbons; rb++) {
    const lift = rb === 0 ? 0 : (rb % 2 ? 1 : -1) * ri(4, 9) * vh;   // a parallel flight, offset up or down
    const c0 = cs[rb % cs.length], c1 = cs[(rb + 1) % cs.length];
    const P = (i, j, k) => `${(ox + (i - j) * hw).toFixed(1)},${(oy + (i + j) * hh - k * vh + lift).toFixed(1)}`;
    const face = (pts, color) => svg.node('polygon', { points: pts.join(' '), fill: color }, root);
    // i counts up toward the viewer, so ascending t is already back-to-front.
    for (let t = 0; t < steps; t++) {
      const b = grade ? mix(c0, c1, t / steps) : c0, d = depth;
      const top = steps - t, bot = top - thick;            // height counts DOWN as we come forward — see (3)
      face([P(t + 1, 0, bot), P(t + 1, d, bot), P(t + 1, d, top), P(t + 1, 0, top)], mix(b, '#000000', .06)); // riser
      face([P(t, d, bot), P(t + 1, d, bot), P(t + 1, d, top), P(t, d, top)], mix(b, '#000000', .34));         // flank
      face([P(t, 0, top), P(t + 1, 0, top), P(t + 1, d, top), P(t, d, top)], mix(b, '#ffffff', .2));          // tread
    }
  }
}
