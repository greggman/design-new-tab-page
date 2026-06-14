import { ctx, rand, ri, chance, pick, choice, shuffle, clamp, times, mix, lum, wpick, box, circle, ring, line, rings, panel, CLIPS } from '../utils.js';
// curated "hero" textures — existing renderers reused as a contained image inside the composition
import halftone from './halftone.js';
import concentricCircles from './concentricCircles.js';
import concentricSquares from './concentricSquares.js';
import spiral from './spiral.js';
import phyllotaxis from './phyllotaxis.js';
import wireframeTunnel from './wireframeTunnel.js';
import opWaves from './opWaves.js';
import ripple from './ripple.js';
import sunburst from './sunburst.js';
import moireRings from './moireRings.js';
import contourLines from './contourLines.js';
import flowField from './flowField.js';
import warpBands from './warpBands.js';
import plasma from './plasma.js';
import aurora from './aurora.js';
import lissajous from './lissajous.js';
import spirograph from './spirograph.js';
import dotSphere from './dotSphere.js';
import warpGrid from './warpGrid.js';
import stipple from './stipple.js';
import truchet from './truchet.js';
import arcTiles from './arcTiles.js';
import seigaiha from './seigaiha.js';
import lowPoly from './lowPoly.js';
import galaxy from './galaxy.js';
import isometric from './isometric.js';
import terrazzo from './terrazzo.js';
import hypnoRays from './hypnoRays.js';
import pinwheel from './pinwheel.js';
import interference from './interference.js';

// A composed poster: a focal hero (bold shape OR a clipped texture image reusing the pattern
// renderers), a strict margin grid, deliberate negative space, intentional palette roles, and
// abstract multi-script typography. Two families of layouts: text posters (type is central) and
// purely-visual posters composed *for* no text (so empty space is intentional, never a gap).

// FILL = textures that read edge-to-edge, so a rectangular panel's clip is clearly visible (looks
// finished). RADIAL = centered motifs that read as an emblem inside a circular panel.
const FILL = [halftone, opWaves, ripple, contourLines, flowField, warpBands, plasma, truchet, arcTiles, seigaiha, lowPoly, isometric, terrazzo, hypnoRays, warpGrid, dotSphere, interference, wireframeTunnel, aurora, sunburst, stipple, phyllotaxis];
const RADIAL = [concentricCircles, concentricSquares, spiral, moireRings, pinwheel, sunburst, hypnoRays, opWaves, ripple, phyllotaxis, galaxy, spirograph, lissajous, wireframeTunnel, dotSphere];

const SANS = `"Helvetica Neue", "Helvetica", Arial, sans-serif`;
const CONS = 'BCDFGHJKLMNPRSTVWXZ', VOW = 'AEIOU', FLAIR = 'ÖÄÅØ';
const word = len => { let s = '', c = chance(.5); for (let i = 0; i < len; i++) { const set = c ? CONS : VOW; s += set[Math.floor(Math.random() * set.length)]; c = !c; } return chance(.12) ? s.slice(0, -1) + pick([...FLAIR]) : s; };
const fromRange = (lo, hi, n) => { let s = ''; for (let i = 0; i < n; i++) s += String.fromCodePoint(ri(lo, hi)); return s; };
const digits = n => Array.from({ length: n }, () => ri(0, 9)).join('');

