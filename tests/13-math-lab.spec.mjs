// Games 14-18: Number Forge, Potion Lab, Shape Lab, Graph Rider, Math Art.
import { test, expect, home, openGame, dbg, waitDbg, canvasBox, mouseDrag } from './helpers.mjs';

/* ---------------- Number Forge ---------------- */
const OPF = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => b && a % b === 0 ? a / b : null, '^': (a, b) => b <= 6 && Math.abs(a) <= 12 ? a ** b : null };
async function playForge(page) {
  const st = await dbg(page, 'forge', d => ({ nums: d.cards.map(c => c.v), target: d.target, ops: d.opsFor() }));
  const sol = await dbg(page, 'forge', (d, G, W, s) => { const r = d.solve(s.nums, s.target, s.ops, true); const strip = n => n.leaf ? { v: n.v, leaf: true } : { v: n.v, op: n.op, a: strip(n.a), b: strip(n.b) }; return r && strip(r); }, st);
  expect(sol, `${st.nums} -> ${st.target} is solvable`).toBeTruthy();
  const produce = async n => {
    if (n.leaf) return;
    await produce(n.a); await produce(n.b);
    const vals = await dbg(page, 'forge', d => d.cards.map(c => c.v));
    if (vals.includes(st.target) && vals.length < st.nums.length) return;   // reached the target early: that already wins
    const i = vals.indexOf(n.a.v), j = vals.findIndex((v, k) => v === n.b.v && k !== i);
    await page.locator(`#cards .fcard[data-i="${i}"]`).click();
    await page.locator(`#ops .fop[data-o="${n.op}"]`).click();
    await page.locator(`#cards .fcard[data-i="${j}"]`).click();
  };
  await produce(sol);
  return st;
}
/* evaluate the "all in one line" text with ordinary precedence and right-associative ^ */
function evalExpr(s) { return Function(`return (${s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\^/g, '**')})`)(); }

test.describe('14 Number Forge', () => {
  test('fifteen climbing levels: every puzzle is solvable with all its cards, the one-line formula is right', async ({ page }) => {
    test.setTimeout(240_000);
    await home(page); await openGame(page, 'forge');
    for (let lv = 0; lv < 15; lv++) {
      await expect(page.locator('#lv')).toHaveText(`Level ${lv + 1}`, { timeout: 6000 });
      const st = await playForge(page);
      await expect(page.locator('#one .num')).toContainText(`= ${st.target}`);
      const line = (await page.locator('#one .num').textContent()).split('=')[0].trim();
      expect(evalExpr(line)).toBe(st.target);                     // brackets placed correctly
      await expect(page.locator('#lv')).toHaveText(`Level ${lv + 2}`, { timeout: 6000 });
    }
  });

  test('Make 24: every deal can make 24, and playing the solution wins', async ({ page }) => {
    test.setTimeout(120_000);
    await home(page); await openGame(page, 'forge');
    await page.locator('[data-fm="24"]').click();
    for (let k = 0; k < 6; k++) {
      await expect(page.locator('#tg')).toHaveText('24');
      const before = await dbg(page, 'forge', d => d.cards.map(c => c.v).join(','));
      await playForge(page);
      await page.waitForFunction(b => window.WiggleBox.games.forge._debug.cards.map(c => c.v).join(',') !== b && window.WiggleBox.games.forge._debug.cards.length === 4, before, { timeout: 6000 });
    }
  });

  test('uneven division, negative answers and huge powers are refused with a hint; Undo, Start over and Hint work', async ({ page }) => {
    await home(page); await openGame(page, 'forge');
    for (let i = 0; i < 12; i++) { await playForge(page); await page.waitForTimeout(2900); } // reach the ÷ and ^ levels
    await expect(page.locator('#ops .fop[data-o="^"]')).toHaveCount(1);
    const cards = await dbg(page, 'forge', d => d.cards.map(c => c.v));
    // find a pair that does not divide evenly, and the bigger-minus-smaller pair in the wrong order
    let pair = null; for (let i = 0; i < cards.length && !pair; i++) for (let j = 0; j < cards.length && !pair; j++) if (i !== j && cards[i] % cards[j] !== 0) pair = [i, j];
    if (pair) {
      await page.locator(`#cards .fcard[data-i="${pair[0]}"]`).click(); await page.locator('#ops .fop[data-o="÷"]').click(); await page.locator(`#cards .fcard[data-i="${pair[1]}"]`).click();
      await expect(page.locator('.simhint')).toContainText('does not split evenly');
    }
    let neg = null; for (let i = 0; i < cards.length && !neg; i++) for (let j = 0; j < cards.length && !neg; j++) if (i !== j && cards[i] < cards[j]) neg = [i, j];
    await page.locator(`#cards .fcard[data-i="${neg[0]}"]`).click(); await page.locator('#ops .fop[data-o="−"]').click(); await page.locator(`#cards .fcard[data-i="${neg[1]}"]`).click();
    await expect(page.locator('.simhint')).toContainText('No negative numbers');
    expect(await dbg(page, 'forge', d => d.cards.length)).toBe(cards.length);
    await page.locator(`#cards .fcard[data-i="0"]`).click(); await page.locator('#ops .fop[data-o="+"]').click(); await page.locator(`#cards .fcard[data-i="1"]`).click();
    expect(await dbg(page, 'forge', d => d.cards.length)).toBe(cards.length - 1);
    await page.locator('#undo').click();
    expect(await dbg(page, 'forge', d => d.cards.map(c => c.v))).toEqual(cards);
    await page.locator(`#cards .fcard[data-i="0"]`).click(); await page.locator('#ops .fop[data-o="×"]').click(); await page.locator(`#cards .fcard[data-i="1"]`).click();
    await page.locator('#reset').click();
    expect(await dbg(page, 'forge', d => d.cards.map(c => c.v))).toEqual(cards);
    await page.locator('#hintb').click();
    const h = await page.locator('.simhint').textContent();
    const m = h.match(/Try (\d+) (\S) (\d+)/);
    expect(m).toBeTruthy();
    expect(OPF[m[2]](+m[1], +m[3])).not.toBeNull();
  });
});

