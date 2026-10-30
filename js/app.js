/* Wiggle Box app: home screen, game sessions (open/close), keyboard and the test hook. Loaded last. */
/* ---------- router ---------- */
const SECTIONS=[['lab','Science Lab','🔬','Real physics and chemistry. Every lab shows the formulas live.'],['math','Math Lab','📐','Algebra, geometry, fractions, primes, chance. Drag the math around.'],
  ['think','Think Lab','🧩','Coding, logic and puzzles that stretch your brain.'],['play','Play & Learn','🎈','For the littlest scientists.']];
const tileHTML=([k,v])=>`<button class="tile" data-g="${k}" style="--c:${v.c}"><span class="age">Ages ${v.age}</span><span class="ico" aria-hidden="true">${v.icon}</span><h3>${v.title}</h3><p>${v.blurb}</p></button>`;
$('#jump').innerHTML=`<button class="jump" data-j="all">⭐ All</button>`+SECTIONS.map(([k,t,ic])=>`<button class="jump" data-j="${k}">${ic} ${t}</button>`).join('');
let homeTab='all';try{homeTab=localStorage.getItem('wb-tab')||'all'}catch(e){}
function setTab(k,save){homeTab=k;document.querySelectorAll('#jump .jump').forEach(b=>b.classList.toggle('on',b.dataset.j===k));document.querySelectorAll('#sections .sec').forEach(s=>s.hidden=k!=='all'&&!s.classList.contains('sec-'+k));if(save){try{localStorage.setItem('wb-tab',k)}catch(e){}$('#home').scrollTop=0}}
$('#jump').addEventListener('click',e=>{const a=e.target.closest('[data-j]');if(!a)return;setTab(a.dataset.j,true);tone(520,.08,'sine',.1)});
$('#sections').innerHTML=SECTIONS.map(([k,t,ic,d])=>`<section class="sec sec-${k}" id="sec-${k}"><div class="sec-h"><h2>${t}</h2><p>${d}</p></div>
  <div class="grid grid-${k}">${Object.entries(GAMES).filter(([,v])=>(v.section||'play')===k).sort((a,b)=>(a[1].order??50)-(b[1].order??50)).map(tileHTML).join('')}</div></section>`).join('');
setTab(SECTIONS.some(x=>x[0]===homeTab)?homeTab:'all');
let cur=null,homeScroll=0,lastTile=null;
/* One game session. Everything a game starts (timers, frames, listeners, observers, sounds) is registered here,
   so leaving the game stops all of it, even if the child taps Back before the game has finished starting. */
