/* ---------------- Magic Paint ---------------- */
Object.assign(GAMES,{
paint:{order:3,title:'Magic Paint',icon:'🎨',c:'var(--tang)',age:'2+',blurb:'Rainbow brushes, stamps and mirror magic',
init(stage,g){
  const COLS=[['#FF4F5E','Red'],['#FF8A2B','Orange'],['#FFC83D','Yellow'],['#24C786','Green'],['#3D7BFF','Blue'],['#9A5BFF','Purple'],['#FF7FC8','Pink'],['#1D1842','Black']];
  stage.innerHTML=`<div class="paint"><canvas aria-label="Drawing paper"></canvas><div class="tools">
    <button class="sw rainbow on" data-c="rainbow" aria-label="Rainbow"></button>
    ${COLS.map(c=>`<button class="sw" style="--c:${c[0]}" data-c="${c[0]}" data-n="${c[1]}" aria-label="${c[1]}"></button>`).join('')}
    <button class="sw eraser" style="--c:#FFFFFF" data-c="#FFFFFF" data-n="Eraser" aria-label="Eraser">🧽</button>
    <span class="sep"></span>
    <button class="tb sz" data-s="8" aria-label="Thin brush"><span class="dot" style="width:10px;height:10px"></span></button>
    <button class="tb sz on" data-s="18" aria-label="Medium brush"><span class="dot" style="width:18px;height:18px"></span></button>
    <button class="tb sz" data-s="34" aria-label="Fat brush"><span class="dot" style="width:28px;height:28px"></span></button>
    <span class="sep"></span>
    <button class="tb st" data-st="⭐" aria-label="Star stamps">⭐</button>
    <button class="tb st" data-st="❤️" aria-label="Heart stamps">❤️</button>
    <button class="tb st" data-st="🌸" aria-label="Flower stamps">🌸</button>
    <button class="tb st" data-st="🐾" aria-label="Paw stamps">🐾</button>
    <span class="sep"></span>
    <button class="tb" id="mir" aria-pressed="false" aria-label="Mirror magic">🪞</button>
    <button class="tb" id="undo" aria-label="Undo">↩️</button>
    <button class="tb" id="clr" aria-label="New paper">🧽</button>
  </div></div>`;
  const cv=stage.querySelector('canvas'),cx=cv.getContext('2d');let W=0,H=0;
  let color='rainbow',size=18,stamp=null,mirror=false,hue=0;const pts=new Map();
  function resize(){const d=Math.min(devicePixelRatio||1,2),r=cv.getBoundingClientRect();if(!r.width)return;
    const old=document.createElement('canvas');old.width=cv.width;old.height=cv.height;if(cv.width)old.getContext('2d').drawImage(cv,0,0);
    W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0);cx.fillStyle='#fff';cx.fillRect(0,0,W,H);
    if(old.width)cx.drawImage(old,0,0,old.width/d,old.height/d);cx.lineCap=cx.lineJoin='round'}
  const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  const sel=(q,b)=>stage.querySelectorAll(q).forEach(x=>x.classList.toggle('on',x===b));
  stage.querySelectorAll('.sw').forEach((b,i)=>b.addEventListener('click',()=>{color=b.dataset.c;stamp=null;sel('.sw',b);sel('.st',null);tone(330+i*55,.15,'triangle');say(b.dataset.n||'Rainbow')}));
  stage.querySelectorAll('.sz').forEach(b=>b.addEventListener('click',()=>{size=+b.dataset.s;sel('.sz',b);tone(900-size*14,.1)}));
  stage.querySelectorAll('.st').forEach(b=>b.addEventListener('click',()=>{stamp=b.dataset.st;sel('.st',b);sel('.sw',null);tone(880,.1,'triangle');say('Stamps!')}));
  const mir=stage.querySelector('#mir');mir.addEventListener('click',()=>{mirror=!mirror;mir.classList.toggle('on',mirror);mir.setAttribute('aria-pressed',mirror);tone(mirror?990:500,.2,'triangle');say(mirror?'Mirror magic on!':'Mirror off')});
  /* undo keeps the last 12 pictures, taken at the start of every stroke */
  const hist=[];function snap(){const c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;c.getContext('2d').drawImage(cv,0,0);hist.push(c);if(hist.length>12)hist.shift()}
  function undo(){const im=hist.pop();if(!im){buzz();return}cx.save();cx.setTransform(1,0,0,1,0,0);cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(im,0,0);cx.restore();tone(500,.1,'triangle');tone(380,.12,'triangle',.15,.06)}
  stage.querySelector('#undo').addEventListener('click',undo);
  stage.querySelector('#clr').addEventListener('click',()=>{snap();tone(1200,.3,'sine',.12,0,200);cx.fillStyle='#fff';cx.fillRect(0,0,W,H);say('Fresh paper!')});
  const mirrors=(x,y)=>mirror?[[x,y],[W-x,y],[x,H-y],[W-x,H-y]]:[[x,y]];
  const pos=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
  function stampAt(x,y){const s=size*2.6+20;for(const [a,b] of mirrors(x,y)){cx.save();cx.translate(a,b);cx.rotate((Math.random()-.5)*.8);cx.font=`${s}px serif`;cx.textAlign='center';cx.textBaseline='middle';cx.fillText(stamp,0,0);cx.restore()}
    tone(500+Math.random()*500,.12,'triangle',.15)}
  cv.addEventListener('pointerdown',e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}const [x,y]=pos(e);if(!pts.size)snap();
    if(stamp){stampAt(x,y);pts.set(e.pointerId,{x,y,stamp:true});return}
    pts.set(e.pointerId,{x,y});tone(300+Math.random()*300,.12,'sine',.1);
    for(const [a,b] of mirrors(x,y)){cx.fillStyle=color==='rainbow'?`hsl(${hue},90%,55%)`:color;cx.beginPath();cx.arc(a,b,size/2,0,7);cx.fill()}});
  cv.addEventListener('pointermove',e=>{const p=pts.get(e.pointerId);if(!p)return;const [x,y]=pos(e);
    if(p.stamp){if(Math.hypot(x-p.x,y-p.y)>size*2.4+20){stampAt(x,y);p.x=x;p.y=y}return}
    hue=(hue+3)%360;cx.strokeStyle=color==='rainbow'?`hsl(${hue},90%,55%)`:color;cx.lineWidth=size;
    const A=mirrors(p.x,p.y),B=mirrors(x,y);for(let i=0;i<A.length;i++){cx.beginPath();cx.moveTo(...A[i]);cx.lineTo(...B[i]);cx.stroke()}p.x=x;p.y=y});
  const end=e=>pts.delete(e.pointerId);cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);cv.addEventListener('lostpointercapture',end);
  const sws=[...stage.querySelectorAll('.sw')],szs=[...stage.querySelectorAll('.sz')];
  g.key(e=>{const k=e.key.toLowerCase();if(/^[1-9]$/.test(k)&&sws[+k-1]){sws[+k-1].click();return true}
    if(k==='z'||k==='backspace'||k==='u'){undo();return true}if(k==='m'){mir.click();return true}if(k==='e'||k==='0'){stage.querySelector('.sw.eraser').click();return true}
    if(k==='['||k==='-'){const i=szs.findIndex(b=>b.classList.contains('on'));szs[Math.max(0,i-1)].click();return true}
    if(k===']'||k==='='||k==='+'){const i=szs.findIndex(b=>b.classList.contains('on'));szs[Math.min(2,i+1)].click();return true}return false});
}}
});
