/* ============================================================
   CIRCUIT LAB — real nodal-analysis circuits: V = I·R
   ============================================================ */
Object.assign(GAMES,{circuit:{title:'Circuit Lab',icon:'💡',c:'var(--sun)',age:'7+',section:'lab',order:6,blurb:'Wire batteries, bulbs and fans. See the current flow.',
init(stage,g){let pend=null;
  const KIND={wire:{n:'Wire',i:'〰️',R:.001},bat:{n:'Battery',i:'🔋'},bulb:{n:'Bulb',i:'💡',R:6},res:{n:'Resistor',i:'🟫',R:10},sw:{n:'Switch',i:'🔘',R:.001},motor:{n:'Fan',i:'🌀',R:4}};
  const TASKS=[['one','Light up one bulb',s=>s.bulbs.some(b=>b.lit)],['series','Light two bulbs in a single loop (series)',s=>s.series],['par','Light two bulbs side by side (parallel)',s=>s.par],
    ['fan','Make the fan spin',s=>s.motors.some(m=>Math.abs(m.I)>.2)],['switch','Turn a bulb on and off with a switch',s=>s.switchUsed],['three','Light three bulbs at once',s=>s.bulbs.filter(b=>b.lit).length>=3]];
  let tool='wire',edges=new Map(),sel=null,NX=8,NY=6,sp=80,ox=0,oy=0,sol=null,frame=0,done=new Set(),switchUsed=false,dots=[];
  const ui=labShell(stage,{label:'Circuit board',top:`${chips('ct',[...Object.entries(KIND).map(([k,v])=>[k,v.i+' '+v.n]),['meter','🔍 Meter'],['erase','🧽 Erase']],'wire')}<span class="sep"></span><button class="pbtn small" id="clr">🧹 Clear</button>`,
    panel:`<div id="sel"></div><div class="fx"><span class="tag">Challenges</span><div id="tasks"></div></div>
      <div class="fx"><span class="tag">The big rule (Ohm's law)</span><div class="row">${V('V','#E8384F')} = ${V('I','#FF8A2B')} × ${V('R','#2F6FE0')}</div><div class="row note">voltage push = current flow × resistance</div></div>
      <div class="fx"><span class="tag">Power (how bright)</span><div class="row">${V('P','#9A5BFF')} = ${V('V','#E8384F')} × ${V('I','#FF8A2B')}</div></div>
      <div class="fx"><span class="tag">In a line (series)</span><div class="row">${V('R','#2F6FE0')} = ${V('R','#2F6FE0')}<sub>1</sub> + ${V('R','#2F6FE0')}<sub>2</sub></div><div class="row note">Side by side (parallel): ${frac(1,V('R','#2F6FE0'))} = ${frac(1,V('R','#2F6FE0')+'<sub>1</sub>')} + ${frac(1,V('R','#2F6FE0')+'<sub>2</sub>')}</div></div>`});
  const {cv,panel}=ui,ctx=cv.getContext('2d');let dims=fitCanvas(cv);
  /* The board never shrinks under parts already placed: a narrower screen squeezes the dots closer together instead
     (it used to renumber the dots, which silently rewired or broke the child's circuit). */
  function layout(){const W=dims.w,H=dims.h;let ux=0,uy=0;for(const k of edges.keys())for(const[x,y] of ends(k)){ux=Math.max(ux,x+1);uy=Math.max(uy,y+1)}
    NX=Math.max(clamp(Math.floor(W/95),5,10),ux);NY=Math.max(clamp(Math.floor(H/95),4,7),uy);sp=Math.min(W/(NX+.3),H/(NY+.3));ox=(W-(NX-1)*sp)/2;oy=(H-(NY-1)*sp)/2}
  const key=(x,y,d)=>`${x},${y},${d}`,ends=k=>{const[x,y,d]=k.split(',');return d==='h'?[[+x,+y],[+x+1,+y]]:[[+x,+y],[+x,+y+1]]};
  const nid=(x,y)=>y*NX+x;
  /* ---------- solver: modified nodal analysis with Norton batteries ---------- */
  /* node voltages for the board; `skip` is a part to treat as removed (used to test what depends on what) */
  function nodal(skip){const N=NX*NY,G=[...Array(N)].map(()=>new Float64Array(N)),I=new Float64Array(N);
    for(let i=0;i<N;i++)G[i][i]+=1e-7;
    const stamp=(a,b,gc)=>{G[a][a]+=gc;G[b][b]+=gc;G[a][b]-=gc;G[b][a]-=gc};
    for(const [k,c] of edges){if(k===skip)continue;const[[ax,ay],[bx,by]]=ends(k),a=nid(ax,ay),b=nid(bx,by);if(c.broken||(c.kind==='sw'&&!c.on))continue;
      if(c.kind==='bat'){const r=.15,gs=1/r,plus=c.flip?a:b,minus=c.flip?b:a;stamp(a,b,gs);I[plus]+=c.V*gs;I[minus]-=c.V*gs}else stamp(a,b,1/(c.R??KIND[c.kind].R))}
    // gaussian elimination with partial pivoting
    const M=G.map((r,i)=>[...r,I[i]]);for(let c=0;c<N;c++){let p=c;for(let r=c+1;r<N;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;[M[c],M[p]]=[M[p],M[c]];const d=M[c][c];if(Math.abs(d)<1e-14)continue;
      for(let r=c+1;r<N;r++){const f=M[r][c]/d;if(!f)continue;for(let k=c;k<=N;k++)M[r][k]-=f*M[c][k]}}
    const Vn=new Float64Array(N);for(let r=N-1;r>=0;r--){let s=M[r][N];for(let k=r+1;k<N;k++)s-=M[r][k]*Vn[k];Vn[r]=Math.abs(M[r][r])<1e-14?0:s/M[r][r]}
    return Vn}
  const termsOf=k=>{const[[ax,ay],[bx,by]]=ends(k);return[nid(ax,ay),nid(bx,by)]};
  function solve(){const Vn=nodal(null);
    const st={bulbs:[],motors:[],bats:[]};
    for(const [k,c] of edges){const[a,b]=termsOf(k),dv=Vn[a]-Vn[b];
      if(c.broken||(c.kind==='sw'&&!c.on)){c.I=0;c.dV=dv;c.flowAB=0;if(c.kind==='bulb'){c.lit=false;st.bulbs.push(c)}continue}
      if(c.kind==='bat'){const plus=c.flip?a:b,minus=c.flip?b:a;c.I=(c.V-(Vn[plus]-Vn[minus]))/.15;c.dV=Vn[plus]-Vn[minus];c.flowAB=c.flip?-c.I:c.I;st.bats.push(c)}   // current flows minus→plus inside
      else{const R=c.R??KIND[c.kind].R;c.I=dv/R;c.dV=dv;c.flowAB=c.I}
      c.P=Math.abs(c.dV*c.I);if(c.kind==='bulb'){c.lit=c.P>.08;st.bulbs.push(c);if(c.P>14&&!c.broken){c.broken=true;c.lit=false;pop(1.2);noise(.2,3000,1,.3);ui.hint('Pop! Too much power burned out the bulb. Use fewer batteries or add a resistor.',4500);return solve()}}
      if(c.kind==='motor')st.motors.push(c)}
    /* Series and parallel are about how the bulbs are wired, not just their numbers:
       parallel = both ends of the two bulbs are joined by plain wire (the same two junctions);
       series   = the same current goes through both, so taking either bulb out puts the other one out too. */
    const litK=[...edges].filter(([,c])=>c.kind==='bulb'&&c.lit).map(([k])=>k);
    const par=[...Array(NX*NY).keys()],find=x=>{while(par[x]!==x)x=par[x]=par[par[x]];return x};
    for(const [k,c] of edges)if((c.kind==='wire'||c.kind==='sw'&&c.on)&&!c.broken){const[a,b]=termsOf(k);par[find(a)]=find(b)}
    const jn=k=>termsOf(k).map(find).sort((x,y)=>x-y).join(':');
    const currentIn=(k,V)=>{const[a,b]=termsOf(k),c=edges.get(k);return Math.abs((V[a]-V[b])/(c.R??KIND[c.kind].R))};
    st.par=false;st.series=false;
    for(let i=0;i<litK.length;i++)for(let j=i+1;j<litK.length;j++){const A=litK[i],B=litK[j];
      if(jn(A)===jn(B)){st.par=true;continue}
      if(!st.series&&Math.abs(Math.abs(edges.get(A).I)-Math.abs(edges.get(B).I))<.02&&currentIn(B,nodal(A))<.01&&currentIn(A,nodal(B))<.01)st.series=true}
    st.short=st.bats.some(b=>Math.abs(b.I)>4);st.switchUsed=switchUsed;sol=st;
    TASKS.forEach(([id,,test])=>{if(!done.has(id)&&test(st)){done.add(id);win(stage,null,null,'Challenge done!')}});drawTasks();showSel()}
  function drawTasks(){panel.querySelector('#tasks').innerHTML=TASKS.map(([id,t])=>`<div class="txt">${done.has(id)?'✅':'⬜'} ${t}</div>`).join('')}
  function showSel(){const el=panel.querySelector('#sel');const c=sel&&edges.get(sel);
    if(!c){el.innerHTML=`<div class="fx hot"><span class="tag">Meter</span><div class="row">Tap a part with 🔍 Meter to measure it.</div></div>`;return}
    const R=c.kind==='bat'?null:(c.R??KIND[c.kind].R),Iv=Math.abs(c.I||0),Vv=Math.abs(c.dV||0);
    patchPanel(el,`<div class="fx big hot"><span class="tag">${KIND[c.kind].n}${c.broken?' (burned out)':c.kind==='sw'?(c.on?' (closed)':' (open)'):''}</span>
      <div class="row">${V('V','#E8384F')} = <span class="num" style="color:#E8384F">${fmt(Vv,2)}</span> volts</div><div class="row">${V('I','#FF8A2B')} = <span class="num" style="color:#FF8A2B">${fmt(Iv,2)}</span> amps</div>
      ${R!=null&&c.kind!=='wire'&&c.kind!=='sw'?`<div class="row">${V('R','#2F6FE0')} = <span class="num" style="color:#2F6FE0">${fmt(R,1)}</span> ohms</div><div class="row note">check: ${fmt(Iv,2)} × ${fmt(R,1)} = ${fmt(Iv*R,2)} V</div>`:''}
      <div class="row">${V('P','#9A5BFF')} = ${fmt(Vv,2)} × ${fmt(Iv,2)} = <span class="num" style="color:#9A5BFF">${fmt(Vv*Iv,2)}</span> watts</div></div>
      ${c.kind==='bat'?`<div class="row note">Tap the battery again for more volts.</div>`:c.kind==='res'?`<div class="row note">Tap the resistor again to change its ohms.</div>`:''}`)}
  /* tap a selected battery or resistor again to step its value (no sliders) */
  const VSTEP=[1.5,3,4.5,6,9,12],RSTEP=[1,2,5,10,20,50];
  function bump(c,dir=1){const L=c.kind==='bat'?VSTEP:RSTEP,k=c.kind==='bat'?'V':'R';let i=L.findIndex(x=>x>=c[k]-1e-9);if(i<0)i=0;i=(i+dir+L.length)%L.length;c[k]=L[i];
    tone(c.kind==='bat'?300+i*90:700-i*80,.08,'triangle',.12);solve();ui.hint(c.kind==='bat'?`${c.V} volts`:`${c.R} ohms`,1200,true)}
  cv.addEventListener('wheel',e=>{const c=sel&&edges.get(sel);if(!c||(c.kind!=='bat'&&c.kind!=='res'))return;e.preventDefault();bump(c,e.deltaY<0?1:-1)},{passive:false});
  bindChips(ui.top,'ct',k=>{tool=k;ui.hint({wire:'Drag between dots to draw wires.',bat:'Drag between two dots. The + end is where you finish.',bulb:'Drag between two dots to place a bulb.',res:'Resistors slow the current down.',sw:'Place a switch, then tap it to flip it.',motor:'Place a fan. Current makes it spin!',meter:'Tap any part to measure it.',erase:'Tap a part to remove it.'}[k],2600)});
  stage.querySelector('#clr').addEventListener('click',()=>{edges.clear();sel=null;solve();tone(400,.08,'triangle')});
  /* ---------- input ---------- */
  const nodeAt=(x,y)=>{const i=Math.round((x-ox)/sp),j=Math.round((y-oy)/sp);if(i<0||j<0||i>=NX||j>=NY)return null;return Math.hypot(x-(ox+i*sp),y-(oy+j*sp))<sp*.32?[i,j]:null};
  const edgeAt=(x,y)=>{let best=null,bd=sp*.3;for(const k of edges.keys()){const[[ax,ay],[bx,by]]=ends(k),mx=ox+(ax+bx)/2*sp,my=oy+(ay+by)/2*sp,d=Math.hypot(x-mx,y-my);if(d<bd){bd=d;best=k}}return best};
  function place(a,b){const dx=b[0]-a[0],dy=b[1]-a[1];if(Math.abs(dx)+Math.abs(dy)!==1)return;const x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]),k=key(x,y,dx?'h':'v');
    const c={kind:tool};if(tool==='bat'){c.V=3;c.flip=(dx<0||dy<0)}if(tool==='res')c.R=10;if(tool==='sw')c.on=true;edges.set(k,c);if(tool!=='wire'){sel=k}tone(tool==='wire'?300:500,.06,'triangle');solve()}
  fingers(cv,{down(f){const n=nodeAt(f.x,f.y),e=edgeAt(f.x,f.y);f.data.n=n;
      if(tool==='erase'){if(e){edges.delete(e);if(sel===e)sel=null;noise(.15,1500,1,.1);solve()}return}
      if(tool==='meter'||(!n&&e)){if(e){const c=edges.get(e);if(e===sel&&(c.kind==='bat'||c.kind==='res')){bump(c);return}if(c.kind==='sw'&&tool!=='meter'){c.on=!c.on;tone(c.on?900:500,.06,'square',.06);const before=sol&&sol.bulbs.some(b=>b.lit);solve();const after=sol.bulbs.some(b=>b.lit);if(before!==after)switchUsed=true;solve()}
        sel=e;showSel();tone(700,.05,'sine')}return}},
    move(f){if(tool==='erase'){const e=edgeAt(f.x,f.y);if(e){edges.delete(e);if(sel===e)sel=null;solve()}return}if(!f.data.n)return;const n=nodeAt(f.x,f.y);if(n&&(n[0]!==f.data.n[0]||n[1]!==f.data.n[1])){place(f.data.n,n);f.data.moved=true;pend=null;f.data.n=tool==='wire'?n:null}},
    /* tap one dot, then a dot next to it: places the part without dragging */
    up(f){if(tool==='erase'||tool==='meter'||f.data.moved||!f.data.n)return;const n=f.data.n;
      if(pend&&Math.abs(pend[0]-n[0])+Math.abs(pend[1]-n[1])===1){place(pend,n);pend=null;return}
      pend=pend&&pend[0]===n[0]&&pend[1]===n[1]?null:n;if(pend)tone(880,.05,'sine',.08)}});
  /* ---------- drawing ---------- */
  function drawPart(k,c){const[[ax,ay],[bx,by]]=ends(k),x1=ox+ax*sp,y1=oy+ay*sp,x2=ox+bx*sp,y2=oy+by*sp,mx=(x1+x2)/2,my=(y1+y2)/2,ang=Math.atan2(y2-y1,x2-x1),L=sp;
    ctx.save();ctx.translate(mx,my);ctx.rotate(ang);const hot=sel===k;ctx.lineCap='round';
    const lead=(g0)=>{ctx.strokeStyle='#1D1842';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-L/2,0);ctx.lineTo(-g0,0);ctx.moveTo(g0,0);ctx.lineTo(L/2,0);ctx.stroke()};
    if(c.kind==='wire'){ctx.strokeStyle='#1D1842';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-L/2,0);ctx.lineTo(L/2,0);ctx.stroke();ctx.strokeStyle='#E8A43A';ctx.lineWidth=2.5;ctx.stroke()}
    if(c.kind==='bat'){lead(14);const s=c.flip?-1:1;ctx.fillStyle='#24C786';ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-L*.28,-L*.17,L*.56,L*.34,6);ctx.fill();ctx.stroke();
      ctx.fillStyle='#1D1842';ctx.fillRect(s>0?L*.28:-L*.28-6,-L*.08,6,L*.16);ctx.save();ctx.rotate(-ang);ctx.font=`900 ${L*.16}px Nunito`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(`${fmt(c.V,1)}V`,0,0);ctx.restore();
      ctx.fillStyle='#E8384F';ctx.font=`900 ${L*.2}px Nunito`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('+',s*L*.4,-L*.18);ctx.fillStyle='#2F6FE0';ctx.fillText('−',-s*L*.4,-L*.18);
      if(sol&&sol.short&&Math.abs(c.I)>4&&frame%6===0){dots.push({x:mx,y:my,smoke:1})}}
    if(c.kind==='bulb'){lead(L*.2);const p=c.broken?0:clamp((c.P||0)/2.5,0,1.4);if(p>.03){const gr=ctx.createRadialGradient(0,0,2,0,0,L*.6*Math.sqrt(p)+6);gr.addColorStop(0,`rgba(255,240,150,${Math.min(1,p)})`);gr.addColorStop(1,'rgba(255,200,61,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,L*.6*Math.sqrt(p)+6,0,7);ctx.fill()}
      ctx.fillStyle=c.broken?'#7E8BB8':p>.03?`hsl(50,100%,${60+p*20}%)`:'#EDEDF5';ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,L*.2,0,7);ctx.fill();ctx.stroke();
      ctx.strokeStyle=c.broken?'#E8384F':'#8A6A2A';ctx.lineWidth=2;ctx.beginPath();if(c.broken){ctx.moveTo(-6,-6);ctx.lineTo(6,6);ctx.moveTo(6,-6);ctx.lineTo(-6,6)}else{ctx.moveTo(-L*.12,0);for(let i=0;i<4;i++)ctx.lineTo(-L*.12+L*.06*(i+.5),i%2?5:-5);ctx.lineTo(L*.12,0)}ctx.stroke()}
    if(c.kind==='res'){lead(L*.24);ctx.strokeStyle='#1D1842';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-L*.24,0);for(let i=0;i<6;i++)ctx.lineTo(-L*.24+L*.08*(i+.5),i%2?L*.1:-L*.1);ctx.lineTo(L*.24,0);ctx.stroke();ctx.save();ctx.rotate(-ang);ctx.fillStyle='#2F6FE0';ctx.font=`900 ${L*.15}px Nunito`;ctx.textAlign='center';ctx.fillText(`${c.R}Ω`,0,-L*.17);ctx.restore()}
    if(c.kind==='sw'){ctx.strokeStyle='#1D1842';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-L/2,0);ctx.lineTo(-L*.2,0);ctx.moveTo(L*.2,0);ctx.lineTo(L/2,0);ctx.stroke();
      ctx.lineWidth=5;ctx.strokeStyle=c.on?'#1FA463':'#E8384F';ctx.beginPath();ctx.moveTo(-L*.2,0);ctx.lineTo(c.on?L*.2:L*.12,c.on?0:-L*.25);ctx.stroke();ctx.fillStyle='#fff';ctx.strokeStyle='#1D1842';ctx.lineWidth=2.5;
      for(const xx of [-L*.2,L*.2]){ctx.beginPath();ctx.arc(xx,0,5,0,7);ctx.fill();ctx.stroke()}}
    if(c.kind==='motor'){lead(L*.22);ctx.fillStyle='#9AA6D6';ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,L*.22,0,7);ctx.fill();ctx.stroke();c.rot=(c.rot||0)+(c.I||0)*.12;
      ctx.save();ctx.rotate(c.rot);ctx.fillStyle='#FFC83D';for(let i=0;i<3;i++){ctx.rotate(2.094);ctx.beginPath();ctx.ellipse(0,-L*.11,L*.05,L*.1,0,0,7);ctx.fill();ctx.stroke()}ctx.restore()}
    if(hot){ctx.strokeStyle='rgba(154,91,255,.8)';ctx.lineWidth=3;ctx.setLineDash([6,5]);ctx.strokeRect(-L/2+6,-L*.32,L-12,L*.64);ctx.setLineDash([])}
    ctx.restore()}
  function draw(){const W=dims.w,H=dims.h;ctx.setTransform(dims.d,0,0,dims.d,0,0);ctx.fillStyle='#1F6B54';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=1;for(let x=0;x<W;x+=12){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
    for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(ox+i*sp,oy+j*sp,5,0,7);ctx.fill()}
    for(const [k,c] of edges)drawPart(k,c);
    if(pend){const px=ox+pend[0]*sp,py=oy+pend[1]*sp,r=10+Math.sin(performance.now()/160)*3;ctx.strokeStyle='#FFE23D';ctx.lineWidth=4;ctx.beginPath();ctx.arc(px,py,r,0,7);ctx.stroke();ctx.fillStyle='rgba(255,226,61,.35)';for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const qi=pend[0]+dx,qj=pend[1]+dy;if(qi>=0&&qj>=0&&qi<NX&&qj<NY){ctx.beginPath();ctx.arc(ox+qi*sp,oy+qj*sp,9,0,7);ctx.fill()}}}
    // moving charge: yellow dots along each part, speed ~ current
    for(const [k,c] of edges){if(!c.flowAB||Math.abs(c.flowAB)<.01)continue;const[[ax,ay],[bx,by]]=ends(k),x1=ox+ax*sp,y1=oy+ay*sp,x2=ox+bx*sp,y2=oy+by*sp;
      c.ph=((c.ph||0)+clamp(c.flowAB,-3,3)*.012)%1;for(let q=0;q<3;q++){let t=(c.ph+q/3+1)%1;ctx.fillStyle='#FFE36E';ctx.beginPath();ctx.arc(lerp(x1,x2,t),lerp(y1,y2,t),3.5,0,7);ctx.fill()}}
    for(let i=dots.length-1;i>=0;i--){const d=dots[i];d.y-=.8;d.smoke-=.015;if(d.smoke<=0){dots.splice(i,1);continue}ctx.fillStyle=`rgba(120,120,140,${d.smoke*.6})`;ctx.beginPath();ctx.arc(d.x,d.y,10*(1.4-d.smoke),0,7);ctx.fill()}
    if(sol&&sol.short&&frame%90===0)ui.hint('Short circuit! The battery is pushing current with nothing to slow it down.',2500)}
  function resize(){dims=fitCanvas(cv);layout();solve()}const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  layout();
  kbPointer(g,cv);
  const CT=[...Object.keys(KIND),'meter','erase'];
  g.key(e=>{if(/^[1-8]$/.test(e.key)){ui.top.querySelector(`[data-ct="${CT[+e.key-1]}"]`).click();return true}
    if((e.key==='Delete'||e.key==='Backspace')&&sel){edges.delete(sel);sel=null;solve();return true}
    if(e.key.toLowerCase()==='t'&&sel){const c=edges.get(sel);if(c&&c.kind==='sw'){const before=sol&&sol.bulbs.some(b=>b.lit);c.on=!c.on;tone(c.on?900:500,.06,'square',.06);solve();if(before!==sol.bulbs.some(b=>b.lit)){switchUsed=true;solve()}}return true}return false});
  // starter circuit with a gap to close
  edges.set(key(1,1,'v'),{kind:'bat',V:3,flip:true});edges.set(key(1,1,'h'),{kind:'wire'});edges.set(key(2,1,'h'),{kind:'bulb'});edges.set(key(3,1,'v'),{kind:'wire'});edges.set(key(1,2,'h'),{kind:'wire'});
  solve();drawTasks();ui.hint('Draw a wire to close the gap and light the bulb!',5000);
  g.loop(()=>{frame++;draw()});
  GAMES.circuit._debug={edges,solve,get sol(){return sol},key,done,setTool(t){tool=t},place:(a,b)=>place(a,b),geom:()=>({ox,oy,sp,NX,NY}),get sel(){return sel}};
}}});
