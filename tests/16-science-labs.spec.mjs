// Games 24-26 and 28: Element Box, Space Orbits, Splash Lab, Wave Lab.
import { test, expect, home, openGame, dbg, waitDbg, canvasBox, mouseDrag, pick } from './helpers.mjs';

/* ---------------- Element Box ---------------- */
const E = { SAND: 1, WATER: 2, STONE: 3, WOOD: 4, FIRE: 5, LAVA: 6, STEAM: 7, PLANT: 8, SEED: 9, ICE: 11, SNOW: 12, OIL: 13, GLASS: 16, FISH: 17, SALT: 21, SALTW: 22, ACID: 23, METAL: 24, BOOM: 26, SPARK: 27, DIRT: 32, LAMP: 34 };
const TAB = { 1: 'powder', 21: 'powder', 32: 'powder', 12: 'powder', 9: 'powder', 26: 'powder', 2: 'liquid', 22: 'liquid', 13: 'liquid', 23: 'liquid', 6: 'liquid', 3: 'solid', 4: 'solid', 24: 'solid', 11: 'solid', 16: 'solid', 5: 'air', 7: 'air', 8: 'life', 17: 'life', 27: 'power' };
const sandCount = (page, t) => dbg(page, 'sand', (d, G, W, t) => d.count(t), t);
async function sandScene(page, s) { await page.locator('#scenes').click(); await page.locator(`.popitem[data-s="${s}"]`).click(); }
async function pickEl(page, el) { await page.locator('#elbtn').click(); await page.locator(`.pop .eb-tab[data-tab="${TAB[el]}"]`).click(); await page.locator(`.pop [data-e="${el}"]`).click(); await expect(page.locator('.pop')).toHaveCount(0); }
async function pickTool(page, t) { await page.locator('#toolbtn').click(); await page.locator(`.pop [data-t="${t}"]`).click(); }
async function pickSize(page, i) { await page.locator('#sizebtn').click(); await page.locator(`.pop [data-b="${i}"]`).click(); }
async function paint(page, el, from, to, { size } = {}) {
  if (el != null) await pickEl(page, el);
  if (size != null) await pickSize(page, size);
  const b = await canvasBox(page);
  const P = ([x, y]) => [b.x + x * b.width, b.y + y * b.height];
  await mouseDrag(page, [P(from), P(to)], { steps: 12, delay: 15 });
}
const place = (page, t, x0, y0, x1, y1, dense = 1) => dbg(page, 'sand', (d, G, W, a) => d.place(...a), [t, x0, y0, x1, y1, dense]);

