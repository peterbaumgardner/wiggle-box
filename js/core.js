/* Wiggle Box shared code: helpers, audio, effects, drag/touch input, the lab shell and info tabs.
   Loaded first; every game file uses these. Plain script (no modules) so the app runs from any static host. */

const $=s=>document.querySelector(s);
const GAMES={};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const rint=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const inRect=(x,y,el,pad=0)=>{const r=el.getBoundingClientRect();return x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad};
const center=el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};

/* ---------- sound + voice ---------- */
let soundOn=true, actx=null;
try{ if(localStorage.getItem('wb-sound')==='off') soundOn=false }catch(e){}
function audio(){
  if(!actx){try{actx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}
  if(actx.state==='suspended') actx.resume();
  return actx;
}
document.addEventListener('pointerdown',audio,{capture:true});
document.addEventListener('contextmenu',e=>e.preventDefault());
let master=null,voices=0;const lastHit=new Map();
/* Master chain: gentle lowpass -> soft compressor -> quiet room reverb -> output. Keeps everything warm, never shrill. */
function out(){const a=audio();if(!a)return null;if(!master){
  const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5200;lp.Q.value=.5;
  const comp=a.createDynamicsCompressor();comp.threshold.value=-20;comp.knee.value=18;comp.ratio.value=4;comp.attack.value=.004;comp.release.value=.2;
  const vol=a.createGain();vol.gain.value=.55;
  const len=Math.floor(a.sampleRate*.9),ir=a.createBuffer(2,len,a.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2)}
  const rev=a.createConvolver();rev.buffer=ir;const wet=a.createGain();wet.gain.value=.14;
  lp.connect(comp);comp.connect(vol);comp.connect(rev);rev.connect(wet).connect(vol);vol.connect(a.destination);master=lp}return master}
/* Skip a sound if the same kind of sound just played (stops machine-gun clicks when many things collide at once). */
function tooSoon(key,ms){const now=performance.now(),l=lastHit.get(key)||0;if(now-l<ms)return true;lastHit.set(key,now);if(lastHit.size>300)lastHit.clear();return false}
function tone(f,d=.18,type='sine',vol=.2,when=0,f2){
  if(!soundOn||voices>24) return; const a=audio(); if(!a) return;
  if(when<.01&&tooSoon('t'+Math.round(Math.log2(Math.max(20,f))*12),35)) return;
  if(type==='square'||type==='sawtooth'){type='triangle';vol*=1.3}
  vol=Math.min(vol,.3);
  const t=a.currentTime+when, o=a.createOscillator(), g=a.createGain();
  o.type=type; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+d);
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.015); g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g).connect(out()); voices++; o.onended=()=>voices--; o.start(t); o.stop(t+d+.05);
}
let noiseBuf=null;
function noise(d=.2,f=1200,q=1,vol=.2,when=0,f2,type='bandpass'){
  if(!soundOn||voices>24) return; const a=audio(); if(!a) return;
  if(when<.01&&tooSoon('n'+Math.round(Math.log2(Math.max(20,f))*4),45)) return;
  vol=Math.min(vol,.3);
  if(!noiseBuf){noiseBuf=a.createBuffer(1,a.sampleRate,a.sampleRate);const ch=noiseBuf.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=Math.random()*2-1}
  const t=a.currentTime+when,s=a.createBufferSource(),bq=a.createBiquadFilter(),g=a.createGain();
  s.buffer=noiseBuf;s.loop=true;bq.type=type;bq.frequency.setValueAtTime(f,t);if(f2)bq.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+d);bq.Q.value=q;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(bq).connect(g).connect(out());voices++;s.onended=()=>voices--;s.start(t,Math.random()*.5);s.stop(t+d+.05);
}
const pop=(p=1)=>{tone(620*p,.1,'sine',.2,0,260*p);tone(1240*p,.05,'sine',.05)};
const cheer=()=>[523,659,784,1047].forEach((f,i)=>{tone(f,.35,'sine',.13,i*.085);tone(f*2,.2,'triangle',.03,i*.085)});
const buzz=()=>{if(tooSoon('buzz',300))return;tone(392,.16,'triangle',.11,0);tone(311,.26,'triangle',.11,.13)};
/* Spoken words are switched off for now. Flip VOICE to true to bring every game's narration back. */
const VOICE=false;
function say(t){
  if(!VOICE||!soundOn) return;
  try{const s=window.speechSynthesis;if(!s)return;s.cancel();const u=new SpeechSynthesisUtterance(t);u.rate=.88;u.pitch=1.25;s.speak(u)}catch(e){}
}
/* Long sounds (like Wave Lab's string) register here so the sound button and a hidden tab can silence them. */
const soundHooks=new Set();
/* A hidden tab or a sleeping tablet should not keep making noise; wake the audio again when the child comes back. */
document.addEventListener('visibilitychange',()=>{if(!actx)return;try{document.hidden?actx.suspend():(soundOn&&actx.resume())}catch(e){}});
const sndBtn=$('#snd'),sndBtn2=$('#snd2');
function paintSnd(){sndBtn.textContent=soundOn?'🔊 Sound on':'🔇 Sound off';sndBtn.setAttribute('aria-pressed',soundOn);sndBtn2.textContent=soundOn?'🔊':'🔇';sndBtn2.setAttribute('aria-pressed',soundOn);sndBtn2.setAttribute('aria-label',soundOn?'Sound on':'Sound off')}
paintSnd();
sndBtn2.addEventListener('click',()=>sndBtn.click());
sndBtn.addEventListener('click',()=>{soundOn=!soundOn;paintSnd();try{localStorage.setItem('wb-sound',soundOn?'on':'off')}catch(e){};if(soundOn){tone(660,.15,'triangle');say('Sound on!')}else{try{speechSynthesis.cancel()}catch(e){}}
  soundHooks.forEach(f=>{try{f(soundOn)}catch(e){}})});

