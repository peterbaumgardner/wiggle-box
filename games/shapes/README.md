# Shape Sorter (`shapes`)

**What it is:** the classic toddler shape sorter. Drag each shape into the hole that matches it, whatever its tilt.
**Home tile:** Play & Learn · ages 2+ · "Drag each shape to its home"

## How it plays
- Each round picks 4 to 6 of: circle, square, triangle, star, heart, diamond (more as the child places shapes without
  mistakes, via `learn.level('math.shapes')`). Shapes are tilted; they fit only their own hole.
- A full board gives cheers, a star and a new round.
- Keyboard: Tab to a shape, Enter to pick it up, Tab to a home, Enter to drop.

## Code map
- `shapes.js` (small): SVG shapes; dragging uses the shared `draggable()` from `js/input.js`.
- Styles in the shared `css/app.css` (`.holes`, `.hole`, `.piece`, `.pile`).

## Done (covered by tests)
- `12-play-and-learn` › 10: every shape fits only its own hole, whatever its tilt; a full board gives a star and a new
  round; keyboard pick-and-drop works.
- `20-layout-touch`: a shape dragged by a finger drops into its hole.
- `30-learning`: placing a shape records `math.shapes` in the learning layer.

## Several children at once
Yes: each shape is its own draggable, so different children can drag different shapes at once.

## History (audit)
- A shape dropped in its hole turned into a grey dashed outline (looked like the hole was still empty): fixed.

## Not done / known gaps
- At most six shapes, all different kinds; no lookalike shapes (square vs rectangle) yet.
- No test hook (`_debug`); tests read the DOM.

## Keep it this way
- The hole's dashed outline style must not reach a placed shape (`.hole>svg *` only).

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ● · Reading ○ · Talking ○ · Maths ◐ · Creative ○ · Critical ◐
**Aims at ages:** 2-5 · **Four pillars (estimate, 0-3):** Active 2 · Engaged 3 · Meaningful 2 · Social 1

What it teaches now:
- Matching six shapes to holes regardless of tilt (early mental rotation); colour and shape names on each piece.
- Wired to the learning layer: each drop records `math.shapes` (right or wrong); rounds grow from 4 to 6 shapes as the child gets them right; a "find this shape in the room" question after a full board (off-screen follow-up).

Upgrades, most learning first:
1. **Bigger rotations and lookalikes** (`math.spatial`, rule 7): at higher levels shapes turn further and similar shapes appear (square vs rectangle, oval vs circle).
2. **Feel-for-it holes** (`think.sort`): holes become shadows or outlines only, then a description ("3 sides").
3. **Sort by two rules** (`think.sort`): later rounds sort by colour *and* shape into a 2×2 grid.
4. **Build a picture** (`create.make`): shapes placed on a board make a house or a rocket, then the game names what each shape became.
5. **Count the sides** (`math.count`): placing a shape counts its sides and corners out loud.

"Talk about it" questions (`learn.talk`):
- Can you find something shaped like a circle in the room?
- Which shape was the trickiest? Why?
- What would a house look like made only of triangles?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
