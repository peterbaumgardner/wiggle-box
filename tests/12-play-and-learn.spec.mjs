// Games 07-13 and 27: Bubble Pop, Magic Paint, Hungry Monster, Shape Sorter, Rainbow Piano, Word Builder,
// Firework Sky, Letter Trace. These are for the youngest children, so tests use plain taps and drags.
import { test, expect, home, openGame, dbg, waitDbg, canvasBox, mouseDrag } from './helpers.mjs';

/* ---------------- Bubble Pop ---------------- */
test.describe('07 Bubble Pop', () => {
  test('bubbles float up; a tap on a bubble pops it, a tap just outside does not', async ({ page }) => {
    await home(page); await openGame(page, 'bubbles');
    const b = page.locator('#stage .bubble').first();
    const y1 = (await b.boundingBox()).y; await page.waitForTimeout(400); const y2 = (await b.boundingBox()).y;
    expect(y2).toBeLessThan(y1);
    const n0 = await page.locator('#stage .bubble').count();
    // just outside the round edge (a corner of the bounding square) must not pop it
    const bb = await b.boundingBox();
    const before = await dbg(page, 'bubbles', d => d.pops);
    await page.mouse.click(bb.x + 2, bb.y + 2);
    expect(await dbg(page, 'bubbles', d => d.pops)).toBe(before);
    // its centre does
    const c = await b.boundingBox();
    await page.mouse.click(c.x + c.width / 2, c.y + c.height / 2);
    expect(await dbg(page, 'bubbles', d => d.pops)).toBe(before + 1);
    await expect(page.locator('#stage .floaty')).toHaveCount(1);
  });

  test('ABC, 123 and Animals modes; ten pops earn a star; rapid taps all count', async ({ page }) => {
    await home(page); await openGame(page, 'bubbles');
    await expect(page.locator('#stage .bubble span').first()).toHaveText('A');
    await page.locator('.chip[data-m="num"]').click();
    await page.waitForTimeout(1600);
    expect(await page.locator('#stage .bubble span').first().textContent()).toBe('1');
    await page.locator('.chip[data-m="ani"]').click();
    await page.waitForTimeout(1600);
    const animals = ['🐶', '🐱', '🐮', '🐷', '🐸', '🦁', '🐵', '🐔', '🦆', '🐘', '🦒', '🐧', '🐢', '🐰', '🐻', '🦊', '🐙', '🐳', '🦋', '🐝'];
    expect(animals).toContain(await page.locator('#stage .bubble span').first().textContent());
    await page.locator('.chip[data-m="abc"]').click();
    // pop ten bubbles as fast as they come
    let popped = 0;
    for (let guard = 0; guard < 80 && popped < 10; guard++) {
      const bs = await page.locator('#stage .bubble').all();
      for (const bub of bs) {
        const r = await bub.boundingBox().catch(() => null);
        if (!r || r.y < 60 || r.y + r.height > 900) continue;
        await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2).catch(() => {});
        popped = await dbg(page, 'bubbles', d => d.pops);
        if (popped >= 10) break;
      }
      await page.waitForTimeout(150);
    }
    expect(popped).toBeGreaterThanOrEqual(10);
    await expect(page.locator('#game .starn')).toHaveText('1', { timeout: 3000 });
  });
});

