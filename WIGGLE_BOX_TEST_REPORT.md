# Wiggle Box test report

## Versions

| | |
|---|---|
| Starting commit (`main`) | `8a98c5778bb7c4e953eae65adf1e1909e0dd8b4d` |
| Baseline commit (harness + read-only test hook, app otherwise unchanged) | `cdb0d06` |
| Final commit on `repair/full-functional-audit` | `0fc3c7c` for the full run; the branch head adds one test timeout change, the matrix generator update and these reports |
| Node | v22.23.4 |
| Playwright | 1.63.0 (`@playwright/test`, the only dependency, dev only) |
| Browser | Chromium build 1243 (Playwright's bundled Chromium, headless) |
| Physics engine in the app | Matter.js 0.19.0 (unchanged) |
| Machine | Linux 6.18 container, 2 CPU cores, software rendering, 2 test workers |

## How to run

```
npm install                    # installs @playwright/test only
npx playwright install chromium   # if the browser isn't already installed
npm test                       # everything: desktop, four touch screens, then the timing tests alone (~55 min here)
npm run test:fast              # desktop project only
npm run test:perf              # timing tests only
npm run stamp                  # after changing index.html, sw.js or an icon: update the offline cache version
node tools/matrix.mjs          # rebuild WIGGLE_BOX_GAME_MATRIX.md from the last run
```

The suite starts its own static server (`tests/server.mjs`, port 4173). `WB_WORKERS` sets the worker count (default 2).
`WB_ROOT=/path/to/checkout WB_PORT=4174 npx playwright test …` runs the tests against another checkout; that is how the
baseline numbers below were made.

## Projects

| Project | Screen | Input | What runs |
|---|---|---|---|
| desktop | 1440×900 | mouse, keyboard | every functional, science, lifecycle and offline test |
| phone-portrait | 390×844, DPR 2 | touch | `@layout` tests |
| phone-landscape | 844×390, DPR 2 | touch | `@layout` tests |
| tablet-portrait | 768×1024, DPR 2 | touch | `@layout` tests |
| tablet-landscape | 1024×768, DPR 2 | touch | `@layout` tests |
| perf | 1440×900 | mouse | frame-rate, memory and stress tests, after all others, one at a time |

## Results of the final run

Full run of all six projects with `npx playwright test`, 2026-10-30 04:01–04:42 UTC, commit `0fc3c7c`, 2 workers:
**331 passed, 1 failed, 6 did not run.**

- The failure was "tracing backwards or starting away from the green dot does not count" (Letter Trace). It ran out of
  its 60-second budget while sharing the CPU with the 15-minute Letter Trace test, not because of a game problem. I gave
  it 3 minutes and ran it again on its own: passed in 15 s.
- The 6 that did not run are the timing tests (`perf` project). They only start once every other test has passed, so
  that failure held them back. Run afterwards on their own (`npm run test:perf`): 6 of 6 passed.

Total across the full run and those two follow-up runs: **338 tests, 338 passed.** The game matrix is built from all three
results files and marks the reruns.

| Project | Tests | Result |
|---|---|---|
| desktop | 196 | 195 passed in the full run + 1 passed on rerun |
| phone-portrait | 34 | 34 passed |
| phone-landscape | 34 | 34 passed |
| tablet-portrait | 34 | 34 passed |
| tablet-landscape | 34 | 34 passed |
| perf | 6 | 6 passed (run separately) |

Earlier full runs while fixing things turned up the same kind of failure in other long tests (timeouts and
read-before-redraw races in the tests under load). Each was fixed in the test by waiting for the game's own state instead
of a fixed delay, and each fix is in the git history.

Every test also fails on any uncaught page error, any console error, and any failed request, except the optional Google
Fonts stylesheet, which the suite blocks on purpose to prove the app works without it. Three tests that serve errors
on purpose (blocked physics engine, 404 page) declare that and are exempt from this check only.

## Baseline (the original code)

- When the harness was added (`cdb0d06`), the 19 defect reproductions D01–D19 all failed on the original code.
- Re-running today's `00-launch` and `01-defects` files against the baseline: **15 of 19 D-tests fail**; 33 pass.
  D02 (double tap), D06 (narrowing the circuit board), D10 (seesaw undo) and D16 (prism puzzle solvable) pass against
  the baseline in today's versions of those tests. D16 asked "is the prism level solvable at all"; it is, once the prism
  is turned, so it was not a code defect (the fix was the missing how-to text). D02, D06 and D10 were tightened later to
  drive the real input path, and those versions do not reproduce on the baseline in this environment; the fixes they
  describe are still in the code and covered by other tests. I'm reporting this rather than counting them.
- Touch layout against the baseline: on a phone held sideways (844×390) **20 of 28 games fail** the playable-area or
  reachable-controls check (smallest play area: 32 px tall in Robo Code). In portrait all 28 pass.
- The rest of the suite reads state through `_debug` hooks added during the repair, so it cannot run against the
  baseline; those tests are evidence for the final code only.

## Science and math checks

Each compares what the game shows or does with a calculation written independently in the test (not the game's code).

| Game | Check | Tolerance | Result |
|---|---|---|---|
| Atom Builder | Names, mass numbers, charge and electron shells for Z = 1–20; ions and unstable nuclei; every listed molecule built by dragging bonds, with its mass | exact | PASS |
| Balance Scale | x for all 10 levels; torque balance Σ m·d both sides | exact | PASS |
| Bridge Builder | Deck alone fails every level; a Pratt truss passes; steel holds where wood fails; identical outcome at 3 screen sizes | — | PASS |
| Cannon Launch | Range v²sin2θ/g, peak v²sin²θ/2g and flight time on four worlds; the flown path is the parabola; all 12 levels won by aiming with the formula | — | PASS |
| Chance Machine | Galton board is binomial, tilted board averages 10·p, 1/2/3-dice sums, coin flips (seeded random, chi-square) | χ² | PASS |
| Circuit Lab | Ohm's law (meter), series and parallel resistance, battery internal resistance, short circuit, burnout | 0.6% + 1% | PASS |
| Rainbow Piano | Key frequencies = 261.63·2^(n/12) Hz | 0.02 Hz | PASS |
| Number Forge / Potion Lab | All 15 forge levels and every Make-24 deal solvable; all 12 potion targets pourable (independent search) | exact | PASS |
| Shape Lab | Names, area, perimeter, angle sum (n−2)·180°; regular polygons 3–8; Pythagoras 3-4-5 / 6-8-10; C = 2πr, A = πr²; cos/sin/tan at special angles | 0.01 | PASS |
| Graph Rider | Every curve family can reach its target track and collect every star; slope and area during the ride | — | PASS |
| Math Art | Golden angle 137.5°; spirograph star has R/gcd(R, r) points; tree tips 2ⁿ⁻¹ and branches 2ⁿ−1; Mandelbrot membership of the tapped point | exact | PASS |
| Laser Lab | Reflection angle in = out (from the drawn beam), Snell's law through a turned glass block, parallel exit, prism deviation i₁ + i₂ − A, dispersion order, critical angle 41.8° | 0.01–0.2° | PASS |
| Physics Lab | g = 9.80 and 1.617 m/s² (least-squares fit to the fall), energy conserved in free fall, bounce height ≈ e² | 1–3% | PASS |
| Prime Garden | Sieve leaves exactly the 25 primes ≤ 100; factor trees = prime factorisation; GCD·LCM = a·b for all 12 pairs | exact | PASS |
| Puzzle Box | Hanoi 3–7 disks in 2ⁿ−1; Lights Out solved by Gaussian elimination over GF(2); Sudoku 4×4/6×6 unique and solved by backtracking | exact | PASS |
| Element Box | Sand and water counts conserved; oil above water above sand | exact | PASS |
| Space Orbits | T²/a³ equal for 8 planets and = 4π²/GM; energy and angular momentum conserved over 40 s on an ellipse; orbits kept on resize | 2%, 1%, 1e-6 | PASS |
| Splash Lab | Floating depth = density for six toys (time-averaged); sinkers sink; water conserved; colour mixing | 0.08 | PASS |
| Wave Lab | Pendulum period vs 4√(L/g)·K(sin θ₀/2) on four worlds; 60° swing 7% slower than 2π√(L/g); pendulum-wave lengths; ripple λ = v/f measured from the pixels; interference node; string harmonics n·f and n + 1 nodes | 2%, 15% (pixels) | PASS |

## Performance

Measured in the `perf` project on this machine (headless Chromium, software rendering, 1440×900).

- **Same speed on any screen:** with the display faked at 30, 60 and 120 Hz, Space Orbits ran 0.85–1.1 simulated seconds
  per real second and Physics Lab ran 51–66 steps a second (the target is 60). Before the repair, 120 Hz ran games at double speed.
- **Memory:** after visiting all 28 games once to warm up, two more visits to every game (56 visits) grew the JS heap
  from 5.9 to 6.6 MB, DOM nodes from 5,812 to 6,104 and listeners from 289 to 304. That's flat for practical purposes
  (limits in the test: 6 MB, 300 nodes, 30 listeners).
- **Frame time (median over 150 frames, then the 95th percentile):** 26 games hold 16.7 ms (60 fps) at the median and
  the 95th percentile. Element Box: median 16.7 ms, 95th percentile 50 ms, 7 long tasks (worst 70 ms). Splash Lab:
  median 33 ms (30 fps), 95th percentile 50 ms, 6 long tasks (worst 61 ms). Math Art had one 57 ms task. Splash Lab
  lowers its own particle limit if frames get slow. These two are the games to watch on an older tablet.
- **Stress:** 6 bombs and 60 objects in the physics tower for 20 s, four fountains in Splash Lab for 20 s (3,200
  particles, the cap, 13.5 ms of work per frame), 20 s of volcano, 45 planets thrown in fast mode: no NaN, nothing
  escapes, counts stay within their caps.

## Offline

Tested with the real service worker in Chromium (`tests/17-offline.spec.mjs`):

- After one online visit, the cache holds the page, the physics engine, the manifest and all four icons, under one
  version name.
- With the network cut, the home screen and **all 28 games** open and run, including Physics Lab, which loads its
  engine from the cache. A brand-new tab started offline works too.
- An update on a second local server (new `sw.js` and a changed page) swaps the whole cache in one step: afterwards only
  the new version's cache exists, and offline play gets the new page and engine together.
- When the server returns a 404 for the page, a connected child sees the error page, but offline the stored app still
  loads. Before the repair, the 404 page would have been stored as the app.
- If the physics engine can't load (first visit with no network), the child sees a message and a Try again button that
  really retries.
- The test `the service worker version matches the app files` fails if anyone changes the app without running `npm run stamp`.

## After splitting into one file per game (2026-10-30)

The code was split into `css/app.css`, `js/core.js`, `js/data.js`, `games/<game>.js` (28 files) and `js/app.js`, with no
change to how any game behaves, plus one Bridge Builder fix (the truck now follows the road it is on; new test added).
A line-by-line check confirmed every line of the old script and stylesheet is in exactly one new file.

The machine was noticeably slower for these runs than for the release run (a full run took 54–60 minutes instead of 41).

| Run | Passed | Failed | Notes |
|---|---|---|---|
| Full run 1 | 330 | 4 | Physics tools, two Element Box tests, Splash sinkers: all ran out of time or raced under load. All 4 passed when run alone. |
| Full run 2 | 328 | 6 | Atom Builder molecules, Firework Sky, Letter Trace, two Element Box tests, Splash sinkers. All but the molecule test passed when run alone. |
| Timing tests | 4 | 1 | Splash Lab's median frame was 50 ms (20 fps) against a 40 ms limit on this slower machine (it was 33 ms before). Not caused by the split: Splash Lab's code is unchanged. The stress test didn't run after it. |

**Atom Builder molecule test:** it's flaky, and it was flaky before the split too. Run 4 times on each version with nothing
else running: the old single-file version passed 2 of 4, the new split version passed 2 of 4. It fails when a fast
test drag misses an atom that is still drifting, so a bond doesn't form. The game itself works, but bonding by dragging
could be made more forgiving.

The game matrix (`WIGGLE_BOX_GAME_MATRIX.md`) is now generated from full run 2 plus the reruns, so it shows Atom Builder
as FAIL, which is the honest result for that test.

## Known limits

- **Headless Chromium only.** No Safari/WebKit or Firefox runs, and no real phone or tablet. Touch is real CDP touch
  input in Chromium's mobile emulation, not a physical screen. iPad Safari is the most likely place for a difference.
- **Sound** is checked by recording what the app asks the Web Audio API to play (frequencies, start and stop), not by
  listening.
- **Speech** (`speechSynthesis`) is not checked; headless Chromium has no voices.
- **Frame times** are from a 2-core container with software rendering; real devices with a GPU will be faster. Splash Lab
  and Element Box are the heaviest games (see Performance).
- Below 30 frames a second the shared loop runs at most two physics steps per frame, so games slow down rather than
  stutter or spiral. That is a deliberate trade-off.
- The service worker update test runs against a second local server; it does not test GitHub Pages' own caching headers.
- Some D-tests no longer reproduce on the baseline (see Baseline above).
- The full run is long (about 41 minutes on 2 cores). Long tests share the CPU, which is what caused the one timeout above.

## Where things are

- Tests: `tests/*.spec.mjs` (helpers in `tests/helpers.mjs`).
- Last run: `test-results/results.json` (machine-readable), `test-results/html/index.html` (report),
  `test-results/artifacts/` (screenshots of every game on every touch screen, traces and screenshots of any failure).
  `test-results/` is not committed; run `npm test` to recreate it.
