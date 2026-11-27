# Element Box (`sand`)

**What it is:** a falling-sand chemistry sandbox with 50 elements: sand, water, lava, plants, ice, fire, oil, acid,
electricity, TNT, fuses, fireworks, forces, black holes, ants and more. Mixing things makes discoveries (each earns a
star).
**Home tile:** Science Lab · ages 3+ · "50 elements: TNT, fuses, fireworks, circuits, black holes and more!"

## How it plays
- One slim bar; elements, tools, sizes and worlds open as pop-up menus.
- Tools: draw, erase, line, box, eyedropper ("copy what I tap"), wind (push and stir), heat and cool brushes.
- Freeze + single step, speed, undo (8 steps), zoom (grain size), save slots 1-3 and "last time".
- Worlds: volcano, garden, winter, tank, circuit, lab, boom, empty.

## Code map
- `sand.js`: one byte per cell for type `T`, life `L`, shade `Sh`, charge `Q`, fall speed `V`; updated bottom-up,
  alternating direction per row; 16×16 chunks that didn't change are skipped (settled piles cost nothing).
  Electricity follows wireworld rules (head → tail → rest).
- `sand.css`: the bar and menus (`eb-` classes).
- Saves: `localStorage` keys `wb-sand-slot1..3` and `wb-sand-auto` (run-length coded types).
- Test hook: `GAMES.sand._debug` (T, L, Q, found, scene, cols, rows, awakeChunks...).

## Done (covered by tests, `16-science-labs` › 24 Element Box)
- Fine 2 px grains fill a big world; zoom changes grain size and keeps the picture.
- Sand and water are conserved; liquids layer by density; sand sinks through them.
- Every discovery can be made, each earns a star, and the list shows them.
- Freeze, step, speed, undo, eraser, sizes, line, box, eyedropper and wind work.
- Every world runs; winter snow stops when you leave; saves round-trip; resize keeps the floor; settled worlds sleep.
- Ants never pass the cap of 300 (`MAX_ANTS`), even with a big brush.
- A finger paints sand on touch screens.

## Several children at once
Every finger paints, erases or draws a line/box on its own (per-finger state in `fingers()`). Undo is shared: it
undoes the last change by anyone.

## History
- Reworked twice: "fine 2px grains, 30 elements, electricity, tools people ask for", then "19 more elements".
- The oil equation was wrong and winter snow kept falling into the next scene: both fixed (audit).
- Ant cap could overshoot with a big brush: fixed by counting every ant a dab adds.

## Not done / known gaps
- One of the two heaviest games (with Splash Lab); frame rate never measured on a real tablet.
- Narration (`say()`, 12 calls) is silent because voice is off app-wide.
- The registry blurb says 50 elements; if you add or remove elements, update the blurb in `games/registry.js`.

## Keep it this way
- New elements need: an entry in the element table (name, swatch, what it does), density/family if it moves, and a
  place in a menu group. Keep chunk sleeping working (`awakeChunks` test).
- Saves are versionless run-length codes: changing element numbers breaks old saves on children's devices. Add new
  elements at the end of the numbering.

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