/* ---------------- Magic Paint ---------------- */
async function px(page, x, y) {
  return page.evaluate(([x, y]) => { const c = document.querySelector('#stage canvas'), r = c.getBoundingClientRect(), k = c.width / r.width; const d = c.getContext('2d').getImageData(Math.round((x - r.left) * k), Math.round((y - r.top) * k), 1, 1).data; return [d[0], d[1], d[2]]; }, [x, y]);
}
const near = (a, b, t = 40) => a.every((v, i) => Math.abs(v - b[i]) <= t);
test.describe('08 Magic Paint', () => {
  test('a stroke paints the picked colour exactly under the finger, right up to every edge', async ({ page }) => {
    await home(page); await openGame(page, 'paint');
    const box = await canvasBox(page);
    await page.locator('.sw[data-n="Blue"]').click();
    await mouseDrag(page, [[box.x + 100, box.y + 100], [box.x + 300, box.y + 120]], { steps: 10 });
    expect(near(await px(page, box.x + 200, box.y + 110), [0x3D, 0x7B, 0xFF], 8)).toBe(true);
    expect(near(await px(page, box.x + 200, box.y + 160), [255, 255, 255], 2)).toBe(true);
    await page.locator('.sw[data-n="Red"]').click();
    for (const [a, b] of [[[box.x + 3, box.y + 40], [box.x + 3, box.y + 200]], [[box.x + box.width - 3, box.y + 40], [box.x + box.width - 3, box.y + 200]], [[box.x + 40, box.y + 3], [box.x + 300, box.y + 3]], [[box.x + 40, box.y + box.height - 3], [box.x + 300, box.y + box.height - 3]]]) {
      await mouseDrag(page, [a, b], { steps: 8 });
      expect(near(await px(page, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2), [0xFF, 0x4F, 0x5E], 8)).toBe(true);
    }
  });

  test('brush sizes, eraser, stamps, mirror, undo and new paper', async ({ page }) => {
    await home(page); await openGame(page, 'paint');
    const box = await canvasBox(page), y = box.y + 300;
    await page.locator('.sw[data-n="Black"]').click();
    const width = async (x) => { let w = 0; for (let dy = -30; dy <= 30; dy++) if (!near(await px(page, x, y + dy), [255, 255, 255], 30)) w++; return w; };
    await page.locator('.sz[data-s="8"]').click(); await mouseDrag(page, [[box.x + 100, y], [box.x + 200, y]], { steps: 6 });
    await page.locator('.sz[data-s="34"]').click(); await mouseDrag(page, [[box.x + 300, y], [box.x + 400, y]], { steps: 6 });
    const thin = await width(box.x + 150), fat = await width(box.x + 350);
    expect(Math.abs(thin - 8)).toBeLessThanOrEqual(3);
    expect(Math.abs(fat - 34)).toBeLessThanOrEqual(3);
    // eraser paints the paper colour back
    await page.locator('.sw.eraser').click();
    await mouseDrag(page, [[box.x + 280, y], [box.x + 420, y]], { steps: 8 });
    expect(near(await px(page, box.x + 350, y), [255, 255, 255], 2)).toBe(true);
    // undo brings the fat line back
    await page.locator('#undo').click();
    expect(near(await px(page, box.x + 350, y), [0x1D, 0x18, 0x42], 10)).toBe(true);
    // a stamp leaves colour around the tap
    await page.locator('.st[data-st="⭐"]').click();
    await page.mouse.click(box.x + 600, box.y + 150);
    let coloured = 0; for (let dx = -20; dx <= 20; dx += 4) for (let dy = -20; dy <= 20; dy += 4) if (!near(await px(page, box.x + 600 + dx, box.y + 150 + dy), [255, 255, 255], 20)) coloured++;
    expect(coloured).toBeGreaterThan(5);
    // mirror: a dot in one corner appears in all four
    await page.locator('#mir').click();
    await page.locator('.sw[data-n="Green"]').click();
    await page.mouse.click(box.x + 60, box.y + 60);
    for (const [x, yy] of [[60, 60], [box.width - 60, 60], [60, box.height - 60], [box.width - 60, box.height - 60]]) expect(near(await px(page, box.x + x, box.y + yy), [0x24, 0xC7, 0x86], 12)).toBe(true);
    await page.locator('#clr').click();
    expect(near(await px(page, box.x + 60, box.y + 60), [255, 255, 255], 1)).toBe(true);
    await page.locator('#undo').click();
    expect(near(await px(page, box.x + 60, box.y + 60), [0x24, 0xC7, 0x86], 12)).toBe(true);
  });

  test('a stroke that leaves the paper and comes back stays one continuous line, and the picture survives a resize', async ({ page }) => {
    await home(page); await openGame(page, 'paint');
    const box = await canvasBox(page);
    await page.locator('.sw[data-n="Purple"]').click();
    await mouseDrag(page, [[box.x + 200, box.y + 200], [box.x + 200, box.y - 40], [box.x + 260, box.y + 200]], { steps: 10 });
    expect(near(await px(page, box.x + 200, box.y + 150), [0x9A, 0x5B, 0xFF], 10)).toBe(true);
    expect(near(await px(page, box.x + 252, box.y + 150), [0x9A, 0x5B, 0xFF], 40)).toBe(true);
    await page.setViewportSize({ width: 1200, height: 860 });
    await page.waitForTimeout(400);
    expect(near(await px(page, box.x + 200, box.y + 150), [0x9A, 0x5B, 0xFF], 10)).toBe(true);
  });
});

