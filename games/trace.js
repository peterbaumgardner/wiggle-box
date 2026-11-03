/* ============================================================
   LETTER TRACE — follow the arrows, stroke by stroke
   ============================================================ */
Object.assign(GAMES,{trace:{title:'Letter Trace',icon:'✍️',c:'var(--leaf)',age:'2+',order:7,blurb:'Discover letters, find matches, trace shapes, and grow into words',
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
  stage.innerHTML=`<div class="simwrap"><style>
  .abc-play{position:absolute;inset:0;overflow:auto;display:none;flex-direction:column;align-items:center;justify-content:safe center;gap:clamp(9px,2vh,18px);padding:clamp(10px,2.5vw,22px);background:radial-gradient(circle at 50% 28%,#fff3cf,#fdfbf4 78%);text-align:center}
  .abc-play.active{display:flex}.abc-prompt{font-family:'Baloo 2',system-ui,sans-serif;font-weight:900;font-size:clamp(23px,5vw,38px);line-height:1.15;margin:0}
  .abc-caption{font-weight:900;font-size:clamp(15px,2.5vw,21px);color:#514b70;margin:0}
  .abc-hero{font-size:clamp(52px,13vh,110px);line-height:1.1;min-height:1.1em}
  .abc-choices{display:flex;gap:clamp(8px,2vw,20px);flex-wrap:wrap;justify-content:center;max-width:100%}
  .abc-choice{min-width:clamp(72px,17vw,132px);min-height:clamp(76px,17vh,135px);border:4px solid #1d1842;border-radius:26px;box-shadow:0 7px 0 #1d1842;background:var(--choice,#ffc83d);font-family:'Baloo 2',system-ui,sans-serif;font-weight:900;font-size:clamp(36px,9vw,76px);line-height:1;display:grid;place-items:center;padding:10px;touch-action:manipulation}
  .abc-choice:active{transform:translateY(5px);box-shadow:0 2px 0 #1d1842}.abc-choice.good{background:#a9efc6}.abc-choice.retry{animation:abc-wiggle .27s}
  .abc-choice small{display:block;font-size:clamp(12px,2vw,18px);font-family:system-ui,sans-serif;line-height:1.2}
  .abc-feedback{min-height:1.6em;font-size:clamp(16px,3vw,23px);font-weight:900}
  .abc-action{border:3px solid #1d1842;border-radius:999px;background:#fff;padding:8px 18px;font-weight:900;font-size:18px}
  .abc-status{font-size:15px;font-weight:900;opacity:.75}
  @keyframes abc-wiggle{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
  @media(max-height:530px){.abc-play{gap:5px;padding:7px}.abc-hero{font-size:48px}.abc-choice{min-height:62px;min-width:64px;font-size:34px}.abc-prompt{font-size:22px}}
  @media(prefers-reduced-motion:reduce){.abc-choice.retry{animation:none}}
  </style><div class="simarea"><canvas class="simcv" aria-label="Tracing board"></canvas><div class="abc-play" id="abc-play" aria-live="polite"></div><div class="simhint" id="hint"></div></div>
    <div class="dock"><div class="drow" aria-label="Alphabet activities">
      <button class="opt on" data-mode="trace">✍️ Trace</button>
      <button class="opt" data-mode="explore">🎈 Discover</button>
      <button class="opt" data-mode="find">🔎 Find</button>
      <button class="opt" data-mode="match">🧩 Match</button>
      <button class="opt" data-mode="words">🐱 Words</button>
      <button class="opt" id="abc-voice" aria-pressed="true">🔊 Voice</button>
    </div><div class="drow" id="abc-trace-controls"><button class="opt on" data-set="abc"><span class="oe">🔤</span>ABC</button><button class="opt" data-set="num"><span class="oe">🔢</span>123</button><span class="sep"></span>
      <button class="tool" id="prev"><span class="ti">◀️</span>Back</button><button class="tool" id="again"><span class="ti">🔁</span>Again</button><button class="tool" id="next"><span class="ti">▶️</span>Next</button>
      <span class="otext">Start at the green dot and follow the arrows.</span></div></div></div>`;
  const cv=stage.querySelector('canvas'),ctx=cv.getContext('2d'),hintEl=stage.querySelector('#hint');
  const hint=makeHint(hintEl),play=stage.querySelector('#abc-play'),traceControls=stage.querySelector('#abc-trace-controls');
  let mode='trace',spoken=true,roundId=0,goal='',choices=[],successes=0,tries=0,wordRound=null,solved=false;
  const PALETTE=['#ffcf66','#a9efc6','#b7e8ff','#e6c8ff','#ffb9d4'];
  const BASIC=['A','B','C','D','E','F','G','H','M','O','P','S','T','Y'];
  const EASY_WORDS=[['CAT','🐱','cat'],['DOG','🐶','dog'],['SUN','☀️','sun'],['BUS','🚌','bus'],['PIG','🐷','pig'],['HAT','🎩','hat'],['COW','🐮','cow'],['BEE','🐝','bee'],['FOX','🦊','fox'],['EGG','🥚','egg']];
  function speak(t){
    if(!spoken||!soundOn||!('speechSynthesis' in window))return;
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.rate=.78;u.pitch=1.12;u.volume=.85;u.lang='en-US';speechSynthesis.speak(u)}catch(e){console.warn('Alphabet speech unavailable',e)}
  }
  g.onEnd(()=>{try{speechSynthesis.cancel()}catch(e){}});
  function choiceHtml(letter,i,sub=''){return '<button class="abc-choice" data-choice="'+letter+'" style="--choice:'+PALETTE[i%PALETTE.length]+'" aria-label="'+letter+'">'+letter+(sub?'<small>'+sub+'</small>':'')+'</button>'}
  function shuffleChoices(answer,pool,count=3){return shuffle([answer,...shuffle(pool.filter(x=>x!==answer)).slice(0,count-1)])}
  function nextRound(){
    roundId++;solved=false;tries=0;
    const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const subset=successes<5?BASIC:alphabet;
    goal=pick(subset);
    const info=LETTERS.find(l=>l[0]===goal);
    let heading='',hero='',subtitle='',options=[],prompt='';
    if(mode==='explore'){
      heading='Tap a letter!';hero=info[2];subtitle='Discover its name and picture';
      options=shuffleChoices(goal,alphabet,5);prompt=goal+' is for '+info[1];
    }else if(mode==='find'){
      heading='Find the letter '+goal+'!';hero=goal;subtitle='Look carefully. Tap the matching letter.';
      options=shuffleChoices(goal,alphabet,successes<4?2:3);prompt='Find '+goal;
    }else if(mode==='match'){
      heading='What starts '+info[1]+'?';hero=info[2];subtitle=info[1]+' begins with which letter?';
      options=shuffleChoices(goal,alphabet,3);prompt='What letter starts '+info[1]+'?';
    }else if(mode==='words'){
      const word=pick(EASY_WORDS);const index=successes<3?0:rint(0,word[0].length-1);
      goal=word[0][index];wordRound={word:word[0],index,picture:word[1],meaning:word[2]};
      heading='Finish the word!';hero=word[1];subtitle=[...word[0]].map((c,i)=>i===index?'＿':c).join('  ');
      options=shuffleChoices(goal,alphabet,3);prompt='Find '+goal+' to finish '+word[2];
    }
    choices=options;
    play.innerHTML='<p class="abc-prompt">'+heading+'</p><div class="abc-hero" aria-hidden="true">'+hero+'</div><p class="abc-caption">'+subtitle+'</p>'+
      '<div class="abc-choices">'+options.map((l,i)=>choiceHtml(l,i)).join('')+'</div>'+
      '<div class="abc-feedback" id="abc-feedback" role="status"></div>'+
      '<button class="abc-action" id="abc-repeat">🔊 Hear it again</button><div class="abc-status">Stars earned: '+successes+' ⭐</div>';
    if(mode==='explore')speak('Can you find '+goal+'? '+prompt+'.');
    else speak(prompt);
  }
  function selectLetter(letter,button){
    if(mode==='trace'||solved)return;
    if(mode==='explore'){
      const item=LETTERS.find(l=>l[0]===letter);
      if(!item)return;
      goal=letter;solved=true;button.classList.add('good');
      play.querySelector('.abc-hero').textContent=item[2];
      play.querySelector('.abc-caption').textContent=letter+' is for '+item[1];
      play.querySelector('#abc-feedback').textContent='Wonderful! '+letter+' is for '+item[1]+'!';
      speak(letter+'. '+letter+' is for '+item[1]);tone(660,.14,'triangle');successes++;if(successes%4===0){addStar();cheer()}
      const id=roundId;g.later(()=>{if(mode==='explore'&&id===roundId)nextRound()},2800);return;
    }
    if(letter===goal){
      solved=true;button.classList.add('good');successes++;tone(660,.12,'triangle');tone(880,.18,'triangle',.15,.12);
      let msg=goal+'! You found it!';
      if(mode==='match'){const info=LETTERS.find(l=>l[0]===goal);msg=info[1]+' starts with '+goal+'!'}
      if(mode==='words'){msg=wordRound.word.split('').join(', ')+'. '+wordRound.meaning+'!';play.querySelector('.abc-caption').textContent=wordRound.word}
      play.querySelector('#abc-feedback').textContent=msg;speak(msg);
      if(successes%4===0){addStar();cheer();party()}
      const id=roundId;g.later(()=>{if(mode!=='trace'&&id===roundId)nextRound()},2600);
    }else{
      tries++;button.classList.remove('retry');void button.offsetWidth;button.classList.add('retry');
      play.querySelector('#abc-feedback').textContent=tries===1?'Good try! Find '+goal+'.':'Look for '+goal+'. You can do it!';
      tone(330,.1,'sine',.08);if(tries>=2){const right=[...play.querySelectorAll('[data-choice]')].find(b=>b.dataset.choice===goal);if(right)right.style.outline='5px dashed #1d1842'}
      speak('Try '+goal);
    }
  }
  play.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.choice){selectLetter(b.dataset.choice,b);return}
    if(b.id==='abc-repeat'){if(mode==='explore'){const info=LETTERS.find(l=>l[0]===goal);speak('Find '+goal+'. '+goal+' is for '+info[1])}
      else if(mode==='match'){const info=LETTERS.find(l=>l[0]===goal);speak('What letter starts '+info[1])}
      else if(mode==='words')speak('Find '+goal+' to finish '+wordRound.meaning);
      else speak('Find '+goal)}
  });
  function changeMode(next){
    if(mode===next)return;
    mode=next;roundId++;successes=0;solved=false;
    stage.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===mode));
    traceControls.style.display=mode==='trace'?'':'none';play.classList.toggle('active',mode!=='trace');
    cv.style.visibility=mode==='trace'?'visible':'hidden';
    if(mode==='trace'){speak('Let us trace a letter');load(idx)}else nextRound();
  }
  stage.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>changeMode(b.dataset.mode)));
  stage.querySelector('#abc-voice').addEventListener('click',e=>{spoken=!spoken;e.currentTarget.setAttribute('aria-pressed',String(spoken));e.currentTarget.textContent=spoken?'🔊 Voice':'🔇 Voice';if(!spoken)try{speechSynthesis.cancel()}catch(err){}else if(mode!=='trace')speak('Find '+goal)});
  
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
  traceControls.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.set){set=b.dataset.set;stage.querySelectorAll('[data-set]').forEach(x=>x.classList.toggle('on',x===b));load(0)}
    if(b.id==='prev')load(idx-1);if(b.id==='next')load(idx+1);if(b.id==='again')load(idx);tone(560,.08,'triangle')});
  function polyPath(pts,upto){ctx.beginPath();for(let i=0;i<=Math.min(upto,pts.length-1);i++){const q=toPx(pts[i]);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])}}
  function draw(){
    if(mode!=='trace')return;
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
  g.key(e=>{if(mode!=='trace'){if(/^[a-z]$/i.test(e.key)){const b=[...play.querySelectorAll('[data-choice]')].find(x=>x.dataset.choice===e.key.toUpperCase());if(b){selectLetter(b.dataset.choice,b);return true}}return false}if(e.key==='ArrowRight'){load(idx+1);return true}if(e.key==='ArrowLeft'){load(idx-1);return true}
    if((e.key===' '||e.key==='Enter')&&!done){const s=strokes[si];p=Math.min(s.length-1,p+6);const q=toPx(s[p]);trail.push({x:q[0],y:q[1],l:1});tone(400+si*90+p*2,.05,'triangle',.06);
      if(p>=s.length-3){si++;p=0;tone(660,.12,'triangle');if(si>=strokes.length){done=true;finish()}}return true}
    if(/^[a-z0-9]$/i.test(e.key)){const c=e.key.toUpperCase(),inSet=SETS[set].indexOf(c);if(inSet<0){set=set==='abc'?'num':'abc';stage.querySelectorAll('[data-set]').forEach(x=>x.classList.toggle('on',x.dataset.set===set))}load(SETS[set].indexOf(c));return true}return false});
  load(0);g.loop(()=>{frame++;draw()});
  GAMES.trace._debug={get state(){return{ch,si,p,done,n:strokes.map(s=>s.length)}},toPx:q=>toPx(q),get strokes(){return strokes},tol,SETS};
}}});
