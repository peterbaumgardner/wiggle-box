// Frame-rate independence, memory over many visits, frame cost per game, and long stress runs.
import { test, expect, GAME_KEYS, home, openGame, dbg } from './helpers.mjs';

/* Pretend the screen refreshes at `hz`: requestAnimationFrame fires on a timer instead of the real display. */
const fakeDisplay = hz => `(() => { const iv = 1000 / ${hz}; let next = performance.now();
  window.requestAnimationFrame = cb => { next = Math.max(next + iv, performance.now()); return setTimeout(() => cb(performance.now()), Math.max(0, next - performance.now())); };
  window.cancelAnimationFrame = id => clearTimeout(id); })();`;

for (const hz of [30, 60, 120]) {
  test(`game speed is the same on a ${hz} Hz screen (fixed 60 steps a second)`, async ({ page }) => {
    await page.addInitScript(fakeDisplay(hz));
    await home(page);
    await openGame(page, 'space');
    const rate = await page.evaluate(() => new Promise(res => { const d = window.WiggleBox.games.space._debug, s0 = d.simT, t0 = performance.now(); setTimeout(() => res((d.simT - s0) / ((performance.now() - t0) / 1000)), 3000); }));
    expect(rate, 'simulated seconds per real second').toBeGreaterThan(.85);
    expect(rate).toBeLessThan(1.1);
    await page.locator('#back').click();
    await openGame(page, 'physics');
    await page.waitForFunction(() => window.Matter && window.WiggleBox.games.physics._debug);
    const steps = await page.evaluate(() => new Promise(res => { const d = window.WiggleBox.games.physics._debug, f0 = d.frame, t0 = performance.now(); setTimeout(() => res((d.frame - f0) / ((performance.now() - t0) / 1000)), 3000); }));
    expect(steps, 'physics steps per second').toBeGreaterThan(51);
    expect(steps).toBeLessThan(66);
  });
}

test('memory and DOM stay flat after visiting every game many times', async ({ page, context }) => {
  test.setTimeout(300_000);
  const cdp = await context.newCDPSession(page);
  await home(page);
  const visitAll = async () => { for (const k of GAME_KEYS) { await openGame(page, k); await page.waitForTimeout(k === 'physics' ? 600 : 250); await page.locator('#back').click(); await expect(page.locator('#home')).toBeVisible(); } };
  const measure = async () => { await page.waitForTimeout(500); for (let i = 0; i < 3; i++) await cdp.send('HeapProfiler.collectGarbage'); const h = await cdp.send('Runtime.getHeapUsage'); const c = await cdp.send('Memory.getDOMCounters'); return { heap: h.usedSize, nodes: c.nodes, listeners: c.jsEventListeners }; };
  await visitAll();                        // warm up: fonts, the physics engine, caches
  const m1 = await measure();
  await visitAll(); await visitAll();
  const m2 = await measure();
  test.info().annotations.push({ type: 'memory', description: `heap ${(m1.heap / 1e6).toFixed(1)} → ${(m2.heap / 1e6).toFixed(1)} MB, DOM nodes ${m1.nodes} → ${m2.nodes}, listeners ${m1.listeners} → ${m2.listeners}` });
  expect(m2.heap - m1.heap, 'heap growth over 56 more visits').toBeLessThan(6e6);
  expect(m2.nodes - m1.nodes, 'DOM node growth').toBeLessThan(300);
  expect(m2.listeners - m1.listeners, 'listener growth').toBeLessThan(30);
});

