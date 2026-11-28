# Firework Sky (`fireworks`)

**What it is:** tap the night sky to launch fireworks that burst into named colours, shapes, or numbers you can count.
**Home tile:** Play & Learn · ages 2+ · "Tap for colors, shapes and counting fireworks"

## How it plays
- Three modes: Colors (each burst names its colour), Shapes (bursts form shapes), Count (bursts count up to ten; ten
  earns a star).
- Tap or scribble anywhere: every tap launches a rocket toward it. If the sky is empty for a while, one launches by itself.

## Code map
- `fireworks.js`: rockets and sparks in arrays, drawn every frame with `g.loop`. Limits: at most 12 rockets and 4,000
  sparks (the oldest are dropped). Styles in the shared `css/app.css`. Test hook: `GAMES.fireworks._debug`
  (rockets, sparks, count, mode).

## Done (covered by tests, `12-play-and-learn` › 13 Firework Sky)
- A tap launches a rocket that bursts into a named colour, shape or number.
- Two hundred frantic taps and scribbles never grow sparks or rockets without limit.

## Several children at once
Yes: every finger launches its own rockets.

## Not done / known gaps
- Counting narration ("Ten! You counted to ten!") uses `say()`: silent unless a grown-up turns Spoken words on.
- No way to choose which colour or shape comes next.

## Keep it this way
- Keep the rocket and spark caps: they protect slow tablets when several children tap at once.

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ● · Reading ○ · Talking ○ · Maths ◐ · Creative ◐ · Critical ○
**Aims at ages:** 2-5 · **Four pillars (estimate, 0-3):** Active 2 · Engaged 3 · Meaningful 1 · Social 1

What it teaches now:
- Colour names, shape names (bursts form shapes) and counting to ten with a star at ten.
- Tapping and scribbling anywhere; many children at once.

Upgrades, most learning first:
1. **Say and show the total** after each burst in Count mode with the number written large (`math.count`), and count *sets* of 4-10 sparks (rule 6).
2. **Pattern sky** (`math.patterns`): the sky shows red-blue-red-?; the next tap's colour continues or breaks the pattern, and the game says which.
3. **Mix colours in the sky** (`create.remix`): two bursts that overlap make the mixed colour, named out loud.
4. **Spatial words** (`math.spatial`): "high up", "low down", "next to the moon" said for where the firework went (rule 2: spatial vocabulary).
5. **Predict before it bursts** (`think.predict`): at higher levels the rocket pauses and asks "what colour will it be?" by showing two choices.

"Talk about it" questions (`learn.talk`):
- Which colour was your favourite? Why?
- How many fireworks did you make? Count them with me.
- What shape would you like to see in the sky?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
