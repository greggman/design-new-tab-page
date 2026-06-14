import { ctx, makePalette, shuffle, mix, setBg, overlay, rand, ri, wpick, safe } from './utils.js';
import SYSTEMS from './renderers/index.js';
import poster from './renderers/poster.js';

const params = new URLSearchParams(globalThis.location?.search ?? '');

// initialize DOM refs
ctx.stage = document.getElementById('stage');
ctx.label = document.getElementById('label');

// Designs with a built-in horizon, baseline, or sense of gravity look wrong tilted, so they never
// rotate. Everything else rotates only occasionally (and gets zoomed in so no edges show).
const NO_ROTATE = new Set(['Perspective grid', 'Sunrise', 'Mountains', 'Staircase', 'Bar stack', 'Waveform', 'Poster']);

// A composition is one foreground system over a background treatment from setBg(). These systems
// fill the whole canvas with opaque shapes and would completely hide a patterned background, so when
// setBg draws anything other than a plain fill we choose the foreground from the *other* systems —
// the ones that leave gaps/space for the background to show through. On a solid background, anything
// goes (that's where the big full-bleed designs get to shine).
const COVERERS = new Set([
  'Tessellation', 'Swiss bands', 'Diagonal field', 'Triangle rows', 'Scallop grid', 'Isometric', 'Mondrian', 'Wave grid',
  'Brick wall', 'Truchet', 'Halftone', 'Chevron rows', 'Column stripes', 'Rotating squares', 'Tangram', 'Windmill tiles',
  'Seigaiha', 'Color field', 'Plaid', 'Basketweave', 'Terrazzo', 'Mountains', 'Arc tiles', 'Checkerboard', 'Warped checker',
  'Stained glass', 'Gradient grid', 'Argyle', 'Warp bands', 'Perspective grid', 'Glitch', 'Hex grid', 'Barcode', 'Op waves',
  'Hypno rays', 'Plasma', 'Mosaic', 'Dither', 'Quilt', 'Hatch cells', 'Sunrise', 'Shards', 'Ripple', 'Spectrum rings', 'Staircase',
  'Low poly', 'Dazzle', 'Mudcloth', 'Café wall', 'Poster',
]);
function compose() {
  ctx.note = '';
  // Debug: ?renderer=Name shows a single raw system (the pattern library). Poster manages its own
  // background; every other system gets a plain fill behind it so you can inspect it cleanly.
  const p = (params.get('renderer') ?? '').toLowerCase();
  if (p) {
    const match = SYSTEMS.find(s => s[0].toLowerCase() === p);
    if (match) { if (match[0] !== 'Poster') setBg(false); safe(match[1]); return match[0]; }
  }
  // Default: always a composed poster. The pattern renderers live on as hero textures inside it.
  safe(poster);
  return 'Poster';
}

// The composition is laid out once in pixels at its "design size" (the window size when generated).
// On resize we don't relayout — we scale/center the whole #art container so it always covers the
// viewport from the middle out, accounting for any rotation the design was given.
function fitTransform() {
  const rot = ctx.rot || 0, r = Math.abs(rot) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  // zoom IN enough that the rotated design rectangle fully contains the viewport, so no background
  // edges/corners are ever exposed by the tilt (project each viewport half-extent onto the design axes)
  const scale = Math.max((innerWidth * c + innerHeight * s) / ctx.designW, (innerWidth * s + innerHeight * c) / ctx.designH) * (rot ? 1.01 : 1);
  const dx = (innerWidth - ctx.designW) / 2, dy = (innerHeight - ctx.designH) / 2;       // re-center
  return `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(${scale.toFixed(4)})`;
}
export function refit() { if (ctx.root) ctx.root.style.transform = fitTransform(); }

export function generate() {
  ctx.W = innerWidth; ctx.H = innerHeight; ctx.S = Math.min(ctx.W, ctx.H); ctx.idx = 0;
  ctx.designW = ctx.W; ctx.designH = ctx.H;
  ctx.P = makePalette();
  ctx.POOL = shuffle(ctx.P.colors).slice(0, ri(2, Math.max(2, ctx.P.colors.length)));
  if (ctx.POOL.length < 2) ctx.POOL = [ctx.POOL[0], mix(ctx.POOL[0], ctx.P.bg, .35)];
  ctx.stage.innerHTML = '<div id="art"></div>';
  ctx.root = document.getElementById('art');
  ctx.root.style.width = ctx.designW + 'px';
  ctx.root.style.height = ctx.designH + 'px';
  document.body.style.background = ctx.P.bg;
  const name = compose();
  ctx.rot = (!NO_ROTATE.has(name) && Math.random() < .22) ? rand(-9, 9) : 0;
  refit();
  overlay();
  ctx.label.textContent = `${name.toUpperCase()}  ·  ${ctx.P.name}${ctx.note ? '  ·  ' + ctx.note : '  ·  ' + ctx.POOL.length + 'C'}`;
}

// wire UI
document.getElementById('regen').addEventListener('click', e => { e.stopPropagation(); generate(); });

// keep the design centered + filling the viewport as the window resizes (rAF-throttled)
let refitPending = 0;
addEventListener('resize', () => { if (refitPending) return; refitPending = requestAnimationFrame(() => { refitPending = 0; refit(); }); });

// initial generate
generate();

if (params.get('list')) {
  const t = document.createElement('div');
  t.style.position = 'fixed';
  t.style.columns = '200px';
  t.style.top = '0';
  t.style.left = '0';
  t.style.columns = '200px'
  t.style.color = '#FFF';
  t.style.backgroundColor = 'rgba(0,0,0,.8)';
  t.style.maxHeight = '100vh';
  SYSTEMS.forEach(s => {
    const l = document.createElement('div');
    const a = document.createElement('a');
    a.textContent = s[0];
    a.href = `?renderer=${encodeURIComponent(s[0])}`;
    a.style.color = 'inherit';
    l.appendChild(a);
    t.appendChild(l);
  });
  document.body.appendChild(t);
}

export default { generate };
