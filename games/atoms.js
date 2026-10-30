/* ============================================================
   ATOM BUILDER — build atoms from particles, then molecules
   ============================================================ */
Object.assign(GAMES,{atoms:{title:'Atom Builder',icon:'⚛️',c:'var(--aqua)',age:'8+',section:'lab',order:8,blurb:'Build real atoms, then snap them into molecules.',
init(stage,g){
  const EL=[null,['H','Hydrogen',1,'#FFFFFF'],['He','Helium',4,'#D9FFFF'],['Li','Lithium',7,'#CC80FF'],['Be','Beryllium',9,'#C2FF00'],['B','Boron',11,'#FFB5B5'],['C','Carbon',12,'#7A7A7A'],['N','Nitrogen',14,'#3050F8'],['O','Oxygen',16,'#FF0D0D'],
    ['F','Fluorine',19,'#90E050'],['Ne','Neon',20,'#B3E3F5'],['Na','Sodium',23,'#AB5CF2'],['Mg','Magnesium',24,'#8AFF00'],['Al','Aluminium',27,'#BFA6A6'],['Si','Silicon',28,'#F0C8A0'],['P','Phosphorus',31,'#FF8000'],['S','Sulfur',32,'#FFFF30'],
    ['Cl','Chlorine',35,'#1FF01F'],['Ar','Argon',40,'#80D1E3'],['K','Potassium',39,'#8F40D4'],['Ca','Calcium',40,'#3DFF00']];
  const VAL={1:1,6:4,7:3,8:2,9:1,17:1,16:2,15:3,11:1};
  const MOLS=[['H₂O','Water','O:1,H:2'],['CO₂','Carbon dioxide','C:1,O:2'],['CH₄','Methane','C:1,H:4'],['NH₃','Ammonia','N:1,H:3'],['O₂','Oxygen gas','O:2'],['H₂','Hydrogen gas','H:2'],['N₂','Nitrogen gas','N:2'],['HCl','Hydrochloric acid','H:1,Cl:1'],['H₂O₂','Hydrogen peroxide','H:2,O:2'],['C₂H₆','Ethane','C:2,H:6'],['CH₃OH','Methanol','C:1,H:4,O:1'],['C₂H₄','Ethylene','C:2,H:4']];
  let mode='atom',p=1,n=0,e=1,found=new Set(),frame=0,parts=[],mol={atoms:[],bonds:[]},drags=new Set(),mfound=new Set(),flyers=[];
  const ui=labShell(stage,{label:'Atom builder',top:`${chips('am',[['atom','⚛️ Build an atom'],['mol','🧬 Molecules']],'atom')}<span class="sep"></span><span id="ex" class="pbar"></span>`,panel:'<div id="pn"></div>'});
  const {cv,panel}=ui,ctx=cv.getContext('2d');let dims=fitCanvas(cv);
  const shells=z=>{const s=[];let r=z;for(const cap of [2,8,8,18]){if(r<=0)break;s.push(Math.min(cap,r));r-=cap}return s};
  /* neutron counts of the stable isotopes of elements 1-20 (calcium-48 lives so long it counts) */
  const STABLE={1:[0,1],2:[1,2],3:[3,4],4:[5],5:[5,6],6:[6,7],7:[7,8],8:[8,9,10],9:[10],10:[10,11,12],11:[12],12:[12,13,14],13:[14],14:[14,15,16],15:[16],16:[16,17,18,20],17:[18,20],18:[18,20,22],19:[20,22],20:[20,22,23,24,26,28]};
  const isStable=(z,nn)=>(STABLE[z]||[]).includes(nn);
  function exUI(){stage.querySelector('#ex').innerHTML=mode==='atom'?`<button class="pbtn small" data-a="p+">➕ 🔴 Proton</button><button class="pbtn small" data-a="n+">➕ ⚪ Neutron</button><button class="pbtn small" data-a="e+">➕ 🔵 Electron</button><button class="pbtn small" data-a="p-">➖ 🔴</button><button class="pbtn small" data-a="n-">➖ ⚪</button><button class="pbtn small" data-a="e-">➖ 🔵</button>`
    :`${['H','C','N','O','Cl'].map(s=>`<button class="pbtn small" data-add="${s}">➕ ${s}</button>`).join('')}<button class="pbtn small" data-a="clr">🧹 Clear</button>`}
  function info(){const pn=panel.querySelector('#pn');
    if(mode==='atom'){const E=EL[p],A=p+n,ch=p-e,sh=shells(e),st=isStable(p,n);
      pn.innerHTML=`<div class="fx big hot"><span class="tag">You built</span><div class="row"><span class="elt" style="--ec:${E[3]}"><small>${p}</small><b>${E[0]}</b><small>${fmt(E[2],0)}</small></span> <b>${E[1]}</b></div>
          <div class="row note">${ch===0?'Neutral atom':ch>0?`Ion with charge +${ch} (lost electrons)`:`Ion with charge ${ch} (gained electrons)`}${st?'':` · unstable, it would fall apart! ${E[1]} is happy with ${STABLE[p].join(' or ')} neutrons.`}</div></div>
        <div class="fx"><span class="tag">Which element?</span><div class="row">protons = <span class="num" style="color:#E8384F">${p}</span> → element #${p}</div><div class="row note">Only the number of protons decides the element.</div></div>
        <div class="fx"><span class="tag">Mass number</span><div class="row">${V('A','#1D1842')} = ${V('p','#E8384F')} + ${V('n','#7E8BB8')} = ${p} + ${n} = <span class="num">${A}</span></div></div>
        <div class="fx"><span class="tag">Charge</span><div class="row">${V('p','#E8384F')} − ${V('e','#2F6FE0')} = ${p} − ${e} = <span class="num">${ch>0?'+':''}${ch}</span></div></div>
        <div class="fx"><span class="tag">Electron shells</span><div class="row num">${sh.join(' , ')||'none'}</div><div class="row note">Shells hold 2, then 8, then 8. A full outer shell is happy (noble gas).</div></div>
        <div class="fx"><span class="tag">Elements discovered</span><div class="ptable">${EL.slice(1).map((x,i)=>`<span class="pt ${found.has(i+1)?'got':''}" style="--ec:${x[3]}">${x[0]}</span>`).join('')}</div></div>`}
    else{const cnt={};mol.atoms.forEach(a=>cnt[a.s]=(cnt[a.s]||0)+1);const free=mol.atoms.map(a=>a.v-bondsOf(a)),full=mol.atoms.length>0&&free.every(f=>f===0)&&connected();
      const formula=Object.keys(cnt).sort((a,b)=>a==='C'?-1:b==='C'?1:a.localeCompare(b)).map(s=>s+(cnt[s]>1?`<sub>${cnt[s]}</sub>`:'')).join('');
      const mass=mol.atoms.reduce((s,a)=>s+EL[a.z][2],0);const key=Object.keys(cnt).sort().map(s=>s+':'+cnt[s]).join(',');const m=MOLS.find(q=>q[2].split(',').sort().join(',')===key);
      pn.innerHTML=`<div class="fx big hot"><span class="tag">${full?(m?m[1]:'A real molecule!'):'Still building'}</span><div class="row">${formula||'—'}</div>${full?'':`<div class="row note">${free.reduce((a,b)=>a+b,0)} open bonds left</div>`}</div>
        <div class="fx"><span class="tag">Bonds each atom wants</span><div class="row">H → 1 &nbsp; O → 2 &nbsp; N → 3 &nbsp; C → 4 &nbsp; Cl → 1</div><div class="row note">Drag from one atom to another to share electrons. Drag again for a double bond. Tap an atom to undo a bond. Flick it off the edge to remove it.</div></div>
        <div class="fx"><span class="tag">Molecule mass</span><div class="row">${Object.entries(cnt).map(([s,c])=>`${c} × ${EL[EL.findIndex(x=>x&&x[0]===s)][2]}`).join(' + ')||'0'} = <span class="num">${mass}</span> u</div></div>
        <div class="fx"><span class="tag">Molecules found ${mfound.size}/${MOLS.length}</span><div class="molgrid">${MOLS.map(q=>`<span class="txt">${mfound.has(q[0])?'✅ '+q[0]+' '+q[1]:'⬜ ???'}</span>`).join('')}</div></div>`;
      if(full&&m&&!mfound.has(m[0])){mfound.add(m[0]);win(stage,null,null,m[0]);info()}}}
  const bondsOf=a=>mol.bonds.reduce((s,b)=>s+(b.a===a||b.b===a?b.o:0),0);
  function connected(){if(!mol.atoms.length)return false;const seen=new Set([mol.atoms[0]]),st=[mol.atoms[0]];while(st.length){const x=st.pop();for(const b of mol.bonds){const y=b.a===x?b.b:b.b===x?b.a:null;if(y&&!seen.has(y)){seen.add(y);st.push(y)}}}return seen.size===mol.atoms.length}
  stage.querySelector('#ex').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const a=b.dataset.a,ad=b.dataset.add;
    if(a==='clr'){mol={atoms:[],bonds:[]};info();return}
    if(ad){const z=EL.findIndex(x=>x&&x[0]===ad);const W=dims.w,H=dims.h;mol.atoms.push({s:ad,z,v:VAL[z],x:W/2+(Math.random()-.5)*W*.5,y:H/2+(Math.random()-.5)*H*.4,vx:0,vy:0});tone(500,.08,'triangle');info();return}
    const W=dims.w,H=dims.h,cx=W/2,cy=H/2;
    if(a==='p+'&&p<20){p++;flyers.push({k:'p',x:Math.random()*W,y:-20,tx:cx,ty:cy,t:0})}if(a==='p-'&&p>1)p--;
    if(a==='n+'&&n<24){n++;flyers.push({k:'n',x:Math.random()*W,y:H+20,tx:cx,ty:cy,t:0})}if(a==='n-'&&n>0)n--;
    if(a==='e+'&&e<22){e++;flyers.push({k:'e',x:-20,y:Math.random()*H,tx:cx,ty:cy,t:0})}if(a==='e-'&&e>0)e--;
    tone(a[0]==='p'?400:a[0]==='n'?300:800,.1,'triangle');
    if(e===p&&isStable(p,n)&&!found.has(p)){found.add(p);const E=EL[p];g.later(()=>win(stage,null,null,E[1]+'!'),200)}info()});
  bindChips(ui.top,'am',m=>{mode=m;exUI();info()});
  const nearest=(x,y,skip,r=34)=>{let best=null,bd=r;for(const q of mol.atoms){if(skip(q))continue;const d=Math.hypot(q.x-x,q.y-y);if(d<bd){bd=d;best=q}}return best};
  fingers(cv,{down(f){if(mode!=='mol')return;const a=nearest(f.x,f.y,q=>[...drags].some(d=>d.a===q));if(a){f.data.drag={a,x:f.x,y:f.y,moved:false};drags.add(f.data.drag)}},
    move(f){const drag=f.data.drag;if(!drag)return;drag.x=f.x;drag.y=f.y;if(Math.hypot(f.x-drag.a.x,f.y-drag.a.y)>34)drag.moved=true},
    up(f){const drag=f.data.drag;if(!drag)return;drags.delete(drag);const t=nearest(f.x,f.y,q=>q===drag.a||bondsOf(q)>=q.v,44)||nearest(f.x,f.y,q=>q===drag.a);
      if(f.x<8||f.y<8||f.x>dims.w-8||f.y>dims.h-8){/* flicked off the edge: remove the atom */mol.atoms=mol.atoms.filter(q=>q!==drag.a);mol.bonds=mol.bonds.filter(b=>b.a!==drag.a&&b.b!==drag.a);noise(.15,1500,1,.1);info();return}
      if(t&&drag.moved){const ex=mol.bonds.find(b=>(b.a===drag.a&&b.b===t)||(b.b===drag.a&&b.a===t));if(bondsOf(drag.a)>=drag.a.v||bondsOf(t)>=t.v){buzz();ui.hint(`${bondsOf(drag.a)>=drag.a.v?drag.a.s:t.s} is already full of bonds!`)}
        else if(ex){if(ex.o<3){ex.o++;tone(700,.1,'triangle')}}else{mol.bonds.push({a:drag.a,b:t,o:1});tone(600,.1,'triangle');tone(900,.12,'triangle',.15,.06)}info()}
      else if(!drag.moved){/* tap: undo this atom's newest bond */const i=mol.bonds.map(b=>b.a===drag.a||b.b===drag.a).lastIndexOf(true);if(i>=0){const b=mol.bonds[i];if(b.o>1)b.o--;else mol.bonds.splice(i,1);tone(380,.08,'triangle');info()}}
      else{drag.a.x=f.x;drag.a.y=f.y}}});
  function drawAtom(){const W=dims.w,H=dims.h,cx=W/2,cy=H/2,E=EL[p];ctx.fillStyle='#0E0B26';ctx.fillRect(0,0,W,H);
    const sh=shells(e),R0=Math.min(W,H)*.12;
    sh.forEach((c,k)=>{const R=R0+k*Math.min(W,H)*.1;ctx.strokeStyle='rgba(120,160,255,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.stroke();
      for(let q=0;q<c;q++){const a=q/c*6.283+frame*.01*(1.5-k*.3);ctx.fillStyle='#4F8BFF';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx+Math.cos(a)*R,cy+Math.sin(a)*R,8,0,7);ctx.fill();ctx.stroke();
        ctx.fillStyle='#fff';ctx.font='900 11px Nunito';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('−',cx+Math.cos(a)*R,cy+Math.sin(a)*R)}});
    // nucleus: packed spiral
    const tot=p+n,rr=Math.max(6,R0*.18),st=isStable(p,n),jig=st?0:2.5;let pi=0,ni=0;
    for(let k=0;k<tot;k++){const isP=(k%2===0&&pi<p)||ni>=n;if(isP)pi++;else ni++;const r=rr*.95*Math.sqrt(k),a=k*2.4;const x=cx+Math.cos(a)*r+(Math.random()-.5)*jig,y=cy+Math.sin(a)*r+(Math.random()-.5)*jig;
      ctx.fillStyle=isP?'#FF4F5E':'#C9C2BA';ctx.strokeStyle='#1D1842';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,rr,0,7);ctx.fill();ctx.stroke();if(isP&&rr>7){ctx.fillStyle='#fff';ctx.font=`900 ${rr}px Nunito`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('+',x,y+1)}}
    ctx.fillStyle='#fff';ctx.font=`800 ${Math.min(W,H)*.08}px 'Baloo 2',system-ui`;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(E[0],18,14);ctx.font='900 16px Nunito';ctx.fillText(E[1],20,14+Math.min(W,H)*.08);
    for(let i=flyers.length-1;i>=0;i--){const f=flyers[i];f.t+=.05;if(f.t>=1){flyers.splice(i,1);continue}const x=lerp(f.x,f.tx,f.t*f.t),y=lerp(f.y,f.ty,f.t*f.t);ctx.fillStyle=f.k==='p'?'#FF4F5E':f.k==='n'?'#C9C2BA':'#4F8BFF';ctx.beginPath();ctx.arc(x,y,9,0,7);ctx.fill()}}
  function drawMol(){const W=dims.w,H=dims.h;ctx.fillStyle='#F4F7FF';ctx.fillRect(0,0,W,H);const A=mol.atoms;
    // springy layout: bonds pull, everything pushes
    const dragOf=a=>[...drags].find(d=>d.a===a&&d.moved);
    const held=new Set([...drags].filter(d=>d.moved).map(d=>d.a));
    for(const a of A){const dd=dragOf(a);if(dd&&!mol.atoms.some(t=>t!==a&&Math.hypot(t.x-dd.x,t.y-dd.y)<34)){a.x=dd.x;a.y=dd.y;continue}for(const b of A){if(a===b||held.has(b))continue;const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)||1;if(d<160){a.vx+=dx/d*(160-d)*.004;a.vy+=dy/d*(160-d)*.004}}}
    for(const b of mol.bonds){if(held.has(b.a)||held.has(b.b))continue;const dx=b.b.x-b.a.x,dy=b.b.y-b.a.y,d=Math.hypot(dx,dy)||1,f=(d-90)*.03;b.a.vx+=dx/d*f;b.a.vy+=dy/d*f;b.b.vx-=dx/d*f;b.b.vy-=dy/d*f}
    for(const a of A){const dd=dragOf(a);if(dd&&!mol.atoms.some(t=>t!==a&&Math.hypot(t.x-dd.x,t.y-dd.y)<34))continue;a.vx*=.85;a.vy*=.85;a.x=clamp(a.x+a.vx,30,W-30);a.y=clamp(a.y+a.vy,30,H-30)}
    for(const b of mol.bonds){const dx=b.b.x-b.a.x,dy=b.b.y-b.a.y,d=Math.hypot(dx,dy)||1,nx=-dy/d*6,ny=dx/d*6;for(let k=0;k<b.o;k++){const o=(k-(b.o-1)/2);ctx.strokeStyle='#1D1842';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(b.a.x+nx*o,b.a.y+ny*o);ctx.lineTo(b.b.x+nx*o,b.b.y+ny*o);ctx.stroke()}}
    for(const drag of drags){ctx.strokeStyle='rgba(154,91,255,.7)';ctx.setLineDash([6,6]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(drag.a.x,drag.a.y);ctx.lineTo(drag.x,drag.y);ctx.stroke();ctx.setLineDash([])}
    for(const a of A){const r=a.s==='H'?20:28,free=a.v-bondsOf(a);ctx.fillStyle=EL[a.z][3];ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.arc(a.x,a.y,r,0,7);ctx.fill();ctx.stroke();
      ctx.fillStyle=a.s==='C'||a.s==='N'||a.s==='O'?'#fff':'#1D1842';ctx.font=`800 ${r*.9}px 'Baloo 2',system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(a.s,a.x,a.y+2);
      for(let q=0;q<free;q++){const an=-Math.PI/2+q*2*Math.PI/Math.max(free,1)+frame*.01;ctx.fillStyle='#FFC83D';ctx.strokeStyle='#1D1842';ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x+Math.cos(an)*(r+8),a.y+Math.sin(an)*(r+8),5,0,7);ctx.fill();ctx.stroke()}}
    if(!A.length){ctx.fillStyle='#7E8BB8';ctx.font='900 18px Nunito';ctx.textAlign='center';ctx.fillText('Add some atoms with the buttons above!',W/2,H/2)}}
  function resize(){dims=fitCanvas(cv)}const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  found.add(1);exUI();info();
  kbPointer(g,cv,{enabled:()=>mode==='mol'});
  g.key(e=>{const k=e.key.toLowerCase();
    if(mode==='atom'){const m={p:'p',n:'n',e:'e'}[k];if(m){stage.querySelector(`[data-a="${m}${e.shiftKey?'-':'+'}"]`).click();return true}return false}
    const at={h:'H',c:'C',n:'N',o:'O',l:'Cl'}[k];if(at){stage.querySelector(`[data-add="${at}"]`).click();return true}return false});ui.hint('Add protons, neutrons and electrons. The number of protons picks the element!',5000);
  g.loop(()=>{frame++;ctx.setTransform(dims.d,0,0,dims.d,0,0);mode==='atom'?drawAtom():drawMol()});
  GAMES.atoms._debug={set(P,N,E){p=P;n=N;e=E;info()},get mol(){return mol},info,setMode(m){mode=m;exUI();info()},bond(i,j){mol.bonds.push({a:mol.atoms[i],b:mol.atoms[j],o:1});info()},add(s){stage.querySelector(`[data-add="${s}"]`).click()}};
}}});
