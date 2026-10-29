// Games 21-23: Prime Garden, Puzzle Box, Robo Code.
import { test, expect, home, openGame, dbg, waitDbg, canvasBox } from './helpers.mjs';

const isPrime = n => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
const factor = n => { const f = []; for (let d = 2; d * d <= n; d++) while (n % d === 0) { f.push(d); n /= d; } if (n > 1) f.push(n); return f; };
const gcd = (a, b) => b ? gcd(b, a % b) : a;

/* ---------------- Prime Garden ---------------- */
test.describe('21 Prime Garden', () => {
  test('sieve: tapping 2, 3, 5 and 7 leaves exactly the 25 primes up to 100', async ({ page }) => {
    await home(page); await openGame(page, 'primes');
    // independent check of the claim on screen
    expect([...Array(100)].map((_, i) => i + 1).filter(isPrime).length).toBe(25);
    for (const n of [2, 3, 5, 7]) {
      await page.locator(`.pot[data-n="${n}"]`).click();
      await expect(page.locator(`.pot[data-n="${n}"]`)).toHaveClass(/crown/);
      await page.waitForFunction(n => { const d = window.WiggleBox.games.primes._debug.dead; for (let k = 2 * n; k <= 100; k += n) if (!d.has(k)) return false; return true; }, n, { timeout: 8000 });
      await page.waitForTimeout(150);
    }
    await expect(page.locator('#pn .fx.big')).toContainText('Only primes left', { timeout: 5000 });
    const dead = new Set(await dbg(page, 'primes', d => [...d.dead]));
    for (let n = 2; n <= 100; n++) expect(dead.has(n), `${n}`).toBe(!isPrime(n));
    await expect(page.locator('.pot.crown')).toHaveCount(25);
    await expect(page.locator('#game .starn')).toHaveText('1');
  });

  test('tapping 1, a wilted number or a composite first all behave sensibly', async ({ page }) => {
    await home(page); await openGame(page, 'primes');
    await page.locator('.pot[data-n="1"]').click();
    await expect(page.locator('.simhint')).toContainText('not prime and not composite');
    await page.locator('.pot[data-n="4"]').click();
    await expect(page.locator('.simhint')).toContainText('4 = 2 × 2');
    await page.waitForFunction(() => window.WiggleBox.games.primes._debug.dead.has(100), null, { timeout: 8000 });
    await page.waitForTimeout(200);
    await page.locator('.pot[data-n="8"]').click();
    await expect(page.locator('.simhint')).toContainText('8 already wilted');
    // switching modes in the middle of a sieve does not leak wilting into the next one
    await page.locator('.pot[data-n="3"]').click();
    await page.locator('[data-pm="tree"]').click();
    await page.locator('[data-pm="sieve"]').click();
    await page.waitForTimeout(1500);
    expect(await dbg(page, 'primes', d => d.dead.size)).toBe(0);
  });

  test('factor trees: splitting until every leaf is prime gives the true prime factorisation', async ({ page }) => {
    test.setTimeout(90_000);
    await home(page); await openGame(page, 'primes');
    await page.locator('[data-pm="tree"]').click();
    for (let k = 0; k < 6; k++) {
      const root = await dbg(page, 'primes', d => d.tree.v);
      for (let guard = 0; guard < 20; guard++) {
        const leaf = page.locator('.fn:not(.prime):not(.split)').first();
        if (!(await leaf.count())) break;
        await leaf.click();
        await page.locator('#splits .opt').first().click();
      }
      const leaves = await page.$$eval('.fn:not(.split)', b => b.map(x => +x.textContent));
      expect(leaves.every(isPrime)).toBe(true);
      expect(leaves.reduce((a, b) => a * b, 1)).toBe(root);
      expect(leaves.sort((a, b) => a - b)).toEqual(factor(root));
      await expect(page.locator('#game .starn')).toHaveText(String(k + 1));
      await page.locator('#again').click();
    }
    // a prime cannot be split
    await page.locator('.fn').first().click();
    await page.locator('#splits .opt').first().click();
    const p = page.locator('.fn.prime').first(); await p.click();
    await expect(page.locator('.simhint')).toContainText('is prime');
  });

  test('GCD and LCM are right for every pair, and GCD × LCM = a × b', async ({ page }) => {
    await home(page); await openGame(page, 'primes');
    await page.locator('[data-pm="venn"]').click();
    const seen = new Set();
    for (let k = 0; k < 120 && seen.size < 12; k++) {
      const [a, b] = await dbg(page, 'primes', d => d.pair);
      seen.add(`${a},${b}`);
      const g = gcd(a, b), l = a * b / g, t = await page.locator('#pn').textContent();
      expect(t).toContain(`${g}`);
      expect(t).toContain(`Smallest shared (LCM)${l}`);
      expect(t).toContain(`${g} × ${l} = ${a * b}`);
      await page.locator('#again').click();
      expect((await dbg(page, 'primes', d => d.pair)).join()).not.toBe(`${a},${b}`);
    }
    expect(seen.size).toBe(12);
  });
});