test.describe('24 Element Box', () => {
  test('fine 2 px grains fill a big world; zoom switches grain size and keeps the picture', async ({ page }) => {
    await home(page); await openGame(page, 'sand');
    const g0 = await dbg(page, 'sand', d => ({ cs: d.cs, cols: d.cols, rows: d.rows }));
    expect(g0.cs).toBe(2);
    expect(g0.cols * g0.rows).toBeGreaterThan(150_000);
    const stone0 = await sandCount(page, E.STONE);
    await page.locator('#zoom').click();
    expect(await dbg(page, 'sand', d => d.cs)).toBe(3);
    const stone1 = await sandCount(page, E.STONE);
    expect(stone1 / stone0).toBeGreaterThan(.3); expect(stone1 / stone0).toBeLessThan(.6);   // same picture, (2/3)² as many cells
    await page.locator('#zoom').click(); await page.locator('#zoom').click();
    expect(await dbg(page, 'sand', d => d.cs)).toBe(2);
  });

  test('all 24 discoveries can be made, each earns a star, and the list shows them', async ({ page }) => {
    test.setTimeout(240_000);
    await home(page); await openGame(page, 'sand');
    await waitDbg(page, 'sand', d => d.found.has('stone'), { timeout: 20_000 });   // the volcano does the first one
    const T = (t, x0, y0, x1, y1, dn) => ['p', t, x0, y0, x1, y1, dn];
    const recipes = {
      steam: [T(E.WATER, .5, .9, .9, 1), T(E.FIRE, .5, .8, .9, .9)],
      glass: [T(E.SAND, .5, .9, .9, 1), T(E.LAVA, .5, .8, .9, .9)],
      flower: [T(E.WATER, .5, .95, .9, 1), T(E.SEED, .5, .85, .9, .95, .05)],
      grow: [T(E.PLANT, .5, .95, .9, 1), T(E.WATER, .5, .85, .9, .95)],
      melt: [T(E.ICE, .6, .9, .8, 1), T(E.FIRE, .5, .8, .9, .9)],
      freeze: [T(E.WATER, .5, .9, .9, 1), T(E.ICE, .5, .88, .9, .9)],
      rain: [T(E.STEAM, .5, .2, .9, .3)],
      burn: [T(E.WOOD, .5, .9, .9, 1), T(E.FIRE, .5, .85, .9, .9)],
      oil: [T(E.OIL, .5, .9, .9, 1), T(E.FIRE, .5, .85, .9, .9)],
      float: [T(E.OIL, .5, .9, .9, 1), T(E.WATER, .5, .7, .9, .8)],
      dissolve: [T(E.WATER, .5, .9, .9, 1), T(E.SALT, .5, .8, .9, .85, .5)],
      saltice: [T(E.ICE, .5, .9, .9, 1), T(E.SALT, .5, .85, .9, .9, .5)],
      evap: [T(E.SALTW, .5, .9, .9, 1), T(E.FIRE, .5, .85, .9, .9)],
      acid: [T(E.STONE, .5, .9, .9, 1), T(E.ACID, .5, .8, .9, .9)],
      safe: [T(E.GLASS, .5, .9, .9, 1), T(E.ACID, .5, .8, .9, .9)],
      rust: [T(E.METAL, .5, .9, .9, 1), T(E.SALTW, .5, .8, .9, .9)],
      boom: [T(E.BOOM, .5, .9, .9, 1), T(E.FIRE, .5, .85, .9, .9)],
      fulgurite: [T(E.SAND, .5, .9, .9, 1), T(E.SPARK, .5, .87, .9, .9)],
      mud: [T(E.DIRT, .5, .9, .9, 1), T(E.WATER, .5, .8, .9, .9)],
      meltrock: [T(E.STONE, .5, .8, .9, 1), ['heat', .7, .9, 60]],
      condense: [T(E.STEAM, .5, .4, .9, .6), ['cool', .7, .5, 30]],
    };
    for (const [k, steps] of Object.entries(recipes)) {
      if (await dbg(page, 'sand', (d, G, W, k) => d.found.has(k), k)) continue;
      await sandScene(page, 'empty');
      for (const s of steps) {
        if (s[0] === 'p') await place(page, ...s.slice(1));
        else await dbg(page, 'sand', (d, G, W, a) => d.applyTool(...a), s);
      }
      await waitDbg(page, 'sand', (d, G, W, k) => d.found.has(k), { timeout: 20_000, arg: k }).catch(() => { throw new Error(`discovery "${k}" was not made`); });
    }
    // the circuit scene: battery -> metal -> lamp lights; metal -> salt water -> metal -> boom powder
    await sandScene(page, 'circuit');
    for (const k of ['circuit', 'conduct']) await waitDbg(page, 'sand', (d, G, W, k) => d.found.has(k), { timeout: 20_000, arg: k }).catch(() => { throw new Error(`circuit scene: "${k}" not made`); });
    expect(await dbg(page, 'sand', d => d.found.size)).toBe(24);
    await expect(page.locator('#dcount')).toHaveText('24');
    await expect(page.locator('#game .starn')).toHaveText('24');
    await page.locator('#discbtn').click();
    await expect(page.locator('#disc li.got')).toHaveCount(24);
    const cb = await canvasBox(page);
    await page.mouse.click(cb.x + cb.width * .8, cb.y + cb.height * .5);
    await expect(page.locator('#disc')).toBeHidden();
  });

  test('sand and water are conserved, liquids layer by density, sand sinks through them', async ({ page }) => {
    await home(page); await openGame(page, 'sand');
    await sandScene(page, 'empty');
    await paint(page, E.SAND, [.1, .3], [.4, .3], { size: 3 });
    await paint(page, E.WATER, [.55, .3], [.9, .3], { size: 3 });
    await page.waitForTimeout(800);
    const s0 = await sandCount(page, E.SAND), w0 = await sandCount(page, E.WATER);
    expect(s0).toBeGreaterThan(500); expect(w0).toBeGreaterThan(500);
    await page.waitForTimeout(2500);
    expect(await sandCount(page, E.SAND)).toBe(s0);
    expect(await sandCount(page, E.WATER)).toBe(w0);
    await sandScene(page, 'empty');
    await place(page, E.OIL, .55, .85, .95, 1);
    await place(page, E.WATER, .55, .65, .95, .8);
    await place(page, E.SALTW, .55, .5, .95, .6);
    await place(page, E.SAND, .7, .4, .8, .45);
    const inv = () => dbg(page, 'sand', d => { const T = d.T, c = d.cols; let bad = 0;
      const rank = { 13: 1, 2: 2, 22: 3, 1: 9 };   // oil < water < salt water < sand
      for (let i = 0; i + c < T.length; i++) { const a = rank[T[i]], b = rank[T[i + c]]; if (a && b && a > b) bad++; } return bad; });
    await expect.poll(inv, { message: 'heavier things resting on lighter liquids', timeout: 30_000, intervals: [1000] }).toBeLessThan(10);
  });

  test('freeze, single step, speed, undo, eraser, brush sizes, line, box, copy-what-I-tap and wind', async ({ page }) => {
    test.setTimeout(120_000);
    await home(page); await openGame(page, 'sand');
    const b = await canvasBox(page);
    const sizes = [];
    for (const br of [1, 2, 3]) {
      await sandScene(page, 'empty');
      await pickEl(page, E.STONE); await pickSize(page, br);
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      sizes.push(await sandCount(page, E.STONE));
    }
    expect(sizes[0]).toBeGreaterThan(0); expect(sizes[1]).toBeGreaterThan(sizes[0] * 2.5); expect(sizes[2]).toBeGreaterThan(sizes[1] * 2.5);
    await paint(page, E.SAND, [.2, .2], [.8, .2], { size: 3 });
    await page.locator('#pause').click();
    const snap = await dbg(page, 'sand', d => Array.from(d.T).join(''));
    await page.waitForTimeout(600);
    expect(await dbg(page, 'sand', d => Array.from(d.T).join(''))).toBe(snap);
    await page.locator('#stepbtn').click();
    expect(await dbg(page, 'sand', d => Array.from(d.T).join(''))).not.toBe(snap);
    await page.locator('#pause').click();
    await expect(page.locator('#stepbtn')).toBeDisabled();
    for (const s of ['2×', '4×', '½×', '1×']) { await page.locator('#speed').click(); expect(await dbg(page, 'sand', d => d.speed)).toBe(s); }
    // eraser, then undo brings it back
    const st0 = await sandCount(page, E.STONE);
    await pickTool(page, 'erase');
    await mouseDrag(page, [[b.x + b.width / 2, b.y + b.height * .45], [b.x + b.width / 2, b.y + b.height * .55]], { steps: 6 });
    expect(await sandCount(page, E.STONE)).toBeLessThan(st0 / 4);
    await page.locator('#undo').click();
    expect(await sandCount(page, E.STONE)).toBe(st0);
    // line and box
    await sandScene(page, 'empty');
    await pickEl(page, E.WOOD); await pickSize(page, 1); await pickTool(page, 'line');
    await mouseDrag(page, [[b.x + b.width * .1, b.y + b.height * .5], [b.x + b.width * .9, b.y + b.height * .5]], { steps: 10 });
    const wood = await dbg(page, 'sand', d => { let n = 0, x0 = 1e9, x1 = 0; const r = Math.floor(d.rows / 2); for (let x = 0; x < d.cols; x++) for (let y = r - 6; y < r + 6; y++) if (d.T[y * d.cols + x] === 4) { n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); } return { n, span: (x1 - x0) / d.cols }; });
    expect(wood.span).toBeGreaterThan(.75);
    await pickTool(page, 'box'); await pickEl(page, E.STONE); await pickTool(page, 'box');
    await mouseDrag(page, [[b.x + b.width * .1, b.y + b.height * .1], [b.x + b.width * .3, b.y + b.height * .3]], { steps: 6 });
    const box = await dbg(page, 'sand', d => d.count(3) / (d.cols * d.rows));
    expect(box).toBeGreaterThan(.03); expect(box).toBeLessThan(.06);
    // copy what I tap: tap the wood line, the element becomes wood
    await pickTool(page, 'pick');
    await page.mouse.click(b.x + b.width * .5, b.y + b.height * .5);
    expect(await dbg(page, 'sand', d => [d.cur, d.tool])).toEqual([4, 'draw']);
    // wind pushes sand sideways
    await sandScene(page, 'empty');
    await place(page, E.SAND, .4, .9, .5, 1);
    await page.waitForTimeout(300);
    const cx = () => dbg(page, 'sand', d => { let s = 0, n = 0; for (let i = 0; i < d.T.length; i++) if (d.T[i] === 1) { s += i % d.cols; n++; } return s / n / d.cols; });
    const c0 = await cx();
    await pickSize(page, 4); await pickTool(page, 'wind');
    for (let k = 0; k < 4; k++) await mouseDrag(page, [[b.x + b.width * .3, b.y + b.height * .93], [b.x + b.width * .8, b.y + b.height * .93]], { steps: 40, delay: 20 });
    await page.waitForTimeout(500);
    expect(await cx()).toBeGreaterThan(c0 + .02);
  });

  test('every world runs; winter snow stops when you leave; saves round-trip; resize keeps the floor; settled worlds go to sleep', async ({ page }) => {
    test.setTimeout(120_000);
    await home(page); await openGame(page, 'sand');
    for (const s of ['volcano', 'garden', 'winter', 'tank', 'circuit', 'lab', 'empty']) { await sandScene(page, s); await page.waitForTimeout(1200); }
    await sandScene(page, 'winter'); await page.waitForTimeout(300);
    await sandScene(page, 'empty'); await page.waitForTimeout(1200);
    expect(await sandCount(page, E.SNOW)).toBe(0);
    // a settled pile: almost every chunk sleeps
    await place(page, E.SAND, .2, .8, .8, 1);
    await page.waitForTimeout(2500);
    const aw = await dbg(page, 'sand', d => d.awakeChunks());
    expect(aw.n).toBeLessThan(aw.total * .1);
    // save to slot 1, clear, open slot 1
    await page.evaluate(() => localStorage.removeItem('wb-sand-slot1'));
    await page.locator('#scenes').click(); await page.locator('.pop [data-save="1"]').click();
    const saved = await sandCount(page, E.SAND);
    await sandScene(page, 'empty'); expect(await sandCount(page, E.SAND)).toBe(0);
    await page.locator('#scenes').click(); await page.locator('.pop [data-load="1"]').click();
    expect(Math.abs(await sandCount(page, E.SAND) - saved)).toBeLessThan(saved * .02);
    // leaving keeps the world for "Last time"
    await page.locator('#back').click(); await openGame(page, 'sand');
    await sandScene(page, 'last');
    expect(await sandCount(page, E.SAND)).toBeGreaterThan(saved * .9);
    await place(page, E.STONE, .5, .95, .95, 1);
    const before = await sandCount(page, E.STONE);
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    expect(await sandCount(page, E.STONE)).toBeGreaterThan(before * .7);
  });
});

