# __TITLE__ (`__KEY__`)

**What it is:** one or two sentences a new agent can read to know what this game is for and who it's for.
**Home tile:** see `games/registry.js`.

## How it plays
- Modes, controls, what a child does, what earns a star. Keyboard keys.

## Code map
- `__KEY__.js`: the main pieces and where they are. `__KEY__.css`: its styles (`__KEY__-` classes).
- Anything saved in `localStorage` (key names). Test hook: `GAMES.__KEY__._debug` (what it exposes).

## Done (covered by tests)
- One line per behaviour a test proves, with the test file: `tests/games/__KEY__.spec.mjs`.

## Several children at once
- How simultaneous fingers behave: per-finger state, or one shared thing everyone acts on.

## History
- Big changes and fixed bugs, so nobody brings them back.

## Not done / known gaps
- What's missing, simplified or never tested. Only things you've checked in the code.

## Learning plan
See `docs/LEARNING_FRAMEWORK.md`.

**Learning areas today:** Motor ○ · Reading ○ · Talking ○ · Maths ○ · Creative ○ · Critical ○
**Aims at ages:** ? · **Four pillars (estimate, 0-3):** Active ? · Engaged ? · Meaningful ? · Social ?

What it teaches now:
- Skills (ids from the framework) and how the game records them with `learn.saw` / `learn.tried`.

Upgrades, most learning first:
1. ...

"Talk about it" questions (`learn.talk`):
- ...

## Keep it this way
- Rules that keep this game working (design decisions, invariants the tests rely on).

---
_Checked against the code on YYYY-MM-DD. Update this file in the same commit as any change to the game._
