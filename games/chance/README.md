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

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ○ · Reading ○ · Talking ○ · Maths ● · Creative ○ · Critical ◐
**Aims at ages:** 6-10 · **Four pillars (estimate, 0-3):** Active 2 · Engaged 2 · Meaningful 2 · Social 2

What it teaches now:
- Bell curves from a bean machine (tiltable), dice sum distributions, coin flips and streaks.

Upgrades, most learning first:
1. **Bet first** (`think.predict`): before dropping 100 balls, place three counters where most will land.
2. **Fair or not?** (`think.evidence`): a secret weighted coin; how many flips until you can tell?
3. **Younger layer** (ages 5-6): one die, "which number comes up most?" with tally marks.
4. **Bar charts as graphs** (`math.graphs`): name the tallest bar and compare two bars.

"Talk about it" questions (`learn.talk`):
- Why does 7 come up most with two dice?
- Is it fair to choose who goes first with a coin?
- What games use chance?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