/* ---------------- Potion Lab ---------------- */
const gcd = (a, b) => b ? gcd(b, a % b) : a;
/* fewest pours (each bottle any number of times) that add up to the target, in 24ths */
function pourPlan(bottles, target) {
  const best = Array(target + 1).fill(null); best[0] = [];
  for (let s = 1; s <= target; s++) for (const b of bottles) if (b <= s && best[s - b] && (!best[s] || best[s - b].length + 1 < best[s].length)) best[s] = [...best[s - b], b];
  return best[target];
}
test.describe('15 Potion Lab', () => {
  test('twelve levels: the target can always be poured exactly by tapping bottles; the beaker shows the right sums', async ({ page }) => {
    test.setTimeout(180_000);
    await home(page); await openGame(page, 'potion');
    const box = await canvasBox(page);
    for (let lv = 0; lv < 12; lv++) {
      await expect(page.locator('#lv')).toHaveText(`Level ${lv + 1}`, { timeout: 6000 });
      const st = await dbg(page, 'potion', d => ({ target: d.target, bottles: d.bottles, cap: d.cap, U: d.U }));
      expect(st.target).toBeGreaterThan(0);
      expect(st.target).toBeLessThanOrEqual(st.cap);
      const plan = pourPlan(st.bottles, st.target);
      expect(plan, `level ${lv + 1}: ${st.target}/24 from ${st.bottles}`).toBeTruthy();
      for (const b of plan) {
        const h = await dbg(page, 'potion', (d, G, W, b) => d.hits.find(o => o.n === b), b);
        await page.mouse.click(box.x + h.x, box.y + h.y);
        await page.waitForTimeout(60);
      }
      // the panel: sum as a fraction in lowest terms, the same as a decimal and a percent
      const g = gcd(st.target, 24), frac = [st.target / g, 24 / g];
      const alt = await page.locator('#alt').textContent();
      expect(alt).toContain(String(Math.round(st.target / 24 * 1000) / 1000).replace(/^0\./, '0.'));
      expect(alt).toContain(`${Math.round(st.target / 24 * 1000) / 10}%`);
      const eqv = await page.locator('#eqv').textContent();
      if (st.target <= 24 && frac[1] > 1) expect(eqv.replace(/\s/g, '')).toContain(`${frac[0]}${frac[1]}`);
      await expect(page.locator('#sum')).toContainText('✅');
      await expect(page.locator('#lv')).toHaveText(`Level ${lv + 2}`, { timeout: 6000 });
    }
  });

  test('too much warns, Undo and Empty fix it', async ({ page }) => {
    await home(page); await openGame(page, 'potion');
    const box = await canvasBox(page);
    await page.waitForTimeout(300);
    const st = await dbg(page, 'potion', d => ({ target: d.target, hits: d.hits }));
    // find a level with a bottle that jumps past the line without ever landing on it
    let pick = null;
    for (let k = 0; k < 10 && !pick; k++) {
      const s2 = await dbg(page, 'potion', d => ({ target: d.target, hits: d.hits }));
      pick = s2.hits.find(h => s2.target % h.n !== 0) && { t: s2.target, h: s2.hits.find(h => s2.target % h.n !== 0) };
      if (!pick) { await page.locator('#next').click(); await page.waitForTimeout(200); }
    }
    const big = pick.h; st.target = pick.t;
    let poured = 0;
    while (poured <= st.target) { await page.mouse.click(box.x + big.x, box.y + big.y); poured += big.n; }
    await expect(page.locator('#sum')).toContainText('too much');
    await expect(page.locator('.simhint')).toContainText('Too much', { timeout: 2000 });
    await page.locator('#undo').click();
    expect(await dbg(page, 'potion', d => d.pours.length)).toBe(Math.round(poured / big.n) - 1);
    await page.locator('#empty').click();
    expect(await dbg(page, 'potion', d => d.pours.length)).toBe(0);
    await expect(page.locator('#sum')).toContainText('nothing yet');
  });
});

