/* ============================================================
   ROBO CODE — program a robot with blocks, loops and functions
   ============================================================ */
Object.assign(GAMES,{robo:{title:'Robo Code',icon:'🤖',c:'var(--leaf)',age:'6+',section:'think',order:1,blurb:'Snap code blocks together. Loops make it shorter!',
init(stage,g){
  /* map legend: # wall, . floor, * gem, S start (facing right) */
  const LV=[
    {m:['S..*'],par:3,tip:'Tap ⬆️ three times, then press Run.'},
    {m:['S.#','..#','..*'],par:6,tip:'Turn with ↩️ and ↪️.'},
    {m:['S.....*'],par:2,tip:'Six steps is a lot of blocks. Try 🔁 Repeat to say it once!',loops:true},
    {m:['S..*','.##.','.##.','*..*'],par:4,tip:'Go around the edge. Move three, turn. Again and again!',loops:true},
    {m:['S#####','.*####','#.*###','##.*##','###.*#','####.*'],par:6,tip:'A staircase! What pattern repeats?',loops:true},
    {m:['S.*.*','.###.','*###*','.###.','*.*.*'],par:4,tip:'A square path! Put a repeat inside a repeat.',loops:true},
    {m:['S.*.*.*','######.','*.*.*.*'],par:8,tip:'Teach the robot a new move with ⭐ My move, then use it!',loops:true,fn:true}];
  const DIRS=[[1,0],[0,1],[-1,0],[0,-1]];
  let li=0,map,rob,gems,prog=[],fnBody=[],target=null,run=null,frame=0,trail=[],speed=1;
  const ui=labShell(stage,{label:'Robot world',top:`<span class="lvl" id="lv"></span><button class="pbtn go small" id="run">▶ Run</button><button class="pbtn small" id="stop">⏹ Reset</button><button class="pbtn small" id="fast">🐇 Fast</button><button class="pbtn small" id="clr">🧹 Clear code</button><button class="pbtn small" id="nx">➜ Next</button>`,
    panel:`<div class="keep rkeep"><div class="pal" id="pal"></div><div class="fx hot"><span class="tag">Your program</span><div id="code" class="code"></div></div><div id="fnwrap" hidden class="fx"><span class="tag">⭐ My move</span><div id="fcode" class="code"></div></div></div><div class="fx"><span class="tag">Code size</span><div class="row" id="size"></div></div>
      <div class="fx"><span class="tag">Big idea</span><div class="row" id="idea">A program is a list of steps the computer follows in order.</div></div>`});
  const {cv,panel}=ui,ctx=cv.getContext('2d');let dims=fitCanvas(cv);
  const BL={F:['⬆️','fwd'],L:['↩️','left'],R:['↪️','right'],P:['⭐','call']};
  function load(i){li=i%LV.length;stage.querySelector('#nx')?.classList.remove('pulse');const L=LV[li];map=L.m.map(r=>r.split(''));gems=new Set();map.forEach((r,y)=>r.forEach((c,x)=>{if(c==='S')rob={x,y,d:L.dir??0,sx:x,sy:y,sd:L.dir??0};if(c==='*')gems.add(x+','+y)}));
    rob.ax=rob.x;rob.ay=rob.y;rob.ad=rob.d;prog=[];fnBody=[];target=null;run=null;trail=[];stage.querySelector('#lv').textContent=`Level ${li+1}`;
    panel.querySelector('#fnwrap').hidden=!L.fn;render();ui.hint(L.tip,5000);
    panel.querySelector('#idea').innerHTML=L.fn?'A function is a name for a group of steps. Write it once, use it many times.':L.loops?`A loop repeats steps. 🔁×6 ⬆️ is 2 blocks instead of 6!`:'A program is a list of steps the computer follows in order.'}
  const count=list=>list.reduce((s,b)=>s+1+(b.body?count(b.body):0),0);
  /* Turns the blocks into the list of moves the robot will make. It stops at MAXSTEPS (nine loops of nine inside each
     other used to build billions of moves and freeze the browser) and a ⭐ inside My move does nothing (it used to
     call itself forever and crash Run). */
  const MAXSTEPS=2000;
  function expand(list,inFn=false,out=[]){for(const b of list){if(out.length>MAXSTEPS)break;
      if(b.body){for(let i=0;i<b.n&&out.length<=MAXSTEPS;i++)expand(b.body,inFn,out)}
      else if(b.k==='P'){if(!inFn)expand(fnBody,true,out)}
      else out.push({k:b.k,b})}
    return out}
  function blockHTML(list,path){return list.map((b,i)=>{const p=path+'.'+i;
    if(b.body)return `<div class="cb loop ${target===p?'tgt':''}" data-p="${p}"><div class="lh"><button class="lb" data-n="${p}">🔁 × ${b.n}</button><button class="lx" data-del="${p}">✕</button></div><div class="lbody" data-in="${p}">${blockHTML(b.body,p)||'<span class="drop">tap to add inside</span>'}</div></div>`;
    return `<button class="cb ${run&&run.cur===b?'now':''}" data-del="${p}">${BL[b.k][0]}</button>`}).join('')}
  function render(){const L=LV[li];panel.querySelector('#code').innerHTML=`<div class="lbody main ${target===null?'tgt':''}" data-in="m">${blockHTML(prog,'m')||'<span class="drop">tap blocks below</span>'}</div>`;
    panel.querySelector('#fcode').innerHTML=`<div class="lbody main ${target==='f'?'tgt':''}" data-in="f">${blockHTML(fnBody,'f')||'<span class="drop">tap here, then add blocks</span>'}</div>`;
    panel.querySelector('#pal').innerHTML=['F','L','R'].map(k=>`<button class="pb2" data-add="${k}">${BL[k][0]}</button>`).join('')+(L.loops?`<button class="pb2 wide" data-add="loop">🔁 Repeat</button>`:'')+(L.fn?`<button class="pb2" data-add="P">⭐</button>`:'');
    const n=count(prog)+count(fnBody);panel.querySelector('#size').innerHTML=`<span class="num">${n}</span> blocks &nbsp;·&nbsp; best: <span class="num">${L.par}</span>${run&&run.done?` &nbsp;·&nbsp; robot did <span class="num">${run.did}</span> steps`:''}`}
  function listAt(p){if(p===null||p==='m')return prog;if(p==='f')return fnBody;const parts=p.split('.');let l=parts[0]==='f'?fnBody:prog,b;for(const i of parts.slice(1)){b=l[+i];l=b.body}return l}
  panel.addEventListener('click',e=>{if(run&&!run.done)return;const t=e.target;
    const add=t.closest('[data-add]');if(add){const k=add.dataset.add,l=listAt(target),nb=k==='loop'?{n:2,body:[]}:{k};if(count(prog)+count(fnBody)>=30){buzz();ui.hint('That is 30 blocks, the most the robot can hold. Try a loop!');return}
      if(k==='P'&&target&&target.startsWith('f')){buzz();ui.hint('My move cannot use itself. Put ⭐ in Your program instead.');return}l.push(nb);
      if(k==='loop'){target=(target===null?'m':target)+'.'+(l.length-1)}tone(500+'FLRP'.indexOf(k)*80,.06,'triangle');render();return}
    const ln=t.closest('[data-n]');if(ln){const parts=ln.dataset.n.split('.'),i=+parts.pop(),b=listAt(parts.length===1?parts[0]:parts.join('.'))[i];b.n=b.n>=9?2:b.n+1;tone(600+b.n*40,.06,'triangle');render();return}
    const del=t.closest('[data-del]');if(del){const parts=del.dataset.del.split('.'),i=+parts.pop(),l=listAt(parts.length===1?parts[0]:parts.join('.'));l.splice(i,1);if(target&&target.startsWith(del.dataset.del))target=null;tone(300,.06,'triangle');render();return}
    const tin=t.closest('[data-in]');if(tin){target=tin.dataset.in==='m'?null:tin.dataset.in;tone(700,.04,'sine');render()}});
  stage.querySelector('#run').addEventListener('click',()=>{reset();const steps=expand(prog);if(!steps.length){ui.hint('Add some blocks first!');return}
    if(steps.length>MAXSTEPS){steps.length=MAXSTEPS;ui.hint('That is a very long program! The robot will do the first 2,000 moves.',4000)}run={steps,i:0,t:0,done:false,did:0,cur:null};tone(660,.1,'triangle');render()});
  stage.querySelector('#stop').addEventListener('click',()=>{reset();render()});
  stage.querySelector('#fast').addEventListener('click',e=>{speed=speed===1?3:1;e.target.textContent=speed===1?'🐇 Fast':'🐢 Slow'});
  stage.querySelector('#clr').addEventListener('click',()=>{prog=[];fnBody=[];target=null;reset();render()});
  stage.querySelector('#nx').addEventListener('click',()=>load(li+1));
  function reset(){run=null;rob.x=rob.sx;rob.y=rob.sy;rob.d=rob.sd;rob.ax=rob.x;rob.ay=rob.y;rob.ad=rob.d;gems=new Set();map.forEach((r,y)=>r.forEach((c,x)=>{if(c==='*')gems.add(x+','+y)}));trail=[]}
  function tick(){if(!run||run.done)return;run.t+=.06*speed;rob.ax=lerp(rob.ax,rob.x,.3);rob.ay=lerp(rob.ay,rob.y,.3);rob.ad=lerp(rob.ad,rob.d,.3);
    if(run.t<1)return;run.t=0;if(run.i>=run.steps.length){finish();return}const st=run.steps[run.i++],k=st.k;run.did++;if(run.cur!==st.b){run.cur=st.b;render()}
    if(k==='L'){rob.d--;tone(500,.05,'square',.04)}if(k==='R'){rob.d++;tone(560,.05,'square',.04)}
    if(k==='F'){const[dx,dy]=DIRS[((rob.d%4)+4)%4],nx=rob.x+dx,ny=rob.y+dy;if(ny<0||ny>=map.length||nx<0||nx>=map[0].length||map[ny][nx]==='#'){run.done=true;buzz();shakeEl(cv);ui.hint('Bonk! The robot hit a wall. Fix the code and try again.');render();return}
      trail.push([rob.x,rob.y]);rob.x=nx;rob.y=ny;tone(300+run.i*10,.05,'triangle',.08);if(gems.delete(nx+','+ny)){tone(1200,.12,'sine',.15);tone(1600,.12,'sine',.12,.06)}}
    if(!gems.size)finish()}
  function finish(){run.done=true;run.cur=null;render();if(gems.size){ui.hint(`The program ended with ${gems.size} gem${gems.size>1?'s':''} left.`);buzz();return}
    const n=count(prog)+count(fnBody),L=LV[li];win(stage,null,null,n<=L.par?'Perfect code!':'All gems!');stage.querySelector('#nx').classList.add('pulse');if(n<=L.par)addStar();else g.later(()=>ui.hint(`You used ${n} blocks. Can you do it in ${L.par}?`,4000),1800)}
  function draw(){const W=dims.w,H=dims.h,R=map.length,C=map[0].length,cs=Math.max(4,Math.min((W-30)/C,(H-30)/R,90)),ox=(W-C*cs)/2,oy=(H-R*cs)/2;ctx.setTransform(dims.d,0,0,dims.d,0,0);ctx.fillStyle='#E8F4EC';ctx.fillRect(0,0,W,H);
    for(let y=0;y<R;y++)for(let x=0;x<C;x++){const c=map[y][x],px=ox+x*cs,py=oy+y*cs;if(c==='#'){ctx.fillStyle='#4A4470';ctx.beginPath();ctx.roundRect(px+2,py+2,cs-4,cs-4,8);ctx.fill()}
      else{ctx.fillStyle=(x+y)%2?'#FFFFFF':'#F4F7FF';ctx.fillRect(px,py,cs,cs);ctx.strokeStyle='rgba(29,24,66,.1)';ctx.strokeRect(px,py,cs,cs)}
      if(gems.has(x+','+y)){ctx.save();ctx.translate(px+cs/2,py+cs/2+Math.sin(frame*.08+x)*3);ctx.rotate(Math.PI/4);ctx.fillStyle='#2FE0E8';ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.fillRect(-cs*.17,-cs*.17,cs*.34,cs*.34);ctx.strokeRect(-cs*.17,-cs*.17,cs*.34,cs*.34);ctx.restore()}}
    ctx.strokeStyle='rgba(255,138,43,.5)';ctx.lineWidth=cs*.12;ctx.lineCap='round';ctx.beginPath();trail.forEach(([x,y],i)=>i?ctx.lineTo(ox+(x+.5)*cs,oy+(y+.5)*cs):ctx.moveTo(ox+(x+.5)*cs,oy+(y+.5)*cs));if(trail.length)ctx.lineTo(ox+(rob.ax+.5)*cs,oy+(rob.ay+.5)*cs);ctx.stroke();
    if(!run){rob.ax=rob.x;rob.ay=rob.y;rob.ad=rob.d}
    ctx.save();ctx.translate(ox+(rob.ax+.5)*cs,oy+(rob.ay+.5)*cs);ctx.rotate(rob.ad*Math.PI/2);const s=cs*.36;
    ctx.fillStyle='#9AA6D6';ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-s,-s,s*2,s*2,s*.4);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s*.35,-s*.38,s*.22,0,7);ctx.arc(s*.35,s*.38,s*.22,0,7);ctx.fill();ctx.fillStyle='#1D1842';ctx.beginPath();ctx.arc(s*.45,-s*.38,s*.1,0,7);ctx.arc(s*.45,s*.38,s*.1,0,7);ctx.fill();
    ctx.fillStyle='#FF4F7B';ctx.beginPath();ctx.moveTo(s*1.25,0);ctx.lineTo(s*.85,-s*.25);ctx.lineTo(s*.85,s*.25);ctx.closePath();ctx.fill();ctx.restore()}
  function resize(){dims=fitCanvas(cv)}const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  load(0);g.loop(()=>{frame++;tick();draw()});
  /* keyboard: arrows add moves, R adds a repeat, Enter runs, Backspace removes the last block */
  g.key(e=>{if(run&&!run.done&&e.key!=='Enter')return false;const add=k=>{const b=panel.querySelector(`[data-add="${k}"]`);if(b){b.click();return true}return false};
    const m={ArrowUp:'F',ArrowLeft:'L',ArrowRight:'R'}[e.key];if(m)return add(m);const k=e.key.toLowerCase();
    if(k==='r')return add('loop');if(k==='p'||k==='*')return add('P');if(e.key==='Enter'||e.key===' '){stage.querySelector('#run').click();return true}
    if(e.key==='Backspace'){const l=listAt(target);if(l.length){l.pop();render();tone(300,.06,'triangle')}else if(target){target=null;render()}return true}
    if(/^[2-9]$/.test(k)&&target&&target.includes('.')){const parts=target.split('.'),i=+parts.pop(),b=listAt(parts.length===1?parts[0]:parts.join('.'))[i];if(b&&b.body){b.n=+k;render()}return true}
    if(e.key==='ArrowDown'){target=null;render();return true}if(k==='n'){stage.querySelector('#nx').click();return true}return false});
  GAMES.robo._debug={setProg(p,f){prog=p;fnBody=f||[];render()},go(){stage.querySelector('#run').click()},load,get gems(){return gems},get run(){return run},LV,get li(){return li},get prog(){return prog},get fnBody(){return fnBody},get rob(){return rob}};
}}});
