# Graph Rider (`graph`)

**What it is:** a function is a roller-coaster track. Shape the equation so a rider on the track collects every star.
**Home tile:** Math Lab · ages 8+ · "Bend the track with equations. Ride through the stars."

## How it plays
- Five families: Line (y = mx + b), Parabola (y = a(x − h)² + k), Wave (y = A·sin(Bx) + D), V shape (y = a|x − h| + k)
  and Growth (a·rˣ).
- One finger slides the whole track; the pink dots change its shape (Growth has two: a at x = 0, and r). Two fingers
  twist (slope) or pinch (steepness). Ride sends the rider; slope and area show during the ride.
- Keyboard: arrows slide, +/− bend, Space rides, 1-5 pick a family.

## Code map
- `graph.js`: `FAM` table (parameters with ranges, the function, its derivative, the equation as HTML, a level
  generator). Styles in the shared `css/app.css`. Test hook: `GAMES.graph._debug` (q, target, stars, setQ, ride, FAM...).

## Done (covered by tests, `13-math-lab` › 17 Graph Rider)
- In every family the target track is reachable on the control grid and riding it collects every star.
- Missing a star fails the ride with a hint; slope and area during the ride are right.
- Dragging the track and its pink dots changes the equation; Growth has a dot for a and one for r.
- Extreme settings never show NaN or Infinity.

## Several children at once
One track: fingers act as one- and two-finger gestures on it, not as separate players.

## History (audit)
- The growth curve had no handle for its starting value, so some levels could only be solved by luck: fixed with the
  second dot. A stale timer could fire after a level change: fixed (timers tied to the ride).

## Not done / known gaps
- Levels are random from each family's generator; there is no fixed lesson order.

## Keep it this way
- Every generated target must stay reachable on the control grid (the test checks every family).

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
