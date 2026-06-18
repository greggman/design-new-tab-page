import { normalizeHex } from './utils.js';

// A small set of pleasant theme colors to start from (browser toolbars / accent colors).
const PRESETS = [
  '#a04d93', '#1f4e9b', '#0d8a8a', '#2f7e7e', '#3f7d56', '#e0301e',
  '#d6402c', '#e8552d', '#d98b3a', '#e8b923', '#7b4fb0', '#c9617e',
  '#10172a', '#1d2620', '#2a1430', '#f3f1ec',
];

const well = document.getElementById('well');
const hex = document.getElementById('hex');
const status = document.getElementById('status');
const swatches = document.getElementById('swatches');
const apply = document.getElementById('apply');

const storage = globalThis.chrome?.storage;
const store = storage?.sync ?? storage?.local;   // prefer synced setting, fall back to local

function setInputs(color) {
  well.value = color;
  hex.value = color;
  apply.style.background = color;   // the "Use this color" button shows the chosen color
}

function showMatching(color) {
  status.className = 'matching';
  status.innerHTML = `New tabs use <b>${color}</b>.`;
}
function showRandom() {
  status.className = '';
  status.textContent = 'New tabs use random color palettes.';
}

// Persist the chosen base color (null = random palettes). The nonce always changes so an open new
// tab re-generates on every click — even when the color is the same or "Surprise me" is re-picked.
async function save(color) {
  try { await store?.set({ basecolor: color ?? null, nonce: Date.now() }); }
  catch { /* no storage in plain-page preview — UI still works */ }
  if (color) showMatching(color); else showRandom();
}

function applyHexField() {
  const c = normalizeHex(hex.value);
  if (!c) { setInputs(well.value); return; }   // invalid → revert to current well color
  setInputs(c);
  save(c);
}

// build preset swatches
for (const c of PRESETS) {
  const b = document.createElement('button');
  b.className = 'swatch';
  b.style.background = c;
  b.title = c;
  b.addEventListener('click', () => { setInputs(c); save(c); });
  swatches.appendChild(b);
}

well.addEventListener('input', () => { setInputs(well.value); save(well.value); });
hex.addEventListener('change', applyHexField);
hex.addEventListener('keydown', e => { if (e.key === 'Enter') applyHexField(); });
document.getElementById('apply').addEventListener('click', () => save(well.value));
document.getElementById('random').addEventListener('click', () => save(null));

// load the currently-stored color (if any)
(async () => {
  try {
    const got = await store?.get('basecolor');
    const c = normalizeHex(got?.basecolor);
    if (c) { setInputs(c); showMatching(c); return; }
  } catch { /* ignore */ }
  setInputs(well.value);   // no stored color: paint the button with the default well color
  showRandom();
})();