const STEP=1000/60;
function session(){
  const timers=new Set(),ends=[],frames=new Set(),loops=new Set();
  return {alive:true,kl:[],ku:[],key(fn){this.kl.push(fn)},keyFirst(fn){this.kl.unshift(fn)},keyUp(fn){this.ku.push(fn)},
    later(fn,ms){if(!this.alive)return 0;const t=setTimeout(()=>{timers.delete(t);if(this.alive)fn()},ms);timers.add(t);return t},clear(){timers.forEach(clearTimeout);timers.clear()},
    raf(fn){if(!this.alive)return 0;const id=requestAnimationFrame(t=>{frames.delete(id);if(this.alive)fn(t)});frames.add(id);return id},
    /* Fixed 60-steps-per-second game loop. fn(dt,t) always gets dt = 1/60 s, so motion and physics run at the same speed
       on 60 Hz, 120 Hz and slow screens. A slow frame runs at most two steps (never a spiral), and a long pause
       (hidden tab, sleeping tablet) resumes without a jump. */
    loop(fn){const L={id:0,last:performance.now(),acc:STEP};loops.add(L);
      const tick=t=>{if(!this.alive)return;let dt=t-L.last;L.last=t;if(dt<0||dt>250)dt=STEP;
        if(document.hidden)L.acc=0;else{L.acc+=dt;let n=0;while(L.acc>=STEP-1&&n<2){L.acc-=STEP;n++;fn(STEP,t)}if(L.acc>STEP)L.acc=0}
        if(this.alive)L.id=requestAnimationFrame(tick)};
      L.id=requestAnimationFrame(tick)},
    /* listen on something that outlives the game (window, document, the stage); removed automatically on exit */
    listen(target,type,fn,opts){target.addEventListener(type,fn,opts);ends.push(()=>target.removeEventListener(type,fn,opts))},
    onEnd(fn){if(!this.alive){try{fn()}catch(e){}return}ends.push(fn)},
    stop(){if(!this.alive)return;this.alive=false;this.clear();frames.forEach(cancelAnimationFrame);frames.clear();loops.forEach(L=>cancelAnimationFrame(L.id));loops.clear();
      ends.splice(0).forEach(f=>{try{f()}catch(e){console.warn('cleanup',e)}});try{speechSynthesis.cancel()}catch(e){}}};
}
function open(k){
  const G=GAMES[k];if(!G)return;
  if(cur){closePop();cur.stop();cur=null}   /* a second tap while a game is still starting: start it once, cleanly */
  homeScroll=$('#home').scrollTop;lastTile=k;$('#home').hidden=true;$('#game').hidden=false;$('#gtitle').textContent=G.title;
  const stage=$('#stage');stage.innerHTML='';stage.className='stage'+(G.stageClass?' '+G.stageClass:'');
  const g=cur=session();
  tone(520,.12,'triangle');tone(780,.15,'triangle',.2,.08);
  try{history.replaceState(null,'','#'+k)}catch(e){}
  requestAnimationFrame(()=>{if(!g.alive||cur!==g)return;
    try{G.init(stage,g)}catch(e){console.error(e);stage.innerHTML=`<div class="loading">Oops! This game got stuck. Tap ← and try again.</div>`;return}
    stage.querySelectorAll('.dock .drow.els').forEach(compactBar);try{stage.setAttribute('tabindex','-1');stage.focus({preventScroll:true})}catch(e){}if(window.WiggleBox)WiggleBox.ready=k});
}
function home(){closePop();if(window.WiggleBox)WiggleBox.ready=null;if(cur){cur.stop();cur=null}$('#stage').innerHTML='';$('#game').hidden=true;$('#home').hidden=false;$('#home').scrollTop=homeScroll;tone(400,.12,'triangle');
  const t=lastTile&&document.querySelector(`.tile[data-g="${lastTile}"]`);if(t)try{t.focus({preventScroll:true})}catch(e){}
  try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}}
$('#sections').addEventListener('click',e=>{const t=e.target.closest('.tile');if(t)open(t.dataset.g)});
$('#back').addEventListener('click',home);
addEventListener('keyup',e=>{if(cur)for(const fn of cur.ku)fn(e)});
addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(openPop){e.preventDefault();closePop();return}const panel=document.querySelector('.discpanel:not([hidden])');if(panel){e.preventDefault();panel.hidden=true;return}
    if(cur){e.preventDefault();home()}return}
  const tag=(e.target&&e.target.tagName)||'',inField=tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT';
  if(cur){if(inField&&!/^(Enter| )$/.test(e.key))return;if(e.ctrlKey||e.metaKey||e.altKey)return;
    /* let Enter/Space activate a focused button normally */
    if((e.key==='Enter'||e.key===' ')&&tag==='BUTTON'&&!e.target.closest('.stage canvas'))return;
    for(const fn of cur.kl){if(fn(e)===true){e.preventDefault();return}}return}
  /* home: arrow keys move between game tiles */
  if(/^Arrow/.test(e.key)){const tiles=[...document.querySelectorAll('.tile')],i=tiles.indexOf(document.activeElement);if(i<0){tiles[0].focus();e.preventDefault();return}
    const r=tiles[i].getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best=null,bd=1e9;
    for(const t of tiles){if(t===tiles[i])continue;const q=t.getBoundingClientRect(),dx=q.left+q.width/2-cx,dy=q.top+q.height/2-cy;
      const ok={ArrowLeft:dx<-5&&Math.abs(dy)<r.height*.6,ArrowRight:dx>5&&Math.abs(dy)<r.height*.6,ArrowUp:dy<-5,ArrowDown:dy>5}[e.key];if(!ok)continue;const d=Math.abs(dx)+Math.abs(dy)*1.5;if(d<bd){bd=d;best=t}}
    if(best){best.focus();best.scrollIntoView({block:'nearest',behavior:'smooth'});e.preventDefault()}}
});
/* read-only handle for the automated test suite: lets tests read game state; nothing here changes gameplay */
window.WiggleBox={games:GAMES,ready:null,get current(){return cur}};
const start=location.hash.slice(1);if(GAMES[start])open(start);
addEventListener("hashchange",()=>{const k=location.hash.slice(1);if(GAMES[k]){if(cur)home();open(k)}else if(cur)home()});
