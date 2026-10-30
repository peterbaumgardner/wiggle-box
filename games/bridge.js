/* ============================================================
   BRIDGE BUILDER — trusses, stress and why triangles win
   ============================================================ */
Object.assign(GAMES,{bridge:{title:'Bridge Builder',icon:'🌉',c:'var(--tang)',age:'7+',section:'lab',order:9,blurb:'Build with triangles. Watch the stress, then send the truck.',
init(stage,g){
  /* gap in grid squares, truck mass in tonnes */
  const LEVELS=[{cells:5,load:1,budget:900},{cells:7,load:1,budget:1200},{cells:8,load:1.6,budget:1500},{cells:9,load:2.2,budget:1700},{cells:10,load:3,budget:2000}];
  /* EA: how hard a beam resists stretching or squashing (in truck-tonnes per unit of strain); lim: the strain where it
     snaps; rho: its own weight per grid square. Steel is twice as stiff and much stronger than wood, and costs more. */
  const MATS={wood:{n:'Wood',c:'#C98B4F',cost:1,EA:500,lim:.0042,rho:.004},steel:{n:'Steel',c:'#8A9BC2',cost:2.2,EA:1000,lim:.01,rho:.01},road:{n:'Road',c:'#3B3770',cost:1.5,EA:500,lim:.0055,rho:.008}};
  let peak=0,li=0,mat='road',nodes=[],beams=[],running=false,truck=null,frame=0,result=null,maxStress=0,spent=0,grid=40,ground=0,L;const drags=new Set();let pend=null;
  const ui=labShell(stage,{label:'Bridge site',top:`${chips('bm',Object.entries(MATS).map(([k,m])=>[k,`${k==='road'?'🛣️':k==='wood'?'🪵':'🔩'} ${m.n}`]),'road')}<button class="opt" data-bm="erase">🧽 Erase</button><span class="sep"></span><span class="lvl" id="lv"></span>
    <button class="pbtn go small" id="go">🚚 Test it!</button><button class="pbtn small" id="stop">✋ Stop</button><button class="pbtn small" id="undo">↩ Undo</button><button class="pbtn small" id="clr">🧹 Clear</button><button class="pbtn small" id="nx">➜ Next</button>`,panel:'<div id="pn"></div>'});
  const {cv,panel}=ui,ctx=cv.getContext('2d');let dims=fitCanvas(cv);
  /* The gap is measured in grid squares when a level starts. Rotating the tablet or opening an info tab only rescales
     the picture: the bridge the child built keeps its shape (it used to be wiped). */
  let cells=0;
  function geo(keep){const W=dims.w,H=dims.h,lv=LEVELS[li%LEVELS.length];const g0=Math.max(26,Math.round(Math.min(W,H)/13));
    if(!keep||!cells)cells=lv.cells;
    grid=Math.max(12,Math.min(g0,Math.floor(W/(cells+4)),Math.floor(H*.62/7)));ground=Math.round(H*.62/grid)*grid;
    const gw=cells*grid;L={x0:Math.round((W/2-gw/2)/grid)*grid,x1:0,W,H,lv};L.x1=L.x0+gw}
  /* forces, speeds and limits are in grid squares, so the same bridge behaves the same on every screen size */
  const PS=()=>grid/40;
  function load(i){li=i;pend=null;cells=0;geo();running=false;truck=null;result=null;
    nodes=[{x:L.x0,y:ground,fixed:true},{x:L.x1,y:ground,fixed:true},{x:L.x0,y:ground+grid*2,fixed:true},{x:L.x1,y:ground+grid*2,fixed:true}];beams=[];reset();
    stage.querySelector('#lv').textContent=`Level ${li%LEVELS.length+1}`;info()}
  function reset(){for(const n of nodes){n.ox??=n.x;n.oy??=n.y;n.x=n.ox;n.y=n.oy;n.px=n.x;n.py=n.y;n.ux=n.uy=n.vx=n.vy=0}for(const b of beams){b.broken=false;b.s=0}truck=null;running=false;result=null;maxStress=0;falling=false}
  const cost=b=>Math.hypot(b.a.ox-b.b.ox,b.a.oy-b.b.oy)/grid*10*MATS[b.m].cost;
  function info(){spent=beams.reduce((s,b)=>s+cost(b),0);const lv=L.lv,tri=countTris();const sel=beams.find(b=>b.sel);
    patchPanel(panel.querySelector('#pn'),`<div class="fx big ${spent>lv.budget?'':'hot'}"><span class="tag">Budget</span><div class="row"><span class="num" style="color:${spent>lv.budget?'#E8384F':'#1FA463'}">$${Math.round(spent)}</span> of $${lv.budget}</div></div>
      <div class="fx"><span class="tag">Stress in a beam</span><div class="row">${V('σ','#E8384F')} = ${frac(V('F','#FF8A2B'),V('A','#2F6FE0'))}</div><div class="row note">force spread over the beam. Too much and it snaps!</div>
        <div class="row"><span class="num" style="color:#E8384F">${running?Math.round(maxStress*100):0}%</span> of its breaking point, worst beam right now</div><div class="row note">Bends are drawn ${AMP}× bigger so you can see them.</div></div>
      <div class="fx"><span class="tag">Triangles</span><div class="row"><span class="num">${tri}</span> triangles in your bridge</div><div class="row note">A triangle cannot change shape without a side changing length. A square can squish flat!</div></div>
      <div class="fx"><span class="tag">Weight of the truck</span><div class="row">${V('W','#9A5BFF')} = ${V('m','#9A5BFF')} × ${V('g','#9A5BFF')} = ${fmt(lv.load*1000,0)} × 9.8 = <span class="num">${fmt(lv.load*9800,0)}</span> N</div></div>
      <div class="fx"><span class="tag">Colors</span><div class="row"><span style="color:#2F6FE0">■ blue = squeezed</span> &nbsp; <span style="color:#E8384F">■ red = stretched</span></div></div>
      <p class="note">Drag from a dot to make a beam. The truck drives on Road pieces only.</p>`)}
  function countTris(){let c=0;const adj=new Map();for(const b of beams){(adj.get(b.a)||adj.set(b.a,new Set()).get(b.a)).add(b.b);(adj.get(b.b)||adj.set(b.b,new Set()).get(b.b)).add(b.a)}
    for(const b of beams){const A=adj.get(b.a),B=adj.get(b.b);for(const n of A)if(B.has(n))c++}return c/3}
  bindChips(ui.top,'bm',k=>{mat=k});
  stage.querySelector('#go').addEventListener('click',()=>{if(running)return;if(spent>L.lv.budget){buzz();ui.hint('Over budget! Remove some beams.');return}reset();running=true;truck={x:Math.max(-grid*1.5,L.x0-grid*5),v:0,on:false};noise(.8,150,.6,.15,0,300)});
  stage.querySelector('#stop').addEventListener('click',()=>{reset();info()});
  stage.querySelector('#clr').addEventListener('click',()=>load(li));
  function undo(){if(running){reset()}const b=beams.pop();if(!b){buzz();return}nodes=nodes.filter(n=>n.fixed||beams.some(q=>q.a===n||q.b===n));tone(380,.08,'triangle');info()}
  stage.querySelector('#undo').addEventListener('click',undo);
  stage.querySelector('#nx').addEventListener('click',()=>load(li+1));
  const snap=(x,y)=>[Math.round(x/grid)*grid,Math.round(y/grid)*grid];
  const nodeAt=(x,y)=>nodes.find(n=>Math.hypot(n.ox-x,n.oy-y)<grid*.4);
  fingers(cv,{down(f){if(running){reset();info()}if(mat==='erase'){erase(f.x,f.y);return}const[x,y]=snap(f.x,f.y);let n=nodeAt(x,y);if(!n&&!nearBuilt(x,y)&&!pend){ui.hint('Start from a dot on the cliff or on your bridge.');return}f.data.d={from:n||null,x:f.x,y:f.y,sx:x,sy:y};drags.add(f.data.d)},
    move(f){if(mat==='erase'){erase(f.x,f.y);return}const d=f.data.d;if(d){d.x=f.x;d.y=f.y}},
    up(f){const dragN=f.data.d;if(!dragN)return;drags.delete(dragN);const[x,y]=snap(f.x,f.y);
      /* tap a dot, then tap where the beam should end: builds it without dragging */
      if(x===dragN.sx&&y===dragN.sy){if(pend&&!(pend.ox===x&&pend.oy===y)){const a=pend;pend=null;addBeam(a,x,y)}else{pend=dragN.from&&pend!==dragN.from?dragN.from:null;if(pend)tone(880,.05,'sine',.08)}return}
      pend=null;if(!dragN.from)return;addBeam(dragN.from,x,y)}});
  function addBeam(a,x,y){if(x===a.ox&&y===a.oy)return;const len=Math.hypot(x-a.ox,y-a.oy)/grid;
      if(len>4.3){buzz();ui.hint('That beam is too long. Beams can be at most 4 squares.');return}if(y>ground+grid*2.1&&!(nodeAt(x,y)?.fixed)){ui.hint('That is underground!');return}
      const b2=nodeAt(x,y)||mk(x,y);if(beams.some(b=>(b.a===a&&b.b===b2)||(b.a===b2&&b.b===a)))return;beams.push({a,b:b2,m:mat,rest:Math.hypot(b2.ox-a.ox,b2.oy-a.oy),s:0});
      tone(mat==='steel'?700:mat==='road'?400:520,.06,'triangle');noise(.05,mat==='steel'?3000:900,2,.08);info()}
  function mk(x,y){const n={x,y,ox:x,oy:y,px:x,py:y,ux:0,uy:0,vx:0,vy:0};nodes.push(n);return n}
  const nearBuilt=(x,y)=>!!nodeAt(x,y);
  function erase(x,y){const before=beams.length;beams=beams.filter(b=>{const ax=b.a.ox,ay=b.a.oy,bx=b.b.ox,by=b.b.oy,l2=(bx-ax)**2+(by-ay)**2,t=clamp(((x-ax)*(bx-ax)+(y-ay)*(by-ay))/l2,0,1);return Math.hypot(x-(ax+(bx-ax)*t),y-(ay+(by-ay)*t))>10});
    nodes=nodes.filter(n=>n.fixed||beams.some(b=>b.a===n||b.b===n));if(beams.length<before){noise(.1,1500,1,.08);info()}}
  /* ---------- physics: a pin-jointed truss ----------
     Every beam is a spring along its length with real stiffness (EA). Each frame the truss settles under the truck's
     weight and its own weight (dynamic relaxation, warm-started from the last frame), using exact beam lengths, so a
     road with nothing holding its joints up has to sag and stretch like a rope, while triangles carry the load with
     tiny stretches. A beam snaps when its strain passes its material's limit. Distances are in grid squares and
     forces in truck-tonnes, so the result is the same on every screen. Bends are tiny, so they are drawn bigger. */
  let falling=false;const AMP=20;
  const restOf=n=>[(n.ox-L.x0)/grid,(n.oy-ground)/grid];
  function wheelLoads(){const out=[];if(!truck||!truck.wb)return out;for(const s of truck.wb)if(s&&s.b&&!s.b.broken)out.push([s.b,s.t,L.lv.load/2]);return out}
  function settle(iter){const live=beams.filter(b=>!b.broken);
    for(const n of nodes){n.kk=0;n.lx=0;n.ly=0;[n.rx,n.ry]=restOf(n);n.ux??=0;n.uy??=0;n.vx??=0;n.vy??=0}
    for(const b of live){const M=MATS[b.m];b.r=b.rest/grid;const k=M.EA/b.r;b.a.kk+=k;b.b.kk+=k;const w=M.rho*b.r/2;b.a.ly+=w;b.b.ly+=w}
    for(const [b,t,w] of wheelLoads()){b.a.ly+=w*(1-t);b.b.ly+=w*t}
    for(let it=0;it<iter;it++){
      for(const n of nodes){n.fx=n.lx;n.fy=n.ly}
      for(const b of live){const A=b.a,B=b.b,dx=B.rx+B.ux-A.rx-A.ux,dy=B.ry+B.uy-A.ry-A.uy,d=Math.hypot(dx,dy)||1e-9,e=(d-b.r)/b.r,T=MATS[b.m].EA*e;
        A.fx+=T*dx/d;A.fy+=T*dy/d;B.fx-=T*dx/d;B.fy-=T*dy/d}
      for(const n of nodes){if(n.fixed||!n.kk)continue;n.vx=n.vx*.9+n.fx/n.kk;n.vy=n.vy*.9+n.fy/n.kk;
        /* a joint with nothing holding it up can only fall so far per step, so a broken bridge comes down, it does not explode */
        const sp=Math.hypot(n.vx,n.vy);if(sp>.05){n.vx*=.05/sp;n.vy*=.05/sp}n.ux+=n.vx;n.uy+=n.vy}}
    maxStress=0;let worst=null,wr=1;
    for(const b of live){const A=b.a,B=b.b,d=Math.hypot(B.rx+B.ux-A.rx-A.ux,B.ry+B.uy-A.ry-A.uy),e=(d-b.r)/b.r,r=Math.abs(e)/MATS[b.m].lim;b.s=e;peak=Math.max(peak,Math.abs(e));maxStress=Math.max(maxStress,r);if(r>wr){wr=r;worst=b}}
    if(worst&&!window.__nobreak){worst.broken=true;noise(.3,worst.m==='steel'?2500:700,1.2,.35);tone(worst.m==='steel'?300:120,.25,'square',.06);shakeEl(cv)}
    /* where to draw each joint: small bends magnified so you can see them, big movements shown as they are */
    for(const n of nodes){const u=Math.hypot(n.ux,n.uy),k=u>1e-9?Math.min(AMP*u,Math.max(.5,u))/u:0;n.x=L.x0+(n.rx+n.ux*k)*grid;n.y=ground+(n.ry+n.uy*k)*grid}}
  /* how far the road really sank under a wheel (grid squares) */
  function sinkAt(s){if(!s||!s.b)return null;const{b,t}=s;return b.a.uy*(1-t)+b.b.uy*t}
  /* after a failure the pieces fall for real (gravity and rigid beams), from where the analysis left them */
  function fall(){const G=.25*PS(),sub=10;
    for(let s=0;s<sub;s++){
      for(const n of nodes){if(n.fixed)continue;const vx=(n.x-n.px)*.995,vy=(n.y-n.py)*.995;n.px=n.x;n.py=n.y;n.x+=vx;n.y+=vy+G/sub*.6}
      for(let it=0;it<3;it++)for(const b of beams){if(b.broken)continue;const dx=b.b.x-b.a.x,dy=b.b.y-b.a.y,d=Math.hypot(dx,dy)||1,diff=(d-b.rest)/d,k=.45;
        const ia=b.a.fixed?0:1,ib=b.b.fixed?0:1,sw=ia+ib;if(!sw)continue;b.a.x+=dx*diff*k*ia/sw*2;b.a.y+=dy*diff*k*ia/sw*2;b.b.x-=dx*diff*k*ib/sw*2;b.b.y-=dy*diff*k*ib/sw*2}}
    for(const n of nodes)if(!n.fixed&&n.y>ground+grid*8){n.y=ground+grid*8;n.py=n.y}}
  function sim(){if(falling){fall();return}settle(160)}
  /* The truck drives along the surface it is on, like a real truck: the ground, then a road piece that joins it, then the
     next. It used to jump onto whichever road was highest above it, so a road floating three squares above the ground
     still carried it across. Now a road has to meet the ground (or the road before it) at the same height, can't be
     steeper than a truck can climb, and a road that ends in mid-air drops the truck. */
  const STEP=.45,MAXSLOPE=Math.tan(35*Math.PI/180);
  function surfaces(x){const out=[];if(x<=L.x0||x>=L.x1)out.push({y:ground,b:null});
    for(const b of beams){if(b.broken||b.m!=='road')continue;const x0=Math.min(b.a.x,b.b.x),x1=Math.max(b.a.x,b.b.x);
      if(x>=x0&&x<=x1&&x1>x0){const t=(x-b.a.x)/(b.b.x-b.a.x);out.push({b,t,y:b.a.y+(b.b.y-b.a.y)*t})}}
    return out}
  const steep=b=>b&&Math.abs(b.b.oy-b.a.oy)>MAXSLOPE*Math.abs(b.b.ox-b.a.ox);
  function wheel(i,x){const prev=truck.wy[i],all=surfaces(x);let best=null;
    for(const s of all){const d=Math.abs(s.y-prev);if(d<=grid*STEP&&(!best||d<Math.abs(best.y-prev)))best=s}
    if(best){truck.wy[i]=best.y;truck.wb[i]=best;return 'ok'}
    truck.wb[i]=null;
    if(all.some(s=>s.y<prev-grid*STEP))return 'wall';                     // something to climb, but it is a cliff
    const below=all.filter(s=>s.y>prev).sort((a,b)=>a.y-b.y)[0];
    if(below&&x>L.x0&&x<L.x1)return 'drop';
    return below?'crash':'drop'}
  function failTruck(msg){result='fail';falling=true;for(const n of nodes){n.px=n.x;n.py=n.y}
    ui.hint(msg,4500);buzz();g.later(()=>{if(result==='fail'){reset();info()}},2500)}
  function driveTruck(){if(!truck||result)return;if(!truck.wy){truck.wy=[ground,ground];truck.wb=[null,null]}
    truck.v=Math.min(truck.v+.05*PS(),2.2*PS());truck.x+=truck.v;
    const st=[wheel(0,truck.x-grid*.9),wheel(1,truck.x+grid*.9)];
    if(st.includes('wall')){truck.x-=truck.v;return failTruck('Bump! The road has to start at the ground. Trucks can\'t jump up onto it.')}
    if(truck.wb.some(s=>s&&steep(s.b)))return failTruck('Too steep! A truck can only drive up a gentle slope.');
    if(st.includes('crash'))return failTruck('Crash! The road ends up in the air. Bring it back down to the ground.');
    if(st.includes('drop')){truck.fall=(truck.fall||0)+1;for(let i=0;i<2;i++)if(!truck.wb[i])truck.wy[i]+=grid*.25*truck.fall}else truck.fall=0;
    truck.y=(truck.wy[0]+truck.wy[1])/2;truck.a=Math.atan2(truck.wy[1]-truck.wy[0],grid*1.8);
    const sunk=Math.max(sinkAt(truck.wb[0])??0,sinkAt(truck.wb[1])??0);
    if(truck.fall>4||sunk>.8||truck.y>ground+grid*3)return failTruck('Splash! The bridge was not strong enough. Add triangles or steel!');
    if(truck.x>Math.min(L.W+grid*1.5,L.x1+grid*5)){result='win';const lv=L.lv,stars=spent<lv.budget*.7?'Cheap and strong!':'It held!',was=li;win(stage,null,null,stars);g.later(()=>{if(li===was&&result==='win')load(li+1)},2600)}
    if(frame%8===0)noise(.1,120+truck.v/PS()*30,.6,.05)}
  /* ---------- draw ---------- */
  function draw(){const W=L.W,H=L.H;ctx.setTransform(dims.d,0,0,dims.d,0,0);const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#8FD3FF');sky.addColorStop(1,'#E8F7FF');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#3E8FD6';ctx.fillRect(L.x0,H*.86,L.x1-L.x0,H*.14);ctx.fillStyle='rgba(255,255,255,.3)';for(let x=L.x0;x<L.x1;x+=40)ctx.fillRect(x+(frame%40),H*.88,18,3);
    ctx.fillStyle='#7A5A3A';ctx.fillRect(0,ground,L.x0,H-ground);ctx.fillRect(L.x1,ground,W-L.x1,H-ground);ctx.fillStyle='#5DBB63';ctx.fillRect(0,ground-8,L.x0,10);ctx.fillRect(L.x1,ground-8,W-L.x1,10);
    // build grid
    if(!running){ctx.fillStyle='rgba(29,24,66,.18)';for(let x=L.x0-grid*2;x<=L.x1+grid*2;x+=grid)for(let y=ground-grid*6;y<=ground+grid*2;y+=grid){ctx.beginPath();ctx.arc(x,y,2.5,0,7);ctx.fill()}}
    for(const b of beams){if(b.broken)continue;const M=MATS[b.m],w=b.m==='road'?grid*.28:grid*.18;let col=M.c;
      if(running){const r=clamp(b.s/M.lim,-1,1);col=r>0?`rgb(${200+55*r},${120-100*r},${100-80*r})`:`rgb(${120+90*r},${150+30*r},${230})`}
      ctx.strokeStyle='#1D1842';ctx.lineCap='round';ctx.lineWidth=w+4;ctx.beginPath();ctx.moveTo(b.a.x,b.a.y);ctx.lineTo(b.b.x,b.b.y);ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke();
      if(b.m==='road'&&!running){ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.setLineDash([8,8]);ctx.stroke();ctx.setLineDash([])}}
    for(const n of nodes){ctx.fillStyle=n.fixed?'#E8384F':'#fff';ctx.strokeStyle='#1D1842';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(n.x,n.y,n.fixed?8:6,0,7);ctx.fill();ctx.stroke()}
    if(pend&&!running){const r=10+Math.sin(performance.now()/160)*3;ctx.strokeStyle='#FFB020';ctx.lineWidth=4;ctx.beginPath();ctx.arc(pend.ox,pend.oy,r,0,7);ctx.stroke();ctx.setLineDash([6,6]);ctx.strokeStyle='rgba(255,176,32,.6)';ctx.beginPath();ctx.arc(pend.ox,pend.oy,grid*4.3,0,7);ctx.stroke();ctx.setLineDash([])}
    for(const dragN of drags){const a=dragN.from||{x:dragN.sx,y:dragN.sy},[x,y]=snap(dragN.x,dragN.y),ok=Math.hypot(x-a.x,y-a.y)/grid<=4.3;ctx.strokeStyle=ok?MATS[mat==='erase'?'wood':mat].c:'#E8384F';ctx.lineWidth=grid*.2;ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(x,y);ctx.stroke();ctx.globalAlpha=1;
      ctx.fillStyle='#1D1842';ctx.font='900 13px Nunito';ctx.fillText(`${fmt(Math.hypot(x-a.x,y-a.y)/grid,1)} m · $${Math.round(Math.hypot(x-a.x,y-a.y)/grid*10*(MATS[mat]?.cost||1))}`,x+12,y-12)}
    if(truck){const s=grid/40;ctx.save();ctx.translate(truck.x,(truck.y??ground)-grid*.55);ctx.rotate(truck.a||0);ctx.fillStyle='#FF8A2B';ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-grid*1.3,-grid*.9,grid*1.8,grid*.95,6*s);ctx.fill();ctx.stroke();
      ctx.fillStyle='#FFC83D';ctx.beginPath();ctx.roundRect(grid*.55,-grid*.7,grid*.75,grid*.75,6*s);ctx.fill();ctx.stroke();ctx.fillStyle='#BDEFFF';ctx.fillRect(grid*.75,-grid*.58,grid*.4,grid*.28);
      ctx.fillStyle='#1D1842';ctx.font=`900 ${grid*.38}px Nunito`;ctx.textAlign='center';ctx.fillText(`${L.lv.load} t`,-grid*.4,-grid*.25);ctx.textAlign='left';
      for(const wx of [-grid*.9,grid*.9]){ctx.fillStyle='#2A2550';ctx.beginPath();ctx.arc(wx,grid*.15,grid*.26,0,7);ctx.fill()}ctx.restore()}}
  function resize(){const nd=fitCanvas(cv);const ch=Math.abs(nd.w-dims.w)>2||Math.abs(nd.h-dims.h)>2;dims=nd;if(!ch||!L)return;
    /* remember every dot in grid squares, rescale, put them back */
    const ox0=L.x0,og=ground,ogr=grid;const cellsOf=n=>[Math.round((n.ox-ox0)/ogr),Math.round((n.oy-og)/ogr)];const keep=nodes.map(cellsOf);
    geo(true);nodes.forEach((n,i)=>{const[cx,cy]=keep[i];n.ox=L.x0+cx*grid;n.oy=ground+cy*grid});
    for(const b of beams)b.rest=Math.hypot(b.b.ox-b.a.ox,b.b.oy-b.a.oy);if(pend&&!nodes.includes(pend))pend=null;reset();info()}
  const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  kbPointer(g,cv);
  g.key(e=>{const k=e.key.toLowerCase();const m={1:'road',2:'wood',3:'steel',x:'erase'}[k];if(m){ui.top.querySelector(`[data-bm="${m}"]`).click();return true}
    if(k==='z'||k==='backspace'){undo();return true}if(k==='t'||(k==='enter'&&!document.querySelector('.kcur:not([hidden])'))){stage.querySelector('#go').click();return true}
    if(k==='n'){stage.querySelector('#nx').click();return true}return false});
  load(0);ui.hint('Drag from the red dots to build. Make triangles, then test it!',5500);
  g.loop(()=>{frame++;if(running){sim();driveTruck();if(frame%6===0)info()}draw()});
  GAMES.bridge._debug={peak:()=>peak,get nodes(){return nodes},get beams(){return beams},L:()=>L,grid:()=>grid,addBeam(ax,ay,bx,by,m){const a=nodeAt(ax,ay)||mk(ax,ay),b=nodeAt(bx,by)||mk(bx,by);beams.push({a,b,m,rest:Math.hypot(bx-ax,by-ay),s:0});info()},go(){stage.querySelector('#go').click()},get result(){return result},load};
}}});
