/* ============================================================
   POTION LAB — fractions, decimals and percents by pouring
   ============================================================ */
Object.assign(GAMES,{potion:{title:'Potion Lab',icon:'🧪',c:'var(--grape)',age:'6+',section:'math',order:4,blurb:'Pour fraction bottles to hit the magic line.',
init(stage,g){
  const U=24;  // everything is counted in 24ths so sums stay exact
  const BOT={12:['1','2','#FF4F7B'],8:['1','3','#24C786'],6:['1','4','#3E67F0'],4:['1','6','#FF8A2B'],3:['1','8','#9A5BFF'],2:['1','12','#18BFD6'],16:['2','3','#1FA463'],18:['3','4','#2F4FD6'],9:['3','8','#B278FF']};
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  const simp=n=>{if(n===0)return[0,1];const g2=gcd(n,U);return[n/g2,U/g2]};
  const fr=n=>{const[a,b]=simp(n);return b===1?`<span class="num">${a}</span>`:frac(a,b)};
  const mixed=n=>{if(n<=U)return fr(n);const w=Math.floor(n/U),r=n%U;return r?`<span class="num">${w}</span>${fr(r)}`:`<span class="num">${w}</span>`};
  let lvl=0,target=0,pours=[],cap=U,bottles=[],level=0,show=0,done=false,frame=0,anim=[],rid=0;
  const ui=labShell(stage,{label:'Potion beaker',top:`<span class="lvl" id="lv">Level 1</span><button class="pbtn small" id="undo">↩ Undo</button><button class="pbtn small" id="empty">🫗 Empty</button><button class="pbtn small" id="next">➜ Next</button>`,
    panel:`<div class="fx big hot"><span class="tag">Fill to the line</span><div class="row" id="tg"></div><div class="row note">Tap a bottle to pour it in. Hit the line exactly!</div></div>
      <div class="fx"><span class="tag">In the beaker</span><div class="row" id="sum"></div></div>
      <div class="fx"><span class="tag">Same amount, other ways</span><div class="row" id="alt"></div></div>
      <div class="fx"><span class="tag">Twins (equivalent)</span><div class="row" id="eqv"></div></div>`});
  const {cv,panel}=ui,ctx=cv.getContext('2d');let dims=fitCanvas(cv),hits=[];
  function gen(){const pools=[[12,6],[12,6,3],[8,4,12],[6,4,3,12],[8,6,4,3,2],[12,8,6,4,3,2,16,18,9]],pool=pools[Math.min(lvl>>1,pools.length-1)];
    let need,tries=0;do{const k=lvl<2?2:lvl<6?pick([2,3]):pick([2,3,4]);need=[...Array(k)].map(()=>pick(pool));target=need.reduce((a,b)=>a+b,0)}while((target>(lvl>=6?2*U:U)||target===0)&&++tries<200);
    if(target>(lvl>=6?2*U:U)||target===0){need=[pool[0]];target=pool[0]}
    cap=target>U?2*U:U;bottles=shuffle([...new Set([...need,...shuffle(pool).slice(0,3)])]).slice(0,6);if(!need.every(n=>bottles.includes(n)))bottles=[...new Set([...need,...bottles])];
    show=lvl<4?0:pick([0,0,1,2]);pours=[];level=0;done=false;rid++;stage.querySelector('#lv').textContent=`Level ${lvl+1}`;sync()}
  function tgHTML(){const[a,b]=simp(target);if(show===1)return `<span class="num">${fmt(target/U,3)}</span>`;if(show===2)return `<span class="num">${fmt(target/U*100,1)}%</span>`;return mixed(target)}
  function sync(){const sum=pours.reduce((a,b)=>a+b,0);
    panel.querySelector('#tg').innerHTML=tgHTML()+(show?` <span class="note">(that's ${mixed(target)})</span>`:'');
    panel.querySelector('#sum').innerHTML=pours.length?pours.map(fr).join(' + ')+' = '+mixed(sum)+(sum===target?' ✅':sum>target?' <b style="color:#E8384F">too much!</b>':''):'<span class="note">nothing yet</span>';
    panel.querySelector('#alt').innerHTML=`<span class="num">${fmt(sum/U,3)}</span> &nbsp;=&nbsp; <span class="num">${fmt(sum/U*100,1)}%</span>`;
    const[a,b]=simp(sum);panel.querySelector('#eqv').innerHTML=sum?[1,2,3,4].map(k=>frac(a*k,b*k)).join(' = '):'<span class="note">pour something!</span>';
    if(sum===target&&!done){done=true;const my=rid;g.later(()=>{if(my!==rid||!done)return;win(stage,null,null,'Perfect potion!');lvl++;g.later(()=>{if(my===rid)gen()},2400)},700)}}
  function pourB(n,i){if(done)return;pours.push(n);anim.push({i,t:0,c:BOT[n][2]});noise(.5,700,1.5,.12,0,300);tone(330+n*25,.2,'sine',.12,.15);sync();
    if(pours.reduce((a,b)=>a+b,0)>target){g.later(()=>{buzz();ui.hint('Too much! Undo or empty the beaker.')},500)}}
  stage.querySelector('#undo').addEventListener('click',()=>{pours.pop();if(done){done=false;rid++}sync();tone(400,.08,'triangle')});
  stage.querySelector('#empty').addEventListener('click',()=>{pours=[];if(done){done=false;rid++}sync();noise(.4,500,1,.1,0,150)});
  stage.querySelector('#next').addEventListener('click',()=>{lvl++;gen()});
  fingers(cv,{down(f){const h=hits.find(o=>Math.hypot(o.x-f.x,o.y-f.y)<o.r);if(h)pourB(h.n,h.i)}});
  function draw(){const W=dims.w,H=dims.h;ctx.setTransform(dims.d,0,0,dims.d,0,0);
    const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#2A2160');gr.addColorStop(1,'#3B2F86');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
    const sum=pours.reduce((a,b)=>a+b,0);level=lerp(level,Math.min(sum,cap*1.06),.08);
    // beaker
    const bh=H*.55,bw=Math.min(W*.3,bh*.7),bx=W/2-bw/2,by=H*.07,unitH=bh/cap;
    ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(bx,by,bw,bh);
    // stacked layers
    let acc=0;for(let i=0;i<pours.length;i++){const n=pours[i],h0=Math.min(acc,level),h1=Math.min(acc+n,level);if(h1>h0){ctx.fillStyle=BOT[n][2];ctx.fillRect(bx+4,by+bh-h1*unitH,bw-8,(h1-h0)*unitH);
        if((h1-h0)*unitH>20){ctx.fillStyle='rgba(255,255,255,.9)';ctx.font='900 15px Nunito,system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(BOT[n][0]+'/'+BOT[n][1],bx+bw/2,by+bh-(h0+h1)/2*unitH)}
        ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx+4,by+bh-h1*unitH);ctx.lineTo(bx+bw-4,by+bh-h1*unitH);ctx.stroke()}acc+=n}
    if(sum>target){for(let k=0;k<3;k++){ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(bx+Math.random()*bw,by+bh-level*unitH-Math.random()*20,3+Math.random()*4,0,7);ctx.fill()}}
    // ticks: denominator of the target
    const lcm=(a,b)=>a/gcd(a,b)*b,tb=[target,...bottles].map(v=>simp(v)[1]).reduce(lcm,1),den=tb*(cap/U);for(let k=1;k<den;k++){const y=by+bh-k*bh/den;ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bx,y);ctx.lineTo(bx+(k%tb===0?bw*.35:bw*.18),y);ctx.stroke()}
    // target line
    const ty=by+bh-target*unitH;ctx.strokeStyle='#FFC83D';ctx.lineWidth=4;ctx.setLineDash([12,8]);ctx.lineDashOffset=-frame*.5;ctx.beginPath();ctx.moveTo(bx-30,ty);ctx.lineTo(bx+bw+30,ty);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#FFC83D';ctx.font='900 18px Nunito,system-ui';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText('★',bx+bw+36,ty);
    ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(bx,by-6);ctx.lineTo(bx,by+bh);ctx.lineTo(bx+bw,by+bh);ctx.lineTo(bx+bw,by-6);ctx.stroke();
    if(cap>U){ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx-12,by+bh/2);ctx.lineTo(bx+bw+12,by+bh/2);ctx.stroke();ctx.fillStyle='#fff';ctx.font='900 15px Nunito';ctx.textAlign='right';ctx.fillText('1 whole',bx-16,by+bh/2)}
    // bottles
    hits=[];const n=bottles.length,gap=Math.min(W/(n+.5),130),r=Math.min(gap*.36,46),y0=H*.82;
    bottles.forEach((v,i)=>{const x=W/2+(i-(n-1)/2)*gap,c=BOT[v][2];hits.push({x,y:y0,r:r*1.3,n:v,i});
      ctx.fillStyle=c;ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y0+r*.3,r,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#E9EDFF';ctx.fillRect(x-r*.28,y0-r*1.25,r*.56,r*.7);ctx.strokeRect(x-r*.28,y0-r*1.25,r*.56,r*.7);
      ctx.fillStyle='#C98B4F';ctx.fillRect(x-r*.34,y0-r*1.45,r*.68,r*.25);
      ctx.fillStyle='#fff';ctx.font=`900 ${r*.48}px Nunito,system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(BOT[v][0],x,y0+r*.02);ctx.fillRect(x-r*.3,y0+r*.28,r*.6,3);ctx.fillText(BOT[v][1],x,y0+r*.62)});
    // pour streams
    for(let k=anim.length-1;k>=0;k--){const a=anim[k];a.t+=.04;if(a.t>1){anim.splice(k,1);continue}const h=hits[a.i];if(!h)continue;ctx.strokeStyle=a.c;ctx.lineWidth=8*(1-a.t)+2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(h.x,h.y-r);ctx.quadraticCurveTo((h.x+W/2)/2,by-40,W/2,by+bh-level*unitH);ctx.stroke()}
  }
  function resize(){dims=fitCanvas(cv)}const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  gen();ui.hint('Tap bottles to pour. Fill exactly to the gold line!',4500);
  g.key(e=>{const k=e.key.toLowerCase();if(/^[1-9]$/.test(k)&&bottles[+k-1]!=null){pourB(bottles[+k-1],+k-1);return true}
    if(k==='z'||k==='backspace'){stage.querySelector('#undo').click();return true}if(k==='e'||k==='0'){stage.querySelector('#empty').click();return true}if(k==='n'){stage.querySelector('#next').click();return true}return false});
  g.loop(()=>{frame++;draw()});
  GAMES.potion._debug={get target(){return target},get bottles(){return bottles},pourB,get lvl(){return lvl},gen,setLvl(v){lvl=v;gen()},get hits(){return hits},get pours(){return pours},U,get cap(){return cap}};
}}});
