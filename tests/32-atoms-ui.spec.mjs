// Atom Builder in the browser: building atoms by hand, molecule recognition and shape, sending molecules to the
// reaction chamber, experiments and their controls, lifecycle, resizing, touch and offline.
import { test, expect, home, openGame, goBack, dbg, waitDbg, canvasBox, mouseDrag, touchSession, pick } from './helpers.mjs';

const TOP = '#stage .lab-top';
const mode = (page, m) => pick(page, TOP, `[data-am="${m}"]`);
const atom = page => dbg(page, 'atoms', d => d.atom);
const card = (page, tag) => page.locator('#pn .fx').filter({ has: page.locator('.tag', { hasText: tag }) });
async function build(page, atoms, bonds) {
  await page.locator('#ex [data-a="clr"]').click();
  for (const a of atoms) await dbg(page, 'atoms', (d, G, W, a) => d.add(a), a);
  for (const [i, j, o] of bonds) await dbg(page, 'atoms', (d, G, W, a) => d.bond(a[0], a[1], a[2]), [i, j, o]);
}

test.describe('Atom Builder: building atoms by hand', () => {
  test('drag protons, neutrons and electrons from the bins into the atom, and pull them back out', async ({ page }) => {
    await home(page); await openGame(page, 'atoms');
    const box = await canvasBox(page);
    const geo = await dbg(page, 'atoms', d => d.atomGeo());
    const bin = k => geo.bins.find(b => b.k === k), at = (x, y) => [box.x + x, box.y + y];
    await mouseDrag(page, [at(bin('p').x, bin('p').y), at(geo.cx, geo.cy)], { steps: 10 });
    expect(await atom(page)).toMatchObject({ p: 2, n: 0, e: 1 });
    await expect(page.locator('#pn .fx.big')).toContainText('Helium');
    for (let i = 0; i < 2; i++) await mouseDrag(page, [at(bin('n').x, bin('n').y), at(geo.cx + 10, geo.cy - 10)], { steps: 10 });
    await mouseDrag(page, [at(bin('e').x, bin('e').y), at(geo.cx + geo.outer * .6, geo.cy)], { steps: 10 });
    expect(await atom(page)).toMatchObject({ p: 2, n: 2, e: 2 });
    await expect(page.locator('#pn .fx.big')).toContainText('Neutral atom');
    // dropped outside the atom: nothing changes
    await mouseDrag(page, [at(bin('p').x, bin('p').y), at(8, 8)], { steps: 10 });
    expect((await atom(page)).p).toBe(2);
    // a tap on a bin adds one
    await page.mouse.click(...at(bin('e').x, bin('e').y));
    expect((await atom(page)).e).toBe(3);
    await expect(page.locator('#pn .fx.big')).toContainText('Ion with charge -1');
    // pull an electron out of the cloud, then a neutron out of the nucleus
    await mouseDrag(page, [at(geo.cx + geo.shells[0], geo.cy), at(geo.W - 6, 6)], { steps: 10 });
    expect((await atom(page)).e).toBe(2);
    const nuc = await dbg(page, 'atoms', d => d.nucleons());
    const nn = nuc.find(q => q.k === 'n');
    await mouseDrag(page, [at(nn.x, nn.y), at(6, geo.H - 6)], { steps: 12 });
    expect(await atom(page)).toMatchObject({ p: 2, n: 1, e: 2 });
    await expect(page.locator('#pn .fx.big')).toContainText('Helium-3');
  });

  test('isotope, ion and chemistry cards keep nuclear stability and chemistry apart', async ({ page }) => {
    await home(page); await openGame(page, 'atoms');
    await dbg(page, 'atoms', d => d.set(6, 6, 6));
    const chem12 = await card(page, 'Chemistry').innerText();
    await expect(card(page, 'Nucleus')).toContainText('stable');
    await dbg(page, 'atoms', d => d.set(6, 8, 6));
    await expect(page.locator('#pn .fx.big')).toContainText('Carbon-14');
    await expect(page.locator('#pn .fx.big')).toContainText('unstable');
    await expect(card(page, 'Nucleus')).toContainText('radioactive');
    await expect(card(page, 'Nucleus')).toContainText('5,700 years');
    expect(await card(page, 'Chemistry').innerText()).toBe(chem12);        // same electrons, same chemistry
    await dbg(page, 'atoms', d => d.set(8, 8, 10));
    await expect(card(page, 'Chemistry')).toContainText('only held in place inside a compound');
    await dbg(page, 'atoms', d => d.set(2, 2, 3));
    await expect(card(page, 'Chemistry')).toContainText("can't hold");
    await dbg(page, 'atoms', d => d.set(20, 20, 20));
    await expect(card(page, 'Electron shells')).toContainText('2 , 8 , 8 , 2');
    await expect(card(page, 'Electron shells')).toContainText('1s² 2s² 2p⁶ 3s² 3p⁶ 4s²');
    // the cloud picture: button and V key
    await page.locator('#ex [data-a="view"]').click();
    expect((await atom(page)).view).toBe('cloud');
    await expect(page.locator('#ex [data-a="view"]')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('v');
    expect((await atom(page)).view).toBe('shell');
  });
});

test.describe('Atom Builder: molecules', () => {
  test('connectivity decides the molecule; unknown structures are not called molecules', async ({ page }) => {
    await home(page); await openGame(page, 'atoms'); await mode(page, 'mol');
    const tag = page.locator('#pn .fx.big .tag');
    await build(page, ['C', 'C', 'O', 'H', 'H', 'H', 'H', 'H', 'H'], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 7, 1], [1, 8, 1]]);
    await expect(tag).toHaveText('Ethanol');
    await expect(page.locator('#pn .fx.big')).toContainText('dimethyl ether');      // same atoms, joined differently
    await build(page, ['C', 'O', 'C', 'H', 'H', 'H', 'H', 'H', 'H'], [[0, 1, 1], [1, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1], [2, 6, 1], [2, 7, 1], [2, 8, 1]]);
    await expect(tag).toHaveText('Dimethyl ether');
    await expect(card(page, 'Molecules found')).toContainText('Bonus: Ethanol, Dimethyl ether');
    await build(page, ['O', 'O', 'O'], [[0, 1, 1], [1, 2, 1], [2, 0, 1]]);
    await expect(tag).toHaveText('Not in our molecule list');
    await build(page, ['H', 'H', 'H', 'H'], [[0, 1, 1], [2, 3, 1]]);
    await expect(tag).toHaveText('Still building');
    await expect(page.locator('#pn .fx.big')).toContainText('2 separate pieces');
    await build(page, ['O', 'H', 'H'], [[0, 1, 1], [0, 2, 1]]);
    await expect(tag).toHaveText('Water');
    await expect(card(page, 'Shape')).toContainText('bent, about 104.5°');
    await expect(card(page, 'Shape')).toContainText('O–H 96 pm');
    await expect(card(page, 'Molecule mass')).toContainText('18.02 u');
  });

  test('a molecule takes its real shape and can be turned in 3-D by dragging empty space', async ({ page }) => {
    await home(page); await openGame(page, 'atoms'); await mode(page, 'mol');
    await build(page, ['C', 'H', 'H', 'H', 'H'], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]);
    await page.waitForTimeout(1500);
    const angles = () => dbg(page, 'atoms', d => { const A = d.mol.atoms, c = A[0], v = A.slice(1).map(a => [a.x - c.x, a.y - c.y, a.z - c.z]); const out = []; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const [u, w] = [v[i], v[j]]; out.push(Math.acos((u[0] * w[0] + u[1] * w[1] + u[2] * w[2]) / Math.hypot(...u) / Math.hypot(...w)) * 180 / Math.PI); } return out; });
    for (const a of await angles()) expect(Math.abs(a - 109.5)).toBeLessThan(3);
    const z0 = await dbg(page, 'atoms', d => d.mol.atoms.map(a => a.z));
    const box = await canvasBox(page), c = await dbg(page, 'atoms', d => [d.mol.atoms[0].x, d.mol.atoms[0].y]);
    const sx = box.x + c[0], sy = box.y + c[1] + 150;           // empty space under the molecule
    await mouseDrag(page, [[sx, sy], [sx + 120, sy + 40]], { steps: 12 });
    await page.waitForTimeout(400);
    const z1 = await dbg(page, 'atoms', d => d.mol.atoms.map(a => a.z));
    expect(z1.some((z, i) => Math.abs(z - z0[i]) > 10)).toBe(true);
    for (const a of await angles()) expect(Math.abs(a - 109.5)).toBeLessThan(3);
    await expect(page.locator('#pn .fx.big .tag')).toHaveText('Methane');
  });
});

