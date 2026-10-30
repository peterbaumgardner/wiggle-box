// Shared test fixtures and helpers for the Wiggle Box suite.
import { test as base, expect } from '@playwright/test';

export { expect };

/* The 28 games the app must register. */
export const GAME_KEYS = [
  'atoms', 'balance', 'bridge', 'cannon', 'chance', 'circuit', 'bubbles', 'paint', 'feed', 'shapes', 'music', 'words',
  'fireworks', 'forge', 'potion', 'geo', 'graph', 'art', 'laser', 'physics', 'primes', 'puzzles', 'robo', 'sand',
  'space', 'splash', 'trace', 'waves',
];

/* Requests we deliberately block in tests: the optional Google Fonts stylesheet. The app must work without it,
   so blocking it proves the fallback fonts carry the game. Its failed load is the only console error we ignore. */
const OPTIONAL = /fonts\.(googleapis|gstatic)\.com/;
const IGNORED_CONSOLE = [
  /Failed to load resource: net::ERR_FAILED/,          // the blocked optional font request
  /Failed to load resource: net::ERR_INTERNET_DISCONNECTED/, // offline tests: the optional font request
];

/* Deterministic Math.random for tests that need repeatable randomness (mulberry32). Production stays random. */
export const seedScript = seed => `(()=>{let a=${seed >>> 0};Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();`;

export const test = base.extend({
  seed: [null, { option: true }],
  errors: async ({}, use) => { await use({ page: [], console: [], requests: [], warnings: [] }); },
  page: async ({ page, seed, errors }, use, testInfo) => {
    if (seed != null) await page.addInitScript(seedScript(seed));
    await page.route(OPTIONAL, r => r.abort());
    page.on('pageerror', e => errors.page.push(`${e.message}\n${(e.stack || '').split('\n').slice(0, 4).join('\n')}`));
    page.on('console', m => {
      const t = m.text();
      if (m.type() === 'error' && !IGNORED_CONSOLE.some(r => r.test(t))) errors.console.push(t);
      if (m.type() === 'warning') errors.warnings.push(t);
    });
    page.on('requestfailed', r => { if (!OPTIONAL.test(r.url())) errors.requests.push(`${r.url()} ${r.failure()?.errorText}`); });
    await use(page);
    if (errors.warnings.length) testInfo.annotations.push({ type: 'browser-warnings', description: [...new Set(errors.warnings)].join(' | ') });
    if (!testInfo.annotations.some(a => a.type === 'allow-errors')) {
      expect(errors.page, 'uncaught page errors').toEqual([]);
      expect(errors.console, 'console errors').toEqual([]);
      expect(errors.requests, 'failed requests').toEqual([]);
    }
  },
});

/* Go to the home screen with a clean slate. */
export async function home(page, { clearStorage = true } = {}) {
  await page.goto('./');
  if (clearStorage) { await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await page.goto('./'); }
  await expect(page.locator('#home')).toBeVisible();
  await page.waitForFunction(() => window.WiggleBox && document.querySelectorAll('.tile').length > 0);
}

/* Open a game the way a child does: tap its tile. Waits for the game to finish initialising. */
export async function openGame(page, key, { tap = false } = {}) {
  const tile = page.locator(`.tile[data-g="${key}"]`);
  await tile.scrollIntoViewIfNeeded();
  if (tap) await tile.tap(); else await tile.click();
  await expect(page.locator('#game')).toBeVisible();
  await page.waitForFunction(k => window.WiggleBox.ready === k, key, { timeout: 15_000 });
}

export async function goBack(page) {
  await page.locator('#back').click();
  await expect(page.locator('#home')).toBeVisible();
}

/* Read a value from a game's _debug object. fn is a string body taking (d, G, W) => value. */
export function dbg(page, key, fn, arg) {
  fn = typeof fn === 'function' ? fn.toString() : fn;
  return page.evaluate(([k, f, a]) => { const G = window.WiggleBox.games[k]; return new Function('d', 'G', 'W', 'a', `return (${f})(d,G,W,a)`)(G._debug, G, window.WiggleBox, a); }, [key, fn, arg]);
}

