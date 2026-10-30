// Games 01-03: Atom Builder, Balance Scale, Bridge Builder. Real clicks, taps and drags; reference values are
// independent of the app's own tables.
import { test, expect, home, openGame, dbg, waitDbg, canvasBox, mouseDrag } from './helpers.mjs';

/* ---------------- Atom Builder ---------------- */
// IUPAC names, symbols, standard atomic weights rounded to whole numbers, and the neutron count of a stable isotope.
const ELEMENTS = [
  ['H', 'Hydrogen', 1, 0], ['He', 'Helium', 4, 2], ['Li', 'Lithium', 7, 4], ['Be', 'Beryllium', 9, 5], ['B', 'Boron', 11, 6],
  ['C', 'Carbon', 12, 6], ['N', 'Nitrogen', 14, 7], ['O', 'Oxygen', 16, 8], ['F', 'Fluorine', 19, 10], ['Ne', 'Neon', 20, 10],
  ['Na', 'Sodium', 23, 12], ['Mg', 'Magnesium', 24, 12], ['Al', 'Aluminium', 27, 14], ['Si', 'Silicon', 28, 14], ['P', 'Phosphorus', 31, 16],
  ['S', 'Sulfur', 32, 16], ['Cl', 'Chlorine', 35, 18], ['Ar', 'Argon', 40, 22], ['K', 'Potassium', 39, 20], ['Ca', 'Calcium', 40, 20],
];
const shellsOf = z => { const s = []; let r = z; for (const c of [2, 8, 8, 18]) { if (r <= 0) break; s.push(Math.min(c, r)); r -= c; } return s.join(' , '); };

/* Drag a bond from atom i to atom j the way a child does: press on i, slide over, and let go on j where it is now. */
async function bond(page, box, i, j) {
  const at = k => dbg(page, 'atoms', (d, G, W, k) => { const q = d.mol.atoms[k]; return [q.x, q.y]; }, k);
  const a = await at(i);
  await page.mouse.move(box.x + a[0], box.y + a[1]); await page.mouse.down();
  for (let s = 1; s <= 6; s++) { const b = await at(j); await page.mouse.move(box.x + a[0] + (b[0] - a[0]) * s / 6, box.y + a[1] + (b[1] - a[1]) * s / 6, { steps: 2 }); }
  const b = await at(j); await page.mouse.move(box.x + b[0], box.y + b[1]); await page.mouse.up();
}

