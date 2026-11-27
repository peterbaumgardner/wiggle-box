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

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
