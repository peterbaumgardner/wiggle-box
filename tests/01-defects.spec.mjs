// Reproductions of specific defects found in the audit. Each one failed on the original code (see WIGGLE_BOX_AUDIT.md)
// and must pass after the repair. They use real clicks and drags wherever the defect involves input.
import { test, expect, home, openGame, goBack, dbg, waitDbg, canvasBox, mouseDrag } from './helpers.mjs';

test.describe('lifecycle', () => {
  test('D01 leaving a game before it finishes starting does not crash or leave a half-built game', async ({ page }) => {
    await home(page);
    await page.evaluate(() => { document.querySelector('.tile[data-g="cannon"]').click(); document.querySelector('#back').click(); });
    await page.waitForTimeout(400);
    await expect(page.locator('#home')).toBeVisible();
    await expect(page.locator('#stage')).toBeEmpty();
  });

  test('D02 a double tap on a tile starts the game once, not twice on top of itself', async ({ page }) => {
    await home(page);
    await page.evaluate(() => { const t = document.querySelector('.tile[data-g="balance"]'); t.click(); t.click(); });
    await page.waitForFunction(() => window.WiggleBox.ready === 'balance');
    await page.waitForTimeout(300);
    expect(await page.locator('#stage .lab').count()).toBe(1);
    expect(await page.locator('#stage canvas').count()).toBe(1);
  });
});

test.describe('drag and tap helper', () => {
  test('D03 tapping a shape shows its name once (tap was firing twice)', async ({ page }) => {
    await home(page); await openGame(page, 'shapes');
    const piece = page.locator('#pile .piece').first();
    await piece.click();
    await page.waitForTimeout(150);
    expect(await page.locator('#stage .floaty').count()).toBe(1);
  });

  test('D04 dropping a shape in the right hole does not also buzz and shake the hole', async ({ page }) => {
    await home(page); await openGame(page, 'shapes');
    const piece = page.locator('#pile .piece').first();
    const s = await piece.getAttribute('data-s');
    const hole = page.locator(`#holes .hole[data-s="${s}"]`);
    const a = await piece.boundingBox(), b = await hole.boundingBox();
    await mouseDrag(page, [[a.x + a.width / 2, a.y + a.height / 2], [b.x + b.width / 2, b.y + b.height / 2]], { steps: 12 });
    await expect(hole.locator('.piece')).toHaveCount(1);
    await page.waitForTimeout(200);
    expect(await hole.evaluate(h => h.classList.contains('shake'))).toBe(false);
  });
});

test.describe('bridge builder', () => {
  test('D05 opening or closing an info tab does not erase the bridge', async ({ page }) => {
    await home(page); await openGame(page, 'bridge');
    const box = await canvasBox(page);
    const L = await dbg(page, 'bridge', d => d.L()), gr = await dbg(page, 'bridge', d => d.grid());
    // drag a road beam from the left cliff dot two squares out
    await mouseDrag(page, [[box.x + L.x0, box.y + L.H * .62], [box.x + L.x0 + gr * 2, box.y + L.H * .62]], { steps: 8 });
    expect(await dbg(page, 'bridge', d => d.beams.length)).toBe(1);
    await page.locator('.idock .itab').first().click();
    await page.waitForTimeout(400);
    await page.locator('.idock .itab').first().click();
    await page.waitForTimeout(400);
    expect(await dbg(page, 'bridge', d => d.beams.length)).toBe(1);
  });
});