test.describe('01 Atom Builder', () => {
  test('build all 20 elements with the buttons: names, mass numbers, charge, shells and discoveries are right', async ({ page }) => {
    test.setTimeout(120_000);
    await home(page); await openGame(page, 'atoms');
    const click = a => page.locator(`#ex [data-a="${a}"]`).click();
    let p = 1, n = 0, e = 1;
    for (let z = 1; z <= 20; z++) {
      const [sym, name, , nn] = ELEMENTS[z - 1];
      while (p < z) { await click('p+'); p++; }
      while (e < z) { await click('e+'); e++; }
      while (n < nn) { await click('n+'); n++; }
      while (n > nn) { await click('n-'); n--; }
      const pn = page.locator('#pn');
      await expect(pn.locator('.fx.big')).toContainText(name);
      await expect(pn.locator('.fx.big')).toContainText('Neutral atom');
      await expect(pn.locator('.fx.big')).not.toContainText('unstable');
      await expect(pn).toContainText(`= ${z} + ${nn} = ${z + nn}`);              // mass number A = p + n
      await expect(pn).toContainText(`${z} − ${z} = 0`);                          // charge
      await expect(pn.locator('.fx').filter({ hasText: 'Electron shells' })).toContainText(shellsOf(z));
      await expect(pn.locator('.pt.got', { hasText: new RegExp(`^${sym}$`) })).toHaveCount(1);
    }
    await page.waitForTimeout(500);
    await expect(page.locator('#game .starn')).toHaveText('19'); // H is known from the start; 19 discoveries
    expect(await page.locator('#pn .pt.got').count()).toBe(20);
  });

  test('ions, unstable nuclei and the remove buttons', async ({ page }) => {
    await home(page); await openGame(page, 'atoms');
    const click = a => page.locator(`#ex [data-a="${a}"]`).click();
    for (let i = 0; i < 10; i++) await click('p+');           // p = 11 sodium
    for (let i = 0; i < 12; i++) await click('n+');
    for (let i = 0; i < 9; i++) await click('e+');            // e = 10 -> Na+
    await expect(page.locator('#pn .fx.big')).toContainText('Ion with charge +1');
    await click('e+'); await click('e+');                      // e = 12 -> Na-
    await expect(page.locator('#pn .fx.big')).toContainText('Ion with charge -1');
    await click('n+');                                          // n = 13: no stable sodium-24
    await expect(page.locator('#pn .fx.big')).toContainText('unstable');
    await click('n-');
    await expect(page.locator('#pn .fx.big')).not.toContainText('unstable');
    for (let i = 0; i < 30; i++) await click('p-');           // never below 1 proton
    expect(await dbg(page, 'atoms', d => 1)).toBe(1);
    await expect(page.locator('#pn .fx.big')).toContainText('Hydrogen');
    // keyboard: P adds a proton, Shift+P removes one
    await page.keyboard.press('p');
    await expect(page.locator('#pn .fx.big')).toContainText('Helium');
    await page.keyboard.press('Shift+P');
    await expect(page.locator('#pn .fx.big')).toContainText('Hydrogen');
  });

  // atoms, then bonds as [i, j, order]
  const MOLS = [
    ['Water', ['O', 'H', 'H'], [[0, 1, 1], [0, 2, 1]], 18], ['Carbon dioxide', ['C', 'O', 'O'], [[0, 1, 2], [0, 2, 2]], 44],
    ['Methane', ['C', 'H', 'H', 'H', 'H'], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], 16], ['Ammonia', ['N', 'H', 'H', 'H'], [[0, 1, 1], [0, 2, 1], [0, 3, 1]], 17],
    ['Oxygen gas', ['O', 'O'], [[0, 1, 2]], 32], ['Hydrogen gas', ['H', 'H'], [[0, 1, 1]], 2], ['Nitrogen gas', ['N', 'N'], [[0, 1, 3]], 28],
    ['Hydrochloric acid', ['H', 'Cl'], [[0, 1, 1]], 36], ['Hydrogen peroxide', ['H', 'O', 'O', 'H'], [[0, 1, 1], [1, 2, 1], [2, 3, 1]], 34],
    ['Ethane', ['C', 'C', 'H', 'H', 'H', 'H', 'H', 'H'], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1], [1, 7, 1]], 30],
    ['Methanol', ['C', 'O', 'H', 'H', 'H', 'H'], [[0, 1, 1], [1, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1]], 32],
    ['Ethylene', ['C', 'C', 'H', 'H', 'H', 'H'], [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]], 28],
  ];

  test('every molecule in the list can be built by dragging bonds, and is named with the right mass', async ({ page }) => {
    test.setTimeout(240_000);
    await home(page); await openGame(page, 'atoms');
    await page.locator('[data-am="mol"]').click();
    const box = await canvasBox(page);
    let found = 0;
    for (const [name, atoms, bonds, mass] of MOLS) {
      await page.locator('#ex [data-a="clr"]').click();
      for (const a of atoms) await page.locator(`#ex [data-add="${a}"]`).click();
      await page.waitForTimeout(700);
      for (const [i, j, o] of bonds) for (let k = 0; k < o; k++) { await bond(page, box, i, j); await page.waitForTimeout(200); }
      await expect(page.locator('#pn .fx.big .tag')).toHaveText(name, { timeout: 4000 });
      await expect(page.locator('#pn')).toContainText(`= ${mass} u`);
      found++;
      await expect(page.locator('#pn .fx').filter({ hasText: 'Molecules found' }).locator('.tag')).toContainText(`${found}/12`);
    }
  });

  test('tapping an atom undoes its newest bond; flicking it off the edge removes it', async ({ page }) => {
    await home(page); await openGame(page, 'atoms');
    await page.locator('[data-am="mol"]').click();
    const box = await canvasBox(page);
    await page.locator('#ex [data-add="O"]').click(); await page.locator('#ex [data-add="O"]').click();
    await page.waitForTimeout(700);
    const pos = () => dbg(page, 'atoms', d => d.mol.atoms.map(q => [q.x, q.y]));
    for (let k = 0; k < 2; k++) { await bond(page, box, 0, 1); await page.waitForTimeout(250); }
    await expect(page.locator('#pn .fx.big .tag')).toHaveText('Oxygen gas');
    let [a] = await pos();
    await page.mouse.click(box.x + a[0], box.y + a[1]);       // tap: double bond -> single bond
    await page.waitForTimeout(200);
    expect(await dbg(page, 'atoms', d => d.mol.bonds.map(b => b.o))).toEqual([1]);
    await expect(page.locator('#pn .fx.big')).toContainText('2 open bonds left');
    [a] = await pos();
    await mouseDrag(page, [[box.x + a[0], box.y + a[1]], [box.x + 2, box.y + a[1]]], { steps: 12 }); // flick off the left edge
    await page.waitForTimeout(200);
    expect(await dbg(page, 'atoms', d => [d.mol.atoms.length, d.mol.bonds.length])).toEqual([1, 0]);
    await page.locator('#ex [data-a="clr"]').click();
    expect(await dbg(page, 'atoms', d => d.mol.atoms.length)).toBe(0);
  });

  test('a full atom refuses a fourth bond', async ({ page }) => {
    await home(page); await openGame(page, 'atoms');
    await page.locator('[data-am="mol"]').click();
    const box = await canvasBox(page);
    for (const a of ['H', 'H']) await page.locator(`#ex [data-add="${a}"]`).click();
    await page.waitForTimeout(700);
    await bond(page, box, 0, 1); await page.waitForTimeout(250);
    await bond(page, box, 0, 1); await page.waitForTimeout(250);
    expect(await dbg(page, 'atoms', d => d.mol.bonds.map(b => b.o))).toEqual([1]); // H can only make one bond
    await expect(page.locator('.simhint')).toContainText('already full');
  });
});

