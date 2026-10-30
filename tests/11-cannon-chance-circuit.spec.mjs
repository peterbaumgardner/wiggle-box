// Games 04-06: Cannon Launch, Chance Machine, Circuit Lab.
import { test, expect, home, openGame, dbg, waitDbg, canvasBox, mouseDrag, seedScript } from './helpers.mjs';

/* ---------------- Cannon Launch ---------------- */
const RAD = d => d * Math.PI / 180;
const ref = (th, v, g) => ({ vx: v * Math.cos(RAD(th)), vy: v * Math.sin(RAD(th)), R: v * v * Math.sin(RAD(2 * th)) / g, H: (v * Math.sin(RAD(th))) ** 2 / (2 * g), T: 2 * v * Math.sin(RAD(th)) / g });
const fmt = (v, d) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('en-US', { maximumFractionDigits: d });

/* best aim on the game's own grid (whole degrees, half m/s) for a target, clearing a wall if there is one */
function aim(t, wall, g) {
  let best = null;
  for (let th = 5; th <= 85; th++) for (let v = 5; v <= 40; v += .5) {
    const r = RAD(th), yAt = x => x * Math.tan(r) - g * x * x / (2 * v * v * Math.cos(r) ** 2);
    if (wall && yAt(wall.x) < wall.h + 1.2) continue;
    const cy = t.y + (t.kind === 'castle' ? t.r * .8 : 0);
    const err = Math.abs(yAt(t.x) - cy);
    if (!best || err < best.err) best = { th, v, err };
  }
  return best;
}

