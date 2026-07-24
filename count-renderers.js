// Counts how often each renderer gets picked. Serves the repo over a throwaway HTTP server (ES modules
// can't load from file://), loads index.html in puppeteer, reloads it N times, and reads the
// "RENDERER: <name>" line main.js logs on each load. Results print in SYSTEMS order.
//
//   node count-renderers.js [runs]        # default 300
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const RUNS = Number(process.argv[2]) || 300;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, rel === '/' ? 'index.html' : rel);
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();          // no escaping the repo
  fs.readFile(file, (err, buf) => {
    if (err) return res.writeHead(404).end('not found');
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    res.end(buf);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 750 });

let resolvePick = null;                                                  // set before each (re)load
page.on('console', msg => {
  const m = /^RENDERER:\s*(.+)$/.exec(msg.text());
  if (m && resolvePick) { const done = resolvePick; resolvePick = null; done(m[1].trim()); }
});
page.on('pageerror', e => console.error('page error:', e.message));

const counts = new Map();
process.stdout.write(`sampling ${RUNS} loads`);
for (let i = 0; i < RUNS; i++) {
  const picked = new Promise((res, rej) => {
    resolvePick = res;
    setTimeout(() => rej(new Error(`no RENDERER log within 20s (run ${i + 1})`)), 20000);
  });
  await (i === 0 ? page.goto(url, { waitUntil: 'domcontentloaded' })
                 : page.reload({ waitUntil: 'domcontentloaded' }));
  const name = await picked;
  counts.set(name, (counts.get(name) ?? 0) + 1);
  if ((i + 1) % 25 === 0) process.stdout.write('.');
}
process.stdout.write('\n\n');

// authoritative SYSTEMS order, read from the module the page itself loaded
const order = await page.evaluate(async () =>
  (await import('./extension/js/renderers/index.js')).SYSTEMS.map(s => s[0]));

const pad = Math.max(...order.map(n => n.length));
let total = 0;
for (const name of order) {
  const c = counts.get(name) ?? 0;
  total += c;
  console.log(`${name.padEnd(pad)}  ${String(c).padStart(4)}`);
}
// anything logged that isn't a SYSTEMS name (e.g. compose()'s 'Fallback')
for (const [name, c] of counts) if (!order.includes(name)) { total += c; console.log(`${name.padEnd(pad)}  ${String(c).padStart(4)}  (not in SYSTEMS)`); }

console.log(`\n${total} picks across ${order.length} systems · ${counts.size} distinct · ${order.filter(n => !counts.has(n)).length} never picked`);

await browser.close();
server.close();