/* ---------------- Shape Lab ---------------- */
const shoelace = P => Math.abs(P.reduce((s, [a, b], i) => { const [c, d] = P[(i + 1) % P.length]; return s + a * d - b * c; }, 0)) / 2;
const perim = P => P.reduce((s, p, i) => s + Math.hypot(P[(i + 1) % P.length][0] - p[0], P[(i + 1) % P.length][1] - p[1]), 0);
async function dragCorner(page, i, to) {
  const box = await canvasBox(page);
  const from = await dbg(page, 'geo', (d, G, W, i) => d.toPx(...d.poly[i]), i);
  const dest = await dbg(page, 'geo', (d, G, W, to) => d.toPx(...to), to);
  await mouseDrag(page, [[box.x + from[0], box.y + from[1]], [box.x + dest[0], box.y + dest[1]]], { steps: 12 });
}
async function setPoly(page, pts) {
  const n = await dbg(page, 'geo', d => d.poly.length);
  for (let k = n; k < pts.length; k++) await page.locator('#addc').click();
  for (let k = pts.length; k < n; k++) await page.locator('#subc').click();
  // first park every corner in its own spot along the top edge, so no two corners are ever on top of each other
  for (let i = 0; i < pts.length; i++) await dragCorner(page, i, [-6 + i * 1.5, 5.5]);
  for (let i = 0; i < pts.length; i++) await dragCorner(page, i, pts[i]);
  expect(await dbg(page, 'geo', d => d.poly.map(p => p.map(v => v + 0)))).toEqual(pts);
}
test.describe('16 Shape Lab', () => {
  const SHAPES = [
    ['Square', [[-2, -2], [2, -2], [2, 2], [-2, 2]]], ['Rectangle', [[-3, -1], [3, -1], [3, 2], [-3, 2]]], ['Rhombus', [[0, -3], [2, 0], [0, 3], [-2, 0]]],
    ['Parallelogram', [[-3, -1], [2, -1], [3, 2], [-2, 2]]], ['Trapezoid', [[-3, -2], [3, -2], [1, 2], [-1, 2]]], ['Kite', [[0, -3], [2, 0], [0, 1], [-2, 0]]],
    ['Right triangle', [[-2, -2], [2, -2], [-2, 1]]], ['Right isosceles triangle', [[-2, -2], [2, -2], [-2, 2]]], ['Isosceles triangle', [[-2, -2], [2, -2], [0, 3]]],
    ['Scalene triangle', [[-3, -2], [2, -1], [0, 3]]], ['Pentagon', [[-2, -2], [2, -2], [3, 1], [0, 3], [-3, 1]]], ['Hexagon', [[-2, -2], [2, -2], [3, 0], [2, 2], [-2, 2], [-3, 0]]],
  ];
  test('dragging corners: names, area, perimeter and the angle sum match independent geometry', async ({ page }) => {
    test.setTimeout(180_000);
    await home(page); await openGame(page, 'geo');
    for (const [name, pts] of SHAPES) {
      await setPoly(page, pts);
      const pn = page.locator('#pn');
      await expect(pn.locator('.fx.big')).toContainText(name);
      await expect(pn).toContainText(`${Math.round(shoelace(pts) * 100) / 100}`);
      await expect(pn).toContainText(`${Math.round(perim(pts) * 100) / 100}`);
      await expect(pn).toContainText(`= ${(pts.length - 2) * 180}°`);
      const sum = (await pn.locator('.fx').nth(1).locator('.note').textContent()).match(/= (\d+)°/)[1];
      expect(+sum).toBe((pts.length - 2) * 180);
    }
    // a crossed polygon is called tangled, not given a name
    await setPoly(page, [[-2, -2], [2, 2], [2, -2], [-2, 2]]);
    await expect(page.locator('#pn .fx.big')).toContainText('Tangled');
  });

  test('"Make it perfect" gives regular polygons for 3 to 8 corners', async ({ page }) => {
    await home(page); await openGame(page, 'geo');
    for (let n = 3; n <= 8; n++) {
      const cur = await dbg(page, 'geo', d => d.poly.length);
      for (let k = cur; k < n; k++) await page.locator('#addc').click();
      for (let k = n; k < cur; k++) await page.locator('#subc').click();
      await page.locator('#reg').click();
      const P = await dbg(page, 'geo', d => d.poly);
      const sides = P.map((p, i) => Math.hypot(P[(i + 1) % n][0] - p[0], P[(i + 1) % n][1] - p[1]));
      expect(Math.max(...sides) - Math.min(...sides)).toBeLessThan(0.01);
      if (n === 3) await expect(page.locator('#pn .fx.big')).toContainText('Equilateral');
      if (n === 4) await expect(page.locator('#pn .fx.big')).toContainText('Square');
      await expect(page.locator('#pn')).toContainText(`(${n} − 2) × 180° = ${(n - 2) * 180}°`);
    }
  });

  test('Pythagoras: dragging the legs finds 3-4-5 and 6-8-10; the squares add up', async ({ page }) => {
    await home(page); await openGame(page, 'geo');
    await page.locator('[data-m="pyth"]').click();
    const box = await canvasBox(page);
    const drag = async (which, val) => {
      const st = await dbg(page, 'geo', d => ({ a: d.tri.a, b: d.tri.b }));
      // the right angle sits at (-a/2, -b/2); while dragging it stays put and the handle follows the finger
      const o = [-st.a / 2, -st.b / 2];
      const from = which === 'a' ? [o[0] + st.a, o[1]] : [o[0], o[1] + st.b];
      const to = which === 'a' ? [o[0] + val, o[1]] : [o[0], o[1] + val];
      const f = await dbg(page, 'geo', (d, G, W, p) => d.toPx(...p), from), t = await dbg(page, 'geo', (d, G, W, p) => d.toPx(...p), to);
      await mouseDrag(page, [[box.x + f[0], box.y + f[1]], [box.x + t[0], box.y + t[1]]], { steps: 12 });
    };
    await drag('a', 5); await drag('b', 6);                    // move away from the starting 3-4 triangle first
    await expect(page.locator('#trip')).toContainText('found: 0');
    await drag('a', 3); await drag('b', 4);
    expect(await dbg(page, 'geo', d => [d.tri.a, d.tri.b])).toEqual([3, 4]);
    await expect(page.locator('#pn')).toContainText('9 + 16 = 25');
    await expect(page.locator('#trip')).toContainText('found: 1');
    await drag('b', 8); await drag('a', 6);
    await expect(page.locator('#pn')).toContainText('36 + 64 = 100');
    await expect(page.locator('#trip')).toContainText('found: 2');
    await drag('a', 2);
    await expect(page.locator('#pn')).toContainText('√68 ≈ 8.25');
  });

  test('circle: C = 2πr and A = πr² for every radius; unrolling measures the circumference', async ({ page }) => {
    await home(page); await openGame(page, 'geo');
    await page.locator('[data-m="circ"]').click();
    for (const r of [1, 2.5, 4, 5]) {
      await dbg(page, 'geo', (d, G, W, r) => { d.circ.r = r; d.circ.roll = false; d.circ.unroll = 0; d.panelHTML(); return 1; }, r);
      const t = await page.locator('#pn').textContent();
      expect(t).toContain(`= ${(Math.round(2 * Math.PI * r * 100) / 100).toLocaleString('en-US')}`);
      expect(t).toContain(`= ${(Math.round(Math.PI * r * r * 100) / 100).toLocaleString('en-US')}`);
      const shown = t.match(/2 × 3\.1416 × ([\d.]+) = ([\d.]+)/);
      expect(Math.abs(2 * 3.1416 * +shown[1] - +shown[2])).toBeLessThan(0.006);  // the written-out product agrees with the answer
    }
    const box = await canvasBox(page);
    const c = await dbg(page, 'geo', d => [d.toPx(0, 0), d.toPx(d.circ.r, 0)]);
    await mouseDrag(page, [[box.x + c[1][0], box.y + c[1][1]], [box.x + c[0][0] + (c[1][0] - c[0][0]) * .6, box.y + c[1][1]]], { steps: 10 });
    expect(await dbg(page, 'geo', d => d.circ.r)).toBe(3);
    await page.locator('#unroll').click();
    await waitDbg(page, 'geo', d => d.circ.roll === 'done', { timeout: 10_000 });
    await expect(page.locator('#game .starn')).toHaveText('1');
  });

  test('unit circle: cos, sin and tan at every special angle, with exact forms', async ({ page }) => {
    await home(page); await openGame(page, 'geo');
    await page.locator('[data-m="unit"]').click();
    const EX = { 0: ['1', '0'], 30: ['√3/2', '1/2'], 45: ['√2/2', '√2/2'], 60: ['1/2', '√3/2'], 90: ['0', '1'], 120: ['−1/2', '√3/2'], 135: ['−√2/2', '√2/2'], 150: ['−√3/2', '1/2'], 180: ['−1', '0'], 210: ['−√3/2', '−1/2'], 225: ['−√2/2', '−√2/2'], 240: ['−1/2', '−√3/2'], 270: ['0', '−1'], 300: ['1/2', '−√3/2'], 315: ['√2/2', '−√2/2'], 330: ['√3/2', '−1/2'] };
    await dbg(page, 'geo', d => { d.unit.t = 0; d.panelHTML(); return 1; });
    for (const deg of Object.keys(EX).map(Number)) {
      if (deg) await page.locator('#snap').click();
      const t = await page.locator('#pn').textContent();
      const rad = deg * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad);
      expect(t).toContain(`θ = ${deg}°`);
      expect(t).toContain(`cos θ = ${(Math.round(c * 1000) / 1000 || 0).toLocaleString('en-US')} = ${EX[deg][0]}`);
      expect(t).toContain(`sin θ = ${(Math.round(s * 1000) / 1000 || 0).toLocaleString('en-US')} = ${EX[deg][1]}`);
      expect(t).toContain('cos²θ = 1');
      if (deg === 90 || deg === 270) expect(t).toContain('= ∞');
    }
    await page.keyboard.press('ArrowLeft');                     // keyboard turns the angle by 15°: 330° -> 345°
    await expect(page.locator('#pn')).toContainText('θ = 345°');
  });
});

