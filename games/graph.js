/* ============================================================
   GRAPH RIDER — shape a function so its track hits every star
   ============================================================ */
Object.assign(GAMES,{graph:{title:'Graph Rider',icon:'🎢',c:'var(--aqua)',age:'8+',section:'math',order:1,blurb:'Bend the track with equations. Ride through the stars.',
init(stage,g){
  const C={m:'#E8384F',b:'#2F6FE0',a:'#E8384F',h:'#1FA463',k:'#2F6FE0',A:'#E8384F',B:'#9A5BFF',D:'#2F6FE0',r:'#E8384F'};
  const FAM={
    line:{n:'Line',p:{m:[-4,4,.25,1],b:[-6,6,.5,0]},f:(q,x)=>q.m*x+q.b,d:(q,x)=>q.m,
      eq:q=>`${V('y','#1D1842')} = ${coef(q.m,'m')}${V('x','#1D1842')}${term(q.b,'b')}`,gen:()=>({m:pick([-2,-1.5,-1,-.5,.5,1,1.5,2,3]),b:pick([-4,-3,-2,-1,1,2,3,4])})},
    para:{n:'Parabola',p:{a:[-2,2,.25,1],h:[-6,6,.5,0],k:[-6,6,.5,0]},f:(q,x)=>q.a*(x-q.h)**2+q.k,d:(q,x)=>2*q.a*(x-q.h),
      eq:q=>`${V('y','#1D1842')} = ${coef(q.a,'a')}(${V('x','#1D1842')}${term(-q.h,'h')})²${term(q.k,'k')}`,gen:()=>({a:pick([-1,-.5,-.25,.25,.5,1]),h:pick([-4,-3,-2,-1,0,1,2,3,4]),k:pick([-4,-3,-2,2,3,4])})},
    wave:{n:'Wave',p:{A:[0,6,.5,2],B:[.25,3,.25,1],D:[-5,5,.5,0]},f:(q,x)=>q.A*Math.sin(q.B*x)+q.D,d:(q,x)=>q.A*q.B*Math.cos(q.B*x),
      eq:q=>`${V('y','#1D1842')} = ${num(q.A,'A')}·sin(${num(q.B,'B')}${V('x','#1D1842')})${term(q.D,'D')}`,gen:()=>({A:pick([1,2,3,4]),B:pick([.5,.75,1,1.5]),D:pick([-2,-1,0,1,2])})},
    vee:{n:'V shape',p:{a:[-3,3,.25,1],h:[-6,6,.5,0],k:[-6,6,.5,0]},f:(q,x)=>q.a*Math.abs(x-q.h)+q.k,d:(q,x)=>q.a*Math.sign(x-q.h),
      eq:q=>`${V('y','#1D1842')} = ${coef(q.a,'a')}|${V('x','#1D1842')}${term(-q.h,'h')}|${term(q.k,'k')}`,gen:()=>({a:pick([-2,-1,-.5,.5,1,2]),h:pick([-3,-2,-1,1,2,3]),k:pick([-3,-2,-1,1,2,3])})},
    grow:{n:'Growth',p:{a:[.25,3,.25,1],r:[.5,2,.1,1.5],k:[-6,6,.5,0]},f:(q,x)=>q.a*q.r**x+q.k,d:(q,x)=>q.a*q.r**x*Math.log(q.r),
      eq:q=>`${V('y','#1D1842')} = ${num(q.a,'a')}·${num(q.r,'r')}<sup>${V('x','#1D1842')}</sup>${term(q.k,'k')}`,gen:()=>({a:pick([.5,1,2]),r:pick([.5,.7,1.3,1.5,2]),k:pick([-4,-3,-2,0])})}};
  function num(v,p){return `<span class="num" style="color:${C[p]}">${fmt(v,2)}</span>`}
  function coef(v,p){if(v===1)return '';if(v===-1)return '<span class="num" style="color:'+C[p]+'">−</span>';return num(v,p)}
  function term(v,p){if(v===0)return '';return ` ${v<0?'−':'+'} <span class="num" style="color:${C[p]}">${fmt(Math.abs(v),2)}</span>`}
  let fam='line',q={},target={},stars=[],lvl=1,ride=null,area=0,celebr=0,rid=0;
  const ui=labShell(stage,{label:'Graph',top:`${chips('fam',Object.entries(FAM).map(([k,f])=>[k,f.n]),fam)}<span class="sep"></span><span class="lvl" id="lv">Level 1</span>
      <button class="pbtn go small" id="ride">▶ Ride</button><button class="pbtn small" id="new">🎲 New track</button>`,
    panel:`<div class="fx big hot"><span class="tag">Your track</span><div class="row" id="eq"></div></div>
      <div class="fx"><span class="tag">Stars on the track</span><div class="row" id="hits"></div></div>
      <div class="fx"><span class="tag">Steepness right here</span><div class="row" id="slope"><span class="num">—</span></div></div>
      <div class="fx"><span class="tag">Area under the ride</span><div class="row" id="area"><span class="num">—</span></div></div>
      `});
  const {cv,panel}=ui,ctx=cv.getContext('2d');let dims=fitCanvas(cv),P;
  function setFam(k){fam=k;const F=FAM[k];q={};for(const [n,[,, ,v]] of Object.entries(F.p))q[n]=v;
    newLevel();ui.hint(TIPG[k],3500,true)}
  function newLevel(){const F=FAM[fam];let tries=0;
    do{target=F.gen();const xs=shuffle([-8,-6,-4,-3,-2,0,2,3,4,6,8]).slice(0,fam==='line'?3:4).sort((a,b)=>a-b);stars=xs.map(x=>({x,y:F.f(target,x),got:false})).filter(s=>Math.abs(s.y)<6.6)}
    while(stars.length<(fam==='line'?2:3)&&++tries<200);
    ride=null;area=0;rid++;stage.querySelector('#lv').textContent=`Level ${lvl}`;sync()}
  function sync(){const F=FAM[fam];
    panel.querySelector('#eq').innerHTML=F.eq(q);
    const hit=stars.filter(s=>Math.abs(F.f(q,s.x)-s.y)<.26).length;panel.querySelector('#hits').innerHTML=`<span class="num">${hit} / ${stars.length}</span>${hit===stars.length?' ✅':''}`}
  bindChips(ui.top,'fam',k=>setFam(k));
  stage.querySelector('#ride').addEventListener('click',()=>{ride={x:-10.5,trail:[],fell:false};area=0;stars.forEach(s=>s.got=false);noise(.6,800,.6,.08,0,2500)});
  stage.querySelector('#new').addEventListener('click',()=>{newLevel();tone(500,.1,'triangle')});
  // drag the track around
  /* one finger slides the track; two fingers twist (slope) or pinch (steepness) */
  const MAIN={line:'m',para:'a',wave:'A',vee:'a',grow:'a'};
  const snapP=(k,v)=>{const F=FAM[fam],st=F.p[k][2];return clamp(Math.round(v/st)*st,F.p[k][0],F.p[k][1])};
  let gAcc=0,gAng=0;
  /* The pink handle on the track changes its shape with one finger: drag it up or down (and sideways for waves). Dragging anywhere else slides the whole track. */
  const TIPG={line:'Drag the track to slide it. Drag the pink dot to tilt it.',para:'Drag the track to move it. Drag the pink dot to make it wider or narrower.',vee:'Drag the track to move it. Drag the pink dot to make it steeper.',wave:'Drag the pink dot: up and down makes taller waves, sideways makes them wider.',grow:'Two pink dots: the one on the y-axis sets the start (a), the other one sets how fast it grows (r).'};
  function handle(){const F=FAM[fam];let x=fam==='line'?3:fam==='wave'?Math.PI/(2*q.B):fam==='grow'?2:q.h+2;x=clamp(x,-9.5,9.5);return{x,y:F.f(q,x),role:'main'}}
  /* Growth needs two dots: a (where it starts, at x = 0) and r (how fast it grows). Before, a could only be set by
     pinching or the keyboard, so many Growth tracks were impossible on a touchscreen. */
  function handles(){const h=[handle()];if(fam==='grow')h.push({x:0,y:FAM.grow.f(q,0),role:'a'});return h}
  function fromHandle(wx,wy,role){if(role==='a'){q.a=snapP('a',wy-q.k);return}const F=FAM[fam],nz=(k,v,st)=>{const r=snapP(k,v);return r===0?(v<0?-st:st):r};
    if(fam==='line')q.m=snapP('m',(wy-q.b)/3);
    else if(fam==='para')q.a=nz('a',(wy-q.k)/4,.25);
    else if(fam==='vee')q.a=nz('a',(wy-q.k)/2,.25);
    else if(fam==='wave'){q.A=snapP('A',wy-q.D);q.B=snapP('B',Math.PI/(2*Math.max(.5,wx)))}
    else if(fam==='grow'){const v=(wy-q.k)/q.a;q.r=snapP('r',Math.sqrt(Math.max(.25,v)))}}
  const fm=fingers(cv,{down(f){f.data.q={...q};f.data.x=f.x;f.data.y=f.y;gAcc=0;const h=P&&handles().find(h=>Math.hypot(f.x-P.X(h.x),f.y-P.Y(h.y))<34);f.data.h=h?h.role:null;if(f.data.h)tone(700,.05,'sine',.08)},
    move(f){const tf=twoFinger(fm);if(tf){const F=FAM[fam],k=MAIN[fam];if(tf.start){gAng=Math.atan(q.m||0);return}
        if(fam==='line'){/* twist: turn the line, slope = tan(angle) */gAng=clamp(gAng-tf.rot,-1.33,1.33);const nm=snapP('m',Math.tan(gAng));if(nm===q.m)return;q.m=nm}
        else{gAcc+=Math.log(tf.scale);if(Math.abs(gAcc)>.12){const st=F.p[k][2],dir=Math.sign(gAcc)*(k==='a'&&q.a<0?-1:1);q[k]=snapP(k,q[k]+dir*st);if(q[k]===0)q[k]=dir*st;gAcc=0}}
        ride=null;sync();tone(300+Math.abs(q[k]||0)*60,.03,'sine',.04);return}
      if(fm.size>1||!f.data.q)return;if(f.data.h){const before=JSON.stringify(q);fromHandle((f.x-P.X(0))/P.s,-(f.y-P.Y(0))/P.s,f.data.h);if(JSON.stringify(q)!==before){ride=null;sync();tone(400+(q[MAIN[fam]]||0)*50,.03,'sine',.05)}return}
      const F=FAM[fam],dx=(f.x-f.data.x)/P.s,dy=-(f.y-f.data.y)/P.s,o=f.data.q;
      if('h' in q)q.h=snapP('h',o.h+dx);if('k' in q)q.k=snapP('k',o.k+dy);if('b' in q)q.b=snapP('b',o.b+dy);if('D' in q)q.D=snapP('D',o.D+dy);ride=null;sync()},
    up(f){for(const o of fm.values()){o.data.q={...q};o.data.x=o.x;o.data.y=o.y}},
    wheel(w){const k=MAIN[fam],st=FAM[fam].p[k][2];q[k]=snapP(k,q[k]-w.dy*st);if(q[k]===0)q[k]=-Math.sign(w.dy)*st;ride=null;sync()}});
  function draw(){
    const W=dims.w,H=dims.h;ctx.setTransform(dims.d,0,0,dims.d,0,0);ctx.fillStyle='#FDFDFF';ctx.fillRect(0,0,W,H);
    P=plane(ctx,W,H,[-10.5,10.5],[-7,7],{pad:8});const F=FAM[fam];
    // area under the ridden part
    if(ride){ctx.globalAlpha=.25;for(let x=-10.5;x<Math.min(ride.x,10.5);x+=.05){const y=F.f(q,x);if(!isFinite(y))continue;ctx.fillStyle=y>=0?'#3E67F0':'#FF4F7B';ctx.fillRect(P.X(x),Math.min(P.Y(0),P.Y(y)),P.s*.05+1,Math.abs(P.Y(y)-P.Y(0)))}ctx.globalAlpha=1}
    // the track
    ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();let pen=false;for(let px=0;px<=W;px+=2){const x=P.IX(px),y=F.f(q,x);if(!isFinite(y)||Math.abs(y)>40){pen=false;continue}pen?ctx.lineTo(px,P.Y(y)):ctx.moveTo(px,P.Y(y));pen=true}
    ctx.strokeStyle='#1D1842';ctx.lineWidth=10;ctx.stroke();ctx.strokeStyle='#FFC83D';ctx.lineWidth=5;ctx.stroke();
    if(!ride)for(const h of handles()){const hx=P.X(h.x),hy=P.Y(h.y);if(hy>-20&&hy<H+20){const pu=1+Math.sin(performance.now()/260)*.08;ctx.fillStyle='#FF4F7B';ctx.strokeStyle='#1D1842';ctx.lineWidth=4;ctx.beginPath();ctx.arc(hx,hy,15*pu,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.font='900 16px Nunito';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(fam==='wave'?'✥':h.role==='a'?'a':'↕',hx,hy+1);ctx.textBaseline='alphabetic'}}
    // stars
    for(const s of stars){const on=Math.abs(F.f(q,s.x)-s.y)<.26,x=P.X(s.x),y=P.Y(s.y),R=13+(s.got?4:0);
      ctx.save();ctx.translate(x,y);ctx.rotate(performance.now()/900);ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?R*.45:R,a=-Math.PI/2+i*Math.PI/5;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();
      ctx.fillStyle=s.got?'#FFC83D':on?'#7BE07B':'#fff';ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.fill();ctx.stroke();ctx.restore();
      ctx.fillStyle='#1D1842';ctx.font='900 12px Nunito,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(`(${fmt(s.x)}, ${fmt(s.y,2)})`,x,y-17)}
    // rider
    if(ride){const x=ride.x,y=F.f(q,x),sl=F.d(q,x),px=P.X(x),py=P.Y(y);
      if(isFinite(y)&&Math.abs(y)<7.4){
        // tangent
        ctx.strokeStyle='rgba(154,91,255,.85)';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(P.X(x-2.5),P.Y(y-2.5*sl));ctx.lineTo(P.X(x+2.5),P.Y(y+2.5*sl));ctx.stroke();ctx.setLineDash([]);
        const an=Math.atan2(-sl,1);ctx.save();ctx.translate(px,py);ctx.rotate(an);ctx.fillStyle='#FF4F7B';ctx.strokeStyle='#1D1842';ctx.lineWidth=3;
        ctx.beginPath();ctx.roundRect(-16,-24,32,18,6);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-34,11,0,7);ctx.fill();ctx.stroke();
        ctx.fillStyle='#1D1842';ctx.beginPath();ctx.arc(-4,-35,2.2,0,7);ctx.arc(4,-35,2.2,0,7);ctx.fill();ctx.restore();
        panel.querySelector('#slope').innerHTML=`${V('slope','#9A5BFF')} = <span class="num" style="color:#9A5BFF">${fmt(sl,2)}</span> <span class="note">${sl>.05?'uphill ↗':sl<-.05?'downhill ↘':'flat →'}</span>`;
        panel.querySelector('#area').innerHTML=`<span class="num" style="color:#3E67F0">${fmt(area,1)}</span>&nbsp;squares`}}
  }
  function step(){if(!ride||ride.done)return;const F=FAM[fam],y0=F.f(q,ride.x),nx=ride.x+(isFinite(y0)&&Math.abs(y0)<7.4?.09:.3);const x0=ride.x;area+=(F.f(q,x0)+F.f(q,nx))/2*(nx-x0);ride.x=nx;
    for(const s of stars)if(!s.got&&s.x>=x0-.001&&s.x<nx&&Math.abs(F.f(q,s.x)-s.y)<.26){s.got=true;tone(700+stars.filter(t=>t.got).length*120,.15,'triangle',.18);const r=cv.getBoundingClientRect();burst(r.left+P.X(s.x),r.top+P.Y(s.y),20)}
    if(ride.x>10.5){ride.done=true;if(stars.every(s=>s.got)){win(stage,null,null,'All stars!');lvl++;const my=rid;g.later(()=>{if(my===rid)newLevel()},2200)}else{ui.hint('Some stars were missed. Bend the track and try again!');buzz()}}}
  function resize(){dims=fitCanvas(cv)}const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  setFam('line');ui.hint('Make the yellow track pass through every star, then press Ride!',5000);
  /* keyboard: arrows slide the track, +/- bend it, Space rides, 1-5 pick a family */
  g.key(e=>{const k=e.key,F=FAM[fam];
    if(/^Arrow/.test(k)){const v=k==='ArrowUp'?1:k==='ArrowDown'?-1:0,hz=k==='ArrowRight'?1:k==='ArrowLeft'?-1:0;
      if(v){const kk='k' in q?'k':'b' in q?'b':'D';q[kk]=snapP(kk,q[kk]+v*F.p[kk][2])}if(hz&&'h' in q)q.h=snapP('h',q.h+hz*F.p.h[2]);ride=null;sync();return true}
    if(k==='+'||k==='='||k==='-'||k==='_'){const m=MAIN[fam],st=F.p[m][2];q[m]=snapP(m,q[m]+(k==='-'||k==='_'?-st:st));ride=null;sync();return true}
    if(k===' '||k==='Enter'){stage.querySelector('#ride').click();return true}if(k.toLowerCase()==='n'){stage.querySelector('#new').click();return true}
    if(/^[1-5]$/.test(k)){ui.top.querySelectorAll('[data-fam]')[+k-1].click();return true}return false});
  g.loop(()=>{step();draw()});
  GAMES.graph._debug={get q(){return q},get target(){return target},get stars(){return stars},setQ(o){Object.assign(q,o);sync()},ride(){stage.querySelector('#ride').click()},setFam,FAM,get lvl(){return lvl},get ride_(){return ride},get area(){return area},handles:()=>handles(),get P(){return P},get fam(){return fam}};
}}});
