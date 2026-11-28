# Wave Lab (`waves`)

**What it is:** three wave toys: a pendulum (and a pendulum wave), a ripple tank with interference, and a vibrating
sound string you can hear.
**Home tile:** Science Lab · ages 8+ · "Swing pendulums, make ripples, see sound."

## How it plays
- **Pendulum:** drag the bob to set length and angle, let go to swing; choose the world (Moon, Mars, Earth, Jupiter);
  a pendulum-wave option with many strings.
- **Ripples:** tap to add a drip source (up to 4; tap one to remove it); watch crests and calm interference stripes.
- **String:** pluck it; harmonics n × f with n + 1 nodes, played as a real tone.

## Code map
- `waves.js`: three simulations `PD` (pendulum), `RP` (ripples), `ST` (string). The string's oscillator fades out and
  really stops, even after leaving the game, and the sound button silences it.
- Styles in the shared `css/app.css`. Test hook: `GAMES.waves._debug` (PD, RP, ST, setMode, t, mode, dims).

## Done (covered by tests, `16-science-labs` › 28 Wave Lab)
- Pendulum period matches T = 4√(L/g)·K(sin θ/2) on four worlds; big swings take longer by the right amount; energy is
  conserved.
- Pendulum wave: string lengths give 40, 41, … 51 swings a minute.
- Ripples: crests are λ = v/f apart; two drips make calm stripes where waves cancel.
- String: harmonics are n × f, nodes are n + 1, and the tone really stops.

## Several children at once
Ripples: every finger can add or remove sources. Pendulum and string: one pendulum / one string, so fingers share it.

## History (audit)
- Turning sound off, or leaving the game, left the string humming: fixed (audit D18).

## Not done / known gaps
- Age 8+: nothing simplified for younger children.

## Keep it this way
- Any long sound must register in `soundHooks` (see `js/sound.js`) so the sound button and a hidden tab can stop it.

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ◐ · Reading ○ · Talking ○ · Maths ◐ · Creative ◐ · Critical ◐
**Aims at ages:** 7-10 · **Four pillars (estimate, 0-3):** Active 3 · Engaged 2 · Meaningful 2 · Social 1

What it teaches now:
- Pendulum period on four worlds, pendulum waves, ripple interference, string harmonics you can hear.

Upgrades, most learning first:
1. **Predict the swing** (`think.predict`): longer or shorter string: faster or slower? Choose, then see the count.
2. **Count swings** (`math.count`, `math.measure`): a big swing counter and a timer; "10 swings in 20 seconds".
3. **Make music with the string** (`create.music`): harmonics as notes children can play in order.
4. **Calm and busy water** (`talk.vocab`): words for where waves add up and cancel.
5. **Younger layer**: one pendulum and a "tick-tock" sound, no numbers.

"Talk about it" questions (`learn.talk`):
- Why does a long swing go slower?
- Where do you see waves at home or outside?
- How does a guitar make different notes?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