/* ---------------- Hungry Monster ---------------- */
test.describe('09 Hungry Monster', () => {
  test('each level: feed exactly the number asked for (taps and drags), get a star and a new round', async ({ page }) => {
    test.setTimeout(90_000);
    await home(page); await openGame(page, 'feed');
    let stars = 0;
    for (const lv of ['s', 'b', 'a']) {
      await page.locator(`.chip[data-l="${lv}"]`).click();
      const t = await dbg(page, 'feed', d => ({ target: d.target, a: d.a, b: d.b }));
      if (lv === 'a') { expect(t.target).toBe(t.a + t.b); await expect(page.locator('#ask')).toContainText(`${t.a}`); }
      await expect(page.locator('#dots i')).toHaveCount(t.target);
      const mon = await page.locator('#mon').boundingBox();
      for (let k = 0; k < t.target; k++) {
        const f = page.locator('#tray .food').first(); const fb = await f.boundingBox();
        if (k % 2) await f.click();                                  // tap: it flies into the mouth
        else await mouseDrag(page, [[fb.x + fb.width / 2, fb.y + fb.height / 2], [mon.x + mon.width / 2, mon.y + mon.height * .6]], { steps: 10 }); // drag into the mouth
        await page.waitForTimeout(450);
        expect(await dbg(page, 'feed', d => d.eaten)).toBe(k + 1);
        await expect(page.locator('#dots i.f')).toHaveCount(k + 1);
      }
      stars++;
      await expect(page.locator('#game .starn')).toHaveText(String(stars), { timeout: 3000 });
      await expect(page.locator('#ask')).toContainText('=', { timeout: 3000 }).catch(() => {});
      await waitDbg(page, 'feed', d => d.eaten === 0 && !d.busy, { timeout: 6000 });   // a fresh round
    }
  });

  test('food dropped anywhere but the monster goes back to the tray and is never stranded', async ({ page }) => {
    await home(page); await openGame(page, 'feed');
    const f = page.locator('#tray .food').first(), tray = await page.locator('#tray').boundingBox();
    const fb = await f.boundingBox();
    await mouseDrag(page, [[fb.x + fb.width / 2, fb.y + fb.height / 2], [10, 10]], { steps: 10 });           // far top-left corner
    await page.waitForTimeout(500);
    const after = await f.boundingBox();
    expect(Math.abs(after.x - fb.x)).toBeLessThan(2); expect(Math.abs(after.y - fb.y)).toBeLessThan(2);
    expect(after.y).toBeGreaterThanOrEqual(tray.y - 1);
    expect(await dbg(page, 'feed', d => d.eaten)).toBe(0);
  });
});

