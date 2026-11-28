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
- Narration (`say()`, 12 calls) is silent unless a grown-up turns Spoken words on.
- The registry blurb says 50 elements; if you add or remove elements, update the blurb in `games/registry.js`.

## Keep it this way
- New elements need: an entry in the element table (name, swatch, what it does), density/family if it moves, and a
  place in a menu group. Keep chunk sleeping working (`awakeChunks` test).
- Saves are versionless run-length codes: changing element numbers breaks old saves on children's devices. Add new
  elements at the end of the numbering.

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ◐ · Reading ○ · Talking ○ · Maths ○ · Creative ● · Critical ◐
**Aims at ages:** 3-10 · **Four pillars (estimate, 0-3):** Active 3 · Engaged 3 · Meaningful 2 · Social 1

What it teaches now:
- 50 elements that react (fire, water, plants, electricity, explosives), with discoveries that each earn a star; density layering.
- Freeze, single step and undo for watching causes.

Upgrades, most learning first:
1. **Element names as print** (`reading.words`): the element's name appears under the finger while painting.
2. **Discovery cards** (`think.cause`): each discovery shows "A + B = C" with pictures and a sentence, kept in a book.
3. **Predict mode** (`think.predict`): "what happens if lava touches water?" with three picture choices before trying.
4. **Challenges** (`think.plan`, `create.design`): "put out the fire", "grow a garden", "make a circuit light up".
5. **First layer for 3-5s**: a simple menu of 8 elements before the full 50.

"Talk about it" questions (`learn.talk`):
- What happened when the water touched the lava?
- Can you make something that has never been made before?
- How could we stop the fire spreading?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
