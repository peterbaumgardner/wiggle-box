/* ============================================================
   NUMBER FORGE — combine number cards to hit the target
   ============================================================ */
Object.assign(GAMES,{forge:{title:'Number Forge',icon:'🔨',c:'var(--tang)',age:'6+',section:'math',order:5,blurb:'Smash numbers together to make the target.',
init(stage,g){
  const OPS={'+':(a,b)=>a+b,'−':(a,b)=>a-b,'×':(a,b)=>a*b,'÷':(a,b)=>b&&a%b===0?a/b:null,'^':(a,b)=>b<=6&&Math.abs(a)<=12?a**b:null};
  const PREC={'+':1,'−':1,'×':2,'÷':2,'^':3};
  let mode='climb',lvl=0,cards=[],target=0,sel=null,op=null,steps=[],hist=[],done=false,start=[],rid=0;
  const ui=labShell(stage,{label:'Forge',top:`${chips('fm',[['climb','🔨 Forge'],['24','🃏 Make 24']],'climb')}<span class="sep"></span><span class="lvl" id="lv"></span>
    <button class="pbtn small" id="undo">↩ Undo</button><button class="pbtn small" id="reset">↺ Start over</button><button class="pbtn small" id="hintb">💡 Hint</button><button class="pbtn small" id="next">➜ New</button>`,
    panel:`<div class="fx big hot"><span class="tag">Make this number</span><div class="row"><span class="num" id="tg" style="font-size:1.6em"></span></div></div>
      <div class="fx"><span class="tag">Your forging</span><div id="st"></div></div>
      <div class="fx"><span class="tag">All in one line</span><div class="row" id="one"><span class="note">…</span></div></div>
      <div class="fx"><span class="tag">Order of operations</span><div class="row">( ) first → ^ → × ÷ → + −</div><div class="row note">Brackets tell you what to do first.</div></div>`});
  const {cv,panel,area}=ui;cv.hidden=true;
  area.insertAdjacentHTML('beforeend',`<div class="forge"><div class="fcards" id="cards"></div><div class="fops" id="ops"></div></div>`);
  const cardsEl=area.querySelector('#cards'),opsEl=area.querySelector('#ops');
  function exprOf(c,parentPrec=0,right=false,parentOp=''){if(c.leaf)return String(c.v);const p=PREC[c.op],s=`${exprOf(c.a,p,false,c.op)} ${c.op} ${exprOf(c.b,p,true,c.op)}`;
    return p<parentPrec||(p===parentPrec&&right&&(parentOp==='−'||parentOp==='÷'||parentOp==='^'))||(c.op==='^'&&parentPrec===3&&!right)?`(${s})`:s}
  function solve(nums,goal,ops,all=true){const S=nums.map(v=>({v,leaf:true}));const res=[];
    const rec=arr=>{if(res.length)return;for(const c of arr)if(c.v===goal&&(!all||arr.length===1)){res.push(c);return}
      for(let i=0;i<arr.length;i++)for(let j=0;j<arr.length;j++){if(i===j)continue;for(const o of ops){const v=OPS[o](arr[i].v,arr[j].v);if(v===null||v<0||!Number.isInteger(v)||v>2000)continue;
        if((o==='+'||o==='×')&&i>j)continue;const rest=arr.filter((_,k)=>k!==i&&k!==j);rec([...rest,{v,op:o,a:arr[i],b:arr[j]}]);if(res.length)return}}};rec(S);return res[0]}
  function gen(){
    if(mode==='24'){let n;do{n=[...Array(4)].map(()=>rint(1,9))}while(!solve(n,24,['+','−','×','÷']));start=n;target=24}
    else{const k=lvl<3?2:lvl<7?3:4,ops=lvl<3?['+','−']:lvl<7?['+','−','×']:lvl<12?['+','−','×','÷']:['+','−','×','÷','^'];
      let n,t,ok;do{n=[...Array(k)].map(()=>rint(1,lvl<7?9:12));
        // random combination of the cards gives the target
        let arr=n.map(v=>({v,leaf:true}));while(arr.length>1){const i=rint(0,arr.length-1);let j=rint(0,arr.length-2);if(j>=i)j++;const o=pick(ops),v=OPS[o](arr[i].v,arr[j].v);if(v===null||v<0||v>200)continue;
          const c={v,op:o,a:arr[i],b:arr[j]};arr=arr.filter((_,x)=>x!==i&&x!==j);arr.push(c)}t=arr[0].v;ok=t>0&&!n.includes(t)}while(!ok);start=n;target=t}
    reset();stage.querySelector('#lv').textContent=mode==='24'?'Make 24':`Level ${lvl+1}`;panel.querySelector('#tg').textContent=target}
  function reset(){cards=start.map((v,i)=>({v,leaf:true,id:i}));steps=[];hist=[];sel=null;op=null;done=false;rid++;render()}
  function opsFor(){return mode==='24'?['+','−','×','÷']:lvl<3?['+','−']:lvl<7?['+','−','×']:lvl<12?['+','−','×','÷']:['+','−','×','÷','^']}
  function render(){
    cardsEl.innerHTML=cards.map((c,i)=>`<button class="fcard ${sel===i?'sel':''} ${c.v===target?'goal':''} ${c.leaf?'':'made'}" data-i="${i}"><span>${c.v}</span>${c.leaf?'':`<small>${exprOf(c)}</small>`}</button>`).join('');
    opsEl.innerHTML=opsFor().map(o=>`<button class="fop ${op===o?'sel':''}" data-o="${o}">${o==='^'?'xʸ':o}</button>`).join('');
    panel.querySelector('#st').innerHTML=steps.length?steps.map(s=>`<div class="row">${s}</div>`).join(''):'<div class="row note">Tap a number, a sign, then another number.</div>';
    const best=cards.find(c=>c.v===target&&!c.leaf)||(cards.length===1&&!cards[0].leaf?cards[0]:null);
    panel.querySelector('#one').innerHTML=best?`<span class="num">${exprOf(best)} = ${best.v}</span>`:'<span class="note">…</span>'}
  function combine(i,j){const a=cards[i],b=cards[j],v=OPS[op](a.v,b.v);
    if(v===null){buzz();ui.hint(op==='÷'?'That does not split evenly. Try another pair!':'That number gets too big!',3200,true);shakeEl(cardsEl.children[j]);sel=null;op=null;render();return}
    if(v<0){buzz();ui.hint('No negative numbers here. Try the other order!',3200,true);sel=null;op=null;render();return}
    hist.push(JSON.stringify(cards));const nc={v,op,a,b};cards=cards.filter((_,k)=>k!==i&&k!==j);cards.push(nc);steps.push(`<span class="num">${a.v} ${op==='^'?'^':op} ${b.v} = ${v}</span>`);
    sel=null;op=null;tone(300+Math.min(v,60)*12,.14,'triangle',.18);noise(.15,1800,1,.1);
    if(v===target&&!done){done=true;const all=cards.length===1,my=rid;g.later(()=>{if(my!==rid||!done)return;win(stage,null,null,all?'Used every number!':String(target));if(all&&mode!=='24')addStar();lvl++;g.later(()=>{if(my===rid)gen()},2400)},350)}
    render()}
  cardsEl.addEventListener('click',e=>{const b=e.target.closest('.fcard');if(!b||done)return;const i=+b.dataset.i;
    if(sel===null||op===null){sel=sel===i?null:i;op=null;tone(500,.06,'triangle')}else if(i!==sel)combine(sel,i);render()});
  opsEl.addEventListener('click',e=>{const b=e.target.closest('.fop');if(!b||sel===null)return ui.hint('Pick a number first!');op=b.dataset.o;tone(700,.06,'triangle');render()});
  stage.querySelector('#undo').addEventListener('click',()=>{const h=hist.pop();if(!h)return;cards=JSON.parse(h);steps.pop();sel=null;op=null;if(done){done=false;rid++}render();tone(400,.08,'triangle')});
  stage.querySelector('#reset').addEventListener('click',()=>{reset();tone(400,.08,'triangle')});
  stage.querySelector('#next').addEventListener('click',()=>{gen();tone(500,.08,'triangle')});
  stage.querySelector('#hintb').addEventListener('click',()=>{const s=solve(cards.map(c=>c.v),target,opsFor(),false);if(!s||s.leaf){ui.hint('Hmm, try Start over.');return}
    let c=s;while(!c.a.leaf||!c.b.leaf){c=!c.a.leaf?c.a:c.b}ui.hint(`Try ${c.a.v} ${c.op} ${c.b.v}`,4000);tone(880,.1,'sine')});
  bindChips(ui.top,'fm',m=>{mode=m;gen()});
  gen();ui.hint('Tap a number, then a sign, then another number!',4500);
  /* keyboard: Tab/arrows pick cards, + - * / ^ pick a sign, Enter combines, Backspace undoes */
  let kc=0;
  g.key(e=>{const k=e.key,cs=[...cardsEl.children];if(done)return false;
    if(k==='ArrowRight'||k==='ArrowLeft'){kc=(kc+(k==='ArrowRight'?1:-1)+cs.length)%cs.length;cs[kc]?.focus();return true}
    const o={'+':'+','-':'−','*':'×','x':'×','/':'÷','^':'^'}[k];if(o&&opsFor().includes(o)){if(sel===null){const f=document.activeElement;if(f&&f.classList.contains('fcard'))sel=+f.dataset.i;else return ui.hint('Pick a number first!'),true}op=o;tone(700,.06,'triangle');render();cardsEl.children[(sel+1)%cardsEl.children.length]?.focus();return true}
    if(k==='Backspace'){stage.querySelector('#undo').click();return true}if(k.toLowerCase()==='h'){stage.querySelector('#hintb').click();return true}
    if(/^[0-9]$/.test(k)){const i=cards.findIndex(c=>String(c.v)===k);if(i>=0){cardsEl.children[i].click();return true}}return false});
  GAMES.forge._debug={get cards(){return cards},get target(){return target},solve,pick:(i,o,j)=>{sel=i;op=o;combine(i,j)},opsFor};
}}});
