/* ============================================================
   ELEMENT BOX — falling-sand chemistry with discoveries
   Fine grains (2 px by default, zoomable), so there's a big world to experiment in.
   Engine: one byte per cell for each of type T, life L, shade Sh, charge Q and fall speed V; cells are
   updated bottom-up, alternating direction each row. The world is cut into 16x16 chunks and a chunk
   that had no change last step is skipped (settled piles and pools cost nothing), and falling grains
   speed up with gravity.
   Electricity: a battery pulses; the pulse runs along metal and salt water (pure water hardly conducts).
   Every head cell becomes a tail and then rests, so the pulse travels as a wave (wireworld rules).
   Tools people ask for in sandboxes: undo, freeze + single step, speed, eyedropper, line and box, wind (push and
   stir), heat and cool brushes, save slots and "last time", zoom, info about every element.
   ============================================================ */
Object.assign(GAMES,{sand:{title:'Element Box',icon:'🌋',c:'var(--tang)',age:'3+',section:'lab',order:3,blurb:'50 elements: TNT, fuses, fireworks, circuits, black holes and more!',
init(stage,g){
  const EMPTY=0,SAND=1,WATER=2,STONE=3,WOOD=4,FIRE=5,LAVA=6,STEAM=7,PLANT=8,SEED=9,FLOWER=10,ICE=11,SNOW=12,OIL=13,SMOKE=14,CLOUD=15,GLASS=16,FISH=17,BUG=18,STEM=19,EMBER=20,
    SALT=21,SALTW=22,ACID=23,METAL=24,RUST=25,BOOM=26,SPARK=27,BATTERY=28,CLONE=29,DRAIN=30,WALL=31,DIRT=32,MUD=33,LAMP=34,
    FUSE=35,TNT=36,NITRO=37,FIREWORK=38,FWSPARK=39,THERMITE=40,GAS=41,COAL=42,ASH=43,LN2=44,HONEY=45,MERCURY=46,CONCRETE=47,GRAVEL=48,BHOLE=49,FAN=50,MAGNET=51,ANT=52,IRON=53,ERASE=99;
  /* name, swatch, what it does (shown when you pick it) */
  const EL={[SAND]:['Sand','#F2C86B','Piles up in hills. Lava melts it into glass.'],[SALT]:['Salt','#F4F4F8','Disappears into water and melts ice.'],
    [DIRT]:['Dirt','#7A5232','Add water and it turns into mud.'],[SNOW]:['Snow','#FFFFFF','Light and fluffy. Heat melts it.'],[SEED]:['Seeds','#8B5A2B','Give them water and they grow into flowers.'],
    [BOOM]:['Boom powder','#4A4458','Explodes when fire or a spark touches it!'],
    [WATER]:['Water','#3D7BFF','Flows and fills. Freezes when it is cold, boils when it is hot.'],[SALTW]:['Salt water','#4F9BE8','Heavier than water. Carries electricity!'],
    [OIL]:['Oil','#4A3420','Lighter than water, so it floats. Burns fast.'],[ACID]:['Acid','#7CFF3A','Eats stone, metal and wood, but not glass.'],
    [LAVA]:['Lava','#FF4F1F','Melted rock, 1,200 °C. Water cools it into stone.'],[MUD]:['Mud','#5A3B22','Slow and goopy. Heat dries it back into dirt.'],
    [STONE]:['Stone','#8A8FA8','Hard rock. Only lots of heat melts it.'],[WOOD]:['Wood','#A8693A','Burns slowly into glowing embers.'],[METAL]:['Metal','#9AA6B8','Carries electricity. Rusts in water.'],
    [ICE]:['Ice','#BDEFFF','Frozen water. So cold it freezes water too.'],[GLASS]:['Glass','#9FE8F0','See-through. Acid cannot hurt it.'],[WALL]:['Wall','#5B5F73','Nothing can break it.'],
    [FIRE]:['Fire','#FF8A2B','Needs fuel to keep burning. Water puts it out.'],[STEAM]:['Steam','#C9D6FF','Hot water vapor. It rises, cools and rains.'],[CLOUD]:['Rain cloud','#E9EDFF','Makes rain.'],
    [PLANT]:['Plant','#2FBF5B','Drinks water and grows.'],[FISH]:['Fish','🐟','Swims in water.'],[BUG]:['Ladybug','🐞','Walks around.'],
    [BATTERY]:['Battery','#2BD16B','Sends out pulses of electricity.'],[LAMP]:['Lamp','#5E5A3A','Lights up when electricity reaches it.'],[SPARK]:['Lightning','#FFF9A0','Zap! Lights lamps and boom powder. Turns sand into glass.'],
    [CLONE]:['Copy block','#E879F9','Copies the first thing that touches it, forever.'],[DRAIN]:['Drain','#14102E','Swallows anything that touches it.'],
    [FUSE]:['Fuse','#6B4F2A','Light one end and the flame creeps along it.'],[TNT]:['TNT','#D7263D','A big boom! It sets off the TNT next to it too.'],
    [NITRO]:['Nitro','#C6F65B','A liquid that explodes if you drop it hard!'],[FIREWORK]:['Fireworks','#FF5DA2','Light them and they shoot up and burst into color.'],
    [THERMITE]:['Thermite','#8A5A44','Burns hot enough to melt metal, even underwater.'],[GAS]:['Fire gas','#B6E36F','Invisible-ish gas that floats around. One flame and WHOOSH.'],
    [COAL]:['Coal','#2B2B2E','Burns slowly for a long, long time.'],[ASH]:['Ash','#C9C4BE','What is left after burning. Light and dusty.'],
    [LN2]:['Liquid nitrogen','#D9F2FF','−196 °C! Freezes anything it touches, then boils away.'],[HONEY]:['Honey','#F2A81D','A very slow, thick liquid.'],
    [MERCURY]:['Mercury','#C9CDD6','A metal that is liquid! So heavy that sand floats on it.'],[CONCRETE]:['Concrete','#A9A59C','Pour it while it is wet. It hardens into stone.'],
    [GRAVEL]:['Gravel','#77736C','Heavy little rocks. Makes steep piles.'],[IRON]:['Iron filings','#5D6470','Tiny bits of iron. Magnets pull them.'],
    [BHOLE]:['Black hole','#0A0514','Pulls everything in and swallows it.'],[FAN]:['Fan','#7FD3E8','Blows things up into the air.'],[MAGNET]:['Magnet','#E23B3B','Pulls iron filings toward it.'],
    [ANT]:['Ants','🐜','Walk around and dig tunnels in dirt and sand.']};
  const TABS=[['powder','⏳','Powders',[SAND,SALT,DIRT,GRAVEL,SNOW,ASH,IRON,SEED]],['liquid','💧','Liquids',[WATER,SALTW,OIL,ACID,LAVA,MUD,HONEY,MERCURY,LN2,CONCRETE]],
    ['solid','🧱','Solids',[STONE,WOOD,METAL,ICE,GLASS,COAL,WALL]],['boom','💥','Boom',[BOOM,TNT,NITRO,FUSE,FIREWORK,THERMITE,GAS]],['air','🔥','Fire & air',[FIRE,STEAM,CLOUD,GAS]],
    ['life','🌱','Life',[PLANT,SEED,FISH,BUG,ANT]],['power','⚡','Power',[BATTERY,METAL,LAMP,SPARK,SALTW,MERCURY]],['force','🧲','Forces',[BHOLE,FAN,MAGNET,CLONE,DRAIN]]];
  const KEYS=[SAND,WATER,STONE,WOOD,FIRE,LAVA,ICE,OIL,SEED,SALT];
  const TOOLS=[['draw','✏️','Draw'],['line','📏','Line'],['box','⬛','Box'],['erase','🧽','Eraser'],['heat','🔥','Heat'],['cool','❄️','Cool'],['wind','💨','Wind'],['pick','👆','Copy what I tap']];
  const SIZES=[['Tiny',3],['Small',8],['Medium',16],['Big',30],['Huge',55]];
  const SPEEDS=[['🐢','½×',.5],['▶️','1×',2],['⏩','2×',4],['🚀','4×',8]];
  const GRAINS=[['Tiny grains',2],['Small grains',3],['Big grains',5]];
  const DISC=[
    ['stone','Lava + Water = Stone','Lava and water make stone!','What happens when lava touches water?'],
    ['steam','Heat + Water = Steam','Hot water turns into steam!','What does heat do to water?'],
    ['glass','Sand + Lava = Glass','Hot lava melts sand into glass!','What does lava do to sand?'],
    ['flower','Seed + Water = Flower','Seeds need water to grow into flowers!','How do you make a seed grow?'],
    ['grow','Plant + Water = Bigger plant','Plants drink water and grow!','What do plants need?'],
    ['melt','Ice + Heat = Water','Heat melts ice into water!','What melts ice?'],
    ['freeze','Ice + Water = More ice','Ice is so cold it freezes water!','What does ice do to water?'],
    ['rain','Steam = Rain','Steam floats up, cools down and turns into rain. That is the water cycle!','Where does steam go?'],
    ['burn','Wood + Fire = Ash and smoke','Wood burns!','What burns?'],
    ['oil','Oil + Fire = Big flames','Oil burns really fast!','Try fire on oil.'],
    ['float','Oil floats on water','Oil is lighter than water, so it floats on top!','What floats on water?'],
    ['dissolve','Salt + Water = Salt water','The salt disappears into the water!','Where does salt go in water?'],
    ['saltice','Salt melts ice','Salt melts ice. That is why salt goes on icy roads!','What does salt do to ice?'],
    ['evap','Heat + Salt water = Salt','The water boils away and the salt is left behind!','Can you get the salt back out of salt water?'],
    ['acid','Acid eats stone and metal','Acid dissolves stone and metal!','What can acid eat?'],
    ['safe','Acid can\'t hurt glass','Glass is safe from acid. That is why scientists keep acid in glass bottles!','Is anything safe from acid?'],
    ['rust','Metal + Water = Rust','Wet metal slowly turns into rust!','What happens to metal in water?'],
    ['boom','Fire + Boom powder = Boom!','Boom powder explodes when it gets hot!','What happens to boom powder near fire?'],
    ['circuit','Battery + Metal + Lamp = Light','Electricity runs along the metal and lights the lamp!','Can you make a lamp light up?'],
    ['conduct','Salt water carries electricity','Salt water carries electricity. Pure water hardly does!','Does electricity go through water?'],
    ['fulgurite','Lightning + Sand = Glass','Lightning is so hot it melts sand into glass!','What does lightning do to sand?'],
    ['mud','Dirt + Water = Mud','Dirt soaks up water and turns into mud!','What does water do to dirt?'],
    ['meltrock','Lots of heat + Stone = Lava','Enough heat melts rock back into lava!','Can you melt stone?'],
    ['condense','Cold + Steam = Water','Cold turns steam back into water!','What does cold do to steam?'],
    ['chain','Chain reaction!','One TNT set off the next one!','What happens when TNT sits next to TNT?'],
    ['fuse','Fuse + Fire = Boom','The flame crept along the fuse and set off the boom!','Can a fuse light something far away?'],
    ['firework','Fireworks!','Fireworks shoot up and burst into colors!','What do fireworks do?'],
    ['thermite','Thermite melts metal','Thermite burns hotter than lava. It melts metal!','What can melt metal?'],
    ['ln2','Liquid nitrogen freezes water','Liquid nitrogen is so cold it freezes water instantly!','What does liquid nitrogen do to water?'],
    ['mercury','Sand floats on mercury','Mercury is so heavy that sand floats on top of it!','What floats on mercury?'],
    ['nitro','Drop the nitro!','Nitro explodes when it hits the ground hard!','What happens if you drop nitro?'],
    ['gasboom','Fire gas goes WHOOSH','The gas caught fire all at once!','What does fire do to fire gas?'],
    ['magnet','Magnets pull iron','The magnet pulled the iron filings!','What does a magnet pull?']];
  const EQ={stone:['Lava cools','lava + H₂O → rock + steam','Melted rock is 1,200 °C. Water cools it so fast it turns solid.'],
    steam:['Boiling','H₂O (liquid) → H₂O (gas)','Water boils at 100 °C.'],
    glass:['Making glass','SiO₂ (sand) + heat → glass','Sand melts at about 1,700 °C.'],
    flower:['Photosynthesis','6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂','Plants make sugar from air, water and sunlight, and give us oxygen.'],
    grow:['Plants drink','roots pull up H₂O','Water travels up the stem to every leaf.'],
    melt:['Melting','H₂O (solid) → H₂O (liquid)','Ice melts at 0 °C.'],
    freeze:['Freezing','H₂O (liquid) → H₂O (solid)','Below 0 °C water freezes. Ice takes up more room than water.'],
    rain:['The water cycle','evaporate → condense → rain','Steam cools high up and falls back down as rain.'],
    burn:['Burning wood','C₆H₁₀O₅ + 6O₂ → 6CO₂ + 5H₂O','Burning needs fuel, heat and oxygen. Take one away and the fire goes out.'],
    oil:['Burning oil','oil (C and H) + O₂ → CO₂ + H₂O + heat','Oil holds lots of stored energy, so it burns fast and hot.'],
    float:['Floating','oil ρ = 0.9 &lt; water ρ = 1.0','The lighter liquid always ends up on top.'],
    dissolve:['Dissolving','NaCl → Na⁺ + Cl⁻ (in water)','Water pulls salt apart into tiny pieces too small to see.'],
    saltice:['Salt melts ice','salt water freezes at about −21 °C','Salt makes it harder for water to freeze, so the ice melts.'],
    evap:['Evaporation','salt water + heat → steam + salt','Only the water boils off. The salt stays behind. That is how sea salt is made.'],
    acid:['Acid','acid + rock → salt + water + CO₂','Acid breaks the bonds that hold stone and metal together.'],
    safe:['Glass resists acid','glass (SiO₂) + acid → no reaction','Glass is so stable that most acids cannot break it.'],
    rust:['Rusting','4Fe + 3O₂ + water → 2Fe₂O₃ (rust)','Iron joins with oxygen when it is wet. Salt water makes it rust faster.'],
    boom:['Explosion','fuel + oxidizer → hot gas, FAST','An explosion is burning that happens all at once.'],
    circuit:['A circuit','battery → wire → lamp','Electricity flows along metal from the battery to the lamp.'],
    conduct:['Conductors','salt water: Na⁺ and Cl⁻ carry charge','The tiny salt pieces carry the electricity. Pure water has almost none.'],
    fulgurite:['Fulgurite','lightning (30,000 °C) + sand → glass','Real lightning makes glass tubes in sand called fulgurites.'],
    mud:['Mud','dirt + H₂O → mud','Water fills the gaps between the bits of dirt.'],
    meltrock:['Melting rock','stone + heat (1,200 °C) → lava','Deep underground it is hot enough to melt rock. That is magma.'],
    condense:['Condensing','H₂O (gas) → H₂O (liquid)','Cold steam turns back into drops. That is how clouds form.'],
    chain:['Chain reaction','one blast → heat + shock → next blast','Each explosion gives the next one the energy it needs to start.'],
    fuse:['Fuses','a slow flame carries fire along','Fuses burn at a steady speed, so you know when the boom comes.'],
    firework:['Fireworks','metal salts + heat → colored light','Strontium makes red, copper makes blue, sodium makes yellow.'],
    thermite:['Thermite','Fe₂O₃ + 2Al → 2Fe + Al₂O₃ + heat','It reaches 2,500 °C and brings its own oxygen, so water cannot put it out.'],
    ln2:['Liquid nitrogen','N₂ (liquid) at −196 °C','The air we breathe is mostly nitrogen. Cooled enough, it turns into a liquid.'],
    mercury:['Density','sand ρ = 2.6 &lt; mercury ρ = 13.5','Anything lighter than a liquid floats on it, even sand on a metal.'],
    nitro:['Shock-sensitive','nitroglycerin + bump → boom','Some chemicals are so unstable that a bump gives them enough energy to explode.'],
    gasboom:['Burning gas','CH₄ + 2O₂ → CO₂ + 2H₂O','Gas mixed with air burns all at once. That is why gas leaks are dangerous.'],
    magnet:['Magnetism','magnets pull iron, nickel and cobalt','Iron is full of tiny magnets that line up and get pulled.']};
  const SCENES=[['volcano','🌋','Volcano'],['garden','🌻','Garden'],['winter','⛄','Winter'],['tank','🐠','Fish tank'],['circuit','💡','Circuit'],['lab','🧪','Acid lab'],['boom','💥','Demolition'],['empty','🧹','Empty']];

  stage.innerHTML=`<div class="simwrap"><div class="simarea"><canvas class="simcv" aria-label="Element sandbox"></canvas><div class="simhint" id="hint"></div>
      <button class="discbtn" id="discbtn">🔬 <span id="dcount">0</span>/${DISC.length}</button><div class="discpanel" id="disc" hidden></div></div>
    <div class="dock eb-dock"><div class="eb-bar" id="bar">
      <button class="eb-b eb-el" id="elbtn" aria-haspopup="menu" title="Elements"><span class="eb-sw"></span><span class="eb-l" id="elname">Sand</span></button>
      <button class="eb-b" id="toolbtn" aria-haspopup="menu" title="Tools"><span class="ti" id="tooli">✏️</span><span class="eb-l" id="tooll">Draw</span></button>
      <button class="eb-b" id="sizebtn" aria-haspopup="menu" title="Brush size"><span class="ti"><span class="dot" id="sized"></span></span><span class="eb-l" id="sizel">Medium</span></button>
      <span class="eb-gap"></span>
      <button class="eb-b" id="pause" title="Freeze"><span class="ti">⏸️</span><span class="eb-l">Freeze</span></button>
      <button class="eb-b" id="stepbtn" title="One step" disabled><span class="ti">⏭️</span><span class="eb-l">Step</span></button>
      <button class="eb-b" id="speed" title="Speed"><span class="ti">▶️</span><span class="eb-l">1×</span></button>
      <button class="eb-b" id="undo" title="Undo"><span class="ti">↩️</span><span class="eb-l">Undo</span></button>
      <button class="eb-b" id="zoom" title="Grain size"><span class="ti">🔍</span><span class="eb-l">Tiny</span></button>
      <button class="eb-b" id="scenes" aria-haspopup="menu" title="Worlds"><span class="ti">🎬</span><span class="eb-l">Worlds</span></button>
    </div></div></div>`;
  const $=q=>stage.querySelector(q),cv=$('canvas'),ctx=cv.getContext('2d'),hintEl=$('#hint'),discEl=$('#disc');
  const eqLog=[];
  const ov=fxOverlay($('.simarea'));
  function ovUpdate(){ov.set((eqLog.length?eqLog.slice(-3).reverse().map(k=>{const e=EQ[k];return `<div class="fx ${k===eqLog[eqLog.length-1]?'hot':''}"><span class="tag">${e[0]}</span><div class="row">${e[1]}</div><div class="row note">${e[2]}</div></div>`}).join('')
      :'<div class="fx hot"><span class="tag">Chemistry</span><div class="row">Mix things and watch for a reaction. Its equation shows up here.</div></div>')+
      '<div class="fx"><span class="tag">Reading an equation</span><div class="row">what you start with → what you get</div><div class="row note">Atoms never disappear. They just swap partners.</div></div>')}
  ovUpdate();
  const hint=makeHint(hintEl);

  /* ---------- the grid ---------- */
  let dims=fitCanvas(cv),cs=2,grainI=0,cols,rows,N,T,Sh,L,C,Q,Qp,V,img,buf,gcv,gctx,glowImg,glowBuf,glowCv,glowCtx,CC,CR,awake,awakeN,G=3;
  let cur=SAND,tool='draw',sizeI=2,paused=false,speedI=1,tick=1,frame=0,stepN=0,elecOn=false,flash=0;
  const found=new Set();
  function alloc(){N=cols*rows;T=new Uint8Array(N);Sh=new Uint8Array(N);L=new Uint8Array(N);C=new Uint8Array(N);Q=new Uint8Array(N);Qp=new Uint8Array(N);V=new Uint8Array(N);
    CC=Math.ceil(cols/16);CR=Math.ceil(rows/16);awake=new Uint8Array(CC*CR).fill(1);awakeN=new Uint8Array(CC*CR).fill(1);G=Math.max(1,Math.round(5/cs));
    gcv=document.createElement('canvas');gcv.width=cols;gcv.height=rows;gctx=gcv.getContext('2d');img=gctx.createImageData(cols,rows);buf=new Uint32Array(img.data.buffer);
    glowCv=document.createElement('canvas');glowCv.width=cols;glowCv.height=rows;glowCtx=glowCv.getContext('2d');glowImg=glowCtx.createImageData(cols,rows);glowBuf=new Uint32Array(glowImg.data.buffer)}
  /* bring an old picture into a new grid: 'bottom' keeps the floor where it was (resizing), 'scale' stretches it (zoom, loading) */
  function regrid(mode){const old=T?{T,Sh,L,cols,rows}:null;cols=Math.ceil(dims.w/cs);rows=Math.ceil(dims.h/cs);alloc();if(!old)return;
    if(mode==='scale'){for(let y=0;y<rows;y++){const oy=Math.min(old.rows-1,(y*old.rows/rows)|0);for(let x=0;x<cols;x++){const a=oy*old.cols+Math.min(old.cols-1,(x*old.cols/cols)|0),b=y*cols+x;T[b]=old.T[a];Sh[b]=old.Sh[a];L[b]=old.L[a]}}}
    else for(let y=0;y<Math.min(rows,old.rows);y++)for(let x=0;x<Math.min(cols,old.cols);x++){const a=(old.rows-1-y)*old.cols+x,b=(rows-1-y)*cols+x;T[b]=old.T[a];Sh[b]=old.Sh[a];L[b]=old.L[a]}}
  regrid();
  const rnd=Math.random;
  function wake(i){const x=i%cols,y=(i/cols)|0,cx=x>>4,cy=y>>4,k=cy*CC+cx;awakeN[k]=1;const lx=x&15,ly=y&15;
    if(lx===0&&cx>0)awakeN[k-1]=1;else if(lx===15&&cx<CC-1)awakeN[k+1]=1;if(ly===0&&cy>0)awakeN[k-CC]=1;else if(ly===15&&cy<CR-1)awakeN[k+CC]=1}
  const wakeAll=()=>{awake.fill(1);awakeN.fill(1)};
  const set=(i,t,l)=>{T[i]=t;L[i]=l||0;Q[i]=0;V[i]=0;if(t!==FLOWER&&t!==STEM)Sh[i]=(rnd()*255)|0;C[i]=tick;wake(i)};
  /* what things are like: density for sinking, and families */
  const D=new Float32Array(64),LIQ=new Uint8Array(64),GASF=new Uint8Array(64),MOV=new Uint8Array(64),COND=new Uint8Array(64),FLAM=new Uint8Array(64),HARD=new Uint8Array(64),IGN=new Uint8Array(64);
  Object.entries({[SAND]:4,[WATER]:2,[OIL]:1,[LAVA]:3,[SEED]:4,[SNOW]:1.5,[FISH]:2.5,[BUG]:4,[SALT]:3.8,[SALTW]:2.2,[ACID]:2.1,[RUST]:3.5,[BOOM]:3.5,[DIRT]:4,[MUD]:3,[NITRO]:2.3,[FIREWORK]:3.5,[THERMITE]:4,[ASH]:1.2,[LN2]:1.5,[HONEY]:2.4,[MERCURY]:9,[CONCRETE]:3.4,[GRAVEL]:4.5,[IRON]:4.2,[ANT]:3}).forEach(([k,v])=>D[k]=v);
  for(const t of [WATER,OIL,LAVA,SALTW,ACID,NITRO,LN2,HONEY,MERCURY,CONCRETE])LIQ[t]=1;for(const t of [STEAM,SMOKE,FIRE,GAS,FWSPARK])GASF[t]=1;
  for(const t of [SAND,WATER,OIL,LAVA,SEED,SNOW,FISH,BUG,SALT,SALTW,ACID,RUST,BOOM,DIRT,MUD,STEAM,SMOKE,FIRE,EMBER,SPARK,NITRO,FIREWORK,FWSPARK,THERMITE,GAS,ASH,LN2,HONEY,MERCURY,CONCRETE,GRAVEL,ANT,IRON])MOV[t]=1;
  COND[METAL]=1;COND[SALTW]=1;COND[MERCURY]=1;COND[IRON]=1;for(const t of [WOOD,PLANT,STEM,FLOWER,SEED,OIL])FLAM[t]=1;for(const t of [WALL,GLASS,STONE,METAL,BATTERY,CLONE,DRAIN,LAMP,BHOLE,FAN,MAGNET])HARD[t]=1;
  for(const t of [TNT,BOOM,NITRO,FUSE,FIREWORK,THERMITE,GAS,COAL])IGN[t]=1;
  const canSink=(t,d)=>t===EMPTY||GASF[t]===1||(LIQ[t]===1&&D[t]<d);
  function mv(i,j){const t=T[j],s=Sh[j],l=L[j],q=Q[j],v=V[j];T[j]=T[i];Sh[j]=Sh[i];L[j]=L[i];Q[j]=Q[i];V[j]=V[i];T[i]=t;Sh[i]=s;L[i]=l;Q[i]=q;V[i]=v;C[j]=tick;wake(i);wake(j);
    if(T[j]===WATER&&t===OIL)discover('float',j)}
  /* falling: speed builds up with gravity while the path below is clear */
  function fall(i,y,d){const b=i+cols;if(!canSink(T[b],d))return -1;
    if(T[b]!==EMPTY){mv(i,b);V[b]=1;return b}
    const v=Math.min(V[i]+1,8);let j=b;for(let k=1;k<v&&y+k<rows-1;k++){const n=j+cols;if(T[n]===EMPTY)j=n;else break}
    mv(i,j);V[j]=v;return j}
  function powder(i,x,y,d){
    if(y>=rows-1){V[i]=0;return false}if(fall(i,y,d)>=0)return true;
    const b=i+cols,s=rnd()<.5?-1:1;for(const dx of [s,-s]){const nx=x+dx;if(nx<0||nx>=cols)continue;if(canSink(T[b+dx],d)&&canSink(T[i+dx],d)){mv(i,b+dx);V[b+dx]=1;return true}}
    V[i]=0;return false}
  function liquid(i,x,y,d,disp){
    if(y<rows-1){if(fall(i,y,d)>=0)return true;const b=i+cols;
      const s=rnd()<.5?-1:1;for(const dx of [s,-s]){const nx=x+dx;if(nx<0||nx>=cols)continue;if(canSink(T[b+dx],d)){mv(i,b+dx);return true}}}
    V[i]=0;
    const s=rnd()<.5?-1:1;for(const dx of [s,-s]){let j=i;for(let k=1;k<=disp;k++){const nx=x+dx*k;if(nx<0||nx>=cols)break;const q=i+dx*k;if(T[q]===EMPTY||GASF[T[q]])j=q;else break}if(j!==i){mv(i,j);return true}}
    return false}
  function gas(i,x,y){
    if(y>0){const r=rnd(),dx=r<.3?-1:r<.6?1:0,nx=x+dx;if(nx>=0&&nx<cols){const j=i-cols+dx,t=T[j];if(t===EMPTY||(LIQ[t]&&t!==LAVA&&rnd()<.2)){mv(i,j);return true}}}
    const dx=rnd()<.5?-1:1,nx=x+dx;if(nx>=0&&nx<cols&&T[i+dx]===EMPTY&&rnd()<.5){mv(i,i+dx);return true}return false}
  const NB=[0,0,0,0];
  function nbrs(i,x,y){NB[0]=y>0?i-cols:-1;NB[1]=y<rows-1?i+cols:-1;NB[2]=x>0?i-1:-1;NB[3]=x<cols-1?i+1:-1;return NB}
  const has=(i,x,y,t)=>{const n=nbrs(i,x,y);for(const j of n)if(j>=0&&T[j]===t)return j;return -1};

  /* ---------- discoveries ---------- */
  function discover(k,i){if(found.has(k))return;found.add(k);eqLog.push(k);ovUpdate();const d=DISC.find(q=>q[0]===k);if(!d)return;
    const r=cv.getBoundingClientRect(),x=(i%cols)*cs,y=((i/cols)|0)*cs;floaty(stage,r.left+x,r.top+y-30,d[1]);say(d[2]);addStar();
    tone(660,.15,'triangle');tone(990,.25,'triangle',.18,.12);$('#dcount').textContent=found.size;drawDisc();
    if(found.size===DISC.length)g.later(()=>{cheer();party();say('You found every discovery! You are a real scientist!')},2500)}
  function drawDisc(){discEl.innerHTML=`<h3>Discoveries</h3><ul>${DISC.map(d=>`<li class="${found.has(d[0])?'got':''}">${found.has(d[0])?'✅ '+d[1]:'❓ '+d[3]}</li>`).join('')}</ul><button class="pbtn" id="dclose">Close</button>`}
  drawDisc();
  $('#discbtn').addEventListener('click',()=>{discEl.hidden=!discEl.hidden;tone(600,.08,'triangle')});
  discEl.addEventListener('click',e=>{if(e.target.id==='dclose')discEl.hidden=true});
  g.listen(stage,'pointerdown',e=>{if(!discEl.hidden&&!discEl.contains(e.target)&&!e.target.closest('#discbtn'))discEl.hidden=true},true);

  /* ---------- explosions ---------- */
  let boomSnd=0;const ringCache=new Map();
  /* light something that burns or explodes; returns true if it was one of those */
  function ignite(j){const t=T[j];if(!IGN[t])return false;const x=j%cols,y=(j/cols)|0;
    if(t===TNT){if(!L[j]){L[j]=2+(rnd()*5|0);wake(j)}}
    else if(t===BOOM)explode(x,y,4*G+2);
    else if(t===NITRO)explode(x,y,6*G+3);
    else if(t===FUSE||t===FIREWORK||t===THERMITE){if(!L[j]){L[j]=t===FUSE?14:t===THERMITE?120:20+(rnd()*25|0);wake(j)}}
    else if(t===GAS){set(j,FIRE,10+(rnd()*20|0));discover('gasboom',j)}
    else if(t===COAL){if(rnd()<.03)set(j,EMBER,255)}
    return true}
  function explode(x0,y0,r=4*G+2){
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const d2=dx*dx+dy*dy;if(d2>r*r)continue;const x=x0+dx,y=y0+dy;if(x<0||y<0||x>=cols||y>=rows)continue;const j=y*cols+x,t=T[j];
      if(t===WALL||t===BATTERY||t===CLONE||t===DRAIN||t===BHOLE)continue;
      if(t===TNT){if(d2>0){if(!L[j]){L[j]=2+(rnd()*6|0);wake(j);discover('chain',j)}continue}}
      else if(IGN[t]&&t!==GAS&&t!==COAL){if(d2>0){if(t===BOOM||t===NITRO)set(j,FIRE,3);else ignite(j);continue}}
      if(HARD[t]){if(rnd()<.2)set(j,EMPTY);continue}
      if(t===WATER||t===SALTW){if(rnd()<.5)set(j,STEAM,60);continue}
      if(d2<r*r*.4)set(j,FIRE,8+(rnd()*20|0));else if(t!==EMPTY&&t!==FISH&&t!==BUG)set(j,rnd()<.5?SMOKE:EMPTY,30);else if(t===EMPTY&&rnd()<.3)set(j,SMOKE,25)}
    /* the blast throws loose things outward; the far ring moves first so nothing gets pushed into a moved grain */
    const R2=Math.round(r*2.3);let ring=ringCache.get(r);
    if(!ring){ring=[];for(let dy=-R2;dy<=R2;dy++)for(let dx=-R2;dx<=R2;dx++){const d=Math.hypot(dx,dy);if(d>r&&d<=R2)ring.push([dx,dy,d])}ring.sort((a,b)=>b[2]-a[2]);ringCache.set(r,ring)}
    for(const [dx,dy,d] of ring){const x=x0+dx,y=y0+dy;if(x<0||y<0||x>=cols||y>=rows)continue;const j=y*cols+x,t=T[j];if(!MOV[t]||t===FISH||t===BUG||rnd()<.3)continue;
      const ux=dx/d,uy=dy/d,push=1+Math.round((R2-d)/(R2-r)*6*G);let to=j;
      for(let k=1;k<=push;k++){const nx=Math.round(x+ux*k),ny=Math.round(y+uy*k);if(nx<0||ny<0||nx>=cols||ny>=rows)break;const n=ny*cols+nx;if(T[n]===EMPTY||GASF[T[n]])to=n;else break}
      if(to!==j)mv(j,to)}
    flash=Math.max(flash,r>5*G?8:5);if(boomSnd<=0){boomSnd=6;noise(.5+r*.01,180,.7,.25);tone(55,.4,'sine',.2)}discover('boom',y0*cols+x0)}
  function burst(x0,y0,hue){const r=5*G+3,n=60*G;for(let k=0;k<n;k++){const a=rnd()*6.283,d=r*(.55+.45*rnd()),x=Math.round(x0+Math.cos(a)*d),y=Math.round(y0+Math.sin(a)*d);
      if(x<0||y<0||x>=cols||y>=rows)continue;const j=y*cols+x;if(T[j]===EMPTY||GASF[T[j]]){set(j,FWSPARK,25+(rnd()*30|0));Sh[j]=(hue+rnd()*24)&255}}
    tone(300+rnd()*400,.3,'sine',.12,0,1200);noise(.25,2500,1,.1);discover('firework',y0*cols+x0)}
  /* a force element reaches out: take a few random cells nearby and nudge loose ones one cell toward (or away from) it */
  function pull(i,x,y,R,test,toward,swallow){for(let k=0;k<5;k++){const a=rnd()*6.283,d=1+rnd()*R,px=Math.round(x+Math.cos(a)*d),py=Math.round(y+Math.sin(a)*d);
      if(px<0||py<0||px>=cols||py>=rows)continue;const j=py*cols+px,t=T[j];if(!test(t))continue;
      if(swallow&&d<2.5){set(j,EMPTY);continue}
      const sx=Math.sign(x-px)*(toward?1:-1),sy=Math.sign(y-py)*(toward?1:-1),n=(py+sy)*cols+(px+sx);if(n>=0&&n<N&&(T[n]===EMPTY||GASF[T[n]]))mv(j,n)}}

  /* ---------- one step ---------- */
  function cell(i,x,y){const t=T[i];
    switch(t){
      case SAND:if(!powder(i,x,y,4)&&y<rows-1&&T[i+cols]===MERCURY&&rnd()<.02)discover('mercury',i);break;
      case SALT:{if(powder(i,x,y,3.8))break;const n=nbrs(i,x,y);let near=false;
        for(const j of n){if(j<0)continue;const q=T[j];
          if(q===WATER){near=true;if(rnd()<.03){set(j,SALTW);set(i,EMPTY);discover('dissolve',j);return}}
          else if(q===ICE||q===SNOW){near=true;if(rnd()<.03){set(j,WATER);discover('saltice',j)}}}
        if(near)wake(i);break}
      case DIRT:{if(powder(i,x,y,4))break;const w=has(i,x,y,WATER);if(w>=0){wake(i);if(rnd()<.02){set(w,EMPTY);set(i,MUD);discover('mud',i)}}break}
      case MUD:if(rnd()<.3)powder(i,x,y,3);else wake(i);break;
      case RUST:powder(i,x,y,3.5);break;
      case BOOM:{const n=nbrs(i,x,y);for(const j of n){if(j<0)continue;const q=T[j];if(q===FIRE||q===EMBER||q===LAVA||q===SPARK||(q===FUSE&&L[j]>1)){explode(x,y,4*G+2);return}}powder(i,x,y,3.5);break}
      case TNT:{if(L[i]>0){wake(i);if(--L[i]===0){explode(x,y,7*G+4);return}}break}
      case NITRO:{const v=V[i];if(v>=5&&(y>=rows-1||!canSink(T[i+cols],2.3))){explode(x,y,6*G+3);discover('nitro',i);return}liquid(i,x,y,2.3,2+G);break}
      case FUSE:{if(L[i]>1){wake(i);{L[i]--;if(L[i]===12){for(const j of nbrs(i,x,y)){if(j<0)continue;const q=T[j];if(q===FUSE&&!L[j]){L[j]=14;wake(j)}else if(IGN[q]&&q!==FUSE){ignite(j);discover('fuse',j)}else if(FLAM[q]&&rnd()<.3)set(j,FIRE,20)}}
          if(y>0&&T[i-cols]===EMPTY&&rnd()<.25)set(i-cols,FIRE,4+(rnd()*6|0))}}else if(L[i]===1)set(i,rnd()<.5?ASH:SMOKE,20);break}
      case FIREWORK:{if(L[i]>1){wake(i);L[i]--;let j=i,moved=0;for(let k=0;k<3;k++){const u=j-cols;if(u>=0&&(T[u]===EMPTY||GASF[T[u]])){mv(j,u);j=u;moved++}else break}
          if(moved&&j+cols<N&&T[j+cols]===EMPTY&&rnd()<.6)set(j+cols,FIRE,3+(rnd()*4|0));
          if(!moved||L[j]<=1){const hue=Sh[j];set(j,EMPTY);burst(j%cols,(j/cols)|0,hue)}}
        else powder(i,x,y,3.5);break}
      case FWSPARK:{if(L[i]>0)L[i]--;if(L[i]===0){set(i,EMPTY);break}wake(i);if(rnd()<.3&&y<rows-1&&T[i+cols]===EMPTY)mv(i,i+cols);else if(rnd()<.15){const dx=rnd()<.5?-1:1;if(x+dx>=0&&x+dx<cols&&T[i+dx]===EMPTY)mv(i,i+dx)}break}
      case THERMITE:{if(L[i]>1){wake(i);L[i]--;
          for(const j of nbrs(i,x,y)){if(j<0)continue;const q=T[j];
            if(q===METAL||q===IRON){if(rnd()<.08){set(j,LAVA);discover('thermite',j)}}else if(q===STONE&&rnd()<.03)set(j,LAVA);else if(q===SAND&&rnd()<.1)set(j,GLASS);
            else if(q===WATER||q===SALTW||q===ICE||q===SNOW){if(rnd()<.2)set(j,STEAM,60)}else if(IGN[q])ignite(j);else if(FLAM[q])set(j,FIRE,25)}
          if(y>0&&T[i-cols]===EMPTY&&rnd()<.3)set(i-cols,FIRE,6);powder(i,x,y,4)}
        else if(L[i]===1)set(i,rnd()<.5?ASH:LAVA,0);else powder(i,x,y,4);break}
      case GAS:{if(rnd()<.35){const r=rnd(),dx=r<.33?-1:r<.66?1:0,dy=rnd()<.45?-1:rnd()<.5?1:0,nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<cols&&ny<rows){const j=ny*cols+nx;if(T[j]===EMPTY)mv(i,j)}}else wake(i);break}
      case ASH:if(rnd()<.6)powder(i,x,y,1.2);else wake(i);break;
      case GRAVEL:{if(y>=rows-1){V[i]=0;break}if(fall(i,y,4.5)>=0)break;if(rnd()<.3)powder(i,x,y,4.5);break}
      case IRON:{if(powder(i,x,y,4.2))break;const w=has(i,x,y,WATER),sw=has(i,x,y,SALTW);if(w>=0||sw>=0){wake(i);if(rnd()<(sw>=0?.004:.001)){set(i,RUST);discover('rust',i)}}break}
      case LN2:{wake(i);if(rnd()<.004){set(i,rnd()<.3?SMOKE:EMPTY,15);break}
        for(const j of nbrs(i,x,y)){if(j<0)continue;const q=T[j];
          if(q===WATER){if(rnd()<.3){set(j,ICE);discover('ln2',j)}}else if(q===SALTW){if(rnd()<.08)set(j,ICE)}else if(q===STEAM)set(j,SNOW);
          else if(q===LAVA){set(j,STONE);set(i,SMOKE,15);break}else if(q===FIRE||q===EMBER){set(j,EMPTY);if(rnd()<.3){set(i,SMOKE,15);break}}}
        if(T[i]===LN2)liquid(i,x,y,1.5,2+G);break}
      case HONEY:if(rnd()<.12)liquid(i,x,y,2.4,1);else wake(i);break;
      case MERCURY:liquid(i,x,y,9,2+G);break;
      case CONCRETE:{wake(i);if(rnd()<.0015){set(i,STONE);break}if(rnd()<.35)liquid(i,x,y,3.4,1);break}
      case COAL:break;
      case BHOLE:wake(i);if(rnd()<.6)pull(i,x,y,14*G,t=>MOV[t]&&t!==FISH&&t!==BUG,true,true);break;
      case FAN:{wake(i);for(let k=0;k<2;k++){const up=1+(rnd()*18*G|0),py=y-up;if(py<1)continue;const j=py*cols+x+(rnd()<.5?0:rnd()<.5?-1:1);if(j<cols||j>=N)continue;const t=T[j];
          if(MOV[t]&&t!==FISH&&t!==BUG){const n=j-cols-(rnd()<.5?cols:0);if(n>=0&&(T[n]===EMPTY||GASF[T[n]]))mv(j,n)}}break}
      case MAGNET:{wake(i);pull(i,x,y,16*G,t=>t===IRON,true,false);if(rnd()<.02&&has(i,x,y,IRON)>=0)discover('magnet',i);break}
      case ANT:{if(y<rows-1){const b=i+cols;if(T[b]===EMPTY||GASF[T[b]]){mv(i,b);break}}wake(i);if(rnd()>.4)break;
        const dir=L[i]&1?1:-1,nx=x+dir;if(nx<0||nx>=cols){L[i]^=1;break}const j=i+dir,q=T[j];
        if(q===EMPTY)mv(i,j);
        else if((q===DIRT||q===SAND||q===MUD||q===ASH)&&rnd()<.2)mv(i,j);
        else if(y>0&&T[j-cols]===EMPTY&&T[i-cols]===EMPTY)mv(i,j-cols);
        else if(y<rows-1&&(T[i+cols]===DIRT||T[i+cols]===SAND)&&rnd()<.05)mv(i,i+cols);
        else L[i]^=1;break}
      case SEED:{if(powder(i,x,y,4))break;const n=nbrs(i,x,y);let w=-1;for(const j of n)if(j>=0&&(T[j]===WATER||T[j]===MUD)){w=j;break}
        if(w<0&&y<rows-2){const b2=i+cols*2;if(T[b2]===WATER)w=b2}
        if(w>=0){wake(i);if(rnd()<.06){set(w,T[w]===MUD?DIRT:EMPTY);T[i]=STEM;L[i]=(8+(rnd()*16|0))*G;Sh[i]=(rnd()*255)|0;C[i]=tick;discover('flower',i)}}break}
      case SNOW:{if(rnd()<.55){if(!powder(i,x,y,1.5)&&rnd()<.1){const dx=rnd()<.5?-1:1;if(x+dx>=0&&x+dx<cols&&T[i+dx]===EMPTY)mv(i,i+dx)}}else wake(i);
        if(has(i,x,y,WATER)>=0){wake(i);if(rnd()<.004)set(i,WATER)}break}
      case WATER:liquid(i,x,y,2,3+G*2);break;
      case SALTW:liquid(i,x,y,2.2,3+G*2);break;
      case OIL:{if(!liquid(i,x,y,1,2+G*2)&&y<rows-1&&T[i+cols]===WATER&&rnd()<.02)discover('float',i);break}
      case ACID:{const n=nbrs(i,x,y);let busy=false;
        for(const j of n){if(j<0)continue;const q=T[j];
          if(q===GLASS){if(rnd()<.01)discover('safe',j);continue}
          if(q===STONE||q===METAL||q===RUST||q===WOOD||q===DIRT||q===MUD||q===SAND||q===SALT||q===PLANT||q===STEM||q===FLOWER||q===SEED||q===ICE||q===SNOW||q===BOOM||q===LAMP){busy=true;
            if(rnd()<.04){set(j,rnd()<.4?SMOKE:EMPTY,25);discover('acid',j);if(++L[i]>7){set(i,rnd()<.5?WATER:SMOKE,25);return}}}}
        if(busy)wake(i);liquid(i,x,y,2.1,2+G);break}
      case METAL:{const w=has(i,x,y,WATER),sw=has(i,x,y,SALTW);if(w>=0||sw>=0){wake(i);if(rnd()<(sw>=0?.004:.0008)){set(i,RUST);discover('rust',i)}}break}
      case LAVA:{const n=nbrs(i,x,y);let done=false;
        for(const j of n){if(j<0)continue;const q=T[j];
          if(q===WATER||q===SALTW){set(i,STONE);set(j,STEAM,60+(rnd()*60|0));discover('stone',i);done=true;break}
          if(IGN[q]&&q!==BOOM){ignite(j);continue}
          if(FLAM[q]){if(rnd()<.1){if(q===WOOD){set(j,EMBER,160+(rnd()*90|0));discover('burn',j)}else set(j,FIRE,30+(rnd()*30|0))}}
          else if(q===SAND&&rnd()<.004){set(j,GLASS);discover('glass',j)}
          else if(q===MUD&&rnd()<.05)set(j,DIRT);
          else if((q===ICE||q===SNOW)&&rnd()<.08){set(j,WATER);discover('melt',j)}}
        if(done)break;wake(i);if(y>0&&T[i-cols]===EMPTY&&rnd()<.0015)set(i-cols,SMOKE,40);
        liquid(i,x,y,3,G);break}
      case FIRE:{if(L[i]>0)L[i]--;if(L[i]===0){if(rnd()<.35)set(i,SMOKE,30+(rnd()*30|0));else set(i,EMPTY);break}
        wake(i);const n=nbrs(i,x,y);let out=false;
        for(const j of n){if(j<0)continue;const q=T[j];
          if(IGN[q]&&q!==BOOM){if(q!==COAL||rnd()<.3)ignite(j);continue}
          if(q===WATER){set(i,STEAM,70);if(rnd()<.5)set(j,STEAM,70);discover('steam',i);out=true;break}
          if(q===SALTW&&rnd()<.15){set(j,SALT);set(i,STEAM,70);discover('evap',j);out=true;break}
          if(q===WOOD&&rnd()<.05){set(j,EMBER,160+(rnd()*90|0));discover('burn',j)}
          else if((q===PLANT||q===STEM||q===FLOWER||q===SEED)&&rnd()<.1)set(j,FIRE,25+(rnd()*20|0));
          else if(q===OIL&&rnd()<.45){set(j,FIRE,25+(rnd()*25|0));discover('oil',j)}
          else if(q===MUD&&rnd()<.05)set(j,DIRT);
          else if((q===ICE||q===SNOW)&&rnd()<.15){set(j,WATER);discover('melt',j)}}
        if(out)break;if(rnd()<.55)gas(i,x,y);break}
      case EMBER:{if(L[i]>0)L[i]--;if(L[i]===0){const r=rnd();set(i,r<.3?ASH:r<.65?SMOKE:EMPTY,40);break}wake(i);
        if(y>0&&T[i-cols]===EMPTY&&rnd()<.35)set(i-cols,FIRE,10+(rnd()*25|0));
        const n=nbrs(i,x,y);for(const j of n){if(j<0)continue;const q=T[j];
          if(IGN[q]&&q!==BOOM){ignite(j);continue}
          if(q===WATER){set(i,STEAM,60);set(j,STEAM,60);discover('steam',i);break}
          if(q===WOOD&&rnd()<.006)set(j,EMBER,160+(rnd()*90|0));
          else if((q===ICE||q===SNOW)&&rnd()<.08){set(j,WATER);discover('melt',j)}
          else if((q===PLANT||q===OIL||q===SEED)&&rnd()<.1)set(j,FIRE,30)}
        break}
      case SPARK:{if(L[i]>0)L[i]--;if(L[i]===0){set(i,EMPTY);break}wake(i);const n=nbrs(i,x,y);
        for(const j of n){if(j<0)continue;const q=T[j];
          if(IGN[q]&&q!==BOOM){ignite(j);continue}
          if(q===SAND&&rnd()<.05){set(j,GLASS);discover('fulgurite',j)}
          else if((q===WOOD||q===OIL||q===PLANT)&&rnd()<.04)set(j,FIRE,25)
          else if(q===LAMP){L[j]=14;wake(j)}}
        break}
      case STEAM:{if(L[i]>0)L[i]--;if(L[i]===0||(y<2&&rnd()<.02)){if(rnd()<.5){set(i,WATER);if(y<rows*.5)discover('rain',i)}else set(i,EMPTY);break}wake(i);gas(i,x,y);break}
      case SMOKE:{if(L[i]>0)L[i]--;if(L[i]===0){set(i,EMPTY);break}wake(i);if(rnd()<.8)gas(i,x,y);break}
      case PLANT:{const w=has(i,x,y,WATER);if(w<0)break;wake(i);if(rnd()<.03){const n=nbrs(i,x,y),j=n[(rnd()*4)|0];if(j>=0&&T[j]===WATER){const jx=j%cols;let pn=0;
          for(const o of [j-cols,j+cols,jx>0?j-1:-1,jx<cols-1?j+1:-1])if(o>=0&&o<N&&T[o]===PLANT)pn++;if(pn<=1){set(j,PLANT);discover('grow',j)}}}break}
      case STEM:{wake(i);if(rnd()<.25){const h=L[i],hue=Sh[i];
          if(h>0&&y>1){let j=i-cols;const r=rnd();if(r<.2&&x>0)j--;else if(r<.4&&x<cols-1)j++;
            if(T[j]===EMPTY||T[j]===WATER){T[j]=STEM;L[j]=h-1;Sh[j]=hue;C[j]=tick;wake(j);T[i]=PLANT;L[i]=0;
              if(rnd()<.18){const sd=rnd()<.5?-1:1;if(x+sd>=0&&x+sd<cols&&T[i+sd]===EMPTY)set(i+sd,PLANT)}}
            else L[i]=0}
          else{T[i]=FLOWER;L[i]=1;const R=2*G;
            for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const m=Math.abs(dx)+Math.abs(dy);if(m>R||(!dx&&!dy))continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;const j=ny*cols+nx;
              if(T[j]===EMPTY||T[j]===WATER){T[j]=FLOWER;Sh[j]=hue;L[j]=m<=G?2:3;C[j]=tick;wake(j)}}}}break}
      case ICE:{const w=has(i,x,y,WATER);if(w<0)break;wake(i);if(rnd()<.01){const n=nbrs(i,x,y),j=n[(rnd()*4)|0];if(j>=0&&T[j]===WATER&&rnd()<.25){const up=j>=cols?T[j-cols]:EMPTY;
          if(up===EMPTY||up===ICE||up===SNOW){set(j,ICE);discover('freeze',j)}}}break}
      case CLOUD:{wake(i);if(y<rows-1&&T[i+cols]===EMPTY&&rnd()<.012)set(i+cols,WATER);break}
      case LAMP:if(L[i]>0){L[i]--;wake(i)}break;
      case CLONE:{wake(i);const n=nbrs(i,x,y);if(!L[i]){for(const j of n){if(j<0)continue;const q=T[j];if(q&&q!==CLONE&&q!==WALL&&q!==DRAIN&&q!==BATTERY&&q!==FLOWER&&q!==STEM&&q!==LAMP&&q!==FISH&&q!==BUG&&q!==ANT&&q!==BHOLE&&q!==FAN&&q!==MAGNET&&q!==FWSPARK){L[i]=q;break}}break}
        if(rnd()<.25){const j=n[(rnd()*4)|0];if(j>=0&&T[j]===EMPTY){const q=L[i];set(j,q,q===FIRE?30:q===STEAM?80:q===SMOKE?40:q===EMBER?150:q===SPARK?5:0)}}break}
      case DRAIN:{const n=nbrs(i,x,y);let any=false;for(const j of n)if(j>=0&&MOV[T[j]]){any=true;if(rnd()<.6)set(j,EMPTY)}if(any)wake(i);break}
      case FISH:{wake(i);const n=nbrs(i,x,y);let wet=0;for(const j of n)if(j>=0&&(T[j]===WATER||T[j]===SALTW))wet++;
        if(wet){if(rnd()<.45){const dir=L[i]&1?1:-1,opts=[i+dir,i+dir,i-cols,i+cols,i-cols+dir,i+cols+dir];const j=opts[(rnd()*opts.length)|0];
            const jx=j%cols;if(j>=0&&j<N&&Math.abs(jx-x)<=1&&(T[j]===WATER||T[j]===SALTW))mv(i,j);else if(rnd()<.3)L[i]^=1}}
        else if(!powder(i,x,y,4)&&rnd()<.03&&y>1){const dx=rnd()<.5?-1:1;const j=i-cols+dx;if(x+dx>=0&&x+dx<cols&&T[j]===EMPTY)mv(i,j)}break}
      case BUG:{wake(i);if(y<rows-1){const b=i+cols;if(T[b]===EMPTY||GASF[T[b]]){mv(i,b);break}if(LIQ[T[b]]){if(y>0&&LIQ[T[i-cols]]){mv(i,i-cols);break}}}
        if(rnd()<.3){const dir=L[i]&1?1:-1,nx=x+dir;if(nx<0||nx>=cols){L[i]^=1;break}const j=i+dir;
          if(T[j]===EMPTY)mv(i,j);else if(y>0&&T[j-cols]===EMPTY&&T[i-cols]===EMPTY)mv(i,j-cols);else L[i]^=1}break}
    }}
  function step(){
    tick=tick%255+1;frame++;stepN++;
    const a=awake;awake=awakeN;awakeN=a;awakeN.fill(0);   /* this step reads last step's wake marks; new marks go to next step */
    const aw=awake;
    for(let y=rows-1;y>=0;y--){const ltr=(y+frame)&1,row=(y>>4)*CC,base=y*cols;
      if(ltr){for(let c=0;c<CC;c++){if(!aw[row+c])continue;const x1=Math.min(cols,(c<<4)+16);for(let x=c<<4;x<x1;x++){const i=base+x;if(T[i]&&C[i]!==tick)cell(i,x,y)}}}
      else{for(let c=CC-1;c>=0;c--){if(!aw[row+c])continue;const x0=c<<4;for(let x=Math.min(cols,x0+16)-1;x>=x0;x--){const i=base+x;if(T[i]&&C[i]!==tick)cell(i,x,y)}}}}
    if(elecOn)electric();
  }
  /* electricity: a battery pulses every 24 steps; heads become tails, tails rest, resting conductors next to a head light up */
  function electric(){Qp.set(Q);const pulse=stepN%24===0;
    for(let i=0;i<N;i++){const t=T[i];if(!COND[t])continue;const q=Qp[i];if(q===1){Q[i]=2;continue}if(q===2){Q[i]=0;continue}
      const x=i%cols,y=(i/cols)|0;let fire=false;
      for(const j of nbrs(i,x,y)){if(j<0)continue;const u=T[j];if((COND[u]&&Qp[j]===1)||u===SPARK||(pulse&&u===BATTERY)){fire=true;break}}
      if(!fire)continue;Q[i]=1;if(t===SALTW&&rnd()<.05)discover('conduct',i);
      for(const j of nbrs(i,x,y)){if(j<0)continue;const u=T[j];
        if(u===LAMP){L[j]=14;wake(j);if(t===METAL)discover('circuit',j)}
        else if(IGN[u]){ignite(j)}
        else if((u===WOOD||u===OIL)&&rnd()<.01)set(j,FIRE,25)}}}

  /* ---------- colors ---------- */
  const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const pack=(r,g2,b,a=255)=>(a<<24)|(clamp(b|0,0,255)<<16)|(clamp(g2|0,0,255)<<8)|clamp(r|0,0,255);
  const BASE={[SAND]:'#F2C86B',[WATER]:'#3D7BFF',[STONE]:'#8A8FA8',[WOOD]:'#A8693A',[STEAM]:'#C9D6FF',[PLANT]:'#2FBF5B',[SEED]:'#8B5A2B',[ICE]:'#BDEFFF',[SNOW]:'#FFFFFF',
    [OIL]:'#4A3420',[SMOKE]:'#6B6B80',[CLOUD]:'#E9EDFF',[GLASS]:'#9FE8F0',[FISH]:'#FF8A2B',[BUG]:'#FF4F5E',[STEM]:'#249E48',
    [SALT]:'#F4F4F8',[SALTW]:'#4F9BE8',[ACID]:'#7CFF3A',[METAL]:'#9AA6B8',[RUST]:'#B5542B',[BOOM]:'#4A4458',[BATTERY]:'#2BD16B',[CLONE]:'#E879F9',[DRAIN]:'#14102E',[WALL]:'#5B5F73',[DIRT]:'#7A5232',[MUD]:'#5A3B22',[LAMP]:'#5E5A3A',
    [FUSE]:'#6B4F2A',[TNT]:'#D7263D',[NITRO]:'#C6F65B',[FIREWORK]:'#FF5DA2',[THERMITE]:'#8A5A44',[GAS]:'#B6E36F',[COAL]:'#2B2B2E',[ASH]:'#C9C4BE',[LN2]:'#D9F2FF',[HONEY]:'#F2A81D',
    [MERCURY]:'#C9CDD6',[CONCRETE]:'#A9A59C',[GRAVEL]:'#77736C',[BHOLE]:'#0A0514',[FAN]:'#7FD3E8',[MAGNET]:'#E23B3B',[IRON]:'#5D6470',[ANT]:'#1A1208'};
  const VAR={[SAND]:28,[STONE]:26,[WOOD]:22,[PLANT]:30,[SEED]:20,[ICE]:14,[SNOW]:6,[OIL]:12,[CLOUD]:10,[GLASS]:20,[STEAM]:14,[SMOKE]:20,[WATER]:5,[STEM]:16,
    [SALT]:14,[SALTW]:6,[ACID]:20,[METAL]:22,[RUST]:30,[BOOM]:30,[DIRT]:26,[MUD]:14,[WALL]:18,[BATTERY]:10,[DRAIN]:8,[CLONE]:10,[LAMP]:10,[FUSE]:20,[TNT]:16,[NITRO]:10,[FIREWORK]:40,[THERMITE]:26,[GAS]:16,[COAL]:14,[ASH]:20,[LN2]:8,[HONEY]:12,[MERCURY]:16,[CONCRETE]:14,[GRAVEL]:44,[FAN]:16,[MAGNET]:10,[IRON]:24};
  const PAL={};for(const k in BASE){const c=hex(BASE[k]),v=VAR[k]||0;PAL[k]=new Uint32Array(16);for(let s=0;s<16;s++){const f=(s/15-.5)*v;PAL[k][s]=pack(c[0]+f,c[1]+f,c[2]+f,k==STEAM?190:k==SMOKE?150:k==GAS?90:k==LN2?220:255)}}
  PAL[WOOD]=PAL[WOOD].map((c,s)=>s%5===0?pack(140,82,40):c);PAL[TNT]=PAL[TNT].map((c,s)=>s%4===0?pack(250,240,230):c);PAL[FIREWORK]=PAL[FIREWORK].map((c,s)=>s%3===0?pack(255,230,90):s%3===1?pack(90,200,255):c);PAL[BOOM]=PAL[BOOM].map((c,s)=>s%6===0?pack(200,190,210):c);
  const FLOWERC=[];for(let h=0;h<64;h++){const a=h/64*6.283;FLOWERC.push([pack(200+55*Math.cos(a),120+100*Math.cos(a+2.1),160+95*Math.cos(a+4.2)),pack(255,220,80)])}
  const FIREC=[pack(255,240,150),pack(255,200,60),pack(255,140,40),pack(255,90,30),pack(220,50,30)];
  const HEAD=pack(255,245,140),TAIL=pack(255,170,70);const HUES=[];for(let h=0;h<256;h++){const a=h/256*6.283;HUES.push(pack(190+65*Math.cos(a),190+65*Math.cos(a+2.1),190+65*Math.cos(a+4.2)))}
  function render(){const cr=[];let elec=false;
    for(let i=0;i<N;i++){const t=T[i];if(!t){buf[i]=0;glowBuf[i]=0;continue}let c;glowBuf[i]=0;
      switch(t){
        case FIRE:c=FIREC[clamp((4-L[i]/16+rnd()*1.6)|0,0,4)];glowBuf[i]=c;break;
        case LAVA:{const w=Math.sin(frame*.06+(i%cols)*.3/G+((i/cols)|0)*.2/G)*.5+.5;c=pack(255,70+w*120+(Sh[i]&31),20+w*30);glowBuf[i]=pack(255,90,20);break}
        case WATER:{const w=Math.sin(frame*.07+(i%cols)*.21/G+((i/cols)|0)*.13/G+Sh[i]*.03);c=w>.985?pack(150,200,255):PAL[WATER][Sh[i]>>4];break}
        case EMBER:{const w=Math.sin(frame*.15+i)*.5+.5;c=pack(200+w*55,60+w*70+(Sh[i]&15),20);glowBuf[i]=pack(255,80,20);break}
        case FLOWER:c=FLOWERC[Sh[i]>>2][L[i]===1?1:0];if(L[i]===3)c=FLOWERC[(Sh[i]>>2)][0];break;
        case FISH:case BUG:c=0;cr.push(i);break;
        case GLASS:c=PAL[GLASS][(Sh[i]+frame)>>4&15];break;
        case ACID:c=PAL[ACID][Sh[i]>>4];glowBuf[i]=pack(60,160,20);break;
        case SPARK:c=HEAD;glowBuf[i]=pack(255,250,160);elec=true;break;
        case BATTERY:c=PAL[BATTERY][Sh[i]>>4];elec=true;if(stepN%24<3)glowBuf[i]=pack(80,255,140);break;
        case LAMP:if(L[i]>0){c=pack(255,228,92);glowBuf[i]=pack(255,235,120)}else c=PAL[LAMP][Sh[i]>>4];break;
        case CLONE:{const w=Math.sin(frame*.1+i*.01)*.5+.5;c=pack(200+w*40,100+w*40,240);break}
        case FWSPARK:c=HUES[Sh[i]];glowBuf[i]=c;break;
        case FUSE:if(L[i]>1){c=pack(255,170+(rnd()*80|0),60);glowBuf[i]=pack(255,140,40)}else c=PAL[FUSE][Sh[i]>>4];break;
        case TNT:c=L[i]&&(frame&2)?pack(255,255,255):PAL[TNT][Sh[i]>>4];break;
        case FIREWORK:c=PAL[FIREWORK][Sh[i]>>4];if(L[i]>1){c=pack(255,240,200);glowBuf[i]=c}break;
        case THERMITE:if(L[i]>1){c=pack(255,250,230);glowBuf[i]=pack(255,220,160)}else c=PAL[THERMITE][Sh[i]>>4];break;
        case MERCURY:{const w=Math.sin(frame*.05+(i%cols)*.4/G+Sh[i]*.02);c=w>.9?pack(245,248,255):PAL[MERCURY][Sh[i]>>4];break}
        case BHOLE:{const w=Math.sin(frame*.12+i*.003)*.5+.5;c=pack(20+w*40,0,40+w*60);glowBuf[i]=pack(110,40,200);break}
        case FAN:c=PAL[FAN][((Sh[i]>>4)+(frame>>1))&15];break;
        case ANT:c=PAL[ANT][0];cr.push(i);break;
        default:c=PAL[t][Sh[i]>>4]}
      if(Q[i]){elec=true;c=Q[i]===1?HEAD:TAIL;glowBuf[i]=Q[i]===1?pack(255,240,120):0}
      buf[i]=c}
    elecOn=elec;
    gctx.putImageData(img,0,0);glowCtx.putImageData(glowImg,0,0);
    ctx.setTransform(dims.d,0,0,dims.d,0,0);ctx.drawImage(bg,0,0,dims.w,dims.h);
    ctx.imageSmoothingEnabled=false;ctx.drawImage(gcv,0,0,cols*cs,rows*cs);
    {const sm=glowSm,sw=Math.max(1,cols>>2),sh=Math.max(1,rows>>2);if(sm.width!==sw||sm.height!==sh){sm.width=sw;sm.height=sh}const sx=sm.getContext('2d');sx.clearRect(0,0,sw,sh);sx.imageSmoothingEnabled=true;sx.drawImage(glowCv,0,0,sw,sh);
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.6;ctx.imageSmoothingEnabled=true;ctx.drawImage(sm,0,0,cols*cs,rows*cs);ctx.restore()}
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='24px serif';
    for(const i of cr){const x=(i%cols+.5)*cs,y=((i/cols|0)+.5)*cs;if(T[i]===ANT){ctx.fillStyle='#1A1208';ctx.fillRect(x-cs*1.5,y-cs,cs*3,cs*2);ctx.fillStyle='#5A2A10';ctx.fillRect(x+(L[i]&1?cs:-cs*2),y-cs,cs,cs);continue}ctx.save();ctx.translate(x,y-10);if(T[i]===FISH&&(L[i]&1))ctx.scale(-1,1);ctx.fillText(T[i]===FISH?'🐟':'🐞',0,0);ctx.restore()}
    if(flash>0){ctx.fillStyle=`rgba(255,240,200,${flash*.06})`;ctx.fillRect(0,0,dims.w,dims.h);flash--}
    /* brush outlines, tool rings and line/box previews */
    for(const f of fmap.values()){const r=radius()*cs;ctx.lineWidth=2;ctx.setLineDash([5,5]);
      ctx.strokeStyle=tool==='heat'?'rgba(255,120,60,.9)':tool==='cool'?'rgba(140,220,255,.9)':'rgba(255,255,255,.6)';
      if(f.data.shape==='line'){ctx.lineWidth=Math.max(2,r*2);ctx.setLineDash([]);ctx.globalAlpha=.4;ctx.strokeStyle=swatchCol(cur);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(f.sx,f.sy);ctx.lineTo(f.x,f.y);ctx.stroke();ctx.globalAlpha=1}
      else if(f.data.shape==='box'){ctx.setLineDash([]);ctx.globalAlpha=.4;ctx.fillStyle=swatchCol(cur);ctx.fillRect(Math.min(f.sx,f.x),Math.min(f.sy,f.y),Math.abs(f.x-f.sx),Math.abs(f.y-f.sy));ctx.globalAlpha=1}
      else{ctx.beginPath();ctx.arc(f.x,f.y,r,0,7);ctx.stroke()}ctx.setLineDash([])}
  }
  const swatchCol=t=>{const c=EL[t]&&EL[t][1];return c&&c[0]==='#'?c:'#ffffff'};
  const bg=document.createElement('canvas'),glowSm=document.createElement('canvas');
  function drawBg(){bg.width=cv.width;bg.height=cv.height;const b=bg.getContext('2d');b.setTransform(dims.d,0,0,dims.d,0,0);const gr=b.createLinearGradient(0,0,0,dims.h);
    gr.addColorStop(0,'#241D5C');gr.addColorStop(1,'#3B2F86');b.fillStyle=gr;b.fillRect(0,0,dims.w,dims.h);
    for(let i=0;i<60;i++){b.fillStyle=`rgba(255,255,255,${.15+(i%5)*.08})`;const x=(i*157)%dims.w,y=(i*97)%(dims.h*.7);b.fillRect(x,y,2,2)}}
  drawBg();

  /* ---------- painting and tools ---------- */
  const radius=()=>SIZES[sizeI][1]/cs;
  const lifeOf=t=>t===FIRE?30+(rnd()*40|0):t===STEAM?Math.min(250,(60+rnd()*60)*G*.7|0):t===SPARK?4+(rnd()*4|0):t===SMOKE?40:t===EMBER?150:0;
  const SOLIDISH=t=>t===STONE||t===WOOD||t===ICE||t===CLOUD||t===GLASS||t===METAL||t===WALL||t===BATTERY||t===CLONE||t===DRAIN||t===LAMP||t===TNT||t===FUSE||t===COAL||t===BHOLE||t===FAN||t===MAGNET;
  let critterTick=0;
  function critters(){let n=0;for(let k=0;k<N;k++)if(T[k]===FISH||T[k]===BUG)n++;return n}
  function put(i,t,dense){if(t===ERASE){if(T[i])set(i,EMPTY);return}
    if(T[i]!==EMPTY&&!SOLIDISH(t)&&t!==SPARK)return;if(T[i]===FISH||T[i]===BUG)return;if(rnd()>dense)return;
    if(t===SPARK&&T[i]!==EMPTY){if(COND[T[i]]){Q[i]=1;elecOn=true}else if(IGN[T[i]])ignite(i);else if(T[i]===SAND&&rnd()<.3){set(i,GLASS);discover('fulgurite',i)}return}
    set(i,t,lifeOf(t))}
  function circle(px,py,fn){const cx=px/cs,cy=py/cs,r=radius();
    for(let y=Math.max(0,(cy-r)|0);y<=Math.min(rows-1,(cy+r)|0);y++)for(let x=Math.max(0,(cx-r)|0);x<=Math.min(cols-1,(cx+r)|0);x++){if((x+.5-cx)**2+(y+.5-cy)**2>r*r+.5)continue;fn(y*cols+x,x,y)}}
  const density=t=>t===SEED?.01:t===FIREWORK?.03:t===ANT?.02:t===GAS?.3:(t===SAND||t===SNOW||t===WATER||t===OIL||t===SALT||t===DIRT||t===SALTW||t===ACID||t===BOOM||t===MUD||t===NITRO||t===THERMITE||t===ASH||t===LN2||t===HONEY||t===MERCURY||t===CONCRETE||t===GRAVEL||t===IRON)?.45:t===SPARK?.25:1;
  function paintAt(px,py){
    if(cur===FISH||cur===BUG){if(critterTick>0)return;critterTick=8;const x=(px/cs)|0,y=(py/cs)|0;if(x<0||y<0||x>=cols||y>=rows)return;const i=y*cols+x;
      if(critters()>=40)return;if(T[i]===EMPTY||T[i]===WATER||T[i]===SALTW){set(i,cur,rnd()<.5?1:0);pop(1.3)}return}
    if(cur===ANT&&tool!=='erase'){let n=0;for(let k=0;k<N;k++)if(T[k]===ANT)n++;if(n>=300)return}
    const t=tool==='erase'?ERASE:cur,dn=density(t);circle(px,py,i=>put(i,t,dn))}
  function heatCool(px,py,hot){circle(px,py,(i,x,y)=>{if(rnd()>.12)return;const t=T[i];
    if(hot){if(t===ICE||t===SNOW){set(i,WATER);discover('melt',i)}else if(t===WATER){set(i,STEAM,80);discover('steam',i)}else if(t===SALTW){set(i,SALT);if(y>0&&T[i-cols]===EMPTY)set(i-cols,STEAM,80);discover('evap',i)}
      else if(t===WOOD){set(i,EMBER,160);discover('burn',i)}else if(FLAM[t])set(i,FIRE,30);else if(IGN[t])ignite(i);else if(t===MUD)set(i,DIRT);
      else if(t===STONE&&rnd()<.04){set(i,LAVA);discover('meltrock',i)}else if(t===SAND&&rnd()<.03){set(i,GLASS);discover('glass',i)}else if(t===EMPTY&&rnd()<.04)set(i,FIRE,6)}
    else{if(t===WATER){set(i,ICE);discover('freeze',i)}else if(t===SALTW){if(rnd()<.08)set(i,ICE)}else if(t===STEAM){set(i,WATER);discover('condense',i)}else if(t===LAVA||t===CONCRETE)set(i,STONE)
      else if(t===FIRE||t===EMBER)set(i,rnd()<.5?SMOKE:EMPTY,20);else if(t===EMPTY&&rnd()<.01)set(i,SNOW)}})}
  /* wind: pushes loose things the way your finger moves, up to 2 cells a frame; the far side moves first so nothing is pushed twice */
  function windAt(f){const dx=Math.sign(f.vx)*(Math.abs(f.vx)>.6?1:0),dy=Math.sign(f.vy)*(Math.abs(f.vy)>.6?1:0);if(!dx&&!dy)return;
    const cx=f.x/cs,cy=f.y/cs,r=radius()*1.4,x0=Math.max(0,(cx-r)|0),x1=Math.min(cols-1,(cx+r)|0),y0=Math.max(0,(cy-r)|0),y1=Math.min(rows-1,(cy+r)|0);
    for(let a=0;a<=y1-y0;a++){const y=dy>0?y1-a:y0+a;for(let b=0;b<=x1-x0;b++){const x=dx>0?x1-b:x0+b;if((x-cx)**2+(y-cy)**2>r*r)continue;const i=y*cols+x;if(!MOV[T[i]]||rnd()<.15)continue;
      let j=i;for(let k=0;k<3;k++){const jx=j%cols,jy=(j/cols)|0;let moved=false;
        for(const [ox,oy] of [[dx,dy],[dx||(rnd()<.5?-1:1),dy?dy:-1]]){const nx=jx+ox,ny=jy+oy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;const n=ny*cols+nx;if(T[n]===EMPTY||GASF[T[n]]){j=n;moved=true;break}}
        if(!moved)break}
      if(j!==i)mv(i,j)}}}
  function lineCells(x0,y0,x1,y1,fn){const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)/(cs*.8)));for(let k=0;k<=n;k++)fn(x0+(x1-x0)*k/n,y0+(y1-y0)*k/n)}
  function boxFill(x0,y0,x1,y1){const t=cur;for(let y=Math.max(0,Math.min(y0,y1)/cs|0);y<=Math.min(rows-1,Math.max(y0,y1)/cs|0);y++)for(let x=Math.max(0,Math.min(x0,x1)/cs|0);x<=Math.min(cols-1,Math.max(x0,x1)/cs|0);x++)put(y*cols+x,t,t===SEED?.02:1)}
  function pickAt(px,py){const x=(px/cs)|0,y=(py/cs)|0;if(x<0||y<0||x>=cols||y>=rows)return;let t=T[y*cols+x];if(t===FLOWER||t===STEM)t=PLANT;if(t===EMBER)t=FIRE;if(t===SMOKE)t=STEAM;if(t===FWSPARK)t=FIREWORK;
    if(!EL[t]){buzz();return}setEl(t);setTool('draw',true)}

  /* ---------- undo ---------- */
  const hist=[];
  function remember(){hist.push({T:T.slice(),L:L.slice(),Sh:Sh.slice(),cols,rows});if(hist.length>8)hist.shift();$('#undo').disabled=false}
  function undo(){const s=hist.pop();if(!s){buzz();return}if(s.cols===cols&&s.rows===rows){T.set(s.T);L.set(s.L);Sh.set(s.Sh);Q.fill(0);V.fill(0);wakeAll();tone(500,.1,'triangle')}else buzz();$('#undo').disabled=!hist.length}

  /* ---------- touch ---------- */
  let sndT=0;
  const fmap=fingers(cv,{
    down(f){f.data.lx=f.x;f.data.ly=f.y;
      if(tool==='pick'){pickAt(f.x,f.y);f.data.done=true;return}
      remember();
      if(tool==='line'||tool==='box'){f.data.shape=tool;return}
      if(tool==='draw'||tool==='erase')paintAt(f.x,f.y);elSound()},
    move(f){if(f.data.done||f.data.shape)return;if(tool==='draw'||tool==='erase'){const dx=f.x-f.data.lx,dy=f.y-f.data.ly,d=Math.hypot(dx,dy),st=Math.max(1,Math.ceil(d/Math.max(2,radius()*cs*.6)));
      for(let k=1;k<=st;k++)paintAt(f.data.lx+dx*k/st,f.data.ly+dy*k/st)}f.data.lx=f.x;f.data.ly=f.y},
    up(f){if(f.data.shape==='line'){const t=cur,dn=t===SEED?.03:1;lineCells(f.sx,f.sy,f.x,f.y,(x,y)=>circle(x,y,i=>put(i,t,dn)));tone(700,.1,'triangle')}
      else if(f.data.shape==='box'){boxFill(f.sx,f.sy,f.x,f.y);tone(700,.1,'triangle')}f.data.shape=null}});
  function elSound(){if(sndT>0)return;sndT=5;const t=tool==='erase'?ERASE:tool==='heat'?FIRE:tool==='cool'?ICE:tool==='wind'?STEAM:cur;
    const s={[SAND]:()=>noise(.1,3000,1,.06),[SALT]:()=>noise(.08,5000,1,.05),[DIRT]:()=>noise(.1,1500,1,.06),[WATER]:()=>noise(.12,900+rnd()*900,2,.08),[SALTW]:()=>noise(.12,800+rnd()*600,2,.08),
      [ACID]:()=>noise(.15,3500,4,.06),[FIRE]:()=>noise(.15,400,.6,.12),[LAVA]:()=>{noise(.2,200,.8,.12);tone(60,.2,'sine',.08)},[STONE]:()=>noise(.06,600,3,.08),[WOOD]:()=>tone(200,.06,'triangle',.08),
      [METAL]:()=>tone(1400,.08,'square',.03),[ICE]:()=>tone(2200,.06,'sine',.05),[SNOW]:()=>noise(.1,5000,1,.04),[OIL]:()=>noise(.12,400,3,.06),[SEED]:()=>tone(900,.05,'sine',.06),
      [PLANT]:()=>tone(500,.08,'sine',.06,0,700),[CLOUD]:()=>noise(.2,1200,.5,.05),[STEAM]:()=>noise(.2,2500,.5,.05),[SPARK]:()=>noise(.06,6000,2,.08),[BOOM]:()=>noise(.08,800,1,.05),
      [ERASE]:()=>noise(.1,1800,1,.06,0,400)}[t];s?s():tone(600,.05,'triangle',.05)}

  /* ---------- the bar and its menus ---------- */
  function setEl(t){cur=t;if(tool==='erase'||tool==='pick'||tool==='heat'||tool==='cool'||tool==='wind')tool='draw';syncUI();const e=EL[t];hint(`${e[1][0]==='#'?'':e[1]+' '}${e[0]}: ${e[2]}`);say(e[0]);tone(600,.08,'triangle')}
  function setTool(k,quiet){tool=k;syncUI();if(!quiet){const tl=TOOLS.find(x=>x[0]===k);hint({line:'Drag to draw a straight line.',box:'Drag to fill a box.',heat:'Hold it on things to heat them up.',cool:'Hold it on things to cool them down.',
    wind:'Swipe to blow things around and stir them.',pick:'Tap anything to pick that element.',erase:'Rub things out.',draw:'Draw with your finger.'}[k]);say(tl[2]);tone(650,.08,'triangle')}}
  function syncUI(){const e=EL[cur];const sw=$('.eb-sw');sw.textContent=e[1][0]==='#'?'':e[1];sw.style.background=e[1][0]==='#'?e[1]:'transparent';$('#elname').textContent=e[0];
    const tl=TOOLS.find(x=>x[0]===tool);$('#tooli').textContent=tl[1];$('#tooll').textContent=tl[0]==='pick'?'Copy':tl[2];
    $('#toolbtn').classList.toggle('on',tool!=='draw');const px=Math.min(26,Math.max(5,SIZES[sizeI][1]*.5));$('#sized').style.cssText=`width:${px}px;height:${px}px`;$('#sizel').textContent=SIZES[sizeI][0];
    $('#elbtn').classList.toggle('dim',tool==='erase'||tool==='heat'||tool==='cool'||tool==='wind'||tool==='pick')}
  let tab='powder';
  function elMenu(){const tb=TABS.find(x=>x[0]===tab);return `<div class="eb-tabs">${TABS.map(([k,i,n])=>`<button class="eb-tab${k===tab?' on':''}" data-tab="${k}">${i} ${n}</button>`).join('')}</div>
    <div class="popgrid">${tb[3].map(t=>{const e=EL[t];return `<button class="popitem${t===cur&&tool!=='erase'?' on':''}" data-e="${t}" title="${e[2]}"><span class="pe">${e[1][0]==='#'?`<span class="eb-dot" style="background:${e[1]}"></span>`:e[1]}</span>${e[0]}</button>`}).join('')}</div>`}
  const bar=$('#bar');
  /* bar buttons act when the finger lifts on the same button (a slow toddler press is a long press, and browsers send no click after one) */
  let downB=null;bar.addEventListener('pointerdown',e=>{downB=e.target.closest('button')});bar.addEventListener('pointercancel',()=>{downB=null});
  bar.addEventListener('pointerup',e=>{const b=e.target.closest('button');if(b&&b===downB&&!b.disabled)barPress(b);downB=null});
  bar.addEventListener('click',e=>{if(e.detail===0){const b=e.target.closest('button');if(b&&!b.disabled)barPress(b)}});
  bar.addEventListener('contextmenu',e=>e.preventDefault());
  function barPress(b){
    if(b.id==='elbtn'){const tb=TABS.find(x=>x[3].includes(cur));if(tb)tab=tb[0];popMenu(b,elMenu(),x=>{if(x.dataset.tab){tab=x.dataset.tab;x.closest('.pop').innerHTML=elMenu();tone(700,.05,'triangle');return false}if(x.dataset.e){setEl(+x.dataset.e)}})}
    else if(b.id==='toolbtn')popMenu(b,`<div class="popgrid">${TOOLS.map(([k,i,n])=>`<button class="popitem${k===tool?' on':''}" data-t="${k}"><span class="pe">${i}</span>${n}</button>`).join('')}</div>`,x=>{if(x.dataset.t)setTool(x.dataset.t)});
    else if(b.id==='sizebtn')popMenu(b,`<div class="popgrid">${SIZES.map(([n,p],k)=>`<button class="popitem${k===sizeI?' on':''}" data-b="${k}"><span class="pe"><span class="eb-dot ink" style="width:${Math.min(40,Math.max(6,p*.7))}px;height:${Math.min(40,Math.max(6,p*.7))}px"></span></span>${n}</button>`).join('')}</div>`,
      x=>{if(x.dataset.b){sizeI=+x.dataset.b;syncUI();tone(300+sizeI*120,.08,'triangle')}});
    else if(b.id==='pause'){paused=!paused;b.classList.toggle('on',paused);b.innerHTML=paused?'<span class="ti">▶️</span><span class="eb-l">Play</span>':'<span class="ti">⏸️</span><span class="eb-l">Freeze</span>';$('#stepbtn').disabled=!paused;tone(paused?400:600,.08,'triangle')}
    else if(b.id==='stepbtn'){if(paused){step();render();tone(800,.04,'triangle')}}
    else if(b.id==='speed'){speedI=(speedI+1)%SPEEDS.length;const s=SPEEDS[speedI];b.innerHTML=`<span class="ti">${s[0]}</span><span class="eb-l">${s[1]}</span>`;b.classList.toggle('on',speedI!==1);tone(400+speedI*150,.08,'triangle');hint(`Speed ${s[1]}`)}
    else if(b.id==='undo')undo();
    else if(b.id==='zoom'){setGrain((grainI+1)%GRAINS.length)}
    else if(b.id==='scenes'){const slot=k=>{try{const s=localStorage.getItem('wb-sand-slot'+k);return s?JSON.parse(s):null}catch(e){return null}};
      popMenu(b,`<div class="eb-mh">Worlds</div><div class="popgrid">${SCENES.map(t=>`<button class="popitem" data-s="${t[0]}"><span class="pe">${t[1]}</span>${t[2]}</button>`).join('')}
        ${autoSaved()?'<button class="popitem" data-s="last"><span class="pe">⏪</span>Last time</button>':''}</div>
        <div class="eb-mh">My saves</div><div class="popgrid">${[1,2,3].map(k=>`<button class="popitem" data-save="${k}"><span class="pe">💾</span>Save ${k}</button>`).join('')}
        ${[1,2,3].map(k=>`<button class="popitem" data-load="${k}" ${slot(k)?'':'disabled'}><span class="pe">📂</span>Open ${k}</button>`).join('')}</div>`,
        x=>{if(x.dataset.s){if(x.dataset.s==='last')loadFrom('wb-sand-auto');else{remember();scene(x.dataset.s)}}else if(x.dataset.save)saveTo('wb-sand-slot'+x.dataset.save,true);else if(x.dataset.load)loadFrom('wb-sand-slot'+x.dataset.load)})}}
  syncUI();$('#undo').disabled=true;

  /* ---------- zoom (grain size) ---------- */
  function setGrain(k){grainI=k;cs=GRAINS[k][1];regrid('scale');hist.length=0;$('#undo').disabled=true;const z=$('#zoom');z.querySelector('.eb-l').textContent=GRAINS[k][0].split(' ')[0];hint(GRAINS[k][0]+'. '+(k===0?'Lots of room!':'Bigger grains, easier to see.'));tone(500+k*120,.1,'triangle')}

  /* ---------- save and load: run-length coded types; lifetimes come back as fresh defaults ---------- */
  function encode(){let out='',run=0,last=-1;for(let i=0;i<N;i++){const t=T[i];if(t===last&&run<1295)run++;else{if(last>=0)out+=String.fromCharCode(48+last)+run.toString(36)+'.';last=t;run=1}}
    out+=String.fromCharCode(48+last)+run.toString(36)+'.';return JSON.stringify({v:1,cols,rows,d:out})}
  function decode(s){const o=JSON.parse(s);const t=new Uint8Array(o.cols*o.rows);let p=0;for(const part of o.d.split('.')){if(!part)continue;const ty=part.charCodeAt(0)-48,n=parseInt(part.slice(1),36);t.fill(ty,p,p+n);p+=n}return{cols:o.cols,rows:o.rows,T:t}}
  function saveTo(key,loud){try{localStorage.setItem(key,encode());if(loud){hint('Saved!');tone(880,.12,'triangle');tone(1320,.15,'triangle',.15,.1)}return true}catch(e){if(loud){hint('Not enough room to save. Try a smaller world or clear a slot.');buzz()}return false}}
  function autoSaved(){try{return !!localStorage.getItem('wb-sand-auto')}catch(e){return false}}
  function loadFrom(key){let o;try{const s=localStorage.getItem(key);if(!s){buzz();return false}o=decode(s)}catch(e){buzz();return false}
    remember();T.fill(0);L.fill(0);Q.fill(0);V.fill(0);sceneId++;
    for(let y=0;y<rows;y++){const oy=Math.min(o.rows-1,(y*o.rows/rows)|0);for(let x=0;x<cols;x++){const t=o.T[oy*o.cols+Math.min(o.cols-1,(x*o.cols/cols)|0)];if(t)set(y*cols+x,t,lifeOf(t))}}
    wakeAll();hint('Here is your world!');tone(660,.1,'triangle');return true}
  g.onEnd(()=>{let any=false;for(let i=0;i<N;i+=7)if(T[i]){any=true;break}if(any)saveTo('wb-sand-auto')});

  /* ---------- scenes ---------- */
  function fillShape(test,t,density=1,life=0){for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){if(test(x/cols,y/rows,x,y)&&rnd()<density)set(y*cols+x,t,life)}}
  let sceneId=0;
  function scene(k){
    T.fill(0);L.fill(0);Q.fill(0);V.fill(0);wakeAll();const my=++sceneId;const asp=cols/rows;
    if(k==='volcano'){fillShape((x,y)=>y>.9,SAND);fillShape((x,y)=>y>.4&&Math.abs(x-.6)<(y-.32)*.55&&y<=.9,STONE);fillShape((x,y)=>Math.abs(x-.6)<.035&&y>.45&&y<.86,LAVA);
      fillShape((x,y)=>y>.34&&y<.46&&Math.abs(x-.6)<.06,LAVA);fillShape((x,y)=>x<.28&&y>.7&&y<=.9,WATER);fillShape((x,y)=>x>.9&&y>.75&&y<=.9,WOOD);
      hint('Lava flows down to the water. Watch!');say('A volcano! What happens when lava touches water?')}
    if(k==='garden'){fillShape((x,y)=>y>.86,DIRT);fillShape((x,y)=>y>.82&&y<=.86,SAND);fillShape((x,y)=>y>.8&&y<=.82,SEED,.06);const puff=(cx,cy,r)=>(x,y)=>((x-cx)*asp)**2+(y-cy)**2<r*r;for(const [cx0,w] of [[.12,.24],[.56,.3]])for(let k=0;k<6;k++){const cx=cx0+w*k/5,r=.035+.03*Math.sin(k*1.7+1)**2;fillShape(puff(cx,.1-(k%2)*.02,r),CLOUD)}
      for(let i=0;i<4;i++){const x=(.15+i*.22)*cols|0;set((rows-1-((rows*.2)|0))*cols+x,BUG,i&1)}
      hint('The clouds make rain. Watch the seeds grow!');say('A garden! Rain helps the seeds grow into flowers.')}
    if(k==='winter'){const pond=(x,y)=>x>.33&&x<.67&&y>.76&&y<.9;fillShape((x,y)=>y>.9,STONE);fillShape((x,y)=>pond(x,y)&&!(x>.35&&x<.65&&y<.88),STONE);
      fillShape((x,y)=>x>.35&&x<.65&&y>.8&&y<.88,WATER);fillShape((x,y)=>x>.35&&x<.65&&y>.77&&y<=.8,ICE);
      fillShape((x,y)=>y>.8-.05*Math.sin(x*9+1)&&y<=.9&&!pond(x,y),SNOW);
      fillShape((x,y)=>x>.78&&x<.88&&y>.74&&y<.79&&(y>.765||Math.abs(x-.83)<.03),WOOD);fillShape((x,y)=>x>.79&&x<.87&&y>.71&&y<.76,EMBER,.5,200);
      fillShape((x,y)=>x>.08&&x<.2&&y>.86&&y<=.9,SALT);
      let n=0;const snow=()=>{if(!g.alive||my!==sceneId||n++>200)return;for(let i=0;i<cols/14;i++){const x=(rnd()*cols)|0;if(T[x]===EMPTY)set(x,SNOW)}g.later(snow,60)};snow();
      hint('Snow is falling. Can fire or salt melt it?');say('Brr! Snow and ice. What melts ice?')}
    if(k==='tank'){fillShape((x,y)=>y>.25,WATER);fillShape((x,y)=>y>.88-.04*Math.sin(x*12),SAND);fillShape((x,y)=>y>.7&&y<.88&&(Math.abs(x-.2)<.012||Math.abs(x-.75)<.012||Math.abs(x-.5)<.01),PLANT);
      for(let i=0;i<6;i++){const x=(.1+i*.15)*cols|0,y=(.45+(i%3)*.1)*rows|0;set(y*cols+x,FISH,i&1)}
      hint('Fish swim in water. Add oil and see where it goes!');say('A fish tank! Fish need water.')}
    if(k==='circuit'){const w=Math.max(2,G),hl=(y0)=>(x,y,X,Y)=>Y>=(y0*rows|0)&&Y<(y0*rows|0)+w;
      fillShape((x,y)=>y>.93,WALL);
      fillShape((x,y)=>x>.06&&x<.12&&y>.3&&y<.42,BATTERY);
      fillShape((x,y,X,Y)=>x>.12&&x<.45&&hl(.35)(x,y,X,Y),METAL);fillShape((x,y)=>x>.45&&x<.5&&y>.31&&y<.39,LAMP);
      fillShape((x,y,X,Y)=>x>.12&&x<.3&&hl(.39)(x,y,X,Y),METAL);fillShape((x,y,X,Y)=>X>=(.3*cols|0)&&X<(.3*cols|0)+w&&y>.39&&y<.8,METAL);
      fillShape((x,y)=>x>.25&&x<.55&&y>.7&&y<.93&&!(x>.27&&x<.53&&y<.91),GLASS);fillShape((x,y)=>x>.27&&x<.53&&y>.75&&y<.91,SALTW);
      fillShape((x,y,X,Y)=>x>.42&&x<.75&&hl(.6)(x,y,X,Y),METAL);fillShape((x,y,X,Y)=>X>=(.42*cols|0)&&X<(.42*cols|0)+w&&y>.6&&y<.8,METAL);
      fillShape((x,y)=>x>.72&&x<.86&&y>.86&&y<=.93,BOOM);fillShape((x,y,X,Y)=>X>=(.75*cols|0)&&X<(.75*cols|0)+w&&y>.6&&y<.86,METAL);
      fillShape((x,y)=>x>.9&&y>.6&&y<.93,STONE);
      hint('The battery sends electricity along the metal. Follow it!');say('A circuit! Electricity flows along metal.')}
    if(k==='lab'){fillShape((x,y)=>y>.93,STONE);
      const jar=(x0,x1)=>(x,y)=>x>x0&&x<x1&&y>.55&&y<=.93&&!(x>x0+.015&&x<x1-.015&&y<.915);
      fillShape(jar(.08,.3),GLASS);fillShape((x,y)=>x>.095&&x<.285&&y>.7&&y<.915,ACID);
      fillShape((x,y)=>x>.4&&x<.52&&y>.75&&y<=.93,METAL);fillShape((x,y)=>x>.56&&x<.66&&y>.8&&y<=.93,WOOD);
      fillShape(jar(.72,.94),GLASS);fillShape((x,y)=>x>.735&&x<.925&&y>.78&&y<.915,WATER);fillShape((x,y)=>x>.78&&x<.88&&y>.2&&y<.26,SALT);
      hint('Acid stays in the glass jar. Pour some on the metal!');say('A science lab! Careful with the acid.')}
    if(k==='boom'){fillShape((x,y)=>y>.93,STONE);
      for(let b=0;b<3;b++){const x0=.42+b*.15;fillShape((x,y)=>x>x0&&x<x0+.1&&y>.45+b*.05&&y<=.93&&!(x>x0+.015&&x<x0+.085&&y>.5+b*.05&&y<.9),b===1?WOOD:STONE);fillShape((x,y)=>x>x0+.03&&x<x0+.07&&y>.86&&y<.9,TNT)}
      fillShape((x,y,X,Y)=>x>.06&&x<.47&&Y>=(.93*rows|0)-G&&Y<(.93*rows|0),FUSE);fillShape((x,y,X,Y)=>x>.45&&x<.89&&Y>=(.9*rows|0)&&Y<(.9*rows|0)+G,FUSE);fillShape((x,y,X,Y)=>X>=(.45*cols|0)&&X<(.45*cols|0)+G&&Y>=(.9*rows|0)&&Y<(.93*rows|0),FUSE);
      fillShape((x,y)=>x>.04&&x<.07&&y>.89&&y<.93,FIRE,1,250);fillShape((x,y)=>x>.08&&x<.3&&y>.86&&y<.92,FIREWORK,.05);
      hint('The fuse is lit! Watch the towers.');say('Demolition! The fuse is burning.')}
    if(k==='empty'){hint('Pick something and draw with your finger!');say('All clean!')}
    tone(440,.1,'triangle');tone(660,.14,'triangle',.18,.08);
  }
  function resize(){const nd=fitCanvas(cv);if(Math.abs(nd.w-dims.w)<2&&Math.abs(nd.h-dims.h)<2&&nd.d===dims.d)return;dims=nd;regrid('bottom');hist.length=0;$('#undo').disabled=true;drawBg()}
  const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  scene('volcano');
  kbPointer(g,cv);
  g.key(e=>{const k=e.key;if(/^[0-9]$/.test(k)){setEl(KEYS[k==='0'?9:+k-1]);return true}
    if(k==='['||k==='-'){sizeI=Math.max(0,sizeI-1);syncUI();return true}if(k===']'||k==='='){sizeI=Math.min(SIZES.length-1,sizeI+1);syncUI();return true}
    const l=k.toLowerCase();
    if(l==='f'){barPress($('#pause'));return true}if(l==='s'||k==='.'){barPress($('#stepbtn'));return true}if(l==='z'&&!e.shiftKey){undo();return true}
    if(l==='e'){setTool(tool==='erase'?'draw':'erase');return true}if(l==='h'){setTool('heat');return true}if(l==='c'){setTool('cool');return true}if(l==='w'){setTool('wind');return true}if(l==='p'){setTool('pick');return true}
    if(k==='>'){barPress($('#speed'));return true}return false});
  let half=0;
  g.loop(()=>{if(critterTick>0)critterTick--;if(sndT>0)sndT--;if(boomSnd>0)boomSnd--;
    for(const f of fmap.values()){if(f.data.done||f.data.shape)continue;
      if(tool==='draw'||tool==='erase')paintAt(f.x,f.y);else if(tool==='heat'||tool==='cool')heatCool(f.x,f.y,tool==='heat');else if(tool==='wind')windAt(f);
      if(frame%6===0)elSound()}
    if(!paused){const s=SPEEDS[speedI][2];if(s<1){if(half^=1)step()}else for(let k=0;k<s;k++)step()}else frame++;
    render()});
  GAMES.sand._debug={get T(){return T},get L(){return L},get Q(){return Q},get found(){return found},scene,get cols(){return cols},get rows(){return rows},get cs(){return cs},get paused(){return paused},
    get size(){return sizeI},get frame(){return frame},get tool(){return tool},get cur(){return cur},get speed(){return SPEEDS[speedI][1]},DISC,E:{EMPTY,SAND,WATER,STONE,WOOD,FIRE,LAVA,STEAM,PLANT,SEED,FLOWER,ICE,SNOW,OIL,SMOKE,CLOUD,GLASS,FISH,BUG,STEM,EMBER,SALT,SALTW,ACID,METAL,RUST,BOOM,SPARK,BATTERY,CLONE,DRAIN,WALL,DIRT,MUD,LAMP,FUSE,TNT,NITRO,FIREWORK,FWSPARK,THERMITE,GAS,COAL,ASH,LN2,HONEY,MERCURY,CONCRETE,GRAVEL,BHOLE,FAN,MAGNET,ANT,IRON},
    /* fill a box given as fractions of the world (test hook) */
    place(t,x0,y0,x1,y1,dense=1){for(let y=Math.floor(y0*rows);y<Math.ceil(y1*rows);y++)for(let x=Math.floor(x0*cols);x<Math.ceil(x1*cols);x++)if(x>=0&&y>=0&&x<cols&&y<rows&&rnd()<dense)set(y*cols+x,t,lifeOf(t))},
    applyTool(kind,fx,fy,n=20){const px=fx*dims.w,py=fy*dims.h;for(let k=0;k<n;k++)heatCool(px,py,kind==='heat')},
    awakeChunks(){let n=0;for(const v of awake)n+=v;return{n,total:awake.length}},count(t){let n=0;for(const v of T)if(v===t)n++;return n}};
}}});