/* ---------------- Puzzle Box ---------------- */
/* Lights Out over GF(2): find presses x with A·x = lights */
function lightsSolve(n, b) {
  const N = n * n, A = [];
  for (let i = 0; i < N; i++) { const row = Array(N + 1).fill(0); const x = i % n, y = (i / n) | 0; for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < n && Y < n) row[Y * n + X] = 1; } row[N] = b[i]; A.push(row); }
  // A is symmetric, so row i = effect on light i of each press
  let r = 0; const piv = [];
  for (let c = 0; c < N && r < N; c++) { let p = r; while (p < N && !A[p][c]) p++; if (p === N) continue; [A[r], A[p]] = [A[p], A[r]]; for (let i = 0; i < N; i++) if (i !== r && A[i][c]) for (let k = c; k <= N; k++) A[i][k] ^= A[r][k]; piv.push(c); r++; }
  for (let i = r; i < N; i++) if (A[i][N]) return null;
  const x = Array(N).fill(0); piv.forEach((c, i) => { x[c] = A[i][N]; });
  return x.map((v, i) => v ? i : -1).filter(i => i >= 0);
}
function sudokuSolve(G, n) {
  const bw = n === 4 ? 2 : 3, bh = 2;
  const ok = (r, c, v) => { for (let i = 0; i < n; i++) if (G[r][i] === v || G[i][c] === v) return false; const r0 = r - r % bh, c0 = c - c % bw; for (let y = r0; y < r0 + bh; y++) for (let x = c0; x < c0 + bw; x++) if (G[y][x] === v) return false; return true; };
  const go = () => { for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!G[r][c]) { for (let v = 1; v <= n; v++) if (ok(r, c, v)) { G[r][c] = v; if (go()) return true; G[r][c] = 0; } return false; } return true; };
  return go() ? G : null;
}

