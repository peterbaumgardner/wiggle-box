# Magic Paint (`paint`)

**What it is:** the flagship drawing toy. Paint with brushes and stamps, mix colours, colour in pictures, and get gentle
"art talk" about what you drew. Built for several children painting together.
**Home tile:** Play & Learn · ages 2+ · "Paint, stamp, mix colors and color in pictures" · registry `layout:'full'`
(slim header, edge-to-edge paper)

## How it plays
- Quick colour strip (one tap per colour; whatever doesn't fit is in the 🎨 menu) and a slim bar: 🎨 colours (with a
  mixing pot), 🖌️ brushes + sizes, ⭐ stamps, 🪄 magic, 📄 paper and pictures, 🧽 eraser, undo, redo.
- Portrait: tools under the paper. Landscape: tools down the right side; menus open beside them.
- Brushes: paint brush, glow pen, spray, sparkles, bubbles, fill bucket. Sizes: small, medium, big, huge.
- Stamps: 10 shapes, 20 animals, 26 things, A-Z (with a word), 0-10 (with a ten-frame of dots). Stamps count
  themselves ("3 stars!").
- Magic: mirror (two sides, four corners, snowflake), words on screen on/off, talk (speech) on/off, Party (every new
  finger gets its own colour).
- Paper: colouring pages (house, snowman, rocket, fish, flower, a letter, a number to count), paper colours, new paper
  (two taps), Save as PNG.
- Art talk: after each stroke a caption describes it (straight, wavy, zigzag, loop, spiral, corners) with its colour.
- Keyboard: 1-9 colours, Z/Backspace undo, Y redo, M mirror, E eraser, F fill, [ ] size.

## Code map
- `paint.js`: three stacked canvases (`.pp-ink` the child's paint, `.pp-lines` colouring-page outlines that are never
  erased, `.pp-guide` the mirror guide); the paper colour is the board background.
- Each finger keeps a brush `{tool, color, size, stamp}` from the moment it touches down (`fingerBrush()`); drawing
  functions take the brush, never the global state.
- `paint.css`: all `pp-` styles, both layouts.
- Saved in `localStorage`: only the words/talk switches (`wb-paint-words`, `wb-paint-talk`).
- Test hook: `GAMES.paint._debug` (pixel(x,y) as the child sees it, state, caption, partCenters, W, H).

## Done (covered by tests, `12-play-and-learn` › 08 Magic Paint and `20-layout-touch`)
- The paper gets most of the screen; every category opens a menu, a pick closes it, a tap outside closes it without painting.
- A stroke paints the picked colour exactly under the finger, right up to every edge.
- Every brush leaves paint; sizes are right; the eraser shows the paper colour; undo and redo work.
- Stamps stamp in place, say what they are and count themselves.
- Mirror, four corners and snowflake copy every mark; a stroke from the middle line draws no stray lines.
- Art talk describes straight lines, zigzags, loops and dots with their colour.
- Mixing pot: red + yellow = orange (a star the first time); colour + white is light.
- Colouring pages: the fill bucket colours a piece and names its shape; colouring every piece earns a star; the number
  page counts.
- New paper needs two taps; undo brings the picture back; letter pages step through the alphabet.
- Quick colours pick in one tap; each finger keeps its own colour; Party gives every finger a new colour.
- A stroke that leaves the paper and comes back stays one line; the picture survives a resize.
- Real finger strokes paint on phones and tablets; a slow toddler press still opens a menu.

## Several children at once
Yes, by design: every finger paints with its own brush for its whole stroke, and Party mode gives every new finger a
different colour.

## History
- Upgrades: 33 stamps, five brushes, multi-touch, redo, paper colours, export; then category menus, full-size paper,
  fill bucket, colouring pages and captions; then (this restructure) bigger paper, side tools in landscape, quick
  colours, per-finger brushes, Party mode.
- Fixed: undo of the first stroke left it on the page; the welcome caption could replace a child's first feedback; a
  `party` variable clashed with the shared confetti function `party()`.

## Not done / known gaps
- The picture is not kept when the child leaves the game (only Save as PNG).
- Undo keeps 16 steps and is shared by everyone; undo, redo, new paper and the fill bucket wait until no finger is on
  the paper, so with several children they can seem to do nothing.
- No zoom; no line or shape drawing tools (only shape stamps).
- Speech is off by default (Talk in the 🪄 menu); captions are on.
- On a phone held sideways the paper is slightly narrower than before the side tools (about 73% of the screen vs 76%).

## Keep it this way
- Drawing code takes a brush argument; never read the global colour/tool inside `dab`, `segment`, `stampAt` or `fillAt`
  (that's what keeps children from changing each other's lines).
- Don't name variables after shared helpers (`party`, `pop`, `win`, `burst`...): all scripts share one global scope.
- Every test reads pixels through `_debug.pixel`; keep its meaning (paper + ink + outlines).

---
_Checked against the code on 2026-11-27 (main at 90ca8e4). Update this file in the same commit as any change to the game._
