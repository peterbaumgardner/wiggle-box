/* Touch input: drag-or-tap, every-finger tracking, pinch/twist, canvas sizing, and the keyboard finger.
   Every game must work with several children touching at once: track fingers by pointerId (fingers() does). */
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
