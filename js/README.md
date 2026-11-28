# The Wiggle Box platform

Plain scripts that every game can use, loaded by `index.html` in this order. Everything is global (no modules), so the
app runs from any static host and offline.

| file | what's in it |
|---|---|
| `util.js` | `$(sel)`, `clamp`, `lerp`, `rint(a,b)`, `pick(list)`, `shuffle(list)`, `inRect(x,y,el)`, `center(el)` |
| `sound.js` | `tone(freq, dur, type, vol, when, freqEnd)`, `noise(...)`, `pop()`, `cheer()`, `buzz()`, `say(text)`, `soundOn`, `soundHooks`. The sound buttons. |
| `effects.js` | `addStar()`, `burst(x, y, n, colours)`, `party()`, `floaty(stage, x, y, html)`, `shakeEl(el)`, `win(stage, x, y, label)` (confetti + cheer + star) |
| `input.js` | `fingers(el, {down, move, up})` tracks every finger (returns a Map of live fingers), `twoFinger(map)` pinch/twist, `draggable(el, {onTap, onDrop...})`, `fitCanvas(canvas)` sharp canvas sizing, `kbPointer(g, canvas)` keyboard finger |
| `ui.js` | `labShell` (canvas + info panel), `compactBar` (toolbars that fold instead of wrapping), `infoDock`, `fxOverlay`, `chips`/`bindChips`, `slider`, `plane` (graph paper), `arrow`, `popMenu(anchor, html, onPick)`, `makeHint(el)`, `fmt`, `frac` |
| `data.js` | `LETTERS` (A is for Apple 🍎), `ANIMALS`, `NUMW` (number words) |
| `learn.js` | the learning layer: `learn.saw`, `learn.tried`, `learn.level` (adaptive difficulty), `learn.say` (spoken words, grown-up switch), `learn.talk` ("Talk about it" questions), `learn.variant` (research A/B). Skill ids and rules: `docs/LEARNING_FRAMEWORK.md` |
| `grownups.js` | the grown-ups view (hold the home ⭐ counter for two seconds): practice per area, voice and talk switches, export, reset |
| `games.js` | `GAMES`, `SECTIONS`, `registerSections`, `registerGames`, `defineGame(key, {init})`, `loadGame(key)` |
| `app.js` | home screen, `open(key)` / `home()`, the play session `g`, keyboard routing, `window.WiggleBox` test hook. Loaded last. |

## The play session `g`

Every game's `init(stage, g)` gets one. Anything started through it stops when the child leaves the game.

| | |
|---|---|
| `g.loop(fn)` | `fn(dt, t)` at a fixed 60 steps a second on every screen; pauses in a hidden tab |
| `g.later(fn, ms)` / `g.raf(fn)` | a timer / one animation frame |
| `g.listen(target, type, fn, opts)` | a listener on `window`, `document` or anything outside the stage |
| `g.onEnd(fn)` | your own clean-up (ResizeObserver, audio nodes) |
| `g.key(fn)`, `g.keyFirst(fn)`, `g.keyUp(fn)` | keyboard; return `true` when the key was used |
| `g.alive` | false once the child has left |

## Changing the platform

A change here reaches every game. Run the whole desktop suite (`npm run test:fast`) and `npm run stamp` afterwards.
New helpers belong in the file whose topic they share; add a line to the table above.
