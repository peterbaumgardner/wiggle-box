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
- `30-learning`: a pop records its letter in the learning layer.

## Several children at once
Yes: every bubble listens for its own touch, so many children can pop different bubbles at the same moment.

## History
- Bubbles flashed in the top-left corner for one frame when made: fixed (commit "Bubble Pop: place each bubble when it
  is made").

## Not done / known gaps
- The spoken letter/word (`say()`) only plays when a grown-up turns Spoken words on (grown-ups view); otherwise only the
  floating label shows.
- No difficulty or speed setting.

## Keep it this way
- Keep the hit test round (a tap in the bubble's square corner must not pop it).

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ● · Reading ● · Talking ○ · Maths ◐ · Creative ○ · Critical ○
**Aims at ages:** 2-5 · **Four pillars (estimate, 0-3):** Active 2 · Engaged 3 · Meaningful 1 · Social 1

What it teaches now:
- Letter-name and letter-word links (A is for Apple) in order A-Z; numbers 1-10 with that many stars; animal names.
- Quick, accurate tapping on moving targets (motor.tap).
- Wired to the learning layer: each pop records `reading.letters`, `math.count` or `talk.vocab`; a "Talk about it" question after 10 pops.

Upgrades, most learning first:
1. **Sound mode for 4-6s** (`reading.sounds`): bubbles say the letter *sound* (/m/), and a picture in the corner shows what to find ("pop the one that starts like 🌙"). Adaptive with `learn.level` from 2 choices up to 4.
2. **Count-and-pop sets** (`math.count`, rule 6): a bubble carries 4-10 dots; the total is said when it pops; at higher levels pop the bubble with *more*.
3. **Number line floor** (`math.numberline`, rule 11): popped numbers drop into their place on a 1-10 line along the bottom.
4. **Own-name letters** (`reading.letters`): a grown-up can type a child's name in the grown-ups view; those letters appear more often.
5. **Zones for two children** (rule 9): left and right halves each get their own stream in 2-player mode.

"Talk about it" questions (`learn.talk`):
- Which letter does your name start with?
- Can you count five things you can see right now?
- Which animal would you like to be? Why?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
