# Letter Trace (`trace`)

**What it is:** early literacy. Trace letters and numbers stroke by stroke following arrows, plus playful letter
activities: discover, find, match and simple words.
**Home tile:** Play & Learn · ages 2+ · "Discover letters, find matches, trace shapes, and grow into words"

## How it plays
- Modes: ✍️ Trace (default; A-Z and 0-9, start at the green dot, follow the arrows), 🎈 Discover, 🔎 Find, 🧩 Match,
  🐱 Words (complete a short word).
- Wrong taps give guidance without moving progress forward; a replay button repeats the prompt.
- Keyboard: hold Space to trace along the line; arrows change the letter.

## Code map
- `trace.js`: stroke data per character, a tolerance for wobbly tracing, `SETS` for the activities. Has a reduced-motion
  check. Styles in the shared `css/app.css`. Test hook: `GAMES.trace._debug` (state, toPx, strokes, literacy, tol, SETS).

## Done (covered by tests)
- `12-play-and-learn` › 27: every letter A-Z and number 0-9 can be finished with a realistic, wobbly trace; tracing
  backwards or starting away from the green dot doesn't count.
- `33-alphabet-literacy`: every new activity is tappable and moves between rounds; wrong taps guide without advancing,
  replay is available; Trace stays the default and its controls still advance letters; word rounds show a correctly
  sized incomplete word and can be completed.

## Several children at once
No: there is one trace at a time. Any finger that touches down on the current point takes the trace over, so two
children would fight over one letter. The tap activities accept any finger.

## History
- Expanded from tracing into interactive literacy activities; concrete early word prompts; toolbar targeting fixed.
- Audit: finishing a letter and quickly the next one skipped a letter: fixed (stale auto-advance timers ignored).

## Not done / known gaps
- Lower-case letters are not traced (A-Z capitals and 0-9 only).
- One tracer at a time (see above); a two-child mode would need two tracing areas.
- Letter sounds use `say()`, silent while voice is off app-wide, which matters most for this game.

## Keep it this way
- Keep the tracing tolerance realistic for small hands (the wobbly-trace test) but still refuse backwards strokes.

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
