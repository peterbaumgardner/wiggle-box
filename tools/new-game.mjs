// Make a new game from games/_template and add it to the home screen.
// Usage: npm run new-game -- <key> "Game Title" [--section play|lab|math|think] [--icon 🦄] [--age 3+] [--blurb "..."]
//   e.g. npm run new-game -- bugs "Bug Hunt" --section play --icon 🐞 --age 3+
// Creates games/<key>/<key>.js, games/<key>/<key>.css and tests/games/<key>.spec.mjs, adds a line to games/registry.js
// and refreshes the offline cache list. Then open index.html#<key> to play it.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { root, readRegistry, REGISTRY } from './games.mjs';

const args = process.argv.slice(2), opt = {}, pos = [];
for (let i = 0; i < args.length; i++) if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i]; else pos.push(args[i]);
const [key, title] = pos;
const die = m => { console.error(m); process.exit(1); };
if (!key || !title) die('Usage: npm run new-game -- <key> "Game Title" [--section play|lab|math|think] [--icon 🦄] [--age 3+] [--blurb "..."]');
if (!/^[a-z][a-z0-9-]*$/.test(key)) die(`"${key}": use lower case letters, digits and dashes, starting with a letter`);
const reg = readRegistry();
if (reg.games.some(g => g.key === key) || existsSync(join(root, 'games', key))) die(`there is already a game called "${key}"`);
const section = opt.section || 'play';
if (!reg.sections.some(s => s.key === section)) die(`--section must be one of ${reg.sections.map(s => s.key).join(', ')}`);
const order = Math.max(0, ...reg.games.filter(g => g.section === section).map(g => g.order)) + 1;

const fill = s => s.replaceAll('__KEY__', key).replaceAll('__TITLE__', title);
const tpl = f => fill(readFileSync(join(root, 'games/_template', f), 'utf8'));
mkdirSync(join(root, 'games', key));
writeFileSync(join(root, 'games', key, key + '.js'), tpl('game.js'));
writeFileSync(join(root, 'games', key, key + '.css'), tpl('game.css'));
mkdirSync(join(root, 'tests/games'), { recursive: true });
writeFileSync(join(root, 'tests/games', key + '.spec.mjs'), tpl('game.spec.mjs'));

const q = s => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const line = `  {key:${q(key)}, title:${q(title)}, icon:${q(opt.icon || '✨')}, color:${q(opt.color || 'var(--sky)')}, age:${q(opt.age || '3+')}, section:${q(section)}, order:${order},\n` +
  `   blurb:${q(opt.blurb || 'A brand new game')}, css:true},\n`;
const p = join(root, REGISTRY), src = readFileSync(p, 'utf8'), end = src.lastIndexOf(']);');
writeFileSync(p, src.slice(0, end) + line + src.slice(end));

execFileSync(process.execPath, [join(root, 'tools/stamp-sw.mjs')], { stdio: 'inherit' });
console.log(`
Made "${title}":
  games/${key}/${key}.js         the game (a working multi-touch sample to change)
  games/${key}/${key}.css        its styles
  tests/games/${key}.spec.mjs    its tests
  games/registry.js            its home-screen tile (edit icon, colour, age, blurb there)
Play it:   npm run serve   then open http://127.0.0.1:4173/#${key}
Check it:  npm run check   and   npx playwright test tests/games/${key}.spec.mjs --project=desktop`);
