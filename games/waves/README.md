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

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
