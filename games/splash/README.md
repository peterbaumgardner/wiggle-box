# Splash Lab (`splash`)

**What it is:** a water tank for the youngest scientists. Pour coloured water, watch colours mix, and drop toys in to see
what floats and what sinks. Under the hood it's a real particle fluid with buoyancy.
**Home tile:** Science Lab · ages 2+ · "Pour water, mix colors, see what floats"

## How it plays
- Drag a finger through the water to push it around; pour from the nozzle; tools in the dock: toys, walls (draw a
  wall), springs/fountains, sponge, drains.
- Toys (picked from a menu, dropped with a tap) float or sink by their density; fish and octopus swim inside the water.
- Paint mixing uses RYB rules (yellow + blue = green, red + yellow = orange), with a "colour-mix detective" message.
- Scenes (several presets, including a dam to break).

## Code map
- `splash.js`: `FluidSim` class at the top (double-density relaxation, Clavet et al. 2005; capsule walls, rigid toys,
  Archimedes buoyancy by measuring the area under the water line), then the game (`defineGame('splash')`).
- Styles: still in the shared `css/app.css` (not yet moved into this folder).
- Test hook: `GAMES.splash._debug` (sim, perf, scene, TOYS, tool, springs, addToy).

## Done (covered by tests)
- Archimedes: a floating toy sits with the fraction under water equal to its density (`16-science-labs` › 26 Splash Lab).
- Sinkers reach the bottom; fish hover inside the water and never jump out above the surface.
- Water is conserved and stays inside the tank; drains, sponge, walls and fountains work.
- Colour mixing: yellow + blue = green, red + yellow = orange.
- Every scene runs without NaN; breaking the dam lets the water out.
- A toy can be picked from the menu and dropped with a tap.
- Opens, closes and reopens cleanly with nothing left running; fits phone and tablet in both orientations.

## Several children at once
Every finger is tracked separately (`fingers()`): each finger can hold its own toy, draw its own wall or stir the water.
A toy already held by one finger can't be grabbed by another.

## History
- Fish and octopus used to wander above the water surface and jump out; they now swim to targets kept inside the water
  every frame (commit "Fix flaky Atom Builder, Hungry Monster lifecycle, Splash Lab...").

## Not done / known gaps
- One of the two heaviest games for frame rate (with Element Box); only measured in a 2-core container with software
  rendering (`WIGGLE_BOX_TEST_REPORT.md` › Performance), never on a real tablet.
- Spoken narration calls `say()`, which is switched off app-wide (`VOICE=false` in `js/sound.js`).
- No saved tanks: a scene is lost when the child leaves.

## Keep it this way
- Physics claims are tested against independent formulas: run `npm run test:game -- "Splash Lab"` after any change to
  `FluidSim`.
- Keep the fish target clamped inside the water (see the comment in the fish update) or the "fish hover" test breaks.

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