/* Wait until a debug expression is truthy. */
export async function waitDbg(page, key, fn, { timeout = 10_000, arg } = {}) {
  fn = typeof fn === 'function' ? fn.toString() : fn;
  await page.waitForFunction(([k, f, a]) => { const G = window.WiggleBox.games[k]; try { return new Function('d', 'G', 'W', 'a', `return (${f})(d,G,W,a)`)(G._debug, G, window.WiggleBox, a); } catch (e) { return false; } }, [key, fn, arg], { timeout });
}

/* Bounding box of the visible game canvas. */
export async function canvasBox(page, sel = '#stage canvas:visible') {
  const c = page.locator(sel).first();
  await expect(c).toBeVisible();
  return c.boundingBox();
}

/* Mouse drag through a list of [x,y] client points. */
export async function mouseDrag(page, pts, { steps = 6, delay = 0 } = {}) {
  await page.mouse.move(pts[0][0], pts[0][1]);
  await page.mouse.down();
  for (let i = 1; i < pts.length; i++) { await page.mouse.move(pts[i][0], pts[i][1], { steps }); if (delay) await page.waitForTimeout(delay); }
  await page.mouse.up();
}

/* Real touch input through the Chrome DevTools protocol (Playwright only has touchscreen.tap). */
export async function touchSession(page) {
  const cdp = await page.context().newCDPSession(page);
  const send = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y], i) => ({ x, y, id: i, radiusX: 4, radiusY: 4, force: 1 })) });
  return {
    async drag(pts, { steps = 6, delay = 16 } = {}) {
      await send('touchStart', [pts[0]]);
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        for (let s = 1; s <= steps; s++) { await send('touchMove', [[x0 + (x1 - x0) * s / steps, y0 + (y1 - y0) * s / steps]]); if (delay) await page.waitForTimeout(delay); }
      }
      await send('touchEnd', []);
    },
    async tap(x, y) { await send('touchStart', [[x, y]]); await page.waitForTimeout(30); await send('touchEnd', []); },
    async multi(frames, delay = 16) { // frames: array of arrays of [x,y] for each finger; [] ends
      await send('touchStart', frames[0]);
      for (let i = 1; i < frames.length - 1; i++) { await send('touchMove', frames[i]); if (delay) await page.waitForTimeout(delay); }
      await send('touchEnd', []);
    },
  };
}

/* Is an element fully inside the viewport and not covered at its centre? */
export async function reachable(page, locator) {
  const box = await locator.boundingBox();
  if (!box) return { ok: false, why: 'no box' };
  const vp = page.viewportSize();
  if (box.x < -1 || box.y < -1 || box.x + box.width > vp.width + 1 || box.y + box.height > vp.height + 1) return { ok: false, why: `outside viewport ${JSON.stringify(box)}` };
  const hit = await locator.evaluate(el => { const r = el.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && (el === t || el.contains(t)); });
  return hit ? { ok: true } : { ok: false, why: 'covered by another element' };
}

/* Advance the app's clock deterministically isn't possible with rAF, so tests wait on observable state instead. */
export const sleep = (page, ms) => page.waitForTimeout(ms);

/* Click a toolbar button the way a child would, even when the toolbar has folded that group into a "▾" or "⋯" menu
   on a small screen: open each fold menu until the matching item shows up, then tap it. */
export async function pick(page, container, selector) {
  const target = page.locator(`${container} ${selector}`).first();
  if (await target.isVisible()) { await target.click(); return; }
  const html = await target.evaluate(el => el.innerHTML);
  const folds = page.locator(`${container} .cgbtn:not(.cgend)`);
  for (let i = 0; i < await folds.count(); i++) {
    await folds.nth(i).click();
    const items = page.locator('.pop .popitem');
    const n = await items.count();
    for (let k = 0; k < n; k++) if (await items.nth(k).evaluate((el, h) => el.innerHTML === h, html)) { await items.nth(k).click(); return; }
    await page.keyboard.press('Escape');
  }
  throw new Error(`could not reach ${container} ${selector}`);
}