test.describe('22 Puzzle Box', () => {
  test('Tower of Hanoi: 3 to 7 disks solved in the fewest moves earns the star; illegal moves are refused', async ({ page }) => {
    test.setTimeout(120_000);
    await home(page); await openGame(page, 'puzzles');
    let stars = 0;
    for (const n of [3, 4, 5, 6, 7]) {
      await page.locator(`#ex [data-hn="${n}"]`).click();
      const moves = []; const hanoi = (k, a, b, c) => { if (!k) return; hanoi(k - 1, a, c, b); moves.push([a, c]); hanoi(k - 1, b, a, c); }; hanoi(n, 0, 1, 2);
      if (n === 3) { // try one illegal move first: small disk to peg 1, then big disk onto it
        await page.locator('[data-peg="0"]').click(); await page.locator('[data-peg="1"]').click();
        await page.locator('[data-peg="0"]').click(); await page.locator('[data-peg="1"]').click();
        await expect(page.locator('.simhint')).toContainText('cannot go on a smaller');
        await page.locator('[data-peg="0"]').click();          // put it back down
        await page.locator(`#ex [data-hn="3"]`).click();      // restart
      }
      for (const [a, c] of moves) { await page.locator(`[data-peg="${a}"]`).click(); await page.locator(`[data-peg="${c}"]`).click(); }
      expect(await dbg(page, 'puzzles', d => [d.H.done, d.H.moves, d.H.pegs[2].join()])).toEqual([true, 2 ** n - 1, [...Array(n)].map((_, i) => n - i).join()]);
      await expect(page.locator('#pn')).toContainText(`2${n} − 1 = ${2 ** n - 1}`);
      stars += 2; // a win star and the fewest-moves star
      await expect(page.locator('#game .starn')).toHaveText(String(stars), { timeout: 3000 });
    }
  });

  test('Lights Out 3×3, 4×4 and 5×5 can be cleared by pressing; a new board follows', async ({ page }) => {
    await home(page); await openGame(page, 'puzzles');
    await page.locator('[data-pz="lights"]').click();
    for (const n of [3, 4, 5]) {
      await page.locator(`#ex [data-ln="${n}"]`).click();
      const b = await dbg(page, 'puzzles', d => d.LO.b.slice());
      expect(b.some(v => v)).toBe(true);
      const presses = lightsSolve(n, b);
      expect(presses, `${n}x${n} board is solvable`).not.toBeNull();
      for (const i of presses) await page.locator(`[data-lamp="${i}"]`).click();
      expect(await dbg(page, 'puzzles', d => d.LO.done)).toBe(true);
      await expect(page.locator('#pn .fx.big')).toContainText('0');
      await page.waitForFunction(() => !window.WiggleBox.games.puzzles._debug.LO.done, null, { timeout: 5000 });
    }
    await expect(page.locator('#pn')).toContainText(`2${25} = 33,554,432`);
  });

  test('Binary: each target is made by lighting its bits; place values are powers of two', async ({ page }) => {
    await home(page); await openGame(page, 'puzzles');
    await page.locator('[data-pz="binary"]').click();
    for (let k = 0; k < 8; k++) {
      const t = await dbg(page, 'puzzles', d => d.BI.target);
      for (let i = 0; i < 8; i++) if (t >> (7 - i) & 1) await page.locator(`[data-bit="${i}"]`).click();
      await expect(page.locator('#pn .fx.big')).toContainText(`= ${t}`);
      expect(await dbg(page, 'puzzles', d => d.BI.done)).toBe(true);
      await page.waitForFunction(t => !window.WiggleBox.games.puzzles._debug.BI.done, t, { timeout: 5000 });
    }
    const vals = await page.$$eval('.bit .bv', b => b.map(x => +x.textContent));
    for (const v of vals) expect(Math.log2(v) % 1).toBe(0);
  });

  test('Number grids 4×4 and 6×6 always have one solution; clashes turn red; Erase works; solving wins', async ({ page }) => {
    test.setTimeout(120_000);
    await home(page); await openGame(page, 'puzzles');
    await page.locator('[data-pz="sudoku"]').click();
    for (const n of [4, 6, 4, 6]) {
      await page.locator(`#ex [data-sn="${n}"]`).click();
      const G = await dbg(page, 'puzzles', d => d.SU.grid.map(r => r.slice()));
      expect(await dbg(page, 'puzzles', (d, G2, W, g) => d.countSol(g, 2), G)).toBe(1);
      const sol = sudokuSolve(G.map(r => r.slice()), n);
      expect(sol).not.toBeNull();
      const empty = []; G.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
      // a clash first: put a wrong number in the first empty square
      const [r0, c0] = empty[0], wrong = sol[r0][c0] % n + 1;
      await page.locator(`[data-sc="${r0},${c0}"]`).click(); await page.locator(`[data-sv="${wrong}"]`).click();
      await page.locator(`[data-sv="0"]`).click();
      await expect(page.locator(`[data-sc="${r0},${c0}"]`)).toHaveText('');
      for (const [r, c] of empty) { await page.locator(`[data-sc="${r},${c}"]`).click(); await page.locator(`[data-sv="${sol[r][c]}"]`).click(); }
      expect(await dbg(page, 'puzzles', d => d.SU.done)).toBe(true);
      await page.waitForFunction(() => !window.WiggleBox.games.puzzles._debug.SU.done, null, { timeout: 6000 });
    }
    // two equal numbers in a row are both marked
    await page.locator('#ex [data-sn="4"]').click();
    const G = await dbg(page, 'puzzles', d => d.SU.grid.map(r => r.slice()));
    let spot = null; G.forEach((row, r) => row.forEach((v, c) => { if (!spot && !v) { const other = row.find(x => x); if (other) spot = [r, c, other]; } }));
    await page.locator(`[data-sc="${spot[0]},${spot[1]}"]`).click(); await page.locator(`[data-sv="${spot[2]}"]`).click();
    expect(await page.locator('.sc.bad').count()).toBeGreaterThanOrEqual(2);
  });
});

/* ---------------- Robo Code ---------------- */
async function add(page, k) { await page.locator(`#pal [data-add="${k}"]`).click(); }
async function loopCount(page, path, n) { for (let g = 0; g < 10; g++) { const t = await page.locator(`[data-n="${path}"]`).textContent(); if (t.includes(`× ${n}`)) return; await page.locator(`[data-n="${path}"]`).click(); } throw new Error('loop count'); }
async function target(page, where) { await page.locator(`[data-in="${where}"]`).first().dispatchEvent('click'); }
async function runToEnd(page) { await page.locator('#run').click(); await waitDbg(page, 'robo', d => d.run && d.run.done, { timeout: 60_000 }); }