/* ---------------- Space Orbits ---------------- */
const SP = (page, fn, arg) => dbg(page, 'space', fn, arg);
/* track every free body's angle around the Sun over a stretch of simulated time */
async function orbitTrack(page, simSeconds) {
  return page.evaluate(sec => new Promise(res => {
    const d = window.WiggleBox.games.space._debug, start = d.simT, out = new Map();
    const tick = () => {
      for (const b of d.bodies) { if (b.parent) continue; const a = Math.atan2(b.y - d.cy, b.x - d.cx), r = Math.hypot(b.x - d.cx, b.y - d.cy);
        const v2 = b.vx * b.vx + b.vy * b.vy, E = v2 / 2 - d.gm() / Math.sqrt(r * r + 25), L = (b.x - d.cx) * b.vy - (b.y - d.cy) * b.vx;
        if (!out.has(b)) out.set(b, { kind: b.kind, t: [], a: [], r: [], E: [], L: [] }); const o = out.get(b); o.t.push(d.simT - start); o.a.push(a); o.r.push(r); o.E.push(E); o.L.push(L); }
      if (d.simT - start < sec) requestAnimationFrame(tick); else res([...out.values()].map(o => ({ ...o, gm: d.gm() })));
    };
    requestAnimationFrame(tick);
  }), simSeconds);
}
const unwrapSlope = (t, a) => { const u = [a[0]]; for (let i = 1; i < a.length; i++) { let d = a[i] - a[i - 1]; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; u.push(u[i - 1] + d); }
  const n = t.length, mt = t.reduce((s, x) => s + x, 0) / n, mu = u.reduce((s, x) => s + x, 0) / n; let num = 0, den = 0; for (let i = 0; i < n; i++) { num += (t[i] - mt) * (u[i] - mu); den += (t[i] - mt) ** 2; } return num / den; };

