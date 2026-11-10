# Hungry Monster 2.0: Shared-Play Redesign Specification

Status: Proposed implementation plan. No gameplay code changes authorized by this document.
Repository: peterbaumgardner/wiggle-box
Baseline reviewed: main, tree a5f6b8e54b073e71612c6580e39b63447f51631d (2026-11-10)
Game: games/feed.js
Primary audience: ages 3 to 7, with accessible participation for younger and older players.
Primary requirement: one shared device; spontaneous participation by one to many children; no player-count selection, turn assignment, ownership, network session, or player registration.

## 1. Product vision

Hungry Monster becomes a lively shared toy world. Munch, the familiar hungry monster, remains the emotional centerpiece. Children are free to feed Munch, prepare food, invent recipes, change the environment, comfort or entertain Munch, and uncover surprising reactions. These actions naturally exercise counting, classification, pattern recognition, cause and effect, sequencing, spatial reasoning, emotional inference, and cooperative communication.

The core loop is PLAY -> OBSERVE -> DISCOVER -> EXPERIMENT -> PLAY AGAIN. No quiz gates, required answers, score pressure, losing states, forced timers, or ownership of actions. Optional requests from Munch are invitations and can be ignored indefinitely without penalties.

The acceptance test is not whether a child completes a worksheet. It is whether two or more children can enter the same session, act at once, talk about their discoveries, help each other, and continue experimenting without fighting over a single exclusive control.

## 2. Repository audit and current constraints

Files examined: games/feed.js, js/core.js, js/app.js, css/app.css, tests/12-play-and-learn.spec.mjs, tests/20-layout-touch.spec.mjs, WIGGLE_BOX_AUDIT.md, WIGGLE_BOX_GAME_MATRIX.md, WIGGLE_BOX_TEST_REPORT.md, README.md, package.json.

Current feed.js implements:
- Three manual level chips: 1-5, 1-10, Adding +.
- Eight emoji-based food types.
- A random target quantity; food tray contains min(target + 3, 13) identical pieces.
- Single global eaten counter, a single global busy boolean, and a round ID.
- Tap-to-fly or drag-to-feed through shared draggable().
- Completion after exactly target feedings, a star, then a new round after 3200 ms.
- Eye movement tracks pointer movement; hungry/chomp/happy CSS states.
- Number narration calls say(), but VOICE is globally false in js/core.js, so prompts and counting are silent in the current configuration.

Existing Playwright tests confirm basic counting and addition completion, drop rejection/return, general screen layout, and offline compatibility. They do not measure two concurrent active touches, ten active contacts, simultaneous manipulation of distinct objects, race-free feeding, cooperative acts, child UX, or responsive interaction latency.

Shared js/core.js offers draggable(), fingers(), twoFinger(), tone(), burst(), and helpers. Session g in js/app.js provides g.listen, g.later, g.loop, g.raf, g.onEnd, g.stop. Reuse session lifecycle and existing sound/event primitives. Do not change shared helpers unless a verified cross-game defect demands it.

The app is static, with no runtime build step. package.json uses @playwright/test 1.63.0. The service worker sw.js maintains the offline asset list, with npm run stamp updating cache metadata. A redesign must remain installable, offline-first, and self-contained.

## 3. Design principles and hard requirements

1. Entry is immediate. Open Hungry Monster and start touching. No lobby, user names, avatars, player counts, role selection, age quiz, or instructions blocking input.
2. Every touch matters. Separate fingers can manipulate separate objects simultaneously. No global gameplay lock in normal play.
3. One common world. All players contribute to persistent shared changes; no personal counters or exclusive goals.
4. Multiple useful jobs. At any instant one child can feed, another cook, another decorate, another activate world elements. No single choke point.
5. Monster agency. Munch reacts to ingredients, texture, order, size, color, weather, gestures, and previous actions. Munch also occasionally initiates playful invitations.
6. Optional learning. Numbers and symbols appear as descriptive feedback; challenges are invitations, not prerequisites. There are no wrong-answer punishments.
7. The game never scolds or blocks experimentation for a perceived mistake.
8. No hard finish. Events resolve locally and play continues without a round restart.
9. Progressive discovery. Reactions are deterministic enough to be learnable and varied enough to encourage experimentation, with clearly signaled rare surprises.
10. Safety and accessibility. No ads, accounts, analytics by default, external calls, microphone permission, competitive leaderboards, manipulative scarcity, or coercive engagement.
11. Gameplay supports keyboard and reduced motion, and remains useful with sound off.
12. Optimize for common tablet sizes first, then phones, touch laptops, and large horizontal touch displays. Do not promise ten simultaneously supported contacts on hardware that provides fewer.

