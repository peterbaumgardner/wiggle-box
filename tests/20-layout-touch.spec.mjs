// @layout: runs on the four touch projects (phone and tablet, portrait and landscape).
// Every game must fit: controls on screen and tappable, a play area big enough to play in, and real touch input working.
import { test, expect, GAME_KEYS, home, openGame, dbg, waitDbg, canvasBox, touchSession } from './helpers.mjs';

/* Smallest usable play area for a canvas game, in CSS pixels. A phone on its side is 390 px tall in total. */
const MIN_PLAY = { w: 240, h: 180 };

/* Every visible control on the game screen (not pop-up menus, not the hidden originals behind a folded toolbar, not the
   floating bubbles in Bubble Pop, which are the game itself and drift in and out on purpose). Each one is scrolled into
   view inside its own panel if needed, then must be fully on screen with nothing covering its centre. Done in one pass
   in the page because toolbars rebuild their fold buttons as the game runs. */
function unreachable(page) {
  return page.evaluate(async () => {
    const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden]'); };
    const list = [...document.querySelectorAll('#game button, #game [role=button]')].filter(b => vis(b) && !b.closest('.pop') && !b.closest('.cgh') && !b.classList.contains('bubble'));
    const bad = [];
    for (const el of list) {
      // only panels a finger can scroll count (overflow auto/scroll); scrolling an overflow:hidden box would cheat
      for (let a = el.parentElement; a; a = a.parentElement) { const o = getComputedStyle(a); if (/(auto|scroll)/.test(o.overflowY + o.overflowX) && (a.scrollHeight > a.clientHeight || a.scrollWidth > a.clientWidth)) { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); break; } }
      await new Promise(r => requestAnimationFrame(r));
      if (!el.isConnected) continue;   // the game rebuilt it while we looked (a new info tab, say)
      const r = el.getBoundingClientRect(), name = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30);
      if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) { bad.push(`${name}: off screen ${Math.round(r.left)},${Math.round(r.top)}`); continue; }
      const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!t || !(t === el || el.contains(t))) bad.push(`${name}: covered by ${t ? t.className || t.tagName : 'nothing'}`);
    }
    return { n: list.length, bad };
  });
}

test.describe('@layout every game fits the screen', () => {
  for (const key of GAME_KEYS) {
    test(`@layout ${key}: controls reachable, play area usable`, async ({ page }) => {
      await home(page);
      await openGame(page, key, { tap: true });
      await page.waitForTimeout(key === 'physics' ? 1200 : 600);
      // the hint bubble fades out; wait so it doesn't count as covering buttons
      await page.waitForTimeout(400);
      const r = await unreachable(page);
      expect(r.n, 'some controls').toBeGreaterThan(0);
      expect(r.bad, 'unreachable controls').toEqual([]);
      const sizes = await page.evaluate(() => {
        const st = document.querySelector('#stage').getBoundingClientRect();
        const c = [...document.querySelectorAll('#stage canvas')].find(x => x.offsetWidth > 0 && !x.hidden);
        return { stage: [st.width, st.height], canvas: c ? [c.offsetWidth, c.offsetHeight] : null, scrollX: (() => { scrollTo(200, 0); const moved = scrollX !== 0; scrollTo(0, 0); return moved; })() };
      });
      expect(sizes.scrollX, 'no sideways page scroll').toBe(false);
      if (sizes.canvas) {
        expect(sizes.canvas[0], 'play area width').toBeGreaterThanOrEqual(MIN_PLAY.w);
        expect(sizes.canvas[1], 'play area height').toBeGreaterThanOrEqual(MIN_PLAY.h);
      }
      await page.screenshot({ path: test.info().outputPath(`${key}.png`) });
      await page.locator('#back').tap();
      await expect(page.locator('#home')).toBeVisible();
    });
  }
});

