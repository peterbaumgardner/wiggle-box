# Chance Machine (`chance`)

**What it is:** probability you can watch: a bean machine (Galton board) builds a bell curve, dice sums, coin flips.
**Home tile:** Math Lab · ages 7+ · "Drop 1,000 balls. Watch a bell curve appear."

## How it plays
- **Bean machine:** Drop 1 / 10 / 200 balls (a tap drops one). Slide a finger sideways to tilt the board: that sets p,
  the chance each ball bounces right.
- **Dice:** roll 1, 2 or 3 dice, 1 / 100 / 1,000 times; the sums chart fills in.
- **Coins:** flip 1 / 10 / 1,000; percentage heads and streaks.
- Clear resets.

## Code map
- `chance.js`. Styles in the shared `css/app.css`. Test hook: `GAMES.chance._debug` (bins, total, sums, rolls, coins, p).

## Done (covered by tests, `11-cannon-chance-circuit` › 05 Chance Machine)
- 1,000 balls make a binomial bell curve (chi-square); average and chart agree.
- Sliding sideways tilts the machine; a tilted machine averages 10·p.
- 1, 2 and 3 dice follow the exact sum distributions.
- 1,000 coin flips land near 50% heads; streaks and Clear work.

## Several children at once
Any finger drops balls or tilts the board; all share one machine.

## History (audit)
- With one die the panel claimed 1 was the most likely roll: ties are now reported as ties.

## Not done / known gaps
- No custom dice (e.g. 4- or 20-sided) and no spinner.

## Keep it this way
- Statistical tests use chi-square; seeded randomness comes from the test helper, not from the game.

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
