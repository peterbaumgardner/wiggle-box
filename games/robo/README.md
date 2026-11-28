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

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ○ · Reading ○ · Talking ○ · Maths ◐ · Creative ◐ · Critical ●
**Aims at ages:** 5-10 · **Four pillars (estimate, 0-3):** Active 3 · Engaged 2 · Meaningful 2 · Social 1

What it teaches now:
- Sequencing moves, loops and a function (My move) to collect gems; seven levels with a best block count.

Upgrades, most learning first:
1. **Generated levels** (`think.plan`, `learn.level`): more than seven, growing with success.
2. **Find the bug** (`think.debug`): levels that start with a program that almost works.
3. **Turn left / right blocks** (`math.spatial`): relative turns for older children.
4. **Teach Robo** (research #15): Robo "remembers" the child's My move and uses it in later levels.
5. **Younger layer** (ages 4-5): two-step programs with big arrows.

"Talk about it" questions (`learn.talk`):
- How did you know the robot would bump the wall?
- Can you make it with fewer blocks?
- Give someone at home directions to the kitchen like a robot.

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
