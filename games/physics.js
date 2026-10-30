/* ============================================================
   PHYSICS LAB — Matter.js sandbox with a custom renderer
   ============================================================ */
const MATTER_URL='matter.min.js';
/* Loads the physics engine once. If a load failed (offline before the app was cached), the next attempt really
   retries instead of waiting forever on the dead script tag. */
function loadMatter(ok,fail){
  if(window.Matter)return ok();
  let s=document.querySelector('script[data-matter]');
  if(s&&s.dataset.failed){s.remove();s=null}
  if(!s){s=document.createElement('script');s.src=MATTER_URL;s.dataset.matter='1';s.addEventListener('error',()=>{s.dataset.failed='1'},{once:true});document.head.appendChild(s)}
  s.addEventListener('load',ok,{once:true});s.addEventListener('error',fail,{once:true});
}
Object.assign(GAMES,{physics:{title:'Physics Lab',icon:'🧲',c:'var(--sun)',age:'3+',section:'lab',order:2,blurb:'Build, crash, launch and solve puzzles',
init(stage,g){
  stage.innerHTML='<div class="loading">Getting the lab ready…</div>';
  const tryLoad=()=>loadMatter(()=>{if(g.alive)physicsLab(stage,g)},()=>{if(!g.alive)return;stage.innerHTML='<div class="loading"><div>The physics engine could not load.<br>Check the internet connection, then <button class="pbtn go" id="retry">Try again</button></div></div>';
    stage.querySelector('#retry').addEventListener('click',()=>{stage.innerHTML='<div class="loading">Getting the lab ready…</div>';tryLoad()})});
  tryLoad();
}}});