test.describe('Atom Builder: reactions', () => {
  test('send molecules from the builder, then spark them in the chamber: atoms, charge and energy add up', async ({ page }) => {
    test.setTimeout(120_000);
    await home(page); await openGame(page, 'atoms'); await mode(page, 'mol');
    const send = () => page.locator('#ex [data-a="send"]').click();
    await build(page, ['O', 'O', 'O'], [[0, 1, 1], [1, 2, 1], [2, 0, 1]]);
    await send();
    await expect(page.locator('.simhint')).toContainText('only sends molecules it knows');
    await build(page, ['C', 'H'], [[0, 1, 1]]);
    await send();
    await expect(page.locator('.simhint')).toContainText('Finish the molecule');
    expect(await dbg(page, 'atoms', d => d.inv)).toEqual({});
    await build(page, ['H', 'H'], [[0, 1, 1]]); await send(); await send(); await send();
    await build(page, ['O', 'O'], [[0, 1, 2]]); await send(); await send();
    expect(await dbg(page, 'atoms', d => d.inv)).toEqual({ H2: 12, O2: 8 });
    await expect(card(page, 'Reactions')).toContainText('12 H₂, 8 O₂');
    await mode(page, 'rx');
    expect(await dbg(page, 'atoms', d => d.chamber.counts())).toEqual({ H2: 12, O2: 8 });
    await page.waitForTimeout(1500);
    expect(await dbg(page, 'atoms', d => d.chamber.counts().H2O || 0)).toBe(0);       // no spark: nothing happens
    const box = await canvasBox(page);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);           // tap = spark
    expect(await dbg(page, 'atoms', d => d.chamber.state.ledger.sparkIn)).toBeGreaterThan(0);
    await waitDbg(page, 'atoms', d => (d.chamber.counts().H2O || 0) >= 6, { timeout: 30_000 });
    await expect(card(page, 'Atoms in = atoms out')).not.toContainText('❌');
    await expect(card(page, 'Atoms in = atoms out')).toContainText('H: 24 → 24 ✅');
    await expect(card(page, 'Energy')).toContainText('Energy lost or made from nothing: 0 J ✅');
    const fired = await dbg(page, 'atoms', d => d.chamber.state.stats.rx.h2burn.fired);
    await expect(card(page, 'What happened')).toContainText('Hydrogen burns: it happened');
    expect(fired).toBeGreaterThanOrEqual(3);
  });

  test('experiments: pause, reset (replays exactly), heat, catalyst, light and keys', async ({ page }) => {
    test.setTimeout(120_000);
    await home(page); await openGame(page, 'atoms'); await mode(page, 'rx');
    await pick(page, TOP, '[data-xp="pop"]');
    const snap = () => dbg(page, 'atoms', d => JSON.stringify(d.chamber.state.parts.map(p => [p.s, Math.round(p.x * 1e6), Math.round(p.y * 1e6)])));
    const fresh = await dbg(page, 'atoms', d => JSON.stringify(d.sci.setup(d.sci.EXPERIMENTS.find(x => x.id === 'pop')).state.parts.map(p => [p.s, Math.round(p.x * 1e6), Math.round(p.y * 1e6)])));
    await page.waitForTimeout(1200);
    await expect(card(page, 'What happened')).toContainText('No reaction');
    await pick(page, TOP, '[data-a="pause"]');
    const t0 = await dbg(page, 'atoms', d => d.chamber.state.t);
    await page.waitForTimeout(600);
    expect(await dbg(page, 'atoms', d => d.chamber.state.t)).toBe(t0);
    await pick(page, TOP, '[data-a="reset"]');                                         // reset while paused: stays paused, back at the start
    expect(await snap()).toBe(fresh);                                                  // same seed, same start
    expect(await dbg(page, 'atoms', d => [d.paused, d.chamber.state.t])).toEqual([true, 0]);
    await pick(page, TOP, '[data-a="pause"]');
    await waitDbg(page, 'atoms', d => d.chamber.state.t > .2);
    await pick(page, TOP, '[data-a="hot"]'); await pick(page, TOP, '[data-a="hot"]');
    expect(await dbg(page, 'atoms', d => d.chamber.state.Tset)).toBe(498);
    await pick(page, TOP, '[data-a="cold"]');
    expect(await dbg(page, 'atoms', d => d.chamber.state.Tset)).toBe(398);
    await pick(page, TOP, '[data-cat]');
    expect(await dbg(page, 'atoms', d => d.chamber.state.catalyst)).toBe(true);
    await expect(page.locator('#ex [data-cat]')).toHaveAttribute('aria-pressed', 'true');
    await pick(page, TOP, '[data-light]');
    expect(await dbg(page, 'atoms', d => d.chamber.state.light)).toBe(true);
    await page.keyboard.press('s');
    expect(await dbg(page, 'atoms', d => d.chamber.state.ledger.sparkIn)).toBeGreaterThan(0);
    await page.keyboard.press('p');
    expect(await dbg(page, 'atoms', d => d.paused)).toBe(true);
    await page.keyboard.press('r');
    expect(await dbg(page, 'atoms', d => [d.paused, d.chamber.state.ledger.sparkIn])).toEqual([true, 0]);
    await page.keyboard.press('p');
    expect(await dbg(page, 'atoms', d => d.paused)).toBe(false);
    // every experiment opens and runs
    for (const x of ['flame', 'lean', 'fizz', 'smoke', 'light', 'haber', 'free']) {
      await pick(page, TOP, `[data-xp="${x}"]`);
      expect(await dbg(page, 'atoms', d => d.xp)).toBe(x);
      await page.waitForTimeout(150);
    }
  });

  test('the white-smoke experiment needs no trigger and its explanation matches the run', async ({ page }) => {
    test.setTimeout(90_000);
    await home(page); await openGame(page, 'atoms'); await mode(page, 'rx');
    await pick(page, TOP, '[data-xp="smoke"]');
    await waitDbg(page, 'atoms', d => d.chamber.state.stats.rx.smoke.fired >= 2, { timeout: 40_000 });
    const n = await dbg(page, 'atoms', d => d.chamber.state.stats.rx.smoke.fired);
    await expect(card(page, 'What happened')).toContainText(/Ammonia meets hydrogen chloride: it happened \d+ time/);
    expect(n).toBeGreaterThanOrEqual(2);
    await expect(card(page, 'Atoms in = atoms out')).toContainText('Electric charge: 0 → 0 ✅');
  });
});

