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

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
