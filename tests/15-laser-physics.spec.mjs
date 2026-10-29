// Games 19-20: Laser Lab and Physics Lab.
import { test, expect, home, openGame, dbg, waitDbg, canvasBox, mouseDrag } from './helpers.mjs';

const deg = r => r * 180 / Math.PI;
const dir = r => { const l = Math.hypot(r.x2 - r.x1, r.y2 - r.y1); return [(r.x2 - r.x1) / l, (r.y2 - r.y1) / l]; };
const angBetween = (a, b) => deg(Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1]))));

/* ---------------- Laser Lab ---------------- */
async function laserGrid(page) {
  const b = await canvasBox(page);
  const cs = Math.min(b.width / 10.4, b.height / 7.4), ox = (b.width - 10 * cs) / 2, oy = (b.height - 7 * cs) / 2;
  return { cell: (i, j) => [b.x + ox + (i + .5) * cs, b.y + oy + (j + .5) * cs], cs, b };
}
async function tapCell(page, G, i, j, n = 1) { const [x, y] = G.cell(i, j); for (let k = 0; k < n; k++) { await page.mouse.click(x, y); await page.waitForTimeout(40); } }
async function place(page, G, k, i, j, turns = 0) {
  await page.locator(`#inv [data-inv="${k}"]`).click();
  await tapCell(page, G, i, j);            // places it (mirrors and splitters start at 45°)
  if (turns) await tapCell(page, G, i, j, turns); // each tap turns it 22.5°
}

