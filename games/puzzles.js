/* ============================================================
   PUZZLE BOX — Tower of Hanoi, Lights Out, Binary, Sudoku
   ============================================================ */
Object.assign(GAMES,{puzzles:{title:'Puzzle Box',icon:'🧠',c:'var(--grape)',age:'6+',section:'think',order:2,blurb:'Towers, lights, binary and number grids.',
init(stage,g){
  let mode='hanoi';
  const ui=labShell(stage,{label:'Puzzle',top:`${chips('pz',[['hanoi','🗼 Tower'],['lights','💡 Lights out'],['binary','🔢 Binary'],['sudoku','🔲 Number grid']],'hanoi')}<span class="sep"></span><span id="ex" class="pbar"></span>`,panel:'<div id="pn"></div>'});
  const {cv,panel,area}=ui;cv.hidden=true;area.insertAdjacentHTML('beforeend','<div class="pzl" id="pz"></div>');const pz=area.querySelector('#pz'),pn=panel.querySelector('#pn'),ex=stage.querySelector('#ex');
  const COL=['#FF4F5E','#FF8A2B','#FFC83D','#24C786','#18BFD6','#3E67F0','#9A5BFF','#FF7FC8'];
  /* ---------- Tower of Hanoi ---------- */
  const H={n:3,pegs:[[],[],[]],held:null,moves:0,done:false};
  function hanoiNew(n=H.n){H.n=n;H.pegs=[[...Array(n)].map((_,i)=>n-i),[],[]];H.held=null;H.moves=0;H.done=false;hanoi()}
  function hanoi(){const min=2**H.n-1;
    ex.innerHTML=[3,4,5,6,7].map(n=>`<button class="opt ${n===H.n?'on':''}" data-hn="${n}">${n} disks</button>`).join('');
    pz.innerHTML=`<div class="hanoi" style="--n:${H.n}">${H.pegs.map((p,i)=>`<button class="peg ${H.held&&H.held.from===i?'from':''}" data-peg="${i}"><span class="pole"></span>${p.map((d,k)=>`<span class="disk ${H.held&&H.held.from===i&&k===p.length-1?'lift':''}" style="--w:${30+d*(60/H.n)}%;--c:${COL[d-1]}">${d}</span>`).join('')}</button>`).join('')}</div>`;
    patchPanel(pn,`<div class="fx big hot"><span class="tag">Moves</span><div class="row"><span class="num">${H.moves}</span> &nbsp;<span class="note">fewest possible: ${min}</span></div></div>
      <div class="fx"><span class="tag">Fewest moves</span><div class="row">2<sup>${V('n','#9A5BFF')}</sup> − 1 = 2<sup>${H.n}</sup> − 1 = <span class="num">${min}</span></div><div class="row note">${[1,2,3,4,5,6,7].map(n=>`${n} → ${2**n-1}`).join(' · ')}</div></div>
      <div class="fx"><span class="tag">Rules</span><div class="row">Move the whole tower to the right peg. Never put a big disk on a small one.</div></div>
      <div class="fx"><span class="tag">The secret (recursion)</span><div class="row">To move ${V('n','#9A5BFF')} disks: move ${V('n','#9A5BFF')}−1 out of the way, move the big one, then move ${V('n','#9A5BFF')}−1 back on top.</div></div>`)}
  /* ---------- Lights Out ---------- */
  const LO={n:3,b:[],moves:0,pressed:[],done:false};
  function lightsNew(n=LO.n){LO.n=n;LO.b=Array(n*n).fill(0);LO.pressed=Array(n*n).fill(0);LO.moves=0;LO.done=false;const k=n===3?rint(2,4):rint(4,9);for(let i=0;i<k;i++)press(rint(0,n*n-1),true);LO.pressed.fill(0);if(LO.b.every(v=>!v))lightsNew(n);else lights()}
  function press(i,silent){const n=LO.n,x=i%n,y=(i/n)|0;for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<n&&Y<n)LO.b[Y*n+X]^=1}if(!silent){LO.moves++;LO.pressed[i]^=1}}
  function lights(){const on=LO.b.filter(Boolean).length;ex.innerHTML=[3,4,5].map(n=>`<button class="opt ${n===LO.n?'on':''}" data-ln="${n}">${n} × ${n}</button>`).join('');
    pz.innerHTML=`<div class="lgrid" style="--n:${LO.n}">${LO.b.map((v,i)=>`<button class="lamp ${v?'on':''}" data-lamp="${i}"></button>`).join('')}</div>`;
    patchPanel(pn,`<div class="fx big hot"><span class="tag">Lights still on</span><div class="row"><span class="num">${on}</span> &nbsp;<span class="note">${LO.moves} presses</span></div></div>
      <div class="fx"><span class="tag">How it works</span><div class="row">Each press flips a light and its four neighbors.</div></div>
      <div class="fx"><span class="tag">Clever fact</span><div class="row">Pressing twice = not pressing.</div><div class="row">on + 1 + 1 = on</div><div class="row note">So order never matters. Only which buttons you press an odd number of times.</div></div>
      <div class="fx"><span class="tag">Possible boards</span><div class="row">2<sup>${LO.n*LO.n}</sup> = <span class="num">${(2**(LO.n*LO.n)).toLocaleString('en-US')}</span></div></div>`);
    if(on===0&&!LO.done){LO.done=true;win(stage,null,null,'Lights out!');g.later(()=>{if(mode==='lights'&&LO.done)lightsNew()},2400)}}
  /* ---------- Binary ---------- */
  const BI={bits:Array(8).fill(0),target:0,lvl:0,done:false};
  function binNew(){const mx=BI.lvl<3?15:BI.lvl<6?63:255;BI.target=rint(1,mx);BI.bits.fill(0);BI.done=false;binary()}
  function binary(){const v=BI.bits.reduce((s,b,i)=>s+(b<<(7-i)),0),used=BI.lvl<3?4:BI.lvl<6?6:8;ex.innerHTML=`<button class="pbtn small" id="bnew">🎲 New number</button>`;
    pz.innerHTML=`<div class="bintarget">Make <b>${BI.target}</b></div><div class="bins" style="--u:${used}">${BI.bits.map((b,i)=>{const w=2**(7-i);return i<8-used?'':`<button class="bit ${b?'on':''}" data-bit="${i}"><span class="bv">${w}</span><span class="bb">${b}</span></button>`}).join('')}</div>
      <div class="bintarget sm">${v===BI.target?'✅ ':''}Now: <b>${v}</b></div>`;
    patchPanel(pn,`<div class="fx big hot"><span class="tag">In binary</span><div class="row"><span class="num">${BI.bits.slice(8-used).join('')}</span><sub>2</sub> = <span class="num">${v}</span><sub>10</sub></div><div class="row note">Read it like any number: the biggest place is on the left.</div></div>
      <div class="fx"><span class="tag">Add up the lit bulbs</span><div class="row">${BI.bits.map((b,i)=>b?2**(7-i):null).filter(Boolean).join(' + ')||'0'} = <span class="num">${v}</span></div></div>
      <div class="fx"><span class="tag">Each bulb is double</span><div class="row">2<sup>0</sup>=1, 2<sup>1</sup>=2, 2<sup>2</sup>=4 … 2<sup>7</sup>=128</div><div class="row note">Computers store every number, picture and song with only 0s and 1s.</div></div>
      <div class="fx"><span class="tag">Biggest number</span><div class="row">${used} bulbs: 2<sup>${used}</sup> − 1 = <span class="num">${2**used-1}</span></div></div>`);
    if(v===BI.target&&!BI.done){BI.done=true;BI.lvl++;win(stage,null,null,`${BI.target} = ${BI.bits.slice(8-used).join('')}`);g.later(()=>{if(mode==='binary'&&BI.done)binNew()},2200)}}
  /* ---------- Sudoku 4×4 and 6×6 ---------- */
  const SU={n:4,sol:[],grid:[],fixed:[],sel:null,done:false};
  function suNew(n=SU.n){SU.n=n;const bw=n===4?2:3,bh=2;let base=[...Array(n)].map((_,r)=>[...Array(n)].map((_,c)=>((r%bh)*bw+Math.floor(r/bh)+c)%n+1));
    const perm=shuffle([...Array(n)].map((_,i)=>i+1));base=base.map(r=>r.map(v=>perm[v-1]));
    const band=k=>shuffle([...Array(k)].map((_,i)=>i));const rows=[].concat(...band(n/bh).map(b=>band(bh).map(r=>b*bh+r))),cols=[].concat(...band(n/bw).map(b=>band(bw).map(c=>b*bw+c)));
    SU.sol=rows.map(r=>cols.map(c=>base[r][c]));SU.grid=SU.sol.map(r=>r.slice());const holes=n===4?rint(7,10):rint(16,20);
    let k=0;for(const i of shuffle([...Array(n*n).keys()])){if(k>=holes)break;const r=(i/n)|0,c=i%n,keep=SU.grid[r][c];SU.grid[r][c]=0;if(countSol(SU.grid.map(x=>x.slice()),2)!==1)SU.grid[r][c]=keep;else k++}
    SU.fixed=SU.grid.map(r=>r.map(v=>!!v));SU.sel=null;SU.done=false;sudoku()}
  function ok(G,r,c,v){const n=SU.n,bw=n===4?2:3,bh=2;for(let i=0;i<n;i++)if(G[r][i]===v||G[i][c]===v)return false;const r0=r-r%bh,c0=c-c%bw;for(let y=r0;y<r0+bh;y++)for(let x=c0;x<c0+bw;x++)if(G[y][x]===v)return false;return true}
  function countSol(G,lim){const n=SU.n;for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!G[r][c]){let s=0;for(let v=1;v<=n;v++)if(ok(G,r,c,v)){G[r][c]=v;s+=countSol(G,lim-s);G[r][c]=0;if(s>=lim)return s}return s}return 1}
  function sudoku(){const n=SU.n,bw=n===4?2:3,bh=2;ex.innerHTML=`<button class="opt ${n===4?'on':''}" data-sn="4">4 × 4</button><button class="opt ${n===6?'on':''}" data-sn="6">6 × 6</button>`;
    const clash=(r,c)=>{const v=SU.grid[r][c];if(!v)return false;SU.grid[r][c]=0;const bad=!ok(SU.grid,r,c,v);SU.grid[r][c]=v;return bad};
    pz.innerHTML=`<div class="sgrid" style="--n:${n}">${SU.grid.map((row,r)=>row.map((v,c)=>`<button class="sc ${SU.fixed[r][c]?'fx2':''} ${SU.sel&&SU.sel[0]===r&&SU.sel[1]===c?'sel':''} ${clash(r,c)?'bad':''} ${c%bw===bw-1&&c<n-1?'br':''} ${r%bh===bh-1&&r<n-1?'bb':''}" data-sc="${r},${c}" style="${v?`--c:${COL[v-1]}`:''}">${v||''}</button>`).join('')).join('')}</div>
      <div class="spad">${[...Array(n)].map((_,i)=>`<button class="sp" data-sv="${i+1}" style="--c:${COL[i]}">${i+1}</button>`).join('')}<button class="sp" data-sv="0">⌫</button></div>`;
    const empty=SU.grid.flat().filter(v=>!v).length;
    patchPanel(pn,`<div class="fx big hot"><span class="tag">Empty squares</span><div class="row"><span class="num">${empty}</span></div></div>
      <div class="fx"><span class="tag">Rules</span><div class="row">Every row, every column and every box has 1 to ${n} exactly once.</div></div>
      <div class="fx"><span class="tag">Think like a detective</span><div class="row">Find a square where only one number can fit. Rule out, then fill in.</div></div>
      <div class="fx"><span class="tag">Every row adds to</span><div class="row">1 + 2 + … + ${n} = ${frac(`${n} × ${n+1}`,'2')} = <span class="num">${n*(n+1)/2}</span></div></div>`);
    if(!empty&&!SU.done&&SU.grid.every((row,r)=>row.every((v,c)=>!clash(r,c)))){SU.done=true;win(stage,null,null,'Solved!');g.later(()=>{if(mode==='sudoku'&&SU.done)suNew()},2600)}}
  /* ---------- events ---------- */
  pz.addEventListener('click',e=>{const t=e.target;
    const peg=t.closest('[data-peg]');if(peg&&mode==='hanoi'&&!H.done){const i=+peg.dataset.peg,p=H.pegs[i];
      if(!H.held){if(p.length){H.held={from:i};tone(500+p[p.length-1]*40,.06,'triangle')}}
      else{const fromP=H.pegs[H.held.from],d=fromP[fromP.length-1];if(i===H.held.from){H.held=null}else if(p.length&&p[p.length-1]<d){buzz();shakeEl(peg);ui.hint('A big disk cannot go on a smaller one!')}else{p.push(fromP.pop());H.moves++;H.held=null;tone(400+d*60,.1,'triangle',.15)}}
      if(H.pegs[2].length===H.n){H.done=true;const best=H.moves===2**H.n-1;g.later(()=>{win(stage,null,null,best?'Fewest moves!':'Tower moved!');if(best)addStar()},250)}hanoi();return}
    const lamp=t.closest('[data-lamp]');if(lamp&&!LO.done){press(+lamp.dataset.lamp);tone(LO.b[+lamp.dataset.lamp]?800:400,.06,'square',.05);lights();return}
    const bit=t.closest('[data-bit]');if(bit&&!BI.done){const i=+bit.dataset.bit;BI.bits[i]^=1;tone(BI.bits[i]?300+(8-i)*80:200,.07,'square',.05);binary();return}
    const sc=t.closest('[data-sc]');if(sc){const[r,c]=sc.dataset.sc.split(',').map(Number);if(!SU.fixed[r][c]){SU.sel=[r,c];tone(600,.04,'sine');sudoku()}return}
    const sv=t.closest('[data-sv]');if(sv&&SU.sel&&!SU.done){const[r,c]=SU.sel,v=+sv.dataset.sv;SU.grid[r][c]=v;tone(v?400+v*60:250,.08,'triangle');sudoku()}});
  ex.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;tone(560,.07,'triangle');
    if(t.dataset.hn)hanoiNew(+t.dataset.hn);if(t.dataset.ln)lightsNew(+t.dataset.ln);if(t.id==='bnew')binNew();if(t.dataset.sn)suNew(+t.dataset.sn)});
  bindChips(ui.top,'pz',m=>{mode=m;({hanoi:()=>hanoiNew(),lights:()=>lightsNew(),binary:binNew,sudoku:()=>suNew()})[m]();ui.hint({hanoi:'Move the tower to the right peg, one disk at a time!',lights:'Tap a light. It flips itself and its neighbors. Turn them all off!',binary:'Tap the bulbs to turn them on. Add up the lit numbers to make the target!',sudoku:'Each row, column and box needs every number once. Tap a square, then a number.'}[m],4500,true)});
  hanoiNew(3);ui.hint('Move the tower to the right peg, one disk at a time!',4500);
  function gridNav(sel,n,k){const cells=[...pz.querySelectorAll(sel)],i=Math.max(0,cells.indexOf(document.activeElement)),r=(i/n)|0,c=i%n;
    const d={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]}[k];if(!d)return false;const nr=clamp(r+d[0],0,n-1),nc=clamp(c+d[1],0,n-1);cells[nr*n+nc]?.focus();return true}
  g.key(e=>{const k=e.key;
    if(mode==='hanoi'&&/^[1-3]$/.test(k)){pz.querySelector(`[data-peg="${+k-1}"]`).click();return true}
    if(mode==='lights'){if(gridNav('[data-lamp]',LO.n,k))return true}
    if(mode==='binary'&&/^[1-8]$/.test(k)){const b=pz.querySelector(`[data-bit="${8-+k}"]`);if(b){b.click();return true}}
    if(mode==='binary'&&k.toLowerCase()==='n'){ex.querySelector('#bnew').click();return true}
    if(mode==='sudoku'){if(gridNav('[data-sc]',SU.n,k)){const a=document.activeElement;if(a&&a.dataset.sc)a.click();setTimeout(()=>pz.querySelector('.sc.sel')?.focus(),0);return true}
      if(/^[1-6]$/.test(k)&&+k<=SU.n&&SU.sel){pz.querySelector(`[data-sv="${k}"]`).click();pz.querySelector('.sc.sel')?.focus();return true}
      if((k==='Backspace'||k==='Delete'||k==='0')&&SU.sel){pz.querySelector('[data-sv="0"]').click();pz.querySelector('.sc.sel')?.focus();return true}}
    return false});
  GAMES.puzzles._debug={H,LO,BI,SU,press,setMode(m){stage.querySelector(`[data-pz="${m}"]`).click()},countSol};
}}});