/* ---------------- Balance Scale ---------------- */
async function tapItem(page, side, kind) {
  const box = await canvasBox(page);
  // the pans are laid out again on the next frame after a tap; wait for the drawn items to catch up with the count
  await waitDbg(page, 'balance', (d, G, W, [s, k]) => d.items.filter(i => i.side === s && i.kind === k).length === d[s][k], { arg: [side, kind], timeout: 10_000 });
  const it = await dbg(page, 'balance', (d, G, W, [s, k]) => { const o = d.items.filter(i => i.side === s && i.kind === k).pop(); return o && [o.x, o.y]; }, [side, kind]);
  expect(it, `a ${kind} on side ${side}`).toBeTruthy();
  await page.mouse.click(box.x + it[0], box.y + it[1]);
  await page.waitForTimeout(60);
}

test.describe('02 Balance Scale', () => {
  // [a, b, c, d] for a·x + b = c·x + d, solved independently
  const LEVELS = [[1, 2, 0, 5], [1, 4, 0, 9], [2, 0, 0, 8], [2, 1, 0, 7], [3, 2, 0, 14], [1, 6, 2, 2], [2, 5, 3, 1], [4, 3, 2, 11], [3, 1, 1, 9], [5, 2, 3, 10]];

  test('all ten mystery-box levels can be solved by tapping, and x is right', async ({ page }) => {
    test.setTimeout(180_000);
    await home(page); await openGame(page, 'balance');
    for (let i = 0; i < LEVELS.length; i++) {
      const [a, b, c, d] = LEVELS[i], x = (d - b) / (a - c);
      await expect(page.locator('#lv')).toHaveText(`Level ${i + 1}`);
      expect(await dbg(page, 'balance', d => d.x)).toBe(x);
      // play like a careful child: take a box from each side, then a coin from each side, then split
      for (let guard = 0; guard < 60; guard++) {
        const s = await dbg(page, 'balance', d => ({ L: d.L, R: d.R, solved: d.solved }));
        if (s.solved) break;
        const bothBoxes = s.L.b > 0 && s.R.b > 0, bothCoins = s.L.u > 0 && s.R.u > 0;
        if (bothBoxes) { await tapItem(page, 'L', 'b'); await tapItem(page, 'R', 'b'); continue; }
        if (bothCoins) { await tapItem(page, 'L', 'u'); await tapItem(page, 'R', 'u'); continue; }
        // equation is now k·x = m: the split button must be offered
        await expect(page.locator('#split')).toBeVisible();
        await page.locator('#split').click();
      }
      expect(await dbg(page, 'balance', d => d.solved)).toBe(true);
      await expect(page.locator('#steps')).toContainText(`= ${x}`);
      await expect(page.locator('#eq')).toContainText('=');
      await page.locator('#next').click();
    }
  });

  test('unbalanced moves show ≠ and the scale tilts; Undo puts things back', async ({ page }) => {
    await home(page); await openGame(page, 'balance');
    await tapItem(page, 'L', 'u');                       // x + 1 ≠ 5
    await expect(page.locator('#eq')).toContainText('≠');
    await page.waitForTimeout(600);
    expect(await dbg(page, 'balance', d => d.L.u)).toBe(1);
    await page.locator('#undo').click();
    expect(await dbg(page, 'balance', d => d.L.u)).toBe(2);
    await expect(page.locator('#eq')).not.toContainText('≠');
    await page.keyboard.press('w');                      // keyboard path: W takes a coin from the left
    expect(await dbg(page, 'balance', d => d.L.u)).toBe(1);
    await page.keyboard.press('z');
    expect(await dbg(page, 'balance', d => d.L.u)).toBe(2);
  });

  // seesaw: hang blocks so that sum(m·d) matches. [left weights, blocks to use] solved by brute force here
  test('every seesaw level can be balanced by tapping blocks and pegs, and torque math is shown right', async ({ page }) => {
    test.setTimeout(120_000);
    await home(page); await openGame(page, 'balance');
    await page.locator('[data-mode="torque"]').click();
    const box = await canvasBox(page);
    for (let lv = 0; lv < 6; lv++) {
      await expect(page.locator('#lv')).toHaveText(`Level ${lv + 1}`);
      const st = await dbg(page, 'balance', d => ({ left: d.tq.left, bank: d.tq.bank }));
      const T = st.left.reduce((s, o) => s + o.m * o.d, 0);
      // find up to two (block, peg) placements on different pegs that make T
      let plan = null;
      for (const m of st.bank) for (let d = 1; d <= 5 && !plan; d++) if (m * d === T) plan = [[m, d]];
      for (const m1 of st.bank) for (const m2 of st.bank) for (let d1 = 1; d1 <= 5 && !plan; d1++) for (let d2 = d1 + 1; d2 <= 5 && !plan; d2++) if (m1 * d1 + m2 * d2 === T) plan = [[m1, d1], [m2, d2]];
      expect(plan, `level ${lv + 1} solvable`).toBeTruthy();
      await expect(page.locator('#eq')).toContainText(`= ${T}`);
      for (const [m, d] of plan) {
        const idx = st.bank.indexOf(m);
        await page.locator(`[data-blk="${idx}"]`).click();
        const g = await dbg(page, 'balance', d => d.geomTq());
        await page.mouse.click(box.x + g.cx + Math.cos(g.a) * d * g.sp, box.y + g.cy + Math.sin(g.a) * d * g.sp + 20);
        await page.waitForTimeout(120);
      }
      await expect(page.locator('#eq')).toContainText(`${T} = ${T}`);
      await waitDbg(page, 'balance', (d, G, W, lv) => d.tq.lvl === lv + 1, { arg: lv, timeout: 6000 });
    }
  });
});

