/* Shared on-screen pieces: lab shell, folding toolbars, info tabs, chips, sliders, graph paper, pop-up menus, hints. */
/* ---------- math lab helpers ---------- */
const fmt=(v,d=1)=>{if(!isFinite(v))return '∞';const r=Math.round(v*10**d)/10**d;return (Object.is(r,-0)?0:r).toLocaleString('en-US',{maximumFractionDigits:d})};
const frac=(a,b)=>`<span class="fr"><span>${a}</span><span>${b}</span></span>`;
const V=(sym,col)=>`<i class="vr" style="--vc:${col}">${sym}</i>`;
/* a big touch slider: returns html; read with slVal(root,id) */
function slider(id,sym,min,max,step,val,col,unit=''){return `<label class="ctl" style="--vc:${col}"><span class="csym">${sym}</span>
  <input class="rng" type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" aria-label="${sym}"><output class="cval" id="${id}-o">${val}${unit}</output></label>`}
/* canvas on the left, live formula panel on the right (stacks on phones) */
function labShell(stage,{top='',panel='',label='Play area'}={}){
  stage.innerHTML=`<div class="lab">${top?`<div class="lab-top">${top}</div>`:''}<div class="lab-main"><div class="simarea"><canvas class="simcv" aria-label="${label}"></canvas><div class="simhint"></div></div></div>
    <div class="idock"><div class="itabs" role="tablist"></div><aside class="lab-panel">${panel}</aside></div></div>`;
  const hintEl=stage.querySelector('.simhint');
  const hint=makeHint(hintEl);
  infoDock(stage.querySelector('.idock'),stage.querySelector('.lab-panel'),innerHeight<560);
  const topEl=stage.querySelector('.lab-top');if(topEl)compactBar(topEl);
  return{cv:stage.querySelector('.simcv'),panel:stage.querySelector('.lab-panel'),top:stage.querySelector('.lab-top'),area:stage.querySelector('.simarea'),hint};
}
/* Toolbars always fit on one row. If a bar would wrap, it first folds each group of choices (modes, sizes, tools) into one
   "current choice ▾" menu button, smallest screens first. If it still doesn't fit, the less important buttons move into a "⋯" menu.
   The original buttons stay in the page, hidden, and get clicked for real, so every game's own code keeps working. */