## 4. Core scene and touch zones

On a typical landscape tablet:
- Center 45%-55%: large animated Munch with clear mouth, eyes, expression and responsive body.
- Bottom, left and right edges: multiple independently usable ingredient sources, tools, and tactile play objects.
- Near left: ingredient garden and toy pantry.
- Near right: preparation stations (mix, squash, stack, chill or warm).
- Background: discoverable objects, weather, decorations, tiny critters.
- Minimal top HUD: mute, back, accessible hints, optional caregiver control.
- No prominent score bar, large mode row or mandatory question banner.

On a portrait phone:
- Monster occupies upper-middle area.
- Ingredient shelf and two compact prep stations remain accessible below.
- A paged horizontal ingredient ribbon is acceptable only when alternative actions are still visible and the ribbon does not monopolize controls.
- Finger targets use at least 44 CSS px, with generous spacing and visible drag feedback.
- One-handed single-player experience must remain fully featured.

The stage must reserve display areas based on available real CSS pixels, not assume a fixed 320px monster. Handle browser zoom, safe-area insets, and rotations. Prevent browser pan or zoom only on interaction zones, not indiscriminately across accessibility controls.

## 5. Simultaneous play model

No notion of number of players exists in the data model. The model tracks active POINTERS and interactions, not people.

Maintain a Map<pointerId, Interaction> with independent pointer ownership of manipulable objects. Pointerdown performs hit testing, claims one eligible object if available, captures the pointer, and begins an interaction. Pointermove updates only its object. Pointerup commits drop/surface interaction, releases its claim, and cleans up. Pointercancel/lostpointercapture safely restores or releases the claim and MUST NOT be interpreted as successful feeding.

Multiple pointers may act on different objects at once. A single object cannot be dragged by two pointers unless the object explicitly implements a cooperative gesture. Two-finger gestures over a large mixing bowl can stir/rotate together, but cannot steal another active object's input.

Use a transaction-like feed() action: each food object has lifecycle READY -> HELD -> IN_FLIGHT -> CONSUMED (or RETURNING -> READY); mark CONSUMED at most once; reject duplicate finalization; trigger an individually queued reaction. No shared busy flag. Munch may queue visible mouth-chew animations while accepting new food; the intake queue must have bounded capacity and provide immediate visual acknowledgment.

When Munch's mouth is visually occupied, accepted food can bounce into a visible waiting arc or belly queue, rather than rejecting a child. Keep that queue short enough to be comprehensible and drain it promptly. Count only accepted food events, not raw pointerup events.

Offer multiple feed targets during special events: mouth, mixing bowl, garden soil, and a helper critter. Avoid a central bottleneck at Munch's mouth when many children play. Overlapping drag destinations should use explicit priority and visible hover cues.

Pointer event listeners must be registered with g.listen or on game-owned nodes and removed/canceled at session termination. On resize/orientation change, keep object coordinates normalized, preserve active drag continuity where technically possible, and reset unsafe capture cleanly.

Desktop mouse fallback must work. Touch-action and passive listener choices must be explicit. Keyboard: tab to tools/foods, Enter or Space to pick/use/drop, Escape cancels a held item. Reduced-motion mode substitutes instant transformations for long animation.

## 6. Main game systems

### 6.1 Feed Munch
Tap any food to toss it toward Munch; drag it into the mouth for more control. Different foods produce recognizable reaction families (favorite, surprised, tangy, icy, crunchy, sleepy, fizzy, silly). Responses include eyes, ears, mouth, body, sound, and a short visual effect. No ingredient is punished as wrong.

Basic discovery rules: apples cause happy crunch, lemons make puckering faces, icy food causes shivers, spicy-looking fantasy pepper causes harmless steam, blended rainbow food causes a brief color-shifting hiccup. Avoid modeling hazardous consumption, real food allergies, or sickness as a joke.

### 6.2 Make the food
Children can combine two or more items in a large bowl, stir by dragging or circling, press a squash surface, stack ingredients, or use temperature stations. Combinations produce recipes with stable, visible traits such as color, texture, size and shape. The output is immediately grabbable and feedable.