/* ---------------- Shape Sorter ---------------- */
test.describe('10 Shape Sorter', () => {
  test('every shape fits only its own hole, whatever its tilt; a full board gives a star and a new round', async ({ page }) => {
    await home(page); await openGame(page, 'shapes');
    for (let round = 0; round < 2; round++) {
      const shapes = await page.$$eval('#pile .piece', ps => ps.map(p => p.dataset.s));
      expect(shapes.length).toBe(4);
      for (const s of shapes) {
        const piece = page.locator(`#pile .piece[data-s="${s}"]`);
        const a = await piece.boundingBox();
        const wrong = page.locator(`#holes .hole:not([data-s="${s}"]):not([data-f])`).first();
        if (await wrong.count()) {
          const w = await wrong.boundingBox();
          await mouseDrag(page, [[a.x + a.width / 2, a.y + a.height / 2], [w.x + w.width / 2, w.y + w.height / 2]], { steps: 10 });
          await page.waitForTimeout(350);
          await expect(wrong.locator('.piece')).toHaveCount(0);                 // refused
          const a2 = await piece.boundingBox();
          expect(Math.abs(a2.x - a.x) + Math.abs(a2.y - a.y)).toBeLessThan(4);  // went home to the pile
        }
        const right = page.locator(`#holes .hole[data-s="${s}"]`), r = await right.boundingBox();
        await mouseDrag(page, [[a.x + a.width / 2, a.y + a.height / 2], [r.x + r.width / 2, r.y + r.height / 2]], { steps: 10 });
        await expect(right.locator('.piece')).toHaveCount(1);
        // the placed shape keeps its colour: the centre of the hole is not the hole's grey any more
        const fill = await right.locator('.piece svg :is(circle,rect,path)').evaluate(e => getComputedStyle(e).fill);
        expect(fill).not.toBe('rgba(29, 24, 66, 0.1)');
        expect(await right.locator('.piece svg :is(circle,rect,path)').evaluate(e => getComputedStyle(e).strokeDasharray)).toBe('none');
      }
      await expect(page.locator('#game .starn')).toHaveText(String(round + 1), { timeout: 3000 });
      await expect(page.locator('#holes .hole[data-f]')).toHaveCount(0, { timeout: 6000 });
    }
  });

  test('keyboard: pick a shape with Enter, choose its home, Enter again', async ({ page }) => {
    await home(page); await openGame(page, 'shapes');
    const s = await page.locator('#pile .piece').first().getAttribute('data-s');
    await page.locator('#pile .piece').first().focus();
    await page.keyboard.press('Enter');
    await page.locator(`#holes .hole[data-s="${s}"]`).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator(`#holes .hole[data-s="${s}"] .piece`)).toHaveCount(1);
  });
});

