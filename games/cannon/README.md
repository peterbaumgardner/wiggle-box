# Cannon Launch (`cannon`)

**What it is:** projectile motion with live formulas. Aim a cannon at a target over a wall; the panel shows range,
height and flight time.
**Home tile:** Science Lab · ages 8+ · "Aim, fire, and let the math find the target."

## How it plays
- Drag anywhere to aim: the cannon points at the finger, a longer pull is faster; let go to fire. A quick tap fires.
- Endless random levels: 1-3 a castle on the ground, 4-6 a balloon in the air, 7 and up a castle behind a wall.
  Planets with different gravity; a "show path" toggle (hitting with the path hidden earns a star).
- Keyboard: up/down angle, left/right power, Space fires.

## Code map
- `cannon.js`: the ball's position is the exact formula at each moment; collisions are checked every 4 ms of flight
  time. Styles in the shared `css/app.css`. Test hook: `GAMES.cannon._debug` (target, wall, set, fire, range, hmax, tof).

## Done (covered by tests, `11-cannon-chance-circuit` › 04 Cannon Launch)
- Panel formulas match independent projectile math on every planet.
- A fired ball follows the parabola exactly and lands at R unless it hits something.
- Dragging aims; levels 1-12 can all be won by aiming with the formula; the level advances.
- A ball on a slow (20 fps) screen still hits the wall instead of passing through.
- Path toggle, next level and planet keys work.

## Several children at once
One cannon: any finger aims it, the last one to let go fires. It's a take-turns game by nature.

## History
- A fast ball could pass through the wall on a slow frame: fixed (4 ms collision checks).

## Not done / known gaps
- No air resistance (by design: the formulas shown are the no-drag ones).
- Levels after 7 are all the same kind (castle behind a wall); there is no further progression.

## Keep it this way
- The panel formulas and the ball must agree: the test compares both against its own math.

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ◐ · Reading ○ · Talking ○ · Maths ● · Creative ○ · Critical ◐
**Aims at ages:** 7-10 · **Four pillars (estimate, 0-3):** Active 3 · Engaged 2 · Meaningful 2 · Social 1

What it teaches now:
- Projectile motion with live formulas for range, height and time on several planets; aiming by drag; endless levels.

Upgrades, most learning first:
1. **Estimate first** (`think.predict`, `math.measure`): before firing, drag a flag to where you think it will land; the gap is shown in metres.
2. **Adaptive levels** (`learn.level`): wall height and target distance grow with success instead of the fixed three kinds.
3. **Angle words and a protractor** (`math.geometry`): the angle shown on a protractor arc while aiming.
4. **Younger layer** (ages 5-6): no formulas, just "more power" / "higher" words and a picture target.
5. **Compare planets** (`think.evidence`): same angle and power on two planets, side by side.

"Talk about it" questions (`learn.talk`):
- Which angle sends the ball furthest? How could we test it?
- Why does the ball go further on the Moon?
- Where would you aim to get over a tall wall?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
