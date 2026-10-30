# Wiggle Box audit and repair

Branch `repair/full-functional-audit`, started from `main` at `8a98c57`. Nothing has been merged or deployed.

This file lists what was wrong and what changed. Which tests prove each game works is in
[WIGGLE_BOX_GAME_MATRIX.md](WIGGLE_BOX_GAME_MATRIX.md); how the tests were run, the numbers and the known limits are in
[WIGGLE_BOX_TEST_REPORT.md](WIGGLE_BOX_TEST_REPORT.md).

## How the app is built

- Originally one static page, `index.html` (about 4,400 lines) holding all CSS and code. It is now split: `css/app.css`,
  `js/core.js` (shared), one file per game in `games/`, and `js/app.js` (home screen and sessions). Still no build step; see the README.
- `matter.min.js` (Matter.js 0.19) is used only by Physics Lab, loaded on demand.
- `sw.js` is the offline cache; `manifest.webmanifest` and `icons/` make it installable.
- Every game draws into `#stage`. Most science and math games use a shared shell (`labShell`: top bar, canvas, info
  tabs); the sandboxes (Physics, Element Box, Space, Splash) use a canvas plus a tool dock.

## What I added for testing

- `window.WiggleBox` (read-only: the game registry, which game is ready, the current session) and a `_debug` object on
  each game that exposes state for the tests to read (scores, bodies, grids). The tests drive the games through real
  clicks, taps and drags; `_debug` is used to read results and, in a few science checks, to set up a measurement
  (for example dropping six toys into the pool at once). It is never needed to play.
- A Playwright suite in `tests/`, a dependency-free static server (`tests/server.mjs`), and
  `tools/stamp-sw.mjs` for the service worker version.

## Defects found and fixed

Each item says what a child would have seen, why, and what changed. "Test" names the test that failed before the fix
and passes now. D01–D19 were reproduced on the original code before any fix (baseline run: 19 failed).

### Shared code (affects every game)

| # | What went wrong | Cause | Fix | Test |
|---|---|---|---|---|
| S1 | Tapping ← while a game was still starting crashed it or left a half-built game; a double tap on a tile started two copies on top of each other | The game started on the next animation frame with no check that it was still wanted | Each visit is a *session*; leaving cancels everything it started; opening a game stops any game still starting; a game that throws while starting shows "Oops! This game got stuck" instead of a blank screen | D01, D02, 02-lifecycle |
| S2 | On 120 Hz tablets every game ran at double speed; on slow screens, slow motion | Loops advanced one step per screen refresh | A fixed 60-steps-per-second loop shared by all games (at most 2 steps per frame, pauses when the tab is hidden) | 18-performance (30/60/120 Hz) |
| S3 | Each visit left listeners and observers behind (toolbar resize, hint, info tabs), slowly slowing the app | Registered on `window`/the shared stage and never removed | Registered through the session, removed on exit | 02-lifecycle leak test, 18 memory test |
| S4 | Taps on dragged pieces fired twice: double name pop-ups, a buzz and a shake right after a correct drop | `pointerup` and `lostpointercapture` both ended the drag | One ending per drag; a cancelled touch is not a tap | D03, D04 |
| S5 | The sound button did not silence long sounds (Wave Lab string); audio kept running in a hidden tab | Sounds were not told about the toggle | Sound hooks; the audio context suspends while hidden | D18, 16 string test |
| S6 | A corrupted saved star count could show a negative number | No validation | Clamped to ≥ 0, unreadable storage tolerated | 02-lifecycle storage tests |
| S7 | Folding the info bar also hid controls that live in it (Robo Code's program, the seesaw's blocks) | The fold rule hid the whole panel | Controls marked `.keep` stay visible | 10, 14 |
| S8 | **A phone on its side left 30–150 px for the game** (Robo Code: a 32 px strip; Physics Lab: 97 px) | Header, toolbars and info cards were all stacked above/below the play area | Short landscape layout: slim header column on the left, docks and info on the right; play areas are now about 450×310 px or more on an 844×390 phone | 20-layout on four touch screens |
| S9 | Robo Code's "My move" box showed on every level, and blocks put into it on early levels silently counted against the block limit | A card style overrode the `hidden` attribute | `[hidden]` always wins | 14, 20-layout |
| S10 | In every sandbox the open info card covered the floor (where sand settles, water pools, toys sink), and the see-through strip beside the info tabs swallowed taps along the whole bottom edge | Card opened by default on big screens; the strip took pointer events | Cards start folded; only the tabs take taps | 16 Element Box discoveries (painting along the floor) |
| S11 | Offline: the cache could store stale files from the browser cache, a server error page could replace the stored app, the version was hand-edited (risking a mix of old and new files), and one manifest icon was never cached | Precache used the HTTP cache; navigations were cached regardless of status | Precache with `cache: 'reload'`; only a real `200` page is stored; version = content hash (`npm run stamp`, checked by a test); all icons cached; old caches removed on activate | 17-offline |

### Per game

