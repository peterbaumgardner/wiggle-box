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

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ○ · Reading ○ · Talking ○ · Maths ● · Creative ◐ · Critical ●
**Aims at ages:** 6-10 · **Four pillars (estimate, 0-3):** Active 3 · Engaged 2 · Meaningful 1 · Social 1

What it teaches now:
- Combining numbers with + − × ÷ to hit a target; fifteen climbing levels and a Make 24 mode; refused moves explained.

Upgrades, most learning first:
1. **Many ways** (`create.remix`, rule 3): after a win, show another way to make the same target; a star for finding a second way.
2. **Adaptive targets** (`learn.level('math.add')`): sizes and operations follow the child.
3. **Younger layer** (ages 5-6): two cards, plus only, dots shown on each card (rule 6).
4. **Say the sum** (`talk.explain`): the one-line formula read aloud with voice on.

"Talk about it" questions (`learn.talk`):
- Can you find another way to make this number?
- Which is faster, adding or times? Why?
- Make 10 with the fingers on your hands in two different ways.

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