This creates parallel roles: gather, prepare, experiment, feed, observe. Every role is optional and available to any participant.

### 6.3 Monster moods and care
Munch has clearly illustrated expressive states: curious, excited, sleepy, ticklish, surprised, pleased, playful. These are short-lived reactions, not punitive health meters. Children can pat, tickle, decorate or soothe Munch; repeated touch to the same region varies the reaction. Munch initiates nonverbal invitations, such as looking toward a falling berry or pointing to a mixing bowl.

### 6.4 World reactions
Food seeds can sprout into a garden. Rain makes plants grow. Sun changes the garden. Bubbles can be popped by many fingers. Decorative food art can be made on the scene. Events should be short, reversible, and never block simultaneous ordinary actions.

### 6.5 Cooperative discoveries
At least four activities must reward simultaneous contributions WITHOUT requiring the game to identify participants:
- A giant watermelon can be rolled/held by one pointer while another peels or slices it. A single user can still complete this with sequential actions.
- Two ingredients added from opposite sides of a shared bowl create an unusual blended snack.
- Multiple hands touching separate color bubbles produce a combined color burst.
- A large rain cloud can be pulled while other fingers plant seeds and water the garden.

Progress must not depend on having two different human beings; the physics/interaction model recognizes touches, not users. A solo child can complete everything with additional time.

### 6.6 Surprise events
After a range of meaningful actions, the world occasionally initiates a celebration: bouncing berries, tiny monster friends, a short music jam, monster hiccups that turn food into bubbles, or a harmless environmental transformation. Events are triggered by gameplay and curiosity, not hidden streak pressure. Never auto-launch long noninteractive cutscenes.

### 6.7 Discovery book
An optional visual scrapbook shows recipes and reactions that the device has encountered. It is a reference to revisit discoveries, not a checklist that blocks content. Avoid accumulating stars as a required progression currency. Persist only coarse local discovery flags with a versioned schema, and handle blocked or corrupted localStorage.

## 7. Learning design, embedded instead of demanded

Learning dimension | Natural mechanic | Optional reinforcement
Counting | Food lands in bowl one by one; belly shows 1, 2, 3 pieces | Brief visual dots/numerals after interactions
Addition | Two ingredient piles merge into one recipe | Tiny 2 + 3 = 5 card displayed after the experiment, never before it
Subtraction | Munch eats from a visible plate | Remaining pieces visibly reduce
Patterns | Mix ingredients in alternating sequences for a special visual recipe | Repeatable rhythmic responses
Sorting | Ingredient shelf naturally groups by colors, textures, size, category | Monster notices consistent combinations
Cause and effect | Same food prepared differently yields different responses | Quick before/after change cues
Sequencing | Wash, chop, mix, serve in any order, with outcomes reflecting order | Wordless animations show steps
Prediction | Munch signals curiosity; children anticipate response | Optional “What happens if…” thought bubble
Spatial reasoning | Toss, roll, rotate, stack and redirect objects | Trajectory/impact feedback
Language | Food labels optional, visual icons and speech if enabled | Keep experience functional without narration
Emotional literacy | Read moods and try playful comfort responses | Mood reflected in eyes, posture and sound
Cooperation | Independent actions can join into world events | Shared celebration, no individual credit

A design must not claim a given gesture teaches a skill without evaluation. Measure observed play, comprehension and transfer separately.

## 8. Monster behavior and reactivity

Implement an explicit monster state machine with composable channels rather than one giant exclusive state:

Expression: neutral / curious / delighted / startled / sleepy / puckered / amazed.
Body action: idle / bounce / wobble / shiver / wiggle / celebrate.
Mouth action: idle / open / receive / chew / burp.
Attention: tracks latest relevant nearby food or touch.
Temporary effects: particle bursts, color pulse, decorative accessories.

A reaction scheduler accepts simultaneous events and prioritizes them: interaction acknowledgement within the current or next visual frame; food acceptance within a short window; long celebration deferred or interrupted by direct interaction. Never let a 3-second celebration freeze input.

At idle, Munch blinks, looks around, asks wordless questions and reacts to background events. Boredom mechanics are prohibited: Munch must not express guilt or distress to pressure continued play. Include 10-15 small animations plus at least 20 meaningful food/preparation reaction combinations in the complete release.

Use deterministic, testable recipe and reaction tables, with constrained randomness on cosmetic presentation only.