/* ---------- stars ---------- */
let stars=0;
try{stars=Math.max(0,parseInt(localStorage.getItem('wb-stars')||'0',10)||0)}catch(e){}
function drawStars(b){document.querySelectorAll('.starn').forEach(n=>{n.textContent=stars;if(b){const p=n.parentElement;p.classList.remove('bump');void p.offsetWidth;p.classList.add('bump')}})}
function addStar(){stars++;try{localStorage.setItem('wb-stars',stars)}catch(e){};drawStars(true)}
drawStars();

/* ---------- confetti ---------- */
const fx=$('#fx'), fctx=fx.getContext('2d'); let parts=[], fxOn=false;
const CONF=['#FF4F7B','#FFC83D','#24C786','#3E67F0','#9A5BFF','#FF8A2B','#18BFD6'];
function sizeFx(){const d=devicePixelRatio||1;fx.width=innerWidth*d;fx.height=innerHeight*d;fctx.setTransform(d,0,0,d,0,0)}
sizeFx(); addEventListener('resize',sizeFx);
function burst(x,y,n=40,cols=CONF,spd=9){
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=2+Math.random()*spd;
    parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-3,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:pick(cols),s:6+Math.random()*8,l:1,shape:Math.random()<.5})}
  if(!fxOn){fxOn=true;requestAnimationFrame(fxLoop)}
}
function party(){for(let i=0;i<5;i++)setTimeout(()=>burst(innerWidth*(.1+.2*i),innerHeight*.45,45),i*90)}
function fxLoop(){
  fctx.clearRect(0,0,innerWidth,innerHeight);
  parts=parts.filter(p=>p.l>0);
  for(const p of parts){p.vy+=.35;p.vx*=.985;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.l-=.012;
    fctx.save();fctx.globalAlpha=Math.max(p.l,0);fctx.translate(p.x,p.y);fctx.rotate(p.r);fctx.fillStyle=p.c;
    if(p.shape){fctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2)}else{fctx.beginPath();fctx.arc(0,0,p.s/2.4,0,7);fctx.fill()}fctx.restore()}
  if(parts.length)requestAnimationFrame(fxLoop);else{fxOn=false;fctx.clearRect(0,0,innerWidth,innerHeight)}
}
function floaty(stage,x,y,html){const r=stage.getBoundingClientRect();const d=document.createElement('div');d.className='floaty';d.innerHTML=html;
  d.style.maxWidth=(r.width-16)+'px';d.style.top=Math.max(y-r.top,70)+'px';d.style.left='0px';stage.appendChild(d);
  const hw=d.offsetWidth/2;d.style.left=Math.min(Math.max(x-r.left,hw+8),r.width-hw-8)+'px';setTimeout(()=>d.remove(),1650)}