test('frame cost of every game (recorded for the report; each must hold at least 25 fps here)', async ({ page }) => {
  test.setTimeout(300_000);
  await home(page);
  const rows = [];
  for (const k of GAME_KEYS) {
    await openGame(page, k);
    if (k === 'physics') await page.waitForFunction(() => window.Matter);
    await page.waitForTimeout(700);
    const r = await page.evaluate(() => new Promise(res => {
      const long = []; let po; try { po = new PerformanceObserver(l => l.getEntries().forEach(e => long.push(e.duration))); po.observe({ entryTypes: ['longtask'] }); } catch (e) {}
      const gaps = []; let last = performance.now();
      const f = t => { gaps.push(t - last); last = t; if (gaps.length < 150) requestAnimationFrame(f); else { po && po.disconnect(); gaps.sort((a, b) => a - b); res({ median: gaps[gaps.length >> 1], p95: gaps[Math.floor(gaps.length * .95)], long: long.length, worst: Math.max(0, ...long) }); } };
      requestAnimationFrame(f);
    }));
    rows.push({ game: k, ...r });
    await page.locator('#back').click();
  }
  test.info().annotations.push({ type: 'frame-times', description: JSON.stringify(rows) });
  await test.info().attach('frame-times.json', { body: JSON.stringify(rows, null, 1), contentType: 'application/json' });
  // 25 fps floor on this 2-core headless machine with software rendering; real devices draw on the GPU
  for (const r of rows) expect(r.median, `${r.game} median frame ${r.median.toFixed(1)} ms`).toBeLessThan(40);
});

test('long stress run: bombs in the physics tower, four fountains, a busy volcano, a full sky', async ({ page }) => {
  test.setTimeout(180_000);
  await home(page);
  await openGame(page, 'physics');
  await page.waitForFunction(() => window.Matter && window.WiggleBox.games.physics._debug);
  await dbg(page, 'physics', d => { d.scene('tower'); for (let i = 0; i < 6; i++) d.spawn('bomb', d.W * (.2 + i * .12), d.H * .2); for (let i = 0; i < 60; i++) d.spawn(['ball', 'crate', 'brick', 'balloon'][i % 4], d.W * Math.random(), d.H * .3 * Math.random()); });
  await page.waitForTimeout(20_000);
  const p = await dbg(page, 'physics', d => { const bs = window.Matter.Composite.allBodies(d.world); return { n: bs.filter(b => !b.isStatic).length, ok: bs.every(b => Number.isFinite(b.position.x + b.position.y + b.angle)) }; });
  expect(p.ok).toBe(true); expect(p.n).toBeLessThanOrEqual(250);
  await page.locator('#back').click();

  await openGame(page, 'splash');
  await dbg(page, 'splash', d => { d.scene('empty'); });
  await page.locator('.tool[data-t="spring"]').click();
  const b = await page.locator('#stage canvas').first().boundingBox();
  for (let i = 0; i < 4; i++) await page.mouse.click(b.x + b.width * (.2 + i * .2), b.y + b.height * .15);
  await page.waitForTimeout(20_000);
  const s = await dbg(page, 'splash', d => { const m = d.sim; let ok = true; for (let i = 0; i < m.n; i++) if (!(m.x[i] >= 0 && m.x[i] <= m.W && m.y[i] >= 0 && m.y[i] <= m.H)) ok = false; return { n: m.n, cap: m.cap, ok, perf: d.perf }; });
  expect(s.ok).toBe(true); expect(s.n).toBeLessThanOrEqual(s.cap);
  test.info().annotations.push({ type: 'splash-stress', description: `${s.n} particles (cap ${s.cap}), ${s.perf.toFixed(1)} ms per frame` });
  await page.locator('#back').click();

  await openGame(page, 'sand');
  await page.waitForTimeout(20_000);
  expect(await dbg(page, 'sand', d => d.T.length === d.cols * d.rows)).toBe(true);
  await page.locator('#back').click();

  await openGame(page, 'space');
  const c = await page.locator('#stage canvas').first().boundingBox();
  await page.locator('[data-a="fast"]').click();
  for (let i = 0; i < 45; i++) await page.mouse.click(c.x + c.width * (.1 + .8 * (i % 9) / 9), c.y + c.height * (.15 + .15 * Math.floor(i / 9)));
  await page.waitForTimeout(15_000);
  const sp = await dbg(page, 'space', d => ({ n: d.bodies.length, ok: d.bodies.every(b => Number.isFinite(b.x + b.y + b.vx + b.vy)) }));
  expect(sp.ok).toBe(true); expect(sp.n).toBeLessThanOrEqual(40);
});
