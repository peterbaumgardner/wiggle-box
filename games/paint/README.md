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
- Paper (📄): 📖 my picture book, colouring pages (house, snowman, rocket, fish, flower, a letter, a number to count),
  paper colours, new paper (two taps), Save as PNG.
- **Picture book (a timeline):** New paper, or picking a colouring page, sends the drawing zooming away toward the 📄
  button and leaves fresh paper. Every picture is kept on the device, oldest to newest, as a strip at the top of the 📄
  menu (scrolled to the newest). Tapping one brings it back to keep drawing on; the picture that was on the paper goes
  into the book first. Blank paper is never kept. The picture on the paper is saved too, so it's there next time.
- Art talk: after each stroke a caption describes it (straight, wavy, zigzag, loop, spiral, corners) with its colour.
- Keyboard: 1-9 colours, Z/Backspace undo, Y redo, M mirror, E eraser, F fill, [ ] size.

## Code map
- `paint.js`: three stacked canvases (`.pp-ink` the child's paint, `.pp-lines` colouring-page outlines that are never
  erased, `.pp-guide` the mirror guide); the paper colour is the board background.
- Each finger keeps a brush `{tool, color, size, stamp}` from the moment it touches down (`fingerBrush()`); drawing
  functions take the brush, never the global state.
- `paint-book.js`: the picture book's storage (`PAINT_BOOK`), loaded first through the registry's `files`. IndexedDB
  database `wiggle-box-paint`: store `pictures` (one record per finished picture: paint layer PNG, small JPEG thumbnail,
  paper, page, letter/number, coloured parts) and store `now` (the picture on the paper). Writes run in order; without
  IndexedDB it keeps nothing and nothing breaks. Asks the browser to keep the storage (`navigator.storage.persist`).
- In `paint.js`, the "picture book" section: `archive()`, `zoomAway()`, `saveSoon()`/`saveNow()`, `openPicture()`,
  `renderBook()`. Each undo snapshot remembers the id of a picture it sent to the book (`archived`), so undo can take
  it back out and redo put it back.
- `paint.css`: all `pp-` styles, both layouts, the book strip and the zoom-away.
- Saved in `localStorage`: only the words/talk switches (`wb-paint-words`, `wb-paint-talk`).
- Test hook: `GAMES.paint._debug` (pixel(x,y) as the child sees it, state, caption, partCenters, W, H, book() the
  pictures in the book once saves finish, flush()).

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
- Picture book: New paper sends the picture away and leaves white paper; blank paper isn't kept; undo takes the
  picture back out of the book and redo puts it back; pictures are kept oldest first; tapping one brings it back; an
  untouched reopened picture isn't kept twice, a changed one joins the timeline; picking a colouring page keeps the
  drawing too; the picture on the paper is still there after leaving and coming back.
- `30-learning`: picking a colour records the colour word in the learning layer.

## Several children at once
Yes, by design: every finger paints with its own brush for its whole stroke, and Party mode gives every new finger a
different colour.

## History
- Upgrades: 33 stamps, five brushes, multi-touch, redo, paper colours, export; then category menus, full-size paper,
  fill bucket, colouring pages and captions; then (this restructure) bigger paper, side tools in landscape, quick
  colours, per-finger brushes, Party mode; then the picture book (the drawing zooms away into a timeline instead of
  being thrown away, and the picture on the paper is kept between visits).
- Fixed: undo of the first stroke left it on the page; the welcome caption could replace a child's first feedback; a
  `party` variable clashed with the shared confetti function `party()`.

## Not done / known gaps
- Nothing in the game deletes pictures from the book, and it has no size limit: it grows until the device's storage is
  full (then a caption says the book is full). Clearing the site's data in the browser empties it.
- A picture drawn on a different screen shape (the tablet turned) is fitted, not stretched, when it comes back, so a
  colouring page's coloured parts can sit slightly off its outlines.
- The book is per device and per browser; it isn't shared or backed up.
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
- Anything that wipes the paper must go through `archive()` first (with the `dirty` flag taken before `remember()`), and
  set the undo snapshot's `archived` id, or pictures get lost or duplicated.
- Storage code stays in `paint-book.js`; `paint.js` only calls `PAINT_BOOK`.

## Learning plan
See `docs/LEARNING_FRAMEWORK.md` for the research, the skill ids and the rules every game follows.

**Learning areas today:** Motor ● · Reading ◐ · Talking ◐ · Maths ◐ · Creative ● · Critical ○
**Aims at ages:** 2-8 · **Four pillars (estimate, 0-3):** Active 3 · Engaged 3 · Meaningful 2 · Social 2

What it teaches now:
- Colour names on every pick; mixing (red + yellow = orange; light and dark); art talk that describes each stroke (straight, wavy, zigzag, loop, spiral, corners).
- Stamps that count themselves; shape stamps with their sides; ABC stamps with a word; 123 stamps with ten-frames; colouring pages built from named shapes; symmetry words.
- Wired to the learning layer: colour words, mixing, stroke descriptions, stamps and finished pictures are recorded; a "Talk about it" question when a finished picture goes into the book.

Upgrades, most learning first:
1. **Story from the picture book** (`talk.narrate`, rule 8): flipping through the book, the game asks "what happened next?" between two pictures, for a grown-up to talk through.
2. **Draw-to-a-prompt invitations** (`create.design`, rule 13): an optional card "draw a house for a fish" with no right answer; tapping it again gives another idea.
3. **Symmetry challenges** (`math.spatial`): half a butterfly is drawn; the child completes the other side, then mirror magic shows the match.
4. **Pattern borders** (`math.patterns`): stamps along a line repeat a pattern; the game continues it if the child stops.
5. **Name the coloured parts** (`reading.words`): colouring pages label each part with its word as it's filled (incidental print, rule 2).
6. **Off-screen follow-up** (rule 12): Save also suggests "draw it again on paper".

"Talk about it" questions (`learn.talk`):
- Tell someone about the picture you just made. What is happening in it?
- What two colours could make brown?
- What is the same on both sides of your mirror picture?

---
_Checked against the code on 2026-11-28 (learning plan added). Update this file in the same commit as any change to the game._
