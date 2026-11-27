// __TITLE__ tests. Run just these: npx playwright test tests/games/__KEY__.spec.mjs --project=desktop
// Every game is also covered automatically by tests/00-launch.spec.mjs (opens, draws, leaves cleanly, reopens).
import { test, expect, home, openGame, dbg, canvasBox, touchSession } from '../helpers.mjs';

test.describe('__TITLE__', () => {
  test('a touch pops a star', async ({ page }) => {
    await home(page); await openGame(page, '__KEY__');
    const box = await canvasBox(page);
    // sweep the whole play area with one finger: it must pass over at least one star
    for (let y = 30; y < box.height; y += 50) {
      await page.mouse.move(box.x + 10, box.y + y); await page.mouse.down();
      await page.mouse.move(box.x + box.width - 10, box.y + y, { steps: 12 }); await page.mouse.up();
    }
    expect(await dbg(page, '__KEY__', d => d.popped)).toBeGreaterThan(0);
  });

  test('@layout two fingers at once are two players', async ({ page }) => {
    await home(page); await openGame(page, '__KEY__', { tap: true });
    const b = await canvasBox(page), t = await touchSession(page);
    await t.multi([[[b.x + 50, b.y + 50], [b.x + b.width - 50, b.y + b.height - 50]], [[b.x + 80, b.y + 60], [b.x + b.width - 80, b.y + b.height - 60]], []]);
    await expect(page.locator('#stage')).not.toContainText('Oops');
  });
});
