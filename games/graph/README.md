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

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ◐ · Reading ○ · Talking ○ · Maths ● · Creative ○ · Critical ◐
**Aims at ages:** 8-10+ · **Four pillars (estimate, 0-3):** Active 3 · Engaged 2 · Meaningful 1 · Social 1

What it teaches now:
- Five function families (line, parabola, wave, V, growth) shaped by dragging; riding the track collects stars; slope and area shown.

Upgrades, most learning first:
1. **Draw it first** (`think.predict`, `math.graphs`): the child sketches where they think the track goes, then sees the real one.
2. **Story graphs** (`math.graphs`, ages 7-8): "the rider climbs slowly then fast" picks a shape; no equations needed.
3. **Lesson order** (`learn.level`): lines first, then V, then parabolas, waves and growth.
4. **Name the parameters** (`talk.explain`): "m makes it steeper" shown when a handle is dragged.

"Talk about it" questions (`learn.talk`):
- What would the track look like if the rider went faster and faster?
- Where do you see curves like this in real life?
- What does the number in front of x do?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