/* ---------------- Graph Rider ---------------- */
test.describe('17 Graph Rider', () => {
  test('every family: the target track is reachable on the control grid, and riding it collects every star', async ({ page }) => {
    test.setTimeout(180_000);
    await home(page); await openGame(page, 'graph');
    for (const fam of ['line', 'para', 'wave', 'vee', 'grow']) {
      await page.locator(`[data-fam="${fam}"]`).click();
      for (let k = 0; k < 3; k++) {
        const st = await dbg(page, 'graph', (d, G, W, fam) => ({ t: d.target, p: d.FAM[fam].p, stars: d.stars.length, lvl: d.lvl }), fam);
        expect(st.stars).toBeGreaterThanOrEqual(1);
        for (const [key, [lo, hi, step]] of Object.entries(st.p)) {
          const v = st.t[key];
          expect(v).toBeGreaterThanOrEqual(lo); expect(v).toBeLessThanOrEqual(hi);
          expect(Math.abs(Math.round(v / step) * step - v)).toBeLessThan(1e-9);    // a value the child can actually set
        }
        await dbg(page, 'graph', (d, G, W, t) => { d.setQ(t); return 1; }, st.t);
        await expect(page.locator('#hits')).toContainText('✅');
        await page.locator('#ride').click();
        await waitDbg(page, 'graph', (d, G, W, l) => d.lvl === l + 1, { arg: st.lvl, timeout: 20_000 });
        await waitDbg(page, 'graph', d => !d.ride_, { timeout: 5000 });
      }
    }
  });

  test('missing a star fails the ride with a hint; slope and area during the ride are right', async ({ page }) => {
    await home(page); await openGame(page, 'graph');
    await dbg(page, 'graph', d => { d.setQ({ m: 1, b: 0 }); return 1; });
    await page.locator('#ride').click();
    await page.waitForTimeout(600);
    const mid = await dbg(page, 'graph', d => ({ x: d.ride_.x, area: d.area }));
    // for y = x, area from -10.5 to x is (x² - 110.25)/2, and the slope is 1
    expect(Math.abs(mid.area - (mid.x ** 2 - 10.5 ** 2) / 2)).toBeLessThan(0.05);
    await expect(page.locator('#slope')).toContainText('1');
    await waitDbg(page, 'graph', d => d.ride_ && d.ride_.done, { timeout: 15_000 });
    const st = await dbg(page, 'graph', d => d.stars.every(s => s.got));
    if (!st) await expect(page.locator('.simhint')).toContainText('missed');
  });

  test('dragging the track and its pink dots changes the equation; Growth has a dot for a and one for r', async ({ page }) => {
    await home(page); await openGame(page, 'graph');
    const box = await canvasBox(page);
    // line: drag the track up 2 squares
    const P = async (x, y) => dbg(page, 'graph', (d, G, W, [x, y]) => [d.P.X(x), d.P.Y(y)], [x, y]);
    const q0 = await dbg(page, 'graph', d => ({ ...d.q }));
    const a = await P(-5, q0.m * -5 + q0.b), b = await P(-5, q0.m * -5 + q0.b + 2);
    await mouseDrag(page, [[box.x + a[0], box.y + a[1]], [box.x + b[0], box.y + b[1]]], { steps: 10 });
    expect(await dbg(page, 'graph', d => d.q.b)).toBe(q0.b + 2);
    await page.locator('[data-fam="grow"]').click();
    const hs = await dbg(page, 'graph', d => d.handles().map(h => ({ x: h.x, y: h.y, role: h.role })));
    expect(hs.map(h => h.role).sort()).toEqual(['a', 'main']);
    const ha = hs.find(h => h.role === 'a'), from = await P(ha.x, ha.y), to = await P(ha.x, ha.y + 1);
    const qk = await dbg(page, 'graph', d => d.q.k);
    await mouseDrag(page, [[box.x + from[0], box.y + from[1]], [box.x + to[0], box.y + to[1]]], { steps: 10 });
    expect(await dbg(page, 'graph', d => d.q.a)).toBe(ha.y + 1 - qk);
    await expect(page.locator('#eq')).toContainText(String(ha.y + 1 - qk));
  });

  test('extreme settings never produce NaN or Infinity on screen', async ({ page }) => {
    await home(page); await openGame(page, 'graph');
    for (const [fam, q] of [['grow', { a: 3, r: 2, k: 6 }], ['grow', { a: .25, r: .5, k: -6 }], ['wave', { A: 0, B: .25, D: 0 }], ['para', { a: 2, h: 6, k: 6 }]]) {
      await page.locator(`[data-fam="${fam}"]`).click();
      await dbg(page, 'graph', (d, G, W, q) => { d.setQ(q); return 1; }, q);
      await page.locator('#ride').click();
      await page.waitForTimeout(1500);
      const t = await page.locator('.lab-panel').textContent();
      expect(t).not.toMatch(/NaN|Infinity/);
    }
  });
});

