// Writes the offline file list and version into sw.js, so every change to the app gets a fresh offline cache.
// The file list comes from index.html and games/registry.js: a new game is picked up automatically.
// Usage: node tools/stamp-sw.mjs          (rewrites sw.js)
//        node tools/stamp-sw.mjs --check  (exits 1 if sw.js is stale)
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { root, appFiles } from './games.mjs';

const SW = join(root, 'sw.js');
const shellLine = files => `const SHELL=[${['./', ...files].map(f => `'${f}'`).join(',')}];`;

/* sw.js with the current file list (the version line untouched) */
function withShell(sw) { return sw.replace(/const SHELL=\[[^\]]*\];/, shellLine(appFiles())); }

export function shellOf(sw = readFileSync(SW, 'utf8')) {
  return JSON.parse(sw.match(/const SHELL=(\[[^\]]*\])/)[1].replace(/'/g, '"')).filter(u => u !== './');
}

/* hash of every app file plus the service worker's own logic (minus the version line itself) */
export function appHash() {
  const sw = withShell(readFileSync(SW, 'utf8')), h = createHash('sha256');
  for (const f of shellOf(sw)) { h.update(f); h.update(readFileSync(join(root, f))); }
  h.update(sw.replace(/const VERSION='[0-9a-f]+';/, ''));
  return h.digest('hex').slice(0, 12);
}
export function stampedVersion() { return readFileSync(SW, 'utf8').match(/const VERSION='([0-9a-f]+)'/)[1]; }

/* every file the app can load must be in the offline list, or it breaks offline */
export function missingFromShell() {
  const shell = new Set(shellOf());
  return appFiles().filter(u => !shell.has(u));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const miss = missingFromShell();
    if (miss.length) { console.error(`sw.js offline list is missing: ${miss.join(', ')}. Run: npm run stamp`); process.exit(1); }
    const want = appHash(), have = stampedVersion();
    if (want !== have) { console.error(`sw.js is stale: VERSION ${have}, app files hash to ${want}. Run: npm run stamp`); process.exit(1); }
    console.log(`sw.js VERSION ${have} matches the app files`);
  } else {
    const have = stampedVersion();
    writeFileSync(SW, withShell(readFileSync(SW, 'utf8')));
    const want = appHash();
    writeFileSync(SW, readFileSync(SW, 'utf8').replace(/const VERSION='[0-9a-f]+';/, `const VERSION='${want}';`));
    console.log(`sw.js VERSION ${have} -> ${want} (${shellOf().length} files)`);
  }
}
