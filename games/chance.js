/* ============================================================
   CHANCE MACHINE — bean machine, dice sums, coin flips
   ============================================================ */
Object.assign(GAMES,{chance:{title:'Chance Machine',icon:'🎲',c:'var(--leaf)',age:'7+',section:'math',order:8,blurb:'Drop 1,000 balls. Watch a bell curve appear.',
init(stage,g){
  const ROWS=10;let mode='bean',p=.5,bins=new Array(ROWS+1).fill(0),balls=[],total=0,dice=2,sums={},rolls=0,showDice=[],coins={n:0,h:0,hist:[],streak:0,best:0,last:null},frame=0,queue=0;
  const ui=labShell(stage,{label:'Chance machine',top:`${chips('cm',[['bean','📍 Bean machine'],['dice','🎲 Dice'],['coin','🪙 Coins']],'bean')}<span class="sep"></span><span class="pbar" id="ex"></span>`,panel:'<div id="pn"></div>'});
  const {cv,panel}=ui,ctx=cv.getContext('2d');let dims=fitCanvas(cv);
  const C=(n,k)=>{let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r};
  const diceWays=(n)=>{let w={0:1};for(let d=0;d<n;d++){const nw={};for(const s in w)for(let f=1;f<=6;f++)nw[+s+f]=(nw[+s+f]||0)+w[s];w=nw}return w};
  function ex(){const e=stage.querySelector('#ex');
    e.innerHTML=mode==='bean'?`<button class="pbtn small go" data-n="1">Drop 1</button><button class="pbtn small" data-n="10">Drop 10</button><button class="pbtn small" data-n="200">Drop 200</button><button class="pbtn small" data-n="0">🧹 Clear</button>`
      :mode==='dice'?`${chips('dn',[['1','1 die'],['2','2 dice'],['3','3 dice']],String(dice))}<span class="sep"></span><button class="pbtn small go" data-n="1">Roll</button><button class="pbtn small" data-n="100">Roll 100</button><button class="pbtn small" data-n="1000">Roll 1,000</button><button class="pbtn small" data-n="0">🧹</button>`
      :`<button class="pbtn small go" data-n="1">Flip</button><button class="pbtn small" data-n="10">Flip 10</button><button class="pbtn small" data-n="1000">Flip 1,000</button><button class="pbtn small" data-n="0">🧹</button>`}
  function info(){const pn=panel.querySelector('#pn');
    if(mode==='bean'){const mean=total?bins.reduce((s,c,k)=>s+c*k,0)/total:0;
      patchPanel(pn,`
        <div class="fx big hot"><span class="tag">Chance of bin k</span><div class="row">P(${V('k','#2F6FE0')}) = C(10, ${V('k','#2F6FE0')}) · ${V('p','#E8384F')}<sup>${V('k','#2F6FE0')}</sup> · (1 − ${V('p','#E8384F')})<sup>10 − ${V('k','#2F6FE0')}</sup></div></div>
        <div class="fx"><span class="tag">Middle bin (k = 5)</span><div class="row">C(10,5) = <span class="num">252</span> paths out of 2<sup>10</sup> = <span class="num">1024</span></div><div class="row note">So many ways to land in the middle, so few to reach the edges.</div></div>
        <div class="fx"><span class="tag">Average bin</span><div class="row">expected: 10 × ${V('p','#E8384F')} = <span class="num">${fmt(10*p,1)}</span></div><div class="row">balls so far: <span class="num">${fmt(mean,2)}</span> <span class="note">(${total} balls)</span></div></div>
        <p class="note">Each peg is a coin flip: left or right.</p>`)}
    if(mode==='dice'){const w=diceWays(dice),tot=6**dice,best=Object.entries(w).sort((a,b)=>b[1]-a[1])[0];
      /* with one die every face ties, so there is no single favourite to show */
      const ties=Object.entries(w).filter(e=>e[1]===best[1]).map(e=>e[0]);
      pn.innerHTML=`<div class="fx big hot"><span class="tag">${ties.length>2?'Every face is a tie':'Most likely sum'}</span><div class="row"><span class="num">${ties.length>2?`${ties[0]} to ${ties[ties.length-1]}`:ties.join(' and ')}</span> &nbsp;${frac(best[1],tot)}${dice===2?' = '+frac(1,6):''}${ties.length===2?' each':''}</div></div>
        <div class="fx"><span class="tag">Chance of a sum</span><div class="row">P(sum) = ${frac('ways to make it','all '+tot+' ways')}</div><div class="row note">${dice===2?'7 = 1+6 = 2+5 = 3+4 = 4+3 = 5+2 = 6+1. That is 6 ways!':dice===1?'Every face is equally likely: 1 out of 6.':'With 3 dice, 10 and 11 are the favorites.'}</div></div>
        <div class="fx"><span class="tag">Rolled</span><div class="row"><span class="num">${rolls}</span> times</div><div class="row note">Dots show what should happen. Bars show what did happen.</div></div>`}
    if(mode==='coin'){const r=coins.n?coins.h/coins.n:0;
      pn.innerHTML=`<div class="fx big hot"><span class="tag">Heads so far</span><div class="row">${frac(`<span class="num">${coins.h}</span>`,`<span class="num">${coins.n}</span>`)} = <span class="num">${fmt(r*100,1)}%</span></div></div>
        <div class="fx"><span class="tag">Should be</span><div class="row">P(heads) = ${frac(1,2)} = <span class="num">50%</span></div><div class="row note">Flip more and the line hugs 50%. That is the law of large numbers.</div></div>
        <div class="fx"><span class="tag">Longest streak</span><div class="row"><span class="num">${coins.best}</span> in a row</div><div class="row note">Chance of 5 heads in a row: (½)<sup>5</sup> = ${frac(1,32)}</div></div>`}}
  /* Slide a finger left or right across the board to tilt it: that sets p, the chance each ball bounces right. A tap drops one ball. */
  function setP(np){np=clamp(Math.round(np*20)/20,.1,.9);if(np===p)return;p=np;bins.fill(0);total=0;balls=[];tone(300+p*500,.04,'sine',.08);info()}
  fingers(cv,{down(f){f.data.x0=f.x},move(f){if(mode!=='bean')return;if(!f.data.tilt&&Math.abs(f.x-f.data.x0)<14)return;f.data.tilt=true;setP(.5+(f.x-dims.w/2)/(dims.w*.7))},
    up(f){if(mode==='bean'&&!f.data.tilt){queue+=1;tone(700,.05,'sine',.08)}}});
  cv.addEventListener('wheel',e=>{if(mode!=='bean')return;e.preventDefault();setP(p+(e.deltaY<0?.05:-.05))},{passive:false});
  stage.querySelector('#ex').addEventListener('click',e=>{const d=e.target.closest('[data-dn]');if(d){stage.querySelectorAll('[data-dn]').forEach(x=>x.classList.toggle('on',x===d));dice=+d.dataset.dn;sums={};rolls=0;showDice=[];info();tone(560,.07,'triangle');return}
    const b=e.target.closest('[data-n]');if(!b)return;const n=+b.dataset.n;tone(520,.07,'triangle');
    if(mode==='bean'){if(!n){bins.fill(0);total=0;balls=[];queue=0;info();return}queue+=n}
    if(mode==='dice'){if(!n){sums={};rolls=0;showDice=[];info();return}for(let i=0;i<n;i++){const f=[...Array(dice)].map(()=>rint(1,6)),s=f.reduce((a,b)=>a+b,0);sums[s]=(sums[s]||0)+1;rolls++;if(i===n-1)showDice=f}
      if(n===1){showDice.spin=20;noise(.3,2500,.8,.12)}else noise(.5,1500,.5,.1);info()}
    if(mode==='coin'){if(!n){coins={n:0,h:0,hist:[],streak:0,best:0,last:null};info();return}for(let i=0;i<n;i++){const h=Math.random()<.5;coins.n++;if(h)coins.h++;coins.streak=coins.last===h?coins.streak+1:1;coins.last=h;coins.best=Math.max(coins.best,coins.streak);if(coins.n%Math.max(1,Math.floor(coins.n/400))===0)coins.hist.push(coins.h/coins.n)}
      if(n===1){coins.spin=24;tone(1400,.08,'sine',.1);tone(1800,.08,'sine',.08,.12)}info()}});
  bindChips(ui.top,'cm',m=>{mode=m;ex();info()});
  /* ---------- drawing ---------- */
  function beanGeom(){const W=dims.w,H=dims.h,top=H*.06,bottom=H*.58,dy=(bottom-top)/ROWS,dx=Math.min(W*.8/(ROWS+1),dy*1.2);return{W,H,top,dy,dx,cx:W/2,binTop:bottom+dy*.5,binBot:H-8}}
  function drawBean(){const G=beanGeom();ctx.fillStyle='#14102E';ctx.fillRect(0,0,G.W,G.H);
    {const hx=G.W/2+(p-.5)*G.W*.7,y=G.top*.55+4;ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(G.W*.15,y);ctx.lineTo(G.W*.85,y);ctx.stroke();
     ctx.fillStyle='#FF4F7B';ctx.beginPath();ctx.arc(hx,y,9,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 14px Nunito';ctx.textAlign=hx>G.W*.7?'right':'left';ctx.fillText(`p = ${p.toFixed(2)}  ${p>.5?'→ leans right':p<.5?'← leans left':'fair'}`,hx+(hx>G.W*.7?-16:16),y+5);ctx.textAlign='center'}
    for(let r=0;r<ROWS;r++)for(let i=0;i<=r;i++){ctx.fillStyle='#9AA6D6';ctx.beginPath();ctx.arc(G.cx+(i-r/2)*G.dx,G.top+(r+1)*G.dy,4,0,7);ctx.fill()}
    const maxB=Math.max(10,...bins),exp=k=>C(ROWS,k)*p**k*(1-p)**(ROWS-k);const maxE=Math.max(...bins.map((_,k)=>exp(k)))*Math.max(total,1);
    const scale=(G.binBot-G.binTop)/Math.max(maxB,maxE);
    for(let k=0;k<=ROWS;k++){const x=G.cx+(k-ROWS/2)*G.dx,w=G.dx*.8;ctx.fillStyle=`hsl(${200+k*14},80%,60%)`;const h=bins[k]*scale;ctx.fillRect(x-w/2,G.binBot-h,w,h);
      ctx.fillStyle='rgba(255,255,255,.75)';ctx.font='900 12px Nunito,system-ui';ctx.textAlign='center';ctx.fillText(k,x,G.binTop-4)}
    if(total>0){ctx.strokeStyle='#FFC83D';ctx.lineWidth=3;ctx.beginPath();for(let k=0;k<=ROWS;k++){const x=G.cx+(k-ROWS/2)*G.dx,y=G.binBot-exp(k)*total*scale;k?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
    for(const b of balls){ctx.fillStyle='#FF9AD5';ctx.beginPath();ctx.arc(b.x,b.y,5,0,7);ctx.fill()}}
  function stepBean(){const G=beanGeom();if(queue>0&&frame%(queue>50?1:4)===0){const n=Math.min(queue,queue>50?6:1);for(let i=0;i<n;i++)balls.push({r:0,k:0,t:0,x:G.cx,y:G.top});queue-=n}
    for(let i=balls.length-1;i>=0;i--){const b=balls[i];b.t+=.12;if(b.t>=1){b.t=0;b.r++;if(b.r<=ROWS&&Math.random()<p)b.k++;if(b.r>ROWS){bins[b.k]++;total++;balls.splice(i,1);if(total%10===0||queue===0)info();tone(500+b.k*60,.03,'sine',.03);continue}if(balls.length<30)tone(1200+b.r*40,.02,'sine',.02)}
      const r0=Math.min(b.r,ROWS),x0=G.cx+(b.k-r0/2)*G.dx,y0=G.top+r0*G.dy+(b.r?G.dy*.5:0);
      b.x=lerp(b.x,x0,.35);b.y=b.r>=ROWS?lerp(b.y,G.binTop+10,.3):G.top+(b.r+b.t)*G.dy}}
  function drawDice(){const W=dims.w,H=dims.h;ctx.fillStyle='#FDFBF4';ctx.fillRect(0,0,W,H);const w=diceWays(dice),tot=6**dice,keys=Object.keys(w).map(Number),lo=keys[0],hi=keys[keys.length-1],n=hi-lo+1;
    const gx=40,gw=W-80,gy=H*.32,gh=H*.6,bw=gw/n,maxP=Math.max(...Object.values(w))/tot,maxO=rolls?Math.max(...Object.values(sums))/rolls:0,top=Math.max(maxP,maxO)*1.15;
    for(let s=lo;s<=hi;s++){const x=gx+(s-lo)*bw,obs=rolls?(sums[s]||0)/rolls:0,ep=w[s]/tot;ctx.fillStyle=`hsl(${(s-lo)*360/n},70%,62%)`;ctx.fillRect(x+bw*.12,gy+gh-obs/top*gh,bw*.76,obs/top*gh);
      ctx.fillStyle='#1D1842';ctx.beginPath();ctx.arc(x+bw/2,gy+gh-ep/top*gh,6,0,7);ctx.fill();ctx.font='900 14px Nunito,system-ui';ctx.textAlign='center';ctx.fillText(s,x+bw/2,gy+gh+18)}
    ctx.strokeStyle='#1D1842';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(gx,gy+gh);ctx.lineTo(gx+gw,gy+gh);ctx.stroke();
    // dice faces
    const sz=Math.min(H*.18,90),pip=[[],[[.5,.5]],[[.25,.25],[.75,.75]],[[.25,.25],[.5,.5],[.75,.75]],[[.25,.25],[.75,.25],[.25,.75],[.75,.75]],[[.25,.25],[.75,.25],[.5,.5],[.25,.75],[.75,.75]],[[.25,.25],[.75,.25],[.25,.5],[.75,.5],[.25,.75],[.75,.75]]];
    const faces=showDice.length?showDice:[...Array(dice)].map(()=>0);if(showDice.spin>0)showDice.spin--;
    faces.forEach((f,i)=>{const x=W/2+(i-(faces.length-1)/2)*sz*1.3,y=H*.14,v=showDice.spin>0?rint(1,6):f;ctx.save();ctx.translate(x,y);ctx.rotate(showDice.spin>0?Math.sin(frame)*0.4:0);
      ctx.fillStyle='#fff';ctx.strokeStyle='#1D1842';ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(-sz/2,-sz/2,sz,sz,sz*.18);ctx.fill();ctx.stroke();ctx.fillStyle='#E8384F';
      for(const [px,py] of pip[v]||[]){ctx.beginPath();ctx.arc(-sz/2+px*sz,-sz/2+py*sz,sz*.09,0,7);ctx.fill()}ctx.restore()});
    if(showDice.length&&!(showDice.spin>0)){ctx.fillStyle='#1D1842';ctx.font=`900 ${sz*.35}px Nunito,system-ui`;ctx.textAlign='left';ctx.fillText('= '+showDice.reduce((a,b)=>a+b,0),W/2+faces.length*sz*.68,H*.14+sz*.12)}}
  function drawCoin(){const W=dims.w,H=dims.h;ctx.fillStyle='#FDFBF4';ctx.fillRect(0,0,W,H);
    const gx=50,gw=W-80,gy=H*.36,gh=H*.55;ctx.strokeStyle='rgba(29,24,66,.15)';ctx.lineWidth=1;for(const v of [0,.25,.5,.75,1]){const y=gy+gh-v*gh;ctx.beginPath();ctx.moveTo(gx,y);ctx.lineTo(gx+gw,y);ctx.stroke();ctx.fillStyle='#1D1842';ctx.font='800 12px Nunito';ctx.textAlign='right';ctx.fillText(v*100+'%',gx-6,y+4)}
    ctx.strokeStyle='#FFC83D';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(gx,gy+gh/2);ctx.lineTo(gx+gw,gy+gh/2);ctx.stroke();ctx.setLineDash([]);
    const hs=coins.hist;if(hs.length>1){ctx.strokeStyle='#E8384F';ctx.lineWidth=3;ctx.beginPath();hs.forEach((v,i)=>{const x=gx+i/(hs.length-1)*gw,y=gy+gh-v*gh;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
    const r=Math.min(H*.12,60),x=W/2,y=H*.17,sp=coins.spin>0?coins.spin--:0,sq=sp?Math.abs(Math.cos(sp*.5)):1,heads=sp?(sp%4<2):coins.last!==false;
    ctx.save();ctx.translate(x,y-(sp?Math.sin(sp/24*Math.PI)*30:0));ctx.scale(1,sq);ctx.fillStyle=heads?'#FFC83D':'#C9C2BA';ctx.strokeStyle='#1D1842';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#1D1842';ctx.font=`900 ${r*.8}px Nunito,system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(coins.n?(heads?'H':'T'):'?',0,2);ctx.restore()}
  function resize(){dims=fitCanvas(cv)}const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  ex();info();ui.hint('Tap to drop a ball. Slide sideways to tilt the machine!',4000);
  g.key(e=>{const k=e.key;if(/^[1-3]$/.test(k)&&!e.shiftKey){ui.top.querySelectorAll('[data-cm]')[+k-1].click();return true}
    if(k===' '||k==='Enter'){const bs=[...stage.querySelectorAll('#ex [data-n]')].filter(b=>b.dataset.n!=='0');(e.shiftKey?bs[bs.length-1]:bs[0]).click();return true}
    if(k.toLowerCase()==='c'){stage.querySelector('#ex [data-n="0"]').click();return true}return false});
  g.loop(()=>{frame++;ctx.setTransform(dims.d,0,0,dims.d,0,0);if(mode==='bean'){stepBean();drawBean()}if(mode==='dice')drawDice();if(mode==='coin')drawCoin()});
  GAMES.chance._debug={get bins(){return bins},get total(){return total},get sums(){return sums},get rolls(){return rolls},get coins(){return coins},get p(){return p}};
}}});
