# Shape Lab (`geo`)

**What it is:** geometry you can stretch: polygons with live area, perimeter and angles; Pythagoras; circles and π; the
unit circle with exact trig values.
**Home tile:** Math Lab · ages 7+ · "Stretch shapes. Watch area, angles and π come alive."

## How it plays
- **Polygon:** drag corners; the shape is named (triangle, square, pentagon...); "Make it perfect" makes it regular
  (3-8 corners); two fingers on empty space twist the whole shape.
- **Pythagoras:** drag the two legs; the squares on the sides add up (finds 3-4-5, 6-8-10).
- **Circle:** drag the radius; C = 2πr and A = πr²; unroll the circle to measure the circumference.
- **Unit circle:** drag the angle; cos, sin and tan with exact forms at special angles.

## Code map
- `geo.js`: modes `poly`, `pyth`, `circ`, `unit`; a coordinate plane from `plane()` in `js/ui.js`. The view only
  re-zooms after the finger lifts, so handles never run away from the finger.
- Styles in the shared `css/app.css`. Test hook: `GAMES.geo._debug` (setMode, poly, tri, unit, circ, nameOf, area).

## Done (covered by tests, `13-math-lab` › 16 Shape Lab)
- Dragging corners: names, area, perimeter and angle sum match independent geometry.
- "Make it perfect" gives regular polygons for 3 to 8 corners.
- Pythagoras finds 3-4-5 and 6-8-10; the squares add up.
- Circle formulas hold for every radius; unrolling measures the circumference.
- Unit circle values at every special angle, with exact forms.

## Several children at once
Each finger drags its own corner in polygon mode (per-finger handle), so two children can pull different corners.

## History (audit)
- "Make it perfect" on a triangle wasn't called equilateral; circle/Pythagoras handles ran away from the finger: fixed.

## Not done / known gaps
- No 3-D shapes, no transformations (reflect/translate) mode.

## Keep it this way
- Keep re-zooming only after the finger lifts.

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
