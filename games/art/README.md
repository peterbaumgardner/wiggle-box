# Math Art (`art`)

**What it is:** formulas that make pictures: a sunflower (golden angle), spirographs, fractal trees and the Mandelbrot
set.
**Home tile:** Math Lab · ages 6+ · "Turn a formula into art. Find the golden angle."

## How it plays
- No sliders: you change the art by dragging on it, and the numbers you're changing show on the picture while you drag.
- **Sunflower:** sliding changes the angle and seed count; a golden-angle button finds 137.5°.
- **Spirograph:** pick gear and ring; the star has R / gcd(R, r) points.
- **Fractal tree:** more and fewer levels; counts follow 2ⁿ⁻¹ tips and 2ⁿ − 1 branches.
- **Mandelbrot:** tap to zoom (mouse wheel too); the tapped point is classified in or out.
- Arrow keys change the art in every mode.

## Code map
- `art.js`: four modes in `S`. Styles in the shared `css/app.css`. Test hook: `GAMES.art._debug` (S, setMode, orbit, mode).

## Done (covered by tests, `13-math-lab` › 18 Math Art)
- Sunflower angle and seed count; the golden-angle button finds 137.5°.
- Spirograph point count is R / gcd(R, r) for every gear and ring.
- Fractal tree counts follow 2^(n−1) and 2^n − 1.
- Mandelbrot: tapping zooms and classifies the point correctly.
- Arrow keys work in every mode.

## Several children at once
Fingers are tracked (two-finger pinch/twist), but each mode has one picture: fingers act on it together.

## History (audit)
- The leaf-tip count on the panel didn't match the tree; arrow keys did nothing in three modes: fixed.

## Not done / known gaps
- No way to save or print a picture (Magic Paint has a Save button; Math Art doesn't).

## Keep it this way
- "No sliders" is a design decision: change values by dragging on the art.

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
