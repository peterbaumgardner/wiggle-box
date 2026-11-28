# Prime Garden (`primes`)

**What it is:** primes as a garden. Tap a number to wilt its multiples (the sieve of Eratosthenes); build factor trees;
find the GCD and LCM of pairs.
**Home tile:** Math Lab · ages 7+ · "Wilt the multiples. Only the primes keep blooming."

## How it plays
- **Sieve:** 1-100; tapping 2, 3, 5 and 7 leaves exactly the 25 primes, which get crowned.
- **Factor tree:** split a number until every leaf is prime.
- **GCD / LCM:** twelve pairs (12 & 18, 8 & 12 ... 45 & 60); the next pair always differs from the last.

## Code map
- `primes.js`: three modes; `PAIRS` list. Styles in the shared `css/app.css`. Test hook: `GAMES.primes._debug`
  (setMode, dead, tree, pair, PAIRS, crowned).

## Done (covered by tests, `14-think-lab` › 21 Prime Garden)
- Sieve leaves exactly the 25 primes up to 100.
- Tapping 1, a wilted number or a composite first all behave sensibly.
- Factor trees give the true prime factorisation.
- GCD and LCM are right for every pair, and GCD × LCM = a × b.

## Several children at once
Tap-based on a shared board.

## History (audit)
- A mode switch mid-sieve kept wilting; the common-factor pair could repeat: both fixed.

## Not done / known gaps
- The sieve stops at 100; the GCD/LCM pairs are a fixed list of twelve.

## Keep it this way
- Animated wilting steps are tied to the mode; keep them stopping on a mode switch.

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ○ · Reading ○ · Talking ○ · Maths ● · Creative ○ · Critical ◐
**Aims at ages:** 7-10 · **Four pillars (estimate, 0-3):** Active 2 · Engaged 2 · Meaningful 1 · Social 1

What it teaches now:
- The sieve of Eratosthenes to 100, factor trees, GCD and LCM of twelve pairs.

Upgrades, most learning first:
1. **Arrays** (`math.multiply`): a number shown as rows of dots; primes only make one row.
2. **Predict the next prime** (`think.predict`) before the sieve reaches it.
3. **Skip-counting songs** (`math.patterns`): multiples light up with a rhythm.
4. **Generated pairs** (`learn.level`) beyond the fixed twelve.

"Talk about it" questions (`learn.talk`):
- Why can't you make a rectangle out of 7 dots?
- What do all the numbers that wilt after you tap 2 have in common?
- Is 1 a prime? Why or why not?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
