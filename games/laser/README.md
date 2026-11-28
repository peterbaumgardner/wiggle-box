# Laser Lab (`laser`)

**What it is:** a light puzzle grid. Place and turn mirrors, splitters, glass blocks and prisms to steer laser beams onto
crystals; split white light into a rainbow.
**Home tile:** Science Lab · ages 7+ · "Bounce lasers off mirrors. Split light into a rainbow."

## How it plays
- Puzzle mode (six puzzles) and free play.
- Pieces: laser, mirror, splitter, glass, prism, target crystal (may need a colour), wall. Tap a piece to turn it; a
  second finger twists the selected piece. Puzzles give a limited stock of pieces; dragging one off the board returns it.
  Fixed pieces can't be moved.

## Code map
- `laser.js`: ray tracer over a grid of pieces `{k, i, j, a (angle), fixed, col, white}`; reflection, Snell refraction
  with dispersion (violet bends most), total internal reflection past the critical angle.
- Styles in the shared `css/app.css`. Test hook: `GAMES.laser._debug` (rays, pieces, trace, lit, load, add, setMode).

## Done (covered by tests, `15-laser-physics` › 19 Laser Lab)
- All six puzzles can be solved by tapping; every bounce obeys angle in = angle out.
- The prism fans white light: violet bends most, red least; red matches Snell through a 60° prism.
- Glass turns, bends red light by Snell's law and lets it out parallel; light is trapped only past the critical angle.
- Pieces run out, come back when dragged off the board; fixed pieces can't be moved.

## Several children at once
Fingers are tracked, but there is one selected piece: a second finger twists the selection rather than acting as a
second player.

## History (audit)
- Glass blocks ignored their angle, so tapping one did nothing: fixed.

## Not done / known gaps
- Only six puzzles.
- No lenses (only flat surfaces and prisms).

## Keep it this way
- Optics are tested against independent Snell/critical-angle maths: keep refractive indices and dispersion as they are
  unless you update the tests with sourced values.

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ◐ · Reading ○ · Talking ○ · Maths ◐ · Creative ◐ · Critical ●
**Aims at ages:** 6-10 · **Four pillars (estimate, 0-3):** Active 3 · Engaged 2 · Meaningful 2 · Social 1

What it teaches now:
- Reflection (angle in = angle out), refraction (Snell), prisms and the colours of white light; six puzzles and free play.

Upgrades, most learning first:
1. **Predict the beam** (`think.predict`): before turning a mirror, a ghost line shows where the child thinks the beam will go; then the real beam.
2. **Generated puzzles** (`think.plan`, `learn.level`): more than six, growing with success.
3. **Angle words and numbers** (`math.geometry`): the angle in and out shown on the mirror.
4. **Rainbow order** (`talk.vocab`, `think.sort`): the prism's colours named in order (red to violet).
5. **Younger layer**: one mirror, one target, a big "turn" button.

"Talk about it" questions (`learn.talk`):
- Where else have you seen a rainbow?
- Why does the mirror send the light that way?
- How could you get the light around a corner?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