## 9. Architecture and file plan

Keep GAMES.feed.init(stage,g) as the integration entrypoint. Split feed internals into small browser scripts if needed, adding script entries to index.html and offline entries to sw.js, or keep file-local modules via closures when practical. Avoid a broad framework migration.

Proposed files:
- games/feed.js: scene composition, startup, session lifecycle, integration with GAMES, debug accessor.
- games/feed-model.js: pure state updates, recipes, inventory, object lifecycle, world events.
- games/feed-input.js: pointer registry, hit testing, object claims, drag/drop and cooperative gestures.
- games/feed-monster.js: Munch state, expressions, animations and reactions.
- games/feed-render.js: DOM/SVG presentation, layout, responsive positioning, effect rendering.
- games/feed-content.js: ingredient definitions, combinations, discovery tables and learning annotations.
- css/app.css: replace only Hungry Monster selectors; keep global visual system consistent.
- tests/34-hungry-monster.spec.mjs: independent, explicit game-specific tests.
- tests/20-layout-touch.spec.mjs: add new Hungry Monster portrait/landscape coverage.
- sw.js, index.html: include any new runtime scripts in correct order.
- docs/HUNGRY_MONSTER_2_PLAN.md: this living spec.

The precise split is a design proposal, not a mandate to create unnecessary layers. Prefer testable pure logic and localized changes.

Data objects should have stable IDs, recipe trait sets, scene coordinates, interaction state and optional drag owner pointer IDs. Separate deterministic gameplay state from animations. Never expose the full mutable state through the test debug interface; expose read-only snapshots/events sufficient for assertions.

Do not add a server, database, auth, WebSockets, multiplayer networking, telemetry SDK, game engine, or third-party runtime dependency.

## 10. Collision and concurrency rules

- Two touches down on separate foods in the same animation frame create two separate drags.
- Two feeds reaching Munch simultaneously produce two successful, unique consumptions, two observable feedback events and no lost state update.
- Rapid 20-pointer synthetic stream or device-supported maximum causes no exceptions and no blocked controls; only physically supported contacts are expected on real devices.
- A second finger cannot hijack food already held by another pointer.
- A touch canceled by browser/OS releases its claim and leaves food available.
- A completed or removed object cannot be consumed twice.
- Taps never fire twice due to pointerup plus lostpointercapture.
- Simultaneous tapping of tools while other fingers drag food does not cancel their movement.
- Opening a caregiver dialog or leaving the game disposes active touches, loops, timers and audio cleanly.
- Co-op actions resolve consistently regardless of the order in which adjacent pointer events arrive.
- Resize and rotation do not strand food off-screen.
- Pointer events outside stage / over browser chrome do not corrupt local scene.

## 11. Accessibility, safety and performance

- WCAG-informed contrast and keyboard/focus treatment for functional controls.
- Visible cues accompany sounds; sound off must preserve information.
- Respect prefers-reduced-motion and supply a low-motion rendering path.
- No autoplay speech pressure, flashing effects or highly repetitive intense strobes.
- All recurring animation work uses the existing session lifecycle; eliminate detached timers from destroyed sessions.
- Scene responds immediately on first touch even while assets or effects warm up.
- Render expensive effects through capped particles and pooled DOM elements or a canvas overlay; do not rebuild every draggable DOM node on each animation tick.
- Aim for 60 FPS on a current midrange tablet, with a 30 FPS acceptable fallback on slow phones; measure on real hardware before claiming these targets.
- Target pointer-to-visible-response p95 below 80ms on tested midrange hardware, and no visible missed valid interactions. Record measured baselines.
- Cap concurrent sound voices; prioritize feedback over decorative audio. Avoid audio pileups during group play.
- Maintain complete offline operation after service worker installation and after a refresh.
- On very small devices, keep the mouth and at least two simultaneous actions reachable without a modal or carousel step.

## 12. Implementation phases and deliverable gates

Phase 0. Evidence and baseline
- Capture baseline screenshots and video from current game on phone portrait, landscape, tablet portrait/landscape, desktop.
- Execute existing feed tests and document baseline pass/fail and measured frame responsiveness.
- Verify actual multi-contact capabilities of representative hardware.
Gate: concrete baseline and no undocumented assumptions.