test.describe('Atom Builder: lifecycle', () => {
  const instrument = `(()=>{window.__raf=0;const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>{if(cb.name!=='fxLoop')window.__raf++;cb(t)});})();`;

  test('leave during a reaction, reopen, change modes, switch games, resize, go back', async ({ page }) => {
    test.setTimeout(120_000);
    await page.addInitScript(instrument);
    await home(page); await openGame(page, 'atoms'); await mode(page, 'rx');
    await pick(page, TOP, '[data-xp="flame"]');
    await page.keyboard.press('s');
    await page.waitForTimeout(800);
    await goBack(page);                                       // leave mid-reaction
    await page.waitForTimeout(2600);
    const r0 = await page.evaluate(() => window.__raf);
    await page.waitForTimeout(1000);
    expect(await page.evaluate(r0 => window.__raf - r0, r0), 'frames still running after leaving').toBeLessThanOrEqual(2);
    await openGame(page, 'atoms');                            // reopen: a fresh start in atom mode
    expect(await atom(page)).toMatchObject({ p: 1, n: 0, e: 1 });
    expect(await dbg(page, 'atoms', d => d.chamber)).toBe(null);
    for (const m of ['mol', 'rx', 'atom', 'rx']) { await mode(page, m); await page.waitForTimeout(150); }
    // resize while the chamber runs: the simulation box is independent of the screen
    const t0 = await dbg(page, 'atoms', d => d.chamber.state.t);
    await page.setViewportSize({ width: 800, height: 600 }); await page.waitForTimeout(400);
    await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(400);
    expect(await dbg(page, 'atoms', d => d.chamber.state.t)).toBeGreaterThan(t0);
    const b = await canvasBox(page);
    expect(b.width).toBeGreaterThan(600);
    // switch games through the address bar, then browser Back
    await page.evaluate(() => { location.hash = 'balance'; });
    await page.waitForFunction(() => window.WiggleBox.ready === 'balance');
    await page.goBack();
    await page.waitForFunction(() => window.WiggleBox.ready === 'atoms');
    expect(await atom(page)).toMatchObject({ p: 1 });
    await goBack(page);
  });
});

