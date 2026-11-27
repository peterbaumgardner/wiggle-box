// Fast health check, no browser needed (a few seconds). Run: npm run check
//   - every registry entry is complete and its files exist
//   - every game file calls defineGame('<its key>', {init(stage, g){...}}) and parses
//   - every game folder is in the registry (nothing forgotten), every platform script parses
//   - the offline cache list and version in sw.js are up to date
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { root, readRegistry, pageFiles, exists } from './games.mjs';
import { missingFromShell, appHash, stampedVersion } from './stamp-sw.mjs';

const problems = [];
const bad = (where, msg) => problems.push(`${where}: ${msg}`);
const parses = f => { try { execFileSync(process.execPath, ['--check', join(root, f)], { stdio: 'pipe' }); return true; } catch (e) { bad(f, String(e.stderr || e.message).trim().split('\n').slice(0, 4).join(' | ')); return false; } };

let reg;
try { reg = readRegistry(); } catch (e) { console.error(`games/registry.js does not run: ${e.message}`); process.exit(1); }

const SECTIONS = reg.sections.map(s => s.key);
const seen = new Set();
for (const g of reg.games) {
  const at = `registry ${g.key || '(no key)'}`;
  if (!/^[a-z][a-z0-9-]*$/.test(g.key || '')) bad(at, 'key must be lower case letters, digits or dashes');
  if (seen.has(g.key)) bad(at, 'duplicate key'); seen.add(g.key);
  for (const f of ['title', 'icon', 'age', 'blurb']) if (!g[f]) bad(at, `missing ${f}`);
  if (!SECTIONS.includes(g.section)) bad(at, `section must be one of ${SECTIONS.join(', ')}`);
  if (typeof g.order !== 'number') bad(at, 'order must be a number');
  for (const f of g.files) if (!exists(f)) bad(at, `file not found: ${f}`);
  const main = `games/${g.key}/${g.key}.js`;
  if (exists(main)) {
    if (parses(main)) {
      const src = readFileSync(join(root, main), 'utf8');
      if (!new RegExp(`defineGame\\(\\s*['"]${g.key}['"]`).test(src)) bad(main, `must call defineGame('${g.key}', {init(stage, g){...}})`);
    }
  }
  if (!g.css && exists(`games/${g.key}/${g.key}.css`)) bad(at, `games/${g.key}/${g.key}.css exists but the entry has no css:true, so it never loads`);
  for (const f of g.files) if (f.endsWith('.js') && f !== main && exists(f)) parses(f);
}
for (const d of readdirSync(join(root, 'games'))) {
  if (d.startsWith('_') || !statSync(join(root, 'games', d)).isDirectory()) continue;
  if (!seen.has(d)) bad(`games/${d}/`, 'folder is not in games/registry.js, so the game never shows up');
}
for (const f of pageFiles()) { if (!exists(f)) bad('index.html', `loads a missing file: ${f}`); else if (f.endsWith('.js')) parses(f); }

const miss = missingFromShell();
if (miss.length) bad('sw.js', `offline list is missing ${miss.join(', ')} (run: npm run stamp)`);
else if (appHash() !== stampedVersion()) bad('sw.js', 'offline version is stale (run: npm run stamp)');

if (problems.length) { console.error(`✗ ${problems.length} problem(s):\n  ` + problems.join('\n  ')); process.exit(1); }
console.log(`✓ ${reg.games.length} games in ${SECTIONS.length} sections, every file present and parsing, offline cache up to date`);
