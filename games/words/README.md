# Word Builder (`words`)

**What it is:** spell the picture. A picture (🐱) and empty slots; tap letter tiles in order to spell the word.
**Home tile:** Play & Learn · ages 5+ · "Spell the picture, letter by letter"

## How it plays
- Two lists: 20 three-letter words and 16 four-letter words, each with a picture.
- The right letter fills the next slot; a wrong one shakes; after two misses a hint lights the next letter.
- Tapping the picture lights the next letter too. Keyboard: type the letters.
- A finished word earns a star and a new round.

## Code map
- `words.js` (small): `W3`, `W4` word lists. Styles in the shared `css/app.css` (`.pic`, `.slots`, `.slot`, `.tiles`, `.lt`).
- Test hook: `GAMES.words._debug` (W3, W4, word, posn).

## Done (covered by tests, `12-play-and-learn` › 12 Word Builder)
- Every word in both lists is a real lowercase word with a picture.
- Spelling rounds in both lengths: right letters fill, wrong ones shake, two misses show a hint.
- The picture button lights the next letter; the keyboard can spell.

## Several children at once
Tap-based on one shared word: it's a take-turns game.

## Not done / known gaps
- 36 words in total; no longer words, no choosing a list or theme.
- Spelling the word aloud at the end uses `say()`, silent while voice is off app-wide.

## Keep it this way
- Every word needs a picture a young child recognises (the test checks every entry has one).

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
