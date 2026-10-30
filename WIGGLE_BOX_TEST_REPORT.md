# Wiggle Box test report

## Versions

| | |
|---|---|
| Starting commit (`main`) | `8a98c5778bb7c4e953eae65adf1e1909e0dd8b4d` |
| Baseline commit (harness + read-only test hook, app otherwise unchanged) | `cdb0d06` |
| Final commit on `repair/full-functional-audit` | __FINAL_SHA__ |
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

__FINAL_RESULTS__

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
| Atom Builder | Names, mass numbers, charge and electron shells for Z = 1–20; ions and unstable nuclei; every listed molecule built by dragging bonds, with its mass | exact | __R__ |
| Balance Scale | x for all 10 levels; torque balance Σ m·d both sides | exact | __R__ |
| Bridge Builder | Deck alone fails every level; a Pratt truss passes; steel holds where wood fails; identical outcome at 3 screen sizes | — | __R__ |
| Cannon Launch | Range v²sin2θ/g, peak v²sin²θ/2g and flight time on four worlds; the flown path is the parabola; all 12 levels won by aiming with the formula | — | __R__ |
| Chance Machine | Galton board is binomial, tilted board averages 10·p, 1/2/3-dice sums, coin flips (seeded random, chi-square) | χ² | __R__ |
| Circuit Lab | Ohm's law (meter), series and parallel resistance, battery internal resistance, short circuit, burnout | 0.6% + 1% | __R__ |
| Rainbow Piano | Key frequencies = 261.63·2^(n/12) Hz | 0.02 Hz | __R__ |
| Number Forge / Potion Lab | All 15 forge levels and every Make-24 deal solvable; all 12 potion targets pourable (independent search) | exact | __R__ |
| Shape Lab | Names, area, perimeter, angle sum (n−2)·180°; regular polygons 3–8; Pythagoras 3-4-5 / 6-8-10; C = 2πr, A = πr²; cos/sin/tan at special angles | 0.01 | __R__ |
| Graph Rider | Every curve family can reach its target track and collect every star; slope and area during the ride | — | __R__ |
| Math Art | Golden angle 137.5°; spirograph star has R/gcd(R, r) points; tree tips 2ⁿ⁻¹ and branches 2ⁿ−1; Mandelbrot membership of the tapped point | exact | __R__ |
| Laser Lab | Reflection angle in = out (from the drawn beam), Snell's law through a turned glass block, parallel exit, prism deviation i₁ + i₂ − A, dispersion order, critical angle 41.8° | 0.01–0.2° | __R__ |
| Physics Lab | g = 9.80 and 1.617 m/s² (least-squares fit to the fall), energy conserved in free fall, bounce height ≈ e² | 1–3% | __R__ |
| Prime Garden | Sieve leaves exactly the 25 primes ≤ 100; factor trees = prime factorisation; GCD·LCM = a·b for all 12 pairs | exact | __R__ |
| Puzzle Box | Hanoi 3–7 disks in 2ⁿ−1; Lights Out solved by Gaussian elimination over GF(2); Sudoku 4×4/6×6 unique and solved by backtracking | exact | __R__ |
| Element Box | Sand and water counts conserved; oil above water above sand | exact | __R__ |
| Space Orbits | T²/a³ equal for 8 planets and = 4π²/GM; energy and angular momentum conserved over 40 s on an ellipse; orbits kept on resize | 2%, 1%, 1e-6 | __R__ |
| Splash Lab | Floating depth = density for six toys (time-averaged); sinkers sink; water conserved; colour mixing | 0.08 | __R__ |
| Wave Lab | Pendulum period vs 4√(L/g)·K(sin θ₀/2) on four worlds; 60° swing 7% slower than 2π√(L/g); pendulum-wave lengths; ripple λ = v/f measured from the pixels; interference node; string harmonics n·f and n + 1 nodes | 2%, 15% (pixels) | __R__ |

## Performance

__PERF__

## Offline

__OFFLINE__

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

## Where things are

- Tests: `tests/*.spec.mjs` (helpers in `tests/helpers.mjs`).
- Last run: `test-results/results.json` (machine-readable), `test-results/html/index.html` (report),
  `test-results/artifacts/` (screenshots of every game on every touch screen, traces and screenshots of any failure).
  `test-results/` is not committed; run `npm test` to recreate it.
