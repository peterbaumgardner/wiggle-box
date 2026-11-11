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
/* Magic Paint: read the picture the child sees (paper + ink + outlines) at a page position. */
async function px(page, x, y) {
  const box = await canvasBox(page);
  return dbg(page, 'paint', (d, G, W, a) => d.pixel(a[0], a[1]), [x - box.x, y - box.y]);
}
const near = (a, b, t = 40) => a.every((v, i) => Math.abs(v - b[i]) <= t);
const st = page => dbg(page, 'paint', d => d.state);
async function pick(page, cat, sel) {
  await page.locator(`.pp-bar [data-cat="${cat}"]`).click();
  await expect(page.locator('.pp-menu')).toBeVisible();
  if (sel) await page.locator(`.pp-menu ${sel}`).click();
}
const pickColor = (page, hex) => pick(page, 'color', `[data-col="${hex}"]`);
test.describe('08 Magic Paint', () => {
  test('the paper gets nearly the whole stage; every category opens a menu, a pick closes it, a tap outside closes it without painting', async ({ page }) => {
    await home(page); await openGame(page, 'paint');
    const sizes = await page.evaluate(() => { const s = document.querySelector('#stage').getBoundingClientRect(), b = document.querySelector('.pp-board').getBoundingClientRect(); return [b.height / s.height, b.width / s.width]; });
    expect(sizes[0]).toBeGreaterThan(.86); expect(sizes[1]).toBeGreaterThan(.98);
    expect(await page.locator('.pp-bar button').count()).toBeLessThanOrEqual(9);
    for (const cat of ['color', 'brush', 'stamp', 'magic', 'paper']) {
      await page.locator(`.pp-bar [data-cat="${cat}"]`).click();
      await expect(page.locator('.pp-menu')).toBeVisible();
      expect((await st(page)).openCat).toBe(cat);
      await page.locator(`.pp-bar [data-cat="${cat}"]`).click();   // same button again closes it
      await expect(page.locator('.pp-menu')).toBeHidden();
    }
    const box = await canvasBox(page);
    await page.locator('.pp-bar [data-cat="color"]').click();
    await page.mouse.click(box.x + 40, box.y + 40);   // the shade, above the menu
    await expect(page.locator('.pp-menu')).toBeHidden();
    expect(near(await px(page, box.x + 40, box.y + 40), [255, 255, 255], 1)).toBe(true);
    expect((await st(page)).hist).toBe(0);
    await pickColor(page, '#3D7BFF');
    await expect(page.locator('.pp-menu')).toBeHidden();
    expect((await st(page)).colorName).toBe('Blue');
    await expect(page.locator('.pp-say')).toContainText('Blue');
  });

  test('a stroke paints the picked colour exactly under the finger, right up to every edge', async ({ page }) => {
    await home(page); await openGame(page, 'paint');
    const box = await canvasBox(page);
    await pickColor(page, '#3D7BFF');
    await mouseDrag(page, [[box.x + 100, box.y + 100], [box.x + 300, box.y + 120]], { steps: 10 });
    expect(near(await px(page, box.x + 200, box.y + 110), [0x3D, 0x7B, 0xFF], 8)).toBe(true);
    expect(near(await px(page, box.x + 200, box.y + 160), [255, 255, 255], 2)).toBe(true);
    await pickColor(page, '#FF4F5E');
    for (const [a, b] of [[[box.x + 3, box.y + 40], [box.x + 3, box.y + 200]], [[box.x + box.width - 3, box.y + 40], [box.x + box.width - 3, box.y + 200]], [[box.x + 40, box.y + 3], [box.x + 300, box.y + 3]], [[box.x + 40, box.y + box.height - 3], [box.x + 300, box.y + box.height - 3]]]) {
      await mouseDrag(page, [a, b], { steps: 8 });
      expect(near(await px(page, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2), [0xFF, 0x4F, 0x5E], 8)).toBe(true);
    }
  });

  test('every brush leaves paint, sizes are right, the eraser shows the paper colour, undo and redo work', async ({ page }) => {
    await home(page); await openGame(page, 'paint');
    const box = await canvasBox(page);
    await pickColor(page, '#1D1842');
    const ink = async (x0, y0, w, h) => dbg(page, 'paint', (d, G, W, a) => { let n = 0; for (let y = a[1]; y < a[1] + a[3]; y += 3) for (let x = a[0]; x < a[0] + a[2]; x += 3) { const c = d.pixel(x, y); if (c[0] < 200 || c[1] < 200 || c[2] < 200) n++; } return n; }, [x0, y0, w, h]);
    let x = 60;
    for (const t of ['brush', 'neon', 'spray', 'sparkle', 'bubble']) {
      await pick(page, 'brush', `[data-tool="${t}"]`);
      expect((await st(page)).tool).toBe(t);
      await mouseDrag(page, [[box.x + x, box.y + 80], [box.x + x, box.y + 220]], { steps: 8 });
      expect(await ink(x - 30, 70, 60, 160), t).toBeGreaterThan(10);
      x += 90;
    }
    await pick(page, 'brush', '[data-tool="brush"]');
    const y = box.y + 320;
    const width = async (xx) => { let w = 0; for (let dy = -40; dy <= 40; dy++) if (!near(await px(page, xx, y + dy), [255, 255, 255], 30)) w++; return w; };
    await pick(page, 'brush', '[data-size="8"]'); await mouseDrag(page, [[box.x + 100, y], [box.x + 200, y]], { steps: 6 });
    await pick(page, 'brush', '[data-size="34"]'); await mouseDrag(page, [[box.x + 300, y], [box.x + 400, y]], { steps: 6 });
    expect(Math.abs(await width(box.x + 150) - 8)).toBeLessThanOrEqual(3);
    expect(Math.abs(await width(box.x + 350) - 34)).toBeLessThanOrEqual(3);
    // pink paper first: the eraser must show pink, not white
    await pick(page, 'paper', '[data-paper="#FFE3EF"]');
    expect(near(await px(page, box.x + 350, y), [0x1D, 0x18, 0x42], 10)).toBe(true);   // changing paper keeps the drawing
    expect(near(await px(page, box.x + 350, y + 100), [0xFF, 0xE3, 0xEF], 2)).toBe(true);
    await page.locator('#eraser').click();
    expect((await st(page)).tool).toBe('eraser');
    await mouseDrag(page, [[box.x + 280, y], [box.x + 420, y]], { steps: 8 });
    expect(near(await px(page, box.x + 350, y), [0xFF, 0xE3, 0xEF], 2)).toBe(true);
    await page.locator('#undo').click();
    expect(near(await px(page, box.x + 350, y), [0x1D, 0x18, 0x42], 10)).toBe(true);
    await page.locator('#redo').click();
    expect(near(await px(page, box.x + 350, y), [0xFF, 0xE3, 0xEF], 2)).toBe(true);
    // the eraser button again goes back to the brush; picking a colour also leaves the eraser
    await page.locator('#eraser').click(); expect((await st(page)).tool).toBe('brush');
    await page.locator('#eraser').click(); await pickColor(page, '#24C786'); expect((await st(page)).tool).toBe('brush');
    // undo the paper change too
    await page.locator('#undo').click(); await page.locator('#undo').click();
    expect((await st(page)).paper).toBe('#FFFFFF');
  });

  test('stamps: shapes, animals, things, letters and numbers stamp in place, say what they are and count themselves', async ({ page }) => {
    await home(page); await openGame(page, 'paint');
    const box = await canvasBox(page);
    const coloured = async (cx, cy) => { let n = 0; for (let dx = -20; dx <= 20; dx += 4) for (let dy = -20; dy <= 20; dy += 4) if (!near(await px(page, cx + dx, cy + dy), [255, 255, 255], 20)) n++; return n; };
    await pickColor(page, '#3D7BFF');
    await pick(page, 'stamp', '[data-st="shape"][data-v="triangle"]');
    await expect(page.locator('.pp-say')).toContainText('3 sides');
    for (let i = 0; i < 3; i++) await page.mouse.click(box.x + 120 + i * 110, box.y + 150);
    await expect(page.locator('.pp-say')).toContainText('3');
    await expect(page.locator('.pp-say')).toContainText('Triangles');
    expect(near(await px(page, box.x + 120, box.y + 155), [0x3D, 0x7B, 0xFF], 12)).toBe(true);
    let x = 120;
    for (const [tab, v, say] of [['animals', '🐸', 'Frog'], ['things', '🚀', 'Rocket'], ['abc', 'B', 'Bear'], ['num', '3', 'three']]) {
      await page.locator('.pp-bar [data-cat="stamp"]').click();
      await page.locator(`.pp-tab[data-tab="${tab}"]`).click();
      await page.locator(`.pp-menu [data-v="${v}"]`).click();
      await page.mouse.click(box.x + x, box.y + 380);
      await expect(page.locator('.pp-say')).toContainText(say);
      expect(await coloured(box.x + x, box.y + 380), v).toBeGreaterThan(5);
      x += 140;
    }
    // picking a brush leaves stamps
    await pick(page, 'brush', '[data-tool="brush"]');
    expect((await st(page)).stamp).toBe(null);
  });

  test('mirror, four corners and snowflake copy every mark; a stroke from the middle line draws no stray lines', async ({ page }) => {
    await home(page); await openGame(page, 'paint');
    const box = await canvasBox(page), W = box.width, H = box.height;
    await pickColor(page, '#24C786');
    await pick(page, 'magic', '[data-mir="four"]');
    await page.mouse.click(box.x + 60, box.y + 60);
    for (const [x, y] of [[60, 60], [W - 60, 60], [60, H - 60], [W - 60, H - 60]]) expect(near(await px(page, box.x + x, box.y + y), [0x24, 0xC7, 0x86], 12)).toBe(true);
    await expect(page.locator('.pp-say')).toContainText('match');
    await pick(page, 'magic', '[data-mir="two"]');
    await pickColor(page, '#FF4F5E');
    await mouseDrag(page, [[box.x + W / 2, box.y + 200], [box.x + W / 2 - 150, box.y + 200]], { steps: 8 });
    expect(near(await px(page, box.x + W / 2 + 140, box.y + 200), [0xFF, 0x4F, 0x5E], 12)).toBe(true);
    expect(near(await px(page, box.x + W / 2 + 75, box.y + 260), [255, 255, 255], 2)).toBe(true);
    await pick(page, 'magic', '[data-mir="snow"]');
    await pickColor(page, '#9A5BFF');
    await page.mouse.click(box.x + W / 2 + 120, box.y + H / 2);
    expect(near(await px(page, box.x + W / 2 - 120, box.y + H / 2), [0x9A, 0x5B, 0xFF], 12)).toBe(true);
    expect(near(await px(page, box.x + W / 2 + 60, box.y + H / 2 - 120 * Math.sin(Math.PI / 3)), [0x9A, 0x5B, 0xFF], 12)).toBe(true);
    await pick(page, 'magic', '[data-mir="off"]');
    expect((await st(page)).mirror).toBe('off');
  });

  test('art talk: straight lines, zigzags, loops and dots are described with their colour', async ({ page }) => {
    await home(page); await openGame(page, 'paint');
    const box = await canvasBox(page), o = (x, y) => [box.x + x, box.y + y];
    await pickColor(page, '#FF8A2B');
    await mouseDrag(page, [o(100, 100), o(500, 100)], { steps: 20 });
    await expect(page.locator('.pp-say')).toContainText(/straight/i);
    await expect(page.locator('.pp-say')).toContainText('Orange');
    await expect(page.locator('.pp-say')).toContainText('across');
    await mouseDrag(page, [o(100, 300), o(160, 220), o(220, 300), o(280, 220), o(340, 300), o(400, 220)], { steps: 8 });
    await expect(page.locator('.pp-say')).toContainText(/zigzag/i);
    const loop = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; loop.push(o(700 + 90 * Math.cos(a), 300 + 90 * Math.sin(a))); }
    await mouseDrag(page, loop, { steps: 2 });
    await expect(page.locator('.pp-say')).toContainText('circle');
    for (let i = 0; i < 3; i++) await page.mouse.click(box.x + 100 + i * 30, box.y + 450);
    await expect(page.locator('.pp-say')).toContainText(/three dots/i);
    // words can be switched off
    await pick(page, 'magic', '[data-words]');
    expect((await st(page)).words).toBe(false);
  });

  test('mixing pot: red + yellow makes orange (a star the first time); colour + white is light', async ({ page }) => {
    await home(page); await openGame(page, 'paint');
    const s0 = await page.evaluate(() => +document.querySelector('.starn').textContent);
    await page.locator('.pp-bar [data-cat="color"]').click();
    await page.locator('.pp-menu [data-mix][data-n="Red"]').click();
    await page.locator('.pp-menu [data-mix][data-n="Yellow"]').click();
    expect((await st(page)).colorName).toBe('Orange');
    await expect(page.locator('.pp-say')).toContainText('Red + Yellow = Orange');
    expect(await page.evaluate(() => +document.querySelector('.starn').textContent)).toBe(s0 + 1);
    await page.locator('.pp-menu [data-mix][data-n="Blue"]').click();
    await page.locator('.pp-menu [data-mix][data-n="White"]').click();
    expect((await st(page)).colorName).toBe('Light blue');
    await expect(page.locator('.pp-menu')).toBeHidden({ timeout: 4000 });
  });

  test('coloring pages: the fill bucket colours a piece and names its shape; colouring every piece earns a star; the number page counts', async ({ page }) => {
    test.setTimeout(90_000);
    await home(page); await openGame(page, 'paint');
    const box = await canvasBox(page);
    await pick(page, 'paper', '[data-page="house"]');
    expect((await st(page)).tool).toBe('fill');
    await pickColor(page, '#FF4F5E');
    const parts = await dbg(page, 'paint', d => d.partCenters());
    expect(parts.length).toBe(7);
    const roof = parts.find(p => p.name === 'roof');
    await page.mouse.click(box.x + roof.pt[0], box.y + roof.pt[1]);
    await expect(page.locator('.pp-say')).toContainText('roof');
    await expect(page.locator('.pp-say')).toContainText('triangle');
    expect(near(await px(page, box.x + roof.pt[0], box.y + roof.pt[1]), [0xFF, 0x4F, 0x5E], 4)).toBe(true);
    // the fill stops at the outline: the wall below stays white
    const wall = parts.find(p => p.name === 'wall');
    expect(near(await px(page, box.x + wall.pt[0], box.y + wall.pt[1]), [255, 255, 255], 2)).toBe(true);
    const s0 = await page.evaluate(() => +document.querySelector('.starn').textContent);
    for (const p of parts.filter(p => p.name !== 'roof')) await page.mouse.click(box.x + p.pt[0], box.y + p.pt[1]);
    await expect.poll(() => page.evaluate(() => +document.querySelector('.starn').textContent)).toBe(s0 + 1);
    await expect(page.locator('.pp-say')).toContainText('whole house');
    // the number page: 1, then tapping again gives 2 dots to colour and count
    await pick(page, 'paper', '[data-page="num"]');
    await pick(page, 'paper', '[data-page="num"]');
    expect((await st(page)).numN).toBe(2);
    const dots = await dbg(page, 'paint', d => d.partCenters());
    expect(dots.length).toBe(2);
    await page.mouse.click(box.x + dots[0].pt[0], box.y + dots[0].pt[1]);
    await expect(page.locator('.pp-say')).toContainText('one');
    await page.mouse.click(box.x + dots[1].pt[0], box.y + dots[1].pt[1]);
    await expect(page.locator('.pp-say')).toContainText('counted two', { timeout: 4000 });
    // undo goes back to the house, colours and all
    await page.locator('#undo').click(); await page.locator('#undo').click(); await page.locator('#undo').click(); await page.locator('#undo').click();
    expect((await st(page)).page.id).toBe('house');
    expect(near(await px(page, box.x + roof.pt[0], box.y + roof.pt[1]), [0xFF, 0x4F, 0x5E], 4)).toBe(true);
  });

  test('new paper needs two taps, and undo brings the picture back; letter pages step through the alphabet', async ({ page }) => {
    await home(page); await openGame(page, 'paint');
    const box = await canvasBox(page);
    await pickColor(page, '#24C786');
    await mouseDrag(page, [[box.x + 60, box.y + 60], [box.x + 200, box.y + 60]], { steps: 6 });
    await page.locator('.pp-bar [data-cat="paper"]').click();
    await page.locator('.pp-menu #clr').click();
    expect(near(await px(page, box.x + 100, box.y + 60), [0x24, 0xC7, 0x86], 12)).toBe(true);   // one tap does nothing yet
    await page.locator('.pp-menu #clr').click();
    expect(near(await px(page, box.x + 100, box.y + 60), [255, 255, 255], 1)).toBe(true);
    await page.locator('#undo').click();
    expect(near(await px(page, box.x + 100, box.y + 60), [0x24, 0xC7, 0x86], 12)).toBe(true);
    await pick(page, 'paper', '[data-page="abc"]');
    await expect(page.locator('.pp-say')).toContainText('A is for Apple');
    await pick(page, 'paper', '[data-page="abc"]');
    await expect(page.locator('.pp-say')).toContainText('B is for Bear');
  });

  test('a stroke that leaves the paper and comes back stays one continuous line, and the picture survives a resize', async ({ page }) => {
    await home(page); await openGame(page, 'paint');
    const box = await canvasBox(page);
    await pickColor(page, '#9A5BFF');
    await mouseDrag(page, [[box.x + 200, box.y + 200], [box.x + 200, box.y - 40], [box.x + 260, box.y + 200]], { steps: 10 });
    expect(near(await px(page, box.x + 200, box.y + 150), [0x9A, 0x5B, 0xFF], 10)).toBe(true);
    expect(near(await px(page, box.x + 252, box.y + 150), [0x9A, 0x5B, 0xFF], 40)).toBe(true);
    await page.setViewportSize({ width: 1200, height: 860 });
    await page.waitForTimeout(400);
    const b2 = await canvasBox(page);
    const sx = b2.width / box.width, sy = b2.height / box.height;
    expect(near(await px(page, b2.x + 200 * sx, b2.y + 150 * sy), [0x9A, 0x5B, 0xFF], 30)).toBe(true);
  });
});

