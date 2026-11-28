# Potion Lab (`potion`)

**What it is:** fractions by pouring. Tap fraction bottles (1/2, 1/3, 1/4...) to fill a beaker exactly to the magic
line; the beaker shows the sum as a fraction, decimal and percent.
**Home tile:** Math Lab · ages 6+ · "Pour fraction bottles to hit the magic line."

## How it plays
- Tap a bottle to pour it. Too much warns ("Too much! Undo or empty the beaker."); Undo and Empty fix it.
- Levels climb through bottle sets: halves and sixths first, later thirds, quarters, eighths, twelfths and more.

## Code map
- `potion.js`: `gen()` builds each level from a pool of denominators that grows with the level. Styles in the shared
  `css/app.css`. Test hook: `GAMES.potion._debug` (target, bottles, pourB, lvl, gen, setLvl, pours).

## Done (covered by tests, `13-math-lab` › 15 Potion Lab)
- Twelve levels: the target can always be poured exactly by tapping bottles; the beaker shows the right sums.
- Too much warns; Undo and Empty fix it.

## Several children at once
Tap-based: every tap pours one bottle into the shared beaker.

## History (audit)
- A win's delayed timers kept running after Start over or a level change and could jump to the wrong level: fixed.

## Not done / known gaps
- After the last bottle set the levels keep using that set (no further progression).

## Keep it this way
- Every target must be exactly pourable from the bottles offered (the test checks twelve levels).

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ○ · Reading ○ · Talking ○ · Maths ● · Creative ○ · Critical ◐
**Aims at ages:** 6-10 · **Four pillars (estimate, 0-3):** Active 3 · Engaged 2 · Meaningful 2 · Social 1

What it teaches now:
- Adding fractions by pouring to an exact line, with fraction, decimal and percent shown.

Upgrades, most learning first:
1. **Fraction number line** (`math.numberline`, research #5): the beaker's level also shown on a 0-1 line with the fractions marked.
2. **Younger layer** (`math.compare`, ages 4-6): halves and quarters only, "full", "half full" words.
3. **Adaptive pools** (`learn.level('math.fractions')`): bottle sets move up and down with success instead of only up.
4. **Recipes** (`create.design`): make your own potion recipe card that adds to 1.

"Talk about it" questions (`learn.talk`):
- Is a half bigger or smaller than a third? How do you know?
- Where do you use halves in the kitchen?
- How many quarters make a whole?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
