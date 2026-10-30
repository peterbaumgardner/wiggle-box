/* ============================================================
   SPACE ORBITS — gravity playground with planet facts
   ============================================================ */
Object.assign(GAMES,{space:{title:'Space Orbits',icon:'🪐',c:'var(--grape)',age:'4+',section:'lab',order:4,blurb:'Fling planets around the Sun and learn about them',
init(stage,g){
  const P={
    mercury:{n:'Mercury',r:5,c:['#C9C2BA','#8E857C'],f:'Mercury is the closest planet to the Sun. A year there is only 88 days!'},
    venus:{n:'Venus',r:8,c:['#FFE3A3','#D9A653'],f:'Venus is the hottest planet. It is hotter than an oven!'},
    earth:{n:'Earth',r:8.5,c:['#6FB8FF','#1F5FCC'],land:true,f:'Earth is our home. It is the only planet we know with living things!'},
    mars:{n:'Mars',r:6.5,c:['#FF9A6B','#C2452D'],f:'Mars is the red planet. Its dust is rusty, like an old nail!'},
    jupiter:{n:'Jupiter',r:17,c:['#F4D9B0','#C98B4F'],bands:true,f:'Jupiter is the biggest planet. More than a thousand Earths could fit inside!'},
    saturn:{n:'Saturn',r:14,c:['#FFF0B8','#D9B45C'],rings:true,f:'Saturn has beautiful rings made of ice and rock!'},
    uranus:{n:'Uranus',r:11,c:['#C8FFFB','#4FC3D9'],f:'Uranus spins on its side, like a ball rolling around the Sun!'},
    neptune:{n:'Neptune',r:11,c:['#8FB2FF','#2F4FD6'],f:'Neptune is the windiest planet. Its winds are super fast!'},
    moon:{n:'Moon',r:4,c:['#F2F2F2','#A0A0A8'],f:'The Moon goes around the Earth. People have walked on it!'},
    comet:{n:'Comet',r:5,c:['#FFFFFF','#BDEFFF'],comet:true,f:'Comets are big balls of ice and dust. Their tails always point away from the Sun!'},
    rock:{n:'Asteroid',r:5,c:['#B8A898','#6E6258'],lumpy:true,f:'Asteroids are space rocks. Lots of them circle the Sun between Mars and Jupiter!'}};
  const ORDER=['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];
  stage.innerHTML=`<div class="simwrap"><div class="simarea"><canvas class="simcv" aria-label="Space"></canvas><div class="simhint" id="hint"></div></div>
    <div class="dock"><div class="drow wrap" id="tools"><button class="tool" id="planet" aria-haspopup="menu"><span class="ti pdot2"></span><span id="pname">Earth</span><span class="caret">▾</span></button><span class="sep"></span><button class="tool scene" data-a="system"><span class="ti">☀️</span>Solar system</button><button class="tool" data-a="hole"><span class="ti">🕳️</span>Black hole</button>
      <button class="tool" data-a="fast"><span class="ti">⏩</span>Fast</button><button class="tool on" data-a="names"><span class="ti">🏷️</span>Names</button><button class="tool" data-a="paths"><span class="ti">〰️</span>Paths</button><button class="tool scene" data-a="clear"><span class="ti">🧹</span>Clear</button>
      </div></div></div>`;
  const cv=stage.querySelector('canvas'),ctx=cv.getContext('2d'),hintEl=stage.querySelector('#hint');
  const ov=fxOverlay(stage.querySelector('.simarea'));let focus=null;
  const AU={mercury:0.39,venus:0.72,earth:1,mars:1.52,jupiter:5.2,saturn:9.6,uranus:19.2,neptune:30.1};
  function ovUpdate(){const b=focus&&bodies.includes(focus)&&!focus.parent?focus:bodies.find(x=>x.kind==='earth'&&!x.parent);const GM=gm(),U=(Math.min(W,H)/2-26*S)*(.2+.8*2/7);  /* Earth's orbit radius in the solar system layout = 1 */
    if(!b){ov.set(`<div class="fx hot"><span class="tag">Gravity</span><div class="row">${V('F','#E8384F')} = ${V('G','#1D1842')}${frac(V('M','#FF8A2B')+V('m','#2F6FE0'),V('r','#1FA463')+'²')}</div><div class="row note">Twice as far away, only a quarter of the pull.</div></div>`);return}
    const r=Math.hypot(b.x-cx,b.y-cy),v=Math.hypot(b.vx,b.vy),a=1/(2/r-v*v/GM);const bound=a>0,T=bound?2*Math.PI*Math.sqrt(a*a*a/GM):Infinity;
    ov.set(`<div class="fx hot"><span class="tag">${b.p.n}</span><div class="row">${V('r','#1FA463')} = <span class="num" style="color:#1FA463">${fmt(r/U,2)}</span> &nbsp;${V('v','#2F6FE0')} = <span class="num" style="color:#2F6FE0">${fmt(v/U,2)}</span></div>
        <div class="row note">distance and speed here (1 = Earth's orbit)${AU[b.kind]?`. Real ${b.p.n} is <b>${AU[b.kind]}</b> times as far as Earth. The sandbox squeezes space so everything fits!`:''}</div></div>
      <div class="fx"><span class="tag">Pull of the ${hole?'black hole':'Sun'}</span><div class="row">${V('F','#E8384F')} = ${V('G','#1D1842')}${frac(V('M','#FF8A2B')+V('m','#2F6FE0'),V('r','#1FA463')+'²')}</div><div class="row">${frac('1',fmt(r/U,2)+'²')} = <span class="num" style="color:#E8384F">${fmt((U/r)**2,2)}</span> × Earth's pull</div></div>
      <div class="fx"><span class="tag">Kepler's 3rd law</span><div class="row">${V('T','#9A5BFF')}² ∝ ${V('a','#1FA463')}³</div>${bound?`<div class="row">one trip: <span class="num" style="color:#9A5BFF">${fmt(T,1)}</span> s &nbsp; ${V('T','#9A5BFF')}²÷${V('a','#1FA463')}³ = <span class="num">${fmt(T*T/(a/U)**3,1)}</span></div><div class="row note">That last number is the same for every planet!</div>`:'<div class="row"><b>Escaping!</b> Too fast to stay in orbit.</div>'}</div>
      <div class="fx"><span class="tag">Circle orbit speed</span><div class="row">${V('v','#2F6FE0')} = √${frac(V('G','#1D1842')+V('M','#FF8A2B'),V('r','#1FA463'))}</div></div>`)}
  const hint=makeHint(hintEl);
  let dims=fitCanvas(cv),W=dims.w,H=dims.h,cx=W/2,cy=H/2,S=Math.min(W,H)/600,GM=0;
  let pick_='earth',hole=false,fast=false,names=true,paths=true,frame=0;
  const bodies=[];let stars=[];
  function setup(){W=dims.w;H=dims.h;cx=W/2;cy=H/2;S=clamp(Math.min(W,H)/560,.6,1.8);const R0=Math.min(W,H)*.32,T0=7,v0=2*Math.PI*R0/T0;GM=v0*v0*R0;
    stars=[];for(let i=0;i<Math.round(W*H/2600);i++)stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+.3,t:Math.random()*6})}
  setup();
  const sunR=()=>(hole?18:30)*S,gm=()=>GM*(hole?2.2:1);
  function add(kind,x,y,vx,vy){const p=P[kind];const b={kind,p,x,y,vx,vy,r:p.r*S*1.25,trail:[],born:frame,ang:Math.random()*6};if(bodies.length>=40)bodies.shift();bodies.push(b);if(kind!=='moon')focus=b;return b}
  function circular(x,y,dir=1){const dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)||1,v=Math.sqrt(gm()/d);return[-dy/d*v*dir,dx/d*v*dir]}
  function solar(){bodies.length=0;const m=Math.min(W,H)/2-26*S;
    ORDER.forEach((k,i)=>{const R=m*(.2+.8*(i/7)),a=Math.random()*6.28,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R;const[vx,vy]=circular(x,y);const b=add(k,x,y,vx,vy);b.r=P[k].r*S;
      if(k==='earth'){const mo=add('moon',x,y,0,0);mo.parent=b;mo.ma=0;mo.r=P.moon.r*S*.8}});
    hint('Planets close to the Sun go around faster!',5000);say('The solar system! Planets close to the Sun go around faster.')}
  const fact=(b,x,y)=>{say(b.f);const r=cv.getBoundingClientRect();floaty(stage,r.left+x,r.top+y-30,b.n);tone(700,.1,'triangle');tone(1050,.14,'triangle',.15,.08)};

  /* ---------- input ---------- */
  const aims=new Set();
  const fm=fingers(cv,{
    down(f){const hit=bodies.slice().reverse().find(b=>Math.hypot(b.x-f.x,b.y-f.y)<Math.max(b.r+10,22));
      if(hit){fact(hit.p,hit.x,hit.y);hit.flash=40;focus=hit;f.data.done=true;return}
      if(Math.hypot(f.x-cx,f.y-cy)<sunR()+10){if(hole){say('A black hole pulls so hard that not even light can escape!')}else{say('The Sun is a star! It gives us light and keeps us warm.')}tone(300,.3,'sine',.2,0,600);f.data.done=true;return}
      aims.add(f);f.data.t=performance.now()},
    up(f){aims.delete(f);if(f.data.done)return;const dx=f.x-f.sx,dy=f.y-f.sy,d=Math.hypot(dx,dy);let vx,vy;
      if(d<14){[vx,vy]=circular(f.sx,f.sy)}else{vx=dx*2.4;vy=dy*2.4}
      add(pick_,f.sx,f.sy,vx,vy);noise(.3,900,.6,.12,0,2500);tone(400,.25,'sine',.1,0,900);
      if(d<14)tone(800,.1,'triangle',.08,.2)}});

  /* ---------- UI ---------- */
  function syncOpts(){const p=P[pick_],d=stage.querySelector('#planet .pdot2');if(d)d.style.background=`radial-gradient(circle at 35% 35%,${p.c[0]},${p.c[1]})`;const n=stage.querySelector('#pname');if(n)n.textContent=p.n}
  function planetMenu(btn){popMenu(btn,`<div class="popgrid">${Object.entries(P).map(([k,p])=>`<button class="popitem ${k===pick_?'on':''}" data-p="${k}"><span class="pdot" style="width:38px;height:38px;background:radial-gradient(circle at 35% 35%,${p.c[0]},${p.c[1]})"></span>${p.n}</button>`).join('')}</div>`,b=>{pick_=b.dataset.p;syncOpts();hint('Tap the sky to put '+(P[pick_].comet||P[pick_].lumpy?'it':P[pick_].n)+' in orbit. Swipe to throw it!',2600,true)})}
  stage.querySelector('#tools').addEventListener('click',e=>{const b=e.target.closest('.tool');if(!b)return;if(b.id==='planet'){planetMenu(b);return}const a=b.dataset.a;
    if(a==='system')solar();
    if(a==='hole'){hole=!hole;b.classList.toggle('on',hole);if(hole){say('A black hole! It pulls really hard.');hint('A black hole! Get too close and it swallows you.')}else say('The Sun is back!');tone(hole?120:500,.6,'sine',.2,0,hole?40:900)}
    if(a==='fast'){fast=!fast;b.classList.toggle('on',fast);say(fast?'Faster!':'Normal speed')}
    if(a==='names'){names=!names;b.classList.toggle('on',names)}
    if(a==='paths'){paths=!paths;b.classList.toggle('on',paths);bodies.forEach(x=>x.trail.length=0)}
    if(a==='clear'){bodies.length=0;say('All clear!')}
    tone(520,.08,'triangle')});
  stage.querySelector('[data-a=paths]').classList.add('on');
  syncOpts();

  /* ---------- physics ---------- */
  function step(dt){
    const g2=gm(),sr=sunR();
    for(let i=bodies.length-1;i>=0;i--){const b=bodies[i];
      if(b.parent){if(!bodies.includes(b.parent)){b.parent=null;continue}b.ma+=dt*2.4;const R=b.parent.r+14*S;b.x=b.parent.x+Math.cos(b.ma)*R;b.y=b.parent.y+Math.sin(b.ma)*R;b.vx=b.parent.vx;b.vy=b.parent.vy;continue}
      const dx=cx-b.x,dy=cy-b.y,d2=dx*dx+dy*dy+25,d=Math.sqrt(d2),a=g2/d2;b.vx+=dx/d*a*dt;b.vy+=dy/d*a*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.ang+=dt*1.5;
      if(d<sr+b.r*.4){bodies.splice(i,1);const r=cv.getBoundingClientRect();burst(r.left+b.x,r.top+b.y,30,hole?['#9A5BFF','#2F1C5C','#fff']:['#FFC83D','#FF8A2B','#FFF3B0'],6);
        noise(.4,hole?150:1500,.5,.2,0,hole?60:300);if(hole)say('Gulp! The black hole ate '+(b.kind==='rock'||b.kind==='comet'?'the '+b.p.n.toLowerCase():b.p.n)+'!');else if(Math.random()<.5)say('Too hot! '+b.p.n+' fell into the Sun.');continue}
      if(Math.hypot(b.x-cx,b.y-cy)>Math.max(W,H)*2.5){bodies.splice(i,1);say('Bye bye, '+b.p.n+'!');continue}
    }
  }

  /* ---------- drawing ---------- */
  function planet(b){const p=b.p,x=b.x,y=b.y,r=b.r;
    if(p.comet){const dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)||1,len=clamp(9000*S/d,20,200)*S;const ux=dx/d,uy=dy/d;
      const gr=ctx.createLinearGradient(x,y,x+ux*len,y+uy*len);gr.addColorStop(0,'rgba(190,240,255,.85)');gr.addColorStop(1,'rgba(190,240,255,0)');ctx.fillStyle=gr;
      ctx.beginPath();ctx.moveTo(x-uy*r,y+ux*r);ctx.lineTo(x+ux*len-uy*r*2.5,y+uy*len+ux*r*2.5);ctx.lineTo(x+ux*len+uy*r*2.5,y+uy*len-ux*r*2.5);ctx.lineTo(x+uy*r,y-ux*r);ctx.fill()}
    if(p.rings){ctx.strokeStyle='rgba(230,205,140,.9)';ctx.lineWidth=r*.35;ctx.beginPath();ctx.ellipse(x,y,r*2,r*.62,-.35,Math.PI,2*Math.PI);ctx.stroke()}
    const gr=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r);gr.addColorStop(0,p.c[0]);gr.addColorStop(1,p.c[1]);ctx.fillStyle=gr;ctx.beginPath();
    if(p.lumpy){for(let k=0;k<9;k++){const a=b.ang+k*.698,rr=r*(.8+.25*Math.sin(k*2.3));ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}ctx.closePath()}else ctx.arc(x,y,r,0,7);ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.clip();
    if(p.bands){ctx.fillStyle='rgba(160,90,40,.45)';for(const o of [-.5,-.15,.25,.55])ctx.fillRect(x-r,y+o*r,r*2,r*.16);ctx.fillStyle='#C2452D';ctx.beginPath();ctx.ellipse(x+r*.3,y+r*.35,r*.2,r*.12,0,0,7);ctx.fill()}
    if(p.land){ctx.fillStyle='#3FBF5F';for(const [ox,oy,s] of [[-.3,-.2,.42],[.35,.25,.35],[.1,-.55,.22]]){ctx.beginPath();ctx.ellipse(x+Math.cos(b.ang)*ox*r*1.4+ox*r*.2,y+oy*r,r*s,r*s*.7,b.ang,0,7);ctx.fill()}}
    // night side faces away from the Sun
    const dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)||1;const sh=ctx.createLinearGradient(x-dx/d*r,y-dy/d*r,x+dx/d*r,y+dy/d*r);sh.addColorStop(.45,'rgba(10,8,40,0)');sh.addColorStop(1,'rgba(10,8,40,.7)');
    ctx.fillStyle=sh;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();
    if(p.rings){ctx.strokeStyle='rgba(230,205,140,.95)';ctx.lineWidth=r*.35;ctx.beginPath();ctx.ellipse(x,y,r*2,r*.62,-.35,0,Math.PI);ctx.stroke()}
    if(b.flash>0){b.flash--;ctx.strokeStyle=`rgba(255,255,255,${b.flash/40})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r+8+(40-b.flash)*.4,0,7);ctx.stroke()}
    if(names&&!b.parent){ctx.fillStyle='rgba(255,255,255,.85)';ctx.font=`900 ${Math.round(12*S+3)}px Nunito,system-ui,sans-serif`;ctx.textAlign='center';ctx.fillText(p.n,x,y+r+14*S+4)}
  }
  function draw(){
    ctx.setTransform(dims.d,0,0,dims.d,0,0);
    const bgG=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.7);bgG.addColorStop(0,hole?'#1A0F3D':'#1F1A55');bgG.addColorStop(1,'#08061E');ctx.fillStyle=bgG;ctx.fillRect(0,0,W,H);
    for(const s of stars){ctx.globalAlpha=.4+.6*Math.abs(Math.sin(frame*.02+s.t));ctx.fillStyle='#fff';ctx.fillRect(s.x,s.y,s.r,s.r)}ctx.globalAlpha=1;
    // trails
    if(paths)for(const b of bodies){if(b.trail.length<2)continue;ctx.strokeStyle=b.p.c[0];ctx.lineWidth=2;ctx.lineCap='round';
      for(let i=1;i<b.trail.length;i++){ctx.globalAlpha=i/b.trail.length*.55;ctx.beginPath();ctx.moveTo(b.trail[i-1][0],b.trail[i-1][1]);ctx.lineTo(b.trail[i][0],b.trail[i][1]);ctx.stroke()}ctx.globalAlpha=1}
    // sun or black hole
    const sr=sunR();
    if(hole){ctx.save();ctx.translate(cx,cy);for(let k=0;k<3;k++){ctx.rotate(frame*.01+k*2.1);ctx.strokeStyle=`rgba(${k?'154,91,255':'255,138,43'},.5)`;ctx.lineWidth=6-k;ctx.beginPath();ctx.ellipse(0,0,sr*3.2-k*8,sr*1.1,0,0,7);ctx.stroke()}ctx.restore();
      ctx.fillStyle='#000';ctx.beginPath();ctx.arc(cx,cy,sr,0,7);ctx.fill();ctx.strokeStyle='rgba(255,200,120,.8)';ctx.lineWidth=2;ctx.stroke()}
    else{const gl=ctx.createRadialGradient(cx,cy,sr*.5,cx,cy,sr*3.2);gl.addColorStop(0,'rgba(255,200,61,.55)');gl.addColorStop(1,'rgba(255,200,61,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(cx,cy,sr*3.2,0,7);ctx.fill();
      const sg=ctx.createRadialGradient(cx-sr*.3,cy-sr*.3,sr*.1,cx,cy,sr);sg.addColorStop(0,'#FFF7C2');sg.addColorStop(.6,'#FFC83D');sg.addColorStop(1,'#FF8A2B');ctx.fillStyle=sg;ctx.beginPath();
      for(let k=0;k<=48;k++){const a=k/48*6.283,rr=sr*(1+.04*Math.sin(a*8+frame*.08));ctx.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}ctx.fill()}
    for(const b of bodies)planet(b);
    // aiming
    for(const aim of aims){const dx=aim.x-aim.sx,dy=aim.y-aim.sy,d=Math.hypot(dx,dy);
      ctx.fillStyle=P[pick_].c[0];ctx.beginPath();ctx.arc(aim.sx,aim.sy,P[pick_].r*S*1.25,0,7);ctx.fill();
      if(d>14){let x=aim.sx,y=aim.sy,vx=dx*2.4,vy=dy*2.4;ctx.fillStyle='rgba(255,255,255,.7)';const g2=gm(),h=1/60;
        for(let i=0;i<220;i++){const ddx=cx-x,ddy=cy-y,d2=ddx*ddx+ddy*ddy+25,dd=Math.sqrt(d2),a=g2/d2;vx+=ddx/dd*a*h;vy+=ddy/dd*a*h;x+=vx*h;y+=vy*h;if(dd<sunR())break;if(i%4===0){ctx.beginPath();ctx.arc(x,y,2,0,7);ctx.fill()}}
        ctx.strokeStyle='#FFC83D';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(aim.sx,aim.sy);ctx.lineTo(aim.x,aim.y);ctx.stroke()}}
  }
  /* Rotating or resizing rescales space: positions and speeds by k and GM by k³ keeps every orbit's shape and timing
     exactly (it used to change gravity under the planets and fling them away). */
  function resize(){const nd=fitCanvas(cv);if(Math.abs(nd.w-W)<2&&Math.abs(nd.h-H)<2&&nd.d===dims.d)return;const ox=cx,oy=cy,oS=S,oR=Math.min(W,H);dims=nd;setup();
    const k=Math.min(W,H)/oR;for(const b of bodies){b.x=cx+(b.x-ox)*k;b.y=cy+(b.y-oy)*k;b.vx*=k;b.vy*=k;b.r*=S/oS;b.trail=b.trail.map(([x,y])=>[cx+(x-ox)*k,cy+(y-oy)*k])}}
  const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  solar();
  let simT=0,loopN=0;
  GAMES.space._debug={get bodies(){return bodies},get simT(){return simT},get loopN(){return loopN},gm,get cx(){return cx},get cy(){return cy},get hole(){return hole},get fast(){return fast},get names(){return names},get paths(){return paths},get pick(){return pick_},get focus(){return focus},sunR,get W(){return W},get H(){return H},get S(){return S}};
  kbPointer(g,cv);
  const PK=Object.keys(P);
  g.key(e=>{const k=e.key.toLowerCase();if(/^[0-9]$/.test(k)){const i=k==='0'?9:+k-1;if(PK[i]){pick_=PK[i];syncOpts();return true}}
    const a={s:'system',h:'hole',f:'fast',c:'clear',n:'names',p:'paths'}[k];if(a){stage.querySelector(`[data-a="${a}"]`).click();return true}return false});
  g.loop(dt=>{frame++;if(frame%8===0)ovUpdate();const sub=fast?6:3,h=Math.min(dt,40)/1000/3;for(let i=0;i<sub;i++){step(h);simT+=h}loopN++;
    if(frame%2===0)for(const b of bodies){if(b.parent)continue;b.trail.push([b.x,b.y]);if(b.trail.length>90)b.trail.shift()}
    draw()});
}}});