function shakeEl(el){el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake')}

/* ---------- drag helper (tap or drag) ---------- */
function draggable(el,o){
  el.addEventListener('pointerdown',e=>{
    if(o.enabled&&!o.enabled())return;if(el.classList.contains('dragging'))return;
    e.preventDefault();
    const sx=e.clientX,sy=e.clientY,id=e.pointerId;let moved=false,ended=false,lx=sx,ly=sy;
    try{el.setPointerCapture(id)}catch(_){}
    el.classList.remove('return');el.classList.add('dragging');o.onStart&&o.onStart();
    const mv=ev=>{if(ev.pointerId!==id)return;const dx=ev.clientX-sx,dy=ev.clientY-sy;lx=ev.clientX;ly=ev.clientY;if(Math.hypot(dx,dy)>12)moved=true;
      if(moved){el.style.transform=`translate(${dx}px,${dy}px) scale(1.15)`;o.onMove&&o.onMove(ev.clientX,ev.clientY)}};
    /* runs once per press: pointerup is followed by lostpointercapture, and both used to fire this (double taps, double drops) */
    const up=ev=>{if(ev.pointerId!==id||ended)return;ended=true;
      for(const t of ['pointermove','pointerup','pointercancel','lostpointercapture'])el.removeEventListener(t,t==='pointermove'?mv:up);
      el.classList.remove('dragging');o.onEnd&&o.onEnd();
      if(ev.type==='pointercancel'||ev.type==='lostpointercapture'&&!moved){el.style.transform='';if(moved)el.classList.add('return');return}  /* the system took the touch away: put it back, no tap */
      if(!moved){el.style.transform='';o.onTap&&o.onTap();return}
      const x=ev.type==='pointerup'?ev.clientX:lx,y=ev.type==='pointerup'?ev.clientY:ly;
      if(!(o.onDrop&&o.onDrop(x,y))){el.classList.add('return');el.style.transform=''}};
    el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);
  });
}


/* ---------- canvas + pointer helpers ---------- */
function fitCanvas(cv){const d=Math.min(devicePixelRatio||1,2),r=cv.getBoundingClientRect();cv.width=Math.max(1,Math.round(r.width*d));cv.height=Math.max(1,Math.round(r.height*d));
  const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);return{w:r.width,h:r.height,d}}
