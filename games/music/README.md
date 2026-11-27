# Rainbow Piano (`music`)

**What it is:** eight big rainbow keys (C major, C4 to C5) to play freely, learn a song, or play "copy me".
**Home tile:** Play & Learn · ages 2+ · "Play, copy me, and learn a song"

## How it plays
- **Free play:** every key plays its note; slide a finger across the keys for a glissando.
- **Learn a song:** follow the glowing key through Twinkle Twinkle Little Star; finishing earns a star.
- **Copy me:** listen, repeat the notes; the tune grows by one each time; a wrong note replays it; every third win
  earns a star.
- Keyboard: A S D F G H J K, or 1-8.

## Code map
- `music.js` (small): `N` (notes), `SONG`; pointer handling by `pointerId` so every finger slides on its own.
- Styles in the shared `css/app.css` (`.pads`, `.pad`). Test hook: `GAMES.music._debug` (N, SONG, seq, pos, mode, locked).

## Done (covered by tests, `12-play-and-learn` › 11 Rainbow Piano)
- All eight keys play the right C-major notes (equal temperament, A4 = 440 Hz).
- Learn a song plays Twinkle Twinkle to the end for a star.
- Copy me: repeat, grow, wrong note replays.
- Sliding a finger plays each key; switching modes leaves no key stuck lit.

## Several children at once
Yes: every finger plays and slides independently. In Copy me, input is locked while the tune plays.

## History (audit)
- Lit keys stayed lit after switching mode: fixed.

## Not done / known gaps
- One song only; no recording or playback of what a child played.
- Encouragement lines use `say()`, silent while voice is off app-wide.

## Keep it this way
- Notes must stay in tune: the test checks every frequency.

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
