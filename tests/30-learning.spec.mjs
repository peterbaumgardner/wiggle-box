// The learning layer (js/learn.js) and the grown-ups view (js/grownups.js): practice records, adaptive levels, research
// variants, spoken words behind the grown-up switch, "Talk about it" questions, and the games that use them.
import { test, expect, home, openGame, goBack, dbg } from './helpers.mjs';

/* records every utterance instead of speaking (headless Chromium has no voices) */
const fakeSpeech = `(()=>{window.__spoken=[];const s={speak(u){window.__spoken.push(u.text)},cancel(){},getVoices(){return[]}};
  Object.defineProperty(window,'speechSynthesis',{value:s,configurable:true});})();`;
const spoken = page => page.evaluate(() => window.__spoken);
const learnData = page => page.evaluate(() => { learn.flush(); return JSON.parse(localStorage.getItem('wb-learn-v1')); });

test.describe('learning layer', () => {
  test('saw and tried are recorded per skill and kept after a reload; levels climb after 3 successes and fall after 2 misses', async ({ page }) => {
    await home(page);
    const lv = await page.evaluate(() => {
      const out = [];
      learn.saw('t', 'math.count', 5);
      for (let i = 0; i < 3; i++) learn.tried('t', 'math.count', true);
      out.push(learn.level('math.count'));                       // 1
      for (let i = 0; i < 3; i++) learn.tried('t', 'math.count', true);
      out.push(learn.level('math.count'));                       // 2
      out.push(learn.level('math.count', 1));                    // capped by the game
      learn.tried('t', 'math.count', false); learn.tried('t', 'math.count', false);
      out.push(learn.level('math.count'));                       // back to 0
      out.push(learn.level('never.seen'));
      return out;
    });
    expect(lv).toEqual([1, 2, 1, 0, 0]);
    const d = await learnData(page);
    expect(d.skills['math.count']).toMatchObject({ seen: 1, tries: 8, ok: 6 });
    expect(d.log.length).toBe(9);
    expect(d.log[0].slice(1, 4)).toEqual(['t', 'math.count', 'saw']);
    await page.reload();
    expect(await page.evaluate(() => learn.data.skills['math.count'].tries)).toBe(8);
  });

  test('a research variant is chosen once per device and kept', async ({ page }) => {
    await home(page);
    const a = await page.evaluate(() => learn.variant('hint', ['fast', 'slow']));
    expect(['fast', 'slow']).toContain(a);
    await page.evaluate(() => learn.flush());
    await page.reload();
    for (let i = 0; i < 5; i++) expect(await page.evaluate(() => learn.variant('hint', ['fast', 'slow']))).toBe(a);
  });

  test('spoken words stay silent until a grown-up switches voice on', async ({ page }) => {
    await page.addInitScript(fakeSpeech);
    await home(page);
    await page.evaluate(() => say('hello'));
    expect(await spoken(page)).toEqual([]);
    await page.evaluate(() => learn.set('voice', true));
    await page.evaluate(() => say('hello'));
    expect(await spoken(page)).toEqual(['hello']);
    await page.locator('#snd').click();                          // sound off silences voice too
    await page.evaluate(() => say('again'));
    expect(await spoken(page)).toEqual(['hello']);
  });

  test('"Talk about it" shows one question at a time, at most every 90 s, never takes a touch, and can be switched off', async ({ page }) => {
    await home(page); await openGame(page, 'shapes');
    expect(await page.evaluate(() => learn.talk('t', 'Why is the sky blue?'))).toBe(true);
    await expect(page.locator('#stage .talk-card')).toContainText('Why is the sky blue?');
    expect(await page.evaluate(() => learn.talk('t', 'Another one?'))).toBe(false);   // too soon
    // taps go through the card to the game underneath
    const c = await page.locator('#stage .talk-card').boundingBox();
    expect(await page.evaluate(([x, y]) => !document.elementFromPoint(x, y).closest('.talk-card'), [c.x + c.width / 2, c.y + c.height / 2])).toBe(true);
    await goBack(page);
    await page.evaluate(() => learn.set('talk', false));
    await openGame(page, 'shapes');
    expect(await page.evaluate(() => learn.talk('t', 'Hidden?'))).toBe(false);
    expect((await learnData(page)).log.filter(r => r[3] === 'talk')).toHaveLength(1);
  });
});