test.describe('23 Robo Code', () => {
  test('all seven levels can be programmed with the blocks in the best number of blocks', async ({ page }) => {
    test.setTimeout(240_000);
    await home(page); await openGame(page, 'robo');
    await page.locator('#fast').click();
    const programs = [
      async () => { await add(page, 'F'); await add(page, 'F'); await add(page, 'F'); },
      async () => { for (const k of ['F', 'R', 'F', 'F', 'L', 'F']) await add(page, k); },
      async () => { await add(page, 'loop'); await add(page, 'F'); await loopCount(page, 'm.0', 6); },
      async () => { await add(page, 'loop'); await add(page, 'loop'); await add(page, 'F'); await loopCount(page, 'm.0.0', 3); await target(page, 'm.0'); await add(page, 'R'); await loopCount(page, 'm.0', 3); },
      async () => { await add(page, 'loop'); for (const k of ['R', 'F', 'L', 'F']) await add(page, k); await loopCount(page, 'm.0', 5); },
      async () => { await add(page, 'loop'); await add(page, 'loop'); await add(page, 'F'); await loopCount(page, 'm.0.0', 4); await target(page, 'm.0'); await add(page, 'R'); await loopCount(page, 'm.0', 4); },
      async () => { await target(page, 'f'); await add(page, 'loop'); await add(page, 'F'); await loopCount(page, 'f.0', 6); await target(page, 'm'); for (const k of ['P', 'R', 'F', 'F', 'R', 'P']) await add(page, k); },
    ];
    for (let lv = 0; lv < 7; lv++) {
      await expect(page.locator('#lv')).toHaveText(`Level ${lv + 1}`);
      await programs[lv]();
      const par = await dbg(page, 'robo', (d, G, W, lv) => d.LV[lv].par, lv);
      await expect(page.locator('#size')).toContainText(`best: ${par}`);
      const used = await dbg(page, 'robo', d => { const c = l => l.reduce((s, b) => s + 1 + (b.body ? c(b.body) : 0), 0); return c(d.prog) + c(d.fnBody); });
      expect(used, `level ${lv + 1} block count`).toBeLessThanOrEqual(par);
      await runToEnd(page);
      expect(await dbg(page, 'robo', d => d.gems.size), `level ${lv + 1} gems`).toBe(0);
      await expect(page.locator('#nx')).toHaveClass(/pulse/);
      await expect(page.locator('#game .starn')).toHaveText(String(2 * (lv + 1)));  // win star + perfect-code star
      await page.locator('#nx').click({ force: true });              // it pulses, so it never counts as stable
    }
  });

  test('walls bonk, leftover gems are reported, Reset stops a running robot, blocks can be deleted', async ({ page }) => {
    await home(page); await openGame(page, 'robo');
    await page.locator('#nx').click();                                            // level 2 has a wall
    for (const k of ['F', 'F', 'F']) await add(page, k);
    await runToEnd(page);
    await expect(page.locator('.simhint')).toContainText('Bonk');
    await page.locator('#stop').click();
    await page.locator('[data-del="m.2"]').click(); await page.locator('[data-del="m.1"]').click();
    expect(await dbg(page, 'robo', d => d.prog.length)).toBe(1);
    await runToEnd(page);
    await expect(page.locator('.simhint')).toContainText('gem');
    // a long program can always be stopped
    await page.locator('#clr').click();
    await add(page, 'L'); for (let i = 0; i < 25; i++) await add(page, 'R');
    await page.locator('#run').click();
    await page.waitForTimeout(500);
    expect(await dbg(page, 'robo', d => d.run && !d.run.done)).toBe(true);
    await page.locator('#stop').click();
    expect(await dbg(page, 'robo', d => d.run)).toBe(null);
    expect(await dbg(page, 'robo', d => [d.rob.x, d.rob.y, d.rob.d])).toEqual([0, 0, 0]);
  });

  test('the block limit, the loop counter and ⭐ inside My move are handled with a hint', async ({ page }) => {
    await home(page); await openGame(page, 'robo');
    for (let i = 0; i < 30; i++) await add(page, 'F');
    await add(page, 'F');
    await expect(page.locator('.simhint')).toContainText('30 blocks');
    expect(await dbg(page, 'robo', d => d.prog.length)).toBe(30);
    await page.locator('#clr').click();
    for (let lv = 1; lv < 7; lv++) await page.locator('#nx').click();
    await target(page, 'f'); await add(page, 'P');
    await expect(page.locator('.simhint')).toContainText('cannot use itself');
    expect(await dbg(page, 'robo', d => d.fnBody.length)).toBe(0);
    await target(page, 'm'); await add(page, 'loop');
    for (let n = 3; n <= 9; n++) await page.locator('[data-n="m.0"]').click();
    await expect(page.locator('[data-n="m.0"]')).toContainText('× 9');
    await page.locator('[data-n="m.0"]').click();
    await expect(page.locator('[data-n="m.0"]')).toContainText('× 2');
  });

  test('the running block is highlighted step by step', async ({ page }) => {
    await home(page); await openGame(page, 'robo');
    for (const k of ['F', 'F', 'F']) await add(page, k);
    await page.locator('#run').click();
    await expect(page.locator('#code .cb.now')).toHaveCount(1, { timeout: 3000 });
    await waitDbg(page, 'robo', d => d.run && d.run.done, { timeout: 20_000 });
    await expect(page.locator('#code .cb.now')).toHaveCount(0);
  });
});
