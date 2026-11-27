# Bubble Pop (`bubbles`)

**What it is:** bubbles float up the screen carrying letters, numbers or animals; tap them to pop. The simplest game in
the box, for the youngest children.
**Home tile:** Play & Learn · ages 2+ · "Pop letters, numbers and animals"

## How it plays
- Three modes (chips at the top): ABC (A-Z in order, "A is for Apple"), 123 (1-10 with stars), Animals.
- Up to 8 bubbles at once; each pop shows a floating label and confetti; every 10 pops earns a star.
- Keyboard: type the letter or number you see, or Space to pop the nearest bubble.

## Code map
- `bubbles.js` (small): each bubble is a `<button>` moved with a CSS transform; `place(b)` sets its position the moment
  it exists. Words and pictures come from `LETTERS`, `NUMW` and `ANIMALS` in `js/data.js`.
- Styles in the shared `css/app.css` (`.bubble`). Test hook: `GAMES.bubbles._debug` (bubs, pops).

## Done (covered by tests, `12-play-and-learn` › 07 Bubble Pop)
- Bubbles float up; a tap on a bubble pops it, a tap just outside its round edge doesn't.
- ABC, 123 and Animals modes; ten pops earn a star; rapid taps all count.

## Several children at once
Yes: every bubble listens for its own touch, so many children can pop different bubbles at the same moment.

## History
- Bubbles flashed in the top-left corner for one frame when made: fixed (commit "Bubble Pop: place each bubble when it
  is made").

## Not done / known gaps
- The spoken letter/word (`say()`) is silent because voice is off app-wide; only the floating label shows.
- No difficulty or speed setting.

## Keep it this way
- Keep the hit test round (a tap in the bubble's square corner must not pop it).

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