/* ---------------- Bridge Builder ---------------- */
// A fully triangulated Pratt truss: road deck on every square, top chord h squares up.
async function buildTruss(page, { h = 2, web = 'wood', chord = 'wood' } = {}) {
  return dbg(page, 'bridge', (d, G, W, [h, web, chord]) => {
    const L = d.L(), g = d.grid(), n = Math.round((L.x1 - L.x0) / g), y0 = d.nodes[0].oy, X = i => L.x0 + i * g, T = y0 - g * h;
    for (let i = 0; i < n; i++) d.addBeam(X(i), y0, X(i + 1), y0, 'road');
    for (let i = 1; i < n; i++) d.addBeam(X(i), y0, X(i), T, web);
    for (let i = 1; i < n - 1; i++) d.addBeam(X(i), T, X(i + 1), T, chord);
    d.addBeam(X(0), y0, X(1), T, chord); d.addBeam(X(n), y0, X(n - 1), T, chord);
    for (let i = 1; i < n - 1; i++) { if (i < n / 2) d.addBeam(X(i), T, X(i + 1), y0, web); else d.addBeam(X(i), y0, X(i + 1), T, web); }
    return n;
  }, [h, web, chord]);
}
async function runTruck(page) {
  await page.locator('#go').click();
  await waitDbg(page, 'bridge', d => d.result, { timeout: 30_000 });
  return dbg(page, 'bridge', d => d.result);
}