test.describe('19 Laser Lab', () => {
  /* Hand-worked solutions. Mirrors start at 45° ("\") and each tap adds 22.5°, so 4 taps make "/" (135°). */
  const SOLUTIONS = [
    [['mirror', 6, 5, 4]],
    [['mirror', 2, 1, 0], ['mirror', 2, 4, 0], ['mirror', 7, 4, 4], ['mirror', 7, 1, 4]],
    [['split', 4, 3, 4]],
    [['mirror', 1, 0, 0], ['mirror', 1, 3, 0], ['mirror', 8, 3, 0], ['mirror', 8, 6, 0]],
    null, // the prism puzzle: turn the prism
    [['split', 2, 6, 4], ['split', 2, 3, 4], ['mirror', 9, 3, 4]],
  ];

  test('all six puzzles can be solved by tapping, and every bounce obeys angle in = angle out', async ({ page }) => {
    test.setTimeout(120_000);
    await home(page); await openGame(page, 'laser');
    const G = await laserGrid(page);
    for (let lv = 0; lv < 6; lv++) {
      await expect(page.locator('#lv')).toHaveText(`Puzzle ${lv + 1}`);
      if (SOLUTIONS[lv]) for (const [k, i, j, t] of SOLUTIONS[lv]) await place(page, G, k, i, j, t);
      else {
        // the prism is the only movable piece: keep turning it (15° a tap) until both colour crystals light
        let n = 0;
        while (n < 24 && await dbg(page, 'laser', d => d.lit.size) < 2) { await tapCell(page, G, 3, 3); n++; }
        expect(n, 'prism angle found within one full turn').toBeLessThan(24);
      }
      const r = await dbg(page, 'laser', d => ({ lit: d.lit.size, targets: d.pieces.filter(p => p.k === 'target').length, rays: d.rays, pieces: d.pieces.map(p => ({ k: p.k, i: p.i, j: p.j, a: p.a })) }));
      expect(r.lit, `puzzle ${lv + 1}`).toBe(r.targets);
      // reflection check from the drawn beam: at every mirror the beam leaves at the mirror image of how it came in
      for (const m of r.pieces.filter(p => p.k === 'mirror')) {
        const cx = m.i + .5, cy = m.j + .5, a = m.a * Math.PI / 180, t = [Math.cos(a), Math.sin(a)], nrm = [-t[1], t[0]];
        const inRay = r.rays.find(q => Math.hypot(q.x2 - cx, q.y2 - cy) < .5), outRay = inRay && r.rays.find(q => q.x1 === inRay.x2 && q.y1 === inRay.y2);
        if (!inRay || !outRay) continue;
        const di = dir(inRay), dout = dir(outRay), dn = di[0] * nrm[0] + di[1] * nrm[1];
        const expectOut = [di[0] - 2 * dn * nrm[0], di[1] - 2 * dn * nrm[1]];
        expect(angBetween(dout, expectOut), `mirror at ${m.i},${m.j}`).toBeLessThan(.01);
        expect(Math.abs(angBetween(di.map(v => -v), nrm) - angBetween(dout, nrm)) < .01 || Math.abs(angBetween(di, nrm) - angBetween(dout, nrm.map(v => -v))) < .01).toBe(true);
      }
      await expect(page.locator('#game .starn')).toHaveText(String(lv + 1), { timeout: 3000 });
      if (lv < 5) await expect(page.locator('#lv')).toHaveText(`Puzzle ${lv + 2}`, { timeout: 5000 });
    }
  });

  test('the prism fans white light out: violet bends most, red least, and red matches Snell through a 60° prism', async ({ page }) => {
    await home(page); await openGame(page, 'laser');
    for (let k = 0; k < 4; k++) await page.locator('#lnext').click();
    await expect(page.locator('#lv')).toHaveText('Puzzle 5');
    // at its starting angle the prism traps the light inside (total internal reflection); turn it to the solution
    const G = await laserGrid(page);
    for (let n = 0; n < 24 && await dbg(page, 'laser', d => d.lit.size) < 2; n++) await tapCell(page, G, 3, 3);
    const r = await dbg(page, 'laser', d => ({ rays: d.rays, events: d.events, n: [1.50, 1.505, 1.51, 1.517, 1.525, 1.533, 1.542] }));
    // colours that leave through the second face: in, refract, out = 3 beam pieces. The rest are trapped at that face
    // (their n is higher, so their critical angle is smaller) and must be the bluest ones.
    const dev = [], direct = [];
    for (let ci = 0; ci < 7; ci++) { const rs = r.rays.filter(q => q.ci === ci); if (rs.length === 3) { direct.push(ci); dev.push(angBetween([1, 0], dir(rs[2]))); } }
    expect(direct.length).toBeGreaterThanOrEqual(3);
    expect(direct).toEqual([...Array(direct.length).keys()]);
    for (let k = 1; k < dev.length; k++) expect(dev[k], `colour ${k} bends more than colour ${k - 1}`).toBeGreaterThan(dev[k - 1] + .05);
    for (const e of r.events.filter(e => e.type === 'tir')) expect(e.in).toBeGreaterThan(e.crit);
    // red: in at i1, out after two refractions through a 60° apex: deviation = i1 + i2 - A
    const ev = r.events.filter(e => e.type === 'refract');
    expect(ev.length).toBeGreaterThanOrEqual(2);
    const n = 1.5, A = 60, i1 = ev[0].in, r1 = deg(Math.asin(Math.sin(i1 * Math.PI / 180) / n)), i2 = deg(Math.asin(n * Math.sin((A - r1) * Math.PI / 180)));
    expect(Math.abs(ev[0].out - r1)).toBeLessThan(.05);
    expect(Math.abs(dev[0] - (i1 + i2 - A))).toBeLessThan(.2);
  });

  test('free play: glass turns, bends red light by Snell\'s law and lets it out parallel; trapped light only past the critical angle', async ({ page }) => {
    await home(page); await openGame(page, 'laser');
    await page.locator('[data-lm="free"]').click();
    const G = await laserGrid(page);
    await page.locator('#wl').click();                         // red light
    await page.locator('#del').click(); await tapCell(page, G, 4, 3); // remove the prism
    expect(await dbg(page, 'laser', d => d.pieces.some(p => p.k === 'prism'))).toBe(false);
    await place(page, G, 'glass', 2, 3);
    const before = await dbg(page, 'laser', d => d.rays.length);
    await tapCell(page, G, 2, 3, 2);                           // 2 × 15° = 30°
    const r = await dbg(page, 'laser', d => ({ rays: d.rays, ev: d.events, g: d.pieces.find(p => p.k === 'glass' && p.i === 2).a }));
    expect(r.g).toBe(30);
    const ref = r.ev.filter(e => e.type === 'refract');
    expect(ref.length).toBe(2);
    expect(ref[0].in).toBeCloseTo(30, 3);
    expect(ref[0].out).toBeCloseTo(deg(Math.asin(Math.sin(Math.PI / 6) / 1.5)), 3); // 19.47°
    // the beam inside the glass turned by 30 − 19.47 = 10.53°, and leaves parallel to how it came in
    const inside = r.rays[1], last = r.rays[r.rays.length - 1];
    expect(angBetween([1, 0], dir(inside))).toBeCloseTo(30 - 19.4712, 2);
    expect(angBetween([1, 0], dir(last))).toBeLessThan(.01);
    expect(Math.abs(last.y1 - 3.5)).toBeGreaterThan(.01);      // but shifted sideways
    expect(r.rays.length).toBeGreaterThanOrEqual(before);
    // the measure card shows both sides of Snell's law equal
    await page.mouse.click(...G.cell(2, 3)); await page.mouse.click(...G.cell(2, 3)); // two more turns (60°) then look
    const tx = await page.locator('#ev').textContent();
    const nums = tx.match(/(\d\.\d{3}) = (\d\.\d{3})/);
    expect(nums && nums[1]).toBe(nums && nums[2]);
    // put a prism back and sweep all its angles: every trapped-light event is past 41.8°
    await page.locator('#inv [data-inv="prism"]').click(); await tapCell(page, G, 6, 3);
    let tir = 0;
    for (let k = 0; k < 24; k++) {
      const e = await dbg(page, 'laser', d => d.events.filter(x => x.type === 'tir'));
      for (const x of e) { tir++; expect(x.crit).toBeCloseTo(deg(Math.asin(1 / 1.5)), 2); expect(x.in).toBeGreaterThan(x.crit); }
      await tapCell(page, G, 6, 3);
    }
    expect(tir, 'some prism angle traps light').toBeGreaterThan(0);
    expect(await dbg(page, 'laser', d => d.rays.every(q => [q.x1, q.y1, q.x2, q.y2].every(Number.isFinite)))).toBe(true);
  });

  test('pieces run out, come back when dragged off the board, and fixed pieces cannot be moved', async ({ page }) => {
    await home(page); await openGame(page, 'laser');
    const G = await laserGrid(page);
    await place(page, G, 'mirror', 3, 3);
    await tapCell(page, G, 4, 3);                              // no mirrors left
    await expect(page.locator('.simhint')).toContainText('No more of those');
    await expect(page.locator('#inv [data-inv="mirror"]')).toContainText('×0');
    const [x, y] = G.cell(3, 3);
    await mouseDrag(page, [[x, y], [x, y + G.cs], [x, G.b.y - 20]], { steps: 8 });
    await expect(page.locator('#inv [data-inv="mirror"]')).toContainText('×1');
    // the laser itself is fixed in puzzles
    const [lx, ly] = G.cell(0, 5);
    await mouseDrag(page, [[lx, ly], [lx + G.cs * 2, ly]], { steps: 8 });
    expect(await dbg(page, 'laser', d => { const l = d.pieces.find(p => p.k === 'laser'); return [l.i, l.j, l.a]; })).toEqual([0, 5, 0]);
    // keys: E turns the selected piece
    await place(page, G, 'mirror', 6, 5);
    await page.keyboard.press('e'); await page.keyboard.press('e'); await page.keyboard.press('e'); await page.keyboard.press('e');
    expect(await dbg(page, 'laser', d => d.pieces.find(p => p.k === 'mirror').a)).toBe(135);
    expect(await dbg(page, 'laser', d => d.lit.size)).toBe(1);
  });
});

