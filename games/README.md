# Making a Wiggle Box game

## 1. Start from the template

```
npm run new-game -- <key> "Game Title" [--section play|lab|math|think] [--icon 🦄] [--age 3+] [--blurb "..."]
```

You get:

| file | what it is |
|---|---|
| `games/<key>/<key>.js` | the game. Starts as a working sample: every finger draws its own coloured trail and pops stars. |
| `games/<key>/<key>.css` | its styles. Every class starts with `<key>-`. |
| `tests/games/<key>.spec.mjs` | its tests |
| a line in `games/registry.js` | its tile on the home screen |

Run `npm run serve` and open `http://127.0.0.1:4173/#<key>`.

## 2. The shape of a game

```js
defineGame('bugs', {
  init(stage, g) {
    stage.innerHTML = `<div class="bugs">...</div>`;   // build inside stage
    g.loop(dt => { /* 60 times a second */ });
  }
});
```

- `stage` is the empty play area. Put everything inside it.
- `g` is this play session. Start timers, loops and outside listeners through it (`g.later`, `g.loop`, `g.listen`,
  `g.onEnd`) and they all stop by themselves when the child taps ←. Listeners on elements inside `stage` need nothing:
  the stage is emptied.
- Keep helper functions inside `init`. All game files share one global scope, so a top-level `function draw()` in two
  games would clash.
- Optional: `GAMES.<key>._debug = {...}` exposes read-only state to the tests.

The shared helpers (sound, confetti, stars, touch tracking, toolbars, menus) are listed in [js/README.md](../js/README.md).

## 3. Rules every game follows

1. **Many fingers at once.** Several children play together. Track touches by `pointerId` (the `fingers()` helper does
   this), never assume a single touch, and let each finger keep its own state (Magic Paint gives each finger its own
   colour and brush for the whole stroke).
2. **Big targets.** Buttons at least 44 px, comfortable at 60+. A slow toddler press is a long press: act on
   `pointerup` on the same button, not only on `click` (see `presses()` in `games/paint/paint.js`).
3. **Every screen.** Phone and tablet, portrait and landscape. Put tools under the play area in portrait and down the
   side in landscape so the play area keeps the long side. `tests/20-layout-touch.spec.mjs` checks every game on four
   screen sizes automatically.
4. **No dead ends.** Nothing to lose, no timers that punish. Undo where it makes sense.
5. **Clean up through `g`.** A game must leave nothing running after ←: `tests/02-lifecycle.spec.mjs` checks.

## 4. The registry line

```js
{key:'bugs', title:'Bug Hunt', icon:'🐞', color:'var(--leaf)', age:'3+', section:'play', order:9,
 blurb:'Find the hiding bugs', css:true},
```

| field | meaning |
|---|---|
| `key` | folder and file name, lower case; also the link `index.html#bugs` |
| `title`, `icon`, `blurb`, `age` | the home-screen tile |
| `color` | tile colour: `var(--sky|sun|berry|leaf|grape|tang|aqua)` or any CSS colour |
| `section`, `order` | which home-screen section and where in it |
| `css` | `true` loads `games/<key>/<key>.css` |
| `files` | extra scripts to load first, e.g. a science model: `['games/atoms/atoms-sci.js']` |
| `layout` | `'full'`: slim header and an edge-to-edge stage (Magic Paint) |

## 5. Before you ship

```
npm run check                                   # registry, files, syntax, offline list
npm run stamp                                   # new offline cache version
npx playwright test tests/games/<key>.spec.mjs --project=desktop
npm run test:game -- "launch, render, exit and reenter: <key>"
```

New games are picked up automatically by the launch, lifecycle, offline and layout tests.

## 6. Each game's README

Every game folder has a `README.md`: what the game is, how it plays, a code map, what's done (with the tests that prove
it), how it behaves with several children at once, its history, what isn't done, and rules to keep. Read it before you
change the game and update it in the same commit. `npm run check` fails if a game has no README.

Gaps that apply to every game (not repeated in each README):
- **Spoken words are off.** `say()` does nothing while `VOICE=false` in `js/sound.js`. Captions and labels show on
  screen; Magic Paint has its own Talk switch.
- **Never tested on real devices.** All tests run in headless Chromium with emulated touch; no Safari/iPad, Firefox or
  physical touchscreen runs (`WIGGLE_BOX_TEST_REPORT.md` › Known limits).
- **Styles.** Except Magic Paint, Hungry Monster, Element Box and Atom Builder, a game's styles are still in the shared
  `css/app.css`. Move them into the game's own CSS file when you work on that game.
