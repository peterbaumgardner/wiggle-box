# Hungry Monster (`feed`)

**What it is:** an always-open shared toy. Feed Munch the monster, mix silly snacks in a bowl, plant things in the garden
and make discoveries, all at the same time, with no turns, no rounds and no wrong answers.
**Home tile:** Play & Learn · ages 3+ · "Feed Munch, mix silly snacks, and make discoveries together."

## How it plays
- Drag food from the shelf to Munch to feed him (every food is accepted, no waiting for a round).
- Drag two ingredients together to mix a recipe; drop a third in the garden to plant it.
- Tap Munch to pat him, tap the bowl to stir, tap the garden to grow; his mood changes with what happens.
- Discovered recipes are remembered between visits.

## Code map
- `feed.js`: a per-pointer action registry (every finger owns the item it holds; feeding commits exactly once). Stats in
  the test hook: fed, mixed, planted, pats, simultaneous, activePointers, looseFood, recipes.
- `feed.css`: all `.feed-v2` styles, including a reduced-motion rule.
- Saved in `localStorage`: `wb-feed-recipes-v2` (discoveries).
- Design spec: `docs/HUNGRY_MONSTER_2_PLAN.md`. CI: `.github/workflows/hungry-monster.yml` runs this game's tests on
  every push to main that touches `games/feed/**`, then refreshes the offline cache version.

## Done (covered by tests, `12-play-and-learn` › 09 Hungry Monster)
- Feeding never waits for a round and accepts every food once.
- Independent food actions: mix two ingredients, then plant a third.
- Two simultaneous fingers can feed independently with no player selection.
- Opens/closes cleanly, no leaks; fits every screen size.

## Several children at once
Yes, by design (the whole point of version 2): separate fingers move separate food at the same time.

## History
- Replaced turn-like counting rounds with continuous shared touch play (feat(feed) commits); responsive kitchen
  layout; every ingredient visible on narrow portrait screens.

## Not done / known gaps (compared with `docs/HUNGRY_MONSTER_2_PLAN.md`)
The plan's phases 4-7 are only partly built. Not found in the code:
- weather and the garden's world reactions beyond planting; surprise events; the discovery book screen; decorating;
- monster invitations and idle behaviours from the plan's personality table (moods exist, but in a reduced form);
- full keyboard play: Enter or Space on a focused food feeds Munch, but food can't be moved into the bowl or garden
  without a finger or mouse;
- the plan's real-device and observed-play validation (phase 7) has not been done.

## Keep it this way
- No global locks, no turns, no scolding: plan section 3's hard requirements.
- Every finger owns what it holds; a feed must commit exactly once, even if two fingers drop at once.

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ● · Reading ○ · Talking ○ · Maths ◐ · Creative ● · Critical ◐
**Aims at ages:** 3-6 · **Four pillars (estimate, 0-3):** Active 3 · Engaged 3 · Meaningful 2 · Social 3

What it teaches now:
- Shared play with no turns: feeding, mixing two ingredients into recipes, planting; recipe discoveries kept between visits.
- Many fingers at once (each finger owns its food).

Upgrades, most learning first:
1. **Count the snack** (`math.count`, rule 6): Munch counts what he eats out loud and shows the total as a set ("four strawberries!"), favouring 4-10.
2. **Munch's wishes** (`think.cause`, research #15): Munch asks for something ("something red and round"); the children decide what fits, and Munch learns favourites (teach-a-character).
3. **Food words and feelings** (`talk.vocab`): crunchy, sour, sweet; Munch's face shows a feeling and says the word.
4. **Recipe cards as print** (`reading.words`): discovered recipes get a card with the words and pictures.
5. **Weather and garden from the plan** (`think.predict`): the unbuilt parts of `docs/HUNGRY_MONSTER_2_PLAN.md` (weather, surprise events, discovery book) as predict-then-see moments.

"Talk about it" questions (`learn.talk`):
- What should we cook for Munch next? Why?
- Which snack do you think Munch likes best?
- How many things did Munch eat? Let's count.

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
