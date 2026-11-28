# Wiggle Box

Touchscreen games for curious kids: painting, physics, chemistry, math and puzzles. Every game is built for several
children touching the screen at once.

**Play:** https://peterbaumgardner.github.io/wiggle-box/

Open it in Chrome, Edge or Safari and install it (address-bar install icon, "Install app" on Android, or Share → Add to Home Screen on iPad/iPhone). After the first visit it works offline.

## How the code is laid out

```
index.html                 the page: home screen markup and the platform scripts
games/registry.js          THE GAME LIST: one line per game (title, icon, section...). The home screen is built from it.
games/<key>/<key>.js       one folder per game: its code ...
games/<key>/<key>.css      ... its own styles (when the registry line says css:true)
games/<key>/README.md      ... and its notes: what it is, what is done and not done. Read it before changing the game.
games/_template/           the starting point for a new game (a working multi-touch sample, its styles, its tests)
js/                        the platform every game shares (see js/README.md):
  util.js  sound.js  effects.js  input.js  ui.js  data.js   helpers: maths, sound, stars and confetti, touch, toolbars
  learn.js  grownups.js    the learning layer (practice records, adaptive levels, voice, talk prompts) and the grown-ups view
  games.js                 the registry and the loader that fetches a game's files when it opens
  app.js                   home screen, opening and closing games, keyboard, test hook (loaded last)
css/app.css                shared styles (layout, home screen, game shell, lab shell, toolbars)
sw.js                      offline cache (its file list is generated, see npm run stamp)
tools/                     new-game, check, stamp
tests/                     browser tests; tests/games/<key>.spec.mjs for games made from the template
```

A game's files load only when a child opens it. A mistake in one game shows "Oops" in that game; the home screen and
every other game keep working.

## Learning

Wiggle Box is built as a research template for incidental learning (ages 3-10): motor skills, reading, talking, maths,
creative and critical thinking. The research, the skill map and the rules every game follows are in
[docs/LEARNING_FRAMEWORK.md](docs/LEARNING_FRAMEWORK.md); each game's README has its own Learning plan. Grown-ups can see
what was practised, switch spoken words and "Talk about it" questions on or off, and export the data: hold the ⭐
counter on the home screen for two seconds. Nothing leaves the device.

## Everyday commands

No build step: plain files, any static web server.

```
npm ci                 # once: installs the test runner
npm run serve          # play locally at http://127.0.0.1:4173/  (index.html#paint opens a game directly)
npm run check          # a few seconds, no browser: registry, files, syntax, offline cache
npm run stamp          # after changing any app file: refreshes the offline cache so devices pick up the change
npm run test:game -- "Magic Paint"   # the browser tests whose names match
npm run test:fast      # every desktop test (about 30 minutes); npm test runs every screen size too
```

## Add a game

```
npm run new-game -- bugs "Bug Hunt" --section play --icon 🐞 --age 3+
```

That creates `games/bugs/` from the template, adds its line to `games/registry.js`, a test file in `tests/games/`,
and refreshes the offline cache. Open `index.html#bugs` and start changing it. The full guide is in
[games/README.md](games/README.md).

## Work on one game

Everything for a game is in its folder: `games/<key>/<key>.js` and `<key>.css`. Change it, then:

```
npm run check && npm run stamp
npm run test:game -- "<the game's title>"
```

Styles in a game's own CSS file start with the game's class prefix (Magic Paint uses `pp-`), so they can't change
another game. Older games still keep some styles in `css/app.css`; move them into the game's folder when you work on
that game.
