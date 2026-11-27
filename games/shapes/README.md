# Shape Sorter (`shapes`)

**What it is:** the classic toddler shape sorter. Drag each shape into the hole that matches it, whatever its tilt.
**Home tile:** Play & Learn · ages 2+ · "Drag each shape to its home"

## How it plays
- Each round picks 4 of: circle, square, triangle, star, heart, diamond. Shapes are tilted; they fit only their own hole.
- A full board gives cheers, a star and a new round.
- Keyboard: Tab to a shape, Enter to pick it up, Tab to a home, Enter to drop.

## Code map
- `shapes.js` (small): SVG shapes; dragging uses the shared `draggable()` from `js/input.js`.
- Styles in the shared `css/app.css` (`.holes`, `.hole`, `.piece`, `.pile`).

## Done (covered by tests)
- `12-play-and-learn` › 10: every shape fits only its own hole, whatever its tilt; a full board gives a star and a new
  round; keyboard pick-and-drop works.
- `20-layout-touch`: a shape dragged by a finger drops into its hole.

## Several children at once
Yes: each shape is its own draggable, so different children can drag different shapes at once.

## History (audit)
- A shape dropped in its hole turned into a grey dashed outline (looked like the hole was still empty): fixed.

## Not done / known gaps
- Four shapes per round, from six kinds; no harder rounds (more shapes, similar shapes).
- No test hook (`_debug`); tests read the DOM.

## Keep it this way
- The hole's dashed outline style must not reach a placed shape (`.hole>svg *` only).

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