test.describe('04 Cannon Launch', () => {
  test('the panel formulas match independent projectile math on every planet', async ({ page }) => {
    await home(page); await openGame(page, 'cannon');
    const G = { earth: 9.8, moon: 1.6, mars: 3.7, jup: 24.8 };
    for (const [pl, g] of Object.entries(G)) {
      await page.locator('#plm').click();
      await page.locator(`.pop [data-pl="${pl}"]`).click();
      for (const [th, v] of [[45, 20], [30, 12.5], [70, 33], [15, 40]]) {
        await dbg(page, 'cannon', (d, G, W, [th, v]) => { d.set(th, v); return 1; }, [th, v]);
        const r = ref(th, v, g), info = page.locator('#info');
        await expect(info).toContainText(`= ${fmt(r.vx, 1)} m/s`);
        await expect(info).toContainText(`= ${fmt(r.vy, 1)} m/s`);
        await expect(info).toContainText(`= ${fmt(r.R, 1)} m`);
        await expect(info).toContainText(`= ${fmt(r.H, 1)} m`);
        await expect(info).toContainText(`= ${fmt(r.T, 2)} s`);
        await expect(info).toContainText(`gravity g = ${g} m/s²`);
      }
    }
  });

  test('a fired ball follows the parabola exactly and lands at R (unless it hits something)', async ({ page }) => {
    await home(page); await openGame(page, 'cannon');
    for (const [th, v] of [[60, 18], [25, 30], [80, 12]]) {
      await dbg(page, 'cannon', (d, G, W, [th, v]) => { d.set(th, v); return 1; }, [th, v]);
      await page.locator('#fire').click();
      await waitDbg(page, 'cannon', d => d.shot && d.shot.done, { timeout: 15_000 });
      const s = await dbg(page, 'cannon', d => ({ pts: d.shot.pts, x: d.shot.x, y: d.shot.y, hit: d.target.hit, wall: d.wall }));
      const g = 9.8, r = RAD(th);
      for (const [x, y] of s.pts) expect(Math.abs(y - (x * Math.tan(r) - g * x * x / (2 * v * v * Math.cos(r) ** 2)))).toBeLessThan(1e-6);
      const R = v * v * Math.sin(2 * r) / g, H = (v * Math.sin(r)) ** 2 / (2 * g);
      if (!s.hit) { expect(Math.abs(s.x - R)).toBeLessThan(1e-6); expect(s.y).toBe(0); }
      expect(Math.max(...s.pts.map(p => p[1]))).toBeLessThanOrEqual(H + 1e-9);
      expect(Math.max(...s.pts.map(p => p[1]))).toBeGreaterThan(H * .97);
      if (s.hit) break;
    }
  });

  test('aiming by dragging: the cannon points at the finger, a longer pull is faster, letting go fires', async ({ page }) => {
    await home(page); await openGame(page, 'cannon');
    const box = await canvasBox(page);
    const ox = box.x + 40, oy = box.y + box.height - 34;
    await mouseDrag(page, [[ox + 200, oy - 200], [ox + 220, oy - 220], [ox + 260, oy - 260]], { steps: 6 });
    let s = await dbg(page, 'cannon', d => d.shot && { th: d.shot.th, v: d.shot.v });
    expect(s.th).toBe(45);
    const v1 = s.v;
    await waitDbg(page, 'cannon', d => d.shot.done, { timeout: 15_000 });
    await mouseDrag(page, [[ox + 100, oy - 30], [ox + 150, oy - 40], [ox + 200, oy - 55]], { steps: 6 });
    s = await dbg(page, 'cannon', d => ({ th: d.shot.th, v: d.shot.v }));
    expect(s.th).toBe(15);
    expect(s.v).toBeLessThan(v1);
    // keyboard aiming
    await waitDbg(page, 'cannon', d => d.shot.done, { timeout: 15_000 });
    await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowRight');
    await expect(page.locator('#info')).toContainText('cos θ');
  });

  test('levels 1-12 can all be won by aiming with the formula; the level advances each time', async ({ page }) => {
    test.setTimeout(240_000);
    await home(page); await openGame(page, 'cannon');
    for (let lv = 0; lv < 12; lv++) {
      await waitDbg(page, 'cannon', (d, G, W, lv) => d.lvl === lv && d.target && !d.target.hit, { arg: lv, timeout: 20_000 });
      const st = await dbg(page, 'cannon', d => ({ t: d.target, wall: d.wall, g: d.grav() }));
      const a = aim(st.t, st.wall, st.g);
      expect(a, `level ${lv + 1} has a reachable shot`).toBeTruthy();
      await dbg(page, 'cannon', (d, G, W, [th, v]) => { d.set(th, v); return 1; }, [a.th, a.v]);
      await page.locator('#fire').click();
      // flights run in game time; on a busy machine game time runs slower than the wall clock, so wait generously
      await waitDbg(page, 'cannon', d => d.shot && d.shot.done, { timeout: 45_000 });
      expect(await dbg(page, 'cannon', d => d.target.hit), `hit on level ${lv + 1}`).toBe(true);
      await waitDbg(page, 'cannon', (d, G, W, lv) => d.lvl === lv + 1, { arg: lv, timeout: 20_000 });
    }
  });

  test('a ball on a slow (20 fps) screen still hits the wall instead of passing through it', async ({ page }) => {
    await page.addInitScript(() => { window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 50); window.cancelAnimationFrame = id => clearTimeout(id); });
    await home(page); await openGame(page, 'cannon');
    for (let i = 0; i < 6; i++) await page.locator('#skip').click();          // level 7: castle behind a wall
    const w = await dbg(page, 'cannon', d => d.wall);
    expect(w).toBeTruthy();
    // a fast, flat shot whose path crosses the wall well below its top
    let pick = null;
    for (let th = 5; th <= 40 && !pick; th++) for (let v = 40; v >= 20 && !pick; v -= .5) { const r = RAD(th), y = w.x * Math.tan(r) - 9.8 * w.x ** 2 / (2 * v * v * Math.cos(r) ** 2); if (y > 1 && y < w.h - 2) pick = [th, v]; }
    await dbg(page, 'cannon', (d, G, W, [th, v]) => { d.set(th, v); return 1; }, pick);
    await page.locator('#fire').click();
    await waitDbg(page, 'cannon', d => d.shot && d.shot.done, { timeout: 15_000 });
    const s = await dbg(page, 'cannon', d => ({ x: d.shot.x, y: d.shot.y }));
    expect(Math.abs(s.x - w.x)).toBeLessThan(0.7);
    await expect(page.locator('.simhint')).toContainText('Bonk');
  });

  test('path toggle, next level and the planet keys', async ({ page }) => {
    await home(page); await openGame(page, 'cannon');
    await page.locator('#path').click();
    await expect(page.locator('#path')).toContainText('off');
    await page.locator('#skip').click();
    expect(await dbg(page, 'cannon', d => d.lvl)).toBe(1);
    await page.keyboard.press('2');
    expect(await dbg(page, 'cannon', d => d.grav())).toBe(1.6);
    await expect(page.locator('#plm')).toContainText('Moon');
  });
});

