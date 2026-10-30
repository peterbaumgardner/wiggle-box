/* ============================================================
   WAVE LAB — pendulum, ripple tank interference, sound strings
   ============================================================ */
Object.assign(GAMES,{waves:{title:'Wave Lab',icon:'🌊',c:'var(--aqua)',age:'8+',section:'lab',order:10,blurb:'Swing pendulums, make ripples, see sound.',
init(stage,g){
  let mode='pend',frame=0,t=0;
  const PD={L:1.5,g:9.8,amp:25,th:25*Math.PI/180,w:0,swings:0,lastSign:1,t0:0,many:false};
  const RP={f:1.2,sp:2.2,sources:[],gap:false};
  const ST={n:1,f:220,on:false,osc:null,gain:null};
  const ui=labShell(stage,{label:'Wave lab',top:`${chips('wm',[['pend','🕰️ Pendulum'],['ripple','💧 Ripples'],['string','🎸 Sound string']],'pend')}<span class="sep"></span><span id="ex" class="pbar"></span>`,panel:'<div id="pn"></div>'});
  const {cv,panel}=ui,ctx=cv.getContext('2d');let dims=fitCanvas(cv);
  const RED='#E8384F',BLUE='#2F6FE0',GRN='#1FA463',PUR='#9A5BFF',ORG='#FF8A2B';
  function ex(){const e=stage.querySelector('#ex');
    const gp=pickName(PLANETS,PD.g),dp=pickName(DRIPS,RP.f),np=pickName(NOTES,ST.f);
    e.innerHTML=mode==='pend'?`<button class="pbtn small" id="gmenu">${gp[0]} ${gp[1]} <span class="caret">▾</span></button><button class="pbtn small" id="many">${PD.many?'1️⃣ One pendulum':'🎐 Pendulum wave'}</button><button class="pbtn small" id="rel">↺ Let go</button>`
      :mode==='ripple'?`<button class="pbtn small" id="fmenu">${dp[0]} ${dp[1]} drips <span class="caret">▾</span></button><button class="pbtn small" id="two">💧💧 Two drips</button><button class="pbtn small" id="slit">🧱 ${RP.gap?'Remove wall':'Wall with gaps'}</button><button class="pbtn small" id="clr">🧹 Clear</button>`
      :`<button class="pbtn small go" id="play">${ST.on?'🔇 Stop sound':'🔊 Play sound'}</button><button class="pbtn small" id="nmenu">${np[0]} ${np[1]} note <span class="caret">▾</span></button><span class="hbar">${[1,2,3,4,5,6].map(n=>`<button class="pbtn small ${n===ST.n?'on':''}" data-hn="${n}" aria-label="${n} loops">${'〰'.repeat(1)}${n}</button>`).join('')}</span>`}
  function info(){const pn=panel.querySelector('#pn');
    if(mode==='pend'){const T=2*Math.PI*Math.sqrt(PD.L/PD.g),meas=PD.swings>1?(t-PD.t0)/((PD.swings-1)/2):0;
      patchPanel(pn,`
        <div class="fx big hot"><span class="tag">One swing (period)</span><div class="row">${V('T',GRN)} = 2${V('π','#1D1842')}√${frac(V('L',BLUE),V('g',PUR))} = <span class="num" style="color:${GRN}">${fmt(T,2)}</span> s</div><div class="row note">Exact for small swings. Big swings take a little longer.</div></div>
        <div class="fx"><span class="tag">Stopwatch says</span><div class="row"><span class="num">${meas?fmt(meas,2):'…'}</span> s per swing <span class="note">(${Math.floor(PD.swings/2)} swings)</span></div></div>
        <div class="fx"><span class="tag">Surprise!</span><div class="row">The starting angle ${V('θ',RED)} is not in the formula.</div><div class="row note">Big swing or small swing, it takes about the same time. Galileo noticed this in 1602.</div></div>
        <div class="fx"><span class="tag">Swings per second</span><div class="row">${V('f',ORG)} = ${frac(1,V('T',GRN))} = <span class="num">${fmt(1/T,2)}</span> Hz</div></div>`)}
    if(mode==='ripple'){const lam=RP.sp/RP.f;
      patchPanel(pn,`
        <div class="fx big hot"><span class="tag">Wave speed</span><div class="row">${V('v',GRN)} = ${V('f',ORG)} × ${V('λ',BLUE)}</div><div class="row"><span class="num">${fmt(RP.sp,1)}</span> = <span class="num" style="color:${ORG}">${fmt(RP.f,1)}</span> × <span class="num" style="color:${BLUE}">${fmt(lam,2)}</span></div><div class="row note">Faster drips make shorter waves. The speed stays the same.</div></div>
        <div class="fx"><span class="tag">Two waves meet</span><div class="row">top + top = <b>BIG</b> &nbsp; top + bottom = <b>flat</b></div><div class="row note">This is called interference. Tap two spots and look for the calm stripes.</div></div>
        <p class="note">Tap the water to make a drip. Tap a drip to remove it.</p>`)}
    if(mode==='string'){const f=ST.f*ST.n,Lm=.65,lam=2*Lm/ST.n;
      patchPanel(pn,`
        <div class="fx big hot"><span class="tag">Pitch you hear</span><div class="row">${V('f',ORG)}<sub>${V('n',PUR)}</sub> = ${V('n',PUR)} × ${V('f',ORG)}<sub>1</sub> = ${ST.n} × ${ST.f} = <span class="num" style="color:${ORG}">${f}</span> Hz</div></div>
        <div class="fx"><span class="tag">Wave length on the string</span><div class="row">${V('λ',BLUE)} = ${frac('2'+V('L','#1D1842'),V('n',PUR))} = ${frac('2 × 0.65 m',ST.n)} = <span class="num" style="color:${BLUE}">${fmt(lam,3)}</span> m</div></div>
        <div class="fx"><span class="tag">Still points (nodes)</span><div class="row"><span class="num">${ST.n+1}</span> spots never move</div><div class="row note">Doubling n jumps up one octave. That is how guitars make harmonics.</div></div>`)}}
  /* menus instead of sliders */
  const PLANETS=[['🌙','Moon',1.6],['🔴','Mars',3.7],['🌍','Earth',9.8],['🪐','Jupiter',24.8]],DRIPS=[['🐢','Slow',.6],['🚶','Medium',1.2],['🐇','Fast',2.2]],NOTES=[['🐻','Low',110],['🙂','Middle',220],['🐦','High',440]];
  const pickName=(L,v)=>L.reduce((a,b)=>Math.abs(b[2]-v)<Math.abs(a[2]-v)?b:a);
  function menuOf(btn,L,cur,cb){popMenu(btn,`<div class="popgrid">${L.map(([e,n,v])=>`<button class="popitem ${Math.abs(v-cur)<1e-6?'on':''}" data-v="${v}"><span class="pe">${e}</span>${n}</button>`).join('')}</div>`,b=>{cb(+b.dataset.v);ex();info()})}
  function release(){PD.th=PD.amp*Math.PI/180;PD.w=0;PD.swings=0;PD.t0=t;PD.lastSign=1;PD.bobs=null}
  stage.querySelector('#ex').addEventListener('click',e=>{const hb=e.target.closest('[data-hn]');if(hb){ST.n=+hb.dataset.hn;if(ST.on)setOsc();tone(ST.f*ST.n,.4,'triangle',.15);ex();info();return}
    const id=e.target.closest('button')?.id;if(!id)return;tone(560,.07,'triangle');
    if(id==='gmenu'){menuOf(e.target.closest('button'),PLANETS,PD.g,v=>{PD.g=v;PD.swings=0;release()});return}
    if(id==='fmenu'){menuOf(e.target.closest('button'),DRIPS,RP.f,v=>{RP.f=v});return}
    if(id==='nmenu'){menuOf(e.target.closest('button'),NOTES,ST.f,v=>{ST.f=v;if(ST.on)setOsc()});return}
    if(id==='rel')release();if(id==='many'){PD.many=!PD.many;PD.bobs=null;release();ex()}
    if(id==='two'){RP.sources=[{x:.38,y:.35,ph:0},{x:.62,y:.35,ph:0}];RP.t0=t}if(id==='clr'){RP.sources=[]}if(id==='slit'){RP.gap=!RP.gap;if(RP.gap)RP.sources=[{x:.5,y:.12,ph:0}];ex()}
    if(id==='play'){ST.on=!ST.on;ST.on?setOsc():stopOsc();if(ST.on&&!soundOn)ui.hint('Sound is off. Tap 🔇 at the top to hear the string.',3500,true);ex()}});
  function setOsc(){const a=audio();if(!a||!soundOn)return;if(!ST.osc){ST.osc=a.createOscillator();ST.gain=a.createGain();ST.osc.type='triangle';ST.gain.gain.value=0;ST.osc.connect(ST.gain).connect(a.destination);ST.osc.start()}
    ST.osc.frequency.setTargetAtTime(ST.f*ST.n,a.currentTime,.03);ST.gain.gain.setTargetAtTime(.12,a.currentTime,.05)}
  /* fades out and really stops the oscillator; works after leaving the game too (plain timer, not a game timer) */
  function stopOsc(){if(ST.osc){const a=audio(),o=ST.osc,gn=ST.gain;try{gn.gain.cancelScheduledValues(a.currentTime);gn.gain.setTargetAtTime(0,a.currentTime,.03)}catch(e){}setTimeout(()=>{try{o.stop();o.disconnect();gn.disconnect()}catch(e){}},250);ST.osc=null;ST.gain=null}}
  /* the sound button silences the string, and turning sound back on resumes it if Play is still on */
  const onSound=on=>{if(!on)stopOsc();else if(ST.on&&mode==='string')setOsc()};soundHooks.add(onSound);
  g.onEnd(()=>{soundHooks.delete(onSound);stopOsc()});
  bindChips(ui.top,'wm',m=>{mode=m;if(m!=='string'){stopOsc();ST.on=false}ex();info()});
  /* ---------- input ---------- */
  fingers(cv,{down(f){if(mode==='ripple'){const x=f.x/dims.w,y=f.y/dims.h;const i=RP.sources.findIndex(s=>Math.hypot((s.x-x)*dims.w,(s.y-y)*dims.h)<24);if(i>=0)RP.sources.splice(i,1);else{if(RP.sources.length>=4)RP.sources.shift();RP.sources.push({x,y,ph:0})}tone(900,.06,'sine',.08)}
      if(mode==='pend'&&!PD.many){f.data.p=true;this.move(f)}if(mode==='string'){f.data.s=true;ST.pluck={x:f.x,y:f.y,a:1}}},
    move(f){if(f.data.p){const px=dims.w/2,py=dims.h*.06,sc=Math.min((dims.h*.82)/3.1,dims.w*.3);PD.L=clamp(Math.round(Math.hypot(f.x-px,f.y-py)/sc*20)/20,.2,3);PD.bobs=null;PD.th=clamp(Math.atan2(f.x-px,f.y-py),-1.4,1.4);PD.w=0;PD.amp=Math.round(Math.abs(PD.th)*180/Math.PI);PD.swings=0;PD.t0=t;PD.hold=true}
      if(f.data.s&&ST.pluck){ST.pluck.x=f.x;ST.pluck.y=f.y}},
    up(f){if(f.data.p){PD.hold=false;PD.t0=t;PD.lastSign=Math.sign(PD.th)||1;info()}if(f.data.s&&ST.pluck){ST.pluck.rel=true;tone(ST.f*ST.n,1.2,'triangle',.2)}}});
  /* ---------- drawing ---------- */
  function drawPend(dt){const W=dims.w,H=dims.h,px=W/2,py=H*.06,sc=Math.min((H*.82)/3.1,W*.3);ctx.fillStyle='#FDFBF4';ctx.fillRect(0,0,W,H);ctx.fillStyle='#7E8BB8';ctx.fillRect(W*.2,py-8,W*.6,10);
    if(PD.many){if(!PD.bobs){PD.bobs=[...Array(12)].map((_,i)=>{const n=40+i,T=60/n;return{L:PD.g*(T/(2*Math.PI))**2,th:.45,w:0}})}
      const cols=['#FF4F5E','#FF8A2B','#FFC83D','#7BE07B','#24C786','#18BFD6','#3E67F0','#9A5BFF','#FF7FC8','#FF4F5E','#FF8A2B','#FFC83D'];
      PD.bobs.forEach((b,i)=>{for(let s=0;s<8;s++){const h=dt/8;b.w+=-PD.g/b.L*Math.sin(b.th)*h;b.th+=b.w*h}const x=W*.22+i*(W*.56/11),Lp=b.L*sc*1.6,bx=x+Math.sin(b.th)*Lp*.35,by=py+Math.cos(b.th)*Lp;
        ctx.strokeStyle='rgba(29,24,66,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,py);ctx.lineTo(bx,by);ctx.stroke();ctx.fillStyle=cols[i];ctx.strokeStyle='#1D1842';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(bx,by,10,0,7);ctx.fill();ctx.stroke()});
      ctx.fillStyle='#1D1842';ctx.font='900 15px Nunito';ctx.textAlign='center';ctx.fillText('Each one is a little longer, so it swings a little slower. Watch the patterns!',W/2,H-16);return}
    if(!PD.hold){for(let s=0;s<10;s++){const h=dt/10;PD.w+=-PD.g/PD.L*Math.sin(PD.th)*h;PD.th+=PD.w*h}const sg=Math.sign(PD.th);if(sg&&sg!==PD.lastSign){PD.lastSign=sg;PD.swings++;if(PD.swings===1)PD.t0=t;tone(PD.swings%2?880:660,.04,'sine',.05);info()}}
    const Lp=PD.L*sc,bx=px+Math.sin(PD.th)*Lp,by=py+Math.cos(PD.th)*Lp;
    ctx.strokeStyle='rgba(232,56,79,.35)';ctx.lineWidth=2;ctx.setLineDash([4,6]);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py+Lp*1.05);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='rgba(47,111,224,.25)';ctx.lineWidth=3;ctx.beginPath();const A=PD.amp*Math.PI/180;ctx.arc(px,py,Lp,Math.PI/2-A,Math.PI/2+A);ctx.stroke();
    ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(bx,by);ctx.stroke();
    const v=PD.w*PD.L;arrow(ctx,bx,by,bx+Math.cos(PD.th)*v*30,by-Math.sin(PD.th)*v*30,GRN,3);
    ctx.fillStyle=ORG;ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.arc(bx,by,18,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=BLUE;ctx.font='900 14px Nunito';ctx.textAlign='left';ctx.fillText(`L = ${fmt(PD.L,2)} m`,px+8,py+Lp/2);ctx.fillStyle=RED;ctx.fillText(`${Math.round(PD.th*180/Math.PI)}°`,px+10,py+40);
    // energy bars
    const hgt=PD.L*(1-Math.cos(PD.th)),hmax=PD.L*(1-Math.cos(A)),pe=hmax?hgt/hmax:0,ke=1-pe,bw=22,bh=H*.3,x0=W-90,y0=H*.9;
    for(const [k,val,col,lab] of [[0,pe,BLUE,'height'],[1,ke,GRN,'speed']]){ctx.fillStyle='rgba(29,24,66,.08)';ctx.fillRect(x0+k*38,y0-bh,bw,bh);ctx.fillStyle=col;ctx.fillRect(x0+k*38,y0-bh*clamp(val,0,1),bw,bh*clamp(val,0,1));ctx.fillStyle='#1D1842';ctx.font='800 11px Nunito';ctx.textAlign='center';ctx.fillText(lab,x0+k*38+bw/2,y0+14)}
    ctx.fillText('energy',x0+30,y0-bh-10)}
  const rbuf=document.createElement('canvas');let rimg=null;
  function drawRipple(){const W=dims.w,H=dims.h,sc=4,w=Math.ceil(W/sc),h=Math.ceil(H/sc);if(rbuf.width!==w||rbuf.height!==h){rbuf.width=w;rbuf.height=h;rimg=rbuf.getContext('2d').createImageData(w,h)}
    const d=rimg.data,k=2*Math.PI*RP.f/RP.sp,om=2*Math.PI*RP.f,ux=Math.min(W,H)/6,wallY=.42*h,slits=[.42*w,.58*w],sw=1.6;
    let srcs=RP.sources.map(s=>({x:s.x*W/sc,y:s.y*H/sc}));if(RP.gap)srcs=srcs.filter(s=>s.y<wallY);
    const slitSrc=srcs.length?slits.map(sx=>({x:sx,d:Math.hypot(sx-srcs[0].x,wallY-srcs[0].y)*sc/ux})):[];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){let a=0;
      if(RP.gap&&y>wallY){for(const sl of slitSrc){const r=Math.hypot(x-sl.x,y-wallY)*sc/ux;a+=1.4*Math.sin(k*(r+sl.d)-om*t)/Math.sqrt(1+r*.6)}}
      else for(const s of srcs){const r=Math.hypot(x-s.x,y-s.y)*sc/ux;a+=Math.sin(k*r-om*t)/Math.sqrt(1+r*.6)}
      const o=(y*w+x)*4,v=clamp(a*.55,-1,1);d[o]=40+v*60+(v>0?v*120:0);d[o+1]=110+v*70+(v>0?v*110:0);d[o+2]=200+v*55;d[o+3]=255;
      if(RP.gap&&Math.abs(y-wallY)<1.2&&!slits.some(sx=>Math.abs(x-sx)<sw)){d[o]=60;d[o+1]=50;d[o+2]=90}}
    rbuf.getContext('2d').putImageData(rimg,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(rbuf,0,0,W,H);
    for(const s of RP.sources){ctx.fillStyle='#fff';ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x*W,s.y*H,9,0,7);ctx.fill();ctx.stroke()}
    if(!RP.sources.length){ctx.fillStyle='#fff';ctx.font='900 18px Nunito';ctx.textAlign='center';ctx.fillText('Tap the water to make it drip!',W/2,H/2)}
    // wavelength ruler
    const lamPx=RP.sp/RP.f*ux;ctx.strokeStyle='#FFC83D';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(20,H-22);ctx.lineTo(20+lamPx,H-22);ctx.moveTo(20,H-30);ctx.lineTo(20,H-14);ctx.moveTo(20+lamPx,H-30);ctx.lineTo(20+lamPx,H-14);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='900 14px Nunito';ctx.textAlign='left';ctx.fillText('λ (one wave)',24+lamPx,H-17)}
  function drawString(){const W=dims.w,H=dims.h;ctx.fillStyle='#1A1440';ctx.fillRect(0,0,W,H);const x0=W*.08,x1=W*.92,y=H*.45,A=H*.18;
    ctx.fillStyle='#C98B4F';ctx.fillRect(x0-14,y-60,14,120);ctx.fillRect(x1,y-60,14,120);
    const n=ST.n,ph=t*2*Math.PI*(.6+n*.35)*(ST.f/220),amp=ST.on?1:ST.pluck?(ST.pluck.rel?(ST.pluck.a*=.985):1):.15;
    if(ST.pluck&&!ST.pluck.rel){const px=clamp(ST.pluck.x,x0+1,x1-1),py=ST.pluck.y;ctx.strokeStyle='#FFE36E';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(px,py);ctx.lineTo(x1,y);ctx.stroke()}
    else{for(const gh of [-1,1]){ctx.strokeStyle=gh<0?'rgba(255,227,110,.18)':'rgba(255,227,110,.18)';ctx.lineWidth=2;ctx.beginPath();for(let k=0;k<=200;k++){const u=k/200;ctx.lineTo(x0+u*(x1-x0),y+gh*A*amp*Math.sin(n*Math.PI*u))}ctx.stroke()}
      ctx.strokeStyle='#FFE36E';ctx.lineWidth=4;ctx.beginPath();for(let k=0;k<=200;k++){const u=k/200;ctx.lineTo(x0+u*(x1-x0),y+A*amp*Math.sin(n*Math.PI*u)*Math.cos(ph))}ctx.stroke()}
    for(let k=0;k<=n;k++){const x=x0+k/n*(x1-x0);ctx.fillStyle='#FF4F7B';ctx.beginPath();ctx.arc(x,y,7,0,7);ctx.fill()}
    for(let k=0;k<n;k++){const x=x0+(k+.5)/n*(x1-x0);ctx.fillStyle='rgba(255,255,255,.7)';ctx.font='900 12px Nunito';ctx.textAlign='center';ctx.fillText('loop '+(k+1),x,y+A+30)}
    // piano reference
    const f=ST.f*n;ctx.fillStyle='rgba(255,255,255,.75)';ctx.font='900 14px Nunito';ctx.textAlign='center';ctx.fillText(`${Math.round(f)} Hz`,W/2,H*.9);
    ctx.font='800 12px Nunito';ctx.fillText('Pull the string with your finger and let go!',W/2,H*.96);
    if(ST.pluck&&ST.pluck.rel&&ST.pluck.a<.05)ST.pluck=null}
  function resize(){dims=fitCanvas(cv)}const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  release();ex();info();
  kbPointer(g,cv,{arrows:false});
  g.key(e=>{const k=e.key;if(/^[1-3]$/.test(k)){ui.top.querySelectorAll('[data-wm]')[+k-1].click();return true}
    if(k===' '||k==='Enter'){if(mode==='pend'){release();info()}else if(mode==='ripple'){RP.sources.push({x:.3+Math.random()*.4,y:.25+Math.random()*.4,ph:0});if(RP.sources.length>4)RP.sources.shift()}else{ST.pluck={x:dims.w/2,y:dims.h*.25,a:1,rel:true};tone(ST.f*ST.n,1.2,'triangle',.2)}return true}
    if(mode==='pend'&&(k==='ArrowUp'||k==='ArrowDown')){PD.L=clamp(PD.L+(k==='ArrowUp'?-.05:.05),.2,3);PD.swings=0;info();return true}
    if(mode==='string'&&(k==='ArrowUp'||k==='ArrowDown')){ST.n=clamp(ST.n+(k==='ArrowUp'?1:-1),1,6);if(ST.on)setOsc();ex();info();return true}return false});ui.hint('Drag the orange ball and let go. Pull it farther out for a longer string!',4500);
  let last=performance.now();
  g.loop(()=>{frame++;const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;t+=dt;ctx.setTransform(dims.d,0,0,dims.d,0,0);
    if(mode==='pend')drawPend(dt);if(mode==='ripple')drawRipple();if(mode==='string')drawString()});
  GAMES.waves._debug={PD,RP,ST,setMode(m){stage.querySelector(`[data-wm="${m}"]`).click()},get t(){return t},get mode(){return mode},get dims(){return dims}};
}}});