/* tracks every finger on an element: down/move/up with position + velocity (px per frame) */
function fingers(el,h){
  const map=new Map();
  const loc=e=>{const r=el.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
  el.addEventListener('pointerdown',e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId)}catch(_){}const[x,y]=loc(e);
    const f={id:e.pointerId,x,y,sx:x,sy:y,vx:0,vy:0,t:performance.now(),data:{}};map.set(e.pointerId,f);h.down&&h.down(f,e)});
  el.addEventListener('pointermove',e=>{const f=map.get(e.pointerId);if(!f)return;const[x,y]=loc(e),now=performance.now(),dt=Math.max(1,now-f.t)/16.7;
    f.vx=lerp(f.vx,(x-f.x)/dt,.5);f.vy=lerp(f.vy,(y-f.y)/dt,.5);f.x=x;f.y=y;f.t=now;h.move&&h.move(f,e)});
  const up=e=>{const f=map.get(e.pointerId);if(!f)return;map.delete(e.pointerId);if(performance.now()-f.t>80){f.vx=0;f.vy=0}h.up&&h.up(f,e)};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);
  if(h.wheel)el.addEventListener('wheel',e=>{e.preventDefault();const[x,y]=loc(e);h.wheel({x,y,dy:Math.sign(e.deltaY)*Math.min(3,Math.abs(e.deltaY)/40||1),shift:e.shiftKey},e)},{passive:false});
  return map;
}
/* two-finger pinch + twist: call each move; returns change since last call for the pair it is tracking */
function twoFinger(map){const fs=[...map.values()];if(fs.length<2){twoFinger.prev=null;return null}const[a,b]=fs,cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,d=Math.hypot(b.x-a.x,b.y-a.y)||1,an=Math.atan2(b.y-a.y,b.x-a.x);
  const key=a.id+':'+b.id,p=twoFinger.prev;twoFinger.prev={key,cx,cy,d,an};if(!p||p.key!==key)return{cx,cy,scale:1,rot:0,dx:0,dy:0,start:true};
  let rot=an-p.an;if(rot>Math.PI)rot-=2*Math.PI;if(rot<-Math.PI)rot+=2*Math.PI;return{cx,cy,scale:d/p.d,rot,dx:cx-p.cx,dy:cy-p.cy}}

/* ---------- math lab helpers ---------- */
const fmt=(v,d=1)=>{if(!isFinite(v))return '∞';const r=Math.round(v*10**d)/10**d;return (Object.is(r,-0)?0:r).toLocaleString('en-US',{maximumFractionDigits:d})};
const frac=(a,b)=>`<span class="fr"><span>${a}</span><span>${b}</span></span>`;
const V=(sym,col)=>`<i class="vr" style="--vc:${col}">${sym}</i>`;
/* a big touch slider: returns html; read with slVal(root,id) */
function slider(id,sym,min,max,step,val,col,unit=''){return `<label class="ctl" style="--vc:${col}"><span class="csym">${sym}</span>
  <input class="rng" type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" aria-label="${sym}"><output class="cval" id="${id}-o">${val}${unit}</output></label>`}
/* canvas on the left, live formula panel on the right (stacks on phones) */
function labShell(stage,{top='',panel='',label='Play area'}={}){
  stage.innerHTML=`<div class="lab">${top?`<div class="lab-top">${top}</div>`:''}<div class="lab-main"><div class="simarea"><canvas class="simcv" aria-label="${label}"></canvas><div class="simhint"></div></div></div>
    <div class="idock"><div class="itabs" role="tablist"></div><aside class="lab-panel">${panel}</aside></div></div>`;
  const hintEl=stage.querySelector('.simhint');
  const hint=makeHint(hintEl);
  infoDock(stage.querySelector('.idock'),stage.querySelector('.lab-panel'),innerHeight<560);
  const topEl=stage.querySelector('.lab-top');if(topEl)compactBar(topEl);
  return{cv:stage.querySelector('.simcv'),panel:stage.querySelector('.lab-panel'),top:stage.querySelector('.lab-top'),area:stage.querySelector('.simarea'),hint};
}
/* Toolbars always fit on one row. If a bar would wrap, it first folds each group of choices (modes, sizes, tools) into one
   "current choice ▾" menu button, smallest screens first. If it still doesn't fit, the less important buttons move into a "⋯" menu.
   The original buttons stay in the page, hidden, and get clicked for real, so every game's own code keeps working. */
