# Puzzle Box (`puzzles`)

**What it is:** four classic logic puzzles: Tower of Hanoi, Lights Out, Binary, and Sudoku-style number grids.
**Home tile:** Think Lab · ages 6+ · "Towers, lights, binary and number grids."

## How it plays
- **Tower of Hanoi:** 3 to 7 disks; illegal moves are refused; solving in the fewest moves (2ⁿ − 1) earns a star.
- **Lights Out:** 3×3, 4×4 and 5×5 boards (always solvable); a new board follows a win.
- **Binary:** light bits to make the target number; place values are powers of two.
- **Number grids:** 4×4 and 6×6 Sudoku with exactly one solution; clashes turn red; Erase.

## Code map
- `puzzles.js`: state objects `H`, `LO`, `BI`, `SU`; `countSol` checks uniqueness. Sizing uses container queries
  (`.pzl` in the shared `css/app.css`). Test hook: `GAMES.puzzles._debug` (H, LO, BI, SU, press, setMode, countSol).

## Done (covered by tests, `14-think-lab` › 22 Puzzle Box)
- Hanoi 3-7 disks solved in the fewest moves earns the star; illegal moves refused.
- Lights Out 3×3, 4×4, 5×5 can be cleared; a new board follows (solvability checked over GF(2)).
- Binary targets made by lighting bits.
- Number grids always have one solution; clashes turn red; Erase works; solving wins.

## Several children at once
Tap-based on one shared board.

## History (audit)
- Switching puzzles right after winning Lights Out swapped the new puzzle back: fixed (post-win timers check the mode).

## Not done / known gaps
- No 9×9 Sudoku; no difficulty choice for Lights Out beyond board size.

## Keep it this way
- New Sudoku boards must keep exactly one solution (`countSol`).

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
