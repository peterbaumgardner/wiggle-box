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

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
