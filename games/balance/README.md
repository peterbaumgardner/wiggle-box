# Balance Scale (`balance`)

**What it is:** algebra on a pan balance. Find the weight of the mystery box x by taking the same thing off both sides,
and a seesaw mode that teaches torque (weight × distance).
**Home tile:** Math Lab · ages 6+ · "Find the mystery box. Keep the scale level."

## How it plays
- **Algebra (📦 Mystery box):** ten levels of the form ax + b = cx + d, some with boxes on both sides. Tap blocks (or a box) on a pan to take them off both sides together; split
  groups; an unbalanced move shows ≠ and the scale tilts. Undo. The equation steps are written out as you go.
- **Seesaw (🛝):** put blocks on pegs so the seesaw balances; the torque maths is shown.

## Code map
- `balance.js`: two modes (`alg`, `torque`). Styles in the shared `css/app.css`. Test hook: `GAMES.balance._debug`
  (L, R, x, take, split, solved, setMode, tq, items, li).

## Done (covered by tests, `10-atoms-balance-bridge` › 02 Balance Scale)
- All ten mystery-box levels can be solved by tapping, and x is right.
- Unbalanced moves show ≠ and the scale tilts; Undo puts things back.
- Every seesaw level can be balanced by tapping blocks and pegs, and the torque maths is right.

## Several children at once
Tap-based: every tap is one move on the shared scale. There is no per-finger dragging.

## History (audit)
- Tapping an empty pan added a dead Undo step; Undo on the seesaw left the equation wrong; the seesaw block picker sat
  in a panel that was always hidden: all fixed.

## Not done / known gaps
- A fixed set of ten algebra levels (listed in `balance.js`); no generator for more.
- Every answer is a positive whole number (x = 3, 4 or 5): no negatives or fractions yet.

## Keep it this way
- Undo must record only real moves (that was a past bug).

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ○ · Reading ○ · Talking ○ · Maths ● · Creative ○ · Critical ●
**Aims at ages:** 6-10 · **Four pillars (estimate, 0-3):** Active 3 · Engaged 2 · Meaningful 2 · Social 1

What it teaches now:
- Solving ax + b = cx + d by taking the same from both pans; torque on a seesaw. Ten fixed algebra levels.

Upgrades, most learning first:
1. **Generated levels** (`learn.level('math.algebra')`): new equations at the child's level after the ten fixed ones.
2. **Younger layer** (ages 4-6, `math.compare`): plain blocks, "which side is heavier?", make it level by adding.
3. **Explain a step** (`talk.explain`): after each move, the equation and a sentence ("took 2 from both sides, still level").
4. **Number line for x** (`math.numberline`): show x's value on a line when found.

"Talk about it" questions (`learn.talk`):
- Why do you have to do the same thing to both sides?
- How could you find out how heavy a mystery box is at home?
- What makes the seesaw tip?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
