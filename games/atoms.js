/* ============================================================
   ATOM BUILDER — build atoms from particles, snap them into molecules, then react them
   All the science (element data, isotopes, electron arrangements, molecule recognition, shapes, reactions and the
   reaction chamber) lives in games/atoms-sci.js (ATOM_SCI). This file draws it and turns touches into actions.
   ============================================================ */
Object.assign(GAMES,{atoms:{title:'Atom Builder',icon:'⚛️',c:'var(--aqua)',age:'8+',section:'lab',order:8,blurb:'Build real atoms, snap them into molecules, then make them react.',
init(stage,g){
  const S=ATOM_SCI,EL=S.ELEMENTS;
  const MAXP=20,MAXN=30,MAXE=22;
  let mode='atom',p=1,n=0,e=1,view='shell',found=new Set([1]),frame=0,grab=null,flyers=[];
  let mol={atoms:[],bonds:[]},molVer=0,cons=null,consVer=-1,drags=new Set(),turn=null,mfound=new Set(),extra=new Set();
  let inv={},xp='free',ch=null,paused=false,seenEv=0,flashes=[],tmpl=null;
  const ui=labShell(stage,{label:'Atom builder',top:`${chips('am',[['atom','⚛️ Build an atom'],['mol','🧬 Molecules'],['rx','⚗️ Reactions']],'atom')}<span class="sep"></span><span id="ex" class="pbar"></span>`,panel:'<div id="pn"></div>'});
  const {cv,panel}=ui,ctx=cv.getContext('2d');let dims=fitCanvas(cv);
  const pn=panel.querySelector('#pn'),ex=stage.querySelector('#ex');
  const elOf=s=>S.zOf(s);
  const PCOL={p:'#FF4F5E',n:'#C9C2BA',e:'#4F8BFF'},PNAME={p:'Proton',n:'Neutron',e:'Electron'};

  /* ---------------- toolbar ---------------- */
  function exUI(){
    if(mode==='atom')ex.innerHTML=`<button class="pbtn small" data-a="p+">➕ 🔴 Proton</button><button class="pbtn small" data-a="n+">➕ ⚪ Neutron</button><button class="pbtn small" data-a="e+">➕ 🔵 Electron</button><button class="pbtn small" data-a="p-">➖ 🔴</button><button class="pbtn small" data-a="n-">➖ ⚪</button><button class="pbtn small" data-a="e-">➖ 🔵</button><button class="pbtn small" data-a="view" aria-pressed="${view==='cloud'}">${view==='shell'?'☁️ Clouds':'◎ Shells'}</button>`;
    else if(mode==='mol')ex.innerHTML=`${S.BUILD.map(s=>`<button class="pbtn small" data-add="${s}">➕ ${s}</button>`).join('')}<button class="pbtn small" data-a="clr">🧹 Clear</button><button class="pbtn small" data-a="send">⚗️ Send to reactions</button>`;
    else ex.innerHTML=`${chips('xp',[['free','🧪 My molecules'],...S.EXPERIMENTS.map(x=>[x.id,x.name])],xp)}<span class="sep"></span><button class="pbtn small" data-a="pause">${paused?'▶️ Play':'⏸️ Pause'}</button><button class="pbtn small" data-a="reset">↺ Reset</button><button class="pbtn small" data-a="spark">⚡ Spark</button><button class="pbtn small" data-a="hot">🔥 Hotter</button><button class="pbtn small" data-a="cold">❄️ Cooler</button><button class="pbtn small" data-cat="1" aria-pressed="${!!(ch&&ch.state.catalyst)}">${ch&&ch.state.catalyst?'✅':'⬜'} Catalyst</button><button class="pbtn small" data-light="1" aria-pressed="${!!(ch&&ch.state.light)}">${ch&&ch.state.light?'💡':'🌑'} Light</button>`}
  function setToggles(){const c=ex.querySelector('[data-cat]'),l=ex.querySelector('[data-light]'),pa=ex.querySelector('[data-a="pause"]');if(!c||!ch)return;
    c.innerHTML=`${ch.state.catalyst?'✅':'⬜'} Catalyst`;c.setAttribute('aria-pressed',ch.state.catalyst);l.innerHTML=`${ch.state.light?'💡':'🌑'} Light`;l.setAttribute('aria-pressed',ch.state.light);pa.innerHTML=paused?'▶️ Play':'⏸️ Pause'}

  ex.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const a=b.dataset.a,ad=b.dataset.add;
    if(b.dataset.xp){xp=b.dataset.xp;ex.querySelectorAll('[data-xp]').forEach(x=>x.classList.toggle('on',x===b));tone(560,.07,'triangle');newChamber();exUI();info();return}
    if(b.dataset.cat){ch.set({catalyst:!ch.state.catalyst});tone(ch.state.catalyst?700:400,.1,'triangle');setToggles();info();return}
    if(b.dataset.light){ch.set({light:!ch.state.light});tone(ch.state.light?900:350,.1,'triangle');setToggles();info();return}
    if(mode==='atom'&&a==='view'){view=view==='shell'?'cloud':'shell';b.innerHTML=view==='shell'?'☁️ Clouds':'◎ Shells';b.setAttribute('aria-pressed',view==='cloud');tone(560,.07,'triangle');return}
    if(mode==='atom'&&a){const k=a[0],d=a[1]==='+'?1:-1;change(k,d,'button');return}
    if(mode==='mol'){
      if(a==='clr'){mol={atoms:[],bonds:[]};molVer++;info();return}
      if(a==='send'){send();return}
      if(ad){addAtom(ad);return}}
    if(mode==='rx'){
      if(a==='pause'){paused=!paused;tone(paused?380:620,.08,'triangle');setToggles();info();return}
      if(a==='reset'){newChamber(true);tone(500,.1,'triangle');info();return}   /* back to the start; stays paused if it was */
      if(a==='spark'){sparkAt(S.BOX.w/2,S.BOX.h/2);return}
      if(a==='hot'||a==='cold'){ch.set({T:ch.state.Tset+(a==='hot'?100:-100)});tone(a==='hot'?660:330,.08,'triangle');info();return}}
  });
  bindChips(ui.top,'am',m=>{mode=m;grab=null;drags.clear();turn=null;if(m==='rx'&&!ch)newChamber();exUI();info()});

  /* ================= ATOM MODE ================= */
  /* where everything sits on the canvas: the three particle bins, the atom's centre, nucleus and shell radii */
  function atomGeo(){const W=dims.w,H=dims.h,row=H>=360||W<H;
    const bins=['p','n','e'].map((k,i)=>row?{k,x:W/2+(i-1)*Math.min(120,W/3.4),y:H-38,r:24}:{k,x:W-40,y:H/2+(i-1)*Math.min(84,H/3.3),r:22});
    const aw=row?W:W-84,ah=row?H-80:H,cx=aw/2,cy=row?ah/2+4:H/2,m=Math.max(80,Math.min(aw,ah));
    const rn=clamp(m*.075,12,34),outer=m/2-12,shellR=k=>rn+16+(k+.6)*(outer-rn-16)/4.2;
    return{W,H,bins,cx,cy,m,rn,outer,shellR}}
  function nucleons(G){const tot=p+n,rr=clamp(G.rn/(Math.sqrt(tot)*.62+.6),3.5,11),st=S.isStable(p,n),out=[];let pi=0,ni=0;
    for(let k=0;k<tot;k++){const isP=(k%2===0&&pi<p)||ni>=n;if(isP)pi++;else ni++;const r=rr*.95*Math.sqrt(k),a=k*2.4,j=st?0:2.2;
      out.push({k:isP?'p':'n',x:G.cx+Math.cos(a)*r+Math.sin(frame*.9+k)*j,y:G.cy+Math.sin(a)*r+Math.cos(frame*.8+k*1.7)*j,r:rr})}return out}
  function electrons(G){const sh=S.shells(e),out=[];sh.forEach((c,k)=>{const R=G.shellR(k);for(let q=0;q<c;q++){const a=q/c*6.283+frame*.008*(1.4-k*.25);out.push({x:G.cx+Math.cos(a)*R,y:G.cy+Math.sin(a)*R,shell:k})}});return out}
  /* add or remove one particle; every button, key and drag goes through here */
  function change(k,d,src,from){
    const lim={p:[1,MAXP],n:[0,MAXN],e:[0,MAXE]}[k],v={p,n,e}[k]+d;
    if(v<lim[0]||v>lim[1]){buzz();if(d>0)ui.hint(k==='p'?'This lab goes up to calcium (20 protons).':k==='n'?'That many neutrons would never stay together.':'No atom here could hold that many electrons.');return false}
    if(k==='p')p=v;else if(k==='n')n=v;else e=v;
    const G=atomGeo();
    if(d>0){const b=G.bins.find(x=>x.k===k),s=from||b;const t=k==='e'?electrons(G).slice(-1)[0]||{x:G.cx,y:G.cy}:{x:G.cx,y:G.cy};flyers.push({k,x:s.x,y:s.y,tx:t.x,ty:t.y,t:0})}
    else{const s=from||(k==='e'?electrons(G).slice(-1)[0]:{x:G.cx,y:G.cy})||{x:G.cx,y:G.cy};const a=Math.atan2(s.y-G.cy,s.x-G.cx)||-.6;flyers.push({k,x:s.x,y:s.y,tx:s.x+Math.cos(a)*G.W,ty:s.y+Math.sin(a)*G.W,t:0,out:true})}
    tone(k==='p'?400:k==='n'?300:800,.1,'triangle',.2,0,d<0?(k==='p'?280:k==='n'?210:560):undefined);
    if(e===p&&S.isStable(p,n)&&!found.has(p)){found.add(p);const E=EL[p];g.later(()=>win(stage,null,null,E[1]+'!'),200)}
    info();return true}
  /* touch: drag particles from the bins into the atom, or pull them out of it; tap a bin to add one */
  function atomDown(f){const G=atomGeo();
    for(const b of G.bins)if(Math.hypot(f.x-b.x,f.y-b.y)<b.r+12){grab={k:b.k,from:'bin',x:f.x,y:f.y,sx:f.x,sy:f.y};return}
    const d=Math.hypot(f.x-G.cx,f.y-G.cy);
    if(d<=G.rn+8){let best=null,bd=1e9;for(const q of nucleons(G)){const dd=Math.hypot(q.x-f.x,q.y-f.y);if(dd<bd){bd=dd;best=q}}if(best)grab={k:best.k,from:'atom',x:f.x,y:f.y,sx:f.x,sy:f.y};return}
    if(e>0&&d<=G.outer+20){grab={k:'e',from:'atom',x:f.x,y:f.y,sx:f.x,sy:f.y}}}
  function atomUp(f){if(!grab)return;const G=atomGeo(),g0=grab;grab=null;const moved=Math.hypot(f.x-g0.sx,f.y-g0.sy)>10,inside=Math.hypot(f.x-G.cx,f.y-G.cy)<=G.outer+26;
    if(g0.from==='bin'){if(!moved||inside)change(g0.k,1,'drag',moved?{x:f.x,y:f.y}:null);else{flyers.push({k:g0.k,x:f.x,y:f.y,...(()=>{const b=G.bins.find(x=>x.k===g0.k);return{tx:b.x,ty:b.y}})(),t:0});ui.hint(`Drop the ${PNAME[g0.k].toLowerCase()} on the atom to add it.`)}}
    else if(moved&&!inside){change(g0.k,-1,'drag',{x:f.x,y:f.y});if(g0.k==='e')ui.hint('The outermost electron is the easiest one to pull off.')}
    else if(!moved&&g0.k!=='e')ui.hint(`Drag a ${PNAME[g0.k].toLowerCase()} out of the nucleus to remove it.`)}
  function drawAtom(){const G=atomGeo(),{W,H,cx,cy}=G,E=EL[p];ctx.fillStyle='#0E0B26';ctx.fillRect(0,0,W,H);
    const conf=S.configuration(e);
    if(view==='shell'){S.shells(e).forEach((c,k)=>{const R=G.shellR(k);ctx.strokeStyle='rgba(120,160,255,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.stroke()});
      for(const q of electrons(G))dot(q.x,q.y,8,PCOL.e,'−')}
    else drawClouds(G,conf);
    // nucleus
    const st=S.isStable(p,n);
    if(!st&&p+n>1){ctx.fillStyle=`rgba(255,200,61,${.15+.1*Math.sin(frame*.2)})`;ctx.beginPath();ctx.arc(cx,cy,G.rn+10,0,7);ctx.fill()}
    for(const q of nucleons(G)){ctx.fillStyle=PCOL[q.k];ctx.strokeStyle='#1D1842';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,7);ctx.fill();ctx.stroke();
      if(q.k==='p'&&q.r>7){ctx.fillStyle='#fff';ctx.font=`900 ${q.r}px Nunito,system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('+',q.x,q.y+1)}}
    // labels
    ctx.fillStyle='#fff';ctx.font=`800 ${Math.min(W,H)*.08}px 'Baloo 2',system-ui`;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(E[0],18,12);
    ctx.font='900 16px Nunito,system-ui';ctx.fillText(`${E[1]}-${p+n}`,20,12+Math.min(W,H)*.08);
    {const narrow=W<620,l1=view==='shell'?'Simplified shell picture, not to scale.':'Electron clouds (orbitals), simplified.',l2=view==='shell'?'Real electrons don\'t circle on tracks: they spread out in clouds.':'Real nucleus: about 100,000× smaller than the atom.';
      ctx.font=`800 ${narrow?10:11}px Nunito,system-ui`;ctx.fillStyle='rgba(255,255,255,.55)';ctx.textAlign=narrow?'left':'right';ctx.textBaseline='top';
      const y0=narrow?18+Math.min(W,H)*.08+20:10,x0=narrow?20:W-12;ctx.fillText(l1,x0,y0);ctx.fillText(l2,x0,y0+14)}
    // bins
    for(const b of G.bins){ctx.fillStyle='rgba(255,255,255,.08)';ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(b.x,b.y,b.r+8,0,7);ctx.fill();ctx.stroke();ctx.setLineDash([]);
      dot(b.x,b.y,b.r*.55,PCOL[b.k],b.k==='p'?'+':b.k==='e'?'−':'');ctx.fillStyle='rgba(255,255,255,.75)';ctx.font='900 11px Nunito,system-ui';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(PNAME[b.k],b.x,b.y+b.r+9>H-12?b.y-b.r-22:b.y+b.r+9)}
    // flying particles (animation only)
    for(let i=flyers.length-1;i>=0;i--){const f=flyers[i];f.t+=.05;if(f.t>=1){flyers.splice(i,1);continue}const t=f.out?f.t:f.t*f.t,x=lerp(f.x,f.tx,t),y=lerp(f.y,f.ty,t);ctx.globalAlpha=f.out?1-f.t:1;dot(x,y,8,PCOL[f.k]);ctx.globalAlpha=1}
    if(grab){dot(grab.x,grab.y,11,PCOL[grab.k],grab.k==='p'?'+':grab.k==='e'?'−':'');const inside=Math.hypot(grab.x-cx,grab.y-cy)<=G.outer+26;
      if(grab.from==='bin'&&inside||grab.from==='atom'&&!inside){ctx.strokeStyle=grab.from==='bin'?'#24C786':'#FF8A2B';ctx.lineWidth=3;ctx.setLineDash([6,6]);ctx.beginPath();ctx.arc(cx,cy,G.outer+20,0,7);ctx.stroke();ctx.setLineDash([])}}}
  function dot(x,y,r,col,mark){ctx.fillStyle=col;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.stroke();if(mark){ctx.fillStyle='#fff';ctx.font=`900 ${Math.round(r*1.4)}px Nunito,system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(mark,x,y+1)}}
  /* orbital clouds: s = round cloud, p = three dumbbells (filled one electron each first, then paired: Hund's rule) */
  function drawClouds(G,conf){const{cx,cy}=G;
    const R=nq=>G.shellR(nq-1);
    for(const o of conf.slice().reverse()){const r=R(o.n),full=o.k/({s:2,p:6,d:10}[o.l]);
      if(o.l==='s'){const gr=ctx.createRadialGradient(cx,cy,r*.55,cx,cy,r*1.08);gr.addColorStop(0,'rgba(79,139,255,0)');gr.addColorStop(.7,`rgba(79,139,255,${.18+.22*full})`);gr.addColorStop(1,'rgba(79,139,255,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(cx,cy,r*1.08,0,7);ctx.fill()}
      else{const lobes=o.l==='p'?3:5;for(let i=0;i<lobes;i++){const occ=o.k>=lobes+i+1?2:o.k>i?1:0;if(!occ)continue;const a=i*Math.PI/lobes+(o.l==='d'?.3:0);
        for(const sg of[1,-1]){ctx.save();ctx.translate(cx+Math.cos(a)*r*.55*sg,cy+Math.sin(a)*r*.55*sg);ctx.rotate(a);const gr=ctx.createRadialGradient(0,0,0,0,0,r*.5);gr.addColorStop(0,`rgba(154,91,255,${occ===2?.42:.24})`);gr.addColorStop(1,'rgba(154,91,255,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(0,0,r*.5,r*.24,0,0,7);ctx.fill();ctx.restore()}}}
      ctx.fillStyle='rgba(255,255,255,.6)';ctx.font='800 11px Nunito,system-ui';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(o.n+o.l+(o.k>1?'':''),cx+r*.72+3,cy-r*.72+(o.l==='p'?12:0))}}
  function atomInfo(){const E=EL[p],A=p+n,q=p-e,sh=S.shells(e),nuc=S.nuclide(p,n),ion=S.ionInfo(p,e),chem=S.chemistry(p,e),stab=S.stableNeutrons(p);
    const nucTxt=nuc.stable?`${cap(nuc.name)} is stable: it never falls apart. ${fmt(nuc.abundance,nuc.abundance<1?3:1)}% of the ${E[1].toLowerCase()} in nature is this kind.`
      :nuc.known?`${cap(nuc.name)} is radioactive: half of it falls apart every ${nuc.halfLife}, by ${nuc.decay}.${nuc.abundance?` A little is found in nature (${nuc.abundance}%).`:''}`
      :`This nucleus is too unbalanced to hold together. It would fall apart almost instantly, if it could form at all.`;
    pn.innerHTML=`<div class="fx big hot"><span class="tag">You built</span><div class="row"><span class="elt" style="--ec:${E[3]}"><small>${p}</small><b>${E[0]}</b><small>${fmt(E[2],0)}</small></span> <b>${E[1]}</b>-${A}</div>
        <div class="row note">${q===0?'Neutral atom':q>0?`Ion with charge +${q} (lost electrons)`:`Ion with charge ${q} (gained electrons)`} · ${nuc.stable?'stable nucleus':'unstable nucleus, it would fall apart!'}</div></div>
      <div class="fx"><span class="tag">Nucleus</span><div class="row txt">${nucTxt}</div><div class="row txt">Stable ${E[1].toLowerCase()} has ${stab.join(' or ')} neutron${stab.length>1||stab[0]!==1?'s':''}.</div>
        <div class="row note">Neutrons only change the nucleus: how heavy it is and whether it holds together. They don't change how the atom reacts.</div></div>
      <div class="fx"><span class="tag">Chemistry</span><div class="row txt">${chem.text}</div><div class="row txt">${ion.text}</div>
        <div class="row note">Chemistry comes from the electrons, not the neutrons: carbon-12 and carbon-14 react the same way.</div></div>
      <div class="fx"><span class="tag">Which element?</span><div class="row">protons = <span class="num" style="color:#E8384F">${p}</span> → element #${p}</div><div class="row note">Only the number of protons decides the element.</div></div>
      <div class="fx"><span class="tag">Mass number</span><div class="row">${V('A','#1D1842')} = ${V('p','#E8384F')} + ${V('n','#7E8BB8')} = ${p} + ${n} = <span class="num">${A}</span></div><div class="row note">The ${fmt(E[2],E[2]<10?3:2)} on the periodic table is the average over the isotopes found in nature.</div></div>
      <div class="fx"><span class="tag">Charge</span><div class="row">${V('p','#E8384F')} − ${V('e','#2F6FE0')} = ${p} − ${e} = <span class="num">${q>0?'+':''}${q}</span></div></div>
      <div class="fx"><span class="tag">Electron shells</span><div class="row num">${sh.join(' , ')||'none'}</div><div class="row">${S.configText(e)}</div><div class="row note">Electrons fill 1s, 2s, 2p, 3s, 3p, then 4s. A full outer shell (like a noble gas) is very stable.</div></div>
      <div class="fx"><span class="tag">Elements discovered</span><div class="ptable">${EL.slice(1).map((x,i)=>`<span class="pt ${found.has(i+1)?'got':''}" style="--ec:${x[3]}">${x[0]}</span>`).join('')}</div><div class="row note">An element counts when you build a neutral atom with a stable nucleus.</div></div>`}
  const cap=s=>s[0].toUpperCase()+s.slice(1);

  /* ================= MOLECULE MODE ================= */
  const AR=s=>s==='H'?20:s==='Cl'?31:28;
  const rScale=()=>clamp(Math.min(dims.w,dims.h)/600,.62,1);
  function addAtom(s){const zn=elOf(s),W=dims.w,H=dims.h;mol.atoms.push({s,zn,v:S.VALENCE[s],x:W/2+(Math.random()-.5)*W*.5,y:H/2+(Math.random()-.5)*H*.4,z:(Math.random()-.5)*20,vx:0,vy:0});molVer++;tone(500,.08,'triangle');info()}
  const bondsOf=a=>mol.bonds.reduce((s,b)=>s+(b.a===a||b.b===a?b.o:0),0);
  const asIdx=()=>{const ix=new Map(mol.atoms.map((a,i)=>[a,i]));return{atoms:mol.atoms.map(a=>a.s),bonds:mol.bonds.map(b=>[ix.get(b.a),ix.get(b.b),b.o])}};
  function analysis(){const{atoms,bonds}=asIdx();return S.analyze(atoms,bonds)}
  function fragments(){const id=new Map();mol.atoms.forEach((a,i)=>id.set(a,i));const par=mol.atoms.map((_,i)=>i),f=i=>par[i]===i?i:(par[i]=f(par[i]));
    for(const b of mol.bonds)par[f(id.get(b.a))]=f(id.get(b.b));return mol.atoms.map((_,i)=>f(i))}
  function send(){const a=analysis();
    if(!a.complete){buzz();ui.hint(a.n?'Finish the molecule first: every atom needs all its bonds.':'Build a molecule first, then send it.');return}
    if(!a.match){buzz();ui.hint('Atom Builder only sends molecules it knows. This one isn\'t in its list.');return}
    const sp=S.speciesOfLib(a.match.key);if(!sp){buzz();ui.hint(`${a.match.name} has no reactions in this lab yet.`);return}
    inv[sp.key]=(inv[sp.key]||0)+4;tone(600,.1,'triangle');tone(900,.12,'triangle',.15,.08);
    ui.hint(`Sent 4 × ${sp.f} to the reaction chamber ⚗️ (each molecule there stands for a millimole).`,4000);if(ch&&xp==='free')ch=null;info()}
  const nearest=(x,y,skip,r=34)=>{let best=null,bd=r;for(const q of mol.atoms){if(skip(q))continue;const d=Math.hypot(q.x-x,q.y-y);if(d>=r)continue;const dd=d-(q.z||0)*.03;/* front atoms win a near tie */if(dd<bd){bd=dd;best=q}}return best};
  function molDown(f){const a=nearest(f.x,f.y,q=>[...drags].some(d=>d.a===q));
    if(a){f.data.drag={a,x:f.x,y:f.y,sx:f.x,sy:f.y,moved:false};drags.add(f.data.drag);return}
    /* empty space: turn the nearest molecule in 3-D */
    const fr=fragments();let best=-1,bd=1e9;mol.atoms.forEach((q,i)=>{const d=Math.hypot(q.x-f.x,q.y-f.y);if(d<bd){bd=d;best=i}});
    if(best>=0){const set=mol.atoms.filter((_,i)=>fr[i]===fr[best]);if(set.length>1)f.data.turn=turn={set,x:f.x,y:f.y}}}
  function molMove(f){const t=f.data.turn;if(t){const dx=f.x-t.x,dy=f.y-t.y;t.x=f.x;t.y=f.y;rotate(t.set,dx*.012,dy*.012);return}
    const drag=f.data.drag;if(!drag)return;drag.x=f.x;drag.y=f.y;if(Math.hypot(f.x-drag.a.x,f.y-drag.a.y)>34||Math.hypot(f.x-drag.sx,f.y-drag.sy)>34)drag.moved=true}
  function molUp(f){if(f.data.turn){turn=null;return}const drag=f.data.drag;if(!drag)return;drags.delete(drag);
    const t=nearest(f.x,f.y,q=>q===drag.a||bondsOf(q)>=q.v,44)||nearest(f.x,f.y,q=>q===drag.a);
    if(f.x<8||f.y<8||f.x>dims.w-8||f.y>dims.h-8){/* flicked off the edge: remove the atom */mol.atoms=mol.atoms.filter(q=>q!==drag.a);mol.bonds=mol.bonds.filter(b=>b.a!==drag.a&&b.b!==drag.a);molVer++;noise(.15,1500,1,.1);info();return}
    if(t&&drag.moved){const ex2=mol.bonds.find(b=>(b.a===drag.a&&b.b===t)||(b.b===drag.a&&b.a===t));
      if(bondsOf(drag.a)>=drag.a.v||bondsOf(t)>=t.v){buzz();ui.hint(`${bondsOf(drag.a)>=drag.a.v?drag.a.s:t.s} is already full of bonds!`)}
      else if(ex2){if(ex2.o<3){ex2.o++;molVer++;tone(700,.1,'triangle')}}else{mol.bonds.push({a:drag.a,b:t,o:1});molVer++;tone(600,.1,'triangle');tone(900,.12,'triangle',.15,.06)}info()}
    else if(!drag.moved){/* tap: undo this atom's newest bond */const i=mol.bonds.map(b=>b.a===drag.a||b.b===drag.a).lastIndexOf(true);if(i>=0){const b=mol.bonds[i];if(b.o>1)b.o--;else mol.bonds.splice(i,1);molVer++;tone(380,.08,'triangle');info()}}
    else{drag.a.x=f.x;drag.a.y=f.y}}
  function rotate(set,yaw,pitch){const cx=set.reduce((s,a)=>s+a.x,0)/set.length,cy=set.reduce((s,a)=>s+a.y,0)/set.length,cz=set.reduce((s,a)=>s+a.z,0)/set.length;
    const cy1=Math.cos(yaw),sy1=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    for(const a of set){let x=a.x-cx,y=a.y-cy,z=a.z-cz;[x,z]=[x*cy1-z*sy1,x*sy1+z*cy1];[y,z]=[y*cp-z*sp,y*sp+z*cp];a.x=cx+x;a.y=cy+y;a.z=cz+z}}
  /* one frame of layout: molecules take their real shape (bond lengths + VSEPR angles), separate pieces drift apart */
  function layoutMol(){const A=mol.atoms,W=dims.w,H=dims.h,rs=rScale();if(!A.length)return;
    if(consVer!==molVer){const{atoms,bonds}=asIdx();cons=S.shapeConstraints(atoms,bonds);consVer=molVer}
    const held=new Set([...drags].filter(d=>d.moved).map(d=>d.a)),fr=fragments(),idx=new Map(A.map((a,i)=>[a,i]));
    const near13=new Set(cons.dist.map(c=>c.i+','+c.j).concat(cons.dist.map(c=>c.j+','+c.i)));
    for(const d of drags)if(d.moved&&!A.some(t=>t!==d.a&&Math.hypot(t.x-d.x,t.y-d.y)<34)){d.a.x=d.x;d.a.y=d.y}
    for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){const a=A[i],b=A[j];if(near13.has(i+','+j)||held.has(a)||held.has(b))continue;   /* an atom on the finger doesn't shove the others away */
      const ra=AR(a.s)*rs,rb=AR(b.s)*rs;
      if(fr[i]!==fr[j]){if(drags.size)continue;/* nothing slides away while a bond is being dragged */const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)||1,min=ra+rb+24;if(d<min){const f=(min-d)*.01;if(!held.has(a)){a.vx+=dx/d*f;a.vy+=dy/d*f}if(!held.has(b)){b.vx-=dx/d*f;b.vy-=dy/d*f}}}
      else{const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z,d=Math.hypot(dx,dy,dz)||1,min=(ra+rb)*.95;if(d<min){const s=(min-d)/d*.25,wa=held.has(a)?0:1,wb=held.has(b)?0:1;a.x+=dx*s*wa;a.y+=dy*s*wa;a.z+=dz*s*wa;b.x-=dx*s*wb;b.y-=dy*s*wb;b.z-=dz*s*wb}}}
    for(const a of A){a.fixed=held.has(a);if(a.fixed)continue;a.vx*=.85;a.vy*=.85;a.x+=a.vx;a.y+=a.vy}
    S.relax(A,cons,clamp(Math.min(W,H)/560,.45,.8),3);
    const groups=new Map();A.forEach((a,i)=>{let g0=groups.get(fr[i]);if(!g0)groups.set(fr[i],g0=[]);g0.push(a)});
    for(const set of groups.values()){const mz=set.reduce((s,a)=>s+a.z,0)/set.length;for(const a of set)a.z-=mz*.1}
    for(const a of A){if(a.fixed)continue;const r=AR(a.s)*rs+4;a.x=clamp(a.x,r,W-r);a.y=clamp(a.y,r,H-r)}
    for(const a of A)delete a.fixed}
  function drawMol(){const W=dims.w,H=dims.h,rs=rScale();ctx.fillStyle='#F4F7FF';ctx.fillRect(0,0,W,H);const A=mol.atoms;
    layoutMol();
    const depth=a=>clamp(1+a.z/700,.8,1.2);
    for(const b of mol.bonds){const dx=b.b.x-b.a.x,dy=b.b.y-b.a.y,d=Math.hypot(dx,dy)||1,nx=-dy/d*6,ny=dx/d*6;for(let k=0;k<b.o;k++){const o=(k-(b.o-1)/2);ctx.strokeStyle='#1D1842';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(b.a.x+nx*o,b.a.y+ny*o);ctx.lineTo(b.b.x+nx*o,b.b.y+ny*o);ctx.stroke()}}
    for(const drag of drags){ctx.strokeStyle='rgba(154,91,255,.7)';ctx.setLineDash([6,6]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(drag.a.x,drag.a.y);ctx.lineTo(drag.x,drag.y);ctx.stroke();ctx.setLineDash([])}
    for(const a of A.slice().sort((u,v)=>u.z-v.z)){const k=depth(a),r=AR(a.s)*rs*k,free=a.v-bondsOf(a),lp=(S.VALENCE_E[a.s]-a.v)/2;
      ctx.fillStyle=EL[a.zn][3];ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.arc(a.x,a.y,r,0,7);ctx.fill();ctx.stroke();
      if(k<1){ctx.fillStyle=`rgba(244,247,255,${(1-k)*2.2})`;ctx.beginPath();ctx.arc(a.x,a.y,r,0,7);ctx.fill()}
      ctx.fillStyle=a.s==='C'||a.s==='N'||a.s==='O'?'#fff':'#1D1842';ctx.font=`800 ${r*.9}px 'Baloo 2',system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(a.s,a.x,a.y+2);
      /* yellow dots: electrons still free to make a bond. small dark pairs: lone pairs (they never bond, but they push bonds apart) */
      const taken=mol.bonds.filter(b=>b.a===a||b.b===a).map(b=>{const o=b.a===a?b.b:b.a;return Math.atan2(o.y-a.y,o.x-a.x)});
      const spot=()=>{let best=0,bd=-1;for(let i=0;i<36;i++){const an=i/36*6.283-Math.PI/2;const dmin=taken.length?Math.min(...taken.map(t=>Math.abs(Math.atan2(Math.sin(an-t),Math.cos(an-t))))):9;if(dmin>bd+1e-6){bd=dmin;best=an}}taken.push(best);return best};
      for(let q=0;q<free;q++){const an=spot();ctx.fillStyle='#FFC83D';ctx.strokeStyle='#1D1842';ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x+Math.cos(an)*(r+8),a.y+Math.sin(an)*(r+8),5,0,7);ctx.fill();ctx.stroke()}
      if(a.s!=='H')for(let q=0;q<lp;q++){const an=spot(),px=-Math.sin(an)*4,py=Math.cos(an)*4,cx2=a.x+Math.cos(an)*(r+7),cy2=a.y+Math.sin(an)*(r+7);ctx.fillStyle='rgba(29,24,66,.55)';for(const s2 of[1,-1]){ctx.beginPath();ctx.arc(cx2+px*s2,cy2+py*s2,2.4,0,7);ctx.fill()}}}
    ctx.fillStyle='#7E8BB8';ctx.font='800 11px Nunito,system-ui';ctx.textAlign='left';ctx.textBaseline='bottom';
    if(A.length){if(W<620){ctx.fillText('Bond lengths to scale; atoms drawn bigger.',10,H-22);ctx.fillText('Drag empty space to turn a molecule.',10,H-8)}else ctx.fillText('Bond lengths to scale; atoms drawn bigger so you can grab them. Drag empty space to turn a molecule.',10,H-8)}
    else{ctx.font='900 18px Nunito,system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Add some atoms with the buttons above!',W/2,H/2)}}
  function molInfo(){const a=analysis(),cnt=a.counts;
    const m=a.match,tag=a.complete?(m?m.name:'Not in our molecule list'):'Still building';
    let note='';
    if(!a.complete){note=a.over.length?'Too many bonds on one atom.':a.open?`${a.open} open bonds left`:'';if(a.n&&a.pieces>1)note+=`${note?' · ':''}${a.pieces} separate pieces`}
    else if(!m)note='Every atom has its usual number of bonds, but this exact structure isn\'t one Atom Builder knows, so it can\'t say it\'s a real, stable molecule.'+(a.isomers.length?` It has the same atoms as ${a.isomers.map(x=>x.name.toLowerCase()).join(' and ')}, joined differently.`:'');
    else{const iso=S.LIB.filter(x=>x!==m&&S.formula(S.countOf(x.atoms))===a.formula);if(iso.length)note=`Same atoms as ${iso.map(x=>x.name.toLowerCase()).join(', ')}, but joined differently: the way atoms connect decides the molecule.`}
    const shape=a.complete?a.geo.filter(x=>x.shape).map(x=>`<div class="row txt"><b>${x.sym}</b>: ${x.shape}, about ${x.angle}° between bonds${x.lonePairs?` (${x.lonePairs} lone pair${x.lonePairs>1?'s':''} push${x.lonePairs>1?'':'es'} the bonds together)`:''}</div>`).join('')||'<div class="row txt">Two atoms in a line.</div>':'<div class="row txt">Finish the molecule to see its shape.</div>';
    const bl=a.complete?[...new Set(asIdx().bonds.map(([i,j,o])=>{const s1=mol.atoms[i].s,s2=mol.atoms[j].s,[x,y]=[s1,s2].sort((u,v)=>u==='C'?-1:v==='C'?1:u==='H'?1:v==='H'?-1:u.localeCompare(v));return `${x}${o===1?'–':o===2?'=':'≡'}${y} ${S.bondPm(s1,s2,o)} pm`}))].join(' · '):'';
    const sp=m&&S.speciesOfLib(m.key);
    pn.innerHTML=`<div class="fx big hot"><span class="tag">${tag}</span><div class="row">${a.formulaHtml||'—'}</div>${note?`<div class="row note">${note}</div>`:''}</div>
      <div class="fx"><span class="tag">Bonds each atom wants</span><div class="row">H → 1 &nbsp; O → 2 &nbsp; N → 3 &nbsp; C → 4 &nbsp; Cl → 1</div><div class="row note">Drag from one atom to another to share electrons. Drag again for a double bond. Tap an atom to undo a bond. Flick it off the edge to remove it.</div></div>
      <div class="fx"><span class="tag">Shape</span>${shape}${bl?`<div class="row note">${bl}</div>`:''}<div class="row note">Electron pairs push each other as far apart as they can (VSEPR). Lengths are typical measured values.</div></div>
      <div class="fx"><span class="tag">Molecule mass</span><div class="row">${Object.entries(cnt).map(([s,c])=>`${c} × ${Math.round(EL[elOf(s)][2])}`).join(' + ')||'0'} = <span class="num">${a.nominal}</span> u</div>${a.n?`<div class="row note">With exact atomic masses: ${fmt(a.molar,2)} u</div>`:''}</div>
      <div class="fx"><span class="tag">Molecules found ${mfound.size}/${S.TARGETS.length}</span><div class="molgrid">${S.TARGETS.map(q=>`<span class="txt">${mfound.has(q.key)?'✅ '+q.key+' '+q.name:'⬜ ???'}</span>`).join('')}</div>${extra.size?`<div class="row note">Bonus: ${[...extra].map(k=>S.LIB.find(x=>x.key===k).name).join(', ')}</div>`:''}</div>
      <div class="fx"><span class="tag">Reactions</span><div class="row txt">${sp?`${m.name} can go into the reaction chamber: press ⚗️ Send to reactions.`:m?`${m.name} has no reactions in this lab yet.`:'Finish a molecule Atom Builder knows, then send it to the reaction chamber.'}</div>${Object.keys(inv).length?`<div class="row note">In your chamber kit: ${Object.entries(inv).map(([k,c])=>`${c} ${S.SPECIES[k].f}`).join(', ')}</div>`:''}</div>`;
    if(a.complete&&m){if(m.target&&!mfound.has(m.key)){mfound.add(m.key);win(stage,null,null,m.key);molInfo()}else if(!m.target&&!extra.has(m.key)){extra.add(m.key);tone(660,.1,'triangle');tone(990,.15,'triangle',.15,.08);ui.hint(`${m.name}! A real molecule (not on the list, but a nice find).`);molInfo()}}}

  /* ================= REACTION MODE ================= */
  function newChamber(keep){if(!keep)paused=false;seenEv=0;flashes=[];
    if(xp==='free'){ch=S.chamber({seed:1,T:298});for(const[k,c]of Object.entries(inv))ch.add(k,c);ch.mark()}
    else ch=S.setup(S.EXPERIMENTS.find(x=>x.id===xp));
    if(mode==='rx')exUI()}
  /* where the simulation box sits on screen. On a tall screen the box is drawn on its side (x and y swapped) so it fills
     the space; the gas inside doesn't care which way up it is. */
  const box=()=>{const W=dims.w,H=dims.h,rot=H>W*1.15,bw=rot?S.BOX.h:S.BOX.w,bh=rot?S.BOX.w:S.BOX.h,s=Math.min((W-16)/bw,(H-16)/bh),ox=(W-bw*s)/2,oy=(H-bh*s)/2;
    return{s,rot,ox,oy,w:bw*s,h:bh*s,X:(x,y)=>ox+(rot?y:x)*s,Y:(x,y)=>oy+(rot?x:y)*s,sim:(px,py)=>rot?{x:(py-oy)/s,y:(px-ox)/s}:{x:(px-ox)/s,y:(py-oy)/s}}};
  function sparkAt(x,y){ch.spark(x,y);noise(.25,2400,1,.18,0,600);tone(1200,.08,'triangle',.12);if(paused)ui.hint('The chamber is paused. Press ▶️ Play to see what happens.');info()}
  /* drawings of each molecule: the real relaxed 3-D shape, seen from its widest side */
  function templates(){const out={},r=S.rng(5);
    for(const sp of Object.values(S.SPECIES)){if(!sp.lm){out[sp.key]=null;continue}const m=sp.lm,cs=S.shapeConstraints(m.atoms,m.bonds),pts=m.atoms.map(()=>({x:r()*100,y:r()*100,z:r()*100}));
      for(let i=0;i<300;i++)S.relax(pts,cs,1,4);
      const c=[0,1,2].map(k=>pts.reduce((s,q)=>s+[q.x,q.y,q.z][k],0)/pts.length),P=pts.map(q=>[q.x-c[0],q.y-c[1],q.z-c[2]]);
      const cov=[0,1,2].map(i=>[0,1,2].map(j=>P.reduce((s,q)=>s+q[i]*q[j],0)));
      const eig=(skip)=>{let v=[.6,.5,.4];for(let it=0;it<60;it++){let w=[0,1,2].map(i=>cov[i][0]*v[0]+cov[i][1]*v[1]+cov[i][2]*v[2]);if(skip){const d=w[0]*skip[0]+w[1]*skip[1]+w[2]*skip[2];w=w.map((x,i)=>x-d*skip[i])}const L=Math.hypot(...w)||1;v=w.map(x=>x/L)}return v};
      const e1=eig(),e2=eig(e1),xy=P.map(q=>[q[0]*e1[0]+q[1]*e1[1]+q[2]*e1[2],q[0]*e2[0]+q[1]*e2[1]+q[2]*e2[2]]);
      const ext=Math.max(1,...xy.map(([x,y])=>Math.hypot(x,y))),k=sp.r*.55/ext;
      out[sp.key]={atoms:m.atoms.map((s,i)=>({s,x:xy[i][0]*k,y:xy[i][1]*k,r:sp.r*(s==='H'?.3:s==='Cl'?.5:.42)*(m.atoms.length===1?1.6:1)})),bonds:m.bonds}}
    return out}
  function drawRx(){const W=dims.w,H=dims.h;ctx.fillStyle='#0E0B26';ctx.fillRect(0,0,W,H);if(!ch)newChamber();if(!tmpl)tmpl=templates();
    const B=box(),{s,ox,oy}=B,st=ch.state,T=st.T;
    // the chamber: its colour shows the gas temperature
    const heat=clamp((T-300)/1700,0,1);ctx.fillStyle=`rgb(${Math.round(lerp(236,255,heat))},${Math.round(lerp(242,140,heat))},${Math.round(lerp(255,60,heat))})`;
    ctx.fillRect(ox,oy,B.w,B.h);
    if(st.light){const gr=ctx.createLinearGradient(0,oy,0,oy+B.h*.6);gr.addColorStop(0,'rgba(255,240,140,.55)');gr.addColorStop(1,'rgba(255,240,140,0)');ctx.fillStyle=gr;ctx.fillRect(ox,oy,B.w,B.h*.6)}
    if(st.catalyst){ctx.fillStyle='rgba(120,120,140,.35)';ctx.fillRect(ox,oy+B.h-6,B.w,6);ctx.fillStyle='#4A4A63';ctx.font='800 10px Nunito,system-ui';ctx.textAlign='left';ctx.textBaseline='bottom';ctx.fillText('catalyst',ox+6,oy+B.h-8)}
    ctx.strokeStyle='#1D1842';ctx.lineWidth=4;ctx.strokeRect(ox,oy,B.w,B.h);
    // new events from the simulation → short flashes (drawing only; the simulation already happened)
    for(const ev of st.events){if(ev.t<=seenEv)continue;flashes.push({...ev,age:0});if(ev.k==='rx'){tone(ev.heat>400?220:520,.12,'sine',.08);if(ev.heat>400)noise(.2,700,.7,.08)}}
    if(st.events.length)seenEv=Math.max(seenEv,st.events[st.events.length-1].t);
    for(const p0 of st.parts){const tp=tmpl[p0.s],x=B.X(p0.x,p0.y),y=B.Y(p0.x,p0.y);
      const kt=S.SPECIES[p0.s].M*((p0.vx/S.KAPPA)**2+(p0.vy/S.KAPPA)**2)/2/S.R;   /* this molecule's own kinetic temperature */
      if(kt>1500&&!p0.stuck){ctx.fillStyle=`rgba(255,140,40,${clamp((kt-1500)/6000,.15,.6)})`;ctx.beginPath();ctx.arc(x,y,(p0.r+6)*s,0,7);ctx.fill()}
      if(!tp){/* salt speck */ctx.fillStyle='#FFFFFF';ctx.strokeStyle='#8E8AA8';ctx.lineWidth=1.5;const q=p0.r*s*.85;ctx.save();ctx.translate(x,y);ctx.rotate(p0.ang*.2);ctx.fillRect(-q,-q,2*q,2*q);ctx.strokeRect(-q,-q,2*q,2*q);ctx.restore();continue}
      const ca=Math.cos(p0.ang),sa=Math.sin(p0.ang),pt=a=>[x+(a.x*ca-a.y*sa)*s,y+(a.x*sa+a.y*ca)*s];
      ctx.strokeStyle='#1D1842';ctx.lineWidth=Math.max(1.5,3*s);for(const[i,j]of tp.bonds){const A=pt(tp.atoms[i]),B=pt(tp.atoms[j]);ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke()}
      for(const a of tp.atoms){const[ax,ay]=pt(a);ctx.fillStyle=EL[S.zOf(a.s)][3];ctx.lineWidth=Math.max(1,1.6*s);ctx.beginPath();ctx.arc(ax,ay,a.r*s,0,7);ctx.fill();ctx.stroke()}}
    for(let i=flashes.length-1;i>=0;i--){const f=flashes[i];f.age+=1/60;if(f.age>.9){flashes.splice(i,1);continue}const x=B.X(f.x,f.y),y=B.Y(f.x,f.y),k=f.age/.9;
      if(f.k==='spark'){ctx.strokeStyle=`rgba(255,200,61,${1-k})`;ctx.lineWidth=3;for(let r=0;r<8;r++){const a=r/8*6.283;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*10,y+Math.sin(a)*10);ctx.lineTo(x+Math.cos(a)*(18+50*k),y+Math.sin(a)*(18+50*k));ctx.stroke()}}
      else{ctx.strokeStyle=f.heat>0?`rgba(255,120,40,${1-k})`:`rgba(60,140,255,${1-k})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,(12+60*k)*s+4,0,7);ctx.stroke();
        ctx.fillStyle=`rgba(29,24,66,${1-k})`;ctx.font='900 13px Nunito,system-ui';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(`${f.heat>0?'+':''}${Math.round(f.heat)} J`,x,y-14-20*k)}}
    // readouts
    ctx.fillStyle='rgba(14,11,38,.78)';ctx.fillRect(ox+6,oy+6,190,44);ctx.fillStyle='#fff';ctx.font='900 16px Nunito,system-ui';ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText(`🌡️ ${Math.round(T)} K (${Math.round(T-273.15)} °C)`,ox+14,oy+10);ctx.font='800 11px Nunito,system-ui';ctx.fillStyle='rgba(255,255,255,.75)';ctx.fillText(`heater ${st.Tset} K · ${st.t.toFixed(1)} s${paused?' · PAUSED':''}`,ox+14,oy+31);
    if(!st.parts.length){ctx.fillStyle='#1D1842';ctx.font='900 16px Nunito,system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(xp==='free'?'Your chamber is empty. Build a molecule and press ⚗️ Send,':'Empty chamber.',W/2,H/2-10);if(xp==='free')ctx.fillText('or pick an experiment above.',W/2,H/2+12)}
    if(paused){ctx.fillStyle='rgba(14,11,38,.65)';ctx.font='900 30px Nunito,system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('⏸',ox+B.w-30,oy+30)}}
  function rxInfo(){if(!ch)newChamber();const st=ch.state,c=ch.counts(),exp=S.EXPERIMENTS.find(x=>x.id===xp),start=st.startAtoms,nowA=ch.atoms();
    const els=[...new Set([...Object.keys(start),...Object.keys(nowA)])].sort();
    const lines=S.explain(ch),focus=exp?S.REACTIONS.find(r=>r.id===exp.focus):lastRx();
    const hist=st.history,hmax=Math.max(600,...hist.map(h=>h[1]));
    const spark=hist.length>1?`<svg viewBox="0 0 200 40" width="200" height="40" aria-label="temperature over time" style="display:block"><polyline fill="none" stroke="#E8384F" stroke-width="2" points="${hist.map((h,i)=>`${(i/(hist.length-1)*198+1).toFixed(1)},${(38-h[1]/hmax*36).toFixed(1)}`).join(' ')}"/></svg>`:'';
    const dE=ch.energyTotal()-st.startEnergy;
    pn.innerHTML=`<div class="fx big hot"><span class="tag">${exp?exp.name.replace(/^\S+\s/,''):'My molecules'}</span><div class="row txt">${exp?exp.goal:Object.keys(inv).length?'The molecules you sent from the builder. Spark them, heat them, add a catalyst or light.':'Nothing here yet. Build molecules in 🧬 Molecules and send them here.'}</div>
        <div class="row">${Object.entries(c).map(([k,v])=>`${v} ${S.SPECIES[k].f}`).join(' · ')||'—'}</div><div class="row note">🌡️ ${Math.round(st.T)} K · catalyst ${st.catalyst?'on':'off'} · light ${st.light?'on':'off'}${paused?' · paused':''}</div></div>
      <div class="fx"><span class="tag">What happened</span>${lines.length?lines.map(l=>`<div class="row txt">${l}</div>`).join(''):'<div class="row txt">Nothing yet. The molecules are just bouncing around.</div>'}<div class="row note">Worked out from this run: every bump, its energy, and every reaction.</div></div>
      <div class="fx"><span class="tag">Atoms in = atoms out</span><div class="row txt">${els.map(k=>`${k}: ${start[k]||0} → ${nowA[k]||0} ${(start[k]||0)===(nowA[k]||0)?'✅':'❌'}`).join(' &nbsp; ')}</div><div class="row txt">Electric charge: ${st.startCharge} → ${ch.charge()} ${st.startCharge===ch.charge()?'✅':'❌'}</div><div class="row note">Reactions only rearrange atoms. None are made or destroyed.</div></div>
      <div class="fx"><span class="tag">Energy</span><div class="row txt">Chemical energy changed by ${fmt(ch.chemEnergy()-sumStart(),0)} J · sparks added ${fmt(st.ledger.sparkIn,0)} J · ${st.ledger.wallOut>=0?`${fmt(st.ledger.wallOut,0)} J of heat left through the walls`:`the heater added ${fmt(-st.ledger.wallOut,0)} J`}</div>
        <div class="row txt">Energy lost or made from nothing: ${fmt(Math.abs(dE)<.005?0:dE,2)} J ${Math.abs(dE)<.01?'✅':'❌'}</div>${spark?`<div class="row">${spark}</div>`:''}${focus?diagram(focus):''}</div>
      <div class="fx"><span class="tag">Reactions this lab knows</span>${S.REACTIONS.map(r=>`<div class="row txt">${S.equation(r)} &nbsp;<span class="note">ΔH = ${fmt(r.dH,1)} kJ · ${r.how==='heat'?'needs a spark or heat':r.how==='catalyst'?'needs a catalyst':r.how==='light'?'needs light':'no trigger needed'}</span></div>`).join('')}<div class="row note">Anything else just bounces: the lab never makes up a product.</div></div>
      <div class="fx"><span class="tag">How the model works</span><div class="row txt">Each molecule in the box stands for a millimole. Speeds follow the real temperature (light molecules move faster). A bump only causes a reaction if it is hard enough to get over the energy barrier.</div><div class="row note">Barriers here are model values, much lower than the real ones, so you can see reactions in seconds. Heat values (ΔH) are real.</div></div>`}
  function sumStart(){let t=0;for(const[k,v]of Object.entries(ch.state.startCounts))t+=v*S.SPECIES[k].dHf;return t}
  function lastRx(){const ev=ch.state.events.filter(x=>x.k==='rx').pop();return ev?S.REACTIONS.find(r=>r.id===ev.id):null}
  /* energy diagram: reactants, the (model) barrier, products at their real ΔH */
  function diagram(rx){const Ea=ch.barrier(rx),dh=rx.dH,top=Math.max(Ea,0),bot=Math.min(dh,0),span=top-bot||1,y=v=>8+(top-v)/span*84;
    return `<div class="row note">${rx.name}</div><svg viewBox="0 0 260 110" width="260" height="110" aria-label="energy diagram" style="display:block;max-width:100%">
      <path d="M10 ${y(0)} H70 C100 ${y(0)} 105 ${y(Ea)} 125 ${y(Ea)} C145 ${y(Ea)} 150 ${y(dh)} 180 ${y(dh)} H250" fill="none" stroke="#1D1842" stroke-width="3"/>
      <text x="12" y="${y(0)-4}" font-size="10" font-weight="800" fill="#1D1842">reactants</text><text x="186" y="${y(dh)-4}" font-size="10" font-weight="800" fill="#1D1842">products</text>
      <text x="128" y="${Math.max(10,y(Ea)-4)}" font-size="10" font-weight="800" fill="#9A5BFF" text-anchor="middle">barrier ${Math.round(Ea)} kJ/mol (model)</text>
      <text x="250" y="${Math.min(106,(y(0)+y(dh))/2)}" font-size="10" font-weight="800" fill="#E8384F" text-anchor="end">ΔH = ${fmt(dh,1)} kJ</text></svg>`}

  /* ================= shared ================= */
  let infoAt=0;
  function info(){infoAt=frame;if(mode==='atom')atomInfo();else if(mode==='mol')molInfo();else rxInfo()}
  fingers(cv,{
    down(f){if(mode==='atom')atomDown(f);else if(mode==='mol')molDown(f);
      else if(ch){const{x,y}=box().sim(f.x,f.y);if(x>=0&&y>=0&&x<=S.BOX.w&&y<=S.BOX.h)sparkAt(x,y)}},
    move(f){if(mode==='atom'){if(grab){grab.x=f.x;grab.y=f.y}}else if(mode==='mol')molMove(f)},
    up(f){if(mode==='atom')atomUp(f);else if(mode==='mol')molUp(f)}});
  function resize(){dims=fitCanvas(cv)}const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  exUI();info();
  kbPointer(g,cv);
  g.key(ev=>{const k=ev.key.toLowerCase();
    if(mode==='atom'){if(k==='v'){stage.querySelector('[data-a="view"]').click();return true}const m={p:'p',n:'n',e:'e'}[k];if(m){stage.querySelector(`[data-a="${m}${ev.shiftKey?'-':'+'}"]`).click();return true}return false}
    if(mode==='mol'){const at={h:'H',c:'C',n:'N',o:'O',l:'Cl'}[k];if(at){stage.querySelector(`[data-add="${at}"]`).click();return true}return false}
    const act={s:'spark',r:'reset',p:'pause','+':'hot','=':'hot','-':'cold'}[k];if(act){stage.querySelector(`[data-a="${act}"]`).click();return true}
    if(k==='c'){stage.querySelector('[data-cat]').click();return true}if(k==='l'){stage.querySelector('[data-light]').click();return true}return false});
  ui.hint('Drag protons, neutrons and electrons onto the atom (or use the buttons). The number of protons picks the element!',5000);
  g.loop(dt=>{frame++;ctx.setTransform(dims.d,0,0,dims.d,0,0);
    if(mode==='rx'&&ch&&!paused)ch.step(dt/1000);
    mode==='atom'?drawAtom():mode==='mol'?drawMol():drawRx();
    if(mode==='rx'&&frame-infoAt>=15)info()});
  GAMES.atoms._debug={set(P,N,E){p=P;n=N;e=E;info()},get mol(){return mol},info,setMode(m){stage.querySelector(`[data-am="${m}"]`).click()},
    bond(i,j,o=1){mol.bonds.push({a:mol.atoms[i],b:mol.atoms[j],o});molVer++;info()},add(s){stage.querySelector(`[data-add="${s}"]`).click()},
    get atom(){return{p,n,e,view}},get found(){return[...found]},atomGeo:()=>{const G=atomGeo();return{...G,shellR:undefined,shells:[0,1,2,3].map(G.shellR)}},nucleons:()=>nucleons(atomGeo()),
    get mfound(){return[...mfound]},get extra(){return[...extra]},get inv(){return{...inv}},send,
    get chamber(){return ch},get xp(){return xp},get paused(){return paused},box,sci:S};
}}});