/* ---------------- Math Art ---------------- */
test.describe('18 Math Art', () => {
  test('sunflower: sliding changes the angle and seed count; the golden-angle button finds 137.5° for one star', async ({ page }) => {
    await home(page); await openGame(page, 'art');
    const box = await canvasBox(page);
    const a0 = await dbg(page, 'art', d => d.S.sun.a);
    await mouseDrag(page, [[box.x + 200, box.y + 300], [box.x + 400, box.y + 300]], { steps: 10 });
    const a1 = await dbg(page, 'art', d => d.S.sun.a);
    expect(a1).toBeCloseTo(a0 + 200 * .02, 0);
    await mouseDrag(page, [[box.x + 300, box.y + 400], [box.x + 300, box.y + 300]], { steps: 10 });
    expect(await dbg(page, 'art', d => d.S.sun.n)).toBe(900);
    await page.locator('#gold').click();
    await waitDbg(page, 'art', d => Math.abs(d.S.sun.a - 137.508) < .01, { timeout: 4000 });
    await expect(page.locator('#av')).toHaveText('137.5°');
    await expect(page.locator('#game .starn')).toHaveText('1');
    await page.locator('#gold').click(); await page.waitForTimeout(1700);
    await expect(page.locator('#game .starn')).toHaveText('1');      // only once
    // 360 / φ² really is the golden angle
    const phi = (1 + Math.sqrt(5)) / 2;
    expect(360 / phi ** 2).toBeCloseTo(137.508, 2);
  });

  test('spirograph: the star has R / gcd(R, r) points for every gear and ring', async ({ page }) => {
    await home(page); await openGame(page, 'art');
    await page.locator('[data-am="spiro"]').click();
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    for (const ring of ['Small', 'Medium', 'Big']) {
      await page.locator('#ring').click();
      await page.locator('.pop .popitem', { hasText: ring }).click();
      for (const r of [8, 20, 36, 45]) {
        await dbg(page, 'art', (d, G, W, r) => { d.S.spiro.r = Math.min(r, d.S.spiro.R - 4); d.setMode('spiro'); return 1; }, r);
        const { R, r: rr } = await dbg(page, 'art', d => d.S.spiro);
        await expect(page.locator('#pn .fx.big')).toContainText(`= ${R / gcd(R, rr)}`);
      }
    }
  });

  test('fractal tree: more and fewer levels, and the counts follow 2^(n-1) and 2^n - 1', async ({ page }) => {
    await home(page); await openGame(page, 'art');
    await page.locator('[data-am="tree"]').click();
    for (const btn of ['#more', '#more', '#less', '#less', '#less']) {
      await page.locator(btn).click();
      const n = await dbg(page, 'art', d => d.S.tree.depth);
      await expect(page.locator('#pn .fx.big')).toContainText(`= ${2 ** (n - 1)}`);
      await expect(page.locator('#pn')).toContainText(`= ${2 ** n - 1}`);
    }
    await page.locator('#grow').click();
  });

  test('Mandelbrot: tapping zooms in and classifies the tapped point correctly', async ({ page }) => {
    await home(page); await openGame(page, 'art');
    await page.locator('[data-am="mand"]').click();
    // independent escape test
    const esc = (cx, cy) => { let x = 0, y = 0; for (let n = 1; n <= 200; n++) { [x, y] = [x * x - y * y + cx, 2 * x * y + cy]; if (x * x + y * y > 4) return n; } return 0; };
    for (const [cx, cy] of [[0, 0], [-1, 0], [.3, .5], [-.75, .1], [.5, 0], [-1.8, 0], [0, 1]]) {
      const o = await dbg(page, 'art', (d, G, W, [x, y]) => d.orbit(x, y), [cx, cy]);
      const n = esc(cx, cy);
      expect(o.esc).toBe(n > 0);
      if (n) expect(o.n).toBe(n);
    }
    const box = await canvasBox(page);
    const span0 = await dbg(page, 'art', d => d.S.mand.span);
    await page.mouse.click(box.x + box.width * .4, box.y + box.height * .5);
    expect(await dbg(page, 'art', d => d.S.mand.span)).toBeCloseTo(span0 / 2, 6);
    await expect(page.locator('#pn')).toContainText(/Escapes after|Stays close/);
    await page.locator('#zout').click();
    expect(await dbg(page, 'art', d => d.S.mand.span)).toBeCloseTo(span0, 6);
    await page.locator('#home2').click();
    expect(await dbg(page, 'art', d => d.S.mand.cx)).toBe(-.6);
  });

  test('arrow keys change the art in every mode', async ({ page }) => {
    await home(page); await openGame(page, 'art');
    const a = await dbg(page, 'art', d => d.S.sun.a);
    await page.keyboard.press('ArrowRight');
    expect(await dbg(page, 'art', d => d.S.sun.a)).toBeCloseTo(a + .1, 5);
    await page.keyboard.press('2');
    const r = await dbg(page, 'art', d => d.S.spiro.r);
    await page.keyboard.press('ArrowRight');
    expect(await dbg(page, 'art', d => d.S.spiro.r)).toBe(r + 1);
    await page.keyboard.press('3');
    const ang = await dbg(page, 'art', d => d.S.tree.ang);
    await page.keyboard.press('ArrowLeft');
    expect(await dbg(page, 'art', d => d.S.tree.ang)).toBe(ang - 1);
  });
});