Phase 1. Shared input foundation
- Introduce per-pointer interaction registry, object-claim lifecycle, transactional feed acceptance, and safe cancellation.
- Replace global busy-based feeding lock without changing recognizable feeding pleasure.
- Add automated concurrent-touch, double-finalization, cancel, drop, input-cleanup tests.
Gate: two simultaneous feeds always commit exactly once each; gameplay remains available while chewing.

Phase 2. Monster personality
- Implement expressive reaction table, composable animation channels, idle attention and layered audio cues.
- Retain familiar visual silhouette and chomp animation.
- Eliminate the hard round-complete pause and manual difficulty controls from normal flow.
Gate: any child can feed continuously; different actions produce recognizable and stable responses.

Phase 3. Kitchen sandbox
- Add multiple ingredient sources, independent dragging, bowl, combining, squashing and temperature actions.
- Make recipe outputs meaningful: visual differences and monster reactions.
- Add discovery persistence.
Gate: a child can prepare and feed at least five recipes; two children can do separate work simultaneously.

Phase 4. Cooperative world
- Add garden/weather, multiple targets, large-object cooperative gestures, color bubbles and surprise events.
- Design so solo play remains complete.
Gate: concurrent actions can combine to create a genuinely new event; no turns or player selection.

Phase 5. Embedded learning
- Integrate number, color, ordering, basic arithmetic and emotion cues as optional contextual feedback.
- Remove required quiz-style rounds and correction/scolding.
- Make prompts dismissible/ignorable and wordless wherever possible.
Gate: five-minute unscripted play requires zero quiz answers; learning cues arise from actions.

Phase 6. Visual and interaction polish
- Purpose-built assets (prefer vector/SVG/CSS for offline scaling), responsive layout, input feedback and effect performance.
- Sound-off and reduced-motion alternatives.
Gate: playful, legible and fully usable on all supported breakpoints.

Phase 7. Validation and release
- Run all Playwright suites, update existing Hungry Monster test expectations, run offline tests and cache stamp.
- Device validation: at least one iPad or equivalent tablet, one Android touchscreen, one desktop mouse/keyboard, both orientations.
- Observed usability: a solo child, two children sharing, and a group of at least four; ten-child claim separately evaluated on hardware large enough to permit participation.
- Observe whether anyone says “my turn,” whether each child has a useful activity, and whether play persists with no adult explanation.
Gate: meets acceptance metrics below; preserve rollback via commit history.

## 13. Acceptance criteria

Functional:
- Start in one tap from Wiggle Box home without setup.
- Feed at any time. No round transition prevents playing.
- Independently track at least two simultaneous touches end to end.
- Every consumed object has exactly one consumption event.
- Two independently active foods cannot be reassigned across pointers.
- At least four independently useful simultaneous activities.
- At least 12 ingredients, five preparation actions, 20 reaction combinations and four cooperative discoveries in the full release.
- At least 10 readable monster expressions/motions and three surprising environmental events.
- Solo play requires no multitouch-only task.
- Any optional educational text can be ignored without progress loss.
- Works offline, sound off, keyboard accessible and reduced motion supported.

Quality:
- No uncaught errors during scripted stress test of 1000 mixed down/move/up/cancel events.
- No active pointers, timers or loops after game exit.
- No objects inaccessible after an orientation change.
- No overlap of touch targets on the supported screen matrix.
- No regressions in non-Hungry Monster games.
- Record real-device median and p95 response latency and frame rate rather than claim unverified figures.

Playtest behavioral metrics (proposed evaluation thresholds, not scientific universal norms):
- In a ten-minute two-child test, neither child should need an assigned turn to perform useful actions.
- Each child independently discovers at least three meaningful interactions, or testers record why this fails.
- Children voluntarily retry a preparation or combination to explore outcomes.
- Count unsolicited cooperative talk, explanation and joint discoveries without prompting.
- A child can begin playing within 10 seconds of opening, without an adult explaining a rule.
- A child can enjoy five minutes of play without seeing a required math prompt.
- Parent/observer reports no coercive progress gates or frustration from blocked interactions.

## 14. Automated test matrix

Unit tests for pure model:
- Ingredient trait composition, deterministic recipes, idempotent consume, event ordering, capacity bounds, persistence schema/version.
- Mood priority and reaction scheduling, including an interruption by direct input.

