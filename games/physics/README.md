# Physics Lab (`physics`)

**What it is:** a physics sandbox built on the Matter.js engine with a custom renderer. Throw, stack, crash and launch
things; draw ramps; switch gravity; solve ramp puzzles.
**Home tile:** Science Lab · ages 3+ · "Build, crash, launch and solve puzzles"

## How it plays
- Tools: grab (throw and twist), add (bouncy ball, crate, brick, ice block, triangle, plank, balloon, Bloop buddy, car, rocket, bomb, dominoes, tower,
  swing, seesaw, fan, trampoline), pin, boom, erase,
  draw (solid shapes) and ramp (static lines).
- Gravity menu: Earth, Moon (1.62 m/s², no air), space (floats), upside down. Freeze and slow-mo.
- Scenes: Playground, Dominoes, Tower, Race, Empty. Plus five puzzles: draw ramps so the ball reaches the star, then Go.

## Code map
- `physics.js`: `loadMatter()` loads `matter.min.js` (repo root) the first time, with a real retry if the load failed;
  `physicsLab(stage, g)` is the game. Scale: 153 px per metre (`PXM`).
- Styles: in the shared `css/app.css`.
- Test hook: `GAMES.physics._debug` (engine, world, spawn, scene, startPuzzle, LEVELS, tool...).

## Done (covered by tests, `15-laser-physics`)
- Falling: g = 9.8 m/s² on Earth and 1.62 m/s² on the Moon; height energy turns into moving energy.
- A rubber ball bounces back to about e² of its drop height (restitution 0.82).
- Gravity menu, Freeze and Slow-mo behave as labelled.
- Every scene runs three seconds with nothing escaping or turning into NaN; every Add item settles without errors.
- Grab, pin, boom, erase, draw and ramp work with the mouse; a finger draws a ramp on touch screens.
- All five puzzles can be solved; a miss resets the ball; Try again works; a resize keeps the child's ramps.
- If the engine can't load (offline before caching), the child sees a message and Try again really retries.

## Several children at once
Every finger is tracked; each finger can grab and throw its own body. A second finger on empty space while something is
held becomes a twist handle for that body.

## History (from `WIGGLE_BOX_AUDIT.md`)
- The tap that added a balloon popped it, a new bomb went off at once, a new car flipped: fixed (the spawning tap is not
  a tap on the new thing).
- The Moon had air drag and floating balloons: fixed (no air on the Moon or in space).
- A puzzle broke when the screen turned; an offline first load hung forever: both fixed.

## Not done / known gaps
- Narration (`say()`, 14 calls) is silent unless a grown-up turns Spoken words on.
- No saving of a built scene.
- Only 5 puzzles.

## Keep it this way
- Top speed is capped (~16 m/s) so nothing tunnels through a wall in one frame; keep that cap if you add faster things.
- `matter.min.js` must stay in the offline list (`tools/games.mjs` adds it); the offline test opens Physics Lab offline.

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ◐ · Reading ○ · Talking ○ · Maths ◐ · Creative ● · Critical ●
**Aims at ages:** 3-10 · **Four pillars (estimate, 0-3):** Active 3 · Engaged 3 · Meaningful 2 · Social 2

What it teaches now:
- Real gravity (Earth, Moon, space, upside down), bouncing, throwing, stacking and crashing; five ramp puzzles.
- Many fingers grab and throw at once.

Upgrades, most learning first:
1. **Predict the fall** (`think.predict`): drop two things together; children guess which lands first, then see.
2. **More puzzles, adaptive** (`think.plan`): generate puzzles from `learn.level('think.plan')` instead of five fixed ones.
3. **Words for forces** (`talk.vocab`): push, pull, heavy, bounce, balance said as things happen.
4. **Build a tower challenge** (`create.design`, `math.spatial`): how tall can you build before it falls? Height on a ruler (number line).
5. **Fair test helper** (`think.evidence`, ages 7+): change one thing (gravity) and compare two runs side by side.

"Talk about it" questions (`learn.talk`):
- Why did the tower fall?
- What would happen on the Moon?
- Which is heavier, the brick or the balloon? How can you tell?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
