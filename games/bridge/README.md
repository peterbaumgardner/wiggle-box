# Bridge Builder (`bridge`)

**What it is:** build a bridge across a gap from beams, then send a truck over it. Stress colours show which beams are
working hardest, and the lesson is real: triangles win.
**Home tile:** Science Lab · ages 7+ · "Build with triangles. Watch the stress, then send the truck."

## How it plays
- Drag from a dot (on a cliff or on your bridge) to make a beam, or tap a dot then tap where the beam should end.
- Three materials: wood (cheap), road (the deck the truck drives on) and steel (strong, costs more); each level has a budget and a truck mass. Erase, undo, clear.
- Go sends the truck; Stop puts everything back; Next changes level. A cheap bridge that holds gets "Cheap and strong!".

## Code map
- `bridge.js`: pin-jointed truss model (stiffness, strain limits, self-weight, real collapse). Everything is measured in
  grid squares, so the same bridge behaves the same on every screen. After a failure the pieces fall for real.
- Styles in the shared `css/app.css`. Test hook: `GAMES.bridge._debug` (nodes, beams, addBeam, go, result, peak).

## Done (covered by tests, `10-atoms-balance-bridge` › 03 Bridge Builder)
- A road with nothing holding it up sags and breaks; the same span with triangles holds, on every level.
- A wood truss that fails the heaviest truck holds in steel.
- The same bridge gives the same result and the same stretch on a different screen size.
- Building with real drags and taps: beams, materials, too long, underground, erase, undo, clear, budget.
- The truck only drives on road that meets the ground (no jumping onto a floating road, no cliffs, no ramps over 35°).
- Stop during a run puts everything back; Next changes the level.

## Several children at once
Each finger keeps its own beam-in-progress (a set of drags), so two children can lay beams at the same time.

## History (audit)
- **The physics used to be backwards** (a bare road held and adding triangles made bridges fail); results changed with
  screen size; opening an info tab erased the bridge: all fixed with the new truss model.
- The truck used to jump onto whichever road was highest: it now follows the surface it's on.

## Not done / known gaps
- Bridges aren't saved between visits.
- Only three materials; no cables (tension-only parts), so suspension bridges can't be built.

## Keep it this way
- Keep all physics in grid units (the screen-size test checks it).
- The "bare road fails, truss holds" test is the core lesson; never tune materials so a bare road passes.

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