const SCRIPTS = [
  { n: 'latin', w: 2.2, font: SANS, adv: .60, cnt: [3, 8], gen: c => word(c) },
  { n: 'kanji', w: 2.2, font: `"Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif`, adv: 1.04, cnt: [2, 4], vert: 1, serif: 1, gen: c => fromRange(0x4E00, 0x9FA0, c) },
  { n: 'hiragana', w: 1.4, font: `"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif`, adv: 1.0, cnt: [3, 5], vert: 1, gen: c => fromRange(0x3041, 0x3096, c) },
  { n: 'katakana', w: 1.4, font: `"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif`, adv: 1.0, cnt: [3, 5], vert: 1, gen: c => fromRange(0x30A1, 0x30FA, c) },
  { n: 'hangul', w: 1.8, font: `"Apple SD Gothic Neo", "Nanum Gothic", "Malgun Gothic", sans-serif`, adv: 1.02, cnt: [2, 4], vert: 1, gen: c => fromRange(0xAC00, 0xD7A3, c) },
  { n: 'devanagari', w: 1.4, font: `"Kohinoor Devanagari", "Devanagari Sangam MN", "Nirmala UI", serif`, adv: .82, cnt: [3, 6], gen: c => fromRange(0x0905, 0x0939, c) },
  { n: 'thai', w: 1.3, font: `"Thonburi", "Sukhumvit Set", "Leelawadee UI", sans-serif`, adv: .74, cnt: [4, 7], gen: c => fromRange(0x0E01, 0x0E2E, c) },
  { n: 'greek', w: 1.0, font: SANS, adv: .60, cnt: [4, 8], gen: c => fromRange(0x03B1, 0x03C9, c) },
  { n: 'cyrillic', w: 1.0, font: SANS, adv: .62, cnt: [4, 8], gen: c => fromRange(0x0410, 0x044F, c) },
  { n: 'arabic', w: 1.1, font: `"Geeza Pro", "Baghdad", "Segoe UI", sans-serif`, adv: .92, cnt: [3, 6], gen: c => fromRange(0x0627, 0x064A, c) },
];
const pickScript = () => { const t = SCRIPTS.reduce((s, x) => s + x.w, 0); let r = Math.random() * t; for (const x of SCRIPTS) if ((r -= x.w) <= 0) return x; return SCRIPTS[0]; };

function txt(s, st) { const d = document.createElement('div'); d.className = 'piece'; d.textContent = s; Object.assign(d.style, { position: 'absolute', margin: '0', padding: '0', whiteSpace: 'pre', lineHeight: '1', zIndex: 6 }, st); ctx.root.appendChild(d); ctx.idx++; return d; }
function greek(x, y, w, lines, lh, col) { times(lines, i => { const lw = (i === lines - 1 ? rand(.35, .65) : rand(.82, 1)) * w; box({ x: x + lw / 2, y: y + i * lh, w: lw, h: lh * .3, color: col, radius: lh * .15, z: 6 }); }); }

