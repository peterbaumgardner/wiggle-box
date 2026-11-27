# Space Orbits (`space`)

**What it is:** a gravity playground. Fling planets around the Sun, watch real orbits form, tap planets for facts.
**Home tile:** Science Lab · ages 4+ · "Fling planets around the Sun and learn about them"

## How it plays
- Flick from empty space to throw a planet (a tap makes a circular orbit). Tap a planet or the Sun for a fact.
- Options: black hole instead of the Sun, fast forward, planet names, orbit paths, clear, planet menu (the eight real
  planets).

## Code map
- `space.js`: Earth's orbit radius = 1 in the solar-system layout; integration of every body each step.
  Resizing rescales positions and speeds by k and GM by k³, so orbits keep their shape and timing.
- Styles: in the shared `css/app.css`.
- Test hook: `GAMES.space._debug` (bodies, simT, gm, hole, fast, names, paths, focus...).

## Done (covered by tests, `16-science-labs` › 25 Space Orbits)
- Kepler's third law: T²/a³ is the same for all eight planets and equals 4π²/GM.
- A thrown planet keeps its energy and angular momentum over a long run (no drift).
- Tap makes a circular orbit; black hole, fast, names, paths, clear, planet menu and facts work.
- Rotating the screen keeps every orbit (same shape, same timing).

## Several children at once
Several fingers can aim and throw planets at the same time (each finger is its own throw).

## History
- Rotating the screen used to fling planets out of orbit: fixed with the k / k³ rescale (audit D19).

## Not done / known gaps
- Facts use `say()`, which is silent app-wide (voice off); the facts also show on screen.

## Keep it this way
- Any change to the integrator must keep the energy/angular-momentum test passing (long-run drift).

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
