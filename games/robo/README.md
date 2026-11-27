# Robo Code (`robo`)

**What it is:** first programming. Snap blocks (moves, a repeat loop, and a "My move" function) to guide a robot to the
gems.
**Home tile:** Think Lab · ages 6+ · "Snap code blocks together. Loops make it shorter!"

## How it plays
- Seven levels. Tap blocks to add them to the program, Run, and watch the running block light up step by step.
- Walls bonk; leftover gems are reported; Reset stops a running robot; blocks can be deleted.
- Solving within the level's best block count (par) earns a star; otherwise a hint says how many blocks it could take.
- Keyboard: arrows add moves, R adds a repeat, Enter runs, Backspace removes the last block.

## Code map
- `robo.js`: `LV` (levels), `prog` (main program), `fnBody` ("My move"). Programs are capped at 2,000 moves and 30 blocks.
  Styles in the shared `css/app.css` (`.rkeep` keeps the code blocks on screen). Test hook: `GAMES.robo._debug`
  (setProg, go, load, gems, run, LV, li, prog, fnBody, rob).

## Done (covered by tests, `14-think-lab` › 23 Robo Code)
- All seven levels can be programmed in the best number of blocks.
- Walls, leftover gems, Reset and deleting blocks.
- The block limit, the loop counter and ⭐ inside My move are handled with a hint.
- The running block is highlighted step by step.

## Several children at once
Tap-based on one shared program.

## History (audit)
- A "My move" that called itself crashed Run; nine nested loops froze the browser; "My move" showed on every level:
  all fixed (⭐ inside My move refused, 2,000-move cap, 30-block limit).

## Not done / known gaps
- Only seven levels.
- Blocks are moves, a repeat loop and My move: there is no condition block ("if wall ahead").

## Keep it this way
- Keep the move cap and block limit: they stop runaway programs on a child's device.

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
