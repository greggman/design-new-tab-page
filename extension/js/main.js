import { ctx, makePalette, shuffle, mix, setBg, overlay, coverScale, rand, ri, wpick, safe } from './utils.js';
import SYSTEMS from './renderers/index.js';

// initialize DOM refs
ctx.stage = document.getElementById('stage');
ctx.label = document.getElementById('label');

function compose() {
  const busy = setBg();
  const base = ctx.root.querySelectorAll('.piece').length;
  const candidates = SYSTEMS.filter(([, , d]) => busy < .5 || d <= .3);
  const sys = wpick((candidates.length ? candidates : SYSTEMS).map(([n, f, w]) => [[n, f], w]));
  safe(sys[1]);
  if (ctx.root.querySelectorAll('.piece').length <= base) { safe(() => { const fallback = SYSTEMS.find(s => s[0] === 'Concentric'); fallback[1](); }); return 'Fallback'; }
  return sys[0];
}

export function generate() {
  ctx.W = innerWidth; ctx.H = innerHeight; ctx.S = Math.min(ctx.W, ctx.H); ctx.idx = 0;
  ctx.P = makePalette();
  ctx.POOL = shuffle(ctx.P.colors).slice(0, ri(2, Math.max(2, ctx.P.colors.length)));
  if (ctx.POOL.length < 2) ctx.POOL = [ctx.POOL[0], mix(ctx.POOL[0], ctx.P.bg, .35)];
  ctx.stage.innerHTML = '<div id="art"></div>';
  ctx.root = document.getElementById('art');
  document.body.style.background = ctx.P.bg;
  const rot = Math.random() < .28 ? rand(-12, 12) : 0;
  if (rot) ctx.root.style.transform = `rotate(${rot}deg) scale(${coverScale(rot).toFixed(3)})`;
  const name = compose();
  overlay();
  ctx.label.textContent = `${name.toUpperCase()}  ·  ${ctx.P.name}  ·  ${ctx.POOL.length}C`;
}

// wire UI
document.getElementById('regen').addEventListener('click', e => { e.stopPropagation(); generate(); });

// initial generate
generate();

export default { generate };
