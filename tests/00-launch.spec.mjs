// Every game: registered, launches, draws something, leaves cleanly, comes back cleanly.
import { test, expect, GAME_KEYS, CORE_GAMES, home, openGame, goBack } from './helpers.mjs';

test('the registry lists every game (none of the original ones lost), each with a home tile and loadable code', async ({ page }) => {
  await home(page);
  for (const k of CORE_GAMES) expect(GAME_KEYS, k).toContain(k);
  const keys = await page.evaluate(() => Object.keys(window.WiggleBox.games));
  expect(keys.sort()).toEqual([...GAME_KEYS].sort());
  const tiles = await page.$$eval('.tile', ts => ts.map(t => t.dataset.g));
  expect(tiles.sort()).toEqual([...GAME_KEYS].sort());
  for (const k of GAME_KEYS) {
    const g = await page.evaluate(async k => { const G = await window.WiggleBox.load(k); return { t: G.title, i: typeof G.init }; }, k);
    expect(g.i, k).toBe('function');
    expect(g.t, k).toBeTruthy();
  }
});

test.describe('a broken game', () => {
  test.use({ serviceWorkers: 'block' });   // the offline cache would serve the file the test is blocking
  test('a game whose file fails to load shows Oops in that game only; the home screen and other games still work', async ({ page }) => {
    test.info().annotations.push({ type: 'allow-errors', description: 'the missing file is on purpose' });
    await page.route(/games\/bubbles\/bubbles\.js/, r => r.fulfill({ status: 404, body: 'not found' }));
    await home(page);
    await page.locator('.tile[data-g="bubbles"]').click();
    await expect(page.locator('#stage')).toContainText('could not load');
    await goBack(page);
    await openGame(page, 'shapes');
    await goBack(page);
  });
});

/* Is something actually drawn? For canvas games: count non-uniform pixels. For DOM games: count visible controls. */
async function rendered(page) {
  return page.evaluate(() => {
    const st = document.querySelector('#stage');
    const cvs = [...st.querySelectorAll('canvas')].filter(c => c.offsetWidth > 20 && c.offsetHeight > 20 && !c.hidden);
    let px = 0;
    for (const c of cvs) {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      const seen = new Set();
      for (let i = 0; i < d.length; i += 4 * 97) { seen.add((d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | d[i + 2] >> 4); if (seen.size > 6) break; }
      px = Math.max(px, seen.size);
    }
    const btns = [...st.querySelectorAll('button,[role=button]')].filter(b => b.offsetWidth > 0).length;
    return { canvases: cvs.length, colors: px, buttons: btns };
  });
}

for (const key of GAME_KEYS) {
  test(`launch, render, exit and reenter: ${key}`, async ({ page }) => {
    await home(page);
    await openGame(page, key);
    await page.waitForTimeout(key === 'physics' ? 1500 : 600);
    const r1 = await rendered(page);
    expect(r1.canvases + r1.buttons, 'something on screen').toBeGreaterThan(0);
    if (r1.canvases && key !== 'paint') expect(r1.colors, 'canvas has a real picture').toBeGreaterThan(2); // paint starts as a blank sheet
    await expect(page.locator('#gtitle')).not.toBeEmpty();
    await page.screenshot({ path: test.info().outputPath(`${key}-open.png`) });
    await goBack(page);
    await expect(page.locator('#stage')).toBeEmpty();
    await openGame(page, key);
    await page.waitForTimeout(key === 'physics' ? 1500 : 500);
    const r2 = await rendered(page);
    expect(r2.canvases).toBe(r1.canvases);
    expect(r2.buttons).toBeGreaterThan(0);
    await goBack(page);
  });
}