| Game | What went wrong | Fix | Test |
|---|---|---|---|
| Atom Builder | Dragging an atom onto another often missed: the held atom and its bonds pushed the target away | Held atoms don't repel; their bond springs pause while held | 10 bonding tests |
| Balance Scale | Tapping an empty pan added a dead step to Undo; Undo on the seesaw left the equation wrong; the seesaw block picker and the how-to line sat in a panel that is always hidden | Undo only records real moves and re-syncs; picker moved into a visible card | D09, D10, 10 |
| Bridge Builder | **The physics was backwards**: a bare road held the truck and adding triangles made bridges fail; results changed with screen size; opening an info tab erased the bridge | New pin-jointed truss model (stiffness, strain limits, self-weight, real collapse); levels set in grid squares; bridge kept on resize | D05, 10 bridge tests (deck alone fails every level, a truss passes, steel beats wood, same result on every screen) |
| Bridge Builder (found after the first release) | The truck jumped onto whichever road was highest, so a road floating three squares above the ground, on top of a truss, still carried it across | The truck follows the surface it's on: a road must meet the ground at the same height, can't be steeper than 35°, and a road ending in mid-air drops the truck | 10 "the truck only drives on road that meets the ground" |
| Cannon Launch | A fast ball could pass through the wall on a slow frame | Collisions checked every 4 ms of flight | 11 (20 fps no-tunnel test) |
| Chance Machine | With one die the panel claimed 1 was the most likely roll | Ties are reported as ties | D15 |
| Circuit Lab | Parts at the edge broke when the screen narrowed; two bulbs in series on two batteries counted as "parallel"; two separate loops counted as "series" | Board never shrinks under parts; series/parallel read from the real wiring (nodal analysis) | D06–D08, 11 circuit tests |
| Magic Paint | No eraser; Undo of the first stroke left it on the page (the saved blank sheet was transparent and was drawn over the stroke) | Eraser swatch and key; Undo clears to white before restoring | 12 paint tests |
| Shape Sorter | **A shape dropped in its hole turned into a grey dashed outline** (looked like the hole was still empty) | Outline style no longer reaches the placed shape | 12 shape sorter |
| Rainbow Piano | Lit keys stayed lit after switching mode | Cleared on switch | 12 piano |
| Letter Trace | Finishing a letter and quickly the next one skipped a letter | Stale auto-advance timers ignored | 12 (all 36 letters and numbers) |
| Number Forge | After a refused move (uneven division, negative answer) every tap repeated it; the hint suggested something impossible | Refused moves clear the selection | 13 forge |
| Potion Lab | A win's delayed timers kept running after Start over or a level change and could jump to the wrong level | Timers tied to the level they belong to | 13 potion |
| Shape Lab | "Make it perfect" on a triangle wasn't called equilateral; the circle/Pythagoras handles ran away from the finger while dragging | Relative tolerances; the view only re-zooms after the finger lifts | D13, 13 shape lab |
| Graph Rider | The growth curve had no handle for its starting value, so some star levels could only be solved by luck; a stale timer could fire after a level change | Second handle at x = 0 for growth curves; timers tied to the level | 13 graph rider |
| Math Art | Leaf-tip count on the panel didn't match the tree drawn; arrow keys did nothing in three modes | Formulas 2ⁿ⁻¹ / 2ⁿ−1 fixed; keys added | D14, 13 math art |
| Laser Lab | Glass blocks ignored their angle, so tapping one did nothing | Glass rotates (geometry and drawing) | 15 Snell test |
| Physics Lab | **The tap that added a balloon popped it**, a new bomb went off at once, a new car flipped; on the Moon there was air drag and balloons floated; a puzzle broke when the screen turned; an offline first load hung forever | Spawning tap isn't a tap on the thing; no air (drag, buoyancy, fan wind) on the Moon or in space; puzzles re-laid-out with the child's ramps; engine load retries | 15 physics tests |
| Prime Garden | A mode switch mid-sieve kept wilting; the common-factor pair could repeat | Steps tied to the mode; next pair differs | 14 primes |
| Puzzle Box | Switching puzzles right after winning Lights Out swapped the new puzzle back | Post-win timers check the mode | D17, 14 puzzles |
| Robo Code | A "My move" that called itself crashed Run; nine nested loops froze the browser; "My move" visible on every level (S9) | ⭐ inside My move does nothing and is refused; programs capped at 2,000 moves; 30-block limit with a hint | D11, D12, 14 robo |
| Element Box | Oil equation wrong; winter snow kept falling into the next scene | Equation corrected; snow stops with its scene | 16 element box |
| Space Orbits | Rotating the screen flung planets out of orbit | Positions and speeds scale with the screen, GM ∝ k³ | D19, 16 space resize |
| Wave Lab | Turning sound off left the string humming; leaving the game did too | Oscillator really stops | D18, 16 string |
| Hungry Monster, Word Builder, Bubble Pop, Firework Sky, Splash Lab | Timer races when tapping fast or leaving (handled by the session); no game-specific wrong behaviour found | — | 12, 16 |

### Checked and found correct

These are science and math claims the tests compared against independent calculations (not the game's own formulas):
elements 1–20 and ions; molecule bonding; torque balance; truss behaviour; projectile range, height and flight time on
four planets; Galton board and dice distributions (chi-square); Ohm's law, series and parallel resistance; prime sieve,
factorisation, GCD/LCM; Tower of Hanoi optimum; Lights Out solvability (GF(2)); Sudoku uniqueness; reflection, Snell's
law, prism dispersion and the critical angle; free fall (9.8 and 1.62 m/s²), energy conservation, bounce height; Kepler's
third law, orbital energy and angular momentum; Archimedes (floating depth = density); density layering in Element Box;
pendulum period including the large-angle correction on four worlds; ripple wavelength and two-source interference;
string harmonics.
