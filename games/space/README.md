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
- Facts use `say()` (silent unless a grown-up turns Spoken words on); the facts also show on screen.

## Keep it this way
- Any change to the integrator must keep the energy/angular-momentum test passing (long-run drift).

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ◐ · Reading ◐ · Talking ○ · Maths ◐ · Creative ◐ · Critical ◐
**Aims at ages:** 4-10 · **Four pillars (estimate, 0-3):** Active 3 · Engaged 3 · Meaningful 2 · Social 1

What it teaches now:
- Real orbits (Kepler's laws) from flicks; planet facts and names; black hole mode.
- Several children throw planets at once.

Upgrades, most learning first:
1. **Planet names as print** (`reading.words`): names shown next to planets by default for readers.
2. **Order the planets** (`think.sort`, `math.numberline`): drag the eight planets into order from the Sun, then see the real distances on a line.
3. **Size and speed comparisons** (`math.compare`): closer planets go faster; the game says "Mercury went around 4 times while Earth went once".
4. **Make a moon** (`think.plan`): a challenge to put a moon around a planet.
5. **Facts read aloud** (voice switch) and short fact cards kept in a collection.

"Talk about it" questions (`learn.talk`):
- Why do you think the closer planets move faster?
- Which planet would you visit? What would you pack?
- What would happen if the Sun disappeared?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