/* ---------------- Physics Lab ---------------- */
const Pdbg = (page, fn, arg) => dbg(page, 'physics', fn, arg);
async function openPhysics(page) { await home(page); await openGame(page, 'physics'); await page.waitForFunction(() => window.Matter && window.WiggleBox.games.physics._debug); }
async function sceneMenu(page, s) { await page.locator('#scenes').click(); await page.locator(`.popitem[data-s="${s}"]`).click(); }
/* record a body's track over n engine steps */
async function track(page, setup, n) {
  return page.evaluate(([setup, n]) => new Promise(res => {
    const d = window.WiggleBox.games.physics._debug, M = window.Matter; const b = new Function('d', 'M', setup)(d, M); const out = [];
    const f = () => { out.push({ y: b.position.y, x: b.position.x, vy: b.velocity.y, vx: b.velocity.x }); if (out.length >= n) { M.Events.off(d.engine, 'afterUpdate', f); res({ out, W: d.W, H: d.H, PXM: d.PXM, r: b.circleRadius }); } };
    M.Events.on(d.engine, 'afterUpdate', f);
  }), [setup, n]);
}
const fitAcc = ys => { // least squares y = a + b t + c t², returns 2c
  const n = ys.length; let S = [0, 0, 0, 0, 0], T = [0, 0, 0];
  ys.forEach((y, t) => { for (let k = 0; k < 5; k++) S[k] += t ** k; for (let k = 0; k < 3; k++) T[k] += y * t ** k; });
  const M = [[S[0], S[1], S[2]], [S[1], S[2], S[3]], [S[2], S[3], S[4]]];
  const det = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const M2 = M.map((r, i) => [r[0], r[1], T[i]]);
  return 2 * det(M2) / det(M);
};
const PUZZLE_RAMPS = (() => {
  const bez = (P, n = 40) => [...Array(n + 1)].map((_, i) => { const t = i / n; let q = P; while (q.length > 1) q = q.slice(1).map((b, k) => [(1 - t) * q[k][0] + t * b[0], (1 - t) * q[k][1] + t * b[1]]); return q[0]; });
  const line = (a, b) => bez([a, b], 12);
  return [
    [line([.08, .2], [.6, .75])],
    [line([.34, .7], [.66, .7])],
    [line([.08, .2], [.45, .4])],
    [bez([[.03, .14], [.3, .9], [.5, .45], [.78, .45]])],
    [line([.95, .28], [.15, .38])],
  ];
})();
async function drawRamp(page, pts) {
  const b = await canvasBox(page);
  await mouseDrag(page, pts.map(([x, y]) => [b.x + x * b.width, b.y + y * b.height]), { steps: 2 });
}

