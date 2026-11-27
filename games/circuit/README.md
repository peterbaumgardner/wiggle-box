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

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
