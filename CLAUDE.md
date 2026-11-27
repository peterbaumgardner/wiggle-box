# Wiggle Box: notes for Claude

Touchscreen games for young kids, played by several children touching one screen at once. Static site, no build step,
works offline (service worker). Read README.md, games/README.md and js/README.md first.

- One game = one folder `games/<key>/` (`<key>.js` calling `defineGame('<key>', {init(stage, g)})`, optional
  `<key>.css`) plus one line in `games/registry.js`. New games: `npm run new-game -- <key> "Title"`.
- Work on one game at a time; don't touch other games' folders or the platform (`js/`, `css/app.css`) unless the task
  needs it. A platform change needs the full desktop suite.
- Every game must handle many simultaneous touches (track by pointerId; per-finger state), big touch targets, phone and
  tablet in both orientations, and clean up through `g` (g.later / g.loop / g.listen / g.onEnd).
- Game CSS classes use the game's prefix and live in the game's own CSS file.
- All scripts share one global scope: keep a game's helpers inside `init`.
- After any app change: `npm run check`, `npm run stamp`, then the relevant tests
  (`npm run test:game -- "<title or test name>"`, or `npx playwright test tests/games/<key>.spec.mjs --project=desktop`).
  Run tests with `--trace off` unless debugging.