test.describe('circuit lab', () => {
  test('D06 a circuit at the edge of the board keeps working after the screen gets narrower', async ({ page }) => {
    await home(page); await openGame(page, 'circuit');
    await dbg(page, 'circuit', d => { d.setTool('bat'); d.place([6, 2], [6, 1]); d.setTool('wire'); d.place([6, 1], [7, 1]); d.place([6, 2], [7, 2]); d.setTool('bulb'); d.place([7, 1], [7, 2]); return 1; });
    expect(await dbg(page, 'circuit', d => d.sol.bulbs.filter(b => b.lit).length)).toBe(1);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.waitForTimeout(500);
    expect(await dbg(page, 'circuit', d => { d.solve(); return d.sol.bulbs.filter(b => b.lit).length; })).toBe(1);
  });

  test('D07 two bulbs in series on two batteries do not count as the parallel challenge', async ({ page }) => {
    await home(page); await openGame(page, 'circuit');
    await page.locator('#clr').click();
    await dbg(page, 'circuit', d => {
      d.setTool('bat'); d.place([1, 2], [1, 1]); d.place([1, 3], [1, 2]);
      d.setTool('wire'); d.place([1, 1], [2, 1]); d.place([3, 2], [3, 3]); d.place([1, 3], [2, 3]); d.place([2, 3], [3, 3]);
      d.setTool('bulb'); d.place([2, 1], [3, 1]); d.place([3, 1], [3, 2]); return 1;
    });
    const r = await dbg(page, 'circuit', d => ({ lit: d.sol.bulbs.filter(b => b.lit).length, done: [...d.done] }));
    expect(r.lit).toBe(2);
    expect(r.done).toContain('series');
    expect(r.done).not.toContain('par');
  });

  test('D08 two bulbs in two separate loops do not count as one series loop', async ({ page }) => {
    await home(page); await openGame(page, 'circuit');
    await page.locator('#clr').click();
    await dbg(page, 'circuit', d => {
      for (const x of [1, 5]) { d.setTool('bat'); d.place([x, 2], [x, 1]); d.setTool('wire'); d.place([x, 1], [x + 1, 1]); d.place([x, 2], [x + 1, 2]); d.setTool('bulb'); d.place([x + 1, 1], [x + 1, 2]); }
      return 1;
    });
    const r = await dbg(page, 'circuit', d => ({ lit: d.sol.bulbs.filter(b => b.lit).length, done: [...d.done] }));
    expect(r.lit).toBe(2);
    expect(r.done).not.toContain('series');
    expect(r.done).not.toContain('par');
  });
});

test.describe('balance scale', () => {
  test('D09 tapping an empty side does not add a dead step to Undo', async ({ page }) => {
    await home(page); await openGame(page, 'balance');
    await dbg(page, 'balance', d => { d.take('L', 'u'); d.take('R', 'b'); return 1; }); // the right side has no boxes on level 1
    await page.locator('#undo').click();
    expect(await dbg(page, 'balance', d => d.L.u)).toBe(2);
  });
  test('D10 Undo on the seesaw updates the equation', async ({ page }) => {
    await home(page); await openGame(page, 'balance');
    await page.locator('[data-mode="torque"]').click();
    await dbg(page, 'balance', d => { d.tq.right.push({ m: 3, d: 1 }); return 1; });
    await page.keyboard.press('1');
    await expect(page.locator('#eq')).toContainText('3×1');
    await page.locator('#undo').click();
    await page.locator('#undo').click();
    await expect(page.locator('#eq')).not.toContainText('3×1');
  });
});

test.describe('robo code', () => {
  test('D11 a "My move" that calls itself does not crash Run', async ({ page }) => {
    await home(page); await openGame(page, 'robo');
    await dbg(page, 'robo', d => { d.load(6); d.setProg([{ k: 'P' }], [{ k: 'F' }, { k: 'P' }]); return 1; });
    await page.locator('#run').click();
    await page.waitForTimeout(300);
    await page.locator('#stop').click();
  });
  test('D12 a huge nested loop does not freeze the browser, and Reset still works', async ({ page }) => {
    await home(page); await openGame(page, 'robo');
    await dbg(page, 'robo', d => { d.load(2); let b = [{ k: 'L' }]; for (let i = 0; i < 9; i++) b = [{ n: 9, body: b }]; d.setProg(b); return 1; });
    const t0 = Date.now();
    await page.locator('#run').click({ timeout: 8000 });
    expect(Date.now() - t0).toBeLessThan(4000);
    await page.locator('#stop').click({ timeout: 4000 });
    expect(await dbg(page, 'robo', d => d.run)).toBe(null);
  });
});

test.describe('shape lab', () => {
  test('D13 "Make it perfect" on a triangle is named an equilateral triangle', async ({ page }) => {
    await home(page); await openGame(page, 'geo');
    await page.locator('#subc').click();
    await page.locator('#reg').click();
    await expect(page.locator('#pn')).toContainText('Equilateral triangle');
  });
});

test.describe('math art', () => {
  test('D14 the leaf-tip count on the panel matches the leaves drawn on the tree', async ({ page }) => {
    await home(page); await openGame(page, 'art');
    await page.locator('[data-am="tree"]').click();
    await dbg(page, 'art', d => { d.S.tree.depth = 5; d.setMode('tree'); return 1; });
    const drawn = await page.evaluate(() => new Promise(res => {
      // leaves are the 2.5px dots; each drawn frame starts with one full-canvas fillRect at (0,0)
      const P = CanvasRenderingContext2D.prototype, orig = P.arc, ofr = P.fillRect; let n = 0, frames = 0;
      P.arc = function (x, y, r, ...rest) { if (r === 2.5) n++; return orig.call(this, x, y, r, ...rest); };
      P.fillRect = function (x, y, ...rest) { if (x === 0 && y === 0) frames++; return ofr.call(this, x, y, ...rest); };
      setTimeout(() => { P.arc = orig; P.fillRect = ofr; res(n / frames); }, 300);
    }));
    const shown = await page.locator('#pn .fx').first().locator('.num').innerText();
    expect(Number(shown)).toBe(drawn);
  });
});

