/* ============================================================
   PRIME GARDEN — sieve, factor trees, GCD and LCM
   ============================================================ */
Object.assign(GAMES,{primes:{title:'Prime Garden',icon:'🌸',c:'var(--berry)',age:'7+',section:'math',order:6,blurb:'Wilt the multiples. Only the primes keep blooming.',
init(stage,g){
  const isP=n=>{if(n<2)return false;for(let d=2;d*d<=n;d++)if(n%d===0)return false;return true};
  const pf=n=>{const o=[];for(let d=2;d*d<=n;d++)while(n%d===0){o.push(d);n/=d}if(n>1)o.push(n);return o};
  const powStr=fs=>{const c={};fs.forEach(p=>c[p]=(c[p]||0)+1);return Object.keys(c).map(Number).sort((a,b)=>a-b).map(p=>c[p]>1?`${p}<sup>${c[p]}</sup>`:p).join(' × ')};
  let mode='sieve',dead=new Set(),crowned=new Set(),busy=false,tree=null,pair=[12,18],done=false,rid=0;
  const ui=labShell(stage,{label:'Garden',top:`${chips('pm',[['sieve','🌸 Sieve'],['tree','🌳 Factor tree'],['venn','🔗 Common']],'sieve')}<span class="sep"></span><button class="pbtn small" id="again">↺ New</button>`,panel:'<div id="pn"></div>'});
  const {cv,panel,area}=ui;cv.hidden=true;area.insertAdjacentHTML('beforeend','<div class="garden" id="gd"></div>');const gd=area.querySelector('#gd');
  /* ---------- sieve ---------- */
  function sieveHTML(){gd.innerHTML=`<div class="sieve">${[...Array(100)].map((_,i)=>{const n=i+1;return `<button class="pot ${n===1?'one':''} ${dead.has(n)?'dead':''} ${crowned.has(n)?'crown':''}" data-n="${n}"><span>${n}</span></button>`}).join('')}</div>`;sievePanel()}
  function sievePanel(last){const alive=[...Array(99)].map((_,i)=>i+2).filter(n=>!dead.has(n)),primes=alive.filter(isP),left=alive.length-primes.length;
    panel.querySelector('#pn').innerHTML=`<div class="fx big hot"><span class="tag">Still blooming</span><div class="row"><span class="num">${alive.length}</span> flowers</div><div class="row note">${left?`${left} are not prime yet. Keep tapping!`:'Only primes left! 🌸'}</div></div>
      ${last?`<div class="fx"><span class="tag">Multiples of ${last}</span><div class="row">${V('n','#9A5BFF')} × ${last}: <span class="num">${[2,3,4,5,6].map(k=>k*last).filter(v=>v<=100).join(', ')}…</span></div></div>`:''}
      <div class="fx"><span class="tag">What is a prime?</span><div class="row">A number you can only make as 1 × itself.</div><div class="row note">7 = 1 × 7 only. But 6 = 2 × 3.</div></div>
      ${!left?`<div class="fx"><span class="tag">The trick</span><div class="row">You only needed 2, 3, 5 and 7, because √100 = 10.</div><div class="row note">There are <b>25</b> primes up to 100.</div></div>`:''}`}
  gd.addEventListener('click',e=>{if(mode!=='sieve')return;const b=e.target.closest('.pot');if(!b||busy)return;const n=+b.dataset.n;
    if(n===1){ui.hint('1 is special. It is not prime and not composite!');tone(300,.1);return}if(dead.has(n)){buzz();ui.hint(`${n} already wilted. It is a multiple of something smaller.`);return}
    if(crowned.has(n))return;if(isP(n)){crowned.add(n);b.classList.add('crown');tone(660,.12,'triangle')}else{const f=pf(n);dead.add(n);b.classList.add('dead');ui.hint(`${n} = ${f[0]} × ${n/f[0]}, so it is not prime. It wilts too!`,4000);tone(250,.15,'sine')}busy=true;let k=2;const my=rid;
    const step=()=>{if(!g.alive||my!==rid)return;if(k*n>100){busy=false;sievePanel(n);checkSieve();return}const m=k*n;if(!dead.has(m)){dead.add(m);const el=gd.querySelector(`[data-n="${m}"]`);el&&el.classList.add('dead');tone(500-k*8,.04,'sine',.05)}k++;g.later(step,n<5?45:80)};step()});
  function checkSieve(){const alive=[...Array(99)].map((_,i)=>i+2).filter(n=>!dead.has(n));if(!done&&alive.every(isP)){done=true;alive.forEach(n=>crowned.add(n));sieveHTML();win(stage,null,null,'25 primes!')}}
  /* ---------- factor tree ---------- */
  const COMP=[12,18,20,24,28,30,36,40,42,48,54,56,60,64,72,84,90,96,100,120,144,180,210];
  function newTree(){tree={v:pick(COMP),kids:null};done=false;treeHTML()}
  function nodeHTML(t,path){const p=isP(t.v);return `<div class="ft"><button class="fn ${p?'prime':''} ${t.kids?'split':''}" data-p="${path}">${t.v}</button>${t.kids?`<div class="fk">${t.kids.map((k,i)=>nodeHTML(k,path+i)).join('')}</div>`:''}</div>`}
  const leaves=t=>t.kids?t.kids.flatMap(leaves):[t.v];
  function treeHTML(){gd.innerHTML=`<div class="tree">${nodeHTML(tree,'r')}</div><div class="splits" id="splits"></div>`;const ls=leaves(tree),allP=ls.every(isP);
    panel.querySelector('#pn').innerHTML=`<div class="fx big hot"><span class="tag">${tree.v} is made of</span><div class="row">${allP?`${tree.v} = ${powStr(ls)}`:`${tree.v} = ${ls.sort((a,b)=>a-b).join(' × ')}`}</div></div>
      <div class="fx"><span class="tag">How to play</span><div class="row">Tap a number to split it into two numbers that multiply to make it.</div><div class="row note">Pink flowers are prime. They cannot split.</div></div>
      ${allP?`<div class="fx"><span class="tag">Secret</span><div class="row">Split it a different way. You will always end with the same primes!</div></div>`:''}`;
    if(allP&&!done&&tree.kids){done=true;win(stage,null,null,`${tree.v} = ${ls.join(' × ')}`)}}
  function nodeAt(path){let t=tree;for(const c of path.slice(1))t=t.kids[+c];return t}
  gd.addEventListener('click',e=>{if(mode!=='tree')return;const sp=e.target.closest('[data-split]');
    if(sp){const[path,a]=sp.dataset.split.split(':');const t=nodeAt(path),A=+a;t.kids=[{v:A},{v:t.v/A}];tone(520,.1,'triangle');tone(780,.12,'triangle',.15,.06);treeHTML();return}
    const b=e.target.closest('.fn');if(!b)return;const t=nodeAt(b.dataset.p);if(t.kids)return;if(isP(t.v)){ui.hint(`${t.v} is prime. It only splits into 1 × ${t.v}.`);tone(800,.1,'sine');return}
    const opts=[];for(let d=2;d*d<=t.v;d++)if(t.v%d===0)opts.push(d);
    gd.querySelector('#splits').innerHTML=`<span class="note">Split ${t.v} into:</span>`+opts.map(d=>`<button class="opt" data-split="${b.dataset.p}:${d}">${d} × ${t.v/d}</button>`).join('');tone(600,.07,'triangle')});
  /* ---------- GCD / LCM ---------- */
  const PAIRS=[[12,18],[8,12],[6,10],[15,20],[24,36],[9,12],[14,21],[18,30],[16,24],[20,30],[12,30],[45,60]];
  function vennHTML(){const[a,b]=pair,fa=pf(a),fb=pf(b),common=[],ra=fa.slice(),rb=fb.slice();
    for(let i=ra.length-1;i>=0;i--){const j=rb.indexOf(ra[i]);if(j>=0){common.push(ra[i]);rb.splice(j,1);ra.splice(i,1)}}
    const gcdv=common.reduce((x,y)=>x*y,1),lcmv=a*b/gcdv;
    const facs=n=>[...Array(n)].map((_,i)=>i+1).filter(d=>n%d===0);const Fa=facs(a),Fb=facs(b);
    gd.innerHTML=`<div class="venn"><div class="vc va"><b>${a}</b><div>${ra.map(p=>`<span class="pb">${p}</span>`).join('')}</div></div><div class="vmid">${common.map(p=>`<span class="pb both">${p}</span>`).join('')||'<span class="note">nothing shared</span>'}</div><div class="vc vb"><b>${b}</b><div>${rb.map(p=>`<span class="pb">${p}</span>`).join('')}</div></div></div>
      <div class="frow"><span class="note">${a} splits evenly by:</span>${Fa.map(d=>`<span class="pb sm ${Fb.includes(d)?'both':''}">${d}</span>`).join('')}</div>
      <div class="frow"><span class="note">${b} splits evenly by:</span>${Fb.map(d=>`<span class="pb sm ${Fa.includes(d)?'both':''}">${d}</span>`).join('')}</div>
      <div class="frow"><span class="note">Counting by ${a}:</span>${[1,2,3,4,5,6].map(k=>`<span class="pb sm ${(k*a)%b===0?'both':''}">${k*a}</span>`).join('')}</div>
      <div class="frow"><span class="note">Counting by ${b}:</span>${[1,2,3,4,5,6].map(k=>`<span class="pb sm ${(k*b)%a===0?'both':''}">${k*b}</span>`).join('')}</div>`;
    panel.querySelector('#pn').innerHTML=`<div class="fx big hot"><span class="tag">Biggest shared (GCD)</span><div class="row">${common.length?common.join(' × ')+' = ':''}<span class="num">${gcdv}</span></div></div>
      <div class="fx big"><span class="tag">Smallest shared (LCM)</span><div class="row"><span class="num">${lcmv}</span></div><div class="row note">all the primes in both circles multiplied</div></div>
      <div class="fx"><span class="tag">Neat fact</span><div class="row">GCD × LCM = ${a} × ${b}</div><div class="row"><span class="num">${gcdv} × ${lcmv} = ${a*b}</span></div></div>`}
  function setMode(m){mode=m;done=false;rid++;busy=false;if(m==='sieve'){dead.clear();crowned.clear();sieveHTML();ui.hint('Tap 2 to wilt all the numbers you get counting by 2!',4500)}
    if(m==='tree'){newTree();ui.hint('Tap the top number to split it!',3500)}if(m==='venn'){vennHTML()}}
  bindChips(ui.top,'pm',setMode);
  stage.querySelector('#again').addEventListener('click',()=>{if(mode==='venn'){pair=pick(PAIRS.filter(p=>p[0]!==pair[0]||p[1]!==pair[1]));vennHTML()}else setMode(mode);tone(500,.08,'triangle')});
  setMode('sieve');
  let typed='';
  g.key(e=>{const k=e.key;if(/^[1-3]$/.test(k)&&e.altKey)return false;
    if(mode==='sieve'&&/^[0-9]$/.test(k)){typed=(typed+k).slice(-3);const n=+typed;gd.querySelectorAll('.pot.typing').forEach(x=>x.classList.remove('typing'));const el=gd.querySelector(`[data-n="${n}"]`);if(el){el.classList.add('typing');el.focus({preventScroll:false})}return true}
    if(mode==='sieve'&&k==='Enter'&&typed){const el=gd.querySelector(`[data-n="${+typed}"]`);typed='';if(el){el.classList.remove('typing');el.click()}return true}
    if(k.toLowerCase()==='n'){stage.querySelector('#again').click();return true}return false});
  GAMES.primes._debug={setMode,get dead(){return dead},get tree(){return tree},get pair(){return pair},PAIRS,get crowned(){return crowned}};
}}});
