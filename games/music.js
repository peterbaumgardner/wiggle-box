/* ---------------- Rainbow Piano ---------------- */
Object.assign(GAMES,{
music:{order:6,title:'Rainbow Piano',icon:'🎹',c:'var(--sun)',age:'2+',blurb:'Play, copy me, and learn a song',
init(stage,g){
  const N=[['C','do',261.63,'#FF4F5E'],['D','re',293.66,'#FF8A2B'],['E','mi',329.63,'#FFC83D'],['F','fa',349.23,'#24C786'],['G','so',392,'#18BFD6'],['A','la',440,'#3D7BFF'],['B','ti',493.88,'#9A5BFF'],['C','do',523.25,'#FF7FC8']];
  const SONG=[0,0,4,4,5,5,4, 3,3,2,2,1,1,0, 4,4,3,3,2,2,1, 4,4,3,3,2,2,1, 0,0,4,4,5,5,4, 3,3,2,2,1,1,0];
  stage.innerHTML=`<div class="music"><div class="chips"><button class="chip on" data-m="free">Free play</button><button class="chip" data-m="song">Learn a song</button><button class="chip" data-m="copy">Copy me</button></div>
    <p class="msg" id="msg">Tap the colors to make music!</p>
    <div class="pads" id="pads">${N.map((n,i)=>`<button class="pad" style="--c:${n[3]}" data-i="${i}" aria-label="${n[0]}"><b>${n[0]}</b><small>${n[1]}</small></button>`).join('')}</div></div>`;
  const pads=[...stage.querySelectorAll('.pad')],msg=stage.querySelector('#msg');
  let mode='free',pos=0,seq=[],ui=0,locked=false,wins=0;
  function note(i,d=.55){const f=N[i][2];tone(f,d,'triangle',.22);tone(f*2,d*.6,'sine',.06)}
  function flash(i,ms=220){pads[i].classList.add('lit');g.later(()=>pads[i].classList.remove('lit'),ms)}
  function setNext(){pads.forEach((p,i)=>p.classList.toggle('next',mode==='song'&&i===SONG[pos]))}
  function playSeq(){locked=true;msg.textContent='Listen…';seq.forEach((i,k)=>g.later(()=>{note(i);flash(i,350)},600+k*600));
    g.later(()=>{locked=false;ui=0;msg.textContent='Your turn!'},600+seq.length*600)}
  function setMode(m){mode=m;pos=0;wins=0;setNext();
    if(m==='free'){msg.textContent='Tap the colors to make music!';locked=false;say('Play anything you like!')}
    if(m==='song'){msg.textContent='Tap the color with the dashed ring.';say('Tap the glowing color to play Twinkle Twinkle Little Star!');locked=false}
    if(m==='copy'){seq=[rint(0,7),rint(0,7)];say('Listen, then copy me!');g.later(playSeq,900)}}
  stage.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{stage.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===c));g.clear();pads.forEach(p=>p.classList.remove('lit'));setMode(c.dataset.m)}));
  function hit(i){const p=pads[i];if(locked)return;note(i);flash(i);
    if(mode==='free'){const c=center(p);burst(c.x,c.y-40,10,[N[i][3],'#fff'],5)}
    if(mode==='song'&&i===SONG[pos]){pos++;const c=center(p);burst(c.x,c.y-40,12,[N[i][3],'#fff'],5);
      if(pos===SONG.length){pos=0;locked=true;msg.textContent='You played the whole song!';g.later(()=>{cheer();party();addStar();say('Bravo! You played Twinkle Twinkle Little Star!')},500);g.later(()=>{locked=false;msg.textContent='Play it again!'},3000)}
      else if(pos===7||pos===14||pos===28)msg.textContent='Great! Keep going…';setNext()}
    if(mode==='copy'){if(i===seq[ui]){ui++;if(ui===seq.length){locked=true;wins++;msg.textContent=`Yes! ${seq.length} notes!`;tone(1047,.2,'sine',.1,.3);
        if(wins%3===0){g.later(()=>{cheer();addStar();party();say(`Wow! You remembered ${seq.length} notes!`)},400)}
        seq.push(rint(0,7));g.later(playSeq,1500)}}
      else{locked=true;buzz();shakeEl(msg);msg.textContent='Oops! Listen again.';say('Oops! Listen again.');g.later(playSeq,1500)}}}
  /* every finger can slide from key to key like a glissando */
  const padsEl=stage.querySelector('#pads'),onKey=new Map();
  padsEl.addEventListener('pointerdown',e=>{const p=e.target.closest('.pad');if(!p)return;e.preventDefault();try{p.releasePointerCapture(e.pointerId)}catch(_){}const i=+p.dataset.i;onKey.set(e.pointerId,i);hit(i)});
  padsEl.addEventListener('pointermove',e=>{if(!onKey.has(e.pointerId))return;const el=document.elementFromPoint(e.clientX,e.clientY),p=el&&el.closest('.pad');if(!p)return;const i=+p.dataset.i;if(i!==onKey.get(e.pointerId)){onKey.set(e.pointerId,i);hit(i)}});
  const lift=e=>onKey.delete(e.pointerId);addEventListener('pointerup',lift);addEventListener('pointercancel',lift);g.onEnd(()=>{removeEventListener('pointerup',lift);removeEventListener('pointercancel',lift)});
  const KEYS='asdfghjk';
  GAMES.music._debug={N,SONG,get seq(){return seq},get pos(){return pos},get mode(){return mode},get locked(){return locked}};
  g.key(e=>{if(e.repeat)return false;const k=e.key.toLowerCase();let i=KEYS.indexOf(k);if(i<0&&/^[1-8]$/.test(k))i=+k-1;if(i<0)return false;hit(i);return true});
  setMode('free');
}}
});
