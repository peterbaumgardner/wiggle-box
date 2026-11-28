# Atom Builder (`atoms`)

**What it is:** the deepest science game. Build atoms from protons, neutrons and electrons (elements 1-20), snap atoms
into molecules that take their real 3-D shape, then send molecules to a reaction chamber and run experiments.
**Home tile:** Science Lab · ages 8+ · "Build real atoms, snap them into molecules, then make them react."

## How it plays
Three modes in the top bar:
- **Atom:** drag particles from the bins into the atom (or pull them out); tap a bin to add one. Shell picture or
  orbital clouds. Info cards: element, isotope stability, ion charge, chemistry, electron shells, elements discovered.
- **Molecule:** add atoms, drag between them to bond; tap an atom to undo its newest bond; flick it off the edge to
  remove it; drag empty space to turn the molecule in 3-D. Molecules are recognised from their structure.
- **Reactions:** a gas chamber with experiments; Spark, Hotter, Cooler, Reset, pause; energy diagram with real ΔH.

## Code map
- `atoms-sci.js`: **all the science** (element data, isotopes, electron configuration, molecule recognition, VSEPR
  shapes, bond lengths, reactions and the chamber), no DOM. Loaded first via the registry's `files`. Tested on its own in
  Node by `tests/31-atoms-science.spec.mjs`. Sources and intentional simplifications: `docs/ATOM_BUILDER_SCIENCE.md`.
- `atoms.js`: drawing and input only. `atoms.css`: keeps the "You built" note a steady height so the canvas never
  jumps under a finger.
- Test hook: `GAMES.atoms._debug` (set, mol, add, bond, atom, found, chamber, sci...).

## Done (covered by tests)
- `10-atoms-balance-bridge` › 01: all 20 elements built with the buttons (names, mass numbers, charge, shells,
  discoveries); ions, unstable nuclei, remove buttons; every molecule in the list built by dragging bonds; a full atom
  refuses a fourth bond; tap undoes a bond, flick removes an atom.
- `31-atoms-science` (no browser): molecules recognised by connectivity (ethanol vs dimethyl ether), Hill-order formulas
  and masses, bond lengths vs measured values, VSEPR shapes, formation enthalpies vs NIST, balanced reactions with
  literature ΔH, conservation of atoms/charge/energy every second, nothing burns without a spark.
- `32-atoms-ui`: building by hand with the canvas and atom staying put, experiments (pause, reset replays exactly, heat,
  catalyst, light, keys), lifecycle, touch screens, offline reactions.

## Several children at once
Atom mode moves one particle at a time (a single `grab`). Molecule mode keeps a set of bond drags, so several fingers
can drag bonds at once. Reactions: any finger can spark the chamber.

## History
- Science model, drag-to-build, connectivity-based molecules, reaction chamber: a dedicated rework.
- Dragging an atom onto another used to push the target away: held atoms no longer repel (audit).
- The info card resized as text changed, moving the bins under the child's finger: fixed with the steady note row.

## Not done / known gaps
- Elements 1-20 only.
- Simplifications listed in `docs/ATOM_BUILDER_SCIENCE.md` (e.g. the shell and orbital pictures are not to scale; the
  reaction barrier is a model).
- Age 8+: no simpler mode for younger children.

## Keep it this way
- Science goes in `atoms-sci.js`, drawing in `atoms.js`. Never put a number a child reads into `atoms.js`.
- Every value in `atoms-sci.js` has a source next to it; new values need one too, and `31-atoms-science` must pass.

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ◐ · Reading ◐ · Talking ○ · Maths ◐ · Creative ◐ · Critical ●
**Aims at ages:** 8-10+ · **Four pillars (estimate, 0-3):** Active 3 · Engaged 2 · Meaningful 2 · Social 1

What it teaches now:
- Building elements 1-20 from particles; isotopes and ions; molecules recognised by structure with real 3-D shapes; reactions with real energies. All science sourced and tested (`docs/ATOM_BUILDER_SCIENCE.md`).

Upgrades, most learning first:
1. **Teach Robo-Atom** (research #15): the child explains to a character why an atom is an ion; the character asks one follow-up question.
2. **Predict the reaction** (`think.predict`): before Spark, choose what will form from pictures.
3. **Younger layer** (ages 6-7): build atoms by count only ("2 protons makes Helium"), names and pictures of where the element is found.
4. **Element cards as print** (`reading.words`): each discovered element gets a card with its name and an everyday use.
5. **Counting and balance** (`math.count`, `math.algebra`): show reaction equations as balanced piles of atoms.

"Talk about it" questions (`learn.talk`):
- What is everything around you made of?
- Why do you think some atoms like to share electrons?
- What do you think happens to atoms when something burns?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
