// Stamps sw.js with a hash of the app files, so every change to the app gets a new offline cache.
// Usage: node tools/stamp-sw.mjs          (rewrites sw.js)
//        node tools/stamp-sw.mjs --check  (exits 1 if sw.js is stale)
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export function appHash() {
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const shell = JSON.parse(sw.match(/const SHELL=(\[[^\]]*\])/)[1].replace(/'/g, '"')).filter(u => u !== './');
  const h = createHash('sha256');
  for (const f of shell) { h.update(f); h.update(readFileSync(join(root, f))); }
  // the service worker's own logic is part of the version too (minus the version line itself)
  h.update(sw.replace(/const VERSION='[0-9a-f]+';/, ''));
  return h.digest('hex').slice(0, 12);
}
export function stampedVersion() { return readFileSync(join(root, 'sw.js'), 'utf8').match(/const VERSION='([0-9a-f]+)'/)[1]; }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const want = appHash(), have = stampedVersion();
  if (process.argv.includes('--check')) {
    if (want !== have) { console.error(`sw.js is stale: VERSION ${have}, app files hash to ${want}. Run: npm run stamp`); process.exit(1); }
    console.log(`sw.js VERSION ${have} matches the app files`);
  } else {
    const p = join(root, 'sw.js');
    writeFileSync(p, readFileSync(p, 'utf8').replace(/const VERSION='[0-9a-f]+';/, `const VERSION='${want}';`));
    console.log(`sw.js VERSION ${have} -> ${want}`);
  }
}