test.describe('@layout real touch input', () => {
  test('@layout Paint: a finger stroke paints', async ({ page }) => {
    await home(page); await openGame(page, 'paint', { tap: true });
    const b = await canvasBox(page), t = await touchSession(page);
    const before = await page.evaluate(() => { const c = [...document.querySelectorAll('#stage canvas')].find(x => x.offsetWidth); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i] < 250 || d[i + 1] < 250 || d[i + 2] < 250) n++; return n; });
    await t.drag([[b.x + b.width * .2, b.y + b.height * .5], [b.x + b.width * .8, b.y + b.height * .5]], { steps: 12 });
    const after = await page.evaluate(() => { const c = [...document.querySelectorAll('#stage canvas')].find(x => x.offsetWidth); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i] < 250 || d[i + 1] < 250 || d[i + 2] < 250) n++; return n; });
    expect(after).toBeGreaterThan(before + 50);
  });

  test('@layout Shape Sorter: a shape dragged by finger drops into its hole', async ({ page }) => {
    await home(page); await openGame(page, 'shapes', { tap: true });
    const piece = page.locator('.pile .piece').first(), s = await piece.getAttribute('data-s');
    const hole = page.locator(`.hole[data-s="${s}"]`);
    const a = await piece.boundingBox(), h = await hole.boundingBox(), t = await touchSession(page);
    await t.drag([[a.x + a.width / 2, a.y + a.height / 2], [h.x + h.width / 2, h.y + h.height / 2]], { steps: 15 });
    await expect(hole.locator('.piece')).toHaveCount(1);
  });

  test('@layout Element Box: painting with a finger makes sand', async ({ page }) => {
    await home(page); await openGame(page, 'sand', { tap: true });
    const n0 = await dbg(page, 'sand', d => d.T.filter(v => v === 1).length);
    const b = await canvasBox(page), t = await touchSession(page);
    await t.drag([[b.x + b.width * .3, b.y + b.height * .3], [b.x + b.width * .7, b.y + b.height * .3]], { steps: 12 });
    expect(await dbg(page, 'sand', d => d.T.filter(v => v === 1).length)).toBeGreaterThan(n0 + 20);
  });

  test('@layout Physics Lab: a finger draws a ramp in a puzzle and the ball reaches the star', async ({ page }) => {
    test.setTimeout(60_000);
    await home(page); await openGame(page, 'physics', { tap: true });
    await page.waitForFunction(() => window.Matter && window.WiggleBox.games.physics._debug);
    await dbg(page, 'physics', d => d.startPuzzle(0));
    const b = await canvasBox(page), t = await touchSession(page);
    const pts = [...Array(13)].map((_, i) => [b.x + b.width * (.08 + .52 * i / 12), b.y + b.height * (.2 + .55 * i / 12)]);
    await t.drag(pts, { steps: 3 });
    expect(await dbg(page, 'physics', d => d.world.bodies.filter(x => x.plugin.wb && x.plugin.wb.kind === 'ink' && !x.plugin.wb.fixed).length)).toBe(1);
    await page.locator('#pgo').tap();
    await waitDbg(page, 'physics', d => d.puzzle && d.puzzle.done, { timeout: 20_000 });
  });

  test('@layout Circuit Lab: a finger draws the wire that lights the bulb', async ({ page }) => {
    await home(page); await openGame(page, 'circuit', { tap: true });
    const box = await canvasBox(page), g = await dbg(page, 'circuit', d => d.geom());
    const P = (i, j) => [box.x + g.ox + i * g.sp, box.y + g.oy + j * g.sp];
    const t = await touchSession(page);
    await t.drag([P(2, 2), P(3, 2)], { steps: 8 });
    expect(await dbg(page, 'circuit', d => d.sol.bulbs[0].lit)).toBe(true);
  });

  test('@layout turning the device mid-game keeps the game working', async ({ page }) => {
    test.setTimeout(90_000);
    await home(page);
    const vp = page.viewportSize();
    for (const key of ['cannon', 'bridge', 'robo', 'physics', 'space', 'splash', 'laser', 'waves']) {
      await openGame(page, key, { tap: true });
      await page.waitForTimeout(500);
      await page.setViewportSize({ width: vp.height, height: vp.width });
      await page.waitForTimeout(600);
      const c = await page.evaluate(() => { const c = [...document.querySelectorAll('#stage canvas')].find(x => x.offsetWidth > 0); return c ? [c.offsetWidth, c.offsetHeight, c.width, c.height] : null; });
      expect(c, key).not.toBeNull();
      expect(c[0], key).toBeGreaterThan(150); expect(c[1], key).toBeGreaterThan(120);
      expect(c[2], `${key} drawing buffer follows the new size`).toBeGreaterThanOrEqual(c[0]);
      await expect(page.locator('#back')).toBeVisible();
      await page.setViewportSize(vp);
      await page.waitForTimeout(300);
      await page.locator('#back').tap();
      await expect(page.locator('#home')).toBeVisible();
    }
  });
});
