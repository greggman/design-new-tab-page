import { ctx, makePalette, paletteFromBase, normalizeHex, shuffle, mix, setBg, overlay, rand, ri, wpick, safe } from './utils.js';
import SYSTEMS from './renderers/index.js';

const params = new URLSearchParams(globalThis.location?.search ?? '');
// Base color comes from the ?basecolor= URL param (dev / standalone use) or, in the extension, from
// the color the user picked in the popup (persisted in chrome.storage). The URL param wins.
const urlBase = normalizeHex(params.get('basecolor'));
let baseColor = urlBase;

// initialize DOM refs
ctx.stage = document.getElementById('stage');
ctx.label = document.getElementById('label');

// Designs with a built-in horizon, baseline, or sense of gravity look wrong tilted, so they never
// rotate. Everything else rotates only occasionally (and gets zoomed in so no edges show).
const NO_ROTATE = new Set(['Perspective grid', 'Sunrise', 'Mountains', 'Staircase', 'Bar stack', 'Waveform', 'Coin stacks', 'Art deco', 'Constructivist']);

// A composition is one foreground system over a background treatment from setBg(). These systems
// fill the whole canvas with opaque shapes and would completely hide a patterned background, so when
// setBg draws anything other than a plain fill we choose the foreground from the *other* systems —
// the ones that leave gaps/space for the background to show through. On a solid background, anything
// goes (that's where the big full-bleed designs get to shine).
const COVERERS = new Set([
  'Tessellation', 'Swiss bands', 'Diagonal field', 'Triangle rows', 'Scallop grid', 'Isometric', 'Mondrian', 'Wave grid',
  'Brick wall', 'Truchet', 'Halftone', 'Chevron rows', 'Column stripes', 'Rotating squares', 'Tangram', 'Windmill tiles',
  'Seigaiha', 'Color field', 'Plaid', 'Basketweave', 'Terrazzo', 'Mountains', 'Arc tiles', 'Warped checker',
  'Stained glass', 'Gradient grid', 'Argyle', 'Warp bands', 'Perspective grid', 'Glitch', 'Hex grid', 'Barcode', 'Op waves',
  'Hypno rays', 'Plasma', 'Mosaic', 'Dither', 'Quilt', 'Hatch cells', 'Sunrise', 'Shards', 'Ripple', 'Spectrum rings', 'Staircase',
  'Low poly', 'Dazzle', 'Mudcloth', 'Café wall',
  'Herringbone', 'Houndstooth', 'Voronoi', 'Penrose', 'Islamic star', 'Camouflage', 'Leopard', 'Topographic',
  'Bargello', 'Marble', 'Tie-dye', 'Bulge grid', 'Circuit board', 'Sierpinski', 'Tunnel', 'Retro arcs', 'Art deco',
  'Doodle grid', 'Concentric polygons', 'Squiggle', 'Arc loops', 'Geo grid', 'Constructivist',
]);
function compose(rendererName) {
  const busy = setBg();
  const base = ctx.root.querySelectorAll('.piece').length;
  const pool = busy > 0 ? SYSTEMS.filter(e => !COVERERS.has(e[0])) : SYSTEMS;
  const p = (rendererName ?? '').toLowerCase();
  if (p) {
    const match = SYSTEMS.find(s => s[0].toLowerCase() === p);
    if (match) {
      safe(match[1])
      return match[0];
    }
  }
  const sys = wpick((pool.length ? pool : SYSTEMS).map(e => [e, e[2]]));
  safe(sys[1]);
  if (ctx.root.querySelectorAll('.piece').length <= base) { safe(() => { const fallback = SYSTEMS.find(s => s[0] === 'Concentric'); fallback[1](); }); return 'Fallback'; }
  return sys[0];
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

// Lay out one design at w×h pixels into `root`. Shared by the full-viewport mode and tile mode;
// the renderers all draw into ctx.root using ctx.W/ctx.H, so we just point those at the target.
function renderDesign(root, w, h, rendererName) {
  ctx.W = w; ctx.H = h; ctx.S = Math.min(w, h); ctx.idx = 0;
  ctx.designW = w; ctx.designH = h;
  ctx.P = baseColor ? paletteFromBase(baseColor) : makePalette();
  ctx.POOL = shuffle(ctx.P.colors).slice(0, ri(2, Math.max(2, ctx.P.colors.length)));
  if (ctx.POOL.length < 2) ctx.POOL = [ctx.POOL[0], mix(ctx.POOL[0], ctx.P.bg, .35)];
  ctx.root = root;
  root.style.width = w + 'px';
  root.style.height = h + 'px';
  return compose(rendererName);
}

// Default: one design filling the whole viewport, scaled/centered on resize and optionally tilted.
function generateSingle(rendererName) {
  ctx.stage.innerHTML = '<div id="art"></div>';
  const name = renderDesign(document.getElementById('art'), innerWidth, innerHeight, rendererName);
  document.body.style.background = ctx.P.bg;
  ctx.rot = (!NO_ROTATE.has(name) && Math.random() < .22) ? rand(-9, 9) : 0;
  refit();
  overlay();
  ctx.label.textContent = `${name.toUpperCase()}  ·  ${ctx.P.name}  ·  ${ctx.POOL.length}C`;
}

// ?w / ?h / ?count mode: generate `count` fixed-size inline-block tiles that wrap and scroll.
function generateTiles(w, h, count, rendererName) {
  ctx.rot = 0;
  const stage = ctx.stage;
  stage.innerHTML = '';
  Object.assign(stage.style, { overflow: 'auto', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: '12px', padding: '12px' });
  document.body.style.overflow = 'auto';
  document.body.style.background = '#0b0b0b';
  for (let i = 0; i < count; i++) {
    const a = document.createElement('a');
    const tile = document.createElement('div');
    // `isolation: isolate` gives each tile its own stacking context so setBg's negative z-index
    // background layers stay contained within the tile (full-page mode gets this from #art's
    // transform). Without it those layers escape and only the flat fill shows.
    Object.assign(tile.style, { display: 'inline-block', position: 'relative', overflow: 'hidden', flex: '0 0 auto', isolation: 'isolate' });
    const name = renderDesign(tile, w, h, rendererName === 'all' ? SYSTEMS[i][0] : rendererName);
    tile.title = `${name} · ${ctx.P.name}`;
    a.append(tile);
    a.href = `?renderer=${encodeURIComponent(name)}`;
    const desc = document.createElement('div');
    Object.assign(desc.style, { position: 'absolute', bottom: '0', left: '0', right: '0', font: '10px ui-monospace, Menlo, monospace', letterSpacing: '.04em', color: '#aaa', padding: '4px 6px', background: 'rgba(0,0,0,.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', zIndex: '100' });
    desc.textContent = `${name} · ${ctx.P.name}`;
    tile.appendChild(desc);
    stage.appendChild(a);
  }
  ctx.label.textContent = `${count} × ${w}×${h}`;
}

// ?palettes=N mode: a ColorHunt-style grid of N palette cards (stacked color bars), so many palettes
// can be compared at a glance. Uses the basecolor palette when set, otherwise random palettes.
function generatePaletteGrid(n) {
  const stage = ctx.stage;
  stage.innerHTML = '';
  Object.assign(stage.style, { overflow: 'auto', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: '14px', padding: '16px' });
  document.body.style.overflow = 'auto';
  document.body.style.background = '#444';
  for (let i = 0; i < n; i++) {
    const card = document.createElement('div');
    const P = baseColor ? paletteFromBase(baseColor) : makePalette();
    const cap = document.createElement('div');
    Object.assign(cap.style, { font: '10px ui-monospace, Menlo, monospace', letterSpacing: '.04em', color: '#aaa', padding: '6px 8px', background: '#161616', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' });
    cap.textContent = P.name;
    card.appendChild(cap);
    const bars = P.colors;   // the palette itself (ColorHunt-style color bars)
    Object.assign(card.style, { display: 'inline-flex', flexDirection: 'column', width: '150px', flex: '0 0 auto', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.4)' });
    for (const c of bars) {
      const bar = document.createElement('div');
      Object.assign(bar.style, { height: '34px', background: c });
      bar.title = c;
      card.appendChild(bar);
    }
    card.title = bars.join('  ');
    stage.appendChild(card);
  }
  ctx.label.textContent = `${n} palettes${baseColor ? ' · ' + baseColor : ''}`;
}

export function generate() {
  const palRaw = params.get('palettes');
  if (palRaw != null) {
    let n = parseInt(palRaw, 10);
    if (!Number.isFinite(n) || n < 1) n = 1;
    generatePaletteGrid(Math.min(n, 2000));
    return;
  }
  const rendererName = params.get('renderer');
  const wRaw = params.get('w'), hRaw = params.get('h'), countRaw = params.get('count');
  const all = params.get('all');
  const tileMode = wRaw != null || hRaw != null || countRaw != null || all != null;
  if (!tileMode) { generateSingle(rendererName); return; }
  let w = parseInt(wRaw, 10), h = parseInt(hRaw, 10);
  const hasW = Number.isFinite(w), hasH = Number.isFinite(h);
  if (!hasW) w = hasH ? h : 300;
  if (!hasH) h = hasW ? w : 300;
  let count = all !== null ? SYSTEMS.length : parseInt(countRaw, 10);
  if (!Number.isFinite(count) || count < 1) count = 1;
  count = Math.min(count, 1000);
  generateTiles(w, h, count, all !== null ? 'all' : rendererName);
}

// wire UI
document.getElementById('regen').addEventListener('click', e => { e.stopPropagation(); generate(); });

// keep the design centered + filling the viewport as the window resizes (rAF-throttled)
let refitPending = 0;
addEventListener('resize', () => { if (refitPending) return; refitPending = requestAnimationFrame(() => { refitPending = 0; refit(); }); });

// In the extension, load the popup-chosen base color before the first render (unless a URL param
// already set one), and live-update if the user changes it in the popup while a new tab is open.
const storage = globalThis.chrome?.storage;
const store = storage?.sync ?? storage?.local;   // must match the area the popup writes to
if (store && !urlBase) {
  try {
    const { basecolor } = await store.get('basecolor');
    baseColor = normalizeHex(basecolor) ?? baseColor;
  } catch { /* storage unavailable — fall back to random palettes */ }
  // The popup bumps `nonce` on every click, so we re-generate even when the color is unchanged. When
  // the color itself changed it's in `changes`; otherwise keep the current one (a nonce-only bump).
  storage.onChanged?.addListener((changes, area) => {
    if ((area !== 'sync' && area !== 'local') || !('basecolor' in changes || 'nonce' in changes)) return;
    if ('basecolor' in changes) baseColor = normalizeHex(changes.basecolor.newValue);
    generate();
  });
}

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