function compactBar(bar){let busy=false;
  const key=b=>{for(const a of b.attributes)if(a.name.startsWith('data-')&&a.name!=='data-cg')return a.name;return null};
  const shown=x=>!x.classList.contains('cgh')&&!x.hidden&&x.style.display!=='none'&&getComputedStyle(x).display!=='none';
  const wraps=()=>{const kids=[...bar.querySelectorAll(':scope>*, :scope>.pbar>*')].filter(x=>!x.classList.contains('pbar')&&shown(x)&&x.offsetHeight);if(!kids.length)return false;
    const t0=Math.min(...kids.map(k=>k.getBoundingClientRect().top));return kids.some(k=>k.getBoundingClientRect().top>t0+12)};
  function menuBtn(before,html,items,cls=''){const m=document.createElement('button');m.className='pbtn small cgbtn '+cls;m.type='button';m.setAttribute('aria-haspopup','menu');m.innerHTML=html;before.before(m);
    m.addEventListener('click',()=>popMenu(m,`<div class="popgrid">${items.map((x,i)=>`<button class="popitem ${x.classList.contains('on')?'on':''}" data-cg="${i}">${x.innerHTML}</button>`).join('')}</div>`,it=>items[+it.dataset.cg].click()));return m}
  function refresh(){if(busy||!bar.isConnected)return;busy=true;mo.disconnect();
    bar.querySelectorAll('.cgbtn').forEach(x=>x.remove());bar.querySelectorAll('.cgh').forEach(x=>x.classList.remove('cgh'));
    if(wraps()){
      // 1) fold choice groups, biggest first
      const groups=[],seen=new Set();
      for(const b of bar.querySelectorAll('button')){const k=key(b);if(!k||seen.has(b)||!shown(b))continue;const grp=[...b.parentElement.children].filter(x=>x.tagName==='BUTTON'&&key(x)===k&&shown(x));grp.forEach(x=>seen.add(x));
        if(grp.length>=2&&grp.some(x=>x.classList.contains('on')))groups.push(grp)}
      groups.sort((a,b)=>b.length-a.length);
      for(const grp of groups){if(!wraps())break;const cur=grp.find(x=>x.classList.contains('on'));menuBtn(grp[0],`${cur.innerHTML}<span class="caret">▾</span>`,grp);grp.forEach(x=>x.classList.add('cgh'))}
      // 2) still too wide: tuck the less important buttons into a ⋯ menu, from the end
      if(wraps()){const cand=[...bar.querySelectorAll('button')].filter(x=>shown(x)&&!x.classList.contains('cgbtn')&&!x.classList.contains('go')&&!x.closest('.cgh')).reverse();
        const moved=[],end=document.createElement('i');end.className='cgbtn cgend';bar.appendChild(end);let more=null;
        for(const x of cand){if(!wraps())break;x.classList.add('cgh');moved.unshift(x);if(more)more.remove();more=menuBtn(end,'⋯<span class="sr"> More</span>',moved,'more')}}
    }
    mo.takeRecords();mo.observe(bar,OPT);busy=false}
  const OPT={childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','style']};
  const mo=new MutationObserver(()=>requestAnimationFrame(refresh));
  refresh();let rt=0;const onResize=()=>{clearTimeout(rt);rt=setTimeout(refresh,80)};addEventListener('resize',onResize);
  if(cur)cur.onEnd(()=>{removeEventListener('resize',onResize);clearTimeout(rt);mo.disconnect()});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(refresh);
}
/* Info tabs: every .fx card in a panel becomes a tab, and only one card shows at a time, so nothing ever scrolls.
   Tap a tab to read it, tap the open tab again to fold the bar away. Cards keep updating live behind the scenes.
   Anything inside .keep (like Robo's code blocks) always stays on screen. */
function infoDock(dock,body,startClosed){
  const tabs=dock.querySelector('.itabs');let active=null,sig='',busy=false;if(startClosed)dock.classList.add('closed');
  const vis=c=>{if(c.closest('[hidden]'))return false;for(let e=c.parentElement;e&&e!==body;e=e.parentElement)if(e.style.display==='none')return false;return true};
  const lab=c=>(c.querySelector('.tag')?.textContent||'Info').trim();
  const cards=()=>[...body.querySelectorAll('.fx')].filter(c=>!c.closest('.keep')&&vis(c));
  function sync(){if(busy)return;busy=true;
    const cs=cards(),L=cs.map(lab);if(!L.includes(active)){const h=cs.find(c=>c.classList.contains('hot'));active=h?lab(h):L[0]??null}
    if(L.join('|')!==sig){sig=L.join('|');tabs.innerHTML=`<button class="inav" data-d="-1" aria-label="Previous">◀</button>`+L.map((l,i)=>`<button class="itab" role="tab" data-i="${i}">${l}<span class="icount">${i+1}/${L.length}</span></button>`).join('')+`<button class="inav" data-d="1" aria-label="Next">▶</button>`;tabs.classList.toggle('one',L.length<2)}
    const closed=dock.classList.contains('closed');
    tabs.querySelectorAll('.itab').forEach((b,i)=>{const on=L[i]===active;b.classList.toggle('cur',on);b.classList.toggle('on',on&&!closed);b.setAttribute('aria-selected',on);b.classList.toggle('hot',!!cs[i]&&cs[i].classList.contains('hot'))});
    body.querySelectorAll('.fx').forEach(c=>c.classList.toggle('ion',cs.includes(c)&&lab(c)===active));
    dock.classList.toggle('empty',!L.length&&!body.querySelector('.keep'));
    mo.takeRecords();busy=false}
  const mo=new MutationObserver(sync);mo.observe(body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','style']});
  const mo2=new MutationObserver(sync);mo2.observe(dock,{attributes:true,attributeFilter:['class']});
  if(cur)cur.onEnd(()=>{mo.disconnect();mo2.disconnect()});
  tabs.addEventListener('click',e=>{const nv=e.target.closest('.inav');if(nv){const L=sig.split('|'),i=L.indexOf(active);active=L[(i+ +nv.dataset.d+L.length)%L.length];dock.classList.remove('closed');tone(620,.06,'sine',.1);sync();return}
    const b=e.target.closest('.itab');if(!b)return;const l=sig.split('|')[+b.dataset.i];
    if(l===active&&!dock.classList.contains('closed'))dock.classList.add('closed');else{active=l;dock.classList.remove('closed')}tone(620,.06,'sine',.1);sync()});
  sync();return{sync,open(){dock.classList.remove('closed')},close(){dock.classList.add('closed')}};
}
function chips(name,list,on){return list.map(([k,l])=>`<button class="opt ${k===on?'on':''}" data-${name}="${k}">${l}</button>`).join('')}
function bindChips(root,name,cb){root.addEventListener('click',e=>{const b=e.target.closest(`[data-${name}]`);if(!b)return;root.querySelectorAll(`[data-${name}]`).forEach(x=>x.classList.toggle('on',x===b));tone(560,.07,'triangle');cb(b.dataset[name],b)})}
const win=(stage,x,y,label)=>{const r=stage.getBoundingClientRect();burst(x??r.left+r.width/2,y??r.top+r.height/2,60);cheer();addStar();if(label)floaty(stage,(x??r.left+r.width/2),(y??r.top+r.height/2)-40,label)};
/* draws a coordinate grid; returns world->screen helpers */
function plane(ctx,W,H,xr,yr,opt={}){
  const pad=opt.pad??0,sx=(W-pad*2)/(xr[1]-xr[0]),sy=(H-pad*2)/(yr[1]-yr[0]),s=Math.max(2,Math.min(sx,sy)),cx=W/2-(xr[0]+xr[1])/2*s,cy=H/2+(yr[0]+yr[1])/2*s;
  const X=x=>cx+x*s,Y=y=>cy-y*s,IX=px=>(px-cx)/s,IY=py=>(cy-py)/s;
  const x0=Math.floor(IX(0)),x1=Math.ceil(IX(W)),y0=Math.floor(IY(H)),y1=Math.ceil(IY(0));
  if(opt.draw!==false){ctx.lineWidth=1;
    for(let x=x0;x<=x1;x++){ctx.strokeStyle=x%5?'rgba(62,103,240,.12)':'rgba(62,103,240,.28)';ctx.beginPath();ctx.moveTo(X(x),0);ctx.lineTo(X(x),H);ctx.stroke()}
    for(let y=y0;y<=y1;y++){ctx.strokeStyle=y%5?'rgba(62,103,240,.12)':'rgba(62,103,240,.28)';ctx.beginPath();ctx.moveTo(0,Y(y));ctx.lineTo(W,Y(y));ctx.stroke()}
    ctx.strokeStyle='#1D1842';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,Y(0));ctx.lineTo(W,Y(0));ctx.moveTo(X(0),0);ctx.lineTo(X(0),H);ctx.stroke();
    ctx.fillStyle='#1D1842';ctx.font='800 12px Nunito,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='top';
    const st=s<22?5:s<40?2:1;
    for(let x=Math.ceil(x0/st)*st;x<=x1;x+=st){if(x)ctx.fillText(x,X(x),Y(0)+5)}ctx.textAlign='right';ctx.textBaseline='middle';
    for(let y=Math.ceil(y0/st)*st;y<=y1;y+=st){if(y)ctx.fillText(y,X(0)-5,Y(y))}}
  return{X,Y,IX,IY,s};
}
function arrow(ctx,x1,y1,x2,y2,col,w=4){const a=Math.atan2(y2-y1,x2-x1),l=Math.hypot(x2-x1,y2-y1);if(l<2)return;const h=Math.min(14,l*.4);
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*h*.6,y2-Math.sin(a)*h*.6);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(a-.45)*h,y2-Math.sin(a-.45)*h);ctx.lineTo(x2-Math.cos(a+.45)*h,y2-Math.sin(a+.45)*h);ctx.closePath();ctx.fill()}
/* update a panel without rebuilding sliders the child might be dragging */
function patchPanel(el,html){const tmp=document.createElement('div');tmp.innerHTML=html;const o=[...el.querySelectorAll('.fx')],n=[...tmp.querySelectorAll('.fx')];
  if(!el.querySelector('input')||o.length!==n.length||el.querySelectorAll('input').length!==tmp.querySelectorAll('input').length){el.innerHTML=html;return}
  o.forEach((x,i)=>{if(x.innerHTML!==n[i].innerHTML)x.replaceWith(n[i])})}

