import { ctx, rand, ri, times, shuffle, box, CLIPS, choice, chance, thirds } from '../utils.js';
// Nested chevrons: concentric arrow forms in alternating colors, all pointing one way. Repetition
// plus a single direction gives strong implied motion and a clear visual vector.
export default function nestedChevrons() {
  const cs = shuffle([ctx.P.accent, ...ctx.POOL]);
  const [cx, cy] = chance(.5) ? [ctx.W / 2, ctx.H / 2] : thirds();
  const layers = ri(5, 10), base = ctx.S * rand(.5, .85), rot = choice([0, 90, 180, 270]);
  times(layers, i => box({ x: cx, y: cy, w: base * (1 - i / (layers + 1)), h: base * (1 - i / (layers + 1)), color: cs[i % cs.length], clip: CLIPS.chevron, rot, z: i }));
}