function compactBar(bar){let busy=false;
  const key=b=>{for(const a of b.attributes)if(a.name.startsWith('data-')&&a.name!=='data-cg')return a.name;return null};
  const shown=x=>!x.classList.contains('cgh')&&!x.hidden&&x.style.display!=='none'&&getComputedStyle(x).display!=='none';
  const wraps=()=>{const kids=[...bar.querySelectorAll(':scope>*, :scope>.pbar>*')].filter(x=>!x.classList.contains('pbar')&&shown(x)&&x.offsetHeight);if(!kids.length)return false;
    const t0=Math.min(...kids.map(k=>k.getBoundingClientRect().top));return kids.some(k=>k.getBoundingClientRect().top>t0+12)};
  function menuBtn(before,html,items,cls=''){const m=document.createElement('button');m.className='pbtn small cgbtn '+cls;m.type='button';m.setAttribute('aria-haspopup','menu');m.innerHTML=html;before.before(m);
    m.addEventListener('click',()=>popMenu(m,`<div class="popgrid">${items.map((x,i)=>`<button class="popitem ${x.classList.contains('on')?'on':''}" data-cg="${i}">${x.innerHTML}</button>`).join('')}</div>`,it=>items[+it.dataset.cg].click()));return m}
  function refresh(){if(busy||!bar.isConnected)return;busy=true;mo.disconnect();
    bar.querySelectorAll('.cgbtn').forEach(x=>x.remove());bar.querySelectorAll('.cgh').forEach(x=>x.classList.remove('cgh'));
    if(wraps()){
      // 1) fold choice groups, biggest first
      const groups=[],seen=new Set();
      for(const b of bar.querySelectorAll('button')){const k=key(b);if(!k||seen.has(b)||!shown(b))continue;const grp=[...b.parentElement.children].filter(x=>x.tagName==='BUTTON'&&key(x)===k&&shown(x));grp.forEach(x=>seen.add(x));
        if(grp.length>=2&&grp.some(x=>x.classList.contains('on')))groups.push(grp)}
      groups.sort((a,b)=>b.length-a.length);
      for(const grp of groups){if(!wraps())break;const cur=grp.find(x=>x.classList.contains('on'));menuBtn(grp[0],`${cur.innerHTML}<span class="caret">▾</span>`,grp);grp.forEach(x=>x.classList.add('cgh'))}
      // 2) still too wide: tuck the less important buttons into a ⋯ menu, from the end
      if(wraps()){const cand=[...bar.querySelectorAll('button')].filter(x=>shown(x)&&!x.classList.contains('cgbtn')&&!x.classList.contains('go')&&!x.closest('.cgh')).reverse();
        const moved=[],end=document.createElement('i');end.className='cgbtn cgend';bar.appendChild(end);let more=null;
        for(const x of cand){if(!wraps())break;x.classList.add('cgh');moved.unshift(x);if(more)more.remove();more=menuBtn(end,'⋯<span class="sr"> More</span>',moved,'more')}}
    }
    mo.takeRecords();mo.observe(bar,OPT);busy=false}
  const OPT={childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','style']};
  const mo=new MutationObserver(()=>requestAnimationFrame(refresh));
  refresh();let rt=0;const onResize=()=>{clearTimeout(rt);rt=setTimeout(refresh,80)};addEventListener('resize',onResize);
  if(cur)cur.onEnd(()=>{removeEventListener('resize',onResize);clearTimeout(rt);mo.disconnect()});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(refresh);
}
/* Info tabs: every .fx card in a panel becomes a tab, and only one card shows at a time, so nothing ever scrolls.
   Tap a tab to read it, tap the open tab again to fold the bar away. Cards keep updating live behind the scenes.
   Anything inside .keep (like Robo's code blocks) always stays on screen. */
function infoDock(dock,body,startClosed){
  const tabs=dock.querySelector('.itabs');let active=null,sig='',busy=false;if(startClosed)dock.classList.add('closed');
  const vis=c=>{if(c.closest('[hidden]'))return false;for(let e=c.parentElement;e&&e!==body;e=e.parentElement)if(e.style.display==='none')return false;return true};
  const lab=c=>(c.querySelector('.tag')?.textContent||'Info').trim();
  const cards=()=>[...body.querySelectorAll('.fx')].filter(c=>!c.closest('.keep')&&vis(c));
  function sync(){if(busy)return;busy=true;
    const cs=cards(),L=cs.map(lab);if(!L.includes(active)){const h=cs.find(c=>c.classList.contains('hot'));active=h?lab(h):L[0]??null}
    if(L.join('|')!==sig){sig=L.join('|');tabs.innerHTML=`<button class="inav" data-d="-1" aria-label="Previous">◀</button>`+L.map((l,i)=>`<button class="itab" role="tab" data-i="${i}">${l}<span class="icount">${i+1}/${L.length}</span></button>`).join('')+`<button class="inav" data-d="1" aria-label="Next">▶</button>`;tabs.classList.toggle('one',L.length<2)}
    const closed=dock.classList.contains('closed');
    tabs.querySelectorAll('.itab').forEach((b,i)=>{const on=L[i]===active;b.classList.toggle('cur',on);b.classList.toggle('on',on&&!closed);b.setAttribute('aria-selected',on);b.classList.toggle('hot',!!cs[i]&&cs[i].classList.contains('hot'))});
    body.querySelectorAll('.fx').forEach(c=>c.classList.toggle('ion',cs.includes(c)&&lab(c)===active));
    dock.classList.toggle('empty',!L.length&&!body.querySelector('.keep'));
    mo.takeRecords();busy=false}
  const mo=new MutationObserver(sync);mo.observe(body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','style']});
  const mo2=new MutationObserver(sync);mo2.observe(dock,{attributes:true,attributeFilter:['class']});
  if(cur)cur.onEnd(()=>{mo.disconnect();mo2.disconnect()});
  tabs.addEventListener('click',e=>{const nv=e.target.closest('.inav');if(nv){const L=sig.split('|'),i=L.indexOf(active);active=L[(i+ +nv.dataset.d+L.length)%L.length];dock.classList.remove('closed');tone(620,.06,'sine',.1);sync();return}
    const b=e.target.closest('.itab');if(!b)return;const l=sig.split('|')[+b.dataset.i];
    if(l===active&&!dock.classList.contains('closed'))dock.classList.add('closed');else{active=l;dock.classList.remove('closed')}tone(620,.06,'sine',.1);sync()});
  sync();return{sync,open(){dock.classList.remove('closed')},close(){dock.classList.add('closed')}};
}
function chips(name,list,on){return list.map(([k,l])=>`<button class="opt ${k===on?'on':''}" data-${name}="${k}">${l}</button>`).join('')}
function bindChips(root,name,cb){root.addEventListener('click',e=>{const b=e.target.closest(`[data-${name}]`);if(!b)return;root.querySelectorAll(`[data-${name}]`).forEach(x=>x.classList.toggle('on',x===b));tone(560,.07,'triangle');cb(b.dataset[name],b)})}
/* draws a coordinate grid; returns world->screen helpers */
function plane(ctx,W,H,xr,yr,opt={}){
  const pad=opt.pad??0,sx=(W-pad*2)/(xr[1]-xr[0]),sy=(H-pad*2)/(yr[1]-yr[0]),s=Math.max(2,Math.min(sx,sy)),cx=W/2-(xr[0]+xr[1])/2*s,cy=H/2+(yr[0]+yr[1])/2*s;
  const X=x=>cx+x*s,Y=y=>cy-y*s,IX=px=>(px-cx)/s,IY=py=>(cy-py)/s;
  const x0=Math.floor(IX(0)),x1=Math.ceil(IX(W)),y0=Math.floor(IY(H)),y1=Math.ceil(IY(0));
  if(opt.draw!==false){ctx.lineWidth=1;
    for(let x=x0;x<=x1;x++){ctx.strokeStyle=x%5?'rgba(62,103,240,.12)':'rgba(62,103,240,.28)';ctx.beginPath();ctx.moveTo(X(x),0);ctx.lineTo(X(x),H);ctx.stroke()}
    for(let y=y0;y<=y1;y++){ctx.strokeStyle=y%5?'rgba(62,103,240,.12)':'rgba(62,103,240,.28)';ctx.beginPath();ctx.moveTo(0,Y(y));ctx.lineTo(W,Y(y));ctx.stroke()}
    ctx.strokeStyle='#1D1842';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,Y(0));ctx.lineTo(W,Y(0));ctx.moveTo(X(0),0);ctx.lineTo(X(0),H);ctx.stroke();
    ctx.fillStyle='#1D1842';ctx.font='800 12px Nunito,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='top';
    const st=s<22?5:s<40?2:1;
    for(let x=Math.ceil(x0/st)*st;x<=x1;x+=st){if(x)ctx.fillText(x,X(x),Y(0)+5)}ctx.textAlign='right';ctx.textBaseline='middle';
    for(let y=Math.ceil(y0/st)*st;y<=y1;y+=st){if(y)ctx.fillText(y,X(0)-5,Y(y))}}
  return{X,Y,IX,IY,s};
}
function arrow(ctx,x1,y1,x2,y2,col,w=4){const a=Math.atan2(y2-y1,x2-x1),l=Math.hypot(x2-x1,y2-y1);if(l<2)return;const h=Math.min(14,l*.4);
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*h*.6,y2-Math.sin(a)*h*.6);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(a-.45)*h,y2-Math.sin(a-.45)*h);ctx.lineTo(x2-Math.cos(a+.45)*h,y2-Math.sin(a+.45)*h);ctx.closePath();ctx.fill()}
/* update a panel without rebuilding sliders the child might be dragging */
function patchPanel(el,html){const tmp=document.createElement('div');tmp.innerHTML=html;const o=[...el.querySelectorAll('.fx')],n=[...tmp.querySelectorAll('.fx')];
  if(!el.querySelector('input')||o.length!==n.length||el.querySelectorAll('input').length!==tmp.querySelectorAll('input').length){el.innerHTML=html;return}
  o.forEach((x,i)=>{if(x.innerHTML!==n[i].innerHTML)x.replaceWith(n[i])})}