test.describe('grown-ups view', () => {
  test('a two-second press on the home star counter opens it; a quick tap does not; the switches are remembered', async ({ page }) => {
    await home(page);
    const star = page.locator('#home .hud .pill:not(.btn)');
    await star.click();
    await page.waitForTimeout(300);
    await expect(page.locator('.grown')).toHaveCount(0);
    await page.evaluate(() => { learn.saw('t', 'reading.letters', 'A'); learn.tried('t', 'math.count', true); });
    const b = await star.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
    await page.waitForTimeout(2300); await page.mouse.up();
    const g = page.locator('.grown');
    await expect(g).toBeVisible();
    await expect(g).toContainText('Reading');
    await expect(g).toContainText('letters 1');
    await expect(g).toContainText('counting 1');
    await g.locator('[data-set="voice"]').click();
    await expect(g.locator('[data-set="voice"]')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(g).toHaveCount(0);
    expect(await page.evaluate(() => { learn.flush(); return JSON.parse(localStorage.getItem('wb-learn-v1')).settings.voice; })).toBe(true);
    // Shift+G opens it from the keyboard; Start fresh needs two taps and keeps the settings
    await page.keyboard.press('Shift+G');
    await expect(g).toBeVisible();
    const download = page.waitForEvent('download');
    await g.locator('[data-g="export"]').click();
    const file = await (await download).path();
    const { readFileSync } = await import('node:fs');
    const json = JSON.parse(readFileSync(file, 'utf8'));
    expect(json.app).toBe('wiggle-box');
    expect(json.log.columns).toEqual(['time', 'game', 'skill', 'kind', 'ok', 'detail']);
    await g.locator('[data-g="reset"]').click();
    expect(await page.evaluate(() => Object.keys(learn.data.skills).length)).toBe(2);
    await page.locator('.grown [data-g="reset"]').click();
    await expect(page.locator('.grown')).toContainText('nothing yet');
    expect(await page.evaluate(() => [Object.keys(learn.data.skills).length, learn.settings.voice])).toEqual([0, true]);
  });
});

test.describe('games that use the learning layer', () => {
  /* spell the current word with real taps */
  async function spell(page) {
    const word = await dbg(page, 'words', d => d.word);
    for (const ch of word) await page.locator(`#tiles .lt:not(.used)[data-l="${ch}"]`).first().dispatchEvent('pointerdown');
    return word;
  }
  test('Word Builder moves on to longer words and more decoy letters after three perfect words, unless a length was picked', async ({ page }) => {
    await home(page); await openGame(page, 'words');
    expect((await dbg(page, 'words', d => d.word)).length).toBe(3);
    for (let i = 0; i < 3; i++) {
      const w = await spell(page);
      await page.waitForFunction(w => GAMES.words._debug.word !== w && GAMES.words._debug.posn === 0, w, { timeout: 6000 });
    }
    expect(await page.evaluate(() => learn.level('reading.spelling'))).toBe(1);
    expect((await dbg(page, 'words', d => d.word)).length).toBe(4);
    await expect(page.locator('.chip[data-l="4"]')).toHaveClass(/on/);
    // a child who picks 3 letters keeps 3 letters
    await page.locator('.chip[data-l="3"]').click();
    const w = await spell(page);
    await page.waitForFunction(w => GAMES.words._debug.word !== w && GAMES.words._debug.posn === 0, w, { timeout: 6000 });
    expect((await dbg(page, 'words', d => d.word)).length).toBe(3);
    const d = await learnData(page);
    expect(d.skills['reading.spelling'].tries).toBe(4);
    expect(d.skills['reading.words'].seen).toBeGreaterThanOrEqual(5);
  });

  test('Bubble Pop records letters, Shape Sorter records shapes, Magic Paint records colour words', async ({ page }) => {
    await home(page); await openGame(page, 'bubbles');
    const bub = page.locator('#stage .bubble').first();
    const bb = await bub.boundingBox(); await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await goBack(page); await openGame(page, 'shapes');
    const piece = page.locator('.pile .piece').first(), s = await piece.getAttribute('data-s');
    const a = await piece.boundingBox(), h = await page.locator(`.hole[data-s="${s}"]`).boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2, { steps: 12 }); await page.mouse.up();
    await goBack(page); await openGame(page, 'paint');
    await page.locator('.pp-quick [data-q="#24C786"]').click();
    const d = await learnData(page);
    expect(d.skills['reading.letters']?.seen).toBe(1);
    expect(d.skills['math.shapes']).toMatchObject({ tries: 1, ok: 1 });
    expect(d.log.some(r => r[1] === 'paint' && r[2] === 'talk.vocab' && r[5] === 'Green')).toBe(true);
  });
});