test.describe('25 Space Orbits', () => {
  test("Kepler's third law: T²/a³ is the same for all eight planets and equals 4π²/GM", async ({ page }) => {
    test.setTimeout(90_000);
    await home(page); await openGame(page, 'space');
    await page.locator('[data-a="fast"]').click();
    const tr = await orbitTrack(page, 26);
    expect(tr.length).toBe(8);
    const k = [];
    for (const o of tr) {
      const w = Math.abs(unwrapSlope(o.t, o.a)), T = 2 * Math.PI / w, a = o.r.reduce((s, x) => s + x, 0) / o.r.length;
      k.push({ kind: o.kind, ratio: T * T / a ** 3, theory: 4 * Math.PI ** 2 / o.gm, T });
    }
    for (const x of k) expect(Math.abs(x.ratio / x.theory - 1), `${x.kind} T=${x.T.toFixed(2)}s`).toBeLessThan(.02);
    // inner planets go round faster
    const order = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'].map(n => k.find(x => x.kind === n).T);
    for (let i = 1; i < 8; i++) expect(order[i]).toBeGreaterThan(order[i - 1]);
  });

  test('a thrown planet keeps its energy and angular momentum (the orbit does not drift) over a long run', async ({ page }) => {
    test.setTimeout(90_000);
    await home(page); await openGame(page, 'space');
    await page.locator('[data-a="clear"]').click();
    const b = await canvasBox(page);
    const [cx, cy] = [b.x + b.width / 2, b.y + b.height / 2];
    // a circular orbit here needs about a 90 px throw; 70 px makes a clear ellipse
    await mouseDrag(page, [[cx + b.height * .28, cy], [cx + b.height * .28, cy - 70]], { steps: 5 });
    expect(await SP(page, d => d.bodies.length)).toBe(1);
    await page.locator('[data-a="fast"]').click();
    const [o] = await orbitTrack(page, 40);
    expect(o.E[0]).toBeLessThan(0);                           // bound
    const dE = Math.max(...o.E.map(e => Math.abs(e / o.E[0] - 1))), dL = Math.max(...o.L.map(l => Math.abs(l / o.L[0] - 1)));
    expect(dE, 'energy drift').toBeLessThan(.01);
    expect(dL, 'angular momentum drift').toBeLessThan(1e-6);
    const rmin = Math.min(...o.r), rmax = Math.max(...o.r);
    expect(rmax / rmin).toBeGreaterThan(1.2);                 // it really is an ellipse
  });

  test('a tap makes a circular orbit; black hole, fast, names, paths, clear, planet menu and facts all work', async ({ page }) => {
    await home(page); await openGame(page, 'space');
    await page.locator('[data-a="clear"]').click();
    await page.locator('#planet').click(); await page.locator('.popitem[data-p="mars"]').click();
    expect(await SP(page, d => d.pick)).toBe('mars');
    const b = await canvasBox(page);
    await page.mouse.click(b.x + b.width / 2 + b.height * .3, b.y + b.height / 2);
    const [o] = await orbitTrack(page, 6);
    expect(o.kind).toBe('mars');
    expect(Math.max(...o.r) / Math.min(...o.r)).toBeLessThan(1.02);
    // tapping it tells a fact and focuses it
    const m = await SP(page, d => { const x = d.bodies[0]; return [x.x, x.y]; });
    await page.mouse.click(b.x + m[0], b.y + m[1]);
    await expect(page.locator('.fxo')).toContainText('Mars');
    // fast doubles the simulated time per second
    // simulated seconds per real second, measured in the page over 2.5 s
    // simulated time per game step (the loop runs 60 steps a second); counting steps keeps a busy machine out of it
    const rate = () => page.evaluate(() => new Promise(res => { const d = window.WiggleBox.games.space._debug, s0 = d.simT, n0 = d.loopN; setTimeout(() => res((d.simT - s0) / (d.loopN - n0) * 60), 1500); }));
    const r1 = await rate(); await page.locator('[data-a="fast"]').click(); const r2 = await rate();
    expect(r1).toBeCloseTo(1, 2); expect(r2).toBeCloseTo(2, 2);
    await page.locator('[data-a="fast"]').click();
    // black hole: stronger pull; a tap still makes a circular orbit around it, and a weak throw falls in
    const g0 = await SP(page, d => d.gm());
    await page.locator('[data-a="clear"]').click();
    await page.locator('[data-a="hole"]').click();
    expect(await SP(page, d => d.gm()) / g0).toBeCloseTo(2.2, 5);
    await page.mouse.click(b.x + b.width / 2 + b.height * .3, b.y + b.height / 2);
    await mouseDrag(page, [[b.x + b.width / 2 - 80, b.y + b.height / 2], [b.x + b.width / 2 - 96, b.y + b.height / 2]], { steps: 3 }); // a weak throw
    expect(await SP(page, d => d.bodies.length)).toBe(2);
    await page.waitForTimeout(3000);
    const left = await SP(page, d => d.bodies.map(x => Math.hypot(x.x - d.cx, x.y - d.cy)));
    expect(left.length).toBe(1);
    expect(left[0]).toBeGreaterThan(100);
    await page.locator('[data-a="hole"]').click();
    for (const a of ['names', 'paths']) { const v0 = await SP(page, (d, G, W, a) => d[a], a); await page.locator(`[data-a="${a}"]`).click(); expect(await SP(page, (d, G, W, a) => d[a], a)).toBe(!v0); }
    await page.locator('[data-a="clear"]').click();
    expect(await SP(page, d => d.bodies.length)).toBe(0);
    for (let i = 0; i < 45; i++) await page.mouse.click(b.x + 40 + (i % 9) * 30, b.y + 40 + Math.floor(i / 9) * 30);
    expect(await SP(page, d => d.bodies.length)).toBeLessThanOrEqual(40);
  });

  test('rotating the screen keeps every orbit: same shape, same timing', async ({ page }) => {
    test.setTimeout(60_000);
    await home(page); await openGame(page, 'space');
    await page.locator('[data-a="fast"]').click();
    const t1 = await orbitTrack(page, 6);
    const per = tr => Object.fromEntries(tr.map(o => [o.kind, 2 * Math.PI / Math.abs(unwrapSlope(o.t, o.a))]));
    const p1 = per(t1);
    await page.setViewportSize({ width: 900, height: 1200 });
    await page.waitForTimeout(400);
    const t2 = await orbitTrack(page, 6), p2 = per(t2);
    expect(t2.length).toBe(8);
    for (const k of Object.keys(p1)) expect(Math.abs(p2[k] / p1[k] - 1), k).toBeLessThan(.03);
    const inside = await SP(page, d => d.bodies.every(b => b.x > 0 && b.y > 0 && b.x < d.W && b.y < d.H));
    expect(inside).toBe(true);
  });
});