/* Starts folded: an open card covered the bottom of the play area, right where sand settles, water pools and toys sink. */
function fxOverlay(area,openByDefault=false){area.insertAdjacentHTML('beforeend','<div class="fxo idock"><div class="itabs" role="tablist"></div><div class="fxo-b"></div></div>');
  const el=area.querySelector('.fxo'),body=el.querySelector('.fxo-b');let last='';
  const d=infoDock(el,body,!openByDefault);
  return{set(html){if(html!==last){last=html;body.innerHTML=html}},el,dock:d}}

/* ---------- pop-up menus: close on pick, on a tap anywhere else, or Esc ---------- */
let openPop=null;
function closePop(){if(openPop){const p=openPop;openPop=null;p.el.remove();p.anchor.classList.remove('popon');p.anchor.setAttribute('aria-expanded','false');document.removeEventListener('pointerdown',p.outside,true)}}
function popMenu(anchor,html,onPick){
  if(openPop&&openPop.anchor===anchor){closePop();return}closePop();
  const host=anchor.closest('.stage')||document.body,el=document.createElement('div');el.className='pop';el.setAttribute('role','menu');el.innerHTML=html;host.appendChild(el);
  const hr=host.getBoundingClientRect(),ar=anchor.getBoundingClientRect(),pw=el.offsetWidth,ph=el.offsetHeight;
  let left=clamp(ar.left+ar.width/2-pw/2-hr.left,8,hr.width-pw-8),top=ar.top-hr.top-ph-10;if(top<8)top=ar.bottom-hr.top+10;
  el.style.left=left+'px';el.style.top=Math.max(8,Math.min(top,hr.height-ph-8))+'px';
  anchor.classList.add('popon');anchor.setAttribute('aria-expanded','true');
  const outside=e=>{if(!el.contains(e.target)&&!anchor.contains(e.target))closePop()};
  document.addEventListener('pointerdown',outside,true);
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(onPick(b)!==false)closePop()});
  openPop={el,anchor,outside};tone(620,.06,'triangle');
  const first=el.querySelector('button.on')||el.querySelector('button');if(first)try{first.focus({preventScroll:true})}catch(e){}
}
/* hint bubble: shows briefly, gets out of the way as soon as you start playing, and never nags with the same words over and over */
function makeHint(el){const seen=new Map();let shownAt=0;
  const hide=()=>{el.classList.remove('show')};
  /* listen on the game's own root (not the shared #stage), so the listener goes away with the game */
  const root=el.closest('.stage')?.firstElementChild||el.parentElement||document;root.addEventListener('pointerdown',()=>{if(performance.now()-shownAt>700)hide()},true);
  const hint=(t,ms=3200,force)=>{const n=seen.get(t)||0;if(n>=2&&!force)return;seen.set(t,n+1);el.textContent=t;el.classList.add('show');shownAt=performance.now();clearTimeout(hint.t);hint.t=setTimeout(hide,ms)};
  hint.hide=hide;return hint}

