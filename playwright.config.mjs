// Wiggle Box browser tests. Run: npx playwright test
// Projects:
//   desktop          1440x900 mouse      - every functional, science and lifecycle test
//   phone-portrait   390x844  touch      - layout/reachability + touch interaction tests (@layout)
//   phone-landscape  844x390  touch
//   tablet-portrait  768x1024 touch
//   tablet-landscape 1024x768 touch
//   perf             1440x900 mouse      - frame-rate, memory and stress tests, after everything else, one at a time
import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.WB_PORT || 4173);
const touch = (w, h) => ({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.mjs/,
  timeout: 60_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  workers: Number(process.env.WB_WORKERS || 2),
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }], ['html', { open: 'never', outputFolder: 'test-results/html' }]],
  outputDir: 'test-results/artifacts',
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    browserName: 'chromium',
  },
  webServer: {
    command: `node tests/server.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } }, grepInvert: /@layout/, testIgnore: /18-performance/ },
    { name: 'phone-portrait', use: touch(390, 844), grep: /@layout/ },
    { name: 'phone-landscape', use: touch(844, 390), grep: /@layout/ },
    { name: 'tablet-portrait', use: touch(768, 1024), grep: /@layout/ },
    { name: 'tablet-landscape', use: touch(1024, 768), grep: /@layout/ },
    // timing-sensitive checks run last, on their own, so other tests don't steal the CPU while they measure
    { name: 'perf', use: { viewport: { width: 1440, height: 900 } }, testMatch: /18-performance/, dependencies: ['desktop', 'phone-portrait', 'phone-landscape', 'tablet-portrait', 'tablet-landscape'] },
  ],
});