/* Starts folded: an open card covered the bottom of the play area, right where sand settles, water pools and toys sink. */
function fxOverlay(area,openByDefault=false){area.insertAdjacentHTML('beforeend','<div class="fxo idock"><div class="itabs" role="tablist"></div><div class="fxo-b"></div></div>');
  const el=area.querySelector('.fxo'),body=el.querySelector('.fxo-b');let last='';
  const d=infoDock(el,body,!openByDefault);
  return{set(html){if(html!==last){last=html;body.innerHTML=html}},el,dock:d}}

/* keyboard finger: arrows move a cursor over a canvas, Space/Enter press it (sends real pointer events, so every game's touch code just works) */
function kbPointer(g,cv,opts={}){
  const host=cv.parentElement,cur=document.createElement('div');cur.className='kcur';cur.hidden=true;host.appendChild(cur);
  let x=.5,y=.5,down=false,vis=false,held=new Set(),raf=0;const ID=9999;
  const at=()=>{const r=cv.getBoundingClientRect();return{clientX:r.left+x*r.width,clientY:r.top+y*r.height,r}};
  const send=type=>{const p=at();cv.dispatchEvent(new PointerEvent(type,{pointerId:ID,pointerType:'mouse',isPrimary:true,bubbles:true,cancelable:true,clientX:p.clientX,clientY:p.clientY,buttons:type==='pointerup'?0:1}))};
  const place=()=>{cur.style.left=(x*100)+'%';cur.style.top=(y*100)+'%';cur.classList.toggle('down',down)};
  const show=()=>{if(!vis){vis=true;cur.hidden=false;place()}};
  const step=()=>{raf=0;let dx=0,dy=0;if(held.has('ArrowLeft'))dx--;if(held.has('ArrowRight'))dx++;if(held.has('ArrowUp'))dy--;if(held.has('ArrowDown'))dy++;
    if(!dx&&!dy)return;const r=cv.getBoundingClientRect(),sp=(held.has('Shift')?14:5);x=clamp(x+dx*sp/r.width,0,1);y=clamp(y+dy*sp/r.height,0,1);place();if(down)send('pointermove');raf=requestAnimationFrame(step)};
  const hide=()=>{if(vis&&!down){vis=false;cur.hidden=true}};
  cv.addEventListener('pointerdown',e=>{if(e.pointerId!==ID)hide()});
  g.keyFirst(e=>{if(opts.enabled&&!opts.enabled())return false;if(/^Arrow/.test(e.key)){if(opts.arrows===false&&!vis)return false;show();held.add(e.key);if(e.shiftKey)held.add('Shift');if(!raf)raf=requestAnimationFrame(step);return true}
    if((e.key===' '||e.key==='Enter')&&vis){if(!down&&!e.repeat){down=true;place();send('pointerdown')}return true}return false});
  g.keyUp(e=>{held.delete(e.key);if(!e.shiftKey)held.delete('Shift');if((e.key===' '||e.key==='Enter')&&down){down=false;send('pointerup');place()}});
  g.onEnd(()=>{cancelAnimationFrame(raf);if(down)send('pointerup')});
  return{show,hide,set(nx,ny){x=nx;y=ny;place()}};
}