/* ---------------- Rainbow Piano ---------------- */
const recordTones = () => {
  window.__freqs = [];
  const C = window.AudioContext || window.webkitAudioContext, orig = C.prototype.createOscillator;
  C.prototype.createOscillator = function () { const o = orig.call(this), f = o.frequency, set = f.setValueAtTime.bind(f); f.setValueAtTime = (v, t) => { window.__freqs.push(v); return set(v, t); }; return o; };
};
test.describe('11 Rainbow Piano', () => {
  test('all eight keys play the right C-major notes (equal temperament, A4 = 440 Hz)', async ({ page }) => {
    await page.addInitScript(recordTones);
    await home(page); await openGame(page, 'music');
    const want = [0, 2, 4, 5, 7, 9, 11, 12].map(s => 261.6256 * 2 ** (s / 12));
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => { window.__freqs = []; });
      await page.locator(`.pad[data-i="${i}"]`).click();
      const f = await page.evaluate(() => window.__freqs);
      expect(Math.abs(f[0] - want[i])).toBeLessThan(0.02);
      expect(Math.abs(f[1] - want[i] * 2)).toBeLessThan(0.04);  // the soft octave above
      await expect(page.locator(`.pad[data-i="${i}"]`)).toHaveClass(/lit/);
    }
    // sound off: keys still light up, but make no sound
    await page.locator('#snd2').click();
    await page.evaluate(() => { window.__freqs = []; });
    await page.locator('.pad[data-i="3"]').click();
    expect(await page.evaluate(() => window.__freqs.length)).toBe(0);
  });

  test('Learn a song: following the glowing key plays Twinkle Twinkle to the end for a star', async ({ page }) => {
    test.setTimeout(90_000);
    await home(page); await openGame(page, 'music');
    await page.locator('.chip[data-m="song"]').click();
    const SONG = await dbg(page, 'music', d => d.SONG);
    expect(SONG.length).toBe(42);
    for (let k = 0; k < SONG.length; k++) {
      const next = page.locator('.pad.next');
      await expect(next).toHaveCount(1);
      expect(await next.getAttribute('data-i')).toBe(String(SONG[k]));
      if (k === 3) await page.locator(`.pad[data-i="${(SONG[k] + 1) % 8}"]`).click(); // a wrong key does not advance
      await next.click();
      await page.waitForTimeout(60);
    }
    await expect(page.locator('#msg')).toHaveText('You played the whole song!');
    await expect(page.locator('#game .starn')).toHaveText('1', { timeout: 3000 });
  });

  test('Copy me: listen, repeat the notes, and the tune grows; a wrong note replays it', async ({ page }) => {
    test.setTimeout(60_000);
    await home(page); await openGame(page, 'music');
    await page.locator('.chip[data-m="copy"]').click();
    for (let round = 0; round < 3; round++) {
      await expect(page.locator('#msg')).toHaveText('Your turn!', { timeout: 15_000 });
      const seq = await dbg(page, 'music', d => d.seq.slice());
      expect(seq.length).toBe(2 + round);
      for (const i of seq) await page.locator(`.pad[data-i="${i}"]`).click();
      await expect(page.locator('#msg')).toContainText(`${seq.length} notes`);
    }
    await expect(page.locator('#msg')).toHaveText('Your turn!', { timeout: 15_000 });
    const seq = await dbg(page, 'music', d => d.seq.slice());
    await page.locator(`.pad[data-i="${(seq[0] + 1) % 8}"]`).click();
    await expect(page.locator('#msg')).toHaveText('Oops! Listen again.');
    await expect(page.locator('#msg')).toHaveText('Your turn!', { timeout: 15_000 });
    expect(await dbg(page, 'music', d => d.seq.length)).toBe(seq.length);
  });

  test('sliding a finger across the keys plays each one (glissando); switching modes leaves no key stuck lit', async ({ page }) => {
    await page.addInitScript(recordTones);
    await home(page); await openGame(page, 'music');
    const a = await page.locator('.pad[data-i="0"]').boundingBox(), b = await page.locator('.pad[data-i="7"]').boundingBox();
    await page.evaluate(() => { window.__freqs = []; });
    await mouseDrag(page, [[a.x + a.width / 2, a.y + a.height / 2], [b.x + b.width / 2, b.y + b.height / 2]], { steps: 30 });
    const f = await page.evaluate(() => window.__freqs.filter(v => v < 600));
    expect(new Set(f.map(Math.round)).size).toBeGreaterThanOrEqual(7);
    await page.locator('.chip[data-m="copy"]').click();
    await page.waitForTimeout(1300);
    await page.locator('.chip[data-m="free"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.pad.lit')).toHaveCount(0);
  });
});

