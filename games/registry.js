/* ============================================================================================================
   WIGGLE BOX GAME LIST: the home screen is built from this file.

   One line per game. A game's code lives in games/<key>/<key>.js (and games/<key>/<key>.css when css:true) and only
   loads when a child opens it, so a game with a bug can't break the home screen or any other game.

   Add a game:   npm run new-game -- <key> "Game Title"     (copies the template and adds a line here for you)
   Fields:
     key       folder and file name under games/, lower case, no spaces (also the #link: index.html#paint)
     title     name on the tile and in the game's top bar
     icon      one emoji for the tile
     color     tile colour: var(--sky|sun|berry|leaf|grape|tang|aqua) or any CSS colour
     age       shown on the tile, e.g. '3+'
     section   home-screen section: 'lab' | 'math' | 'think' | 'play'
     order     position inside the section (lower first)
     blurb     one short line under the title
     css       true if the game has games/<key>/<key>.css
     files     extra scripts to load first (shared data, an engine), e.g. ['games/atoms/atoms-sci.js']
     layout    'full': a slim top bar and an edge-to-edge stage, for games that need every pixel (Magic Paint)
   ============================================================================================================ */
registerSections([
  {key:'lab',   title:'Science Lab',  icon:'🔬', blurb:'Real physics and chemistry. Every lab shows the formulas live.'},
  {key:'math',  title:'Math Lab',     icon:'📐', blurb:'Algebra, geometry, fractions, primes, chance. Drag the math around.'},
  {key:'think', title:'Think Lab',    icon:'🧩', blurb:'Coding, logic and puzzles that stretch your brain.'},
  {key:'play',  title:'Play & Learn', icon:'🎈', blurb:'For the littlest scientists.'},
]);

registerGames([
  /* ---- Science Lab ---- */
  {key:'splash', title:'Splash Lab', icon:'💧', color:'var(--aqua)', age:'2+', section:'lab', order:1,
   blurb:'Pour water, mix colors, see what floats'},
  {key:'physics', title:'Physics Lab', icon:'🧲', color:'var(--sun)', age:'3+', section:'lab', order:2,
   blurb:'Build, crash, launch and solve puzzles'},
  {key:'sand', title:'Element Box', icon:'🌋', color:'var(--tang)', age:'3+', section:'lab', order:3,
   blurb:'50 elements: TNT, fuses, fireworks, circuits, black holes and more!', css:true},
  {key:'space', title:'Space Orbits', icon:'🪐', color:'var(--grape)', age:'4+', section:'lab', order:4,
   blurb:'Fling planets around the Sun and learn about them'},
  {key:'cannon', title:'Cannon Launch', icon:'🎯', color:'var(--berry)', age:'8+', section:'lab', order:5,
   blurb:'Aim, fire, and let the math find the target.'},
  {key:'circuit', title:'Circuit Lab', icon:'💡', color:'var(--sun)', age:'7+', section:'lab', order:6,
   blurb:'Wire batteries, bulbs and fans. See the current flow.'},
  {key:'laser', title:'Laser Lab', icon:'🔦', color:'var(--grape)', age:'7+', section:'lab', order:7,
   blurb:'Bounce lasers off mirrors. Split light into a rainbow.'},
  {key:'atoms', title:'Atom Builder', icon:'⚛️', color:'var(--aqua)', age:'8+', section:'lab', order:8,
   blurb:'Build real atoms, snap them into molecules, then make them react.', files:['games/atoms/atoms-sci.js']},
  {key:'bridge', title:'Bridge Builder', icon:'🌉', color:'var(--tang)', age:'7+', section:'lab', order:9,
   blurb:'Build with triangles. Watch the stress, then send the truck.'},
  {key:'waves', title:'Wave Lab', icon:'🌊', color:'var(--aqua)', age:'8+', section:'lab', order:10,
   blurb:'Swing pendulums, make ripples, see sound.'},

  /* ---- Math Lab ---- */
  {key:'graph', title:'Graph Rider', icon:'🎢', color:'var(--aqua)', age:'8+', section:'math', order:1,
   blurb:'Bend the track with equations. Ride through the stars.'},
  {key:'balance', title:'Balance Scale', icon:'⚖️', color:'var(--sun)', age:'6+', section:'math', order:2,
   blurb:'Find the mystery box. Keep the scale level.'},
  {key:'geo', title:'Shape Lab', icon:'📐', color:'var(--leaf)', age:'7+', section:'math', order:3,
   blurb:'Stretch shapes. Watch area, angles and π come alive.'},
  {key:'potion', title:'Potion Lab', icon:'🧪', color:'var(--grape)', age:'6+', section:'math', order:4,
   blurb:'Pour fraction bottles to hit the magic line.'},
  {key:'forge', title:'Number Forge', icon:'🔨', color:'var(--tang)', age:'6+', section:'math', order:5,
   blurb:'Smash numbers together to make the target.'},
  {key:'primes', title:'Prime Garden', icon:'🌸', color:'var(--berry)', age:'7+', section:'math', order:6,
   blurb:'Wilt the multiples. Only the primes keep blooming.'},
  {key:'art', title:'Math Art', icon:'🌻', color:'var(--sun)', age:'6+', section:'math', order:7,
   blurb:'Turn a formula into art. Find the golden angle.'},
  {key:'chance', title:'Chance Machine', icon:'🎲', color:'var(--leaf)', age:'7+', section:'math', order:8,
   blurb:'Drop 1,000 balls. Watch a bell curve appear.'},

  /* ---- Think Lab ---- */
  {key:'robo', title:'Robo Code', icon:'🤖', color:'var(--leaf)', age:'6+', section:'think', order:1,
   blurb:'Snap code blocks together. Loops make it shorter!'},
  {key:'puzzles', title:'Puzzle Box', icon:'🧠', color:'var(--grape)', age:'6+', section:'think', order:2,
   blurb:'Towers, lights, binary and number grids.'},

  /* ---- Play & Learn ---- */
  {key:'bubbles', title:'Bubble Pop', icon:'🫧', color:'var(--aqua)', age:'2+', section:'play', order:1,
   blurb:'Pop letters, numbers and animals'},
  {key:'fireworks', title:'Firework Sky', icon:'🎆', color:'var(--berry)', age:'2+', section:'play', order:2,
   blurb:'Tap for colors, shapes and counting fireworks'},
  {key:'paint', title:'Magic Paint', icon:'🎨', color:'var(--tang)', age:'2+', section:'play', order:3,
   blurb:'Paint, stamp, mix colors and color in pictures', css:true, layout:'full'},
  {key:'feed', title:'Hungry Monster', icon:'🍎', color:'var(--grape)', age:'3+', section:'play', order:4,
   blurb:'Feed Munch, mix silly snacks, and make discoveries together.', css:true},
  {key:'shapes', title:'Shape Sorter', icon:'🔺', color:'var(--leaf)', age:'2+', section:'play', order:5,
   blurb:'Drag each shape to its home'},
  {key:'music', title:'Rainbow Piano', icon:'🎹', color:'var(--sun)', age:'2+', section:'play', order:6,
   blurb:'Play, copy me, and learn a song'},
  {key:'trace', title:'Letter Trace', icon:'✍️', color:'var(--leaf)', age:'2+', section:'play', order:7,
   blurb:'Discover letters, find matches, trace shapes, and grow into words'},
  {key:'words', title:'Word Builder', icon:'🔤', color:'var(--berry)', age:'5+', section:'play', order:8,
   blurb:'Spell the picture, letter by letter'},
]);
