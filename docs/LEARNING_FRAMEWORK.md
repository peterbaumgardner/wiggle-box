# Wiggle Box learning framework

How every Wiggle Box game turns play into learning for ages 3-10, what the research says (and doesn't), the skills we
aim at, the rules each game follows, and how to use the app as a research template. Each game's own plan is in the
"Learning plan" section of `games/<key>/README.md`. The shared code is `js/learn.js`.

Last reviewed: 2026-11-28.

---

## 1. The goal in one paragraph

Children should learn **as a side effect of playing**, not by being quizzed. A child who paints hears and sees colour
names; a child who feeds the monster counts the strawberries; a child who builds a bridge discovers that triangles hold.
The game supplies a rich world, names what's happening, makes the next step just hard enough, and invites talk with the
people around the screen. Several children play at once, so the world must give each of them something to do.

## 2. What the research says

Strength of evidence: **strong** (meta-analyses or repeated trials), **moderate** (several studies, some caveats),
**weak / mixed** (small or conflicting studies). Where the evidence is weak we still may use the idea, but we don't
claim it works.

| # | Finding | Strength | What we do with it |
|---|---|---|---|
| 1 | Apps teach when they are **active, engaged (not distracted), meaningful, and socially interactive**, inside a clear learning goal. [Hirsh-Pasek et al. 2015](https://www.psychologicalscience.org/publications/educational-apps.html) | moderate (a framework built from the learning-science literature) | Every game names its learning goal (README) and is checked against the four pillars (section 5). |
| 2 | **Guided play** (child-led play in a world an adult designed, with gentle scaffolds) beat direct instruction for early maths (g = 0.24), shape knowledge (g = 0.63) and task switching (g = 0.40), and beat free play for spatial vocabulary (g = 0.93). No outcome where it did worse. [Skene et al. 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9545698) | strong (17 studies, N = 3,893, ages 1-8), with varied definitions | Our default teaching style: open worlds, a goal the child can see, hints that appear only when needed. |
| 3 | Children pick up words **incidentally** from rich language: repeated labels across sentences, diverse vocabulary, and the same words met in more than one medium. The first few exposures count most. [summary of studies](https://pmc.ncbi.nlm.nih.gov/articles/PMC4277705), [Reading Rockets](https://www.readingrockets.org/resources/resource-library/how-words-can-and-cannot-be-learned-observation) | moderate | Games label what children do, in varied sentences ("a *tall* tower", "*taller* than the tree"), and reuse words across games via shared word lists. |
| 4 | **"Subliminal" learning** (messages below conscious perception) has no reliable evidence of lasting effects. [overview](https://www.macmillanlearning.com/digital/flipbooks/2024-bfw-MyersAP4e-TE/files/basic-html/page129.html) | evidence against | We don't hide messages. "Passive" in Wiggle Box means **incidental**: learning content is visible and audible, but woven into play rather than demanded. |
| 5 | **Linear number board games** improved preschoolers' number line estimation, magnitude comparison, counting and numeral identification; circular boards and colour boards didn't. [Siegler & Ramani 2009](https://www.cmu.edu/dietrich/psychology/cs/research-teaching/docs/SieglerBoardGamesCDPerp2009.pdf), [Ramani et al. 2012](https://education.umd.edu/sites/default/files/uploads/Ramani%20et%20al.%2C%202012%20%281%29.pdf) | moderate (small RCTs, mostly one group; a UK replication) | Lay numbers out on straight lines (left to right, evenly spaced) wherever quantities appear. |
| 6 | Talk about number **with visible sets**, especially sets of 4-10, predicts cardinal number knowledge. [Gunderson & Levine 2011](https://pmc.ncbi.nlm.nih.gov/articles/PMC3177161), [Levine et al. 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC2998540) | moderate (correlational; experimental follow-up by [Gibson et al. 2020](https://cogdevlab.uchicago.edu/files/2017/01/Child-Development-2020-Gibson-Causal-Effects-of-Parent-Number-Talk-on-Preschoolers-Number-Knowledge.pdf)) | Count things the child can see, say the total ("five apples!"), and favour 4-10 over 1-3. |
| 7 | **Spatial skills are trainable**: g = 0.47 overall and 0.61 under age 13 ([Uttal et al. 2013](https://news.northwestern.edu/stories/2012/08/uttal-spatial-thinking)); g = 0.96 for ages 0-8 with hands-on, visual and gestural training ([Yang et al. 2020](https://www.frontiersin.org/articles/10.3389/fpsyg.2020.01938/full)); spatial language during block play goes with better maths. | strong for training; moderate for transfer to maths | Rotation, building, mirror, maps and "over/under/between" words appear across games. |
| 8 | **Phonics games alone don't reliably improve reading**: GraphoGame's meta-analysis g = −0.02 and a UK trial found no gain over normal teaching. [EEF trial](https://educationendowmentfoundation.org.uk/projects-and-evaluation/projects/graphogame-rime), [review](https://link.springer.com/article/10.1007/s10648-019-09515-y) | strong (null) | Our reading features are **exposure and meaning** (letters with sounds, words with pictures, print that labels the world), never a claim to teach reading on their own. |
| 9 | **Dialogic talk** (an adult asking open questions and expanding the child's answers) is the shared-reading method with consistent positive effects. [Dowdall et al. meta-analysis](https://centaur.reading.ac.uk/80756/1/Dowdall%20Meta-anal%20FINAL%20(1).pdf) AAP: co-view, co-play and talk about it. [AAP summary](https://health.choc.org/updated-aap-recommendations-for-screen-time/) | strong for book reading; moderate for screens | "Talk about it" prompts: one open question at natural pauses, aimed at whoever is nearby. |
| 10 | On shared touch surfaces, **simultaneous control** gave more task-focused talk and physical participation than single touch, but also blocking and conflict; territories, roles and tangible tokens help. [Harris et al. 2009](https://oro.open.ac.uk/19510), [Woodward et al. 2018](https://www.cise.ufl.edu/~esmaeili/assets/Woodward_et_al___2018.pdf) | moderate | Every game supports many fingers; busy games give each child a zone or a job; nothing one child does wipes another's work. |
| 11 | **Retrieval practice** works with elementary-age children; the spacing benefit is less certain in classrooms; evidence for under-6s is thin. [Franzoi et al. 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12372469/), [Fazio & Marsh 2019](https://static1.squarespace.com/static/5c8baca1e5f7d136349ea789/t/5cbf14229140b7db73eef33b/1556026402371/Fazio+&+Marsh+2019.pdf) | moderate (7-10); weak (3-5) | Games bring back things the child met before (yesterday's letter, the shape from last round) as part of play, not as a test. |
| 12 | **Executive-function training** transfers to similar tasks, far transfer is unproven; school-based EF games show some real-world gains. [review](https://pmc.ncbi.nlm.nih.gov/articles/PMC7726355), [Zuber et al. 2022](https://www.unige.ch/fapse/aging/application/files/3116/7027/4354/Zuber_et_al._2022_Are_facet-specific_task_trainings_efficient_in_improving_childrens_executive_functions_and_why_they_might_not_be.pdf) | mixed | Planning, holding things in mind and switching rules are built into meaningful goals (Robo Code, Bridge Builder), not drills. |
| 13 | **Open-ended materials** go with problem solving and divergent thinking; whether pretend play *causes* creativity is contested. [Lillard et al. 2013](https://pubmed.ncbi.nlm.nih.gov/22905949/), [a 2016 review](https://pubmed.ncbi.nlm.nih.gov/26994722/) | mixed | Sandboxes (Paint, Element Box, Splash, Physics) stay open-ended; we add "make something that..." invitations, never one right answer. |
| 14 | **Expected rewards** for an activity a child already enjoys can lower interest afterwards (overjustification); unexpected rewards don't. Process praise ("you tried a new way") helps persistence in the lab. [Lepper et al. 1973](https://typeset.io/pdf/undermining-children-s-intrinsic-interest-with-extrinsic-3qn44yqiou.pdf), [Mueller & Dweck 1998](https://www.columbia.edu/cu/psychology/courses/3615/Readings/Mueller_Dweck.pdf), [Corpus & Lepper 2007](https://www.reed.edu/psychology/motivation/assets/downloads/Corpus_Lepper_2007.pdf) | moderate | Stars are surprises tied to discoveries, never a price for playing. Feedback describes what the child did ("you made orange by mixing!"), not what they are ("clever!"). |
| 15 | **Teaching someone else** (a character) makes children work harder to learn (the protégé effect), most for lower achievers. [Chase et al. 2009](https://purl.stanford.edu/zm369yx3532) | moderate (older children) | Characters (Munch, Robo, the rider) can be "taught": the child shows them how, and the character visibly learns. |
| 16 | **Tablet fine-motor effects are mixed**: a tracing app helped handwriting alongside normal teaching, but heavy tablet use is linked with weaker fine motor skills. [study](https://pmc.ncbi.nlm.nih.gov/articles/PMC6967223), [study](https://www.pubmed.gov/28071977/) | mixed / weak | Motor goals are precision, control and two-handed coordination on screen; we suggest off-screen follow-ups (draw it on paper) and never claim screen tracing replaces pencils. |
| 17 | **Screen time**: AAP and WHO suggest about an hour a day of high-quality content for ages 2-5, ideally with a caregiver. [AAP / WHO summary](https://health.choc.org/updated-aap-recommendations-for-screen-time/) | guideline | Sessions are naturally short, there are no endless reward loops, and grown-ups can see what was played (section 8). |

## 3. The six learning areas and what we aim at

Skill ids (`area.skill`) are the names used by `js/learn.js` and every game. Age bands are rough: children vary a lot.

| Area | Ages 3-4 | Ages 5-6 | Ages 7-10 | Skill ids |
|---|---|---|---|---|
| **Motor** (hands and eyes) | tap, drag, scribble, two hands at once | trace, steady lines, precise drops | fine control, aiming, timing, rotating | `motor.tap` `motor.drag` `motor.trace` `motor.precision` `motor.twohand` `motor.timing` |
| **Reading** (print and sounds) | letters as shapes, own-name letters, print means something | letter sounds, first sounds of words, short words with pictures | reading labels and short sentences, spelling patterns | `reading.letters` `reading.sounds` `reading.words` `reading.spelling` `reading.sentences` |
| **Talking** (oral language) | naming things, colours, actions | describing, retelling what happened, asking why | explaining how and why, arguing a prediction | `talk.vocab` `talk.describe` `talk.narrate` `talk.explain` |
| **Math** | counting to 10, more/less, shapes, patterns | numbers to 20 and 100, adding and taking away, measuring, symmetry | place value, multiplication, fractions, geometry, graphs, probability, algebra | `math.count` `math.compare` `math.numberline` `math.add` `math.shapes` `math.spatial` `math.patterns` `math.measure` `math.place` `math.multiply` `math.fractions` `math.geometry` `math.algebra` `math.probability` `math.graphs` |
| **Creative thinking** (thinking out of the box) | making things, mixing, pretending | many answers to one prompt, remixing | designing to a brief, combining ideas, music | `create.make` `create.remix` `create.pretend` `create.music` `create.design` |
| **Critical thinking** | sorting, noticing what changed | predicting and checking, cause and effect | planning steps, debugging, testing ideas fairly, using evidence | `think.sort` `think.predict` `think.cause` `think.plan` `think.debug` `think.evidence` `think.memory` |

## 4. Rules every game follows

1. **Learning rides on the action.** The learning content appears because the child did something (a label when they
   pick a colour, a count when they drop the fourth apple), never as a gate before play.
2. **Name it, in rich and varied language.** Say what happened in a short sentence with a target word and vary the
   sentence each time. Show the word on screen and, when voice is on, say it.
3. **One goal you can see, many ways to reach it.** Show the goal in the world (a star to reach, a line to fill), accept
   any route to it, and never punish experimenting.
4. **Just hard enough.** Use `learn.level(skill)` to pick the next challenge: up after a run of successes, down after
   repeated misses, invisibly. A three-year-old and a nine-year-old can play the same game.
5. **Hints arrive late and small.** First nothing, then a nudge (a glow on the next step), then a demonstration. Never
   the answer as the first response.
6. **Mistakes are information.** A wrong move shows *why* (the bridge bends, the potion overflows) and is easy to undo.
   No buzz-and-reset loops.
7. **Bring things back.** Reuse what the child met before (yesterday's letter, the last shape) as part of new play.
8. **Ask one open question for the room.** At natural pauses, a "Talk about it" prompt ("Why did the boat float?")
   for the grown-up or the other children. Never graded, never blocking.
9. **Many fingers, many jobs.** Every finger is its own player; busy games give each child a zone or a role; nobody's
   work is wiped by someone else.
10. **Surprise rewards, process praise.** Stars for discoveries and milestones the child didn't know were coming.
    Praise the strategy ("you tried three ways!"), not the child.
11. **Numbers on a line, sets you can see.** Quantities appear as visible sets and on left-to-right number lines.
12. **Off-screen follow-up.** Where it fits, end with something to do in the real world ("find three round things in
    the room"), shown to the grown-up.
13. **Record what was practised, on the device only.** Call `learn.saw(...)` when a child meets a skill and
    `learn.tried(...)` when they attempt it. No names, no accounts, nothing leaves the device.

## 5. Checking a game against the four pillars

Score each 0-3 in the game's README (the scheme used by [the 2022 app-coding study](https://pmc.ncbi.nlm.nih.gov/articles/PMC8916741)):
- **Active:** the child's thinking drives what happens (not just tapping "next").
- **Engaged:** nothing pulls attention away from the learning (no flashing ads, no unrelated rewards).
- **Meaningful:** the content connects to the child's world and builds on what they know.
- **Social:** it invites talk and play with the people around it.

## 6. Where the 28 games stand today

● strong, ◐ some, ○ little or none. Taken from each game's README (code and tests), November 2026.

| Game | Ages | Motor | Reading | Talking | Math | Creative | Critical |
|---|---|---|---|---|---|---|---|
| Bubble Pop | 2+ | ● | ● | ○ | ◐ | ○ | ○ |
| Firework Sky | 2+ | ● | ○ | ○ | ◐ | ◐ | ○ |
| Magic Paint | 2+ | ● | ◐ | ◐ | ◐ | ● | ○ |
| Shape Sorter | 2+ | ● | ○ | ○ | ◐ | ○ | ◐ |
| Rainbow Piano | 2+ | ● | ○ | ○ | ◐ | ◐ | ◐ |
| Letter Trace | 2+ | ● | ● | ○ | ◐ | ○ | ○ |
| Splash Lab | 2+ | ◐ | ○ | ○ | ○ | ● | ◐ |
| Hungry Monster | 3+ | ● | ○ | ○ | ◐ | ● | ◐ |
| Physics Lab | 3+ | ◐ | ○ | ○ | ◐ | ● | ● |
| Element Box | 3+ | ◐ | ○ | ○ | ○ | ● | ◐ |
| Space Orbits | 4+ | ◐ | ◐ | ○ | ◐ | ◐ | ◐ |
| Word Builder | 5+ | ◐ | ● | ○ | ○ | ○ | ○ |
| Balance Scale | 6+ | ○ | ○ | ○ | ● | ○ | ● |
| Potion Lab | 6+ | ○ | ○ | ○ | ● | ○ | ◐ |
| Number Forge | 6+ | ○ | ○ | ○ | ● | ◐ | ● |
| Math Art | 6+ | ◐ | ○ | ○ | ● | ● | ◐ |
| Robo Code | 6+ | ○ | ○ | ○ | ◐ | ◐ | ● |
| Puzzle Box | 6+ | ○ | ○ | ○ | ◐ | ○ | ● |
| Shape Lab | 7+ | ◐ | ○ | ○ | ● | ◐ | ◐ |
| Prime Garden | 7+ | ○ | ○ | ○ | ● | ○ | ◐ |
| Chance Machine | 7+ | ○ | ○ | ○ | ● | ○ | ◐ |
| Circuit Lab | 7+ | ◐ | ○ | ○ | ◐ | ◐ | ● |
| Laser Lab | 7+ | ◐ | ○ | ○ | ◐ | ◐ | ● |
| Bridge Builder | 7+ | ◐ | ○ | ○ | ◐ | ◐ | ● |
| Cannon Launch | 8+ | ◐ | ○ | ○ | ● | ○ | ◐ |
| Graph Rider | 8+ | ◐ | ○ | ○ | ● | ○ | ◐ |
| Atom Builder | 8+ | ◐ | ◐ | ○ | ◐ | ◐ | ● |
| Wave Lab | 8+ | ◐ | ○ | ○ | ◐ | ◐ | ◐ |

What the table shows:
- **Talking is the biggest gap.** Spoken words were switched off app-wide (now a grown-up switch, off by default), and no game invited
  conversation. Turning voice on (grown-up switch) and adding "Talk about it" prompts lifts every game at once.
- **Reading lives in three games.** Labels, captions and word play can spread to the labs (element names, planet names,
  part names) as incidental print.
- **The 3-5 band only has the Play & Learn shelf.** Most labs start at 6-8+. Adaptive levels (`learn.level`) let the
  labs open a simpler first layer for younger children instead of separate games.
- **Critical thinking is strong in the labs, weak for the youngest.** "Predict, then see" moments (will it float? will
  it fit?) work from age 3.

## 7. The shared learning layer (`js/learn.js`)

Every game can call these. All data stays in this browser's storage on this device.

| Call | Use it when | Example |
|---|---|---|
| `learn.saw(game, skill, detail)` | the child met something (heard a word, saw a count) | `learn.saw('paint','talk.vocab','orange')` |
| `learn.tried(game, skill, ok, detail)` | the child attempted something that can succeed or not | `learn.tried('words','reading.spelling',true,'cat')` |
| `learn.level(skill, max)` | choosing how hard the next round is (0 = easiest) | `const lv = learn.level('math.count', 4)` |
| `learn.say(text)` | speaking a word or sentence (only when the grown-up switched voice on) | `learn.say('Five apples!')` |
| `learn.talk(game, question, {at})` | a "Talk about it" question for the people around the screen (at most one per 90 s; taps pass through it; `at:'top'` for games with controls along the bottom) | `learn.talk('splash','Why did the duck float but the rock sink?')` |
| `learn.variant(name, options)` | research: a stable A/B choice for this device | `learn.variant('hint-timing',['fast','slow'])` |
| `learn.summary()`, `learn.export()`, `learn.reset()` | the grown-ups view and research export | |

The grown-ups view opens with a **two-second press on the ⭐ counter** on the home screen. It shows practice in each
area, a voice switch, a "Talk about it" switch, export (a JSON file) and reset.

Already wired in: Bubble Pop (letters, counting, animal words), Word Builder (spelling, with adaptive word length and
decoys), Shape Sorter (shapes, with adaptive number of shapes) and Magic Paint (colour words, mixing, describing,
making). Every game's existing narration (`say()`) speaks when the voice switch is on.

## 8. Using Wiggle Box as a research template

The app can host small, ethical studies of incidental learning:

1. **Write the question** in the game's README "Learning plan" (e.g. "Does naming the colour after each stroke increase
   colour words used afterwards?").
2. **Add a variant** with `learn.variant(...)`: each device gets one option and keeps it, and every logged event records
   it.
3. **Log exposure and attempts** with `learn.saw` / `learn.tried` (they already carry game, skill, time and variant).
4. **Measure outside the app** where it matters (talking, real-world transfer): a short play-based check with the child
   before and after, by an adult who doesn't know the variant.
5. **Export** from the grown-ups view and analyse.

Ethics and privacy: get the parents' consent; collect no names, photos or voice; keep data on the device until a
grown-up exports it; tell families what is recorded (this section and the grown-ups view say it). Speech recognition is
deliberately not used: browser speech recognition can send audio to a server, and children's voice recordings fall
under COPPA ([FTC policy statement](https://ftc.gov/system/files/documents/public_statements/1266473/coppa_policy_statement_audiorecordings.pdf)).

## 9. Roadmap: the upgrades with the most learning per hour of work

1. **Voice and talk prompts** (all games): grown-up voice switch + `learn.talk` prompts at natural pauses.
2. **Adaptive levels** in the games with fixed level lists (Balance Scale, Potion Lab, Robo Code, Laser Lab, Word
   Builder): generate the next level from `learn.level`.
3. **A first layer for 3-5s** in the labs (Splash Lab, Physics Lab, Element Box, Space Orbits): predict-then-see
   questions with pictures, no numbers needed.
4. **Number lines and counted sets** in Hungry Monster, Firework Sky, Bubble Pop and Potion Lab.
5. **Incidental print**: name labels on things in the labs (planets, elements, parts), with the first sound highlighted
   for the youngest.
6. **Teach-a-character moments** in Hungry Monster, Robo Code and Atom Builder.
7. **Zones and roles** for crowded multi-child games (Letter Trace two-tracer mode, Paint mirror-sides as zones).

Each game's README lists its own upgrades in priority order.