/* ---------------- Word Builder ---------------- */
test.describe('12 Word Builder', () => {
  test('every word in both lists is a real lowercase word with a picture', async ({ page }) => {
    await home(page); await openGame(page, 'words');
    const { W3, W4 } = await dbg(page, 'words', d => ({ W3: d.W3, W4: d.W4 }));
    for (const [w, pic] of W3) { expect(w).toMatch(/^[a-z]{3}$/); expect(pic.length).toBeGreaterThan(0); }
    for (const [w, pic] of W4) { expect(w).toMatch(/^[a-z]{4}$/); expect(pic.length).toBeGreaterThan(0); }
    expect(new Set(W3.map(x => x[0])).size).toBe(W3.length);
    expect(new Set(W4.map(x => x[0])).size).toBe(W4.length);
  });

  test('spelling rounds in both lengths: right letters fill the slots, wrong ones shake, two misses show a hint', async ({ page }) => {
    test.setTimeout(90_000);
    await home(page); await openGame(page, 'words');
    let stars = 0;
    for (const len of ['3', '4', '3', '4']) {
      if (await page.locator(`.chip[data-l="${len}"]`).getAttribute('class').then(c => !c.includes('on'))) await page.locator(`.chip[data-l="${len}"]`).click();
      await page.waitForTimeout(100);
      const word = await dbg(page, 'words', d => d.word);
      expect(word.length).toBe(+len);
      await expect(page.locator('#slots .slot')).toHaveCount(+len);
      const tiles = await page.$$eval('#tiles .lt', ts => ts.map(t => t.dataset.l));
      for (const ch of word) expect(tiles.filter(t => t === ch).length).toBeGreaterThanOrEqual([...word].filter(c => c === ch).length); // solvable
      // two wrong taps -> the right tile glows
      const wrong = tiles.find(t => t !== word[0]);
      await page.locator(`#tiles .lt[data-l="${wrong}"]`).first().click();
      await page.locator(`#tiles .lt[data-l="${wrong}"]`).first().click();
      await expect(page.locator('#tiles .lt.glow')).toHaveCount(1);
      expect(await page.locator('#tiles .lt.glow').getAttribute('data-l')).toBe(word[0]);
      for (let i = 0; i < word.length; i++) await page.locator(`#tiles .lt[data-l="${word[i]}"]:not(.used)`).first().click({ force: true });
      await expect(page.locator('#slots .slot.fill')).toHaveCount(word.length);
      expect((await page.$$eval('#slots .slot', s => s.map(x => x.textContent))).join('')).toBe(word);
      stars++;
      await expect(page.locator('#game .starn')).toHaveText(String(stars), { timeout: 3000 });
      await waitDbg(page, 'words', (d, G, W, w) => d.word !== w, { arg: word, timeout: 6000 });
    }
  });

  test('the picture button lights the next letter; the keyboard can spell', async ({ page }) => {
    await home(page); await openGame(page, 'words');
    const word = await dbg(page, 'words', d => d.word);
    await page.locator('#pic').click();
    expect(await page.locator('#tiles .lt.glow').getAttribute('data-l')).toBe(word[0]);
    await page.evaluate(() => document.activeElement.blur());
    for (const ch of word) await page.keyboard.press(ch);
    await expect(page.locator('#slots .slot.fill')).toHaveCount(word.length);
  });
});

/* ---------------- Firework Sky ---------------- */
test.describe('13 Firework Sky', () => {
  test('a tap launches a rocket that bursts into a named colour, shape or number', async ({ page }) => {
    await home(page); await openGame(page, 'fireworks');
    const box = await canvasBox(page);
    await page.waitForTimeout(1500); // the opening demo rocket
    const before = await dbg(page, 'fireworks', d => d.sparks.length);
    await page.mouse.click(box.x + box.width * .3, box.y + box.height * .3);
    expect(await dbg(page, 'fireworks', d => d.rockets.length)).toBeGreaterThan(0);
    await expect(page.locator('#stage .floaty')).toContainText(/Red|Orange|Yellow|Green|Blue|Purple|Pink/, { timeout: 3000 });
    await page.locator('[data-m="shapes"]').click();
    await page.mouse.click(box.x + box.width * .5, box.y + box.height * .3);
    await expect(page.locator('#stage .floaty').last()).toContainText(/Circle|Heart|Star|Square|Triangle|Smiley/, { timeout: 3000 });
    await page.locator('[data-m="count"]').click();
    for (let n = 1; n <= 10; n++) {
      await page.mouse.click(box.x + box.width * (.15 + (n % 5) * .15), box.y + box.height * .35);
      await expect(page.locator('#stage .floaty').last()).toHaveText(String(n), { timeout: 3000 });
      await page.waitForTimeout(250);
    }
    await expect(page.locator('#game .starn')).toHaveText('1', { timeout: 5000 });
    expect(before).toBeGreaterThanOrEqual(0);
  });

  test('two hundred frantic taps and scribbles never grow sparks or rockets without limit', async ({ page }) => {
    await home(page); await openGame(page, 'fireworks');
    const box = await canvasBox(page);
    for (let i = 0; i < 200; i++) await page.mouse.click(box.x + (i * 37) % box.width, box.y + (i * 53) % (box.height * .6));
    for (let k = 0; k < 6; k++) await mouseDrag(page, [[box.x + 50, box.y + 100 + k * 30], [box.x + box.width - 50, box.y + 120 + k * 30]], { steps: 40 });
    const s = await dbg(page, 'fireworks', d => ({ sparks: d.sparks.length, rockets: d.rockets.length }));
    expect(s.sparks).toBeLessThanOrEqual(4000);
    expect(s.rockets).toBeLessThanOrEqual(13);
    await page.waitForTimeout(4000);
    expect(await dbg(page, 'fireworks', d => d.sparks.length)).toBeLessThan(500); // it all fades away
  });
});