test.describe('20 Physics Lab', () => {
  test('falling: g is 9.8 m/s² on Earth and 1.62 m/s² on the Moon, and height energy turns into moving energy', async ({ page }) => {
    await openPhysics(page);
    await sceneMenu(page, 'empty');
    const res = {};
    for (const planet of ['earth', 'moon']) {
      if (planet === 'moon') { await page.locator('#grav').click(); await sceneMenu(page, 'empty'); } // fresh lab: the Earth ball would still be bouncing
      const t = await track(page, `return d.spawn('ball', d.W/2, 60)`, planet === 'earth' ? 24 : 50);
      const ys = t.out.map(o => o.y), a = fitAcc(ys) * 3600 / t.PXM; // px/step² → m/s²
      res[planet] = a;
      // energy per kg: ½v² + g·h stays the same while falling (on Earth air drag takes a little; the Moon has no air)
      // speed from the positions themselves (central difference), so this checks the motion, not the engine's bookkeeping
      const g = planet === 'earth' ? 9.8 : 9.8 * .165;
      const E = t.out.slice(1, -1).map((o, i) => { const v = (t.out[i + 2].y - t.out[i].y) / 2 * 60 / t.PXM; return .5 * v * v + g * (t.H - o.y) / t.PXM; });
      const drift = (E[0] - E[E.length - 1]) / E[0];
      expect(drift, `${planet} energy lost while falling`).toBeLessThan(.03);
      expect(drift).toBeGreaterThan(-.005);                    // never gains energy
      if (planet === 'moon') expect(Math.abs(drift)).toBeLessThan(.005);
    }
    expect(res.earth).toBeGreaterThan(9.8 * .97); expect(res.earth).toBeLessThan(9.8 * 1.01);
    expect(res.moon).toBeGreaterThan(1.617 * .995); expect(res.moon).toBeLessThan(1.617 * 1.005);
  });

  test('a rubber ball bounces back to about e² of its drop height (restitution 0.82)', async ({ page }) => {
    await openPhysics(page);
    await sceneMenu(page, 'empty');
    const t = await track(page, `return d.spawn('ball', d.W/2, d.H*0.2)`, 220);
    const floorY = t.H - t.r, drop = floorY - t.out[0].y;
    const hit = t.out.findIndex((o, i) => i > 0 && o.vy < 0 && t.out[i - 1].vy > 0);
    expect(hit).toBeGreaterThan(0);
    const apex = Math.min(...t.out.slice(hit, hit + 120).map(o => o.y)), rise = floorY - apex;
    const ratio = rise / drop;
    expect(ratio).toBeGreaterThan(.82 ** 2 - .12);
    expect(ratio).toBeLessThan(.82 ** 2 + .08);
  });

  test('gravity menu: space floats, upside down falls up; Freeze stops time; Slow-mo slows it', async ({ page }) => {
    await openPhysics(page);
    await sceneMenu(page, 'empty');
    await page.locator('#grav').click();                                           // the Moon: no air, so a balloon falls
    let t0 = await track(page, `return d.spawn('balloon', d.W/2, d.H/2)`, 30);
    expect(t0.out[29].vy).toBeGreaterThan(.5);
    await page.locator('#grav').click();                                           // space
    await expect(page.locator('#grav')).toContainText('Space');
    let t = await track(page, `const b=d.spawn('crate', d.W/2, d.H/2); window.Matter.Body.setVelocity(b,{x:0,y:0}); return b`, 30);
    expect(Math.abs(t.out[29].vy - t.out[0].vy)).toBeLessThan(.01);
    await page.locator('#grav').click();                                           // upside down
    t = await track(page, `return d.spawn('crate', d.W/2, d.H/2)`, 20);
    expect(t.out[19].vy).toBeLessThan(-1);
    await page.locator('#grav').click();                                           // back to Earth
    await expect(page.locator('#grav')).toContainText('Earth');
    await sceneMenu(page, 'empty');
    await Pdbg(page, d => { d.spawn('ball', d.W / 2, 80); });
    await page.locator('#pause').click();
    const y0 = await Pdbg(page, d => d.world.bodies.find(b => b.circleRadius && !b.isStatic).position.y);
    await page.waitForTimeout(500);
    expect(await Pdbg(page, d => d.world.bodies.find(b => b.circleRadius && !b.isStatic).position.y)).toBe(y0);
    await page.locator('#pause').click();
    // slow motion: the same number of frames moves things about 0.28 as far
    await sceneMenu(page, 'empty');
    const fall = async () => { const r = await track(page, `return d.spawn('ball', d.W/2, 40)`, 20); return r.out[19].y - r.out[0].y; };
    const normal = await fall();
    await page.locator('#slow').click();
    await sceneMenu(page, 'empty');
    const slow = await fall();
    expect(slow / normal).toBeGreaterThan(.03); expect(slow / normal).toBeLessThan(.2);  // (0.28)² ≈ 0.08 for a fall from rest
  });

  test('every scene loads and runs for three seconds with nothing escaping or turning into NaN', async ({ page }) => {
    test.setTimeout(90_000);
    await openPhysics(page);
    for (const s of ['play', 'domino', 'tower', 'cars', 'puzzle', 'empty']) {
      await sceneMenu(page, s);
      const n = await Pdbg(page, d => d.world.bodies.filter(b => !b.isStatic).length);
      if (s !== 'empty' && s !== 'puzzle') expect(n, s).toBeGreaterThan(0);
      await page.waitForTimeout(3000);
      const bad = await Pdbg(page, d => window.Matter.Composite.allBodies(d.world).filter(b => ![b.position.x, b.position.y, b.velocity.x, b.velocity.y, b.angle].every(Number.isFinite)).length);
      expect(bad, s).toBe(0);
    }
  });

  test('every item in the Add menu can be added with a tap and settles without errors', async ({ page }) => {
    test.setTimeout(120_000);
    await openPhysics(page);
    const items = ['ball', 'crate', 'brick', 'ice', 'tri', 'plank', 'balloon', 'buddy', 'car', 'rocket', 'bomb', 'domino', 'tower', 'rope', 'seesaw', 'fan', 'tramp'];
    for (const it of items) {
      await sceneMenu(page, 'empty');
      await page.locator('.tool[data-t="add"]').click();
      await page.locator(`.popitem[data-item="${it}"]`).click();
      expect(await Pdbg(page, d => [d.tool, d.item])).toEqual(['add', it]);
      const b = await canvasBox(page);
      await page.mouse.click(b.x + b.width * .4, b.y + b.height * .5);
      const kinds = await Pdbg(page, d => d.world.bodies.map(x => (x.plugin.wb || {}).kind).filter(k => k && k !== 'bound'));
      expect(kinds.length, it).toBeGreaterThan(0);
      await page.waitForTimeout(it === 'bomb' ? 4500 : 1200);
      expect(await Pdbg(page, d => window.Matter.Composite.allBodies(d.world).every(b => Number.isFinite(b.position.x) && Number.isFinite(b.position.y)))).toBe(true);
      if (it === 'bomb') expect(await Pdbg(page, d => d.world.bodies.some(x => (x.plugin.wb || {}).kind === 'bomb'))).toBe(false); // it went off
    }
  });

  test('grab, pin, boom, erase, draw and ramp tools all work with the mouse', async ({ page }) => {
    await openPhysics(page);
    await sceneMenu(page, 'empty');
    const b = await canvasBox(page);
    const P = (fx, fy) => [b.x + b.width * fx, b.y + b.height * fy];
    // ramp: a static line
    await page.locator('.tool[data-t="ramp"]').click();
    await mouseDrag(page, [P(.1, .5), P(.3, .55), P(.5, .6)]);
    expect(await Pdbg(page, d => d.world.bodies.filter(x => x.plugin.wb && x.plugin.wb.kind === 'ink' && x.isStatic).length)).toBe(1);
    // draw: a falling shape
    await page.locator('.tool[data-t="shape"]').click();
    await mouseDrag(page, [P(.7, .2), P(.8, .2), P(.8, .3)]);
    const y0 = await Pdbg(page, d => d.world.bodies.find(x => x.plugin.wb && x.plugin.wb.kind === 'drawn').position.y);
    await page.waitForTimeout(600);
    expect(await Pdbg(page, d => d.world.bodies.find(x => x.plugin.wb && x.plugin.wb.kind === 'drawn').position.y)).toBeGreaterThan(y0 + 20);
    // grab: drag a crate across
    await Pdbg(page, d => { d.spawn('crate', d.W * .5, d.H * .85); });
    await page.waitForTimeout(800);
    const c0 = await Pdbg(page, d => { const c = d.world.bodies.find(x => x.plugin.wb && x.plugin.wb.kind === 'crate'); return [c.position.x / d.W, c.position.y / d.H]; });
    await page.locator('.tool[data-t="grab"]').click();
    await mouseDrag(page, [P(c0[0], c0[1]), P(.6, .5), P(.8, .4)], { steps: 10, delay: 30 });
    const c1 = await Pdbg(page, d => { const c = d.world.bodies.find(x => x.plugin.wb && x.plugin.wb.kind === 'crate'); return [c.position.x / d.W, c.position.y / d.H]; });
    expect(c1[0]).toBeGreaterThan(c0[0] + .15);
    await page.waitForTimeout(1500);
    // pin it in the air: pin then it stays put
    const c2 = await Pdbg(page, d => { const c = d.world.bodies.find(x => x.plugin.wb && x.plugin.wb.kind === 'crate'); return [c.position.x / d.W, c.position.y / d.H]; });
    await page.locator('.tool[data-t="pin"]').click();
    await page.mouse.click(...P(c2[0], c2[1]));
    expect(await Pdbg(page, d => d.pins.length)).toBe(1);
    await page.mouse.click(...P(c2[0], c2[1]));               // tapping the pin removes it
    expect(await Pdbg(page, d => d.pins.length)).toBe(0);
    // boom: things nearby fly away
    const v0 = await Pdbg(page, d => { const c = d.world.bodies.find(x => x.plugin.wb && x.plugin.wb.kind === 'crate'); return Math.hypot(c.velocity.x, c.velocity.y); });
    await page.locator('.tool[data-t="boom"]').click();
    await page.mouse.click(...P(c2[0] - .03, c2[1] + .02));
    await page.waitForTimeout(80);
    const v1 = await Pdbg(page, d => { const c = d.world.bodies.find(x => x.plugin.wb && x.plugin.wb.kind === 'crate'); return Math.hypot(c.velocity.x, c.velocity.y); });
    expect(v1).toBeGreaterThan(v0 + 2);
    // erase: rub out the ramp
    await page.locator('.tool[data-t="erase"]').click();
    await mouseDrag(page, [P(.2, .52), P(.3, .55), P(.4, .58)], { steps: 6, delay: 30 });
    expect(await Pdbg(page, d => d.world.bodies.filter(x => x.plugin.wb && x.plugin.wb.kind === 'ink').length)).toBe(0);
  });

  test('all five puzzles can be solved by drawing ramps, then Go', async ({ page }) => {
    test.setTimeout(120_000);
    await openPhysics(page);
    await sceneMenu(page, 'puzzle');
    for (let lv = 0; lv < 5; lv++) {
      await expect(page.locator('#plv')).toHaveText(`Puzzle ${lv + 1} of 5`);
      for (const r of PUZZLE_RAMPS[lv]) await drawRamp(page, r);
      expect(await Pdbg(page, d => d.world.bodies.filter(x => x.plugin.wb && x.plugin.wb.kind === 'ink' && !x.plugin.wb.fixed).length)).toBe(PUZZLE_RAMPS[lv].length);
      await page.locator('#pgo').click();
      await waitDbg(page, 'physics', d => d.puzzle && d.puzzle.done, { timeout: 15_000 });
      await expect(page.locator('#game .starn')).toHaveText(String(lv + 1));
      await page.locator('#pnext').click();
    }
  });

  test('puzzles: only ramp and erase work, a miss resets the ball, Try again works, and a resize keeps the ramps', async ({ page }) => {
    await openPhysics(page);
    await sceneMenu(page, 'puzzle');
    await page.locator('.tool[data-t="boom"]').click();
    await expect(page.locator('#hint')).toContainText('only draw ramps');
    expect(await Pdbg(page, d => d.tool)).toBe('ramp');
    // no ramp: the ball falls, misses, and comes back by itself
    await page.locator('#pgo').click();
    await waitDbg(page, 'physics', d => d.puzzle.go, { timeout: 2000 });
    await waitDbg(page, 'physics', d => !d.puzzle.go, { timeout: 12_000 });
    expect(await Pdbg(page, d => { const p = d.puzzle; return Math.hypot(p.ball.position.x - p.start.x, p.ball.position.y - p.start.y); })).toBeLessThan(1);
    await page.locator('#pgo').click(); await page.waitForTimeout(300);
    await page.locator('#preset').click();
    expect(await Pdbg(page, d => [d.puzzle.go, d.puzzle.ball.isStatic])).toEqual([false, true]);
    // draw the solution, then rotate the screen: everything is laid out again and still wins
    await drawRamp(page, PUZZLE_RAMPS[0][0]);
    await page.setViewportSize({ width: 1000, height: 1200 });
    await page.waitForTimeout(500);
    const s = await Pdbg(page, d => ({ W: d.W, H: d.H, star: d.puzzle.star, ball: d.puzzle.ball.position, ramps: d.world.bodies.filter(x => x.plugin.wb && x.plugin.wb.kind === 'ink' && !x.plugin.wb.fixed).length }));
    expect(s.ramps).toBe(1);
    expect(s.star.x / s.W).toBeCloseTo(.8, 2); expect(s.star.y / s.H).toBeCloseTo(.9, 2);
    expect(s.ball.x / s.W).toBeCloseTo(.14, 2);
    await page.locator('#pgo').click();
    await waitDbg(page, 'physics', d => d.puzzle && d.puzzle.done, { timeout: 15_000 });
  });

});

test.describe('20 Physics Lab offline start', () => {
  test.use({ serviceWorkers: 'block' });   // so the blocked request really reaches the network layer
  test('if the physics engine cannot load, the child sees a message and Try again really retries', async ({ page }) => {
    test.info().annotations.push({ type: 'allow-errors', description: 'the engine request is blocked on purpose' });
    await page.route('**/matter.min.js', r => r.abort());
    await home(page);
    await page.locator('.tile[data-g="physics"]').click();
    await expect(page.locator('#stage')).toContainText('could not load');
    await page.unroute('**/matter.min.js');
    await page.locator('#retry').click();
    await page.waitForFunction(() => window.Matter && window.WiggleBox.games.physics._debug && document.querySelector('#stage canvas'));
    await page.waitForTimeout(500);
    expect(await Pdbg(page, d => d.world.bodies.length)).toBeGreaterThan(3);
  });
});
