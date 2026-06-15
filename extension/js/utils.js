export const ctx = { stage: null, label: null, root: null, W: 0, H: 0, S: 0, idx: 0, P: null, POOL: [] };

/* ---------- random ---------- */
export const rand = (a, b) => a + Math.random() * (b - a);
export const ri = (a, b) => Math.floor(rand(a, b + 1));
export const chance = p => Math.random() < p;
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const choice = pick;
export const wpick = pairs => { const t = pairs.reduce((s, x) => s + x[1], 0); let r = Math.random() * t; for (const [v, w] of pairs) if ((r -= w) <= 0) return v; return pairs[0][0]; };
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const times = (n, f) => { for (let i = 0; i < n; i++) f(i); };
export const safe = fn => { try { fn(); } catch (e) { console.warn('layer skipped:', e); } };

/* ---------- color ---------- */
export function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  l = clamp(l, 0, 1);
  s = clamp(s, 0, 1);
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = x => Math.round(255 * x).toString(16).padStart(2, '0');
  return '#' + to(f(0)) + to(f(8)) + to(f(4));
}
export const hexToRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
export const mix = (a, b, t) => '#' + hexToRgb(a).map((v, i) => Math.round(v + (hexToRgb(b)[i] - v) * t)).map(v => v.toString(16).padStart(2, '0')).join('');
export const lum = hex => { const [r, g, b] = hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
// Two colors from `colors` (random, for variety) guaranteed to contrast; returns [lighter, darker].
// If the random pair is too close in value, push them apart so two-tone patterns stay legible.
export function contrastPair(colors) {
  const s = shuffle(colors); let c1 = s[0], c2 = s[1] || s[0];
  let a = lum(c1) >= lum(c2) ? c1 : c2, b = a === c1 ? c2 : c1;
  if (lum(a) - lum(b) < 0.3) { a = mix(a, '#ffffff', .4); b = mix(b, '#000000', .4); }
  return [a, b];
}

export const CURATED = [
  { name: 'BAUHAUS', bg: '#ece6d6', ink: '#1c1a17', colors: ['#d6402c', '#1f4e9b', '#e8b923'], accent: '#d6402c', dark: false },
  { name: 'MID-CENTURY', bg: '#efe7d3', ink: '#2a2620', colors: ['#d98b3a', '#2f7e7e', '#c75b39', '#3c5a4a'], accent: '#c75b39', dark: false },
  { name: 'SWISS', bg: '#f3f1ec', ink: '#111111', colors: ['#e0301e', '#111111', '#8a8a8a'], accent: '#e0301e', dark: false },
  { name: 'RISO', bg: '#f4ece4', ink: '#33312e', colors: ['#ef6ea0', '#3f72c9', '#f2c14e'], accent: '#ef6ea0', dark: false },
  { name: 'MIDNIGHT', bg: '#10172a', ink: '#e7ecf5', colors: ['#e8b04b', '#ef6f5b', '#39a8a0', '#6f7fd1'], accent: '#e8b04b', dark: true },
  { name: 'FOREST', bg: '#1d2620', ink: '#e8ead8', colors: ['#9bbf6a', '#3f7d56', '#e0b13e', '#cf7d4a'], accent: '#e0b13e', dark: true },
  { name: 'SUNSET', bg: '#2a1430', ink: '#f6e7d8', colors: ['#ff7a59', '#ffb347', '#d34b8f', '#7b4fb0'], accent: '#ffb347', dark: true },
  { name: 'CORAL/TEAL', bg: '#f0ece2', ink: '#22302f', colors: ['#ff6f61', '#0d8a8a', '#ffc14d', '#1f3b3a'], accent: '#ff6f61', dark: false },
  { name: 'PLUM', bg: '#f2e9ee', ink: '#2c1d2a', colors: ['#7a3b69', '#c9617e', '#e8a05a', '#3d5a80'], accent: '#c9617e', dark: false },
  { name: 'COBALT', bg: '#0e1b3a', ink: '#e6ecff', colors: ['#ffd23f', '#ff5964', '#3ad0c8', '#ffffff'], accent: '#ffd23f', dark: true },
  { name: 'EMBER', bg: '#1a1413', ink: '#f3e3d0', colors: ['#e8552d', '#f2a541', '#7a9e7e', '#d8c39a'], accent: '#e8552d', dark: true },
  { name: 'ICE', bg: '#eef3f6', ink: '#1f2d3a', colors: ['#3a6ea5', '#6fb1c4', '#c0d6df', '#27384a'], accent: '#ef8354', dark: false },
];

export function generatedPalette() {
  const baseH = ri(0, 359), scheme = pick(['analog', 'comp', 'triad', 'split', 'tetrad']);
  const hues = { analog: [baseH, baseH + 30, baseH - 30, baseH + 60], comp: [baseH, baseH + 180, baseH + 20, baseH + 200], triad: [baseH, baseH + 120, baseH + 240], split: [baseH, baseH + 150, baseH + 210], tetrad: [baseH, baseH + 90, baseH + 180, baseH + 270] }[scheme];
  const cfg = { vibrant: [[72, 90], [48, 60]], muted: [[30, 48], [46, 62]], pastel: [[45, 65], [64, 76]], earthy: [[38, 55], [42, 56]], deep: [[60, 80], [34, 46]] };
  const mood = pick(Object.keys(cfg)), m = cfg[mood], dark = chance(0.45);
  return {
    name: scheme.toUpperCase() + '·' + mood.toUpperCase(),
    bg: dark ? hslToHex(baseH + ri(-20, 20), rand(18, 35), rand(8, 14)) : hslToHex(baseH + ri(-20, 20), rand(12, 28), rand(91, 96)),
    ink: dark ? hslToHex(baseH, 12, 90) : hslToHex(baseH, 20, 12),
    colors: hues.map(h => hslToHex(h, rand(...m[0]), rand(...m[1]))),
    accent: hslToHex(baseH + 180, rand(78, 92), dark ? 58 : 52), dark,
  };
}
export const makePalette = () => chance(0.5) ? { ...pick(CURATED) } : generatedPalette();

/* ---------- clip-path shapes ---------- */
export const CLIPS = {
  triangle: 'polygon(50% 0%,100% 100%,0% 100%)', diamond: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
  pentagon: 'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)', hexagon: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
  octagon: 'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)',
  star: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
  cross: 'polygon(35% 0%,65% 0%,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0% 65%,0% 35%,35% 35%)',
  chevron: 'polygon(0% 0%,50% 50%,100% 0%,100% 35%,50% 85%,0% 35%)', kite: 'polygon(50% 0%,100% 40%,50% 100%,0% 40%)',
  parallelogram: 'polygon(25% 0%,100% 0%,75% 100%,0% 100%)', trapezoid: 'polygon(20% 0%,80% 0%,100% 100%,0% 100%)',
};
export const POLY = ['triangle', 'diamond', 'pentagon', 'hexagon', 'octagon', 'star', 'cross', 'chevron', 'kite', 'parallelogram', 'trapezoid'];

/* ---------- focal points ---------- */
export const thirds = () => [choice([1 / 3, 2 / 3]) * ctx.W, choice([1 / 3, 2 / 3]) * ctx.H];
export const loosePt = () => [choice([0.25, 0.33, 0.5, 0.67, 0.75]) * ctx.W, choice([0.25, 0.33, 0.5, 0.67, 0.75]) * ctx.H];
export const blendMode = () => ctx.P && ctx.P.dark ? 'screen' : 'multiply';

/* ---------- element factory ---------- */
export function el(style, t0, t1, anim = true) {
  const d = document.createElement('div');
  d.className = 'piece';
  Object.assign(d.style, style);
  if (anim && t1) {
    d.style.setProperty('--t0', t0 || 'scale(.85)');
    d.style.setProperty('--t1', t1);
    d.style.setProperty('--op', String(style.opacity ?? 1));
    d.style.transform = t1;
    d.style.animation = `fin .55s cubic-bezier(.2,.7,.25,1) ${Math.min(ctx.idx * 0.006, 0.4)}s both`;
  } else if (t1) d.style.transform = t1;
  ctx.root.appendChild(d); ctx.idx++; return d;
}
export function box({ x, y, w, h, color, rot = 0, radius = 0, opacity = 1, blend, z = 0, clip, border }) {
  return el({ left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', background: color || 'transparent', borderRadius: typeof radius === 'number' ? radius + 'px' : radius, opacity, mixBlendMode: blend || 'normal', zIndex: z, clipPath: clip || 'none', border: border || 'none' },
    `translate(-50%,-50%) rotate(${rot}deg) scale(.82)`, `translate(-50%,-50%) rotate(${rot}deg)`);
}
export const circle = o => box({ ...o, radius: '50%' });
export const ring = ({ x, y, d, w, color, z = 1 }) => box({ x, y, w: d, h: d, radius: '50%', border: `${w}px solid ${color}`, z });
export const wedge = ({ x, y, r, color, start = 0, sweep = 90, z = 1 }) => el({ left: x + 'px', top: y + 'px', width: r * 2 + 'px', height: r * 2 + 'px', borderRadius: '50%', zIndex: z, background: `conic-gradient(from ${start}deg, ${color} 0 ${sweep}deg, transparent ${sweep}deg)` }, 'translate(-50%,-50%) scale(.8)', 'translate(-50%,-50%)');
export const halfDisc = ({ x, y, r, color, rot = 0, z = 1 }) => el({ left: x + 'px', top: y + 'px', width: r * 2 + 'px', height: r + 'px', background: color, borderRadius: `${r}px ${r}px 0 0`, zIndex: z }, `translate(-50%,-50%) rotate(${rot}deg) scale(.8)`, `translate(-50%,-50%) rotate(${rot}deg)`);
export const line = ({ x, y, len, rot, thick, color, z = 2 }) => box({ x, y, w: len, h: thick, color, rot, z });
export const stripe = ({ x, y, w, h, rot, color, lw, gap }) => el({ left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', background: `repeating-linear-gradient(90deg, ${color} 0 ${lw}px, transparent ${lw}px ${lw + gap}px)` }, `translate(-50%,-50%) rotate(${rot}deg) scale(.85)`, `translate(-50%,-50%) rotate(${rot}deg)`);
export function rings({ x, y, r, colors, rw = null, square = false }) {
  const inner = Math.max(6, Math.round(r * rand(0.08, 0.16)));
  let cur = inner, sh = [], i = 0, g = 0;
  while (cur < r && g++ < 80) { const w = Math.max(3, rw || Math.round(r * rand(0.04, 0.1))); sh.push(`0 0 0 ${cur + w}px ${colors[i % colors.length]}`); cur += w; i++; }
  return el({ left: x + 'px', top: y + 'px', width: inner * 2 + 'px', height: inner * 2 + 'px', borderRadius: square ? '0' : '50%', background: colors[i % colors.length], boxShadow: sh.join(','), zIndex: 1 },
    'translate(-50%,-50%) scale(.6)', `translate(-50%,-50%) rotate(${square ? choice([0, 45]) : 0}deg)`);
}
export function nested({ x, y, r, clip, colors, layers = 4, rot = 0 }) { times(layers, i => { const s = r * 2 * (1 - i / (layers + 0.5)); box({ x, y, w: s, h: s, color: colors[i % colors.length], rot: rot + i * choice([0, 12, -12, 24]), clip, z: i }); }); }

export function shape(x, y, size, pool, opts = {}) {
  const col = opts.color || pick(pool), rot = opts.rot ?? choice([0, 15, 30, 45, 60, 90, 120, 180, 270]), r = size / 2;
  const k = opts.kind || pick(['circle', 'ring', 'donut', 'square', 'half', 'wedge', 'rings', ...POLY]);
  switch (k) {
    case 'circle': return circle({ x, y, w: size, h: size, color: col, blend: opts.blend, opacity: opts.opacity });
    case 'ring': return ring({ x, y, d: size, w: size * rand(0.1, 0.2), color: col });
    case 'donut': circle({ x, y, w: size, h: size, color: col, blend: opts.blend }); return circle({ x, y, w: size * rand(0.38, 0.55), h: size * rand(0.38, 0.55), color: ctx.P.bg, z: 2 });
    case 'square': return box({ x, y, w: size, h: size, color: col, rot, blend: opts.blend, opacity: opts.opacity });
    case 'half': return halfDisc({ x, y, r, color: col, rot });
    case 'wedge': return wedge({ x, y, r, color: col, start: rot, sweep: choice([60, 90, 120, 180, 270]) });
    case 'rings': return rings({ x, y, r, colors: shuffle([col, ...pool]), rw: Math.max(3, size * 0.08) });
    case 'nested': return nested({ x, y, r, clip: CLIPS[pick(['triangle', 'diamond', 'hexagon', 'pentagon'])], colors: shuffle([col, ...pool]), layers: ri(3, 5), rot });
    default: return box({ x, y, w: size, h: size, color: col, rot, clip: CLIPS[k], blend: opts.blend, opacity: opts.opacity });
  }
}

/* ---------- backgrounds (clean; no harsh patterns) ---------- */
export const bgFull = style => el({ left: 0, top: 0, width: ctx.W + 'px', height: ctx.H + 'px', zIndex: -5, ...style }, null, null, false);
export function setBg() {
  const kind = wpick([['solid', 4], ['split', 2], ['bands', 2], ['gradient', 2.5], ['quadrants', 1.5]]);
  ctx.root.style.background = chance(0.7) ? ctx.P.bg : mix(ctx.P.bg, pick(ctx.POOL), 0.1);
  if (kind === 'solid') return 0;
  if (kind === 'split') { const [a, b] = shuffle(ctx.POOL.length > 1 ? ctx.POOL : [ctx.POOL[0], mix(ctx.POOL[0], ctx.P.bg, 0.3)]); const at = ri(35, 65); bgFull({ background: `linear-gradient(${pick(['90deg', '0deg', '45deg', '135deg'])}, ${a} 0 ${at}%, ${b} ${at}% 100%)` }); return 0.25; }
  if (kind === 'bands') { const horiz = chance(0.5), n = ri(3, 7), cs = shuffle([...ctx.POOL, ctx.POOL[0]]); let p = 0, st = []; times(n, i => { const seg = rand(0.6, 1.6); st.push([p, p + seg, cs[i % cs.length]]); p += seg; }); const css = st.map(([s, e, c]) => `${c} ${(s / p * 100).toFixed(1)}% ${(e / p * 100).toFixed(1)}%`).join(','); bgFull({ background: `linear-gradient(${horiz ? '0deg' : '90deg'}, ${css})` }); return 0.4; }
  if (kind === 'gradient') { const cs = shuffle(ctx.POOL).slice(0, ri(2, 3)).map(c => mix(c, ctx.P.bg, 0.3)); bgFull({ background: chance(0.5) ? `linear-gradient(${ri(0, 360)}deg, ${cs.join(',')})` : `radial-gradient(circle at ${ri(20, 80)}% ${ri(20, 80)}%, ${cs.join(',')})` }); return 0.2; }
  const c = ri(2, 3), r = ri(2, 3), cw = ctx.W / c, ch = ctx.H / r, cs = shuffle([...ctx.POOL, ctx.P.accent]); let k = 0; times(r, ry => times(c, cx => box({ x: (cx + 0.5) * cw, y: (ry + 0.5) * ch, w: cw, h: ch, color: cs[(k++) % cs.length], z: -4 }))); return 0.45;
}

export function overlay() {
  //
}

export const coverScale = deg => { const r = Math.abs(deg) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return Math.max((ctx.W * c + ctx.H * s) / ctx.W, (ctx.W * s + ctx.H * c) / ctx.H) * 1.02; };

export function isoCube(x, y, s, base) {
  box({ x, y, w: s, h: s, color: mix(base, '#ffffff', .18), clip: 'polygon(50% 0%,100% 25%,50% 50%,0% 25%)' });
  box({ x, y, w: s, h: s, color: mix(base, '#000000', .28), clip: 'polygon(0% 25%,50% 50%,50% 100%,0% 75%)' });
  box({ x, y, w: s, h: s, color: mix(base, '#000000', .08), clip: 'polygon(50% 50%,100% 25%,100% 75%,50% 100%)' });
}

export function rawCornerArc(px, py, R, color, corner, z) {
  const br = ['0 0 100% 0', '0 0 0 100%', '100% 0 0 0', '0 100% 0 0'][corner];
  const lt = [[px, py], [px - R, py], [px - R, py - R], [px, py - R]][corner];
  el({ left: lt[0] + 'px', top: lt[1] + 'px', width: R + 'px', height: R + 'px', background: color, borderRadius: br, zIndex: z || 0 }, 'scale(.9)', 'none');
}
