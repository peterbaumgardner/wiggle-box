/* ---------------- Word Builder ---------------- */
Object.assign(GAMES,{
words:{order:8,title:'Word Builder',icon:'🔤',c:'var(--berry)',age:'5+',blurb:'Spell the picture, letter by letter',
init(stage,g){
  const W3=[['cat','🐱'],['dog','🐶'],['sun','☀️'],['bus','🚌'],['pig','🐷'],['hat','🎩'],['cup','🥤'],['bee','🐝'],['fox','🦊'],['egg','🥚'],['cow','🐮'],['owl','🦉'],['bed','🛏️'],['ant','🐜'],['bat','🦇'],['hen','🐔'],['car','🚗'],['map','🗺️'],['pie','🥧'],['web','🕸️']];
  const W4=[['fish','🐟'],['frog','🐸'],['duck','🦆'],['cake','🎂'],['star','⭐'],['ball','⚽'],['tree','🌳'],['boat','⛵'],['moon','🌙'],['bear','🐻'],['lion','🦁'],['milk','🥛'],['corn','🌽'],['kite','🪁'],['shoe','👟'],['rain','🌧️']];
  const TC=['#FFC83D','#24C786','#18BFD6','#FF8A2B','#9A5BFF','#FF7FC8','#7BE07B'];
  stage.innerHTML=`<div class="words"><div class="chips"><button class="chip on" data-l="3">3 letters</button><button class="chip" data-l="4">4 letters</button></div>
    <button class="pic" id="pic" aria-label="Hear the word"></button><div class="slots" id="slots"></div><div class="tiles" id="tiles"></div></div>`;
  const picEl=stage.querySelector('#pic'),slots=stage.querySelector('#slots'),tiles=stage.querySelector('#tiles');
  let list=W3,word='',posn=0,miss=0,busy=false,prev='',rid=0;
  stage.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{list=c.dataset.l==='3'?W3:W4;stage.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===c));round()}));
  picEl.addEventListener('click',()=>{if(busy)return;tone(700,.1,'triangle');picEl.classList.remove('wig');void picEl.offsetWidth;picEl.classList.add('wig');
    tiles.querySelectorAll('.glow').forEach(x=>x.classList.remove('glow'));const h=[...tiles.children].find(x=>!x.classList.contains('used')&&x.dataset.l===word[posn]);h&&h.classList.add('glow')});
  function round(){
    busy=false;posn=0;miss=0;rid++;let w;do{w=pick(list)}while(w[0]===prev);prev=w[0];word=w[0];picEl.textContent=w[1];
    slots.innerHTML=[...word].map(()=>'<div class="slot"></div>').join('');
    const extra=shuffle([...'abcdefghijklmnoprstuwy'].filter(l=>!word.includes(l))).slice(0,3);
    tiles.innerHTML='';shuffle([...word,...extra]).forEach((l,i)=>{const t=document.createElement('button');t.className='lt';t.textContent=l;t.dataset.l=l;t.style.setProperty('--c',TC[i%TC.length]);
      t.addEventListener('pointerdown',e=>{e.preventDefault();tap(t)});tiles.appendChild(t)});
    say(`Can you spell ${word}?`);
  }
  function tap(t){
    if(busy||t.classList.contains('used'))return;
    if(t.dataset.l===word[posn]){t.classList.add('used');tiles.querySelectorAll('.glow').forEach(x=>x.classList.remove('glow'));
      const s=slots.children[posn];s.textContent=t.dataset.l;s.classList.add('fill');tone(440+posn*110,.18,'triangle',.2);say(t.dataset.l.toUpperCase());posn++;miss=0;
      if(posn===word.length){busy=true;const my=rid;g.later(()=>{if(my!==rid)return;cheer();party();addStar();say(`${[...word].map(x=>x.toUpperCase()).join(', ')}. ${word}!`)},500);g.later(()=>{if(my===rid)round()},3600)}}
    else{buzz();shakeEl(t);miss++;if(miss>=2){const h=[...tiles.children].find(x=>!x.classList.contains('used')&&x.dataset.l===word[posn]);h&&h.classList.add('glow');say(`Look for the letter ${word[posn].toUpperCase()}`)}}
  }
  round();
  g.key(e=>{const k=e.key.toLowerCase();if(!/^[a-z]$/.test(k))return false;const t=[...tiles.children].find(x=>!x.classList.contains('used')&&x.dataset.l===k&&k===word[posn])||[...tiles.children].find(x=>!x.classList.contains('used')&&x.dataset.l===k);
    if(t)tap(t);else{buzz()}return true});
  GAMES.words._debug={W3,W4,get word(){return word},get posn(){return posn}};
}}
});