/* ---------------- Hungry Monster ---------------- */
test.describe('09 Hungry Monster', () => {
  test('feeding never waits for a round and accepts every food once', async ({ page }) => {
    await home(page); await openGame(page,'feed');
    await expect(page.locator('.feed-source')).toHaveCount(12);
    await expect(page.locator('.chip[data-l]')).toHaveCount(0);
    for(let i=0;i<8;i++){
      await page.locator('.feed-source[data-ingredient="apple"]').click();
      expect(await dbg(page,'feed',d=>d.fed)).toBe(i+1);
    }
    expect(await dbg(page,'feed',d=>d.activePointers)).toBe(0);
    await expect(page.locator('#feed-total')).toContainText('8');
    await expect(page.locator('.feed-source').first()).toBeEnabled();
  });

  test('independent food actions: mix two ingredients, then plant a third', async ({ page }) => {
    await home(page); await openGame(page,'feed');
    const bowl=await page.locator('#feed-bowl').boundingBox();
    const garden=await page.locator('#feed-garden').boundingBox();
    const drop=async (name,target)=>{
      const b=await page.locator('.feed-source[data-ingredient="'+name+'"]').boundingBox();
      await mouseDrag(page,[[b.x+b.width/2,b.y+b.height/2],[target.x+target.width/2,target.y+target.height/2]],{steps:10});
    };
    await drop('apple',bowl);
    expect(await dbg(page,'feed',d=>d.bowlItems)).toBe(1);
    await drop('berry',bowl);
    expect(await dbg(page,'feed',d=>d.mixed)).toBe(1);
    expect(await dbg(page,'feed',d=>d.recipes)).toBe(1);
    await expect(page.locator('.feed-food.feed-recipe')).toHaveCount(1);
    await drop('carrot',garden);
    expect(await dbg(page,'feed',d=>d.planted)).toBe(1);
    await expect(page.locator('#feed-garden-count')).toContainText('1');
    expect(await dbg(page,'feed',d=>d.activePointers)).toBe(0);
  });

  test('two simultaneous fingers can feed independently with no player selection', async ({ page }) => {
    await home(page);await openGame(page,'feed');
    const a=await page.locator('.feed-source[data-ingredient="apple"]').boundingBox();
    const b=await page.locator('.feed-source[data-ingredient="banana"]').boundingBox();
    const m=await page.locator('#mon').boundingBox();
    const fromA=[a.x+a.width/2,a.y+a.height/2],fromB=[b.x+b.width/2,b.y+b.height/2];
    const toA=[m.x+m.width*.40,m.y+m.height*.57],toB=[m.x+m.width*.60,m.y+m.height*.57];
    const { touchSession } = await import('./helpers.mjs');
    const touch=await touchSession(page);
    await touch.multi([[fromA,fromB],[toA,toB]],50);
    await expect.poll(()=>dbg(page,'feed',d=>d.fed)).toBe(2);
    expect(await dbg(page,'feed',d=>d.simultaneous)).toBeGreaterThanOrEqual(2);
    expect(await dbg(page,'feed',d=>d.activePointers)).toBe(0);
    expect(await dbg(page,'feed',d=>d.looseFood)).toBe(0);
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
    // keys light for a fifth of a second; record each lighting instead of racing it
    await page.evaluate(() => { window.__lit = []; new MutationObserver(ms => ms.forEach(m => { if (m.target.classList.contains('lit')) window.__lit.push(+m.target.dataset.i); })).observe(document.querySelector('#stage'), { subtree: true, attributes: true, attributeFilter: ['class'] }); });
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => { window.__freqs = []; });
      await page.locator(`.pad[data-i="${i}"]`).click();
      const f = await page.evaluate(() => window.__freqs);
      expect(Math.abs(f[0] - want[i])).toBeLessThan(0.02);
      expect(Math.abs(f[1] - want[i] * 2)).toBeLessThan(0.04);  // the soft octave above
      expect(await page.evaluate(() => window.__lit)).toContain(i);
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
    test.setTimeout(150_000);
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
    test.setTimeout(900_000);
    await home(page); await openGame(page, 'trace');
    for (const set of ['abc', 'num']) {
      await page.locator(`[data-set="${set}"]`).click();
      const chars = await dbg(page, 'trace', (d, G, W, s) => d.SETS[s], set);
      for (let i = 0; i < chars.length; i++) {
        expect(await dbg(page, 'trace', d => d.state.ch)).toBe(chars[i]);
        await traceCurrent(page);
        const st = await dbg(page, 'trace', d => d.state);
        expect(st.done, `traced ${chars[i]}`).toBe(true);
        // a finished letter moves on by itself after a few seconds (tapping Next as well would skip one)
        await waitDbg(page, 'trace', (d, G, W, c) => d.state.ch === c && !d.state.done, { arg: chars[(i + 1) % chars.length], timeout: 20_000 });
      }
    }
    expect(Number(await page.locator('#game .starn').textContent())).toBe(36);
  });

  test('tracing backwards or starting away from the green dot does not count', async ({ page }) => {
    test.setTimeout(180_000);
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
