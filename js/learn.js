/* The learning layer: what each child practised, how hard the next challenge should be, spoken words and "Talk about
   it" questions. Every game can use it; see docs/LEARNING_FRAMEWORK.md (section 7) for the calls and the skill ids.

   Privacy: everything stays in this browser's localStorage on this device (key wb-learn-v1). No names, no accounts,
   no audio, nothing sent anywhere. A grown-up can see it, export it or wipe it in the grown-ups view (js/grownups.js). */
const learn=(()=>{
  const KEY='wb-learn-v1',MAXLOG=3000,TALK_GAP=90000;
  /* friendly names for the grown-ups view; games may use other ids in the same areas, which show as they are */
  const AREAS=[['motor','✋','Hands and eyes'],['reading','🔤','Reading'],['talk','💬','Talking'],['math','🔢','Maths'],
    ['create','🎨','Creative thinking'],['think','🧠','Critical thinking']];
  const NAMES={'motor.tap':'tapping','motor.drag':'dragging','motor.trace':'tracing','motor.precision':'careful control','motor.twohand':'two hands',
    'motor.timing':'timing','reading.letters':'letters','reading.sounds':'letter sounds','reading.words':'words','reading.spelling':'spelling',
    'reading.sentences':'sentences','talk.vocab':'new words','talk.describe':'describing','talk.narrate':'telling what happened','talk.explain':'explaining why',
    'math.count':'counting','math.compare':'more and less','math.numberline':'number line','math.add':'adding','math.shapes':'shapes','math.spatial':'space and turning',
    'math.patterns':'patterns','math.measure':'measuring','math.place':'place value','math.multiply':'times','math.fractions':'fractions','math.geometry':'geometry',
    'math.algebra':'algebra','math.probability':'chance','math.graphs':'graphs','create.make':'making','create.remix':'mixing and remixing',
    'create.pretend':'pretending','create.music':'music','create.design':'designing','think.sort':'sorting','think.predict':'predicting','think.cause':'cause and effect',
    'think.plan':'planning','think.debug':'fixing mistakes','think.evidence':'testing ideas','think.memory':'remembering'};
  const blank=()=>({v:1,skills:{},log:[],variants:{},settings:{voice:false,talk:true}});
  let data=blank();
  try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.v===1)data={...blank(),...s,settings:{...blank().settings,...s.settings}}}catch(e){}

  /* saving is batched: at most once a second, and when the page is hidden or closed */
  let saveT=0;
  function flush(){clearTimeout(saveT);saveT=0;
    try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){
      /* storage full: keep the totals, drop the older half of the event log */
      data.log=data.log.slice(-MAXLOG/2);try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e2){}}}
  const save=()=>{if(!saveT)saveT=setTimeout(flush,1000)};
  addEventListener('pagehide',flush);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&saveT)flush()});

  const rec=k=>data.skills[k]||(data.skills[k]={seen:0,tries:0,ok:0,run:0,level:0,last:0});
  const note=(game,skill,kind,ok,detail)=>{data.log.push([Date.now(),game,skill,kind,ok,detail==null?null:String(detail).slice(0,60)]);
    if(data.log.length>MAXLOG)data.log.splice(0,data.log.length-MAXLOG);save()};

  /* the child met something: heard a word, saw a count, watched a cause and its effect */
  function saw(game,skill,detail){const r=rec(skill);r.seen++;r.last=Date.now();note(game,skill,'saw',null,detail)}
  /* the child tried something that can work or not. Difficulty moves like a staircase: up a level after three
     successes in a row, down after two misses in a row, so it settles where the child succeeds most of the time. */
  function tried(game,skill,ok,detail){const r=rec(skill);r.tries++;if(ok)r.ok++;r.last=Date.now();
    if(ok){r.run=r.run>0?r.run+1:1;if(r.run>=3){r.level=Math.min(50,r.level+1);r.run=0}}
    else{r.run=r.run<0?r.run-1:-1;if(r.run<=-2){r.level=Math.max(0,r.level-1);r.run=0}}
    note(game,skill,'try',!!ok,detail)}
  /* how hard the next challenge should be for this skill: 0 = easiest, never above max */
  function level(skill,max=50){const r=data.skills[skill];if(!r)return 0;if(r.level>max)r.level=max;return r.level}

  /* spoken words, only when a grown-up switched voice on (and sound is on) */
  function say(text){if(!data.settings.voice||!soundOn||!text)return;
    try{const s=window.speechSynthesis;if(!s)return;s.cancel();const u=new SpeechSynthesisUtterance(String(text));u.rate=.9;u.pitch=1.15;s.speak(u)}catch(e){}}

  /* "Talk about it": one open question for the people around the screen. Never graded, never blocking, at most one
     every 90 seconds. It never takes a touch (taps go straight through to the game) and fades after 10 seconds.
     opts.at: 'bottom' (default) or 'top', for games whose own controls are along the bottom. */
  let lastTalk=0;
  function talk(game,question,opts={}){if(!data.settings.talk||!question)return false;const now=Date.now();if(now-lastTalk<TALK_GAP)return false;
    const stage=document.getElementById('stage');if(!stage||stage.closest('[hidden]'))return false;lastTalk=now;
    stage.querySelector('.talk-card')?.remove();
    const el=document.createElement('div');el.className='talk-card'+(opts.at==='top'?' talk-top':'');el.setAttribute('role','status');
    el.innerHTML=`<span class="talk-i" aria-hidden="true">💬</span><span class="talk-q"><small>Talk about it</small>${question}</span>`;
    stage.appendChild(el);setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),400)},10000);
    say(question);note(game,'talk.explain','talk',null,question);return true}

  /* research: a stable choice for this device (each device keeps the option it got first) */
  function variant(name,options){if(!(name in data.variants)){data.variants[name]=options[Math.floor(Math.random()*options.length)];save()}return data.variants[name]}

  function summary(){return AREAS.map(([id,icon,name])=>{const skills=Object.entries(data.skills).filter(([k])=>k.split('.')[0]===id)
      .map(([k,r])=>({id:k,name:NAMES[k]||k.split('.')[1],seen:r.seen,tries:r.tries,ok:r.ok,level:r.level,last:r.last})).sort((a,b)=>(b.seen+b.tries)-(a.seen+a.tries));
    return{id,icon,name,total:skills.reduce((n,s)=>n+s.seen+s.tries,0),skills}})}
  function exportFile(){flush();const blob=new Blob([JSON.stringify({app:'wiggle-box',format:1,exported:new Date().toISOString(),
      settings:data.settings,variants:data.variants,skills:data.skills,log:{columns:['time','game','skill','kind','ok','detail'],rows:data.log}},null,1)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='wiggle-box-learning-'+new Date().toISOString().slice(0,10)+'.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
  function reset(){const settings=data.settings;data=blank();data.settings=settings;flush()}
  function set(name,value){data.settings[name]=value;save()}

  return{saw,tried,level,say,talk,variant,summary,export:exportFile,reset,set,flush,AREAS,NAMES,
    get settings(){return{...data.settings}},get data(){return data}};
})();