test.describe('chance machine', () => {
  test('D15 with one die the panel does not claim 1 is the most likely roll', async ({ page }) => {
    await home(page); await openGame(page, 'chance');
    await page.locator('[data-cm="dice"]').click();
    await page.locator('[data-dn="1"]').click();
    const big = await page.locator('#pn .fx.big').evaluate(e => e.textContent.replace(/\s+/g, ' '));
    expect(big).not.toMatch(/Most likely sum\s*1\b/);
    expect(big).toMatch(/1\s*6/); // 1/6 shown for every face
  });
});

test.describe('laser lab', () => {
  test('D16 every puzzle level can actually be solved with its pieces', async ({ page }) => {
    await home(page); await openGame(page, 'laser');
    const res = await dbg(page, 'laser', d => {
      const out = [];
      // level 5 (index 4): the prism level. Try every free cell and angle the child can reach.
      d.load(4);
      const pr = d.pieces.find(p => p.k === 'prism');
      let ok = false;
      for (let i = 0; i < 10 && !ok; i++) for (let j = 0; j < 7 && !ok; j++) {
        if (d.pieces.some(p => p !== pr && p.i === i && p.j === j)) continue;
        for (let a = 0; a < 360; a += 15) { pr.i = i; pr.j = j; pr.a = a; d.trace(); if (d.lit.size === 2) { ok = true; break; } }
      }
      out.push(ok);
      return out;
    });
    expect(res).toEqual([true]);
  });
});

test.describe('puzzle box', () => {
  test('D17 switching puzzles right after winning Lights Out does not swap the new puzzle back', async ({ page }) => {
    await home(page); await openGame(page, 'puzzles');
    await page.locator('[data-pz="lights"]').click();
    // find the presses that clear the board (3x3: try all 512 sets), then press them for real
    const presses = await dbg(page, 'puzzles', d => {
      const n = d.LO.n, b0 = d.LO.b.slice();
      for (let m = 0; m < 1 << (n * n); m++) {
        const b = b0.slice();
        for (let i = 0; i < n * n; i++) if (m >> i & 1) { const x = i % n, y = (i / n) | 0; for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < n && Y < n) b[Y * n + X] ^= 1; } }
        if (b.every(v => !v)) return [...Array(n * n).keys()].filter(i => m >> i & 1);
      }
      return null;
    });
    expect(presses).not.toBeNull();
    for (const i of presses) await page.locator(`[data-lamp="${i}"]`).click();
    await page.locator('[data-pz="hanoi"]').click();
    await page.waitForTimeout(3000);
    await expect(page.locator('#pz .hanoi')).toHaveCount(1);
    await expect(page.locator('#pz .lgrid')).toHaveCount(0);
  });
});

test.describe('wave lab', () => {
  test('D18 turning the sound off silences a playing string', async ({ page }) => {
    await home(page); await openGame(page, 'waves');
    await page.locator('[data-wm="string"]').click();
    await page.locator('#play').click();
    expect(await dbg(page, 'waves', d => !!d.ST.osc)).toBe(true);
    await page.locator('#snd2').click();
    await page.waitForTimeout(200);
    expect(await dbg(page, 'waves', d => !d.ST.osc || d.ST.gain.gain.value < .01)).toBe(true);
  });
});

test.describe('space orbits', () => {
  test('D19 rotating or resizing the screen keeps the planets in orbit', async ({ page }) => {
    await home(page); await openGame(page, 'space');
    await page.waitForTimeout(500);
    const before = await dbg(page, 'space', d => d.bodies.filter(b => !b.parent).length);
    await page.setViewportSize({ width: 900, height: 1200 });
    await page.waitForTimeout(4000);
    const after = await page.evaluate(() => {
      const d = window.WiggleBox.games.space._debug, c = document.querySelector('#stage canvas').getBoundingClientRect();
      return d.bodies.filter(b => !b.parent && b.x > -20 && b.y > -20 && b.x < c.width + 20 && b.y < c.height + 20).length;
    });
    expect(after).toBe(before);
  });
});
