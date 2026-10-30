/* ============================================================
   CANNON LAUNCH — projectile motion with live formulas
   ============================================================ */
Object.assign(GAMES,{cannon:{title:'Cannon Launch',icon:'🎯',c:'var(--berry)',age:'8+',section:'lab',order:5,blurb:'Aim, fire, and let the math find the target.',
init(stage,g){
  const PLANETS=[['earth','🌍 Earth',9.8],['moon','🌙 Moon',1.6],['mars','🔴 Mars',3.7],['jup','🪐 Jupiter',24.8]];
  let th=45,v=20,gi=0,grav=9.8,lvl=0,target=null,wall=null,shot=null,trails=[],showPath=true,frame=0,dragA=null,boom=[];
  const RED='#E8384F',BLUE='#2F6FE0',GRN='#1FA463',PUR='#9A5BFF',ORG='#FF8A2B';
  const ui=labShell(stage,{label:'Cannon range',top:`<button class="pbtn small" id="plm">🌍 Earth <span class="caret">▾</span></button><span class="sep"></span><span class="lvl" id="lv"></span>
    <button class="pbtn go small" id="fire">💥 Fire!</button><button class="pbtn small" id="path">👁️ Path: on</button><button class="pbtn small" id="skip">➜ Next</button>`,
    panel:`<div id="info"></div>`});
  const {cv,panel}=ui,ctx=cv.getContext('2d');let dims=fitCanvas(cv);
  const rad=d=>d*Math.PI/180;
  const range=()=>v*v*Math.sin(rad(2*th))/grav,hmax=()=>(v*Math.sin(rad(th)))**2/(2*grav),tof=()=>2*v*Math.sin(rad(th))/grav;
  function info(){const vx=v*Math.cos(rad(th)),vy=v*Math.sin(rad(th)),live=shot&&!shot.done;
    patchPanel(panel.querySelector('#info'),`<div class="fx"><span class="tag">Split the speed</span><div class="row">${V('vₓ',RED)} = ${V('v',BLUE)}·cos ${V('θ',RED)} = <span class="num">${fmt(vx,1)}</span> m/s</div><div class="row">${V('vᵧ',BLUE)} = ${V('v',BLUE)}·sin ${V('θ',RED)} = <span class="num">${fmt(vy,1)}</span> m/s</div></div>
      <div class="fx big hot"><span class="tag">It will land at</span><div class="row">${V('R',GRN)} = ${frac(V('v',BLUE)+'² · sin 2'+V('θ',RED),V('g',PUR))} = <span class="num" style="color:${GRN}">${fmt(range(),1)}</span> m</div></div>
      <div class="fx"><span class="tag">Highest point</span><div class="row">${V('H',ORG)} = ${frac('('+V('v',BLUE)+' sin '+V('θ',RED)+')²','2'+V('g',PUR))} = <span class="num" style="color:${ORG}">${fmt(hmax(),1)}</span> m</div></div>
      <div class="fx"><span class="tag">Time in the air</span><div class="row">${V('T','#1D1842')} = ${frac('2'+V('v',BLUE)+' sin '+V('θ',RED),V('g',PUR))} = <span class="num">${fmt(tof(),2)}</span> s</div></div>
      <div class="fx ${live?'hot':''}"><span class="tag">Right now</span><div class="row">${live?`${V('t','#1D1842')} = <span class="num">${fmt(shot.t,2)}</span> s &nbsp; ${V('x','#1D1842')} = <span class="num">${fmt(shot.x,1)}</span> m &nbsp; ${V('y','#1D1842')} = <span class="num">${fmt(shot.y,1)}</span> m`:'Fire to see it fly.'}</div>
        <div class="row note">${V('y','#1D1842')} = ${V('vᵧ',BLUE)}${V('t','#1D1842')} − ½${V('g',PUR)}${V('t','#1D1842')}² &nbsp;(gravity ${V('g',PUR)} = ${grav} m/s²)</div></div>`)}
  function newLevel(){shot=null;trails=[];wall=null;const k=lvl;
    if(k<3)target={x:rint(15,45)+(k?rint(0,15):0),y:0,r:2.2,kind:'castle'};
    else if(k<6)target={x:rint(20,50),y:rint(6,20),r:2,kind:'balloon'};
    else{target={x:rint(35,60),y:0,r:2.2,kind:'castle'};wall={x:target.x*rint(40,60)/100,h:rint(8,18)}}
    if(k>=9&&k%3===0){const pl=pick(PLANETS.slice(1));setPlanet(pl[0])}
    stage.querySelector('#lv').textContent=`Level ${lvl+1}`;info()}
  function setPlanet(k){gi=PLANETS.findIndex(p=>p[0]===k);grav=PLANETS[gi][2];stage.querySelector('#plm').innerHTML=`${PLANETS[gi][1]} <span class="caret">▾</span>`;info()}
  stage.querySelector('#plm').addEventListener('click',e=>popMenu(e.currentTarget,`<div class="popgrid">${PLANETS.map((p,i)=>`<button class="popitem ${i===gi?'on':''}" data-pl="${p[0]}"><span class="pe">${p[1].split(' ')[0]}</span>${p[1].split(' ')[1]}<small>g = ${p[2]}</small></button>`).join('')}</div>`,b=>{setPlanet(b.dataset.pl);tone(500,.08,'triangle')}));
  function syncSl(){}
  function fire(){if(shot&&!shot.done)return;shot={t:0,x:0,y:0,done:false,th,v,pts:[]};noise(.6,200,.5,.5,0,60,'lowpass');tone(90,.4,'sine',.4,0,40)}
  stage.querySelector('#fire').addEventListener('click',fire);
  stage.querySelector('#path').addEventListener('click',e=>{showPath=!showPath;e.target.textContent=`👁️ Path: ${showPath?'on':'off'}`;if(!showPath)ui.hint('Use the formula to aim. Hit it with the path hidden for a bonus star!')});
  stage.querySelector('#skip').addEventListener('click',()=>{lvl++;newLevel()});
  /* ---------- view: meters to pixels ---------- */
  let M;function view(){const W=dims.w,H=dims.h,span=Math.max(80,(target?target.x:50)+15,range()+10),sc=Math.max(1,Math.min((W-60)/span,(H-60)/Math.max(30,span*.55)));M={sc,ox:40,oy:H-34,X:x=>40+x*sc,Y:y=>H-34-y*sc,IX:px=>(px-40)/sc,IY:py=>(H-34-py)/sc}}
  /* Aim with your finger: drag anywhere. The cannon points at your finger and the farther you pull, the faster the shot. Let go to fire. A quick tap just fires. */
  fingers(cv,{down(f){f.data.x0=f.x;f.data.y0=f.y},
    move(f){if(!dragA&&Math.hypot(f.x-f.data.x0,f.y-f.data.y0)<12)return;dragA=true;const dx=Math.max(1,f.x-M.X(0)),dy=M.Y(0)-f.y,reach=Math.min(dims.w,dims.h*1.6)*.55;
      const nth=clamp(Math.round(Math.atan2(dy,dx)*180/Math.PI),5,85),nv=clamp(Math.round(Math.hypot(dx,dy)/reach*40*2)/2,5,40);if(nth!==th)tone(200+nth*6,.03,'sine',.04);th=nth;v=nv;info()},
    up(){if(dragA){dragA=null;fire()}else fire()}});
  /* The ball's position is the exact formula at each moment. Collisions are checked every 4 ms of flight time,
     so a fast ball on a slow screen can no longer skip through the wall or the target between frames. */
  function step(dt){if(!shot||shot.done)return;const s=shot,r=rad(s.th),T1=s.t+dt*1.4;let hitT=false,hitW=false;
    while(s.t<T1&&!hitT&&!hitW&&s.y>=0){s.t=Math.min(T1,s.t+.004);s.x=s.v*Math.cos(r)*s.t;s.y=s.v*Math.sin(r)*s.t-.5*grav*s.t*s.t;
      hitT=Math.hypot(s.x-target.x,s.y-(target.y+(target.kind==='castle'?target.r*.8:0)))<target.r+.6;
      hitW=!!wall&&Math.abs(s.x-wall.x)<.6&&s.y<wall.h}
    s.pts.push([s.x,s.y]);
    if(frame%3===0)info();
    if(hitT||hitW||s.y<0){s.done=true;if(s.y<0){s.y=0;s.x=s.v*s.v*Math.sin(2*r)/grav}trails.push(s);if(trails.length>5)trails.shift();
      for(let i=0;i<30;i++){const a=Math.random()*6.28,sp=Math.random()*5;boom.push({x:M.X(s.x),y:M.Y(s.y),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,l:1,c:hitT?pick(['#FFC83D','#FF4F7B','#FF8A2B']):'#C9B48A'})}
      if(hitT){noise(.7,400,.5,.5,0,80,'lowpass');target.hit=true;const lv=lvl;g.later(()=>{if(lvl!==lv)return;win(stage,null,null,showPath?'Bullseye!':'Bullseye! No path!');if(!showPath)addStar();lvl++;g.later(()=>{if(lvl===lv+1)newLevel()},2000)},300)}
      else{noise(.3,300,1,.2);ui.hint(hitW?'Bonk! The wall is in the way. Try a higher angle.':`Landed at ${fmt(s.x,1)} m. The target is at ${target.x} m.`,3500)}info()}}
  function draw(){const W=dims.w,H=dims.h;view();ctx.setTransform(dims.d,0,0,dims.d,0,0);
    const sky=ctx.createLinearGradient(0,0,0,H),bgs={earth:['#9FD8FF','#E8F7FF'],moon:['#14102E','#3B3770'],mars:['#E39A6B','#F7D3B5'],jup:['#C98B4F','#F4D9B0']}[PLANETS[gi][0]];
    sky.addColorStop(0,bgs[0]);sky.addColorStop(1,bgs[1]);ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    ctx.fillStyle=gi===1?'#8E8E9E':gi===2?'#B4532C':gi===3?'#8B5A2B':'#5DBB63';ctx.fillRect(0,M.Y(0),W,H-M.Y(0));
    // distance ticks
    ctx.fillStyle='rgba(29,24,66,.7)';ctx.font='800 11px Nunito,system-ui';ctx.textAlign='center';const stp=M.sc<6?20:10;for(let x=0;M.X(x)<W&&x<5000;x+=stp){ctx.fillRect(M.X(x)-1,M.Y(0),2,8);ctx.fillText(x+' m',M.X(x),M.Y(0)+20)}
    // predicted path
    if(showPath){ctx.fillStyle='rgba(29,24,66,.45)';const T=tof(),r=rad(th);for(let i=0;i<=40;i++){const t=T*i/40,x=v*Math.cos(r)*t,y=v*Math.sin(r)*t-.5*grav*t*t;ctx.beginPath();ctx.arc(M.X(x),M.Y(y),2.5,0,7);ctx.fill()}
      ctx.strokeStyle=ORG;ctx.setLineDash([5,5]);ctx.lineWidth=1.5;const hx=range()/2;ctx.beginPath();ctx.moveTo(M.X(hx),M.Y(0));ctx.lineTo(M.X(hx),M.Y(hmax()));ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=ORG;ctx.font='900 12px Nunito';ctx.fillText(`H = ${fmt(hmax(),1)} m`,M.X(hx),M.Y(hmax())-8);ctx.fillStyle=GRN;ctx.fillText(`R = ${fmt(range(),1)} m`,M.X(range()),M.Y(0)-10)}
    // old shots
    trails.forEach((s,i)=>{ctx.strokeStyle=`rgba(232,56,79,${.25+.12*i})`;ctx.lineWidth=3;ctx.beginPath();s.pts.forEach(([x,y],j)=>j?ctx.lineTo(M.X(x),M.Y(y)):ctx.moveTo(M.X(x),M.Y(y)));ctx.stroke();
      ctx.fillStyle='rgba(29,24,66,.7)';ctx.font='800 11px Nunito';ctx.fillText(`${s.th}°`,M.X(s.pts[s.pts.length-1][0]),M.Y(0)-6)});
    // wall + target
    if(wall){ctx.fillStyle='#8A8FA8';ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.fillRect(M.X(wall.x)-6,M.Y(wall.h),12,wall.h*M.sc);ctx.strokeRect(M.X(wall.x)-6,M.Y(wall.h),12,wall.h*M.sc)}
    if(target){const x=M.X(target.x),y=M.Y(target.y),R=target.r*M.sc;
      if(target.kind==='castle'){if(!target.hit){ctx.fillStyle='#E0664F';ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.fillRect(x-R,y-R*1.6,R*2,R*1.6);ctx.strokeRect(x-R,y-R*1.6,R*2,R*1.6);
        for(let k=-1;k<=1;k+=2){ctx.fillRect(x+k*R*.66-R*.3,y-R*2.1,R*.6,R*.5);ctx.strokeRect(x+k*R*.66-R*.3,y-R*2.1,R*.6,R*.5)}ctx.fillStyle='#FFC83D';ctx.beginPath();ctx.moveTo(x,y-R*2.6);ctx.lineTo(x+R*.7,y-R*2.35);ctx.lineTo(x,y-R*2.1);ctx.fill();ctx.strokeStyle='#1D1842';ctx.beginPath();ctx.moveTo(x,y-R*1.6);ctx.lineTo(x,y-R*2.6);ctx.stroke()}}
      else if(!target.hit){ctx.strokeStyle='#1D1842';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y+R);ctx.lineTo(x+Math.sin(frame*.05)*4,y+R*3);ctx.stroke();ctx.fillStyle='#FF4F7B';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,R,R*1.15,0,0,7);ctx.fill();ctx.stroke()}
      ctx.fillStyle='#1D1842';ctx.font='900 12px Nunito';ctx.fillText(target.kind==='balloon'?`(${target.x} m, ${target.y} m)`:`${target.x} m`,x,M.Y(target.y)+(target.kind==='balloon'?-R*1.5:18))}
    // cannon
    const cx=M.X(0),cy=M.Y(0),r=rad(th);ctx.save();ctx.translate(cx,cy-6);ctx.rotate(-r);ctx.fillStyle='#2A2550';ctx.beginPath();ctx.roundRect(-6,-11,56,22,8);ctx.fill();ctx.restore();
    ctx.fillStyle='#8B5A2B';ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy-6,16,0,7);ctx.fill();ctx.stroke();
    ctx.strokeStyle=RED;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(cx,cy-6,42,-r,0);ctx.stroke();ctx.fillStyle=RED;ctx.font='900 13px Nunito';ctx.textAlign='left';ctx.fillText(th+'°',cx+46,cy-14);ctx.fillStyle=BLUE;ctx.fillText(`v = ${fmt(v,1)} m/s`,cx+46,cy-32);ctx.textAlign='center';
    // ball + velocity components
    if(shot){const s=shot,bx=M.X(s.x),by=M.Y(s.y);ctx.strokeStyle='rgba(29,24,66,.6)';ctx.lineWidth=2;ctx.beginPath();s.pts.forEach(([x,y],j)=>j?ctx.lineTo(M.X(x),M.Y(y)):ctx.moveTo(M.X(x),M.Y(y)));ctx.stroke();
      if(!s.done){const r2=rad(s.th),vx=s.v*Math.cos(r2),vy=s.v*Math.sin(r2)-grav*s.t,k=2.2;arrow(ctx,bx,by,bx+vx*k,by,RED,3);arrow(ctx,bx,by,bx,by-vy*k,BLUE,3);arrow(ctx,bx,by,bx+vx*k,by-vy*k,'#1D1842',2)}
      ctx.fillStyle='#1D1842';ctx.beginPath();ctx.arc(bx,by,7,0,7);ctx.fill()}
    for(let i=boom.length-1;i>=0;i--){const p=boom[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.2;p.l-=.025;if(p.l<=0){boom.splice(i,1);continue}ctx.globalAlpha=p.l;ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,4,0,7);ctx.fill()}ctx.globalAlpha=1}
  function resize(){dims=fitCanvas(cv)}const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  newLevel();ui.hint('Drag anywhere to aim. Pull farther for more speed. Let go to fire!',5000);
  /* keyboard: up/down angle, left/right power, Space fires */
  g.key(e=>{const big=e.shiftKey?5:1;
    if(e.key==='ArrowUp'||e.key==='ArrowDown'){th=clamp(th+(e.key==='ArrowUp'?big:-big),5,85);syncSl();info();tone(200+th*6,.03,'sine',.04);return true}
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){v=clamp(v+(e.key==='ArrowRight'?.5:-.5)*big,5,40);syncSl();info();tone(300+v*15,.03,'sine',.04);return true}
    if(e.key===' '||e.key==='Enter'){fire();return true}const k=e.key.toLowerCase();
    if(k==='p'){stage.querySelector('#path').click();return true}if(k==='n'){stage.querySelector('#skip').click();return true}
    if(/^[1-4]$/.test(k)){setPlanet(PLANETS[+k-1][0]);return true}return false});
  let last=performance.now();g.loop(()=>{frame++;const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;step(dt);draw()});
  GAMES.cannon._debug={get target(){return target},get wall(){return wall},set(a,b){th=a;v=b;syncSl();info()},fire,get shot(){return shot},grav:()=>grav,setPlanet,get lvl(){return lvl},range,hmax,tof};
}}});