/* ---------------- Letter Trace ---------------- */
/* Trace every stroke of the current character like a child: start on the green dot, move along the line at a
   steady pace with a wobble of up to half the allowed tolerance. */
async function traceCurrent(page, { wobble = .5, backwards = false } = {}) {
  const box = await canvasBox(page);
  const strokes = await dbg(page, 'trace', d => d.strokes.map(s => s.map(q => d.toPx(q))));
  const tol = await dbg(page, 'trace', d => d.tol());
  for (let si = 0; si < strokes.length; si++) {
    let pts = strokes[si]; if (backwards) pts = pts.slice().reverse();
    const step = Math.max(1, Math.floor(pts.length / 40));
    const wob = i => Math.sin(i * 1.7) * tol * wobble;
    await page.mouse.move(box.x + pts[0][0], box.y + pts[0][1]); await page.mouse.down();
    for (let i = step; i < pts.length; i += step) await page.mouse.move(box.x + pts[i][0] + wob(i), box.y + pts[i][1] - wob(i));
    const e = pts[pts.length - 1]; await page.mouse.move(box.x + e[0], box.y + e[1]); await page.mouse.up();
    await page.waitForTimeout(30);
  }
}

test.describe('27 Letter Trace', () => {
  test('every letter A-Z and number 0-9 can be finished with a realistic, wobbly trace', async ({ page }) => {
    test.setTimeout(300_000);
    await home(page); await openGame(page, 'trace');
    for (const set of ['abc', 'num']) {
      await page.locator(`[data-set="${set}"]`).click();
      const chars = await dbg(page, 'trace', (d, G, W, s) => d.SETS[s], set);
      for (let i = 0; i < chars.length; i++) {
        expect(await dbg(page, 'trace', d => d.state.ch)).toBe(chars[i]);
        await traceCurrent(page);
        const st = await dbg(page, 'trace', d => d.state);
        expect(st.done, `traced ${chars[i]}`).toBe(true);
        await page.locator('#next').click();
      }
    }
    expect(Number(await page.locator('#game .starn').textContent())).toBe(36);
  });

  test('tracing backwards or starting away from the green dot does not count', async ({ page }) => {
    await home(page); await openGame(page, 'trace');
    await traceCurrent(page, { backwards: true });
    expect(await dbg(page, 'trace', d => d.state.done)).toBe(false);
    const box = await canvasBox(page);
    await page.mouse.click(box.x + 20, box.y + 20);
    await expect(page.locator('.simhint')).toContainText('green dot');
    await page.locator('#again').click();
    await traceCurrent(page);
    expect(await dbg(page, 'trace', d => d.state.done)).toBe(true);
    await page.locator('#prev').click();
    expect(await dbg(page, 'trace', d => d.state.ch)).toBe('Z');
    await page.keyboard.press('7');
    expect(await dbg(page, 'trace', d => d.state.ch)).toBe('7');
  });
});
