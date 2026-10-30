/* ---------------- Bubble Pop ---------------- */
Object.assign(GAMES,{
bubbles:{order:1,title:'Bubble Pop',icon:'🫧',c:'var(--aqua)',age:'2+',blurb:'Pop letters, numbers and animals',
init(stage,g){
  stage.innerHTML=`<div class="chips float"><button class="chip on" data-m="abc">ABC</button><button class="chip" data-m="num">123</button><button class="chip" data-m="ani">Animals</button></div>`;
  let mode='abc',li=0,ni=1,pops=0,last=performance.now(),spawnIn=0;const bubs=[];
  stage.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.m;stage.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',c===b));li=0;ni=1;
    bubs.splice(0).forEach(x=>x.el.remove());say(mode==='abc'?'Letters!':mode==='num'?'Numbers!':'Animals!')}));
  function spawn(){
    const W=stage.clientWidth,H=stage.clientHeight,s=Math.max(84,Math.min(W*.14,150))*(0.85+Math.random()*.3);
    let label,speak,show;
    if(mode==='abc'){const L=LETTERS[li++%26];label=L[0];speak=`${L[0]}. ${L[0]} is for ${L[1]}!`;show=`${L[0]} is for ${L[2]} ${L[1]}`}
    else if(mode==='num'){const n=ni;ni=ni%10+1;label=n;speak=NUMW[n];show=`${n} ${'⭐'.repeat(n)}`}
    else{const A=pick(ANIMALS);label=A[0];speak=A[1];show=`${A[0]} ${A[1]}`}
    const el=document.createElement('button');el.className='bubble';el.setAttribute('aria-label',String(speak));
    el.style.cssText=`width:${s}px;height:${s}px;--s:${s}px;--h:${rint(0,360)}`;el.innerHTML=`<span>${label}</span>`;
    const b={el,s,x:Math.random()*(W-s),y:H+10,vy:45+Math.random()*45,ph:Math.random()*6,amp:10+Math.random()*20,speak,show,hue:el.style.getPropertyValue('--h')};
    el.addEventListener('pointerdown',e=>{e.preventDefault();popB(b,e.clientX,e.clientY)});
    stage.appendChild(el);bubs.push(b);
  }
  function popB(b,x,y){
    const i=bubs.indexOf(b);if(i<0)return;bubs.splice(i,1);b.el.remove();
    pop(.8+Math.random()*.6);burst(x,y,26,[`hsl(${b.hue},90%,60%)`,'#fff','#FFC83D'],7);say(b.speak);floaty(stage,x,y,b.show);
    if(++pops%10===0){g.later(()=>{cheer();addStar();party();say('Ten pops! You got a star!')},700)}
  }
  function frame(t){
    const dt=Math.min((t-last)/1000,.05);last=t;spawnIn-=dt;
    if(spawnIn<=0&&bubs.length<8){spawn();spawnIn=.9+Math.random()*.6}
    for(const b of bubs.slice()){b.y-=b.vy*dt;b.ph+=dt*1.6;const x=b.x+Math.sin(b.ph)*b.amp;b.el.style.transform=`translate(${x}px,${b.y}px)`;
      if(b.y<-b.s-10){bubs.splice(bubs.indexOf(b),1);b.el.remove()}}
    g.raf(frame);
  }
  for(let k=0;k<3;k++){spawn();const b=bubs[bubs.length-1];b.y=stage.clientHeight*(.35+k*.2)}
  GAMES.bubbles._debug={get bubs(){return bubs},get pops(){return pops}};
  g.raf(frame);
  /* keyboard: type the letter or number you see, or Space to pop the nearest bubble */
  g.key(e=>{const k=e.key.toLowerCase();let b=null;
    if(k===' '||k==='enter')b=bubs.slice().sort((p,q)=>q.y-p.y)[0];
    else if(/^[a-z0-9]$/.test(k))b=bubs.find(x=>String(x.el.textContent).toLowerCase()===k||(k==='0'&&x.el.textContent==='10'));
    if(!b)return false;const r=b.el.getBoundingClientRect();popB(b,r.left+r.width/2,r.top+r.height/2);return true});
}}
});