export default function poster() {
  const W = ctx.W, H = ctx.H, S = ctx.S, P = ctx.P;
  const poolc = shuffle([...ctx.POOL]);
  const paper = P.bg;                                                                  // clean ground (no muddy colored fills)
  const ink = Math.abs(lum(P.ink) - lum(paper)) >= Math.abs(lum(P.bg) - lum(paper)) ? P.ink : P.bg;  // text contrasts paper
  const cand = [...poolc, P.accent].filter(c => Math.abs(lum(c) - lum(paper)) > .2);
  const dom = cand[0] || mix(ink, paper, .5), accent = cand[1] || cand[0] || P.accent, soft = mix(ink, paper, .35);
  const m = S * rand(.075, .1);
  ctx.root.style.background = paper;
  box({ x: W / 2, y: H / 2, w: W, h: H, color: paper, z: -10 });
  ctx._hero = ''; ctx._script = '';
  const PSC = pickScript();   // ONE script per poster — captions may also use neutral Latin/numerals,
                              // but two different non-Latin scripts never appear together.

  const shapeOf = (k, w, h) => k === 'circle' ? { radius: '50%' } : k === 'pill' ? { radius: Math.min(w, h) / 2 + 'px' } : k === 'arch' ? { radius: `${w / 2}px ${w / 2}px ${S * .02}px ${S * .02}px` } : k === 'hex' ? { clip: CLIPS.hexagon } : k === 'diamond' ? { clip: CLIPS.diamond } : {};
  const heroTexture = (x, y, w, h, k) => {
    const fn = pick(k === 'circle' || k === 'hex' ? RADIAL : FILL);   // fill textures in rects, emblem motifs in circles
    ctx._hero = fn.name || 'hero';
    const full = w >= W - 1 && h >= H - 1;
    const bg = full ? paper : mix(paper, ink, rand(.08, .16));         // subtle mat so a bounded panel always reads
    panel({ x, y, w, h, ...shapeOf(k, w, h), bg, z: 0 }, fn);
    if (!full && chance(.25) && (k === 'rect' || k === 'arch')) box({ x, y, w, h, color: 'transparent', border: `${Math.max(2, S * .004)}px solid ${ink}`, z: 1 });
    else if (!full && chance(.25) && k === 'circle') ring({ x, y, d: w, w: Math.max(2, S * .004), color: ink, z: 1 });
  };
  const hero = heroTexture;   // the generative texture IS the artwork — flat shapes read as boring/samey

  const caption = (x, y, align = 'left', col = ink) => {
    const glyph = chance(.4);   // either this poster's script, or neutral Latin/numeral furniture
    const s = glyph ? PSC.gen(ri(3, 6)) : choice([`N${digits(2)}`, `${digits(2)}.${digits(2)}–${digits(2)}.${digits(2)}`, `${word(3)} ${digits(4)}`, digits(4)]);
    txt(s, { left: x + 'px', top: y + 'px', fontFamily: glyph ? PSC.font : SANS, fontSize: (S * .017) + 'px', fontWeight: 700, letterSpacing: '.2em', color: col, transform: align === 'right' ? 'translateX(-100%)' : align === 'center' ? 'translateX(-50%)' : 'none' });
  };
  const topRule = () => { line({ x: W / 2, y: m * 1.4, len: W - 2 * m, rot: 0, thick: Math.max(2, S * .004), color: ink, z: 6 }); caption(m, m * 1.4 + S * .022, 'left'); if (chance(.7)) caption(W - m, m * 1.4 + S * .022, 'right'); };
  const bigNum = (x, y, align = 'left', col = ink) => txt(digits(2), { left: x + 'px', top: y + 'px', fontFamily: SANS, fontWeight: 800, fontSize: (S * .11) + 'px', color: col, lineHeight: .8, transform: align === 'right' ? 'translateX(-100%)' : 'none' });
  // big display title (any script, optional multi-line for latin / vertical for CJK)
  const title = (x, y, maxW, maxF, o = {}) => {
    const align = o.align || 'left', color = o.color || ink, vertical = o.vertical, lines = o.lines || 1;
    const sc = PSC; ctx._script = sc.n;
    const tx = a => a === 'center' ? 'translateX(-50%)' : a === 'right' ? 'translateX(-100%)' : 'none';
    if (sc.n === 'latin' && lines > 1 && !vertical) {
      const F = Math.min(maxF, S * .6 / lines), mx = clamp(Math.floor(maxW / (F * sc.adv)), 3, 9); let yy = y;   // cap so the block can't overflow
      times(lines, i => { txt(word(ri(3, mx)), { left: x + 'px', top: yy + 'px', fontFamily: sc.font, fontWeight: 800, fontSize: F + 'px', lineHeight: .88, letterSpacing: '-.02em', color: (i === 0 && chance(.4)) ? accent : color, transform: tx(align) }); yy += F * .88; });
      return lines * F * .88;
    }
    const cnt = ri(sc.cnt[0], sc.cnt[1]), t = sc.gen(cnt), F = clamp(maxW / (cnt * sc.adv), maxF * .45, maxF);
    if (vertical && sc.vert) { txt(t, { left: x + 'px', top: y + 'px', fontFamily: sc.font, fontWeight: sc.serif ? 600 : 800, fontSize: F + 'px', writingMode: 'vertical-rl', letterSpacing: '.04em', color }); return F * cnt; }
    if (vertical) { txt(t, { left: x + 'px', top: y + 'px', fontFamily: sc.font, fontWeight: 800, fontSize: F + 'px', transformOrigin: '0 0', transform: 'rotate(-90deg)', letterSpacing: '.02em', color }); return F; }
    txt(t, { left: x + 'px', top: y + 'px', fontFamily: sc.font, fontWeight: sc.serif ? 600 : 800, fontSize: F + 'px', lineHeight: .9, letterSpacing: sc.adv > .9 ? '.02em' : '-.01em', color, transform: tx(align) });
    return F;
  };

  // ===================== PARAMETRIC COMPOSER =====================
  // Instead of fixed templates, assemble from orthogonal choices: a grid-snapped hero rect (its
  // orientation / span / position / bleed / shape), then DERIVE where type goes from the leftover
  // negative space (which strip is biggest; vertical type if that strip is tall-and-narrow; flush-
  // out / flush-in / centered; single or stacked). This one path subsumes most templated layouts.
  const para = () => {
    const A = [0, .2, .25, 1 / 3, .5, 2 / 3, .75, .8, 1];
    const span = (lo, hi) => { for (let t = 0; t < 24; t++) { let a = pick(A), b = pick(A); if (a > b)[a, b] = [b, a]; if (b - a >= lo && b - a <= hi) return [a, b]; } return [.5 - lo / 2, .5 + lo / 2]; };
    const cw = W - 2 * m, chh = H - 2 * m, Xf = f => m + f * cw, Yf = f => m + f * chh;
    const form = pick(['wide', 'wide', 'tall', 'tall', 'block', 'block', 'block', 'full', 'full']);
    let fx0, fx1, fy0, fy1;
    if (form === 'wide') { [fy0, fy1] = span(.28, .56); fx0 = 0; fx1 = 1; }
    else if (form === 'tall') { [fx0, fx1] = span(.28, .5); fy0 = 0; fy1 = 1; }
    else if (form === 'block') { [fx0, fx1] = span(.4, .74); [fy0, fy1] = span(.4, .74); }
    else { fx0 = 0; fx1 = 1; fy0 = 0; fy1 = 1; }
    // bleed past the margin to the true edge when a side is flush to the content edge
    const hx0 = fx0 <= 0 && chance(.7) ? 0 : Xf(fx0), hx1 = fx1 >= 1 && chance(.7) ? W : Xf(fx1);
    const hy0 = fy0 <= 0 && chance(.7) ? 0 : Yf(fy0), hy1 = fy1 >= 1 && chance(.7) ? H : Yf(fy1);
    let HW = hx1 - hx0, HH = hy1 - hy0, CX = (hx0 + hx1) / 2, CY = (hy0 + hy1) / 2;
    let shp = form === 'full' ? 'rect' : wpick([['rect', 5], ['arch', 2.2], ['circle', 1.2], ['hex', .8], ['pill', 1]]);
    if (shp === 'circle' || shp === 'hex') { const d = Math.min(HW, HH); HW = HH = d; }
    hero(CX, CY, HW, HH, shp);

    // negative-space strips around the hero (clamped to content) → the type zone
    const cl = clamp(hx0, m, W - m), cr = clamp(hx1, m, W - m), ctp = clamp(hy0, m, H - m), cbt = clamp(hy1, m, H - m);
    const strips = [];
    if (ctp - m > chh * .14) strips.push({ x: m, y: m, w: cw, h: ctp - m, side: 'top' });
    if (H - m - cbt > chh * .14) strips.push({ x: m, y: cbt, w: cw, h: H - m - cbt, side: 'bottom' });
    if (cl - m > cw * .18) strips.push({ x: m, y: m, w: cl - m, h: chh, side: 'left' });
    if (W - m - cr > cw * .18) strips.push({ x: cr, y: m, w: W - m - cr, h: chh, side: 'right' });
    strips.sort((a, b) => b.w * b.h - a.w * a.h);
    const zone = strips[0];

    if (!zone) {                                                 // no room → type on a scrim band over the hero
      const bandH = S * rand(.24, .32), by = pick([.16, .5, .84]) * H, bc = chance(.5) ? paper : ink, tc = lum(bc) > .5 ? P.ink : P.bg;
      box({ x: W / 2, y: by, w: W, h: bandH, color: bc, z: 5 });
      title(m, by - bandH * .28, W - 2 * m, S * .12, { color: tc }); caption(m, by + bandH * .16, 'left', tc);
      return `para:${form}/overlap`;
    }

    const pad = S * .025;
    if (zone.h > zone.w * 1.3) {                                 // tall narrow strip → vertical (CJK) or small column
      if (PSC.vert) title(zone.x + zone.w * .36, zone.y + pad, zone.h - 2 * pad, Math.min(S * .18, zone.w * .8), { vertical: true, color: chance(.3) ? accent : ink });
      else title(zone.x + pad, zone.y + zone.h * .42, zone.w - 2 * pad, Math.min(S * .1, zone.w * .72), { color: chance(.3) ? accent : ink });
      caption(zone.x + zone.w / 2, zone.y + pad, 'center');
    } else {                                                     // wide strip → flush-out / flush-in / centered
      const ax = pick(['out', 'out', 'in', 'center']), cxL = zone.x + pad, cxR = zone.x + zone.w - pad, cxC = zone.x + zone.w / 2;
      const x = ax === 'out' ? cxL : ax === 'in' ? cxR : cxC, align = ax === 'out' ? 'left' : ax === 'in' ? 'right' : 'center';
      const multi = zone.h > S * .34 && chance(.45), ty = zone.y + zone.h * pick([.26, .4, .5]) - (multi ? S * .05 : 0);
      title(x, ty, zone.w - 2 * pad, Math.min(S * .24, zone.h * (multi ? .34 : .58)), { align, color: chance(.3) ? accent : ink, lines: multi ? ri(2, 3) : 1 });
      if (chance(.85)) caption(ax === 'in' ? cxR : cxL, zone.y + pad, ax === 'in' ? 'right' : 'left');
      if (chance(.5)) bigNum(ax === 'in' ? cxL : cxR, zone.y + zone.h - pad - S * .12, ax === 'in' ? 'left' : 'right', accent);
    }
    return `para:${form}/${zone.side}`;
  };

  // IMAGE-DOMINANT — the texture is the poster; type rides a solid edge band (always legible, no gaps).
  const image = () => {
    if (chance(.62)) heroTexture(W / 2, H / 2, W, H, 'rect');
    else if (chance(.5)) heroTexture(W / 2, H * rand(.34, .46), W, H * rand(.6, .76), 'rect');
    else heroTexture(W * rand(.42, .52), H / 2, W * rand(.64, .8), H, 'rect');
    const bandH = S * rand(.17, .25), top = chance(.5), by = top ? bandH / 2 : H - bandH / 2;
    const bc = chance(.55) ? paper : ink, tc = lum(bc) > .5 ? P.ink : P.bg;
    box({ x: W / 2, y: by, w: W, h: bandH, color: bc, z: 5 });
    title(m, by - bandH * .26, W - 2 * m, S * .13, { color: chance(.25) ? accent : tc });
    if (chance(.85)) caption(m, by + bandH * .2, 'left', tc);
    if (chance(.4)) bigNum(W - m, by - bandH * .26, 'right', accent);
    return 'image';
  };

  // TYPE-DOMINANT — big type is the subject. Any supporting image must be SUBSTANTIAL (full-width
  // band or full-height column) or absent (pure typographic poster) — never a tiny postage stamp.
  const typed = () => {
    caption(m, m * 1.4); if (chance(.6)) bigNum(W - m, m * 1.4, 'right', accent);
    const sup = pick(['col', 'bandB', 'pure', 'pure']);
    if (sup === 'col') {
      const cw2 = W * rand(.28, .36);
      heroTexture(W - m - cw2 / 2, H / 2, cw2, H - 2 * m, 'rect');
      title(m, H * rand(.32, .46), W - cw2 - 3 * m, S * rand(.24, .34), { color: chance(.4) ? accent : ink, lines: chance(.5) ? 2 : 1 });
      greek(m, H - m - S * .05, Math.min(W - cw2 - 3 * m, S * .3), 1, S * .026, soft);
    } else if (sup === 'bandB') {
      heroTexture(W / 2, H - m - H * .12, W - 2 * m, H * rand(.18, .26), 'rect');
      title(m, H * rand(.24, .36), W - 2 * m, S * rand(.28, .4), { color: chance(.4) ? accent : ink, lines: chance(.5) ? 2 : 1 });
    } else {
      title(m, H * rand(.3, .42), W - 2 * m, S * rand(.3, .44), { color: chance(.4) ? accent : ink, lines: chance(.55) ? ri(2, 3) : 1 });
      if (chance(.6)) line({ x: W / 2, y: H * rand(.2, .27), len: W - 2 * m, rot: 0, thick: Math.max(2, S * .004), color: ink, z: 6 });
      greek(m, H - m - S * .08, S * rand(.3, .5), ri(2, 3), S * .028, soft);
    }
    return 'type';
  };

  // SPECIALS — distinct gestalts, all carrying type.
  const SPECIAL = {
    emblem() { const cy = H * rand(.4, .45), d = S * rand(.42, .56); hero(W / 2, cy, d, d, pick(['circle', 'hex', 'arch'])); title(W / 2, cy + d * .62, S * .5, S * .085, { align: 'center' }); caption(W / 2, m * 1.3, 'center'); caption(W / 2, H - m * 1.4, 'center'); },
    diagonal() { box({ x: W * rand(.42, .58), y: H * rand(.4, .6), w: Math.hypot(W, H) * rand(.6, .85), h: S * rand(.12, .2), color: dom, rot: choice([18, -18, 26, -26]), z: 0 }); if (chance(.6)) heroTexture(W * rand(.62, .8), H * rand(.2, .36), S * rand(.2, .28), S * rand(.2, .28), pick(['circle', 'rect'])); title(m, H * rand(.32, .5), W * .72, S * .18, { color: ink, lines: chance(.4) ? 2 : 1 }); caption(m, m * 1.4); bigNum(W - m, H - m - S * .12, 'right', accent); },
    panels() {
      const reserve = H * .12, areaH = H - 2 * m - reserve, mode = pick(['row', 'row', 'row', 'col', 'grid']);
      if (mode === 'row') { const n = choice([2, 3, 3, 4, 5, 6]), gap = m * .55, pw = (W - 2 * m - (n - 1) * gap) / n; times(n, i => hero(m + pw / 2 + i * (pw + gap), m + areaH / 2, pw, areaH, 'rect')); }
      else if (mode === 'col') { const n = choice([2, 3, 4]), gap = m * .5, ph = (areaH - (n - 1) * gap) / n; times(n, i => hero(W / 2, m + ph / 2 + i * (ph + gap), W - 2 * m, ph, 'rect')); }
      else { const cols = choice([2, 3]), rows = choice([2, 3]), gap = m * .5, pw = (W - 2 * m - (cols - 1) * gap) / cols, ph = (areaH - (rows - 1) * gap) / rows; times(rows, r => times(cols, c => hero(m + pw / 2 + c * (pw + gap), m + ph / 2 + r * (ph + gap), pw, ph, 'rect'))); }
      caption(m, H - m, 'left'); title(W - m, H - m - S * .035, W * .55, S * .085, { align: 'right' });
    },
  };

  const r = Math.random();
  let lay;
  if (r < .34) lay = image();
  else if (r < .60) lay = typed();
  else if (r < .85) lay = para();
  else { const k = pick(Object.keys(SPECIAL)); SPECIAL[k](); lay = k; }
  ctx.note = `${lay} · ${ctx._hero || '—'}${ctx._script ? ' · ' + ctx._script : ''}`;
}
