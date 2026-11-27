# Number Forge (`forge`)

**What it is:** combine number cards with + − × ÷ (and powers) to make a target number; a "Make 24" mode with four cards.
**Home tile:** Math Lab · ages 6+ · "Smash numbers together to make the target."

## How it plays
- Tap a card, an operation, then another card: they forge into a new card. Hit the target (using every card earns a
  star). Undo, Start over, Hint.
- Two modes: 🔨 Forge (fifteen climbing levels) and 🃏 Make 24 (four cards, make 24).
- Refused moves (uneven division, negative answers, huge powers) give a hint and clear the selection.

## Code map
- `forge.js`: `solve()` finds a solution (used to guarantee solvable deals and for Hint). Styles in the shared
  `css/app.css`. Test hook: `GAMES.forge._debug` (cards, target, solve, pick, opsFor).

## Done (covered by tests, `13-math-lab` › 14 Number Forge)
- Fifteen climbing levels: every puzzle is solvable with all its cards; the one-line formula is right.
- Make 24: every deal can make 24, and playing the solution wins.
- Uneven division, negative answers and huge powers are refused with a hint; Undo, Start over and Hint work.

## Several children at once
Tap-based with one selection: it's a take-turns game.

## History (audit)
- After a refused move every tap repeated it, and the hint suggested something impossible: fixed.

## Not done / known gaps
- No fractions or decimals (by design: only whole-number results are allowed).

## Keep it this way
- Every deal must be solvable (`solve()`); keep refusing non-whole and negative results.

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
