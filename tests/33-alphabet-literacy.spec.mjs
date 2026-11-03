import { test, expect, home, openGame, dbg } from './helpers.mjs';

test.describe('Alphabet literacy activities', () => {
  test('trace remains the default and its controls still advance letters', async ({ page }) => {
    await home(page);
    await openGame(page, 'trace');
    await expect(page.locator('#abc-play')).toBeHidden();
    expect(await dbg(page, 'trace', d => d.state.ch)).toBe('A');
    await page.locator('#next').click();
    expect(await dbg(page, 'trace', d => d.state.ch)).toBe('B');
    await page.locator('[data-set="num"]').click();
    expect(await dbg(page, 'trace', d => d.state.ch)).toBe('0');
  });

  test('every new activity is tappable and transitions between rounds', async ({ page }) => {
    await home(page);
    await openGame(page, 'trace');
    for (const mode of ['explore', 'find', 'match', 'words']) {
      await page.locator('[data-mode="' + mode + '"]').click();
      await expect(page.locator('#abc-play')).toBeVisible();
      const before = await dbg(page, 'trace', d => d.literacy);
      expect(before.mode).toBe(mode);
      expect(before.goal).toMatch(/^[A-Z]$/);
      await expect(page.locator('#abc-play .abc-choice')).toHaveCount(mode === 'explore' ? 5 : mode === 'find' ? 2 : 3).catch(async () => {
        if (mode === 'find') expect(await page.locator('#abc-play .abc-choice').count()).toBeGreaterThanOrEqual(2);
        else throw Error('Unexpected choice count');
      });
      const chosen = mode === 'explore' ? await page.locator('#abc-play .abc-choice').first().getAttribute('data-choice') : before.goal;
      await page.locator('#abc-play .abc-choice[data-choice="' + chosen + '"]').click();
      const after = await dbg(page, 'trace', d => d.literacy);
      expect(after.solved).toBe(true);
      expect(after.successes).toBe(1);
      await expect(page.locator('#abc-play .abc-feedback')).not.toBeEmpty();
      await expect.poll(async () => (await dbg(page, 'trace', d => d.literacy)).solved, { timeout: 6500 }).toBe(false);
    }
  });

  test('wrong taps offer guidance without advancing progress, and replay is available', async ({ page }) => {
    await home(page);
    await openGame(page, 'trace');
    await page.locator('[data-mode="find"]').click();
    const answer = await dbg(page, 'trace', d => d.literacy.goal);
    const wrong = page.locator('#abc-play .abc-choice').filter({ hasNotText: new RegExp('^' + answer + '$') }).first();
    await wrong.click();
    await wrong.click();
    expect((await dbg(page, 'trace', d => d.literacy)).successes).toBe(0);
    await expect(page.locator('#abc-play .abc-feedback')).toContainText('Look for');
    await page.locator('#abc-repeat').click();
    await page.locator('#abc-play .abc-choice[data-choice="' + answer + '"]').click();
    expect((await dbg(page, 'trace', d => d.literacy)).successes).toBe(1);
    await page.locator('[data-mode="trace"]').click();
    await expect(page.locator('#abc-play')).toBeHidden();
    await expect(page.locator('#abc-trace-controls')).toBeVisible();
  });

  test('word rounds show a correctly sized incomplete word and can be completed', async ({ page }) => {
    await home(page);
    await openGame(page, 'trace');
    await page.locator('[data-mode="words"]').click();
    const { goal, wordRound } = await dbg(page, 'trace', d => d.literacy);
    expect(wordRound.word).toMatch(/^[A-Z]{3}$/);
    expect(wordRound.word[wordRound.index]).toBe(goal);
    await expect(page.locator('#abc-play .abc-caption')).toContainText('＿');
    await page.locator('#abc-play .abc-choice[data-choice="' + goal + '"]').click();
    await expect(page.locator('#abc-play .abc-caption')).toHaveText(wordRound.word);
  });
});
