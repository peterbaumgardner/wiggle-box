// Lifecycle: entering, leaving, switching and reentering must not leak frames, listeners or state.
import { test, expect, GAME_KEYS, home, openGame, goBack, canvasBox } from './helpers.mjs';

/* Counts live listeners on window, document and #stage, and animation-frame callbacks, from page start. */
const instrument = `(()=>{
  const live=new Map();window.__live=live;
  const key=t=>t===window?'window':t===document?'document':(t&&t.id==='stage')?'stage':null;
  const A=EventTarget.prototype.addEventListener,R=EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener=function(type,fn,o){const k=key(this);if(k&&fn){const cap=!!(o===true||o&&o.capture);const id=k+'|'+type+'|'+cap;let s=live.get(id);if(!s)live.set(id,s=new Set());s.add(fn)}return A.call(this,type,fn,o)};
  EventTarget.prototype.removeEventListener=function(type,fn,o){const k=key(this);if(k&&fn){const cap=!!(o===true||o&&o.capture);const s=live.get(k+'|'+type+'|'+cap);s&&s.delete(fn)}return R.call(this,type,fn,o)};
  window.__liveCount=()=>{const o={};for(const [k,s] of live)if(s.size)o[k]=s.size;return o};
  window.__raf=0;const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>{if(cb.name!=='fxLoop')window.__raf++;cb(t)}); /* fxLoop is the shared confetti layer, which may still be finishing a celebration */
})();`;

async function poke(page, key) {
  const c = page.locator('#stage canvas:visible').first();
  if (await c.count()) {
    const b = await c.boundingBox();
    if (b && b.width > 40) {
      await page.mouse.move(b.x + b.width * .45, b.y + b.height * .45); await page.mouse.down();
      await page.mouse.move(b.x + b.width * .55, b.y + b.height * .5, { steps: 6 }); await page.mouse.up();
    }
  } else {
    const btn = page.locator('#stage button:visible, #stage [role=button]:visible').first();
    if (await btn.count()) await btn.click().catch(() => {});
  }
}

for (const key of GAME_KEYS) {
  test(`no leaked frames or listeners after leaving mid-animation: ${key}`, async ({ page }) => {
    await page.addInitScript(instrument);
    await home(page);
    await page.waitForTimeout(300);
    const base = await page.evaluate(() => window.__liveCount());
    for (let round = 0; round < 2; round++) {
      await openGame(page, key);
      await page.waitForTimeout(key === 'physics' ? 1200 : 300);
      await poke(page, key);
      await page.waitForTimeout(150);
      await goBack(page);            // leave while things are still moving
    }
    await page.waitForTimeout(2600);  // let any home-screen confetti finish
    const r0 = await page.evaluate(() => window.__raf);
    await page.waitForTimeout(1000);
    const frames = await page.evaluate(r0 => window.__raf - r0, r0);
    expect(frames, 'animation frames still running after leaving').toBeLessThanOrEqual(2);
    expect(await page.evaluate(() => window.__liveCount()), 'listeners left behind').toEqual(base);
  });
}

test('the full enter/leave/switch/reenter/reset sequence works for all 28 games in a row', async ({ page }) => {
  test.setTimeout(240_000);
  await home(page);
  for (let i = 0; i < GAME_KEYS.length; i++) {
    const key = GAME_KEYS[i], other = GAME_KEYS[(i + 7) % GAME_KEYS.length];
    await openGame(page, key);                 // 1. open
    await page.waitForTimeout(key === 'physics' ? 1000 : 150);
    await poke(page, key);                      // 2. interact
    await goBack(page);                         // 3. exit while running
    await openGame(page, other);                // 4. another game
    await goBack(page);                         // 5. home
    await openGame(page, key);                  // 6. reopen
    const reset = page.locator('#stage').getByRole('button', { name: /reset|clear|start over|again|new|empty|🧹|↺/i }).first();
    if (await reset.count() && await reset.isVisible()) await reset.click().catch(() => {}); // 7. reset
    await page.waitForTimeout(100);
    await goBack(page);                         // 8. exit again
  }
});

test('rapid switching between games never leaves two games running', async ({ page }) => {
  await page.addInitScript(instrument);
  await home(page);
  for (let i = 0; i < 20; i++) {
    const k = GAME_KEYS[(i * 5) % GAME_KEYS.length];
    await page.evaluate(k => { location.hash = k; }, k);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(800);
  expect(await page.locator('#stage > *').count()).toBeGreaterThan(0);
  await goBack(page);
  await page.waitForTimeout(2600);
  const r0 = await page.evaluate(() => window.__raf);
  await page.waitForTimeout(1000);
  expect(await page.evaluate(r0 => window.__raf - r0, r0)).toBeLessThanOrEqual(2);
});

test('the browser Back button and hash links open and close games', async ({ page }) => {
  await home(page);
  await page.goto('./#cannon');
  await page.waitForFunction(() => window.WiggleBox.ready === 'cannon');
  await page.evaluate(() => { location.hash = 'robo'; });
  await page.waitForFunction(() => window.WiggleBox.ready === 'robo');
  await page.evaluate(() => { location.hash = ''; });
  await expect(page.locator('#home')).toBeVisible();
  await expect(page.locator('#stage')).toBeEmpty();
});

test('Escape key goes home from any game', async ({ page }) => {
  await home(page);
  await openGame(page, 'graph');
  await page.keyboard.press('Escape');
  await expect(page.locator('#home')).toBeVisible();
});

test('hiding the tab pauses the game loop and showing it resumes without a jump', async ({ page }) => {
  await home(page);
  await openGame(page, 'space');
  const pos = () => page.evaluate(() => window.WiggleBox.games.space._debug.bodies.filter(b => !b.parent).map(b => [b.x, b.y]));
  await page.waitForTimeout(300);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  const a = await pos(); await page.waitForTimeout(800); const b = await pos();
  expect(b).toEqual(a);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(500);
  const c = await pos();
  const moved = c.map((p, i) => Math.hypot(p[0] - b[i][0], p[1] - b[i][1]));
  expect(Math.max(...moved)).toBeGreaterThan(0.5);
  expect(Math.max(...moved)).toBeLessThan(400);
});

test('stars survive a reload; corrupt or missing storage does not break the app', async ({ page }) => {
  await home(page);
  await page.evaluate(() => localStorage.setItem('wb-stars', '7'));
  await page.reload();
  await expect(page.locator('#home .starn')).toHaveText('7');
  await page.evaluate(() => { localStorage.setItem('wb-stars', 'banana'); localStorage.setItem('wb-tab', '???'); localStorage.setItem('wb-sound', '{'); });
  await page.reload();
  await expect(page.locator('#home .starn')).toHaveText('0');
  await expect(page.locator('.tile')).toHaveCount(28);
  await page.evaluate(() => localStorage.setItem('wb-stars', '-4'));
  await page.reload();
  await expect(page.locator('#home .starn')).toHaveText('0');
});

test('the app still works when storage throws (private mode, blocked site data)', async ({ page }) => {
  await page.addInitScript(() => {
    const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', { configurable: true, get: boom });
  });
  await page.goto('./');
  await expect(page.locator('.tile')).toHaveCount(28);
  await page.locator('.tile[data-g="forge"]').click();
  await page.waitForFunction(() => window.WiggleBox.ready === 'forge');
  await page.locator('#snd2').click();
  await goBack(page);
});
