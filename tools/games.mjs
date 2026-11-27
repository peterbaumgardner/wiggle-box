// Reads the game list (games/registry.js) and the page's own files, for the tools and the tests.
// The registry is a browser script; here it runs in a sandbox with stand-ins for registerSections/registerGames.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const REGISTRY = 'games/registry.js';

/* [{key, title, ..., files:[every file the game loads, in order]}] exactly as the app will see them */
export function readRegistry() {
  const out = { sections: [], games: [] };
  const ctx = { registerSections: s => { out.sections = s; }, registerGames: g => { out.games.push(...g); } };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(join(root, REGISTRY), 'utf8'), ctx, { filename: REGISTRY });
  for (const g of out.games) {
    const dir = `games/${g.key}/`;
    g.files = [...(g.files || []), dir + g.key + '.js', ...(g.css ? [dir + g.key + '.css'] : [])];
  }
  return out;
}

export const gameKeys = () => readRegistry().games.map(g => g.key);

/* files index.html itself loads (scripts, styles, icons, manifest), in page order */
export function pageFiles() {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  return [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m => m[1]);
}

/* everything the app can ever load: the offline cache must hold all of it */
export function appFiles() {
  const files = ['index.html', ...pageFiles(), ...readRegistry().games.flatMap(g => g.files),
    'matter.min.js',   // Physics Lab loads its engine itself
    'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'];
  return [...new Set(files)].filter(f => f !== './');
}

export const exists = f => existsSync(join(root, f));
