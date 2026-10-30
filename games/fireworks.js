/* ============================================================
   FIREWORKS — tap the sky: colors, shapes and counting
   ============================================================ */
Object.assign(GAMES,{fireworks:{title:'Firework Sky',icon:'🎆',c:'var(--berry)',age:'2+',order:2,blurb:'Tap for colors, shapes and counting fireworks',
init(stage,g){
  const COLS=[['red','#FF4F5E'],['orange','#FF9A3D'],['yellow','#FFD93D'],['green','#3FE07A'],['blue','#4F8BFF'],['purple','#B278FF'],['pink','#FF7FC8']];
  const SHAPES=['circle','heart','star','square','triangle','smiley'];
  stage.innerHTML=`<div class="simwrap"><div class="simarea"><canvas class="simcv" aria-label="Night sky"></canvas><div class="simhint" id="hint"></div></div>
    <div class="dock"><div class="drow"><button class="opt on" data-m="colors"><span class="oe">🌈</span>Colors</button><button class="opt" data-m="shapes"><span class="oe">⭐</span>Shapes</button><button class="opt" data-m="count"><span class="oe">🔢</span>Counting</button>
    <span class="otext">Tap the sky! Drag your finger for sparkles.</span></div></div></div>`;
  const cv=stage.querySelector('canvas'),ctx=cv.getContext('2d'),hintEl=stage.querySelector('#hint');
  const hint=makeHint(hintEl);
  let dims=fitCanvas(cv),W=dims.w,H=dims.h,mode='colors',count=0,frame=0,shapeI=0,colorI=0;
  const rockets=[],sparks=[];let city=[],stars=[];
  function setup(){W=dims.w;H=dims.h;city=[];let x=0;while(x<W){const w=30+Math.random()*60,h=30+Math.random()*90;city.push([x,w,h,Math.random()]);x+=w}
    stars=[];for(let i=0;i<Math.round(W*H/5000);i++)stars.push([Math.random()*W,Math.random()*H*.7,Math.random()*6])}
  setup();
  function shapePts(kind,n){const pts=[];
    const edge=(vs)=>{const per=[];let L=0;for(let i=0;i<vs.length;i++){const a=vs[i],b=vs[(i+1)%vs.length];const l=Math.hypot(b[0]-a[0],b[1]-a[1]);per.push([a,b,l]);L+=l}
      for(let k=0;k<n;k++){let t=k/n*L;for(const [a,b,l] of per){if(t<=l){pts.push([a[0]+(b[0]-a[0])*t/l,a[1]+(b[1]-a[1])*t/l]);break}t-=l}}};
    if(kind==='circle')for(let k=0;k<n;k++){const a=k/n*6.283;pts.push([Math.cos(a),Math.sin(a)])}
    if(kind==='heart')for(let k=0;k<n;k++){const t=k/n*6.283;pts.push([16*Math.sin(t)**3/17,-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/17])}
    if(kind==='star'){const vs=[];for(let i=0;i<10;i++){const r=i%2?.42:1,a=-Math.PI/2+i*Math.PI/5;vs.push([Math.cos(a)*r,Math.sin(a)*r])}edge(vs)}
    if(kind==='square')edge([[-.8,-.8],[.8,-.8],[.8,.8],[-.8,.8]]);
    if(kind==='triangle')edge([[0,-.95],[.9,.7],[-.9,.7]]);
    if(kind==='smiley'){const m=Math.floor(n*.6);for(let k=0;k<m;k++){const a=k/m*6.283;pts.push([Math.cos(a),Math.sin(a)])}
      for(let k=0;k<n-m-10;k++){const a=.2*Math.PI+k/(n-m-10)*.6*Math.PI;pts.push([Math.cos(a)*.55,Math.sin(a)*.55])}
      for(let k=0;k<5;k++){pts.push([-.35+Math.cos(k*1.25)*.07,-.3+Math.sin(k*1.25)*.07]);pts.push([.35+Math.cos(k*1.25)*.07,-.3+Math.sin(k*1.25)*.07])}}
    return pts}
  function launch(tx,ty){ty=Math.min(ty,H*.62);if(rockets.length>12)return;rockets.push({x:tx+(Math.random()-.5)*40,y:H+10,tx,ty,t:0,col:null});tone(300,.6,'sine',.06,0,1400);noise(.5,2000,1,.04,0,6000)}
  function explode(r){
    const s=Math.min(W,H)*(.16+Math.random()*.06);let label='',speakT='';
    if(mode==='colors'){const c=COLS[colorI++%COLS.length];ring(r.x,r.y,s,c[1],'circle',90);label=c[0];speakT=c[0]}
    if(mode==='shapes'){const sh=SHAPES[shapeI++%SHAPES.length],c=pick(COLS);ring(r.x,r.y,s,c[1],sh,110);label=sh;speakT='A '+sh+'!'}
    if(mode==='count'){count=count%10+1;const n=count,cs=COLS.slice();for(let k=0;k<n;k++){const a=-Math.PI/2+k/n*6.283,d=n===1?0:s*.75;
        const ex=r.x+Math.cos(a)*d,ey=r.y+Math.sin(a)*d;g.later(()=>{ring(ex,ey,s*.32,cs[k%cs.length][1],'circle',36);tone(500+k*60,.12,'triangle',.12)},k*170)}
      label=String(n);speakT=NUMW[n];if(n===10){g.later(()=>{addStar();say('Ten! You counted to ten!')},n*170+900)}}
    const rc=cv.getBoundingClientRect();floaty(stage,rc.left+r.x,rc.top+r.y-s-20,label.charAt(0).toUpperCase()+label.slice(1));say(speakT);
    noise(.9,900,.4,.45,0,60,'lowpass');tone(70,.5,'sine',.3,0,40);
    for(let k=0;k<6;k++)g.later(()=>noise(.04,3000+Math.random()*3000,2,.08),600+Math.random()*700);
  }
  function ring(x,y,s,col,shape,n){for(const [px,py] of shapePts(shape,n))sparks.push({x,y,tx:x+px*s,ty:y+py*s,vx:0,vy:0,l:1,c:col,form:28,r:3.2})
    for(let k=0;k<26;k++){const a=Math.random()*6.283,v=Math.random()*2;sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:.8,c:'#FFF6D0',r:1.6})}}
  fingers(cv,{down(f){f.data.lx=f.x;f.data.ly=f.y;launch(f.x,f.y)},move(f){
    for(let k=0;k<3;k++)sparks.push({x:f.x,y:f.y,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,l:.7,c:pick(COLS)[1],r:1.8});
    if(frame%3===0)tone(1800+Math.random()*1500,.04,'sine',.025)},up(f){if(Math.hypot(f.x-f.sx,f.y-f.sy)>40)hint('Sparkly!',1200)}});
  stage.querySelector('.drow').addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(!b)return;mode=b.dataset.m;count=0;
    stage.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x===b));say({colors:'Colors!',shapes:'Shapes!',count:'Let us count!'}[mode]);tone(600,.08,'triangle')});
  function draw(){
    ctx.setTransform(dims.d,0,0,dims.d,0,0);ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(14,10,46,.28)';ctx.fillRect(0,0,W,H);
    for(const s of stars){ctx.fillStyle=`rgba(255,255,255,${.3+.5*Math.abs(Math.sin(frame*.02+s[2]))})`;ctx.fillRect(s[0],s[1],1.6,1.6)}
    ctx.globalCompositeOperation='lighter';
    for(const r of rockets){ctx.fillStyle='#FFE7A8';ctx.beginPath();ctx.arc(r.x,r.y,3,0,7);ctx.fill()}
    for(const p of sparks){ctx.globalAlpha=Math.max(0,p.l);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.r*(p.l*.5+.6),0,7);ctx.fill()}
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#0B0826';for(const [x,w,h,q] of city){ctx.fillRect(x,H-h,w+1,h);ctx.fillStyle='#FFD93D';for(let wy=H-h+8;wy<H-8;wy+=14)for(let wx=x+6;wx<x+w-8;wx+=12){if(((wx*7+wy*3)|0)%5===0)ctx.fillRect(wx,wy,4,6)}ctx.fillStyle='#0B0826'}
  }
  function resize(){const nd=fitCanvas(cv);if(Math.abs(nd.w-W)<2&&Math.abs(nd.h-H)<2&&nd.d===dims.d)return;dims=nd;setup();ctx.fillStyle='#0E0A2E';ctx.fillRect(0,0,W,H)}
  const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  ctx.fillStyle='#0E0A2E';ctx.fillRect(0,0,W,H);
  hint('Tap the sky to launch a firework!',4000);
  g.later(()=>{if(!rockets.length&&!sparks.length)launch(W*.5,H*.35)},900);
  g.key(e=>{if(e.key===' '||e.key==='Enter'){launch(W*(.15+Math.random()*.7),H*(.15+Math.random()*.4));return true}
    const m={c:'colors',s:'shapes',n:'count'}[e.key.toLowerCase()];if(m){stage.querySelector(`[data-m="${m}"]`).click();return true}return false});
  GAMES.fireworks._debug={get rockets(){return rockets},get sparks(){return sparks},get count(){return count},get mode(){return mode}};
  g.loop(()=>{frame++;
    for(let i=rockets.length-1;i>=0;i--){const r=rockets[i];r.t+=.028;const e=1-(1-r.t)**2;const sx=r.x,sy=r.y;r.y=lerp(H+10,r.ty,e);r.x=lerp(r.x,r.tx,.06);
      sparks.push({x:sx,y:sy,vx:(Math.random()-.5),vy:1+Math.random(),l:.5,c:'#FFB45C',r:1.6});if(r.t>=1){rockets.splice(i,1);explode(r)}}
    for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];
      if(p.form>0){p.form--;p.x+=(p.tx-p.x)*.14;p.y+=(p.ty-p.y)*.14;if(p.form===0){p.vx=(p.tx-p.x)*.1+(Math.random()-.5)*.4;p.vy=(Math.random()-.5)*.4}}
      else{p.vy+=.035;p.vx*=.985;p.vy*=.985;p.x+=p.vx;p.y+=p.vy;p.l-=.012}
      if(p.l<=0)sparks.splice(i,1)}
    if(sparks.length>4000)sparks.splice(0,sparks.length-4000);
    draw()});
}}});