test.describe('@layout Atom Builder on touch screens', () => {
  /* the same check as 20-layout-touch: visible controls, scrolled into view inside a finger-scrollable panel if needed,
     fully on screen and not covered */
  function unreachable(page) {
    return page.evaluate(async () => {
      const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden]'); };
      const list = [...document.querySelectorAll('#game button, #game [role=button]')].filter(b => vis(b) && !b.closest('.pop') && !b.closest('.cgh'));
      const bad = [];
      for (const el of list) {
        for (let a = el.parentElement; a; a = a.parentElement) { const o = getComputedStyle(a); if (/(auto|scroll)/.test(o.overflowY + o.overflowX) && (a.scrollHeight > a.clientHeight || a.scrollWidth > a.clientWidth)) { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); break; } }
        await new Promise(r => requestAnimationFrame(r));
        if (!el.isConnected) continue;
        const r = el.getBoundingClientRect(), name = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30);
        if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) { bad.push(`${name}: off screen`); continue; }
        const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (!t || !(t === el || el.contains(t))) bad.push(`${name}: covered by ${t ? t.className || t.tagName : 'nothing'}`);
      }
      return bad;
    });
  }
  test('@layout every mode fits, and a finger can drag a proton onto the atom', async ({ page }) => {
    test.setTimeout(90_000);
    await home(page); await openGame(page, 'atoms', { tap: true });
    await page.waitForTimeout(5600);                          // let the opening hint fade
    for (const m of ['mol', 'rx', 'atom']) {
      await mode(page, m); await page.waitForTimeout(500);
      expect(await unreachable(page), `${m} controls`).toEqual([]);
      const b = await canvasBox(page);
      expect(b.width).toBeGreaterThanOrEqual(200); expect(b.height).toBeGreaterThanOrEqual(140);
    }
    const box = await canvasBox(page), geo = await dbg(page, 'atoms', d => d.atomGeo()), pb = geo.bins.find(x => x.k === 'p');
    const t = await touchSession(page);
    await t.drag([[box.x + pb.x, box.y + pb.y], [box.x + geo.cx, box.y + geo.cy]], { steps: 10 });
    expect((await atom(page)).p).toBe(2);
    await t.tap(box.x + pb.x, box.y + pb.y);
    expect((await atom(page)).p).toBe(3);
    // the reaction chamber: a finger tap makes a spark
    await mode(page, 'rx'); await pick(page, TOP, '[data-xp="pop"]');
    const cb = await canvasBox(page);
    await t.tap(cb.x + cb.width / 2, cb.y + cb.height / 2);
    expect(await dbg(page, 'atoms', d => d.chamber.state.ledger.sparkIn)).toBeGreaterThan(0);
  });
});

test.describe('Atom Builder offline', () => {
  test.use({ serviceWorkers: 'allow' });
  test('after one visit, reactions run with the network off', async ({ page, context }) => {
    test.setTimeout(90_000);
    await home(page);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise(r => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true })); });
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#home')).toBeVisible();
    await openGame(page, 'atoms');
    expect(await page.evaluate(() => typeof ATOM_SCI)).toBe('object');
    await mode(page, 'rx'); await pick(page, TOP, '[data-xp="smoke"]');
    await waitDbg(page, 'atoms', d => d.chamber.state.stats.rx.smoke.fired >= 1, { timeout: 40_000 });
    await context.setOffline(false);
  });
});