function physicsLab(stage,g){
  const {Engine,Bodies,Body,Composite,Constraint,Query,Events,Vector,Sleeping}=Matter;
  const wake=b=>{if(b&&b.isSleeping)Sleeping.set(b,false)};const wakeAll=()=>Composite.allBodies(world).forEach(wake);
  const CC=o=>{const w=o.plugin&&o.plugin.wb;delete o.plugin;const c=Constraint.create(o);c.plugin={wb:w||{}};return c};
  const TOOLS=[['grab','✋','Grab'],['add','➕','Add'],['ramp','📏','Ramp'],['shape','✏️','Draw'],['pin','📌','Pin'],['boom','💥','Boom'],['erase','🧽','Erase']];
  const SCENES=[['play','🛝','Playground'],['domino','🁢','Dominoes'],['tower','🏰','Tower'],['cars','🏁','Race'],['puzzle','🧩','Puzzles'],['empty','🧹','Empty']];
  const GRAV=[['earth','🌍','Earth',1,'On Earth, things fall down.'],['moon','🌙','Moon',.165,'On the Moon, gravity is only 1/6 as strong and there is no air. Things fall slowly, and even balloons fall!'],['space','🚀','Space',0,'In space, there is no gravity. Everything floats!'],['flip','🙃','Upside down',-1,'Upside down! Now things fall up!']];
  const ITEMS=[
    ['ball','⚽','Bouncy ball','Rubber is bouncy!'],['crate','📦','Crate','Wood!'],['brick','🧱','Brick','Stone is heavy!'],['ice','🧊','Ice block','Ice is slippery!'],
    ['tri','🔺','Triangle','A triangle!'],['plank','🪵','Plank','A long plank!'],['balloon','🎈','Balloon','Balloons float up!'],['buddy','🙂','Bloop','Hi, I am Bloop!'],
    ['car','🚗','Car','Vroom!'],['rocket','🚀','Rocket','Three, two, one, blast off!'],['bomb','💣','Bomb','Careful! It goes boom!'],['domino','🁢','Dominoes','Push the first one!'],
    ['tower','🏰','Tower','A tall tower!'],['rope','🪢','Swing','Swing it!'],['seesaw','⚖️','Seesaw','Up and down!'],['fan','🌀','Fan','Fans push air!'],['tramp','🤸','Trampoline','Boing!']];
  const COLORS=['#FF4F7B','#FFC83D','#24C786','#2FE0E8','#B78CFF','#FF8A2B','#FF9AD5','#9BEA6E','#FFFFFF'];
  const MAT={
    wood:{density:.002,friction:.6,restitution:.12,snd:'wood'},rubber:{density:.0012,friction:.9,restitution:.82,snd:'boing'},
    stone:{density:.006,friction:.8,restitution:.04,snd:'thud'},ice:{density:.0018,friction:0,frictionStatic:0,restitution:.15,snd:'tink'},
    metal:{density:.004,friction:.5,restitution:.2,snd:'clank'},soft:{density:.0015,friction:.8,restitution:.3,snd:'oof'},air:{density:.0004,friction:.3,restitution:.6,frictionAir:.03,snd:'squeak'}};

  stage.innerHTML=`<div class="simwrap"><div class="simarea"><canvas class="simcv" aria-label="Physics play area"></canvas><div class="simhint" id="hint"></div>
      <div class="puzhud" id="puz" hidden><span class="plv" id="plv"></span><button class="pbtn go" id="pgo">▶ Go!</button><button class="pbtn" id="preset">↺ Try again</button><button class="pbtn" id="pnext">Next ➜</button></div></div>
    <div class="dock"><div class="drow wrap" id="tools">
      ${TOOLS.map(t=>`<button class="tool" data-t="${t[0]}"${t[0]==='add'?' aria-haspopup="menu"':''}><span class="ti">${t[1]}</span>${t[2]}${t[0]==='add'?'<span class="caret">▾</span>':''}</button>`).join('')}<span class="sep"></span>
      <button class="tool" id="grav"><span class="ti">🌍</span>Earth</button><button class="tool" id="slow"><span class="ti">🐢</span>Slow-mo</button><button class="tool" id="pause"><span class="ti">⏸️</span>Freeze</button><span class="sep"></span>
      <button class="tool scene" id="scenes" aria-haspopup="menu"><span class="ti">🎬</span>Scenes<span class="caret">▾</span></button></div></div></div>`;
  const cv=stage.querySelector('canvas'),ctx=cv.getContext('2d'),hintEl=stage.querySelector('#hint');
  const puzEl=stage.querySelector('#puz');
  const ov=fxOverlay(stage.querySelector('.simarea'));let focus=null,eMax=0;
  /* the engine accelerates at GS*1e6 px/s^2 when gravity is 1, so this many pixels make one meter at Earth's 9.8 m/s^2 */
  const PXM=.0015*1e6/9.8;  /* = 153 px per meter, matches GS below */
  function ovUpdate(){const b=focus&&Composite.allBodies(world).includes(focus)?focus:null;const gEff=Math.abs(engine.gravity.y)*GS*1e6/PXM;
    if(!b){ov.set(`<div class="fx hot"><span class="tag">Measure it</span><div class="row">Grab anything to see its numbers.</div></div>
      <div class="fx"><span class="tag">Newton's 2nd law</span><div class="row">${V('F','#E8384F')} = ${V('m','#1D1842')} × ${V('a','#2F6FE0')}</div><div class="row note">Push harder, it speeds up faster. Heavier things need a bigger push.</div></div>`);return}
    const ts=engine.timing.timeScale||1,m=b.mass,v=Math.hypot(b.velocity.x,b.velocity.y)*60/ts/PXM,h=Math.max(0,(H-b.position.y)/PXM),ke=.5*m*v*v,pe=m*gEff*h,tot=ke+pe;eMax=Math.max(eMax*.995,tot,1);
    const bar=(x,c)=>`<span style="display:inline-block;height:12px;width:${Math.round(clamp(x/eMax,0,1)*150)}px;background:${c};border:2px solid #1D1842;border-radius:6px;vertical-align:middle"></span>`;
    ov.set(`<div class="fx hot"><span class="tag">This ${(wbOf(b).kind||'thing').replace('head','buddy').replace('limb','buddy')}</span>
        <div class="row">${V('m','#1D1842')} = <span class="num">${fmt(m,1)}</span> kg &nbsp; ${V('v','#2F6FE0')} = <span class="num" style="color:#2F6FE0">${fmt(v,1)}</span> m/s</div><div class="row">${V('h','#1FA463')} = <span class="num" style="color:#1FA463">${fmt(h,1)}</span> m up</div></div>
      <div class="fx"><span class="tag">Moving energy</span><div class="row">KE = ½${V('m','#1D1842')}${V('v','#2F6FE0')}² = <span class="num">${fmt(ke,0)}</span> J</div><div class="row">${bar(ke,'#2F6FE0')}</div></div>
      <div class="fx"><span class="tag">Height energy</span><div class="row">PE = ${V('m','#1D1842')}${V('g','#9A5BFF')}${V('h','#1FA463')} = <span class="num">${fmt(pe,0)}</span> J</div><div class="row">${bar(pe,'#1FA463')}</div><div class="row note">Drop it! Height energy turns into moving energy.</div></div>
      <div class="fx"><span class="tag">Momentum</span><div class="row">${V('p','#E8384F')} = ${V('m','#1D1842')}${V('v','#2F6FE0')} = <span class="num">${fmt(m*v,0)}</span> kg·m/s</div><div class="row note">gravity here ${V('g','#9A5BFF')} = ${fmt(gEff,2)} m/s²</div></div>`)}
  let dims=fitCanvas(cv),W=dims.w,H=dims.h,u=clamp(Math.min(W,H)/12,26,58);
  const hint=makeHint(hintEl);

  const engine=Engine.create({positionIterations:12,velocityIterations:10,constraintIterations:4,enableSleeping:true});const world=engine.world;const GS=.0015;engine.gravity.scale=GS;
  let tool='grab',item='ball',gi=0,slow=false,paused=false,frame=0,shake=0;
  const parts=[],pins=[];let inks=[];   // fx particles, pins, ink strokes (static ramps)

  /* ---------- boundaries ---------- */
  const B={};
  function bounds(){
    for(const k in B)Composite.remove(world,B[k]);
    const o={isStatic:true,friction:.8,plugin:{wb:{kind:'bound'}}};
    B.floor=Bodies.rectangle(W/2,H+200,W*4,400,o);B.left=Bodies.rectangle(-200,H/2-H,400,H*4,o);B.right=Bodies.rectangle(W+200,H/2-H,400,H*4,o);
    B.top=Bodies.rectangle(W/2,-200,W*4,400,o);
    Composite.add(world,Object.values(B));
  }
  bounds();
  const tag=(b,wb)=>{b.plugin=b.plugin||{};b.plugin.wb=Object.assign({born:frame},wb);return b};
  const wbOf=b=>(b.parent||b).plugin&&(b.parent||b).plugin.wb||{};
  /* real air barely slows a falling ball; the engine default (1% speed lost every frame) drained energy far too fast */
  const opts=(m,extra)=>Object.assign({frictionAir:.0015},MAT[m],extra||{});

  /* ---------- makers ---------- */
  const MK={
    ball(x,y){return roller(tag(Bodies.circle(x,y,u*.62,opts('rubber')),{kind:'ball',mat:'rubber',color:pick(COLORS),face:true}))},
    crate(x,y){return tag(Bodies.rectangle(x,y,u*1.3,u*1.3,opts('wood',{chamfer:{radius:4}})),{kind:'crate',mat:'wood',color:'#D9A066',face:Math.random()<.35})},
    brick(x,y){return tag(Bodies.rectangle(x,y,u*1.8,u*.9,opts('stone',{chamfer:{radius:3}})),{kind:'brick',mat:'stone',color:'#E0664F'})},
    ice(x,y){return tag(Bodies.rectangle(x,y,u*1.3,u*1.3,opts('ice',{chamfer:{radius:6}})),{kind:'ice',mat:'ice',color:'#BDEFFF'})},
    tri(x,y){return tag(Bodies.polygon(x,y,3,u*.95,opts('wood')),{kind:'poly',mat:'wood',color:pick(COLORS)})},
    plank(x,y){return tag(Bodies.rectangle(x,y,u*5,u*.38,opts('wood',{chamfer:{radius:4}})),{kind:'plank',mat:'wood',color:'#C98B4F'})},
    balloon(x,y){return tag(Bodies.circle(x,y,u*.7,opts('air')),{kind:'balloon',mat:'air',color:pick(COLORS),face:true})},
    bomb(x,y){return roller(tag(Bodies.circle(x,y,u*.55,opts('metal')),{kind:'bomb',mat:'metal',color:'#2A2550',fuse:200}))},
    rocket(x,y){return tag(Bodies.rectangle(x,y,u*.75,u*2,opts('metal',{chamfer:{radius:[u*.36,u*.36,4,4]},density:.0015,frictionAir:.01})),{kind:'rocket',mat:'metal',color:'#F4F6FF',thrust:150})},
  };
  function addOne(k,x,y){const b=MK[k](x,y);Composite.add(world,b);return b}
  function buddy(x,y){
    const grp=Body.nextGroup(true),col=pick(COLORS),o=m=>opts('soft',Object.assign({collisionFilter:{group:grp}},m||{}));
    const head=tag(Bodies.circle(x,y-u*.95,u*.52,o()),{kind:'head',mat:'soft',color:col,face:true,buddy:true});
    const torso=tag(Bodies.rectangle(x,y,u*.8,u*1.05,o({chamfer:{radius:u*.3}})),{kind:'limb',mat:'soft',color:col});
    const limb=(dx,dy,w,h)=>tag(Bodies.rectangle(x+dx,y+dy,w,h,o({chamfer:{radius:w*.48}})),{kind:'limb',mat:'soft',color:col});
    const la=limb(-u*.58,-u*.05,u*.26,u*.75),ra=limb(u*.58,-u*.05,u*.26,u*.75),ll=limb(-u*.22,u*.85,u*.3,u*.75),rl=limb(u*.22,u*.85,u*.3,u*.75);
    const J=(a,pa,b2,pb)=>CC({bodyA:a,pointA:pa,bodyB:b2,pointB:pb,stiffness:.7,length:0,render:{visible:false},plugin:{wb:{kind:'joint'}}});
    const cs=[J(torso,{x:0,y:-u*.5},head,{x:0,y:u*.45}),J(torso,{x:-u*.4,y:-u*.38},la,{x:0,y:-u*.3}),J(torso,{x:u*.4,y:-u*.38},ra,{x:0,y:-u*.3}),
      J(torso,{x:-u*.22,y:u*.48},ll,{x:0,y:-u*.3}),J(torso,{x:u*.22,y:u*.48},rl,{x:0,y:-u*.3})];
    const all=[la,ra,ll,rl,torso,head];all.forEach(b=>b.plugin.wb.group=grp);head.plugin.wb.mates=all;
    Composite.add(world,[...all,...cs]);return head;
  }
  function car(x,y){
    const grp=Body.nextGroup(true),col=pick(['#FF4F5E','#FFC83D','#24C786','#FF8A2B','#B78CFF']);
    const body=tag(Bodies.rectangle(x,y,u*3,u*.85,opts('metal',{collisionFilter:{group:grp},chamfer:{radius:u*.35},density:.0022})),{kind:'car',mat:'metal',color:col,dir:1});
    const wh=dx=>tag(Bodies.circle(x+dx,y+u*.5,u*.55,opts('rubber',{collisionFilter:{group:grp},friction:1,frictionStatic:2,restitution:.2,density:.002})),{kind:'wheel',mat:'rubber',color:'#2A2550'});
    const w1=wh(-u*1.05),w2=wh(u*1.05);
    const ax=(w,dx)=>CC({bodyA:body,pointA:{x:dx,y:u*.5},bodyB:w,stiffness:.5,damping:.08,length:0,plugin:{wb:{kind:'axle'}}});
    body.plugin.wb.wheels=[w1,w2];body.plugin.wb.mates=[body,w1,w2];w1.plugin.wb.car=body;w2.plugin.wb.car=body;
    Composite.add(world,[body,w1,w2,ax(w1,-u*1.05),ax(w2,u*1.05)]);return body;
  }
  function landY(x,y0){const list=Composite.allBodies(world);for(let y=y0;y<H;y+=5){if(Query.point(list,{x,y}).length)return y}return H}
  function dominoes(x,y){const sp=u*.72,n=Math.max(4,Math.min(14,Math.floor((W-x-u)/sp)));for(let i=0;i<n;i++){const xx=x+i*sp,gy=landY(xx,y);
    Composite.add(world,tag(Bodies.rectangle(xx,gy-u*.86,u*.24,u*1.7,opts('wood',{density:.003,friction:.3})),{kind:'domino',mat:'wood',color:COLORS[i%COLORS.length]}))}}
  function tower(x,y){const gy=landY(x,y),bw=u*1.1,bh=u*.62;for(let r=0;r<7;r++)for(let c=0;c<2;c++){const off=r%2?bw*.5:0;
    Composite.add(world,tag(Bodies.rectangle(x+(c-.5)*bw+off-bw*.25,gy-bh*(r+.5)-1,bw-2,bh-1,opts('wood',{chamfer:{radius:3},friction:.8})),{kind:'block',mat:'wood',color:COLORS[(r*2+c)%COLORS.length]}))}}
  function rope(x,y){
    const grp=Body.nextGroup(true),links=[],n=11,sp=u*.42;let prev=null;
    for(let i=0;i<n;i++){const l=tag(Bodies.circle(x,y+sp*(i+1),u*.16,{density:.002,frictionAir:.01,collisionFilter:{group:grp}}),{kind:'link',mat:'soft'});links.push(l);
      Composite.add(world,[l,CC(prev?{bodyA:prev,bodyB:l,length:sp,stiffness:.95,plugin:{wb:{kind:'rope'}}}:{pointA:{x,y},bodyB:l,length:sp,stiffness:.95,plugin:{wb:{kind:'rope',anchor:true}}})]);prev=l}
    const bob=roller(tag(Bodies.circle(x,y+sp*(n+1)+u*.4,u*.55,opts('rubber',{density:.004,collisionFilter:{group:grp}})),{kind:'ball',mat:'rubber',color:pick(COLORS),face:true}));
    Composite.add(world,[bob,CC({bodyA:prev,bodyB:bob,length:u*.55,stiffness:.95,plugin:{wb:{kind:'rope'}}})]);
    links.forEach(l=>l.plugin.wb.rope=links);
  }
  function seesaw(x,y){const gy=landY(x,y),py=gy-u*1.15;
    const base=tag(Bodies.fromVertices(x,gy-u*.4,[[{x:0,y:-u*1.1},{x:u*.8,y:0},{x:-u*.8,y:0}]],{isStatic:true,friction:.8}),{kind:'base',color:'#7E8BB8'});
    const pl=tag(Bodies.rectangle(x,py,u*7,u*.36,opts('wood',{chamfer:{radius:4},density:.002})),{kind:'plank',mat:'wood',color:'#C98B4F'});
    Composite.add(world,[base,pl]);addPin(pl,{x,y:py},true);
    Composite.add(world,addOne('crate',x-u*2.8,py-u*1.5));
  }
  function fan(x,y){const dir=x<W/2?1:-1;return Composite.add(world,tag(Bodies.rectangle(x,y,u*1.3,u*1.6,{isStatic:true,chamfer:{radius:8}}),{kind:'fan',color:'#9AA6D6',dir}))}
  function tramp(x,y){return Composite.add(world,tag(Bodies.rectangle(x,y,u*3.2,u*.4,{isStatic:true,restitution:.98,chamfer:{radius:u*.18}}),{kind:'tramp',color:'#24C786',mat:'tramp'}))}
  function spawn(k,x,y){
    switch(k){case'buddy':return buddy(x,y);case'car':return car(x,y);case'domino':dominoes(x,y);return null;case'tower':tower(x,y);return null;
      case'rope':rope(x,y);return null;case'seesaw':seesaw(x,y);return null;case'fan':fan(x,y);return null;case'tramp':tramp(x,y);return null;
      default:return addOne(k,x,y)}
  }

  /* ---------- ink: static ramps & dynamic drawn shapes ---------- */
  function segBody(a,b,th,o){const l=Math.hypot(b.x-a.x,b.y-a.y)+th;return Bodies.rectangle((a.x+b.x)/2,(a.y+b.y)/2,l,th,Object.assign({angle:Math.atan2(b.y-a.y,b.x-a.x),chamfer:{radius:th*.45}},o))}
  function simplify(pts,step){const o=[pts[0]];for(const p of pts){const l=o[o.length-1];if(Math.hypot(p.x-l.x,p.y-l.y)>=step)o.push(p)}const e=pts[pts.length-1];if(o[o.length-1]!==e&&Math.hypot(e.x-o[o.length-1].x,e.y-o[o.length-1].y)>4)o.push(e);return o}
  function makeInk(pts,dynamic,color){
    pts=simplify(pts,u*.55);if(pts.length<2){pts=[{x:pts[0].x-u*.5,y:pts[0].y},{x:pts[0].x+u*.5,y:pts[0].y}]}
    if(pts.length>48)pts=pts.filter((p,i)=>i%2===0||i===pts.length-1);
    const th=dynamic?u*.42:u*.5,segs=[];for(let i=1;i<pts.length;i++)segs.push(segBody(pts[i-1],pts[i],th,{}));
    const b=Body.create({parts:segs,isStatic:!dynamic,friction:.7,restitution:.1,density:.0025});
    const local=pts.map(p=>({x:p.x-b.position.x,y:p.y-b.position.y}));
    tag(b,{kind:dynamic?'drawn':'ink',mat:dynamic?'wood':'ink',color,pts:local,th,a0:b.angle});
    Composite.add(world,b);return b;
  }

  /* ---------- pins, grabs ---------- */
  function addPin(b,p,quiet){const c=CC({pointA:{x:p.x,y:p.y},bodyB:b,pointB:{x:p.x-b.position.x,y:p.y-b.position.y},length:0,stiffness:1,plugin:{wb:{kind:'pin'}}});
    Composite.add(world,c);pins.push(c);if(!quiet){tone(900,.08,'square',.05);tone(1400,.1,'triangle',.12,.05)}return c}
  function removeBody(b){g.later(wakeAll,0);
    const w=wbOf(b),group=w.mates||(w.car&&wbOf(w.car).mates)||(w.rope)||[b];
    for(const x of group){Composite.remove(world,x);for(const c of Composite.allConstraints(world))if(c.bodyA===x||c.bodyB===x){Composite.remove(world,c);const i=pins.indexOf(c);if(i>=0)pins.splice(i,1)}}
    // whole buddy if a limb was erased
    if(w.group&&!w.mates){for(const o of Composite.allBodies(world))if(wbOf(o).group===w.group)removeBody(o)}
  }
  const grabs=new Map();
  function bodiesAt(p){return Query.point(Composite.allBodies(world).filter(b=>wbOf(b).kind!=='bound'),p)}

  /* ---------- fx ---------- */
  function puff(x,y,n,col,spd=3,size=6){for(let i=0;i<n;i++){const a=Math.random()*6.28,v=Math.random()*spd;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,l:1,r:size*(.5+Math.random()),c:col||'rgba(255,255,255,.8)',d:.025+Math.random()*.02})}}
  const SND={
    wood:v=>{noise(.07,900,3,v*.5);tone(170,.08,'triangle',v*.4)},boing:v=>tone(200,.18,'sine',v*.5,0,520),thud:v=>{noise(.14,250,1,v*.6);tone(80,.14,'sine',v*.5)},
    tink:v=>{tone(1900,.12,'sine',v*.25);tone(2700,.08,'sine',v*.18,.02)},clank:v=>{tone(520,.2,'square',v*.08);tone(1250,.15,'triangle',v*.2)},
    oof:v=>tone(420,.14,'triangle',v*.4,0,190),squeak:v=>tone(900,.1,'sine',v*.25,0,1300),ink:v=>noise(.06,500,2,v*.35),tramp:v=>tone(150,.3,'sine',v*.6,0,620)};
  let sndBudget=0;
  /* Round things roll without the solver's fake friction loss: contacts are frictionless and the spin is set to match the
     surface speed (v = omega x r), so a ball on flat ground keeps its speed and only air drag slows it. Matter.js otherwise
     bleeds most of a rolling ball's energy away and uses 4x the real moment of inertia. */
  function roller(b){b.friction=0;b.frictionStatic=0;wbOf(b).roll=true;return b}
  const rolling=new Map();
  function noteRoll(ev){for(const pr of ev.pairs){const a=pr.bodyA.parent,b=pr.bodyB.parent,n=pr.collision.normal;
    if(wbOf(b).roll&&!wbOf(a).roll||wbOf(b).roll&&a.isStatic)rolling.set(b,{nx:n.x,ny:n.y,o:a});else if(wbOf(a).roll)rolling.set(a,{nx:-n.x,ny:-n.y,o:b})}}
  Events.on(engine,'collisionActive',noteRoll);
  function spinRollers(){for(const [b,c] of rolling){if(b.isStatic||!b.circleRadius){continue}
      const tx=-c.ny,ty=c.nx,ov=c.o.isStatic?{x:0,y:0}:c.o.velocity,w=((b.velocity.x-ov.x)*tx+(b.velocity.y-ov.y)*ty)/b.circleRadius;
      Body.setAngularVelocity(b,Math.max(-.6,Math.min(.6,w)))}rolling.clear()}
  Events.on(engine,'collisionStart',ev=>{noteRoll(ev);
    for(const pr of ev.pairs){const a=pr.bodyA.parent,b=pr.bodyB.parent;const wa=wbOf(a),wb=wbOf(b);
      const n=pr.collision.normal,rv=(a.velocity.x-b.velocity.x)*n.x+(a.velocity.y-b.velocity.y)*n.y,sp=Math.abs(rv);
      if(sp<2.2)continue;const sup=pr.collision.supports[0]||a.position;
      if(sp>5)puff(sup.x,sup.y,Math.min(10,sp|0),'rgba(255,255,255,.7)',sp*.35,5);
      for(const w of [wa,wb]){if(w.face&&sp>7)w.ouch=40}
      if(wa.kind==='balloon'&&sp>14)popBalloon(a);if(wb.kind==='balloon'&&sp>14)popBalloon(b);
      if(sndBudget>0){sndBudget--;const v=Math.min(1,sp/18);const s=wa.mat==='tramp'||wb.mat==='tramp'?'tramp':(MAT[wa.mat]||{}).snd||(MAT[wb.mat]||{}).snd||'ink';(SND[s]||SND.ink)(v)}
    }});
  function popBalloon(b){if(!b||b.plugin.wb.popped)return;b.plugin.wb.popped=true;const p=b.position;puff(p.x,p.y,24,b.plugin.wb.color,7,7);noise(.15,2500,.6,.35,0,600);tone(1400,.06,'square',.06);
    g.later(()=>removeBody(b),0)}
  function boom(x,y,power=1){
    const R=u*5.5*power;shake=Math.max(shake,14*power);
    for(const b of Composite.allBodies(world)){if(b.isStatic)continue;const d=Vector.sub(b.position,{x,y}),l=Vector.magnitude(d);if(l>R)continue;wake(b);
      const f=(1-l/R)*.05*power,dir=l>1?Vector.div(d,l):{x:0,y:-1};Body.applyForce(b,b.position,{x:dir.x*f*b.mass,y:(dir.y-.35)*f*b.mass});Body.setAngularVelocity(b,b.angularVelocity+(Math.random()-.5)*.4*(1-l/R));
      const w=wbOf(b);if(w.kind==='balloon')popBalloon(b);if(w.face)w.ouch=60;if(w.kind==='bomb'&&!w.lit&&l>2){w.fuse=Math.min(w.fuse,8)}}
    for(let i=0;i<46;i++){const a=Math.random()*6.28,v=2+Math.random()*9*power;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,r:5+Math.random()*9,c:pick(['#FFC83D','#FF8A2B','#FF4F5E','#FFF3B0']),d:.03})}
    for(let i=0;i<14;i++){const a=Math.random()*6.28,v=Math.random()*2.5;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,l:1,r:14+Math.random()*16,c:'rgba(90,90,120,.45)',d:.012})}
    parts.push({x,y,vx:0,vy:0,l:1,r:R*.55,c:'rgba(255,240,180,.55)',d:.09,flash:true});
    noise(.9,1400,.4,.6,0,80,'lowpass');tone(70,.6,'sine',.5,0,35);
  }

  /* ---------- input ---------- */
  const toWorld=(x,y)=>({x,y});
  const fmap=fingers(cv,{
    down(f){const p=toWorld(f.x,f.y);f.data.t0=performance.now();
      if(puzzle&&tool!=='ramp'&&tool!=='erase'){tool='ramp';syncTools()}
      if(tool==='grab'||tool==='add'){
        const hit=bodiesAt(p).filter(b=>!b.isStatic);
        if(hit.length){grabBody(f,hit[hit.length-1],p);return}
        /* a second finger on empty space while something is held = twist handle */
        if(grabs.size&&tool==='grab'){const gb=[...grabs.values()][0].bodyB;f.data.twist={b:gb,a:Math.atan2(p.y-gb.position.y,p.x-gb.position.x)};return}
        if(tool==='add'){const b=spawn(item,p.x,p.y);pop(.8);if(b&&!b.isStatic){grabBody(f,b,b.position);f.data.spawned=true}return}
        puff(p.x,p.y,8,'rgba(255,255,255,.6)',2.5,5);tone(300,.06,'sine',.08);return}
      if(tool==='ramp'||tool==='shape'){f.data.pts=[p];f.data.col=tool==='shape'?pick(COLORS):'#FFC83D';return}
      if(tool==='pin'){const near=pins.findIndex(c=>Math.hypot(c.pointA.x-p.x,c.pointA.y-p.y)<u*.5);
        if(near>=0){Composite.remove(world,pins[near]);pins.splice(near,1);wakeAll();tone(500,.1,'triangle');return}
        const hit=bodiesAt(p).filter(b=>!b.isStatic);if(hit.length){addPin(hit[hit.length-1],p);say('Pinned!')}else hint('Tap on a thing to pin it in place. It will spin around the pin!');return}
      if(tool==='boom'){boom(p.x,p.y,1);return}
      if(tool==='erase'){eraseAt(p)}
    },
    move(f){const p=toWorld(f.x,f.y);const gr=grabs.get(f.id);if(gr){gr.pointA.x=p.x;gr.pointA.y=p.y;return}
      if(f.data.twist){const t=f.data.twist,b=t.b;if(!Composite.allBodies(world).includes(b)){f.data.twist=null;return}const a=Math.atan2(p.y-b.position.y,p.x-b.position.x);let d=a-t.a;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;t.a=a;spin(b,d);return}
      if(f.data.pts){const l=f.data.pts[f.data.pts.length-1];if(Math.hypot(p.x-l.x,p.y-l.y)>6){f.data.pts.push(p);if(frame%3===0)tone(220+Math.random()*80,.03,'triangle',.04)}}
      if(tool==='erase')eraseAt(p)},
    wheel(w){const hit=bodiesAt(toWorld(w.x,w.y)).filter(b=>!b.isStatic);const b=hit[hit.length-1]||(grabs.size?[...grabs.values()][0].bodyB:null);if(b){spin(b,w.dy*.12);focus=b}},
    up(f){const gr=grabs.get(f.id);const tapped=performance.now()-f.data.t0<280&&Math.hypot(f.x-f.sx,f.y-f.sy)<10;
      /* the tap that adds a thing is not also a tap on it (it used to pop a new balloon, set off a new bomb and flip a new car) */
      if(gr){Composite.remove(world,gr);grabs.delete(f.id);if(tapped&&!f.data.spawned)tapAction(gr.bodyB)}
      if(f.data.pts){const pts=f.data.pts;if(pts.length>1||tool==='ramp'){makeInk(pts,tool==='shape',f.data.col);tone(500,.1,'triangle');tone(750,.12,'triangle',.15,.06)}}
    }});
  /* turn a body (and keep it turning a little after you let go) */
  function spin(b,d){if(b.isStatic)return;wake(b);d=clamp(d,-.5,.5);Body.setAngle(b,b.angle+d);Body.setAngularVelocity(b,d*.6);if(Math.abs(d)>.02&&frame%4===0)tone(500+d*400,.03,'sine',.04)}
  function grabBody(f,b,p){
    const root=b;
    const c=CC({pointA:{x:p.x,y:p.y},bodyB:root,pointB:{x:p.x-root.position.x,y:p.y-root.position.y},stiffness:.22,damping:.12,length:0,plugin:{wb:{kind:'grab'}}});
    wake(root);Composite.add(world,c);grabs.set(f.id,c);focus=root;const w=wbOf(root);if(w.face)w.happy=40;tone(440,.06,'triangle',.1);
  }
  function tapAction(b){const w=wbOf(b);wake(b);if(w.mates)w.mates.forEach(wake);if(w.car)wbOf(w.car).mates?.forEach(wake);
    if(w.kind==='balloon')return popBalloon(b);
    if(w.kind==='bomb'){w.fuse=Math.min(w.fuse,1);return}
    if(w.kind==='rocket'){w.thrust=150;say('Blast off!');return}
    const carB=w.kind==='car'?b:w.car;if(carB){const cw=wbOf(carB);cw.dir=-cw.dir;tone(660,.12,'square',.06);tone(660,.12,'square',.06,.18);return}
    if(w.buddy||w.group){const head=w.buddy?b:Composite.allBodies(world).find(o=>wbOf(o).group===w.group&&wbOf(o).buddy);if(head){Body.applyForce(head,head.position,{x:0,y:-.06*head.mass});wbOf(head).happy=60;
      [0,1,2].forEach(i=>tone(700+i*120,.08,'triangle',.12,i*.09))}return}
    if(w.kind==='ball'){Body.setVelocity(b,{x:b.velocity.x,y:-14});tone(300,.15,'sine',.2,0,700)}
  }
  let eraseTick=0;
  function eraseAt(p){if(eraseTick>0)return;const hit=Query.point(Composite.allBodies(world).filter(b=>wbOf(b).kind!=='bound'&&!wbOf(b).fixed),p);
    if(hit.length){const b=hit[hit.length-1];puff(p.x,p.y,16,wbOf(b).color||'#fff',4,7);removeBody(b);noise(.2,1600,1,.2,0,300);eraseTick=4}
    const ni=pins.findIndex(c=>Math.hypot(c.pointA.x-p.x,c.pointA.y-p.y)<u*.5);if(ni>=0){Composite.remove(world,pins[ni]);pins.splice(ni,1)}}

  /* ---------- puzzles ---------- */
  const LEVELS=[
    {t:'Draw a ramp so the ball rolls to the star.',ball:[.14,.12],star:[.8,.9],walls:[]},
    {t:'Build a bridge over the gap!',ball:[.08,.42],star:[.86,.62],walls:[[[0,.5],[.36,.7]],[[.62,.7],[1,.7]]]},
    {t:'Get the ball over the wall.',ball:[.16,.1],star:[.82,.9],walls:[[[.5,1],[.5,.45]]]},
    {t:'The star is up high. Make the ball zoom up!',ball:[.08,.1],star:[.84,.36],walls:[[[.7,.46],[1,.46]]]},
    {t:'Zig-zag down to the star!',ball:[.88,.24],star:[.12,.9],walls:[[[.25,.42],[.75,.42]],[[.4,.68],[1,.68]]]}];
  let puzzle=null;
  function startPuzzle(i){
    clearWorld();const L=LEVELS[i];puzzle={i,done:false,go:false,t0:0};puzEl.hidden=false;ov.el.classList.add('closed');
    for(const w of L.walls){const pts=w.map(([x,y])=>({x:x*W,y:y*H}));const b=makeInk(pts,false,'#7E8BB8');wbOf(b).fixed=true}
    const ball=tag(Bodies.circle(L.ball[0]*W,L.ball[1]*H,u*.55,{isStatic:true,restitution:.25,friction:0,frictionStatic:0,frictionAir:.002,density:.002}),{kind:'ball',mat:'rubber',color:'#FF4F7B',face:true,hero:true,roll:true,fixed:true});
    Composite.add(world,ball);puzzle.ball=ball;puzzle.star={x:L.star[0]*W,y:L.star[1]*H};puzzle.start={...ball.position};
    stage.querySelector('#plv').textContent=`Puzzle ${i+1} of ${LEVELS.length}`;stage.querySelector('#pnext').hidden=true;stage.querySelector('#pgo').hidden=false;
    tool='ramp';syncTools();hint(L.t,6000);say(L.t+' Then press Go!');
  }
  function resetBall(){if(!puzzle)return;const b=puzzle.ball;Body.setStatic(b,true);Body.setPosition(b,puzzle.start);Body.setVelocity(b,{x:0,y:0});Body.setAngularVelocity(b,0);Body.setAngle(b,0);puzzle.go=false;stage.querySelector('#pgo').hidden=false}
  stage.querySelector('#pgo').addEventListener('click',()=>{if(!puzzle||puzzle.go)return;Body.setStatic(puzzle.ball,false);Body.setDensity(puzzle.ball,.002);wakeAll();puzzle.go=true;puzzle.t0=frame;stage.querySelector('#pgo').hidden=true;tone(523,.1,'triangle');tone(784,.14,'triangle',.18,.08)});
  stage.querySelector('#preset').addEventListener('click',()=>{resetBall();tone(400,.1,'triangle')});
  stage.querySelector('#pnext').addEventListener('click',()=>{if(puzzle)startPuzzle((puzzle.i+1)%LEVELS.length)});
  function puzzleTick(){if(!puzzle||!puzzle.go||puzzle.done)return;const b=puzzle.ball,s=puzzle.star;
    if(Math.hypot(b.position.x-s.x,b.position.y-s.y)<u*1.45){puzzle.done=true;const r=cv.getBoundingClientRect();burst(r.left+s.x,r.top+s.y,60);cheer();addStar();say('You did it! Great building!');
      stage.querySelector('#pnext').hidden=false;wbOf(b).happy=200;return}
    const sp=Vector.magnitude(b.velocity);if(b.position.y>H+u||b.position.x<-u||b.position.x>W+u||(frame-puzzle.t0>120&&sp<.08)){if(!puzzle.miss){puzzle.miss=true;g.later(()=>{puzzle.miss=false;if(puzzle&&!puzzle.done){resetBall();say('So close! Try changing your ramp.')}},900)}}
  }

  /* ---------- scenes ---------- */
  function clearWorld(){for(const b of Composite.allBodies(world))if(wbOf(b).kind!=='bound')Composite.remove(world,b);for(const c of Composite.allConstraints(world))Composite.remove(world,c);
    pins.length=0;grabs.clear();parts.length=0;puzzle=null;puzEl.hidden=true}
  function scene(k){
    clearWorld();tool='grab';
    if(k==='play'){makeInk([{x:0,y:H*.55},{x:W*.18,y:H*.62},{x:W*.34,y:H*.8}],false,'#FFC83D');seesaw(W*.66,H*.5);
      for(let i=0;i<3;i++)addOne('crate',W*.1+i*u*1.4,H*.3);buddy(W*.86,H*.4);addOne('ball',W*.22,H*.2);addOne('balloon',W*.45,H*.75);
      hint('Grab things and throw them! Tap Bloop to make him jump.');say('Welcome to the physics lab! Grab things and throw them.')}
    if(k==='domino'){makeInk([{x:W*.01,y:H*.3},{x:W*.2,y:H*.82},{x:W*.3,y:H-u*.3}],false,'#FFC83D');dominoes(W*.4,H*.5);addOne('ball',W*.04,H*.15);
      hint('The ball will knock them down. Watch the chain reaction!');say('Dominoes! Watch the chain reaction.')}
    if(k==='tower'){tower(W*.5,H*.5);tower(W*.75,H*.5);addOne('bomb',W*.62,H*.3);tool='boom';
      hint('Knock the towers down! Try Boom, or throw things.');say('Knock down the towers!')}
    if(k==='cars'){makeInk([{x:0,y:H*.45},{x:W*.3,y:H*.72},{x:W*.42,y:H*.66}],false,'#FFC83D');makeInk([{x:W*.62,y:H*.92},{x:W*.78,y:H*.78}],false,'#FFC83D');
      car(W*.08,H*.3);tramp(W*.9,H*.97);for(let i=0;i<3;i++)addOne('crate',W*.55+i*u*1.35,H*.85);
      hint('Tap a car to turn it around. Draw ramps for big jumps!');say('Race time! Tap a car to turn it around.')}
    if(k==='puzzle'){startPuzzle(0);return}
    if(k==='empty'){hint('An empty lab. Add anything you like!');say('All clean!')}
    syncTools();
  }

  /* ---------- UI ---------- */
  const TIP={grab:'Drag things around. Use two fingers to grab two things! Tap a balloon to pop it.',ramp:'Draw a ramp with your finger. Ramps stay put.',shape:'Draw any shape. It turns into a real thing that falls!',pin:'Tap a thing to pin it. It spins around the pin. Tap the pin to remove it.',boom:'Tap anywhere to make a BOOM!',erase:'Rub things to make them disappear.'};
  function syncTools(){stage.querySelectorAll('.tool[data-t]').forEach(b=>{b.classList.toggle('on',b.dataset.t===tool);b.classList.toggle('dim',!!puzzle&&b.dataset.t!=='ramp'&&b.dataset.t!=='erase')});
    const it=ITEMS.find(t=>t[0]===item),ab=stage.querySelector('.tool[data-t="add"] .ti');if(ab&&it)ab.textContent=it[1]}
  function itemMenu(btn){popMenu(btn,`<div class="popgrid">${ITEMS.map(t=>`<button class="popitem ${t[0]===item?'on':''}" data-item="${t[0]}"><span class="pe">${t[1]}</span>${t[2]}</button>`).join('')}</div>`,b=>{
    item=b.dataset.item;tool='add';syncTools();const it=ITEMS.find(t=>t[0]===item);hint('Tap the lab to add a '+it[2].toLowerCase()+'.',2600,true)})}
  function sceneMenu(btn){popMenu(btn,`<div class="popgrid">${SCENES.map(t=>`<button class="popitem" data-s="${t[0]}"><span class="pe">${t[1]}</span>${t[2]}</button>`).join('')}</div>`,b=>{scene(b.dataset.s);tone(440,.1,'triangle');tone(660,.14,'triangle',.18,.08)})}
  stage.querySelector('#tools').addEventListener('click',e=>{const b=e.target.closest('.tool');if(!b)return;
    if(b.id==='scenes'){sceneMenu(b);return}
    if(b.id==='grav'){wakeAll();gi=(gi+1)%GRAV.length;const G=GRAV[gi];b.innerHTML=`<span class="ti">${G[1]}</span>${G[2]}`;say(G[4]);hint(G[4]);tone(330+gi*110,.2,'triangle');
      if(G[0]==='space')for(const o of Composite.allBodies(world))if(!o.isStatic)Body.setVelocity(o,{x:o.velocity.x+(Math.random()-.5)*2,y:o.velocity.y-Math.random()*2});return}
    if(b.id==='slow'){slow=!slow;b.classList.toggle('on',slow);say(slow?'Slow motion':'Normal speed');tone(slow?300:600,.25,'sine',.15,0,slow?150:900);return}
    if(b.id==='pause'){paused=!paused;b.classList.toggle('on',paused);b.innerHTML=paused?'<span class="ti">▶️</span>Play':'<span class="ti">⏸️</span>Freeze';say(paused?'Frozen!':'Go!');return}
    if(puzzle&&b.dataset.t!=='ramp'&&b.dataset.t!=='erase'){hint('In puzzles you can only draw ramps and erase them. Pick a scene to play freely.',3500,true);buzz();return}
    if(b.dataset.t==='add'){if(tool!=='add'){tool='add';syncTools()}itemMenu(b);return}
    tool=b.dataset.t;syncTools();tone(520,.08,'triangle');hint(TIP[tool],2600)});

  /* ---------- per-step forces ---------- */
  /* top speed ~16 m/s: fast enough for great throws, slow enough that nothing tunnels through a wall in one frame */
  const VMAX=40;
  function forces(){
    for(const b of Composite.allBodies(world)){if(b.isStatic)continue;const v=b.velocity,sp=Math.hypot(v.x,v.y);if(sp>VMAX)Body.setVelocity(b,{x:v.x*VMAX/sp,y:v.y*VMAX/sp});if(Math.abs(b.angularVelocity)>.6)Body.setAngularVelocity(b,Math.sign(b.angularVelocity)*.6)}
    const G=GRAV[gi][3];engine.gravity.y=G;
    /* the Moon and space have no air: no drag, and nothing for a balloon to float on */
    const air=GRAV[gi][0]==='earth'||GRAV[gi][0]==='flip';
    for(const b of Composite.allBodies(world)){if(b.isStatic||!b.plugin||!b.plugin.wb)continue;const w=b.plugin.wb;if(w.fa0==null)w.fa0=b.frictionAir;b.frictionAir=air?w.fa0:0}
    for(const b of Composite.allBodies(world)){const w=wbOf(b);if(!w.kind||b.isStatic&&w.kind!=='fan')continue;
      if(w.kind==='balloon'&&air){Body.applyForce(b,b.position,{x:Math.sin(frame*.03+b.id)*b.mass*.00005,y:-b.mass*GS*(G===0?0:Math.sign(G)*Math.max(Math.abs(G),.5))*1.7})}
      if(w.kind==='car'){for(const wh of w.wheels)Body.setAngularVelocity(wh,lerp(wh.angularVelocity,w.dir*.27,.2))}
      if(w.kind==='rocket'&&w.thrust>0){w.thrust--;const a=b.angle,dir={x:Math.sin(a),y:-Math.cos(a)};Body.applyForce(b,b.position,{x:dir.x*b.mass*GS*2.4,y:dir.y*b.mass*GS*2.4});
        const tail={x:b.position.x-dir.x*u,y:b.position.y-dir.y*u};if(frame%2===0)parts.push({x:tail.x,y:tail.y,vx:-dir.x*4+(Math.random()-.5)*2,vy:-dir.y*4+(Math.random()-.5)*2,l:1,r:7+Math.random()*6,c:pick(['#FFC83D','#FF8A2B','#FFF3B0']),d:.05});
        if(frame%6===0)noise(.12,500+Math.random()*300,.7,.12)}
      if(w.kind==='bomb'){if(--w.fuse<=0){removeBody(b);boom(b.position.x,b.position.y,1.15)}else if(w.fuse%(w.fuse<60?10:30)===0)tone(w.fuse<60?1200:900,.04,'square',.05)}
      if(w.kind==='fan'&&air){for(const o of Composite.allBodies(world)){if(o.isStatic)continue;const dx=(o.position.x-b.position.x)*w.dir,dy=o.position.y-b.position.y;
        if(dx>0&&dx<u*10&&Math.abs(dy)<u*1.6+dx*.18){wake(o);const f=(1-dx/(u*10))*.0006*(wbOf(o).kind==='balloon'?2.5:1);Body.applyForce(o,o.position,{x:w.dir*f*o.mass,y:0})}}
        if(frame%4===0)parts.push({x:b.position.x+w.dir*u*.8,y:b.position.y+(Math.random()-.5)*u*1.4,vx:w.dir*(7+Math.random()*3),vy:0,l:1,r:2,c:'rgba(255,255,255,.55)',d:.03,streak:true})}
      // forget far-away things
      if(b.position.y>H+u*8||b.position.y<-H*1.4||b.position.x<-u*8||b.position.x>W+u*8){removeBody(b);if(w.kind==='balloon'){say('Bye bye balloon!')}}
    }
  }

  /* ---------- drawing ---------- */
  const bgc=document.createElement('canvas');
  function drawBg(){bgc.width=cv.width;bgc.height=cv.height;const b=bgc.getContext('2d');b.setTransform(dims.d,0,0,dims.d,0,0);
    const gr=b.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#2B4FD6');gr.addColorStop(1,'#1E3BA8');b.fillStyle=gr;b.fillRect(0,0,W,H);
    b.strokeStyle='rgba(255,255,255,.07)';b.lineWidth=1;const s=u*.5;for(let x=0;x<W;x+=s){b.beginPath();b.moveTo(x+.5,0);b.lineTo(x+.5,H);b.stroke()}for(let y=0;y<H;y+=s){b.beginPath();b.moveTo(0,y+.5);b.lineTo(W,y+.5);b.stroke()}
    b.strokeStyle='rgba(255,255,255,.13)';b.lineWidth=2;for(let x=0;x<W;x+=s*4){b.beginPath();b.moveTo(x,0);b.lineTo(x,H);b.stroke()}for(let y=0;y<H;y+=s*4){b.beginPath();b.moveTo(0,y);b.lineTo(W,y);b.stroke()}
    // floor hazard stripe
    b.fillStyle='#1D1842';b.fillRect(0,H-6,W,6);}
  drawBg();
  const INK='#1D1842';
  function path(vs){ctx.beginPath();ctx.moveTo(vs[0].x,vs[0].y);for(let i=1;i<vs.length;i++)ctx.lineTo(vs[i].x,vs[i].y);ctx.closePath()}
  function face(x,y,r,ang,b,w){
    const v=b.velocity,sp=Math.hypot(v.x,v.y),lx=clamp(v.x*.06,-1,1),ly=clamp(v.y*.06,-1,1);
    ctx.save();ctx.translate(x,y);ctx.rotate(ang*.0);const er=r*.24,ex=r*.36,ey=-r*.12;
    const ouch=(w.ouch||0)>0,happy=(w.happy||0)>0,blink=(frame+b.id*37)%220<6;
    for(const s of [-1,1]){
      if(ouch){ctx.strokeStyle=INK;ctx.lineWidth=Math.max(2,r*.1);ctx.beginPath();ctx.moveTo(s*ex-er*.7,ey-er*.6);ctx.lineTo(s*ex+er*.3*s+0,ey);ctx.lineTo(s*ex-er*.7,ey+er*.6);ctx.stroke();continue}
      ctx.fillStyle='#fff';ctx.strokeStyle=INK;ctx.lineWidth=Math.max(2,r*.08);ctx.beginPath();ctx.ellipse(s*ex,ey,er,blink?er*.15:er*1.15,0,0,7);ctx.fill();ctx.stroke();
      if(!blink){ctx.fillStyle=INK;ctx.beginPath();ctx.arc(s*ex+lx*er*.45,ey+ly*er*.5,er*.5,0,7);ctx.fill()}}
    ctx.strokeStyle=INK;ctx.lineWidth=Math.max(2,r*.09);ctx.lineCap='round';ctx.beginPath();
    if(sp>11||ouch){ctx.fillStyle='#3A0F2E';ctx.ellipse(0,r*.35,r*.17,r*.22,0,0,7);ctx.fill();ctx.stroke()}
    else{ctx.arc(0,r*.18,r*(happy?.3:.22),.15*Math.PI,.85*Math.PI);ctx.stroke()}
    ctx.restore();
  }
  function drawBody(b){
    const w=wbOf(b),k=w.kind,col=w.color||'#ccc';if(!k||k==='bound')return;
    ctx.lineJoin='round';ctx.lineCap='round';
    if(k==='ink'||k==='drawn'){ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle-w.a0);ctx.beginPath();w.pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
      ctx.strokeStyle=INK;ctx.lineWidth=w.th+6;ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=w.th;ctx.stroke();
      if(k==='ink'&&!w.fixed){ctx.strokeStyle='rgba(29,24,66,.25)';ctx.lineWidth=w.th*.3;ctx.setLineDash([w.th*.5,w.th*.7]);ctx.stroke();ctx.setLineDash([])}
      else{ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=w.th*.22;ctx.stroke()}ctx.restore();return}
    if(b.circleRadius&&b.parts.length===1){const r=b.circleRadius,x=b.position.x,y=b.position.y;
      if(k==='link'){ctx.fillStyle='#C98B4F';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();return}
      if(k==='balloon'){ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+r);for(let i=1;i<=6;i++)ctx.lineTo(x+Math.sin(frame*.1+i)*4,y+r+i*r*.22);ctx.stroke();
        ctx.fillStyle=col;ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,r,r*1.12,0,0,7);ctx.fill();ctx.stroke();
        ctx.fillStyle=INK;ctx.beginPath();ctx.moveTo(x-5,y+r*1.18);ctx.lineTo(x+5,y+r*1.18);ctx.lineTo(x,y+r*1.05);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(x-r*.4,y-r*.45,r*.18,r*.3,-.5,0,7);ctx.fill();face(x,y+r*.1,r*.8,0,b,w);return}
      ctx.save();ctx.translate(x,y);ctx.rotate(b.angle);ctx.fillStyle=col;ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();
      if(k==='ball'){ctx.save();ctx.clip();ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(-r,-r*.22,r*2,r*.44);ctx.restore()}
      if(k==='wheel'){ctx.fillStyle='#9AA6D6';ctx.beginPath();ctx.arc(0,0,r*.5,0,7);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(i*2.09)*r*.5,Math.sin(i*2.09)*r*.5);ctx.stroke()}}
      if(k==='bomb'){ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.arc(-r*.35,-r*.35,r*.25,0,7);ctx.fill();ctx.fillStyle='#7E8BB8';ctx.fillRect(-r*.25,-r*1.15,r*.5,r*.3);ctx.strokeRect(-r*.25,-r*1.15,r*.5,r*.3);
        ctx.strokeStyle='#C98B4F';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-r*1.15);ctx.quadraticCurveTo(r*.3,-r*1.5,r*.5,-r*1.45);ctx.stroke();
        if(frame%6<4){ctx.fillStyle=pick(['#FFC83D','#FF8A2B','#fff']);ctx.beginPath();ctx.arc(r*.5,-r*1.45,4+Math.random()*4,0,7);ctx.fill()}}
      ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.stroke();ctx.restore();
      if(w.face)face(x,y,r,b.angle,b,w);return}
    // polygons (single or compound)
    for(let i=b.parts.length>1?1:0;i<b.parts.length;i++){const p=b.parts[i];path(p.vertices);ctx.fillStyle=col;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.stroke()}
    ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
    if(k==='crate'){const s=u*.65;ctx.strokeStyle='rgba(29,24,66,.45)';ctx.lineWidth=3;ctx.strokeRect(-s*.78,-s*.78,s*1.56,s*1.56);ctx.beginPath();ctx.moveTo(-s*.78,-s*.78);ctx.lineTo(s*.78,s*.78);ctx.moveTo(s*.78,-s*.78);ctx.lineTo(-s*.78,s*.78);ctx.stroke()}
    if(k==='brick'){ctx.strokeStyle='rgba(29,24,66,.35)';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-u*.9,0);ctx.lineTo(u*.9,0);ctx.moveTo(0,-u*.45);ctx.lineTo(0,0);ctx.moveTo(-u*.45,0);ctx.lineTo(-u*.45,u*.45);ctx.moveTo(u*.45,0);ctx.lineTo(u*.45,u*.45);ctx.stroke()}
    if(k==='ice'){ctx.fillStyle='rgba(255,255,255,.65)';ctx.beginPath();ctx.ellipse(-u*.3,-u*.3,u*.14,u*.24,.7,0,7);ctx.fill();ctx.fillRect(u*.05,-u*.45,u*.1,u*.1)}
    if(k==='plank'||k==='domino'){ctx.strokeStyle='rgba(29,24,66,.25)';ctx.lineWidth=2;const l=k==='plank'?u*2.3:0;if(l){ctx.beginPath();ctx.moveTo(-l,0);ctx.lineTo(l,0);ctx.stroke()}else{ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(0,-u*.35,u*.07,0,7);ctx.arc(0,u*.35,u*.07,0,7);ctx.fill()}}
    if(k==='car'){ctx.fillStyle='#BDEFFF';ctx.strokeStyle=INK;ctx.lineWidth=3;const d=w.dir;ctx.beginPath();ctx.moveTo(-u*.75,-u*.42);ctx.lineTo(-u*.5,-u*.95);ctx.lineTo(u*.45,-u*.95);ctx.lineTo(u*.8,-u*.42);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#FFE7A8';ctx.beginPath();ctx.arc(d*u*1.3,-u*.05,u*.13,0,7);ctx.fill();ctx.stroke();
      ctx.save();ctx.translate(d*u*.15,-u*.62);face(0,0,u*.3,0,b,w);ctx.restore()}
    if(k==='rocket'){ctx.fillStyle='#FF4F5E';ctx.strokeStyle=INK;ctx.lineWidth=3;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*u*.36,u*.35);ctx.lineTo(s*u*.75,u*1.05);ctx.lineTo(s*u*.36,u*.95);ctx.closePath();ctx.fill();ctx.stroke()}
      ctx.fillStyle='#5C8DFF';ctx.beginPath();ctx.arc(0,-u*.2,u*.2,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#FF4F5E';ctx.beginPath();ctx.ellipse(0,-u*.82,u*.3,u*.14,0,Math.PI,0);ctx.fill()}
    if(k==='fan'){ctx.fillStyle=INK;ctx.beginPath();ctx.arc(w.dir*u*.1,0,u*.52,0,7);ctx.fill();ctx.save();ctx.translate(w.dir*u*.1,0);ctx.rotate(frame*.5*w.dir);ctx.fillStyle='#FFC83D';
      for(let i=0;i<3;i++){ctx.rotate(2.094);ctx.beginPath();ctx.ellipse(0,-u*.26,u*.12,u*.24,0,0,7);ctx.fill()}ctx.restore()}
    if(k==='tramp'){ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-u*1.3,u*.2);ctx.lineTo(-u*1.5,u*.75);ctx.moveTo(u*1.3,u*.2);ctx.lineTo(u*1.5,u*.75);ctx.stroke()}
    if(k==='poly'&&w.face)face(0,0,u*.5,0,b,w);
    ctx.restore();
    if(k==='crate'&&w.face)face(b.position.x,b.position.y,u*.55,b.angle,b,w);
    if(k==='head')face(b.position.x,b.position.y,b.circleRadius,b.angle,b,w);
  }
  function draw(){
    ctx.setTransform(dims.d,0,0,dims.d,0,0);
    const sx=shake?(Math.random()-.5)*shake:0,sy=shake?(Math.random()-.5)*shake:0;shake*=.86;if(shake<.4)shake=0;
    ctx.drawImage(bgc,0,0,W,H);ctx.translate(sx,sy);
    if(puzzle){const s=puzzle.star;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.sin(frame*.05)*.2);const R=u*1.1;ctx.fillStyle='rgba(255,200,61,.18)';ctx.beginPath();ctx.arc(0,0,R*1.2+Math.sin(frame*.1)*4,0,7);ctx.fill();
      ctx.beginPath();for(let i=0;i<10;i++){const rr=i%2?R*.42:R*.9,a=-Math.PI/2+i*Math.PI/5;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();
      ctx.fillStyle='#FFC83D';ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.lineJoin='round';ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.arc(-R*.18,-R*.2,R*.12,0,7);ctx.fill();ctx.restore()}
    // rope + constraints
    for(const c of Composite.allConstraints(world)){const w=c.plugin&&c.plugin.wb||{};
      if(w.kind==='rope'){const a=c.bodyA?Vector.add(c.bodyA.position,c.pointA):c.pointA,b2=Vector.add(c.bodyB.position,c.pointB);ctx.strokeStyle=INK;ctx.lineWidth=u*.26+5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b2.x,b2.y);ctx.stroke();ctx.strokeStyle='#C98B4F';ctx.lineWidth=u*.26;ctx.stroke();
        if(w.anchor){ctx.fillStyle='#FFC83D';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.arc(a.x,a.y,u*.25,0,7);ctx.fill();ctx.stroke()}}
      if(w.kind==='grab'){const a=c.pointA,b2=Vector.add(c.bodyB.position,c.pointB);ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=3;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b2.x,b2.y);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(a.x,a.y,8,0,7);ctx.fill()}}
    const all=Composite.allBodies(world);
    for(const b of all)if(wbOf(b).kind==='ink'||wbOf(b).kind==='base')drawBodyOrBase(b);
    for(const b of all){const k=wbOf(b).kind;if(k!=='ink'&&k!=='base')drawBody(b)}
    for(const c of pins){const a=c.pointA;ctx.fillStyle='#FFC83D';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.arc(a.x,a.y,u*.2,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=INK;ctx.beginPath();ctx.arc(a.x,a.y,u*.06,0,7);ctx.fill()}
    // particles
    for(const p of parts){ctx.globalAlpha=Math.max(0,p.l);ctx.fillStyle=p.c;
      if(p.streak){ctx.fillRect(p.x,p.y,18,2)}else{ctx.beginPath();ctx.arc(p.x,p.y,p.flash?p.r*(1.4-p.l*.4):p.r*(p.l*.6+.4),0,7);ctx.fill()}}
    ctx.globalAlpha=1;
    // live strokes
    for(const f of fmap.values()){if(!f.data.pts)continue;const pts=f.data.pts;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
      ctx.strokeStyle=INK;ctx.lineWidth=u*.5+6;ctx.stroke();ctx.strokeStyle=f.data.col;ctx.lineWidth=u*.5;ctx.stroke()}
  }
  function drawBodyOrBase(b){const w=wbOf(b);if(w.kind==='base'){path(b.vertices);ctx.fillStyle=w.color;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.stroke();return}drawBody(b)}

  /* ---------- loop ---------- */
  let acc=0;
  /* A puzzle is laid out in fractions of the screen. When the screen turns or resizes, the puzzle is laid out again
     for the new size and the child's ramps come along, so the walls, the star and the ramps never end up off screen. */
  function resize(){const nd=fitCanvas(cv);if(Math.abs(nd.w-W)<2&&Math.abs(nd.h-H)<2&&nd.d===dims.d)return;
    const W0=W,H0=H,keep=puzzle&&Composite.allBodies(world).filter(b=>wbOf(b).kind==='ink'&&!wbOf(b).fixed).map(b=>wbOf(b).pts.map(p=>({x:(p.x+b.position.x)/W0,y:(p.y+b.position.y)/H0})));
    dims=nd;W=nd.w;H=nd.h;if(keep)u=clamp(Math.min(W,H)/12,26,58);bounds();drawBg();
    if(keep){const i=puzzle.i;startPuzzle(i);for(const r of keep)makeInk(r.map(p=>({x:p.x*W,y:p.y*H})),false,'#FFC83D')}}
  const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>{ro.disconnect();Events.off(engine);Engine.clear(engine)});
  scene('play');
  kbPointer(g,cv);
  const TK=TOOLS.map(t=>t[0]);
  g.key(e=>{const k=e.key.toLowerCase();
    if(/^[1-7]$/.test(k)){stage.querySelector(`.tool[data-t="${TK[+k-1]}"]`).click();return true}
    if(k==='q'||k==='e'){const b=grabs.size?[...grabs.values()][0].bodyB:focus;if(b&&Composite.allBodies(world).includes(b)){spin(b,k==='q'?-.15:.15);return true}return false}
    const id={g:'#grav',s:'#slow',f:'#pause'}[k];if(id){stage.querySelector(id).click();return true}
    if(k==='r'&&puzzle){stage.querySelector('#preset').click();return true}
    if(k==='enter'&&puzzle&&!puzzle.go){stage.querySelector('#pgo').click();return true}return false});
  g.loop(dt=>{
    if(frame%6===0)ovUpdate();
    frame++;sndBudget=3;if(eraseTick>0)eraseTick--;
    for(const b of Composite.allBodies(world)){const w=wbOf(b);if(w.ouch>0)w.ouch--;if(w.happy>0)w.happy--}
    if(!paused){engine.timing.timeScale=slow?.28:1;acc+=dt;let n=0;while(acc>=1000/60&&n<3){forces();Engine.update(engine,1000/60);spinRollers();acc-=1000/60;n++}if(n===3)acc=0;puzzleTick()}
    for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.x+=p.vx*(slow?.3:1);p.y+=p.vy*(slow?.3:1);p.vx*=.95;p.vy=p.vy*.95+(p.streak?0:.05);p.l-=p.d;if(p.l<=0)parts.splice(i,1)}
    if(parts.length>500)parts.splice(0,parts.length-500);
    // keep the lab tidy
    const dyn=Composite.allBodies(world).filter(b=>!b.isStatic&&wbOf(b).kind);if(dyn.length>170){dyn.sort((a,b)=>wbOf(a).born-wbOf(b).born);removeBody(dyn[0])}
    draw();
  });
  GAMES.physics._debug={engine,world,get frame(){return frame},spawn,scene,startPuzzle,boom,get puzzle(){return puzzle},makeInk,LEVELS,get W(){return W},get H(){return H},get u(){return u},get tool(){return tool},get paused(){return paused},get slow(){return slow},get gi(){return gi},PXM,GS,get pins(){return pins},get item(){return item}};
}
