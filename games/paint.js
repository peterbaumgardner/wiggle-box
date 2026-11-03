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
    ${['⭐','❤️','🌸','🐾','🦋','🌈','🦄','🐱','🐶','🐸','🐝','🐞','🌻','🍓','🍄','☀️','🌙','🪐','🚀','🎈','👑','💎','🐙','🦖','🐟','❄️','⚡','🎵','🍕','🧁','🎃','🎁','🌺'].map((x,i)=>`<button class="tb st" data-st="${x}" aria-label="Stamp ${i+1}: ${x}" title="Stamp ${x}">${x}</button>`).join('')}
    <span class="sep"></span>
    <button class="tb mode" data-mode="spray" title="Spray paint" aria-label="Spray brush">💨</button>
    <button class="tb mode" data-mode="sparkle" title="Sparkles" aria-label="Sparkle brush">✨</button>
    <button class="tb mode" data-mode="bubble" title="Bubbles" aria-label="Bubble brush">🫧</button>
    <button class="tb mode" data-mode="neon" title="Neon marker" aria-label="Neon brush">💡</button>
    <button class="tb mode" data-mode="brush" title="Normal brush" aria-label="Normal brush">🖌️</button>
    <span class="sep"></span>
    <button class="tb" id="mir" aria-pressed="false" aria-label="Mirror magic">🪞</button>
    <button class="tb" id="undo" aria-label="Undo">↩️</button>
    <button class="tb" id="redo" aria-label="Redo">↪️</button>
    <button class="tb" id="save" aria-label="Save picture as PNG" title="Save picture">💾</button>
    <button class="tb paper" data-paper="#FFFFFF" aria-label="White paper" title="White paper">⬜</button>
    <button class="tb paper" data-paper="#FFF0F6" aria-label="Pink paper" title="Pink paper">🩷</button>
    <button class="tb paper" data-paper="#E8F7FF" aria-label="Blue paper" title="Blue paper">🩵</button>
    <button class="tb paper" data-paper="#FFF5D6" aria-label="Yellow paper" title="Yellow paper">💛</button>
    <button class="tb" id="clr" aria-label="New paper">🧽</button>
  </div></div>`;
  const cv=stage.querySelector('canvas'),cx=cv.getContext('2d');let W=0,H=0;
  let color='rainbow',size=18,stamp=null,mirror=false,hue=0,mode='brush',paper='#FFFFFF';const pts=new Map();
  function resize(){const d=Math.min(devicePixelRatio||1,2),r=cv.getBoundingClientRect();if(!r.width)return;
    const old=document.createElement('canvas');old.width=cv.width;old.height=cv.height;if(cv.width)old.getContext('2d').drawImage(cv,0,0);
    W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0);cx.fillStyle=paper;cx.fillRect(0,0,W,H);
    if(old.width)cx.drawImage(old,0,0,old.width,old.height,0,0,W,H);cx.lineCap=cx.lineJoin='round'}
  const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  const sel=(q,b)=>stage.querySelectorAll(q).forEach(x=>x.classList.toggle('on',x===b));
  stage.querySelectorAll('.sw').forEach((b,i)=>b.addEventListener('click',()=>{color=b.dataset.c;stamp=null;sel('.sw',b);sel('.st',null);tone(330+i*55,.15,'triangle');say(b.dataset.n||'Rainbow')}));
  stage.querySelectorAll('.sz').forEach(b=>b.addEventListener('click',()=>{size=+b.dataset.s;sel('.sz',b);tone(900-size*14,.1)}));
  stage.querySelectorAll('.st').forEach(b=>b.addEventListener('click',()=>{stamp=b.dataset.st;sel('.st',b);tone(880,.1,'triangle');say('Stamps!')}));
  const modeButtons=[...stage.querySelectorAll('.mode')];
  const chooseMode=next=>{mode=next;modeButtons.forEach(b=>b.classList.toggle('on',b.dataset.mode===next))};
  chooseMode('brush');
  modeButtons.forEach(b=>b.addEventListener('click',()=>{stamp=null;sel('.st',null);chooseMode(b.dataset.mode);tone(620,.1,'triangle')}));
  const mir=stage.querySelector('#mir');mir.addEventListener('click',()=>{mirror=!mirror;mir.classList.toggle('on',mirror);mir.setAttribute('aria-pressed',mirror);tone(mirror?990:500,.2,'triangle');say(mirror?'Mirror magic on!':'Mirror off')});
  /* Each simultaneous touch belongs to one undo transaction. The snapshot is taken
     before the first finger draws, so undo never removes only half a multi-touch gesture. */
  const hist=[],future=[],MAX_HISTORY=16;
  function snapshot(){const c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;c.getContext('2d').drawImage(cv,0,0);return c}
  function remember(){hist.push(snapshot());if(hist.length>MAX_HISTORY)hist.shift();future.length=0}
  function restore(c){cx.save();cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,cv.width,cv.height);cx.drawImage(c,0,0);cx.restore()}
  function undo(){if(pts.size)return;const im=hist.pop();if(!im){buzz();return}future.push(snapshot());restore(im);tone(500,.1,'triangle')}
  function redo(){if(pts.size)return;const im=future.pop();if(!im){buzz();return}hist.push(snapshot());restore(im);tone(650,.1,'triangle')}
  stage.querySelector('#undo').addEventListener('click',undo);
  stage.querySelector('#redo').addEventListener('click',redo);
  stage.querySelector('#clr').addEventListener('click',()=>{if(pts.size)return;remember();cx.fillStyle=paper;cx.fillRect(0,0,W,H);tone(1200,.3,'sine',.12,0,200);say('Fresh paper!')});
  stage.querySelectorAll('.paper').forEach(b=>b.addEventListener('click',()=>{if(pts.size)return;remember();const prev=paper;paper=b.dataset.paper;cx.save();cx.globalCompositeOperation='destination-over';cx.fillStyle=paper;cx.fillRect(0,0,W,H);cx.restore();
    /* Replace the original blank color without covering the drawing. */
    const im=cx.getImageData(0,0,cv.width,cv.height),data=im.data,old=[1,3,5].map((_,i)=>parseInt(prev.slice(1+i*2,3+i*2),16)),next=[1,3,5].map((_,i)=>parseInt(paper.slice(1+i*2,3+i*2),16));
    for(let i=0;i<data.length;i+=4){if(Math.abs(data[i]-old[0])<3&&Math.abs(data[i+1]-old[1])<3&&Math.abs(data[i+2]-old[2])<3){data[i]=next[0];data[i+1]=next[1];data[i+2]=next[2]}}
    cx.putImageData(im,0,0);tone(720,.12,'triangle')}));
  stage.querySelector('#save').addEventListener('click',()=>{const a=document.createElement('a');a.download='wiggle-box-art-'+Date.now()+'.png';a.href=cv.toDataURL('image/png');a.click();tone(920,.15,'triangle')});
  const mirrors=(x,y)=>{const coords=mirror?[[x,y],[W-x,y],[x,H-y],[W-x,H-y]]:[[x,y]];
    return coords.filter(([a,b],i)=>coords.findIndex(([c,d])=>Math.abs(a-c)<.5&&Math.abs(b-d)<.5)===i)};
  const pos=e=>{const r=cv.getBoundingClientRect();return[Math.max(0,Math.min(W,e.clientX-r.left)),Math.max(0,Math.min(H,e.clientY-r.top))]};
  const ink=()=>color==='rainbow'?`hsl(${hue},95%,52%)`:color;
  function stampAt(x,y){const s=size*2.6+20;for(const [a,b] of mirrors(x,y)){cx.save();cx.translate(a,b);cx.rotate((Math.random()-.5)*.5);cx.font=`${s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif`;cx.textAlign='center';cx.textBaseline='middle';cx.fillText(stamp,0,0);cx.restore()}
    tone(500+Math.random()*500,.08,'triangle',.12)}
  function dab(x,y){const c=ink();for(const [a,b] of mirrors(x,y)){
    cx.save();
    if(mode==='spray'){cx.fillStyle=c;for(let i=0;i<Math.max(8,size);i++){const angle=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*size*1.8;cx.beginPath();cx.arc(a+Math.cos(angle)*r,b+Math.sin(angle)*r,Math.max(.6,size/20),0,Math.PI*2);cx.fill()}}
    else if(mode==='sparkle'){cx.fillStyle=c;for(let i=0;i<5;i++){const xx=a+(Math.random()-.5)*size*2,yy=b+(Math.random()-.5)*size*2,rr=2+Math.random()*size*.28;cx.beginPath();for(let p=0;p<8;p++){const angle=p*Math.PI/4;const radius=p%2?rr*.28:rr;const px=xx+Math.cos(angle)*radius,py=yy+Math.sin(angle)*radius;if(p===0)cx.moveTo(px,py);else cx.lineTo(px,py)}cx.closePath();cx.fill()}}
    else if(mode==='bubble'){cx.strokeStyle=c;cx.lineWidth=Math.max(1,size/9);cx.beginPath();cx.arc(a,b,Math.max(3,size*(.25+Math.random()*.4)),0,Math.PI*2);cx.stroke()}
    else{cx.fillStyle=c;cx.beginPath();cx.arc(a,b,size/2,0,Math.PI*2);cx.fill()}
    cx.restore()}}
  function segment(x0,y0,x1,y1){hue=(hue+2)%360;
    if(mode==='spray'||mode==='sparkle'||mode==='bubble'){
      const distance=Math.hypot(x1-x0,y1-y0),step=Math.max(3,size*.45),n=Math.min(200,Math.ceil(distance/step));
      for(let i=1;i<=n;i++)dab(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n);return}
    const a=mirrors(x0,y0),b=mirrors(x1,y1);
    cx.save();cx.lineCap=cx.lineJoin='round';cx.lineWidth=size;cx.strokeStyle=ink();
    if(mode==='neon'){cx.shadowColor=cx.strokeStyle;cx.shadowBlur=size*1.5;cx.lineWidth=Math.max(2,size*.65)}
    for(let i=0;i<a.length;i++){cx.beginPath();cx.moveTo(...a[i]);cx.lineTo(...b[i]);cx.stroke()}
    cx.restore()}
  function movePoint(e){const p=pts.get(e.pointerId);if(!p)return;
    const events=typeof e.getCoalescedEvents==='function'?e.getCoalescedEvents():[];
    for(const sample of events.length?events:[e]){
      const [x,y]=pos(sample);
      if(p.stamp){const dist=Math.hypot(x-p.x,y-p.y),step=size*2.4+20;if(dist>=step){const n=Math.min(100,Math.floor(dist/step));for(let j=1;j<=n;j++)stampAt(p.x+(x-p.x)*j/n,p.y+(y-p.y)*j/n);p.x=x;p.y=y}}
      else{segment(p.x,p.y,x,y);p.x=x;p.y=y}
    }}
  cv.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(err){console.warn('Pointer capture unavailable',err)}
    if(!pts.size)remember();
    const [x,y]=pos(e);pts.set(e.pointerId,{x,y,stamp:!!stamp});
    if(stamp)stampAt(x,y);else dab(x,y);
  });
  cv.addEventListener('pointermove',e=>{if(pts.has(e.pointerId)){e.preventDefault();movePoint(e)}});
  const end=e=>{if(pts.has(e.pointerId)&&e.type==='pointerup')movePoint(e);pts.delete(e.pointerId)};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);cv.addEventListener('lostpointercapture',end);
  g.onEnd(()=>pts.clear());
  const sws=[...stage.querySelectorAll('.sw')],szs=[...stage.querySelectorAll('.sz')];
  g.key(e=>{const k=e.key.toLowerCase();if(/^[1-9]$/.test(k)&&sws[+k-1]){sws[+k-1].click();return true}
    if((e.ctrlKey||e.metaKey)&&k==='z'){if(e.shiftKey)redo();else undo();return true}if(k==='z'||k==='backspace'||k==='u'){undo();return true}if(k==='y'){redo();return true}if(k==='m'){mir.click();return true}if(k==='e'||k==='0'){stage.querySelector('.sw.eraser').click();return true}
    if(k==='['||k==='-'){const i=szs.findIndex(b=>b.classList.contains('on'));szs[Math.max(0,i-1)].click();return true}
    if(k===']'||k==='='||k==='+'){const i=szs.findIndex(b=>b.classList.contains('on'));szs[Math.min(2,i+1)].click();return true}return false});
}}
});