/* ---------- pop-up menus: close on pick, on a tap anywhere else, or Esc ---------- */
let openPop=null;
function closePop(){if(openPop){const p=openPop;openPop=null;p.el.remove();p.anchor.classList.remove('popon');p.anchor.setAttribute('aria-expanded','false');document.removeEventListener('pointerdown',p.outside,true)}}
function popMenu(anchor,html,onPick){
  if(openPop&&openPop.anchor===anchor){closePop();return}closePop();
  const host=anchor.closest('.stage')||document.body,el=document.createElement('div');el.className='pop';el.setAttribute('role','menu');el.innerHTML=html;host.appendChild(el);
  const hr=host.getBoundingClientRect(),ar=anchor.getBoundingClientRect(),pw=el.offsetWidth,ph=el.offsetHeight;
  let left=clamp(ar.left+ar.width/2-pw/2-hr.left,8,hr.width-pw-8),top=ar.top-hr.top-ph-10;if(top<8)top=ar.bottom-hr.top+10;
  el.style.left=left+'px';el.style.top=Math.max(8,Math.min(top,hr.height-ph-8))+'px';
  anchor.classList.add('popon');anchor.setAttribute('aria-expanded','true');
  const outside=e=>{if(!el.contains(e.target)&&!anchor.contains(e.target))closePop()};
  document.addEventListener('pointerdown',outside,true);
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(onPick(b)!==false)closePop()});
  openPop={el,anchor,outside};tone(620,.06,'triangle');
  const first=el.querySelector('button.on')||el.querySelector('button');if(first)try{first.focus({preventScroll:true})}catch(e){}
}
/* hint bubble: shows briefly, gets out of the way as soon as you start playing, and never nags with the same words over and over */
function makeHint(el){const seen=new Map();let shownAt=0;
  const hide=()=>{el.classList.remove('show')};
  /* listen on the game's own root (not the shared #stage), so the listener goes away with the game */
  const root=el.closest('.stage')?.firstElementChild||el.parentElement||document;root.addEventListener('pointerdown',()=>{if(performance.now()-shownAt>700)hide()},true);
  const hint=(t,ms=3200,force)=>{const n=seen.get(t)||0;if(n>=2&&!force)return;seen.set(t,n+1);el.textContent=t;el.classList.add('show');shownAt=performance.now();clearTimeout(hint.t);hint.t=setTimeout(hide,ms)};
  hint.hide=hide;return hint}

