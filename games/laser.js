/* ============================================================
   LASER LAB — reflection, refraction and rainbows
   ============================================================ */
Object.assign(GAMES,{laser:{title:'Laser Lab',icon:'🔦',c:'var(--grape)',age:'7+',section:'lab',order:7,blurb:'Bounce lasers off mirrors. Split light into a rainbow.',
init(stage,g){
  const COLS=10,ROWS=7,EPS=1e-6;
  const SPEC=[['#FF3B3B',1.50],['#FF8A2B',1.505],['#FFE23D',1.51],['#3BE06A',1.517],['#2FB4FF',1.525],['#3B5BFF',1.533],['#B04BFF',1.542]];
  /* piece: {k:'laser'|'mirror'|'split'|'glass'|'prism'|'target'|'wall', i,j, a (angle deg), fixed, col (target needs color index or null), white} */
  const LEVELS=[
    {t:'Put a mirror where the laser can bounce up to the crystal.',p:[{k:'laser',i:0,j:5,a:0},{k:'target',i:6,j:1}],inv:{mirror:1}},
    {t:'Two mirrors. Go around the wall!',p:[{k:'laser',i:0,j:1,a:0},{k:'wall',i:5,j:1},{k:'wall',i:5,j:2},{k:'wall',i:5,j:3},{k:'target',i:8,j:1}],inv:{mirror:4}},
    {t:'A splitter lets half the light through and bounces the other half. Light both crystals!',p:[{k:'laser',i:0,j:3,a:0},{k:'target',i:9,j:3},{k:'target',i:4,j:0}],inv:{split:1}},
    {t:'Zig-zag through the walls.',p:[{k:'laser',i:0,j:0,a:0},{k:'wall',i:3,j:0},{k:'wall',i:3,j:1},{k:'wall',i:3,j:2},{k:'wall',i:6,j:4},{k:'wall',i:6,j:5},{k:'wall',i:6,j:6},{k:'target',i:9,j:6}],inv:{mirror:4}},
    {t:'White light hides a rainbow! Tap the prism to turn it until red and violet each reach their crystal.',p:[{k:'laser',i:0,j:3,a:0,white:true},{k:'prism',i:3,j:3,a:330,fixed:false},{k:'target',i:6,j:6,col:0},{k:'target',i:2,j:6,col:6}],inv:{}},
    {t:'Light all three crystals.',p:[{k:'laser',i:0,j:6,a:0},{k:'target',i:9,j:6},{k:'target',i:2,j:0},{k:'target',i:9,j:0}],inv:{mirror:3,split:2}}];
  let mode='puz',li=0,pieces=[],inv={},pick_='mirror',rays=[],lit=new Set(),frame=0,sel=null,events=[],white=true,done=false;
  const ui=labShell(stage,{label:'Optics bench',top:`${chips('lm',[['puz','🧩 Puzzles'],['free','✨ Free play']],'puz')}<span class="sep"></span><span id="inv" class="pbar"></span><span class="lvl" id="lv"></span><button class="pbtn small" id="lnext">➜ Next</button>`,
    panel:`<div id="ev"></div>
      <div class="fx"><span class="tag">Mirrors</span><div class="row">angle in = angle out</div><div class="row">${V('θ','#E8384F')}<sub>in</sub> = ${V('θ','#2F6FE0')}<sub>out</sub></div><div class="row note">Tap an empty square to place a piece. Tap a piece to turn it. Drag it off the board to take it back.</div></div>
      <div class="fx"><span class="tag">Glass bends light (Snell)</span><div class="row">${V('n','#9A5BFF')}<sub>1</sub> sin ${V('θ','#E8384F')}<sub>1</sub> = ${V('n','#9A5BFF')}<sub>2</sub> sin ${V('θ','#2F6FE0')}<sub>2</sub></div><div class="row note">air: n = 1.00 &nbsp; glass: n = 1.50</div></div>
      <div class="fx"><span class="tag">Rainbows</span><div class="row">Violet bends the most, red the least.</div><div class="row note">Each color has its own n, so a prism fans them out.</div></div>
`});
  const {cv,panel}=ui,ctx=cv.getContext('2d');let dims=fitCanvas(cv),cs=60,ox=0,oy=0;
  function layout(){cs=Math.min(dims.w/(COLS+.4),dims.h/(ROWS+.4));ox=(dims.w-COLS*cs)/2;oy=(dims.h-ROWS*cs)/2}
  function load(i){li=i;const L=LEVELS[i%LEVELS.length];pieces=L.p.map(p=>({...p,fixed:p.fixed??true}));inv={...L.inv};done=false;sel=null;
    pick_=Object.keys(inv)[0]||'none';stage.querySelector('#lv').textContent=`Puzzle ${i%LEVELS.length+1}`;invUI();trace();ui.hint(L.t,6000)}
  function free(){pieces=[{k:'laser',i:0,j:3,a:0,white,fixed:false},{k:'prism',i:4,j:3,a:0},{k:'glass',i:7,j:1,a:0},{k:'target',i:9,j:5}];inv={mirror:99,split:99,glass:99,prism:99,wall:99,target:99};pick_='mirror';invUI();trace()}
  const ICON={mirror:'🪞 Mirror',split:'🔀 Splitter',glass:'🧊 Glass',prism:'🔺 Prism',wall:'🧱 Wall',target:'💎 Crystal'};
  function invUI(){stage.querySelector('#inv').innerHTML=Object.entries(inv).map(([k,n])=>`<button class="opt ${k===pick_?'on':''}" data-inv="${k}">${ICON[k]}${mode==='puz'?` ×${n}`:''}</button>`).join('')+
    (mode==='free'?`<button class="opt" id="wl">${white?'⚪ White light':'🔴 Red light'}</button><button class="opt" id="del">🧽 Remove</button>`:'');
    stage.querySelector('#lv').hidden=mode!=='puz';stage.querySelector('#lnext').hidden=mode!=='puz'}
  stage.querySelector('#inv').addEventListener('click',e=>{const b=e.target.closest('[data-inv]');if(b){pick_=b.dataset.inv;invUI();tone(560,.07,'triangle');return}
    if(e.target.closest('#wl')){white=!white;pieces.forEach(p=>{if(p.k==='laser')p.white=white});invUI();trace()}if(e.target.closest('#del')){pick_='del';invUI()}});
  bindChips(ui.top,'lm',m=>{mode=m;m==='puz'?load(li):free()});
  stage.querySelector('#lnext').addEventListener('click',()=>load(li+1));
  /* ---------- geometry ---------- */
  function segs(p){const cx=p.i+.5,cy=p.j+.5,out=[];
    if(p.k==='mirror'||p.k==='split'){const a=p.a*Math.PI/180,ux=Math.cos(a)*.46,uy=Math.sin(a)*.46;out.push({x1:cx-ux,y1:cy-uy,x2:cx+ux,y2:cy+uy,p,t:p.k})}
    /* a glass block turns like the other pieces (it used to ignore its angle, so tapping it did nothing) */
    else if(p.k==='glass'||p.k==='wall'){const h=p.k==='glass'?.42:.5,a=p.k==='glass'?(p.a||0)*Math.PI/180:0,C=Math.cos(a),S=Math.sin(a),c=[[-h,-h],[h,-h],[h,h],[-h,h]].map(([x,y])=>[cx+x*C-y*S,cy+x*S+y*C]);for(let q=0;q<4;q++)out.push({x1:c[q][0],y1:c[q][1],x2:c[(q+1)%4][0],y2:c[(q+1)%4][1],p,t:p.k})}
    else if(p.k==='prism'){const r=.46,c=[0,1,2].map(q=>{const a=(p.a-90+q*120)*Math.PI/180;return[cx+Math.cos(a)*r,cy+Math.sin(a)*r]});for(let q=0;q<3;q++)out.push({x1:c[q][0],y1:c[q][1],x2:c[(q+1)%3][0],y2:c[(q+1)%3][1],p,t:'prism'})}
    return out}
  function hitSeg(x,y,dx,dy,s){const ex=s.x2-s.x1,ey=s.y2-s.y1,den=dx*ey-dy*ex;if(Math.abs(den)<1e-12)return null;const t=((s.x1-x)*ey-(s.y1-y)*ex)/den,u=((s.x1-x)*dy-(s.y1-y)*dx)/den;
    if(t>EPS&&u>=-1e-9&&u<=1+1e-9)return t;return null}
  function trace(){rays=[];lit=new Set();events=[];const all=pieces.flatMap(segs),targets=pieces.filter(p=>p.k==='target');
    for(const L of pieces.filter(p=>p.k==='laser')){const a=L.a*Math.PI/180,cols=L.white?SPEC.map((s,i)=>i):[0];
      for(const ci of cols){const q=[{x:L.i+.5+Math.cos(a)*.4,y:L.j+.5+Math.sin(a)*.4,dx:Math.cos(a),dy:Math.sin(a),inside:null,depth:0,pw:1}];
        while(q.length){const r=q.pop();if(r.depth>60||r.pw<.1)continue;let best=null,bt=1e9;
          for(const s of all){const t=hitSeg(r.x,r.y,r.dx,r.dy,s);if(t!==null&&t<bt){bt=t;best=s}}
          // crystals
          let tg=null;for(const T of targets){const cx=T.i+.5,cy=T.j+.5,fx=r.x-cx,fy=r.y-cy,b=fx*r.dx+fy*r.dy,c=fx*fx+fy*fy-.09,d=b*b-c;if(d>=0){const t=-b-Math.sqrt(d);if(t>EPS&&t<bt){bt=t;tg=T}}}
          // board edge
          const tb=Math.min(r.dx>0?(COLS-r.x)/r.dx:r.dx<0?-r.x/r.dx:1e9,r.dy>0?(ROWS-r.y)/r.dy:r.dy<0?-r.y/r.dy:1e9);if(tb<bt){bt=tb;best=null;tg=null}
          const nx=r.x+r.dx*bt,ny=r.y+r.dy*bt;rays.push({x1:r.x,y1:r.y,x2:nx,y2:ny,ci:L.white?ci:-1,pw:r.pw});
          if(tg){if(tg.col==null||(L.white&&tg.col===ci))lit.add(tg);continue}
          if(!best||best.t==='wall')continue;
          let ex=best.x2-best.x1,ey=best.y2-best.y1,el=Math.hypot(ex,ey),Nx=-ey/el,Ny=ex/el;
          if(best.t==='mirror'||best.t==='split'){if(Nx*r.dx+Ny*r.dy>0){Nx=-Nx;Ny=-Ny}const dd=r.dx*Nx+r.dy*Ny,rx=r.dx-2*dd*Nx,ry=r.dy-2*dd*Ny;
            const inc=Math.acos(Math.min(1,Math.abs(dd)))*180/Math.PI;events.push({p:best.p,type:'reflect',in:inc,out:inc});
            q.push({x:nx,y:ny,dx:rx,dy:ry,inside:r.inside,depth:r.depth+1,pw:best.t==='split'?r.pw*.5:r.pw});if(best.t==='split')q.push({x:nx+r.dx*1e-4,y:ny+r.dy*1e-4,dx:r.dx,dy:r.dy,inside:r.inside,depth:r.depth+1,pw:r.pw*.5});continue}
          // refraction: outward normal of the piece
          const pc=best.p,cx=pc.i+.5,cy=pc.j+.5;if((nx-cx)*Nx+(ny-cy)*Ny<0){Nx=-Nx;Ny=-Ny}
          const entering=r.dx*Nx+r.dy*Ny<0,ng=best.t==='prism'||L.white?SPEC[L.white?ci:0][1]:1.5,n1=entering?1:ng,n2=entering?ng:1;
          const nnx=entering?Nx:-Nx,nny=entering?Ny:-Ny,cosi=-(r.dx*nnx+r.dy*nny),eta=n1/n2,k=1-eta*eta*(1-cosi*cosi),th1=Math.acos(Math.min(1,cosi))*180/Math.PI;
          if(k<0){const rx=r.dx+2*cosi*nnx,ry=r.dy+2*cosi*nny;events.push({p:pc,type:'tir',in:th1,crit:Math.asin(1/ng)*180/Math.PI});q.push({x:nx,y:ny,dx:rx,dy:ry,inside:r.inside,depth:r.depth+1,pw:r.pw});continue}
          const tx=eta*r.dx+(eta*cosi-Math.sqrt(k))*nnx,ty=eta*r.dy+(eta*cosi-Math.sqrt(k))*nny,tl=Math.hypot(tx,ty),th2=Math.acos(Math.min(1,Math.sqrt(k)))*180/Math.PI;
          if(!L.white||ci===0)events.push({p:pc,type:'refract',n1,n2,in:th1,out:th2});
          q.push({x:nx,y:ny,dx:tx/tl,dy:ty/tl,inside:entering?pc:null,depth:r.depth+1,pw:r.pw*.96})}}}
    showEv();
    if(mode==='puz'&&!done){const ts=pieces.filter(p=>p.k==='target');if(ts.length&&ts.every(t=>lit.has(t))){done=true;g.later(()=>{win(stage,null,null,'All crystals lit!');g.later(()=>load(li+1),2500)},300)}}}
  function showEv(){const el=panel.querySelector('#ev'),p=sel;const ev=events.filter(e=>!p||e.p===p).slice(-1)[0];
    if(!ev){el.innerHTML=`<div class="fx hot"><span class="tag">Measure</span><div class="row">Tap a mirror or glass the laser touches to see its angles.</div></div>`;return}
    el.innerHTML=ev.type==='reflect'?`<div class="fx big hot"><span class="tag">This mirror</span><div class="row">${V('θ','#E8384F')}<sub>in</sub> = <span class="num" style="color:#E8384F">${fmt(ev.in,1)}°</span></div><div class="row">${V('θ','#2F6FE0')}<sub>out</sub> = <span class="num" style="color:#2F6FE0">${fmt(ev.out,1)}°</span></div><div class="row note">measured from the line straight out of the mirror</div></div>`
      :ev.type==='tir'?`<div class="fx big hot"><span class="tag">Trapped light!</span><div class="row">${V('θ','#E8384F')} = <span class="num">${fmt(ev.in,1)}°</span> is too steep</div><div class="row note">Past ${fmt(ev.crit,1)}° light cannot leave this glass, so it bounces back inside. Fiber optic cables work this way.</div></div>`
      :`<div class="fx big hot"><span class="tag">Light bending</span><div class="row"><span class="num" style="color:#9A5BFF">${fmt(ev.n1,2)}</span> × sin <span class="num" style="color:#E8384F">${fmt(ev.in,1)}°</span> = <span class="num" style="color:#9A5BFF">${fmt(ev.n2,2)}</span> × sin <span class="num" style="color:#2F6FE0">${fmt(ev.out,1)}°</span></div>
        <div class="row"><span class="num">${fmt(ev.n1*Math.sin(ev.in*Math.PI/180),3)} = ${fmt(ev.n2*Math.sin(ev.out*Math.PI/180),3)}</span></div><div class="row note">${ev.n2>ev.n1?'Going into glass, light slows and bends toward the normal.':'Leaving glass, light speeds up and bends away.'}</div></div>`}
  /* ---------- input ---------- */
  const STEP=k=>k==='prism'?15:k==='laser'?45:k==='glass'?15:22.5;
  const canTurn=p=>p&&(p.k==='laser'||p.k==='prism'||p.k==='mirror'||p.k==='split'||p.k==='glass')&&(!p.fixed||mode==='free');
  function turn(p,dir){if(!canTurn(p))return;p.a=((p.a+dir*STEP(p.k))%360+360)%360;tone(700+dir*80,.05,'triangle');trace()}
  const cellAt=(x,y)=>{const i=Math.floor((x-ox)/cs),j=Math.floor((y-oy)/cs);return(i<0||j<0||i>=COLS||j>=ROWS)?null:[i,j]};
  function takeBack(p){if(mode==='puz'&&inv[p.k]!=null&&!p.fixed){pieces=pieces.filter(q=>q!==p);inv[p.k]++;invUI();if(sel===p)sel=null;trace();tone(300,.08,'triangle');return true}
    if(mode==='free'&&p.k!=='laser'){pieces=pieces.filter(q=>q!==p);if(sel===p)sel=null;trace();return true}return false}
  const fm=fingers(cv,{down(f){const c=cellAt(f.x,f.y);
      /* second finger twists the selected piece */
      if(fm.size>1&&sel&&canTurn(sel)){f.data.twist={a:Math.atan2(f.y-(oy+(sel.j+.5)*cs),f.x-(ox+(sel.i+.5)*cs)),acc:0};return}
      if(!c)return;const[i,j]=c,p=pieces.find(q=>q.i===i&&q.j===j);
      if(p){if(pick_==='del'&&mode==='free'){takeBack(p);return}sel=p;f.data.p=p;f.data.moved=false;trace();return}
      if(pick_==='del'||pick_==='none')return;if(mode==='puz'&&!(inv[pick_]>0)){ui.hint('No more of those. Drag one of yours off the board to get it back.');buzz();return}
      const np={k:pick_,i,j,a:pick_==='mirror'||pick_==='split'?45:0,fixed:false};pieces.push(np);if(mode==='puz'){inv[pick_]--;invUI()}sel=np;tone(500,.08,'triangle');trace()},
    move(f){if(f.data.twist){const t=f.data.twist,a=Math.atan2(f.y-(oy+(sel.j+.5)*cs),f.x-(ox+(sel.i+.5)*cs));let d=a-t.a;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;t.a=a;t.acc+=d*180/Math.PI;
        const st=STEP(sel.k);while(t.acc>st*.6){t.acc-=st;turn(sel,1)}while(t.acc<-st*.6){t.acc+=st;turn(sel,-1)}return}
      const p=f.data.p;if(!p||(p.fixed&&mode==='puz'))return;if(Math.hypot(f.x-f.sx,f.y-f.sy)>cs*.35)f.data.moved=true;if(!f.data.moved)return;
      const c=cellAt(f.x,f.y);if(!c){if(takeBack(p))f.data.p=null;return}const[i,j]=c;if((i!==p.i||j!==p.j)&&!pieces.some(q=>q.i===i&&q.j===j)){p.i=i;p.j=j;tone(400,.03,'sine',.04);trace()}},
    up(f){const p=f.data.p;if(p&&!f.data.moved)turn(p,1)},
    wheel(w){const c=cellAt(w.x,w.y);const p=c&&pieces.find(q=>q.i===c[0]&&q.j===c[1])||sel;if(p){sel=p;turn(p,w.dy>0?1:-1)}}});
  kbPointer(g,cv);
  g.key(e=>{const k=e.key.toLowerCase();if((k==='q'||k==='e')&&sel){turn(sel,k==='e'?1:-1);return true}
    if((k==='delete'||k==='backspace')&&sel){takeBack(sel);return true}
    const ks=Object.keys(inv);if(/^[1-9]$/.test(k)&&ks[+k-1]){pick_=ks[+k-1];invUI();return true}return false});
  /* ---------- drawing ---------- */
  function draw(){const W=dims.w,H=dims.h;ctx.setTransform(dims.d,0,0,dims.d,0,0);ctx.fillStyle='#0E0B26';ctx.fillRect(0,0,W,H);
    for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++){ctx.fillStyle=(i+j)%2?'#16123A':'#1B1645';ctx.fillRect(ox+i*cs,oy+j*cs,cs,cs)}
    // beams
    ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    for(const r of rays){const col=r.ci<0?'#FF3B3B':SPEC[r.ci][0];const x1=ox+r.x1*cs,y1=oy+r.y1*cs,x2=ox+r.x2*cs,y2=oy+r.y2*cs;
      ctx.strokeStyle=col;ctx.globalAlpha=.25*r.pw;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.globalAlpha=.9*r.pw;ctx.lineWidth=3;ctx.stroke()}
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    for(const p of pieces){const cx=ox+(p.i+.5)*cs,cy=oy+(p.j+.5)*cs;ctx.save();ctx.translate(cx,cy);
      if(p.k==='laser'){ctx.rotate(p.a*Math.PI/180);ctx.fillStyle='#7E8BB8';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-cs*.4,-cs*.18,cs*.7,cs*.36,6);ctx.fill();ctx.stroke();ctx.fillStyle=p.white?'#fff':'#FF3B3B';ctx.beginPath();ctx.arc(cs*.32,0,cs*.08,0,7);ctx.fill()}
      if(p.k==='mirror'||p.k==='split'){ctx.rotate(p.a*Math.PI/180);ctx.strokeStyle=p.k==='split'?'rgba(189,239,255,.7)':'#DDE6FF';ctx.lineWidth=p.k==='split'?5:7;ctx.beginPath();ctx.moveTo(-cs*.46,0);ctx.lineTo(cs*.46,0);ctx.stroke();ctx.strokeStyle='#7E8BB8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-cs*.46,4);ctx.lineTo(cs*.46,4);ctx.stroke()}
      if(p.k==='glass'){ctx.rotate((p.a||0)*Math.PI/180);ctx.fillStyle='rgba(150,220,255,.22)';ctx.strokeStyle='rgba(189,239,255,.9)';ctx.lineWidth=2;ctx.fillRect(-cs*.42,-cs*.42,cs*.84,cs*.84);ctx.strokeRect(-cs*.42,-cs*.42,cs*.84,cs*.84)}
      if(p.k==='prism'){ctx.rotate(p.a*Math.PI/180);ctx.fillStyle='rgba(200,230,255,.25)';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();for(let q=0;q<3;q++){const a=(-90+q*120)*Math.PI/180;ctx.lineTo(Math.cos(a)*cs*.46,Math.sin(a)*cs*.46)}ctx.closePath();ctx.fill();ctx.stroke()}
      if(p.k==='wall'){ctx.fillStyle='#4A4470';ctx.fillRect(-cs/2,-cs/2,cs,cs);ctx.strokeStyle='#2A2550';ctx.strokeRect(-cs/2+2,-cs/2+2,cs-4,cs-4)}
      if(p.k==='target'){const on=lit.has(p),col=p.col==null?'#7BE0FF':SPEC[p.col][0];if(on){const gr=ctx.createRadialGradient(0,0,2,0,0,cs*.6);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,cs*.6,0,7);ctx.fill()}
        ctx.rotate(frame*.02);ctx.fillStyle=on?col:'rgba(255,255,255,.12)';ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();for(let q=0;q<6;q++){const a=q*Math.PI/3;ctx.lineTo(Math.cos(a)*cs*.28,Math.sin(a)*cs*.28)}ctx.closePath();ctx.fill();ctx.stroke()}
      if(!p.fixed&&mode==='puz'){ctx.restore();ctx.save();ctx.translate(cx,cy);ctx.strokeStyle='rgba(255,200,61,.6)';ctx.setLineDash([4,4]);ctx.lineWidth=2;ctx.strokeRect(-cs/2+3,-cs/2+3,cs-6,cs-6);ctx.setLineDash([])}
      if(sel===p){ctx.restore();ctx.save();ctx.translate(cx,cy);ctx.strokeStyle='#FFC83D';ctx.lineWidth=3;ctx.strokeRect(-cs/2+1,-cs/2+1,cs-2,cs-2)}
      ctx.restore()}}
  function resize(){dims=fitCanvas(cv);layout()}const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  layout();load(0);g.loop(()=>{frame++;draw()});
  GAMES.laser._debug={get rays(){return rays},get pieces(){return pieces},trace,get lit(){return lit},load,get events(){return events},add(k,i,j,a){pieces.push({k,i,j,a,fixed:false});if(inv[k])inv[k]--;trace()},setMode(m){mode=m;m==='puz'?load(li):free()}};
}}});
