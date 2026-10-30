/* ============================================================
   LETTER TRACE — follow the arrows, stroke by stroke
   ============================================================ */
Object.assign(GAMES,{trace:{title:'Letter Trace',icon:'✍️',c:'var(--leaf)',age:'4+',order:7,blurb:'Trace letters and numbers the right way',
init(stage,g){
  const arc=(cx,cy,rx,ry,a0,a1)=>{const n=Math.max(8,Math.ceil(Math.abs(a1-a0)/7)),o=[];for(let i=0;i<=n;i++){const a=(a0+(a1-a0)*i/n)*Math.PI/180;o.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry])}return o};
  const GL={
    A:[[[50,0],[8,140]],[[50,0],[92,140]],[[24,92],[76,92]]],
    B:[[[15,0],[15,140]],[[15,0],[50,0],...arc(50,35,32,35,-90,90),[15,70]],[[15,70],[55,70],...arc(55,105,33,35,-90,90),[15,140]]],
    C:[arc(58,70,46,68,-40,-320)],
    D:[[[15,0],[15,140]],[[15,0],[38,0],...arc(38,70,50,70,-90,90),[15,140]]],
    E:[[[15,0],[15,140]],[[15,0],[85,0]],[[15,70],[72,70]],[[15,140],[85,140]]],
    F:[[[15,0],[15,140]],[[15,0],[85,0]],[[15,70],[72,70]]],
    G:[[...arc(56,70,44,68,-40,-360),[62,70]]],
    H:[[[15,0],[15,140]],[[85,0],[85,140]],[[15,70],[85,70]]],
    I:[[[50,0],[50,140]],[[22,0],[78,0]],[[22,140],[78,140]]],
    J:[[[72,0],[72,100],...arc(45,100,27,40,0,180)]],
    K:[[[15,0],[15,140]],[[85,0],[15,82]],[[42,56],[88,140]]],
    L:[[[15,0],[15,140],[85,140]]],
    M:[[[10,140],[10,0],[50,92],[90,0],[90,140]]],
    N:[[[15,140],[15,0],[85,140],[85,0]]],
    O:[arc(50,70,42,68,-90,-450)],
    P:[[[15,0],[15,140]],[[15,0],[52,0],...arc(52,36,33,36,-90,90),[15,72]]],
    Q:[arc(50,70,42,68,-90,-450),[[58,102],[92,142]]],
    R:[[[15,0],[15,140]],[[15,0],[52,0],...arc(52,36,33,36,-90,90),[15,72]],[[45,72],[88,140]]],
    S:[[...arc(50,36,36,36,-20,-270),...arc(50,106,38,34,-90,140)]],
    T:[[[10,0],[90,0]],[[50,0],[50,140]]],
    U:[[[15,0],[15,95],...arc(50,95,35,45,180,0),[85,0]]],
    V:[[[10,0],[50,140],[90,0]]],
    W:[[[5,0],[27,140],[50,45],[73,140],[95,0]]],
    X:[[[15,0],[85,140]],[[85,0],[15,140]]],
    Y:[[[10,0],[50,70],[50,140]],[[90,0],[50,70]]],
    Z:[[[15,0],[85,0],[15,140],[85,140]]],
    0:[arc(50,70,38,68,-90,-450)],
    1:[[[28,28],[56,0],[56,140]]],
    2:[[...arc(50,40,36,38,-165,20),[15,140],[88,140]]],
    3:[[...arc(48,36,34,36,-150,90),...arc(48,105,38,35,-90,150)]],
    4:[[[68,140],[68,0],[10,96],[92,96]]],
    5:[[[82,0],[28,0],[24,62],...arc(48,96,38,42,-130,140)]],
    6:[[...arc(55,75,42,65,-60,-270),...arc(52,105,36,35,90,-270)]],
    7:[[[12,0],[88,0],[38,140]]],
    8:[[...arc(50,35,30,35,90,-270),...arc(50,105,35,35,-90,270)]],
    9:[[...arc(50,40,34,38,0,-360),[84,40],[80,140]]]};
  const SETS={abc:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),num:'0123456789'.split('')};
  const PAINTS=['#FF4F7B','#FF8A2B','#FFC83D','#24C786','#18BFD6','#3E67F0','#9A5BFF'];
  stage.innerHTML=`<div class="simwrap"><div class="simarea"><canvas class="simcv" aria-label="Tracing board"></canvas><div class="simhint" id="hint"></div></div>
    <div class="dock"><div class="drow"><button class="opt on" data-set="abc"><span class="oe">🔤</span>ABC</button><button class="opt" data-set="num"><span class="oe">🔢</span>123</button><span class="sep"></span>
      <button class="tool" id="prev"><span class="ti">◀️</span>Back</button><button class="tool" id="again"><span class="ti">🔁</span>Again</button><button class="tool" id="next"><span class="ti">▶️</span>Next</button>
      <span class="otext">Start at the green dot and follow the arrows.</span></div></div></div>`;
  const cv=stage.querySelector('canvas'),ctx=cv.getContext('2d'),hintEl=stage.querySelector('#hint');
  const hint=makeHint(hintEl);
  let dims=fitCanvas(cv),set='abc',idx=0,ch='A',strokes=[],si=0,p=0,k=1,ox=0,oy=0,done=false,celebrate=0,frame=0,tracing=null,nudge=0;
  const trail=[];
  function layout(){k=Math.min(dims.h*.7/140,dims.w*.5/100);ox=dims.w/2-50*k;oy=dims.h/2-70*k-dims.h*.02}
  function dens(poly){const o=[];for(let i=1;i<poly.length;i++){const a=poly[i-1],b=poly[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(l/2));for(let j=0;j<n;j++)o.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n])}o.push(poly[poly.length-1]);return o}
  let rid=0;
  function load(i){idx=(i+SETS[set].length)%SETS[set].length;ch=SETS[set][idx];strokes=GL[ch].map(dens);si=0;p=0;done=false;celebrate=0;rid++;tracing=null;
    layout();say(set==='abc'?`Let's trace ${ch}`:`Let's trace the number ${NUMW[+ch]}`);}
  const toPx=q=>[ox+q[0]*k,oy+q[1]*k],tol=()=>Math.max(16,k*15);
  function startTrace(f){if(done)return;const s=strokes[si],q=toPx(s[p]);if(Math.hypot(f.x-q[0],f.y-q[1])<tol()*1.7){tracing=f.id;tone(500,.06,'triangle',.1)}
    else{nudge=40;hint('Start at the green dot!');tone(240,.12,'sine',.08)}}
  function follow(f){if(tracing!==f.id||done)return;const s=strokes[si];let best=-1,bd=1e9;
    for(let j=p;j<Math.min(s.length,p+24);j++){const q=toPx(s[j]),d=Math.hypot(f.x-q[0],f.y-q[1]);if(d<tol()&&j>=best){best=j;bd=d}}
    if(best>p){if(((best/6)|0)!==((p/6)|0))tone(400+si*90+best*2,.05,'triangle',.06);p=best}
    else{const q=toPx(s[p]);if(Math.hypot(f.x-q[0],f.y-q[1])>tol()*3){tracing=null;nudge=30}}
    trail.push({x:f.x,y:f.y,l:1});
    if(p>=s.length-3){tracing=null;si++;p=0;tone(660,.12,'triangle');tone(880,.14,'triangle',.15,.08);
      if(si>=strokes.length){done=true;finish()}else{hint(`Great! Now line ${si+1}.`,1600)}}}
  function finish(){celebrate=1;addStar();cheer();const r=cv.getBoundingClientRect();burst(r.left+dims.w/2,r.top+oy+70*k,70);
    if(set==='abc'){const L=LETTERS.find(l=>l[0]===ch);say(`${ch}! ${ch} is for ${L[1]}!`)}else say(`${NUMW[+ch]}! You traced ${NUMW[+ch]}!`);
    const my=rid;g.later(()=>{if(g.alive&&done&&my===rid)load(idx+1)},3800)}
  fingers(cv,{down(f){startTrace(f)},move(f){follow(f)},up(f){if(tracing===f.id)tracing=null}});
  stage.querySelector('.drow').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.set){set=b.dataset.set;stage.querySelectorAll('[data-set]').forEach(x=>x.classList.toggle('on',x===b));load(0)}
    if(b.id==='prev')load(idx-1);if(b.id==='next')load(idx+1);if(b.id==='again')load(idx);tone(560,.08,'triangle')});
  function polyPath(pts,upto){ctx.beginPath();for(let i=0;i<=Math.min(upto,pts.length-1);i++){const q=toPx(pts[i]);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])}}
  function draw(){
    const W=dims.w,H=dims.h;ctx.setTransform(dims.d,0,0,dims.d,0,0);ctx.fillStyle='#FFFDF6';ctx.fillRect(0,0,W,H);
    // writing-paper lines
    ctx.strokeStyle='rgba(62,103,240,.18)';ctx.lineWidth=2;for(const y of [oy,oy+140*k]){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
    ctx.setLineDash([10,10]);ctx.beginPath();ctx.moveTo(0,oy+70*k);ctx.lineTo(W,oy+70*k);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='rgba(255,79,123,.25)';ctx.beginPath();ctx.moveTo(W*.08,0);ctx.lineTo(W*.08,H);ctx.stroke();
    const sc=celebrate?1+Math.sin(Math.min(celebrate,30)/30*Math.PI)*.08:1;if(celebrate)celebrate++;
    ctx.save();ctx.translate(W/2,oy+70*k);ctx.scale(sc,sc);ctx.translate(-W/2,-(oy+70*k));
    ctx.lineCap='round';ctx.lineJoin='round';
    // guide
    for(const s of strokes){polyPath(s,1e9);ctx.strokeStyle='#E4E7FA';ctx.lineWidth=tol()*1.9;ctx.stroke()}
    for(const s of strokes){polyPath(s,1e9);ctx.strokeStyle='rgba(29,24,66,.28)';ctx.lineWidth=3;ctx.setLineDash([2,10]);ctx.stroke();ctx.setLineDash([])}
    // painted
    strokes.forEach((s,i)=>{if(i<si||done){polyPath(s,1e9)}else if(i===si&&p>0){polyPath(s,p)}else return;ctx.strokeStyle=PAINTS[i%PAINTS.length];ctx.lineWidth=tol()*1.5;ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=tol()*.35;ctx.stroke()});
    if(!done){const s=strokes[si];
      // arrows along the current line
      for(let j=p+10;j<s.length-6;j+=22){const a=toPx(s[j]),b=toPx(s[Math.min(s.length-1,j+3)]),an=Math.atan2(b[1]-a[1],b[0]-a[0]);ctx.save();ctx.translate(a[0],a[1]);ctx.rotate(an);
        ctx.fillStyle='rgba(29,24,66,.55)';ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-5,-7);ctx.lineTo(-2,0);ctx.lineTo(-5,7);ctx.closePath();ctx.fill();ctx.restore()}
      // end flag + start dot
      const e=toPx(s[s.length-1]);ctx.fillStyle='rgba(255,79,123,.9)';ctx.beginPath();ctx.arc(e[0],e[1],tol()*.38,0,7);ctx.fill();
      const q=toPx(s[p]),pul=(Math.sin(frame*.12)*.5+.5)*(nudge?2:1);ctx.fillStyle='rgba(36,199,134,.25)';ctx.beginPath();ctx.arc(q[0],q[1],tol()*(1+pul*.5),0,7);ctx.fill();
      ctx.fillStyle='#24C786';ctx.strokeStyle='#1D1842';ctx.lineWidth=4;ctx.beginPath();ctx.arc(q[0],q[1],tol()*.75,0,7);ctx.fill();ctx.stroke();
      ctx.fillStyle='#fff';ctx.font=`900 ${Math.round(tol()*.9)}px Nunito,system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(si+1,q[0],q[1]+1)}
    ctx.restore();
    // picture helper
    const L=set==='abc'?LETTERS.find(l=>l[0]===ch):null;ctx.textAlign='center';ctx.textBaseline='middle';
    if(L){ctx.font=`${Math.round(k*34)}px serif`;ctx.fillText(L[2],ox+100*k+(W-(ox+100*k))/2,oy+70*k);ctx.font=`900 ${Math.round(k*11)}px Nunito,system-ui,sans-serif`;ctx.fillStyle='#1D1842';ctx.fillText(L[1],ox+100*k+(W-(ox+100*k))/2,oy+70*k+k*30)}
    else{const n=+ch,side=W-(ox+100*k),cell=Math.min(k*15,side/5.6),cx0=ox+100*k+side/2;ctx.font=`${Math.round(cell*.9)}px serif`;for(let i=0;i<n;i++){const col=i%5,row=(i/5)|0;ctx.fillText('⭐',cx0+(col-2)*cell,oy+70*k+(row-.5)*cell*1.15)}}
    ctx.fillStyle='#1D1842';ctx.font=`800 ${Math.round(k*40)}px 'Baloo 2',system-ui,sans-serif`;ctx.fillText(ch,ox/2,oy+70*k);
    // sparkle trail
    for(let i=trail.length-1;i>=0;i--){const t=trail[i];t.l-=.05;if(t.l<=0){trail.splice(i,1);continue}ctx.globalAlpha=t.l;ctx.fillStyle=PAINTS[i%PAINTS.length];ctx.beginPath();ctx.arc(t.x+(Math.random()-.5)*6,t.y+(Math.random()-.5)*6,3+3*t.l,0,7);ctx.fill()}
    ctx.globalAlpha=1;if(nudge>0)nudge--;
  }
  function resize(){const nd=fitCanvas(cv);if(Math.abs(nd.w-dims.w)<2&&Math.abs(nd.h-dims.h)<2&&nd.d===dims.d)return;dims=nd;layout()}
  const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  /* keyboard: hold Space to trace along the line, arrows change the letter */
  g.key(e=>{if(e.key==='ArrowRight'){load(idx+1);return true}if(e.key==='ArrowLeft'){load(idx-1);return true}
    if((e.key===' '||e.key==='Enter')&&!done){const s=strokes[si];p=Math.min(s.length-1,p+6);const q=toPx(s[p]);trail.push({x:q[0],y:q[1],l:1});tone(400+si*90+p*2,.05,'triangle',.06);
      if(p>=s.length-3){si++;p=0;tone(660,.12,'triangle');if(si>=strokes.length){done=true;finish()}}return true}
    if(/^[a-z0-9]$/i.test(e.key)){const c=e.key.toUpperCase(),inSet=SETS[set].indexOf(c);if(inSet<0){set=set==='abc'?'num':'abc';stage.querySelectorAll('[data-set]').forEach(x=>x.classList.toggle('on',x.dataset.set===set))}load(SETS[set].indexOf(c));return true}return false});
  load(0);g.loop(()=>{frame++;draw()});
  GAMES.trace._debug={get state(){return{ch,si,p,done,n:strokes.map(s=>s.length)}},toPx:q=>toPx(q),get strokes(){return strokes},tol,SETS};
}}});
