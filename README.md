# Wiggle Box

28 touchscreen games for curious kids: physics, chemistry, math and puzzles, with the real formulas built into the play.

**Play:** https://peterbaumgardner.github.io/wiggle-box/

Open it in Chrome, Edge or Safari and install it (address-bar install icon, "Install app" on Android, or Share → Add to Home Screen on iPad/iPhone). After the first visit it works offline.

## How the code is laid out

```
index.html          the page: home screen markup and the list of scripts
css/app.css         all styles
js/core.js          shared helpers: sound, effects, touch/drag input, the lab shell and info tabs
js/data.js          shared word and picture lists
games/<game>.js     one file per game (28): atoms, balance, bridge, cannon, chance, circuit, bubbles, paint, feed,
                    shapes, music, words, fireworks, forge, potion, geo, graph, art, laser, physics, primes,
                    puzzles, robo, sand, space, splash, trace, waves
js/app.js           home screen, opening and closing games, keyboard, test hook (loaded last)
sw.js               offline cache
```

Each game file adds itself to `GAMES` with a title, icon, home-screen section and an `init(stage, g)` function that
builds the game inside `stage`. `g` is the game's session: use `g.later`, `g.loop`, `g.listen` and `g.onEnd` so
everything stops when the child leaves the game.

No build step: plain scripts, loaded in order. To fix a game, edit its file in `games/`, then:

```
npm run stamp      # gives the offline cache a new version so devices pick up the change
npm run test:fast  # desktop tests (about 30 minutes); npm test runs everything
```

To add a game, create `games/<key>.js`, add a `<script>` line for it in `index.html` (before `js/app.js`) and add
the file to `SHELL` in `sw.js`. The offline test fails if a file the page loads is missing from `SHELL`.
