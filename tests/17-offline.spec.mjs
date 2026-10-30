// Offline play through the service worker: install, play all 28 games offline, update without mixing versions.
import { test, expect, home, GAME_KEYS } from './helpers.mjs';
import { appHash, stampedVersion } from '../tools/stamp-sw.mjs';

test.use({ serviceWorkers: 'allow' });

async function installed(page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(r => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
  });
}
const cacheKeys = page => page.evaluate(async () => { const out = {}; for (const k of await caches.keys()) out[k] = (await (await caches.open(k)).keys()).map(r => new URL(r.url).pathname.replace(/^.*\//, '/')); return out; });

test('the service worker version matches the app files (run npm run stamp after changing them)', () => {
  expect(stampedVersion()).toBe(appHash());
});

test('after one visit, the home screen and all 28 games work with the network off', async ({ page, context }) => {
  test.setTimeout(240_000);
  await home(page);
  await installed(page);
  const ver = stampedVersion();
  const keys = await cacheKeys(page);
  expect(Object.keys(keys).filter(k => k.startsWith('wigglebox-'))).toEqual([`wigglebox-${ver}`]);
  for (const f of ['/index.html', '/matter.min.js', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/maskable-512.png', '/apple-touch-icon.png'])
    expect(keys[`wigglebox-${ver}`], f).toContain(f);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#home')).toBeVisible();
  await expect(page.locator('.tile')).toHaveCount(28);
  for (const k of GAME_KEYS) {
    await page.locator(`.tile[data-g="${k}"]`).scrollIntoViewIfNeeded();
    await page.locator(`.tile[data-g="${k}"]`).click();
    await page.waitForFunction(k => window.WiggleBox.ready === k, k, { timeout: 15_000 });
    await page.waitForTimeout(250);
    await expect(page.locator('#stage'), k).not.toContainText('could not load');
    await page.locator('#back').click();
    await expect(page.locator('#home')).toBeVisible();
  }
  // a cold start offline: a brand-new tab on the installed app
  const p2 = await context.newPage();
  await p2.goto('./');
  await expect(p2.locator('.tile')).toHaveCount(28);
  await p2.locator('.tile[data-g="physics"]').click();
  await p2.waitForFunction(() => window.WiggleBox.ready === 'physics' && window.Matter);
  await context.setOffline(false);
});

/* A second copy of the app on its own port, so the test can change the files on the "server" for real. */
async function tempServer() {
  const { mkdtempSync, cpSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { spawn } = await import('node:child_process');
  const { join } = await import('node:path');
  const repo = new URL('..', import.meta.url).pathname, dir = mkdtempSync(join(tmpdir(), 'wb-'));
  for (const f of ['index.html', 'sw.js', 'matter.min.js', 'manifest.webmanifest', 'icons']) cpSync(join(repo, f), join(dir, f), { recursive: true });
  const port = 4300 + Math.floor(Math.random() * 500);
  const proc = spawn(process.execPath, [join(repo, 'tests/server.mjs'), String(port)], { env: { ...process.env, WB_ROOT: dir }, stdio: 'pipe' });
  await new Promise(r => proc.stdout.once('data', r));
  return { url: `http://127.0.0.1:${port}/`, dir, file: f => join(dir, f), stop() { proc.kill(); rmSync(dir, { recursive: true, force: true }); } };
}

test('an update replaces the whole cache at once, and a broken page from the server never replaces the stored app', async ({ page, context }) => {
  test.setTimeout(120_000);
  const { readFileSync, writeFileSync, rmSync } = await import('node:fs');
  const srv = await tempServer();
  try {
    await page.goto(srv.url);
    await expect(page.locator('.tile')).toHaveCount(28);
    await installed(page);
    const v1 = stampedVersion();
    expect(Object.keys(await cacheKeys(page))).toEqual([`wigglebox-${v1}`]);
    // version 2 goes up on the server: a new sw.js and a page with a marker in it
    writeFileSync(srv.file('sw.js'), readFileSync(srv.file('sw.js'), 'utf8').replace(/const VERSION='[0-9a-f]+'/, "const VERSION='0000000000a2'"));
    writeFileSync(srv.file('index.html'), readFileSync(srv.file('index.html'), 'utf8').replace('<head>', '<head><meta name="wb-version" content="2">'));
    await page.reload();
    await expect(page.locator('meta[name="wb-version"]')).toHaveCount(1);        // online: the newest page at once
    await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
    await expect.poll(async () => Object.keys(await cacheKeys(page)), { timeout: 20_000 }).toEqual(['wigglebox-0000000000a2']);
    // offline: the new version, complete (page and physics engine)
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('meta[name="wb-version"]')).toHaveCount(1);
    await page.locator('.tile[data-g="physics"]').click();
    await page.waitForFunction(() => window.WiggleBox.ready === 'physics' && window.Matter);
    await context.setOffline(false);
    // the server breaks (index.html missing → 404): online the child sees the error, offline the stored app still works
    rmSync(srv.file('index.html'));
    test.info().annotations.push({ type: 'allow-errors', description: 'the 404 page is served on purpose' });
    await page.goto(srv.url);
    await expect(page.locator('body')).toContainText('not found');
    await context.setOffline(true);
    await page.goto(srv.url);
    await expect(page.locator('.tile')).toHaveCount(28);
    await expect(page.locator('meta[name="wb-version"]')).toHaveCount(1);
    await context.setOffline(false);
  } finally { srv.stop(); }
});