Browser integration:
- Two concurrent CDP touch points each drag separate food and both feed successfully.
- Three simultaneous contacts: bowl stir + food drag + monster pat.
- Two simultaneous drops resolving same frame or adjacent frames.
- Duplicate pointerup/lostpointercapture, canceled touch, fast re-entry and reopen.
- Rotation/resize mid-drag; object return and clipping.
- No global lock during chew/celebration.
- 5-to-10 finger stress test where supported by browser simulation.
- Recipe creation and re-feed, stable discovery persistence across reload.
- Offline launch and runtime asset cache correctness.
- Sound off; low-motion media query; keyboard navigation.
- Cross-game smoke tests for all remaining 27 games.

Manual:
- iOS Safari, Android Chrome, Chrome desktop; touchscreens of differing touch capacity.
- Real co-play with 2 children and larger groups; watch for accidental hand blocking and physical crowding.

## 15. Failure modes and mitigations

Physical crowding: ten children cannot comfortably reach one small phone. Scale the world and distribute play surfaces for a tablet or large interactive display; do not misrepresent the phone experience.
Finger occlusion: large draggable objects and hover previews must remain visible away from the touching finger.
Audio overload: batch/duck music and cap concurrent effects.
Reaction overload: prioritize feed acknowledgement and queue nonessential celebrations.
Overcomplicated UI: avoid a toolbar of twenty tools. Expose 2-3 simple manipulators and let objects reveal additional interactions.
Shallow combinations: stable ingredient traits must map to outcomes, not merely random confetti.
Learning creep: remove any feature that gates fun behind a quiz.
State bloat: cap world objects and persist discoveries only, not live pointer state.
Regression: isolate changes to Hungry Monster, shared helpers only with a demonstrated test-backed need.

## 16. Out-of-scope

No cross-device multiplayer; no network synchronization; no accounts, profiles or player slots; no AI model calls; no chat, microphone, camera or location permission; no competitive scoring; no purchases; no unrelated changes to the other 27 games.

## 17. Research evidence and interpretation

- Toca Kitchen 2 demonstrates the appeal of ingredient experimentation and memorable character reactions, and intentionally avoids conventional scoring and rules. Primary reference: Toca Boca official video, https://www.youtube.com/watch?v=_dBHg4h3dPg ; independent review https://www.commonsensemedia.org/app-reviews/toca-kitchen-2.
- Sago Mini World explicitly uses child-directed, open-ended creativity without required time limits or points: https://sagomini.com/world/ and https://sagomini.com/article/learning-through-play-build-real-world-skills-with-sago-mini-world/.
- Fleck, Vasalou and Stasinou, “Tablet for two: How do children collaborate around single player tablet games?” International Journal of Human-Computer Studies (2021), https://www.sciencedirect.com/science/article/pii/S1071581920301415. Their study shows that design shapes co-construction versus turn taking, and does not imply that multiple touches alone create cooperation.
- Shoshani, Nelke and Girtler (2022) found prosocial touchscreen play associated with subsequent helping and sharing behaviors in 3-to-6-year-olds, https://www.sciencedirect.com/science/article/pii/S0747563221004003.
- NAEYC guidance supports exploratory, self-directed learning through play with responsive opportunities to extend learning: https://www.naeyc.org/get-involved/membership/connecting-play-to-learning-goals and https://www.naeyc.org/our-work/families/support-learning-with-play.
- Research cautions against assuming more interactive features automatically improve learning or transfer: https://pmc.ncbi.nlm.nih.gov/articles/PMC5020045/.
- A review of physical-digital play notes that multitouch affordances can make shared screen use easier, but play design still matters: https://www.research.ed.ac.uk/files/218819963/DigitalPlayTechnology_AuthorVersion.pdf.

These sources inform product hypotheses. They do not establish that this proposed game has already demonstrated educational efficacy. That requires observation and evaluation.

## 18. Recommended first implementation milestone

The first playable deliverable should preserve the existing recognizable Munch and feeding behavior, then add:
1. No manual level chips or round/lock interruptions.
2. Two or more simultaneous independent touch feeds with event-safe consumption.
3. Six distinct monster reactions.
4. Two ingredient stations and one mix bowl supporting shared use.
5. Immediate visual feedback for every accepted interaction.
6. Two cooperative discoveries that solo players can still perform sequentially.
7. New automated concurrency tests and verified offline launch.

This milestone is a genuine playable shared toy, not a broad architecture scaffold. Only after children can use this slice successfully should garden/world events, extensive reaction sets and optional learning overlays expand.
