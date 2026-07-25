// Build script: zip the extension into extension/versions/extension-<version>.zip
//
// Files are placed at the ROOT of the zip (manifest.json at top level), which Firefox requires and
// Chrome accepts. Hidden/AppleDouble junk (.DS_Store, ._*, .git…) is excluded, and the versions output
// dir is never zipped into itself. Version comes from the extension's manifest.json.
//
//   npm run build
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Zip } from '@greggman/zipup';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'extension');
const OUT_DIR = join(ROOT, 'versions');

const { version } = JSON.parse(readFileSync(join(SRC, 'manifest.json'), 'utf8'));
const outFile = join(OUT_DIR, `extension-${version}.zip`);

// skip dotfiles (.DS_Store, ._AppleDouble, .git, …) — anything whose name starts with a dot
const hidden = name => name.startsWith('.');
const files = [];
(function walk(dir, rel) {
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (hidden(e.name)) continue;
    if (!rel && e.name === 'versions') continue;                 // don't zip the output dir into the build
    const name = rel ? `${rel}/${e.name}` : e.name;              // root-relative, forward slashes
    if (e.isDirectory()) walk(join(dir, e.name), name);
    else if (e.isFile()) files.push({ name, data: readFileSync(join(dir, e.name)) });
  }
})(SRC, '');

if (!files.length) { console.error('build: no files found under extension/'); process.exit(1); }

const zip = new Zip();
for (const f of files) zip.addFile(f.name, f.data);              // slashes in name → folders inside the zip
const blob = await zip.finalize();

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(outFile, Buffer.from(await blob.arrayBuffer()));
console.log(`built ${relative(ROOT, outFile)} — ${files.length} files, ${(blob.size / 1024).toFixed(1)} KB`);
for (const f of files) console.log('  ' + f.name);