/* ---------------- Splash Lab ---------------- */
const SL = (page, fn, arg) => dbg(page, 'splash', fn, arg);
async function splashScene(page, s) { await page.locator('#scenes').click(); await page.locator(`.popitem[data-s="${s}"]`).click(); }

test.describe('26 Splash Lab', () => {
  test('Archimedes: floating toys sit as deep as their density says (fraction under water = ρ)', async ({ page }) => {
    test.setTimeout(90_000);
    await home(page); await openGame(page, 'splash');
    await splashScene(page, 'pool');
    await SL(page, d => { d.sim.bodies.length = 0; const W = d.sim.W, H = d.sim.H, fl = d.TOYS.filter(t => t.d < 1 && !t.fish); fl.forEach((t, i) => d.addToy(t, W * (.1 + .8 * i / (fl.length - 1)), H * .35)); });
    await page.waitForTimeout(5000);
    // the water keeps rippling, so average the depth over a few seconds, like reading a bobbing float
    const avg = await page.evaluate(async () => { const d = window.WiggleBox.games.splash._debug, acc = new Map();
      for (let k = 0; k < 30; k++) { await new Promise(r => setTimeout(r, 150)); for (const b of d.sim.bodies) { const a = acc.get(b.t.n) || { s: 0, n: 0, d: b.t.d }; a.s += b.sub || 0; a.n++; acc.set(b.t.n, a); } }
      return [...acc].map(([n, a]) => ({ n, d: a.d, sub: a.s / a.n })); });
    expect(avg.length).toBe(6);
    for (const b of avg) expect(Math.abs(b.sub - b.d), `${b.n}: ${(b.sub * 100).toFixed(0)}% under, density ${b.d}`).toBeLessThan(.08);
    // the measure card agrees: tap the duck
    const duck = await SL(page, d => { const b = d.sim.bodies.find(x => x.t.n === 'duck'); return [b.x * d.S, b.y * d.S]; });
    const box = await canvasBox(page);
    await page.mouse.move(box.x + duck[0], box.y + duck[1]); await page.mouse.down(); await page.mouse.up();
    await expect(page.locator('.fxo')).toContainText('duck');
  });

  test('sinkers reach the bottom and fish hover in the water', async ({ page }) => {
    test.setTimeout(60_000);
    await home(page); await openGame(page, 'splash');
    await splashScene(page, 'pool');
    await SL(page, d => { d.sim.bodies.length = 0; const W = d.sim.W, H = d.sim.H, s = d.TOYS.filter(t => t.d >= 1); s.forEach((t, i) => d.addToy(t, W * (.1 + .8 * i / (s.length - 1)), H * .35)); });
    // the egg is only 8% denser than water, so it takes a while
    await waitDbg(page, 'splash', d => d.sim.bodies.filter(b => !b.t.fish).every(b => b.y > d.sim.H - b.r - .8), { timeout: 30_000 });
    const r = await SL(page, d => d.sim.bodies.map(b => ({ n: b.t.n, fish: !!b.t.fish, y: b.y, r: b.r, H: d.sim.H, wet: b.wet })));
    expect(r.length).toBe(6);
    for (const b of r) {
      if (b.fish) { expect(b.wet, `${b.n} is in the water`).toBeGreaterThan(0); expect(b.y, `${b.n} is not lying on the bottom`).toBeLessThan(b.H - b.r - .3); }
      else expect(b.y, `${b.n} on the bottom`).toBeGreaterThan(b.H - b.r - .8);
    }
  });

  test('a toy can be picked from the menu and dropped with a tap', async ({ page }) => {
    await home(page); await openGame(page, 'splash');
    await page.locator('.tool[data-t="toys"]').click();
    await page.locator('.popitem[data-toy="7"]').click();      // rock
    const b = await canvasBox(page);
    const n0 = await SL(page, d => d.sim.bodies.length);
    await page.mouse.click(b.x + b.width * .5, b.y + b.height * .3);
    expect(await SL(page, d => d.sim.bodies.length)).toBe(n0 + 1);
    expect(await SL(page, d => d.sim.bodies[d.sim.bodies.length - 1].t.n)).toBe('rock');
  });

  test('water is conserved and stays inside the tank; drains, sponge, walls and fountains work', async ({ page }) => {
    await home(page); await openGame(page, 'splash');
    await splashScene(page, 'pool');
    await page.waitForTimeout(1500);
    const n0 = await SL(page, d => d.sim.n);
    await page.waitForTimeout(3000);
    const s = await SL(page, d => { const m = d.sim; let ok = true; for (let i = 0; i < m.n; i++) if (!(m.x[i] >= 0 && m.x[i] <= m.W && m.y[i] >= 0 && m.y[i] <= m.H)) ok = false; return { n: m.n, ok }; });
    expect(s.n).toBe(n0); expect(s.ok).toBe(true);
    const b = await canvasBox(page);
    // drain
    await page.locator('.tool[data-t="drain"]').click();
    await page.mouse.click(b.x + b.width * .5, b.y + b.height * .95);
    await page.waitForTimeout(1500);
    expect(await SL(page, d => d.sim.n)).toBeLessThan(n0);
    await page.mouse.click(b.x + b.width * .5, b.y + b.height * .95);  // tap again closes it
    expect(await SL(page, d => d.sim.drains.length)).toBe(0);
    // walls
    await page.locator('.tool[data-t="wall"]').click();
    await mouseDrag(page, [[b.x + b.width * .2, b.y + b.height * .2], [b.x + b.width * .5, b.y + b.height * .3]], { steps: 10 });
    const walls = await SL(page, d => d.sim.walls.length);
    expect(walls).toBeGreaterThan(3);
    // sponge wipes the wall and soaks water
    await page.locator('.tool[data-t="sponge"]').click();
    const n1 = await SL(page, d => d.sim.n);
    await mouseDrag(page, [[b.x + b.width * .2, b.y + b.height * .2], [b.x + b.width * .5, b.y + b.height * .3], [b.x + b.width * .5, b.y + b.height * .85]], { steps: 15, delay: 20 });
    expect(await SL(page, d => d.sim.walls.length)).toBeLessThan(walls);
    expect(await SL(page, d => d.sim.n)).toBeLessThan(n1);
    // fountain
    await page.locator('.tool[data-t="spring"]').click();
    await page.mouse.click(b.x + b.width * .8, b.y + b.height * .2);
    expect(await SL(page, d => d.springs.length)).toBe(1);
    const n2 = await SL(page, d => d.sim.n);
    await page.waitForTimeout(800);
    expect(await SL(page, d => d.sim.n)).toBeGreaterThan(n2);
    expect(await SL(page, d => d.sim.n <= d.sim.cap)).toBe(true);
  });

  test('colour mixing: yellow and blue make green; red and yellow make orange', async ({ page }) => {
    test.setTimeout(90_000);
    await home(page); await openGame(page, 'splash');
    await splashScene(page, 'mix');
    await waitDbg(page, 'splash', d => d.announced.has('gr'), { timeout: 40_000 });
    await splashScene(page, 'empty');
    const b = await canvasBox(page);
    for (const [p, x] of [[1, .45], [2, .55]]) {
      await page.locator(`.cdot[data-p="${p}"]`).click();
      await mouseDrag(page, [[b.x + b.width * x, b.y + b.height * .4], [b.x + b.width * x, b.y + b.height * .45]], { steps: 40, delay: 30 });
    }
    await page.locator('.tool[data-t="push"]').click();
    for (let k = 0; k < 3; k++) await mouseDrag(page, [[b.x + b.width * .35, b.y + b.height * .9], [b.x + b.width * .65, b.y + b.height * .9], [b.x + b.width * .35, b.y + b.height * .9]], { steps: 20, delay: 20 });
    await waitDbg(page, 'splash', d => d.announced.has('o'), { timeout: 30_000 });
  });

  test('every scene runs without NaN; breaking the dam lets the water out', async ({ page }) => {
    test.setTimeout(60_000);
    await home(page); await openGame(page, 'splash');
    for (const s of ['pool', 'falls', 'mix', 'empty', 'dam']) {
      await splashScene(page, s); await page.waitForTimeout(2000);
      expect(await SL(page, d => { const m = d.sim; for (let i = 0; i < m.n; i++) if (!Number.isFinite(m.x[i] + m.y[i])) return false; return m.bodies.every(b => Number.isFinite(b.x + b.y)); }), s).toBe(true);
    }
    const meanX = () => SL(page, d => { let s = 0; for (let i = 0; i < d.sim.n; i++) s += d.sim.x[i]; return s / d.sim.n / d.sim.W; });
    const x0 = await meanX();
    const b = await canvasBox(page);
    // the dam scene starts with the sponge; rub the wall at x = 0.42
    await mouseDrag(page, [[b.x + b.width * .42, b.y + b.height * .3], [b.x + b.width * .42, b.y + b.height * .98]], { steps: 25, delay: 20 });
    await page.waitForTimeout(3000);
    expect(await meanX()).toBeGreaterThan(x0 + .08);
  });
});

