# Word Builder (`words`)

**What it is:** spell the picture. A picture (🐱) and empty slots; tap letter tiles in order to spell the word.
**Home tile:** Play & Learn · ages 5+ · "Spell the picture, letter by letter"

## How it plays
- Two lists: 20 three-letter words and 16 four-letter words, each with a picture. The length follows the child
  (`learn.level('reading.spelling')`: after three perfect words, 4-letter words and one more decoy letter per level)
  until a child picks a length with the chips.
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
- `30-learning`: after three perfect words it moves on to 4-letter words (unless a length was picked); spelling and
  words are recorded in the learning layer.

## Several children at once
Tap-based on one shared word: it's a take-turns game.

## Not done / known gaps
- 36 words in total; no longer words, no choosing a list or theme.
- Spelling the word aloud at the end uses `say()`: silent unless a grown-up turns Spoken words on.

## Keep it this way
- Every word needs a picture a young child recognises (the test checks every entry has one).

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ◐ · Reading ● · Talking ○ · Maths ○ · Creative ○ · Critical ○
**Aims at ages:** 4-7 · **Four pillars (estimate, 0-3):** Active 2 · Engaged 2 · Meaningful 2 · Social 1

What it teaches now:
- Spelling 36 picture words (20 three-letter, 16 four-letter) with letter tiles; hints after two misses.
- Wired to the learning layer: each word records `reading.words`; each finished word records `reading.spelling` (perfect or not); after three perfect words it moves on to 4-letter words and more decoy letters (unless the child picked a length); a "Talk about it" question about first sounds.

Upgrades, most learning first:
1. **Sound it out** (`reading.sounds`): with voice on, each tile says its sound when touched, and the finished word is blended slowly then said.
2. **Word families** (`reading.spelling`): cat → hat → bat: change one letter to make the next word, with a picture for each.
3. **More words and themes** (`talk.vocab`): grow the lists (animals, food, home) and let children pick a theme.
4. **Use it in a sentence** (`reading.sentences`, ages 6+): the finished word drops into a short sentence with a picture.
5. **Bring words back** (rule 7): words spelled yesterday return first today.

"Talk about it" questions (`learn.talk`):
- What else starts with the same sound as this word?
- Can you think of a word that rhymes with it?
- Where have you seen this thing?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
