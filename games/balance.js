/* ============================================================
   BALANCE SCALE — algebra with mystery boxes, and torque
   ============================================================ */
Object.assign(GAMES,{balance:{title:'Balance Scale',icon:'⚖️',c:'var(--sun)',age:'6+',section:'math',order:2,blurb:'Find the mystery box. Keep the scale level.',
init(stage,g){
  const LEVELS=[[1,2,0,5],[1,4,0,9],[2,0,0,8],[2,1,0,7],[3,2,0,14],[1,6,2,2],[2,5,3,1],[4,3,2,11],[3,1,1,9],[5,2,3,10]];
  let mode='alg',li=0,x=0,L,R,tilt=0,tiltV=0,steps=[],hist=[],solved=false,frame=0,fly=[];
  // torque mode
  let tq={left:[],right:[],pick:1,bank:[],ang:0,av:0,solved:false};
  const ui=labShell(stage,{label:'Scale',top:`${chips('mode',[['alg','📦 Mystery box'],['torque','🛝 Seesaw']],'alg')}<span class="sep"></span><span class="lvl" id="lv"></span>
    <button class="pbtn small" id="undo">↩ Undo</button><button class="pbtn small" id="split" hidden>÷ Split into groups</button><button class="pbtn small" id="next">➜ Next</button>`,
    panel:`<div id="tqbank" class="keep" hidden></div><div class="fx big hot" id="eqc"><span class="tag">The scale says</span><div class="row" id="eq"></div><div class="row note" id="how"></div></div>
      <div class="fx"><span class="tag">Your steps</span><div id="steps"></div></div>
      <div class="fx" id="rule"><span class="tag">The secret</span><div class="row">Whatever you do to one side, do to the other side too.</div></div>`});
  const {cv,panel}=ui,ctx=cv.getContext('2d');let dims=fitCanvas(cv);
  const xC='#9A5BFF',uC='#FFC83D';
  const sideStr=s=>{const p=[];if(s.b)p.push(s.b===1?V('x',xC):`<span class="num">${s.b}</span>${V('x',xC)}`);if(s.u||!s.b)p.push(`<span class="num">${s.u}</span>`);return p.join(' + ')};
  const weight=s=>s.b*x+s.u;
  /* ---------- algebra mode ---------- */
  function loadAlg(i){li=i;const lv=LEVELS[i]||(()=>{const xx=rint(2,9),a=rint(2,5),c=rint(0,a-1),b=rint(0,9);return[a,b,c,(a-c)*xx+b]})();
    let [a,b,c,d]=lv;x=(d-b)/(a-c);if(!Number.isInteger(x)||x<=0){x=rint(2,8);d=(a-c)*x+b}
    L={b:a,u:b};R={b:c,u:d};hist=[];steps=[];solved=false;tilt=0;stage.querySelector('#lv').textContent=`Level ${li+1}`;log();sync()}
  function log(){if(weight(L)===weight(R))steps.push(`${sideStr(L)} = ${sideStr(R)}`)}
  function sync(){if(mode!=='alg')return;const bal=weight(L)===weight(R);
    panel.querySelector('#eq').innerHTML=`${sideStr(L)} <b style="color:${bal?'#1FA463':'#E8384F'}">${bal?'=':'≠'}</b> ${sideStr(R)}`;
    panel.querySelector('#eqc').classList.toggle('hot',bal);
    panel.querySelector('#steps').innerHTML=steps.map((s,i)=>`<div class="row">${i?'<span class="note">then</span>':''} ${s}</div>`).join('');
    const canSplit=bal&&!solved&&((L.u===0&&L.b>1&&R.b===0&&R.u%L.b===0)||(R.u===0&&R.b>1&&L.b===0&&L.u%R.b===0));
    stage.querySelector('#split').hidden=!canSplit;
    if(bal&&!solved&&((L.b===1&&L.u===0&&R.b===0)||(R.b===1&&R.u===0&&L.b===0))){solved=true;
      const lv=li;g.later(()=>{if(mode!=='alg'||li!==lv||!solved)return;panel.querySelector('#steps').innerHTML+=`<div class="row"><b>${V('x',xC)} = <span class="num">${x}</span></b> 🎉</div>`;win(stage,null,null,`x = ${x}`);g.later(()=>{if(mode==='alg'&&li===lv)loadAlg(li+1)},3400);noise(.3,1200,1,.1)},500)}}
  function take(side,kind){if(solved)return;const s=side==='L'?L:R;if(!s[kind])return;hist.push(JSON.stringify([L,R,steps.length]));s[kind]--;
    const was=steps.length;log();if(steps.length>was){/* balanced again: good move */tone(660,.1,'triangle');tone(880,.12,'triangle',.15,.06)}else tone(300,.12,'sine',.12);sync()}
  function split(){const n=L.u===0?L.b:R.b;hist.push(JSON.stringify([L,R,steps.length]));
    if(L.u===0){L.b=1;R.u/=n}else{R.b=1;L.u/=n}steps.push(`<span class="note">÷ ${n} on both sides:</span> ${sideStr(L)} = ${sideStr(R)}`);tone(520,.1,'triangle');tone(780,.14,'triangle',.15,.08);sync()}
  stage.querySelector('#undo').addEventListener('click',()=>{if(mode==='torque'){if(tq.solved)return;tq.right.pop();tone(400,.08,'triangle');syncTq();return}const h=hist.pop();if(!h)return;const[l,r,n]=JSON.parse(h);L=l;R=r;steps.length=n;solved=false;sync();tone(420,.08,'triangle')});
  stage.querySelector('#split').addEventListener('click',split);
  stage.querySelector('#next').addEventListener('click',()=>{mode==='alg'?loadAlg(li+1):loadTq(tq.lvl+1)});
  /* layout of things on the pans (for drawing and tapping) */
  let items=[];
  function layoutAlg(cx,py,side){const s=side==='L'?L:R,out=[];const n=s.b+s.u,per=Math.max(4,Math.ceil(Math.sqrt(n*2))),sz=Math.min(42,dims.w*.045);
    const kinds=[...Array(s.b).fill('b'),...Array(s.u).fill('u')];
    kinds.forEach((kind,k)=>{const row=Math.floor(k/per),inRow=Math.min(per,n-row*per),col=k%per;out.push({kind,side,x:cx+(col-(inRow-1)/2)*sz*1.05,y:py-sz*.55-row*sz*1.02,sz})});return out}
  /* ---------- torque mode ---------- */
  const TQ=[{l:[[3,2]],bank:[3]},{l:[[4,3]],bank:[2,6]},{l:[[2,5],[1,2]],bank:[3,4]},{l:[[3,4]],bank:[2,2,2]},{l:[[5,2],[2,4]],bank:[3,6]},{l:[[4,5]],bank:[5,1,3]}];
  function loadTq(i){tq.lvl=i;const L0=TQ[i]||(()=>{const m=rint(1,5),d=rint(1,5),bm=pick([1,2,3,4,5].filter(v=>(m*d)%v===0&&(m*d)/v<=5));return{l:[[m,d]],bank:[bm,rint(1,5)]}})();
    tq.left=L0.l.map(([m,d])=>({m,d}));tq.right=[];tq.bank=L0.bank.slice();tq.pick=tq.bank[0];tq.solved=false;stage.querySelector('#lv').textContent=`Level ${i+1}`;drawBank();syncTq()}
  const tor=a=>a.reduce((s,o)=>s+o.m*o.d,0);
  function drawBank(){const el=panel.querySelector('#tqbank');el.innerHTML=`<p class="tagline">Your blocks: tap one, then tap a peg on the right</p><div class="pbar">${tq.bank.map((m,i)=>`<button class="opt ${tq.pick===m&&!tq.used?.includes(i)?'on':''}" data-blk="${i}">${'■'.repeat(Math.min(m,6))} ${m}<span class="unit">&nbsp;kg</span></button>`).join('')}</div>`}
  panel.querySelector('#tqbank').addEventListener('click',e=>{const b=e.target.closest('[data-blk]');if(!b)return;tq.pick=tq.bank[+b.dataset.blk];tq.pi=+b.dataset.blk;
    panel.querySelectorAll('[data-blk]').forEach(o=>o.classList.toggle('on',o===b));tone(560,.07,'triangle')});
  function syncTq(){const tl=tor(tq.left),tr=tor(tq.right),bal=tl===tr;
    panel.querySelector('#eq').innerHTML=`${tq.left.map(o=>`<span class="num" style="color:#E8384F">${o.m}</span>×<span class="num" style="color:#2F6FE0">${o.d}</span>`).join(' + ')} = <span class="num">${tl}</span> <b style="color:${bal?'#1FA463':'#E8384F'}">${bal?'=':tl>tr?'>':'<'}</b> <span class="num">${tr}</span>${tq.right.length?' = '+tq.right.map(o=>`<span class="num" style="color:#E8384F">${o.m}</span>×<span class="num" style="color:#2F6FE0">${o.d}</span>`).join(' + '):''}`;
    panel.querySelector('#steps').previousElementSibling.textContent='The rule';panel.querySelector('#steps').innerHTML=`<div class="row">${V('m','#E8384F')}<sub>1</sub>·${V('d','#2F6FE0')}<sub>1</sub> = ${V('m','#E8384F')}<sub>2</sub>·${V('d','#2F6FE0')}<sub>2</sub></div><div class="row note">weight × distance from the middle</div>`;
    if(bal&&tq.right.length&&!tq.solved){tq.solved=true;const lv=tq.lvl;g.later(()=>{if(mode!=='torque'||tq.lvl!==lv)return;win(stage,null,null,'Balanced!');g.later(()=>{if(mode==='torque'&&tq.lvl===lv)loadTq(lv+1)},2200)},600)}}
  function setMode(m){mode=m;panel.querySelector('#steps').previousElementSibling.textContent='Your steps';panel.querySelector('#tqbank').hidden=m!=='torque';panel.querySelector('#rule').hidden=m==='torque';
    stage.querySelector('#split').hidden=true;
    panel.querySelector('#how').textContent=m==='alg'?'Tap a box or a coin to take it off the scale. Make one side just a single box. Each purple box weighs the same.':'Weight × distance must match on both sides. Far from the middle pushes harder.';
    if(m==='alg')loadAlg(li);else loadTq(tq.lvl||0)}
  bindChips(ui.top,'mode',setMode);
  /* ---------- input ---------- */
  fingers(cv,{down(f){
    if(mode==='alg'){const it=items.slice().reverse().find(o=>Math.abs(o.x-f.x)<o.sz*.55&&Math.abs(o.y-f.y)<o.sz*.55);if(it){fly.push({...it,vy:-6,vx:(it.side==='L'?-1:1)*3,l:1});take(it.side,it.kind)}return}
    // torque: tap a peg on the right side to hang the chosen block, or a hung block to take it back
    if(tq.solved)return;const g0=geomTq();for(let d=1;d<=5;d++){const px=g0.cx+Math.cos(g0.a)*d*g0.sp,py=g0.cy+Math.sin(g0.a)*d*g0.sp;if(Math.hypot(f.x-px,f.y-(py+20))<g0.sp*.45){
        const on=tq.right.findIndex(o=>o.d===d);if(on>=0&&f.y>py+10){tq.right.splice(on,1);tone(400,.08,'triangle');syncTq();return}
        tq.right.push({m:tq.pick,d});tone(300+d*80,.1,'triangle');syncTq();return}}}});
  /* ---------- drawing ---------- */
  function geomTq(){const W=dims.w,H=dims.h;return{cx:W/2,cy:H*.48,sp:Math.min(W*.085,H*.14),a:tq.ang}}
  function drawBlock(x,y,m,sz){const h=sz*(.6+m*.18);ctx.fillStyle=['#FF4F7B','#FF8A2B','#FFC83D','#24C786','#18BFD6','#9A5BFF'][m%6];ctx.strokeStyle='#1D1842';ctx.lineWidth=3;
    ctx.beginPath();ctx.roundRect(x-sz/2,y,sz,h,6);ctx.fill();ctx.stroke();ctx.fillStyle='#1D1842';ctx.font=`900 ${sz*.38}px Nunito,system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(m,x,y+h/2);return h}
  function draw(){
    const W=dims.w,H=dims.h;ctx.setTransform(dims.d,0,0,dims.d,0,0);ctx.fillStyle='#FDFBF4';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#E8E1CC';ctx.fillRect(0,H*.88,W,H*.12);
    if(mode==='alg'){
      const diff=weight(R)-weight(L),target=clamp(diff*.045,-.32,.32);tiltV+=(target-tilt)*.05;tiltV*=.86;tilt+=tiltV;
      const cx=W/2,cy=H*.36,arm=Math.min(W*.36,H*.75),ca=Math.cos(tilt),sa=Math.sin(tilt);
      // stand
      ctx.fillStyle='#7E8BB8';ctx.strokeStyle='#1D1842';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx-40,H*.88);ctx.lineTo(cx+40,H*.88);ctx.closePath();ctx.fill();ctx.stroke();
      // beam
      ctx.save();ctx.translate(cx,cy);ctx.rotate(tilt);ctx.fillStyle='#C98B4F';ctx.beginPath();ctx.roundRect(-arm,-8,arm*2,16,8);ctx.fill();ctx.stroke();ctx.restore();
      ctx.fillStyle='#FFC83D';ctx.beginPath();ctx.arc(cx,cy,10,0,7);ctx.fill();ctx.stroke();
      items=[];
      for(const side of ['L','R']){const sgn=side==='L'?-1:1,ex=cx+sgn*arm*ca,ey=cy+sgn*arm*sa,pw=arm*.75,py=ey+H*.28;
        ctx.strokeStyle='#1D1842';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex-pw/2,py);ctx.moveTo(ex,ey);ctx.lineTo(ex+pw/2,py);ctx.stroke();
        ctx.fillStyle='#9AA6D6';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(ex,py,pw/2,12,0,0,Math.PI);ctx.closePath();ctx.fill();ctx.stroke();
        items.push(...layoutAlg(ex,py,side))}
      for(const it of items)drawItem(it.x,it.y,it.kind,it.sz,false);
      for(let i=fly.length-1;i>=0;i--){const o=fly[i];o.x+=o.vx;o.y+=o.vy;o.vy+=.5;o.l-=.03;if(o.l<=0){fly.splice(i,1);continue}ctx.globalAlpha=o.l;drawItem(o.x,o.y,o.kind,o.sz,false);ctx.globalAlpha=1}
      if(solved){const box=items.find(o=>o.kind==='b');if(box){ctx.fillStyle='#fff';ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.arc(box.x,box.y-box.sz,box.sz*.7,0,7);ctx.fill();ctx.stroke();
        ctx.fillStyle='#9A5BFF';ctx.font=`900 ${box.sz*.75}px Nunito,system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(x,box.x,box.y-box.sz)}}
    }else{
      const tl=tor(tq.left),tr=tor(tq.right);const target=clamp((tr-tl)*.03,-.3,.3);tq.av+=(target-tq.ang)*.04;tq.av*=.9;tq.ang+=tq.av;
      const G=geomTq();ctx.fillStyle='#7E8BB8';ctx.strokeStyle='#1D1842';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(G.cx,G.cy);ctx.lineTo(G.cx-50,H*.88);ctx.lineTo(G.cx+50,H*.88);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.save();ctx.translate(G.cx,G.cy);ctx.rotate(G.a);ctx.fillStyle='#C98B4F';ctx.beginPath();ctx.roundRect(-G.sp*5.6,-9,G.sp*11.2,18,8);ctx.fill();ctx.stroke();
      for(let d=-5;d<=5;d++){if(!d)continue;ctx.fillStyle=d>0?'#2F6FE0':'#7E8BB8';ctx.beginPath();ctx.arc(d*G.sp,0,5,0,7);ctx.fill();ctx.fillStyle='#1D1842';ctx.font='900 14px Nunito,system-ui';ctx.textAlign='center';ctx.fillText(Math.abs(d),d*G.sp,-18)}ctx.restore();
      ctx.fillStyle='#FFC83D';ctx.beginPath();ctx.arc(G.cx,G.cy,10,0,7);ctx.fill();ctx.stroke();
      for(const [arr,sg] of [[tq.left,-1],[tq.right,1]]){const stack={};for(const o of arr){const px=G.cx+Math.cos(G.a)*o.d*sg*G.sp,py=G.cy+Math.sin(G.a)*o.d*sg*G.sp+12;const off=stack[o.d]||0;
        ctx.strokeStyle='#1D1842';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py-4);ctx.lineTo(px,py+off+6);ctx.stroke();stack[o.d]=off+drawBlock(px,py+off+6,o.m,G.sp*.62)+4}}
      // pulsing pegs to tap
      if(!tq.solved)for(let d=1;d<=5;d++){const px=G.cx+Math.cos(G.a)*d*G.sp,py=G.cy+Math.sin(G.a)*d*G.sp;ctx.strokeStyle=`rgba(47,111,224,${.3+.3*Math.sin(frame*.1+d)})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(px,py+20,G.sp*.32,0,7);ctx.stroke()}
    }
  }
  function drawItem(x,y,kind,sz){ctx.strokeStyle='#1D1842';ctx.lineWidth=3;
    if(kind==='b'){ctx.fillStyle=xC;ctx.beginPath();ctx.roundRect(x-sz*.46,y-sz*.46,sz*.92,sz*.92,7);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.font=`900 ${sz*.55}px 'STIX Two Text',serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('x',x,y+1)}
    else{ctx.fillStyle=uC;ctx.beginPath();ctx.arc(x,y,sz*.42,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#1D1842';ctx.font=`900 ${sz*.45}px Nunito,system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('1',x,y+1)}}
  function resize(){dims=fitCanvas(cv)}const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  setMode('alg');ui.hint('Each purple box hides the same number. Find it!',5000);
  kbPointer(g,cv);
  g.key(e=>{const k=e.key.toLowerCase();if(k==='z'||k==='backspace'){stage.querySelector('#undo').click();return true}if(k==='n'){stage.querySelector('#next').click();return true}
    if(mode==='alg'){const m={q:['L','b'],w:['L','u'],o:['R','b'],p:['R','u']}[k];if(m){take(...m);return true}if(k==='s'||k==='/'){const b=stage.querySelector('#split');if(!b.hidden){b.click();return true}}}
    if(mode==='torque'&&/^[1-5]$/.test(k)){if(tq.solved)return true;tq.right.push({m:tq.pick,d:+k});tone(300+k*80,.1,'triangle');syncTq();return true}
    if(k==='1'||k==='2'){if(mode==='alg'&&/^[12]$/.test(k)){ui.top.querySelectorAll('[data-mode]')[+k-1].click();return true}}return false});
  g.loop(()=>{frame++;draw()});
  GAMES.balance._debug={get L(){return L},get R(){return R},get x(){return x},take,split,get solved(){return solved},setMode,get tq(){return tq},get items(){return items},geomTq,get li(){return li}};
}}});
