import { ctx, ri, rand, pick, choice, shuffle, chance, clamp, wpick, mix, shape } from '../utils.js';
// Wave grid: a grid of shapes whose rows ride a sine wave. The whole point is that you can SEE the wave, so
// three things have to hold that a plain jittered grid doesn't: the amplitude is a real multiple of the row
// pitch (not a fraction of it), every row carries very nearly the same phase so the rows stay parallel
// instead of tangling, and each shape banks to the local slope. Shapes may also swell at the crests.
//
// It's all laid out in wave-space — u runs ALONG the wave, v stacks the wave lines — and only mapped to x/y
// at the end, because the wave always travels down the LONG axis: across a landscape window, down a portrait
// one. Pinned to the horizontal instead, a portrait window gets ~1 cycle of wave against 25 rows of vertical
// repetition, and the repetition wins.
export default function waveGrid() {
  const cs = shuffle([...ctx.POOL, ctx.P.accent]);
  const vert = ctx.H > ctx.W;
  const U = vert ? ctx.H : ctx.W, V = vert ? ctx.W : ctx.H;
  // Size the cell off the SHORT side and derive BOTH counts from it, so the grid keeps the same density and
  // square-ish cells whichever way the window is turned. Cap one count instead and portrait cells stretch to
  // 3:1 — shapes are sized by the narrow dimension, so they shrink while the gaps stay wide and the field
  // falls apart into scattered dots.
  const cell0 = ctx.S / ri(8, 16);
  const nu = Math.max(4, Math.round(U / cell0)), nv = Math.max(4, Math.round(V / cell0));
  const du = U / nu, dv = V / nv;
  // One step along u is one sample of the wave, so nu/freq is samples-per-cycle. Below ~7 the sine aliases
  // into a zigzag and the per-shape slope goes near-vertical, so cap the frequency against the sample count.
  const freq = Math.min(choice([1, 1.5, 2, 2.5, 3]), nu / 7);
  const amp = dv * rand(.75, 1.35);             // at least the line pitch — the wave has to be legible
  const lag = rand(0, .7) / nv;                 // total lean across ALL lines stays under ~0.7rad, so they never cross
  // Swell tracks the wave value, which (by design, since the lines stay in phase) means it varies along u —
  // so too much of it paints size-bands across the wave that read louder than the wave itself.
  const swell = chance(.7) ? rand(.15, .32) : 0;
  const bank = chance(.75);                     // rotate each shape to the wave's local slope
  const k = pick(['circle', 'square', 'diamond', 'triangle', 'half', 'hexagon', 'ring']);
  // Colouring per wave line paints each undulating line its own colour and is the clearest read of the wave;
  // by wave value is subtler but still tracks it. Colouring ACROSS the wave is just banding — it fights the
  // wave rather than showing it, so it isn't an option here.
  const cpol = wpick([['line', 3], ['phase', 1]]);
  // Cap so even a swollen crest shape only just touches its neighbour — past that the crests fuse into solid
  // blocks and the individual shapes (and with them the grid) stop reading.
  const cell = Math.min(du, dv), base = Math.min(cell * rand(.62, .95), cell * 1.02 / (1 + swell));
  const at = i => cs[((i % cs.length) + cs.length) % cs.length];
  const ramp = t => { const q = Math.min(Math.max(t, 0), .999) * (cs.length - 1), i = Math.floor(q); return mix(cs[i], cs[i + 1] ?? cs[i], q - i); };
  const k2p = Math.PI * 2 * freq / nu;          // radians of wave per step along u
  // one extra ring of cells all round: the wave lifts the first line off-canvas and drops the last one past it
  for (let j = -1; j <= nv; j++) for (let i = -1; i <= nu; i++) {
    const ph = i * k2p + j * lag, val = Math.sin(ph);
    const u = (i + .5) * du, v = (j + .5) * dv + val * amp;
    // d(v)/d(step along u) → the angle the wave is travelling at right here, measured in wave-space
    const slope = clamp(Math.atan2(Math.cos(ph) * k2p * amp, du) * 180 / Math.PI, -40, 40);
    const col = cpol === 'line' ? at(j) : ramp((val + 1) / 2);
    shape(vert ? v : u, vert ? u : v, base * (1 + val * swell), cs,
      { kind: k, color: col, rot: (bank ? slope : 0) + (vert ? 90 : 0) });
  }
}