/* ---------------- Chance Machine ---------------- */
const binom = (n, k, p) => { let c = 1; for (let i = 1; i <= k; i++) c = c * (n - k + i) / i; return c * p ** k * (1 - p) ** (n - k); };
/* chi-square p-value (Wilson-Hilferty), merging bins whose expected count is under 5 */
function chiP(obs, exp) {
  const O = [], E = []; let o = 0, e = 0;
  for (let i = 0; i < obs.length; i++) { o += obs[i]; e += exp[i]; if (e >= 5) { O.push(o); E.push(e); o = 0; e = 0; } }
  if (e > 0) { O[O.length - 1] += o; E[E.length - 1] += e; }
  const x = O.reduce((s, oi, i) => s + (oi - E[i]) ** 2 / E[i], 0), k = O.length - 1;
  const z = (Math.cbrt(x / k) - (1 - 2 / (9 * k))) / Math.sqrt(2 / (9 * k));
  const p = 0.5 * (1 - erf(z / Math.SQRT2));
  return { x, k, p };
}
function erf(x) { const t = 1 / (1 + .3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }

test.describe('05 Chance Machine', () => {
  test.use({ seed: 20261029 });

  test('1,000 balls make a binomial bell curve; average and chart agree', async ({ page }) => {
    test.setTimeout(120_000);
    await home(page); await openGame(page, 'chance');
    for (let i = 0; i < 5; i++) await page.locator('#ex [data-n="200"]').click();
    await waitDbg(page, 'chance', d => d.total === 1000, { timeout: 90_000 });
    const bins = await dbg(page, 'chance', d => d.bins.slice());
    expect(bins.reduce((a, b) => a + b, 0)).toBe(1000);
    const exp = bins.map((_, k) => 1000 * binom(10, k, .5));
    const c = chiP(bins, exp);
    expect(c.p, `chi-square ${c.x.toFixed(1)} on ${c.k} df`).toBeGreaterThan(0.001);
    const mean = bins.reduce((s, b, k) => s + b * k, 0) / 1000;
    expect(Math.abs(mean - 5)).toBeLessThan(0.25);
    await expect(page.locator('#pn')).toContainText(`${fmt(mean, 2)}`);
    await expect(page.locator('#pn')).toContainText('C(10,5) = 252');
  });

  test('sliding sideways tilts the machine; a tilted machine averages 10·p', async ({ page }) => {
    test.setTimeout(120_000);
    await home(page); await openGame(page, 'chance');
    const box = await canvasBox(page);
    // slide right: p = 0.5 + dx/(0.7 W), rounded to 0.05
    const dx = box.width * .7 * .2;
    await mouseDrag(page, [[box.x + box.width / 2, box.y + box.height * .3], [box.x + box.width / 2 + dx, box.y + box.height * .3]], { steps: 10 });
    await expect(page.locator('#pn')).toContainText('10 × p = 7');
    for (let i = 0; i < 5; i++) await page.locator('#ex [data-n="200"]').click();
    await waitDbg(page, 'chance', d => d.total === 1000, { timeout: 90_000 });
    const bins = await dbg(page, 'chance', d => d.bins.slice());
    const c = chiP(bins, bins.map((_, k) => 1000 * binom(10, k, .7)));
    expect(c.p).toBeGreaterThan(0.001);
    // a tap drops exactly one ball
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * .3);
    await waitDbg(page, 'chance', d => d.total === 1001, { timeout: 10_000 });
    await page.locator('#ex [data-n="0"]').click();
    expect(await dbg(page, 'chance', d => d.total)).toBe(0);
  });

  test('dice: 1, 2 and 3 dice follow the exact sum distributions', async ({ page }) => {
    test.setTimeout(90_000);
    await home(page); await openGame(page, 'chance');
    await page.locator('[data-cm="dice"]').click();
    const ways = n => { let w = { 0: 1 }; for (let d = 0; d < n; d++) { const nw = {}; for (const s in w) for (let f = 1; f <= 6; f++) nw[+s + f] = (nw[+s + f] || 0) + w[s]; w = nw; } return w; };
    for (const n of [1, 2, 3]) {
      await page.locator(`[data-dn="${n}"]`).click();
      for (let i = 0; i < 3; i++) await page.locator('#ex [data-n="1000"]').click();
      expect(await dbg(page, 'chance', d => d.rolls)).toBe(3000);
      const big = await page.locator('#pn .fx.big').evaluate(e => e.textContent.replace(/\s+/g, ' '));
      if (n === 1) expect(big).toContain('Every face is a tie');
      if (n === 2) expect(big).toMatch(/Most likely sum\s*7/);
      if (n === 3) expect(big).toMatch(/10 and 11/);
      // the bars are drawn from this tally; compare it with the exact number of ways to roll each sum
      const w = ways(n), tot = 6 ** n, sums = await dbg(page, 'chance', d => ({ ...d.sums }));
      const keys = Object.keys(w).map(Number).sort((a, b) => a - b);
      expect(Object.keys(sums).map(Number).every(k => k >= n && k <= 6 * n)).toBe(true);
      const c = chiP(keys.map(k => sums[k] || 0), keys.map(k => 3000 * w[k] / tot));
      expect(c.p, `${n} dice chi-square ${c.x.toFixed(1)} on ${c.k} df`).toBeGreaterThan(0.001);
      await page.locator('#ex [data-n="0"]').click();
      expect(await dbg(page, 'chance', d => d.rolls)).toBe(0);
    }
  });

  test('coins: 1,000 flips land near 50% heads; streaks and clear work', async ({ page }) => {
    await home(page); await openGame(page, 'chance');
    await page.locator('[data-cm="coin"]').click();
    await page.locator('#ex [data-n="1000"]').click();
    const txt = await page.locator('#pn .fx.big').evaluate(e => e.textContent);
    const pct = parseFloat(txt.match(/([\d.]+)%/)[1]);
    expect(Math.abs(pct - 50)).toBeLessThan(5);
    const c = await dbg(page, 'chance', d => d.coins);
    expect(c.n).toBe(1000);
    expect(pct).toBeCloseTo(c.h / c.n * 100, 1);
    expect(c.best).toBeGreaterThanOrEqual(5);   // a 1,000-flip run almost surely has a streak of 5+
    expect(c.best).toBeLessThan(30);
    await expect(page.locator('#pn')).toContainText('in a row');
    await page.locator('#ex [data-n="0"]').click();
    await expect(page.locator('#pn .fx.big')).toContainText('0%');
    await page.evaluate(() => document.activeElement.blur()); // keyboard: Space flips once (when no button has focus)
    await page.keyboard.press(' ');
    expect(await dbg(page, 'chance', d => d.coins.n)).toBeGreaterThan(0);
  });
});