test.describe('03 Bridge Builder', () => {
  test('a road with nothing holding it up sags and breaks; the same span with triangles holds (every level)', async ({ page }) => {
    test.setTimeout(240_000);
    await home(page); await openGame(page, 'bridge');
    const plans = [{ h: 1 }, { h: 2 }, { h: 2 }, { h: 3 }, { h: 2, web: 'steel', chord: 'steel' }];
    for (let lv = 0; lv < 5; lv++) {
      await dbg(page, 'bridge', (d, G, W, lv) => { d.load(lv); return 1; }, lv);
      // deck only, as long beams as allowed
      await dbg(page, 'bridge', d => { const L = d.L(), g = d.grid(), n = Math.round((L.x1 - L.x0) / g), y0 = d.nodes[0].oy; for (let i = 0; i < n; i += 3) d.addBeam(L.x0 + i * g, y0, L.x0 + Math.min(n, i + 3) * g, y0, 'road'); return n; });
      expect(await runTruck(page), `deck only, level ${lv + 1}`).toBe('fail');
      expect(await dbg(page, 'bridge', d => d.beams.some(b => b.broken))).toBe(true);
      await page.waitForTimeout(2700); // the bridge resets itself after the splash
      expect(await dbg(page, 'bridge', d => d.result)).toBe(null);
      await page.locator('#clr').click();
      await buildTruss(page, plans[lv]);
      expect(await runTruck(page), `truss, level ${lv + 1}`).toBe('win');
      expect(await dbg(page, 'bridge', d => d.beams.filter(b => b.broken).length)).toBe(0);
      await page.waitForTimeout(2800);
      expect(await dbg(page, 'bridge', d => d.L().lv.cells)).toBe([5, 7, 8, 9, 10][(lv + 1) % 5]);
    }
  });

  test('stronger materials matter: a wood truss that fails the heaviest truck holds in steel', async ({ page }) => {
    test.setTimeout(90_000);
    await home(page); await openGame(page, 'bridge');
    await dbg(page, 'bridge', d => { d.load(4); return 1; });
    await buildTruss(page, { h: 2 });
    expect(await runTruck(page)).toBe('fail');
    const broken = await dbg(page, 'bridge', d => d.beams.filter(b => b.broken).map(b => b.m));
    expect(broken.length).toBeGreaterThan(0);
    await page.waitForTimeout(2700);
    await page.locator('#clr').click();
    await buildTruss(page, { h: 2, web: 'steel', chord: 'steel' });
    expect(await runTruck(page)).toBe('win');
  });

  test('the same bridge gives the same result and the same stretch on a different screen size', async ({ page }) => {
    test.setTimeout(90_000);
    await home(page); await openGame(page, 'bridge');
    await dbg(page, 'bridge', d => { d.load(2); return 1; });
    await buildTruss(page, { h: 2 });
    const a = await runTruck(page), pa = await dbg(page, 'bridge', d => d.peak());
    await page.waitForTimeout(3000);
    await page.setViewportSize({ width: 820, height: 1000 });
    await page.waitForTimeout(500);
    await dbg(page, 'bridge', d => { d.load(2); return 1; });
    await buildTruss(page, { h: 2 });
    const b = await runTruck(page), pb = await dbg(page, 'bridge', d => d.peak());
    expect(b).toBe(a);
    expect(Math.abs(pa - pb) / pa).toBeLessThan(0.05);
  });

  test('building with real drags and taps: beams, materials, too long, underground, erase, undo, clear, budget', async ({ page }) => {
    await home(page); await openGame(page, 'bridge');
    const box = await canvasBox(page);
    const L = await dbg(page, 'bridge', d => d.L()), g = await dbg(page, 'bridge', d => d.grid()), y0 = await dbg(page, 'bridge', d => d.nodes[0].oy);
    const P = (i, j) => [box.x + L.x0 + i * g, box.y + y0 - j * g];
    await mouseDrag(page, [P(0, 0), P(2, 0)], { steps: 8 });                         // road
    await page.locator('[data-bm="wood"]').click();
    await mouseDrag(page, [P(0, 0), P(1, 1)], { steps: 8 });                         // wood diagonal
    await mouseDrag(page, [P(1, 1), P(2, 0)], { steps: 8 });                         // continue from a built dot
    let beams = await dbg(page, 'bridge', d => d.beams.map(b => b.m));
    expect(beams).toEqual(['road', 'wood', 'wood']);
    await expect(page.locator('#pn')).toContainText('1 triangles');
    await mouseDrag(page, [P(0, 0), P(5, 0)], { steps: 8 });                         // 5 squares: too long
    await expect(page.locator('.simhint')).toContainText('too long');
    await page.mouse.click(...P(2, 0)); await page.mouse.click(...P(3, 1));           // tap-tap building
    expect(await dbg(page, 'bridge', d => d.beams.length)).toBe(4);
    await page.locator('[data-bm="erase"]').click();
    const mid = [(P(2, 0)[0] + P(3, 1)[0]) / 2, (P(2, 0)[1] + P(3, 1)[1]) / 2];
    await page.mouse.click(mid[0], mid[1]);
    expect(await dbg(page, 'bridge', d => d.beams.length)).toBe(3);
    await page.locator('#undo').click();
    expect(await dbg(page, 'bridge', d => d.beams.length)).toBe(2);
    await page.locator('#clr').click();
    expect(await dbg(page, 'bridge', d => [d.beams.length, d.nodes.length])).toEqual([0, 4]);
    // over budget: Test refuses and says why
    await dbg(page, 'bridge', d => { const L = d.L(), g = d.grid(), y = d.nodes[0].oy; for (let k = 0; k < 40; k++) d.addBeam(L.x0, y, L.x0 + g * ((k % 4) + 1), y - g * (1 + (k >> 2) % 5), 'steel'); return 1; });
    await page.locator('#go').click();
    await expect(page.locator('.simhint')).toContainText('Over budget');
    expect(await dbg(page, 'bridge', d => d.result)).toBe(null);
  });

  test('Stop during a run puts everything back; Next changes the level', async ({ page }) => {
    await home(page); await openGame(page, 'bridge');
    await buildTruss(page, { h: 1 });
    await page.locator('#go').click();
    await page.waitForTimeout(600);
    expect(await dbg(page, 'bridge', d => d.nodes.some(n => Math.abs(n.y - n.oy) > .01))).toBe(true);
    await page.locator('#stop').click();
    expect(await dbg(page, 'bridge', d => d.nodes.every(n => n.y === n.oy && n.x === n.ox))).toBe(true);
    await page.locator('#nx').click();
    await expect(page.locator('#lv')).toHaveText('Level 2');
  });
});
