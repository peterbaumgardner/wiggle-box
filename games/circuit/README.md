# Circuit Lab (`circuit`)

**What it is:** a breadboard of dots where children wire batteries, bulbs, fans, switches and resistors, and see current
flow. The numbers are real: the board is solved with nodal analysis (V = I·R).
**Home tile:** Science Lab · ages 7+ · "Wire batteries, bulbs and fans. See the current flow."

## How it plays
- Parts: wire, battery, bulb, resistor, switch, fan (`motor` in code); plus meter and erase tools. Drag from dot to dot to place the chosen part, or tap one dot then a neighbour (no dragging needed).
- Tap a selected battery or resistor again to step its value (no sliders).
- Challenges: the starter circuit, series, parallel, three bulbs, fan and switch.
- A meter shows voltage and current; short circuits warn; too much power pops a bulb.

## Code map
- `circuit.js`: modified nodal analysis with Norton-equivalent batteries; `solve(skip)` can treat a part as removed to
  find out what depends on what (that's how series vs parallel is read from the real wiring).
- The board never shrinks under placed parts: a narrower screen squeezes the dots closer instead of renumbering them.
- Styles in the shared `css/app.css`. Test hook: `GAMES.circuit._debug` (edges, solve, sol, setTool, place, geom).

## Done (covered by tests, `11-cannon-chance-circuit` › 06 Circuit Lab)
- Closing the starter circuit lights the bulb; the meter agrees with Ohm's law.
- Series, parallel, three bulbs, fan and switch challenges can all be completed with real drags.
- Battery and resistor values step when tapped again; Ohm's law holds with a resistor.
- Short circuits warn, too much power pops a bulb, broken and open circuits read zero, nothing shows NaN.
- A finger draws the wire that lights the bulb on touch screens.

## Several children at once
Each finger is tracked and keeps its own wire-in-progress, so two children can wire different parts at once.

## History (audit)
- Parts at the edge broke when the screen narrowed: fixed (the board never shrinks under parts).
- Two bulbs in series on two batteries counted as "parallel"; two separate loops counted as "series": fixed by reading
  the topology from the solver.

## Not done / known gaps
- No capacitors, LEDs (with direction) or AC.
- The circuit is lost when the child leaves (no saving).

## Keep it this way
- Series/parallel labels must come from the solver, never from counting parts (that was the old bug).

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ◐ · Reading ○ · Talking ○ · Maths ◐ · Creative ◐ · Critical ●
**Aims at ages:** 6-10 · **Four pillars (estimate, 0-3):** Active 3 · Engaged 2 · Meaningful 2 · Social 1

What it teaches now:
- Real circuits (nodal analysis): series, parallel, switches, resistors, fans; Ohm's law on a meter; short-circuit and burn-out feedback.

Upgrades, most learning first:
1. **Predict the bulbs** (`think.predict`): before closing a switch, guess which bulbs light and how bright.
2. **Fix the broken circuit** (`think.debug`): challenges with one wrong wire to find.
3. **Explain the flow** (`talk.explain`): a "why" button shows the current path animated with a one-sentence reason.
4. **Younger layer** (ages 5-6): battery-bulb-wire only, with "a loop makes the light work".
5. **Design challenges** (`create.design`): "make a fan and a light that switch separately".

"Talk about it" questions (`learn.talk`):
- Why did the bulb go out when you opened the switch?
- How is a circuit like a race track?
- What things at home use circuits?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