/* ---------------- Circuit Lab ---------------- */
/* within display rounding (2 decimals) plus 1% for the 0.001 Ω wires the model includes */
const near = (got, want) => expect(Math.abs(got - want), `${got} vs ${want}`).toBeLessThanOrEqual(0.006 + Math.abs(want) * 0.01);
async function circuitGeom(page) { const box = await canvasBox(page); const g = await dbg(page, 'circuit', d => d.geom()); return { box, ...g, P: (i, j) => [box.x + g.ox + i * g.sp, box.y + g.oy + j * g.sp] }; }
async function wire(page, C, tool, a, b) {
  await page.locator(`[data-ct="${tool}"]`).click();
  await mouseDrag(page, [C.P(...a), C.P(...b)], { steps: 8 });
  await page.waitForTimeout(60);
}
async function meter(page, C, a, b) {
  await page.locator('[data-ct="meter"]').click();
  const p = C.P(...a), q = C.P(...b);
  await page.mouse.click((p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  const t = await page.locator('#sel').evaluate(e => e.textContent.replace(/\s+/g, ' '));
  const num = re => { const m = t.match(re); return m ? parseFloat(m[1]) : null; };
  return { V: num(/V = ([\d.]+) volts/), I: num(/I = ([\d.]+) amps/), R: num(/R = ([\d.]+) ohms/), P: num(/= ([\d.]+) watts/), t };
}

test.describe('06 Circuit Lab', () => {
  test('closing the starter circuit lights the bulb; the meter agrees with Ohm\'s law', async ({ page }) => {
    await home(page); await openGame(page, 'circuit');
    const C = await circuitGeom(page);
    await wire(page, C, 'wire', [2, 2], [3, 2]);
    expect(await dbg(page, 'circuit', d => d.sol.bulbs[0].lit)).toBe(true);
    expect(await dbg(page, 'circuit', d => [...d.done])).toContain('one');
    const m = await meter(page, C, [2, 1], [3, 1]);
    const I = 3 / (6 + .15);                      // 3 V battery, 0.15 Ω inside it, 6 Ω bulb, wires ~0
    near(m.I, I); near(m.V, I * 6); near(m.P, I * I * 6);
    expect(m.R).toBe(6);
    expect(m.t).toContain(`check: ${m.I.toFixed(2)} × 6 = `);
  });

  test('series, parallel, three bulbs, fan and switch challenges can all be completed with real drags', async ({ page }) => {
    test.setTimeout(120_000);
    await home(page); await openGame(page, 'circuit');
    const C = await circuitGeom(page);
    await page.locator('#clr').click();
    // series: battery on the left, two bulbs in one loop
    await wire(page, C, 'bat', [0, 2], [0, 1]);
    await wire(page, C, 'wire', [0, 1], [1, 1]);
    await wire(page, C, 'bulb', [1, 1], [2, 1]);
    await wire(page, C, 'bulb', [2, 1], [3, 1]);
    await wire(page, C, 'wire', [3, 1], [3, 2]);
    await wire(page, C, 'wire', [3, 2], [0, 2]);
    let r = await dbg(page, 'circuit', d => ({ done: [...d.done], I: d.sol.bulbs.map(b => b.I) }));
    expect(r.done).toContain('series'); expect(r.done).not.toContain('par');
    for (const i of r.I) near(Math.abs(i), 3 / 12.15);           // R = R1 + R2
    // parallel: clear, battery and two bulbs side by side
    await page.locator('#clr').click();
    await wire(page, C, 'bat', [0, 2], [0, 1]);
    await wire(page, C, 'wire', [0, 1], [1, 1]); await wire(page, C, 'wire', [1, 1], [2, 1]);
    await wire(page, C, 'wire', [0, 2], [1, 2]); await wire(page, C, 'wire', [1, 2], [2, 2]);
    await wire(page, C, 'bulb', [1, 1], [1, 2]); await wire(page, C, 'bulb', [2, 1], [2, 2]);
    r = await dbg(page, 'circuit', d => ({ done: [...d.done], I: d.sol.bulbs.map(b => Math.abs(b.I)), bat: Math.abs(d.sol.bats[0].I) }));
    expect(r.done).toContain('par');
    const Itot = 3 / (3 + .15);                                                   // 1/R = 1/6 + 1/6
    near(r.bat, Itot);
    for (const i of r.I) near(i, Itot / 2);
    // three bulbs: add a third in parallel
    await wire(page, C, 'wire', [2, 1], [3, 1]); await wire(page, C, 'wire', [2, 2], [3, 2]);
    await wire(page, C, 'bulb', [3, 1], [3, 2]);
    expect(await dbg(page, 'circuit', d => [...d.done])).toContain('three');
    // fan
    await page.locator('#clr').click();
    await wire(page, C, 'bat', [0, 2], [0, 1]); await wire(page, C, 'wire', [0, 1], [1, 1]); await wire(page, C, 'motor', [1, 1], [1, 2]); await wire(page, C, 'wire', [0, 2], [1, 2]);
    expect(await dbg(page, 'circuit', d => [...d.done])).toContain('fan');
    near(await dbg(page, 'circuit', d => Math.abs(d.sol.motors[0].I)), 3 / 4.15);
    // switch: a switch in the bulb loop, then tap it open
    await page.locator('#clr').click();
    await wire(page, C, 'bat', [0, 2], [0, 1]); await wire(page, C, 'sw', [0, 1], [1, 1]); await wire(page, C, 'bulb', [1, 1], [1, 2]); await wire(page, C, 'wire', [0, 2], [1, 2]);
    expect(await dbg(page, 'circuit', d => d.sol.bulbs[0].lit)).toBe(true);
    await page.locator('[data-ct="wire"]').click();
    const p = C.P(0, 1), q = C.P(1, 1);
    await page.mouse.click((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + 2);
    expect(await dbg(page, 'circuit', d => d.sol.bulbs[0].lit)).toBe(false);
    expect(await dbg(page, 'circuit', d => [...d.done])).toContain('switch');
    const m = await meter(page, C, [1, 1], [1, 2]);
    expect(m.I).toBe(0);
    await expect(page.locator('#tasks')).not.toContainText('⬜');
  });

  test('battery and resistor values step when tapped again; Ohm\'s law holds with a resistor', async ({ page }) => {
    await home(page); await openGame(page, 'circuit');
    const C = await circuitGeom(page);
    await page.locator('#clr').click();
    await wire(page, C, 'bat', [0, 2], [0, 1]); await wire(page, C, 'res', [0, 1], [1, 1]); await wire(page, C, 'bulb', [1, 1], [1, 2]); await wire(page, C, 'wire', [0, 2], [1, 2]);
    let m = await meter(page, C, [0, 1], [1, 1]);
    expect(m.R).toBe(10);
    near(m.I, 3 / 16.15);
    expect(Math.abs(m.V - m.I * 10)).toBeLessThanOrEqual(0.005 * 10 + 0.006);  // V = I·R up to rounding of I
    await page.mouse.click(...(() => { const p = C.P(0, 1), q = C.P(1, 1); return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; })()); // tap again: 20 Ω
    await expect(page.locator('#sel')).toContainText('20 ohms');   // tapping the selected resistor stepped 10 -> 20 Ω
    const b = C.P(0, 1), b2 = C.P(0, 2);
    await page.mouse.click((b[0] + b2[0]) / 2, (b[1] + b2[1]) / 2); // select battery
    await page.mouse.click((b[0] + b2[0]) / 2, (b[1] + b2[1]) / 2); // bump to 4.5 V
    expect(await dbg(page, 'circuit', d => d.sol.bats[0].V)).toBe(4.5);
    near(await dbg(page, 'circuit', d => Math.abs(d.sol.bulbs[0].I)), 4.5 / 26.15);
  });

  test('short circuits warn, too much power pops a bulb, broken and open circuits read zero, nothing shows NaN', async ({ page }) => {
    await home(page); await openGame(page, 'circuit');
    const C = await circuitGeom(page);
    await page.locator('#clr').click();
    await wire(page, C, 'bat', [0, 2], [0, 1]); await wire(page, C, 'wire', [0, 1], [1, 1]); await wire(page, C, 'wire', [1, 1], [1, 2]); await wire(page, C, 'wire', [0, 2], [1, 2]);
    expect(await dbg(page, 'circuit', d => d.sol.short)).toBe(true);
    await expect(page.locator('.simhint')).toContainText('Short circuit', { timeout: 4000 });
    await page.locator('#clr').click();
    await wire(page, C, 'bat', [0, 2], [0, 1]);
    const b = C.P(0, 1), b2 = C.P(0, 2), mid = [(b[0] + b2[0]) / 2, (b[1] + b2[1]) / 2];
    for (let i = 0; i < 4; i++) await page.mouse.click(...mid);  // 3 -> 12 V (selected after placing, so 3 taps step 3 times; 4th wraps)
    await dbg(page, 'circuit', (d, G, W) => { const [k, c] = [...d.edges].find(([, c]) => c.kind === 'bat'); c.V = 12; d.solve(); return 1; });
    await wire(page, C, 'wire', [0, 1], [1, 1]); await wire(page, C, 'bulb', [1, 1], [1, 2]); await wire(page, C, 'wire', [0, 2], [1, 2]);
    expect(await dbg(page, 'circuit', d => d.sol.bulbs[0].broken)).toBe(true);
    await expect(page.locator('.simhint')).toContainText('Pop');
    let m = await meter(page, C, [1, 1], [1, 2]);
    expect(m.t).toContain('burned out');
    expect(m.I).toBe(0);
    expect(m.t).not.toMatch(/NaN|Infinity|∞/);
    await page.locator('[data-ct="erase"]').click();
    const w1 = C.P(0, 1), w2 = C.P(1, 1);
    await page.mouse.click((w1[0] + w2[0]) / 2, (w1[1] + w2[1]) / 2);
    expect(await dbg(page, 'circuit', d => d.edges.size)).toBe(3);
    m = await meter(page, C, [0, 1], [0, 2]);
    expect(m.t).not.toMatch(/NaN|Infinity/);
  });
});