/* ---------------- Wave Lab ---------------- */
const WV = (page, fn, arg) => dbg(page, 'waves', fn, arg);
const ellipticK = k => { let a = 1, b = Math.sqrt(1 - k * k); for (let i = 0; i < 30; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)]; return Math.PI / (2 * a); };
const exactPeriod = (L, g, th0) => 4 * Math.sqrt(L / g) * ellipticK(Math.sin(th0 / 2));

test.describe('28 Wave Lab', () => {
  test('pendulum period matches T = 4√(L/g)·K(sin θ/2) on the Moon, Mars, Earth and Jupiter', async ({ page }) => {
    test.setTimeout(120_000);
    await home(page); await openGame(page, 'waves');
    for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowUp');    // shorten the string to 0.5 m
    expect(await WV(page, d => d.PD.L)).toBeCloseTo(.5, 6);
    for (const [name, g] of [['Moon', 1.6], ['Mars', 3.7], ['Earth', 9.8], ['Jupiter', 24.8]]) {
      await page.locator('#gmenu').click(); await page.locator(`.popitem[data-v="${g}"]`).click();
      await expect(page.locator('#gmenu')).toContainText(name);
      await page.locator('#rel').click();
      const L = .5, small = 2 * Math.PI * Math.sqrt(L / g), exact = exactPeriod(L, g, 25 * Math.PI / 180);
      await expect(page.locator('#pn')).toContainText(small.toFixed(2));
      // read the stopwatch the moment the 7th crossing happens (like the app's own panel does)
      const meas = await page.evaluate(() => new Promise(res => { const d = window.WiggleBox.games.waves._debug;
        const tick = () => { if (d.PD.swings >= 7) res((d.t - d.PD.t0) / ((d.PD.swings - 1) / 2)); else requestAnimationFrame(tick); }; tick(); }));
      await expect(page.locator('#pn')).toContainText(meas.toFixed(2).replace(/0$/, '').replace(/\.$/, ''));
      // the stopwatch counts whole half-swings, so it can be up to one frame late
      expect(Math.abs(meas / exact - 1), `${name}: ${meas.toFixed(3)} s vs ${exact.toFixed(3)} s`).toBeLessThan(.02);
    }
  });

  test('a big swing takes longer by the right amount, and energy is conserved while it swings', async ({ page }) => {
    await home(page); await openGame(page, 'waves');
    // release from 60° (the same code path as dragging the ball out)
    const r = await page.evaluate(() => new Promise(res => {
      const d = window.WiggleBox.games.waves._debug, P = d.PD; P.amp = 60; P.th = Math.PI / 3; P.w = 0; P.swings = 0; P.t0 = d.t; P.lastSign = 1; P.bobs = null;
      const E = [], t0 = d.t;
      let meas = 0, seen = 0;
      let late = 0;
      const tick = () => { E.push(.5 * (P.L * P.w) ** 2 + P.g * P.L * (1 - Math.cos(P.th))); if (P.swings !== seen) { seen = P.swings; if (seen > 1) meas = (d.t - P.t0) / ((seen - 1) / 2); }
        if (d.t - t0 > 5) late = Math.max(late, Math.abs(P.th));
        if (d.t - t0 < 8) requestAnimationFrame(tick); else res({ E, swings: P.swings, meas, L: P.L, g: P.g, late }); };
      requestAnimationFrame(tick);
    }));
    const exact = exactPeriod(r.L, r.g, Math.PI / 3), small = 2 * Math.PI * Math.sqrt(r.L / r.g);
    expect(exact / small).toBeGreaterThan(1.07);              // about 7% longer at 60°
    expect(Math.abs(r.meas / exact - 1)).toBeLessThan(.02);
    // the step method keeps energy in a narrow band (no drift): within 1.5% at any moment, same average at the end
    const e0 = r.E[0]; expect(Math.max(...r.E.map(e => Math.abs(e / e0 - 1)))).toBeLessThan(.015);
    // and the swing neither dies away nor grows: after several swings it still reaches 60°
    expect(Math.abs(r.late * 180 / Math.PI - 60)).toBeLessThan(.5);
  });

  test('pendulum wave: string lengths give 40, 41, … 51 swings a minute', async ({ page }) => {
    await home(page); await openGame(page, 'waves');
    await page.locator('#many').click();
    await page.waitForTimeout(200);
    const Ls = await WV(page, d => d.PD.bobs.map(b => b.L));
    Ls.forEach((L, i) => expect(60 / (2 * Math.PI * Math.sqrt(L / 9.8))).toBeCloseTo(40 + i, 6));
  });

  test('ripples: the crests on screen are λ = v/f apart, and two drips make calm stripes where waves cancel', async ({ page }) => {
    await home(page); await openGame(page, 'waves');
    await page.locator('[data-wm="ripple"]').click();
    const b = await canvasBox(page);
    for (const f of [.6, 1.2, 2.2]) {
      await page.locator('#clr').click();
      await page.locator('#fmenu').click(); await page.locator(`.popitem[data-v="${f}"]`).click();
      await page.mouse.click(b.x + b.width * .2, b.y + b.height * .5);
      await page.waitForTimeout(300);
      const m = await page.evaluate(() => {
        const cv = [...document.querySelectorAll('#stage canvas')].find(c => c.offsetWidth), c = cv.getContext('2d'), d = window.WiggleBox.games.waves._debug, dims = d.dims;
        const y = Math.round(dims.h * .5 * dims.d), row = c.getImageData(0, y, cv.width, 1).data, s = d.RP.sources[0], x0 = Math.round(s.x * dims.w * dims.d);
        // the blue channel is 200 where the water is flat; count where the surface rises through flat level
        const br = []; for (let x = x0 + 20 * dims.d; x < cv.width - 4; x++) br.push(row[x * 4 + 2] - 200);
        const up = []; for (let i = 1; i < br.length; i++) if (br[i - 1] < 0 && br[i] >= 0) up.push(i);
        const ux = Math.min(dims.w, dims.h) / 6, lamPx = d.RP.sp / d.RP.f * ux * dims.d;
        const gaps = up.slice(1).map((p, i) => p - up[i]); gaps.sort((a, b) => a - b);
        return { lamPx, gap: gaps[gaps.length >> 1], n: up.length };
      });
      expect(m.n).toBeGreaterThanOrEqual(2);
      expect(Math.abs(m.gap / m.lamPx - 1), `f=${f}: crests ${m.gap}px apart, λ = ${m.lamPx.toFixed(1)}px`).toBeLessThan(.15);
      await expect(page.locator('#pn')).toContainText(String(+(2.2 / f).toFixed(2)));
    }
    // interference: on the centre line both waves always agree; where the paths differ by λ/2 they cancel
    await page.locator('#two').click();
    const v = await page.evaluate(async () => {
      const d = window.WiggleBox.games.waves._debug, dims = d.dims, cv = [...document.querySelectorAll('#stage canvas')].find(c => c.offsetWidth), c = cv.getContext('2d');
      const ux = Math.min(dims.w, dims.h) / 6, lam = d.RP.sp / d.RP.f * ux, [s1, s2] = d.RP.sources.map(s => [s.x * dims.w, s.y * dims.h]);
      const mid = [(s1[0] + s2[0]) / 2, s1[1] + dims.h * .3];
      // walk sideways from the centre line until the path difference is λ/2
      let node = null; for (let x = mid[0]; x < dims.w; x += .5) { const dd = Math.hypot(x - s1[0], mid[1] - s1[1]) - Math.hypot(x - s2[0], mid[1] - s2[1]); if (Math.abs(dd) >= lam / 2) { node = [x, mid[1]]; break; } }
      const sample = p => c.getImageData(Math.round(p[0] * dims.d), Math.round(p[1] * dims.d), 1, 1).data[2];
      const A = [], B = [];
      for (let k = 0; k < 24; k++) { await new Promise(r => setTimeout(r, 45)); A.push(sample(mid)); B.push(sample(node)); }
      const sd = a => { const m = a.reduce((s, x) => s + x, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };
      return { centre: sd(A), node: sd(B) };
    });
    expect(v.centre).toBeGreaterThan(15);
    expect(v.node).toBeLessThan(v.centre * .35);
  });

  test('sound string: harmonics are n × f, nodes are n + 1, and the tone really stops', async ({ page }) => {
    await page.addInitScript(() => {
      window.__osc = [];
      const C = window.AudioContext || window.webkitAudioContext, orig = C.prototype.createOscillator;
      C.prototype.createOscillator = function () { const o = orig.call(this), rec = { f: [], stopped: false }; window.__osc.push(rec);
        const f = o.frequency, st = f.setTargetAtTime.bind(f); f.setTargetAtTime = (v, t, c) => { rec.f.push(v); return st(v, t, c); };
        const stop = o.stop.bind(o); o.stop = (...a) => { rec.stopped = true; return stop(...a); }; return o; };
    });
    await home(page); await openGame(page, 'waves');
    await page.locator('[data-wm="string"]').click();
    await page.locator('#play').click();
    const live = () => page.evaluate(() => window.__osc.filter(o => o.f.length));
    let o = await live();
    expect(o.length).toBe(1); expect(o[0].f.at(-1)).toBe(220);
    for (const n of [2, 3, 4, 5, 6]) {
      await page.locator(`[data-hn="${n}"]`).click();
      o = await live(); expect(o.at(-1).f.at(-1)).toBe(220 * n);
      await expect(page.locator('#pn')).toContainText(`${n + 1} spots never move`);
      await expect(page.locator('#pn')).toContainText(String(+(1.3 / n).toFixed(3)));
    }
    await page.locator('#nmenu').click(); await page.locator('.popitem[data-v="440"]').click();
    o = await live(); expect(o.at(-1).f.at(-1)).toBe(440 * 6);
    await page.locator('#play').click();                       // stop
    await page.waitForTimeout(400);
    expect((await live()).every(x => x.stopped)).toBe(true);
    // play, then leave the game: the tone must not keep humming
    await page.locator('#play').click();
    await page.locator('#back').click();
    await page.waitForTimeout(400);
    expect((await live()).every(x => x.stopped)).toBe(true);
  });
});
