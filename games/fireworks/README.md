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
- Counting narration ("Ten! You counted to ten!") uses `say()`, silent while voice is off app-wide.
- No way to choose which colour or shape comes next.

## Keep it this way
- Keep the rocket and spark caps: they protect slow tablets when several children tap at once.

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
