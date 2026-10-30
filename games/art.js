/* ============================================================
   MATH ART — sunflowers, spirographs, fractal trees, Mandelbrot
   ============================================================ */
Object.assign(GAMES,{art:{title:'Math Art',icon:'🌻',c:'var(--sun)',age:'6+',section:'math',order:7,blurb:'Turn a formula into art. Find the golden angle.',
init(stage,g){
  let mode='sun',frame=0;const S={sun:{a:137.5,n:600},spiro:{R:96,r:36,d:30,t:0},tree:{depth:9,ang:25,ratio:.72,seed:1},mand:{cx:-.6,cy:0,span:3.2,it:80,dirty:true,tap:null}};
  const ui=labShell(stage,{label:'Math art canvas',top:`${chips('am',[['sun','🌻 Sunflower'],['spiro','🌀 Spirograph'],['tree','🌳 Fractal tree'],['mand','🐞 Mandelbrot']],'sun')}<span class="sep"></span><span class="pbar" id="ex"></span>`,panel:'<div id="pn"></div>'});
  const {cv,panel}=ui,ctx=cv.getContext('2d');let dims=fitCanvas(cv);
  const ink=document.createElement('canvas');let ictx=ink.getContext('2d');
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  function panelFor(infoOnly){const pn=panel.querySelector('#pn'),ex0=stage.querySelector('#ex'),ex={set innerHTML(v){if(!infoOnly)ex0.innerHTML=v}};
    const set=html=>{if(!infoOnly){pn.innerHTML=html;return}const tmp=document.createElement('div');tmp.innerHTML=html;const old=[...pn.querySelectorAll('.fx')],nw=[...tmp.querySelectorAll('.fx')];old.forEach((o,i)=>nw[i]&&o.replaceWith(nw[i]))};
    if(mode==='sun'){const q=S.sun;ex.innerHTML=`<button class="pbtn small go" id="gold">✨ Golden angle</button>`;
      set(`<div class="fx big hot"><span class="tag">Each new seed turns</span><div class="row">${V('α','#E8384F')} = <span class="num" style="color:#E8384F" id="av">${fmt(q.a,1)}°</span></div></div>
        <div class="fx"><span class="tag">Where seed n goes</span><div class="row">angle = ${V('n','#2F6FE0')} × ${V('α','#E8384F')}</div><div class="row">distance = √${V('n','#2F6FE0')}</div></div>
        <div class="fx"><span class="tag">The golden ratio</span><div class="row">${V('φ','#9A5BFF')} = ${frac('1 + √5','2')} = <span class="num">1.618…</span></div><div class="row">360° ÷ ${V('φ','#9A5BFF')}² = <span class="num">137.5°</span></div></div>
        <div class="fx"><span class="tag">Count the spirals</span><div class="row num">1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89…</div><div class="row note">Each number is the two before it added up. Real sunflowers have 34 and 55 spirals!</div></div>`)}
    if(mode==='spiro'){const q=S.spiro,R=q.R,r=q.r,k=R/gcd(R,r);ex.innerHTML=`<button class="pbtn small" id="ring">⭕ ${R<70?'Small':R<110?'Medium':'Big'} ring <span class="caret">▾</span></button><button class="pbtn small" id="clr">🧽 Clear</button>`;
      set(`
        <div class="fx big hot"><span class="tag">Points on the star</span><div class="row">${frac(V('R','#E8384F'),'gcd('+V('R','#E8384F')+', '+V('r','#2F6FE0')+')')} = <span class="num">${k}</span></div></div>
        <div class="fx"><span class="tag">Where the pen goes</span><div class="row">${V('x','#1D1842')} = (${V('R','#E8384F')} − ${V('r','#2F6FE0')}) cos ${V('t','#9A5BFF')} + ${V('d','#1FA463')} cos(${frac(V('R','#E8384F')+' − '+V('r','#2F6FE0'),V('r','#2F6FE0'))}${V('t','#9A5BFF')})</div>
          <div class="row">${V('y','#1D1842')} = (${V('R','#E8384F')} − ${V('r','#2F6FE0')}) sin ${V('t','#9A5BFF')} − ${V('d','#1FA463')} sin(${frac(V('R','#E8384F')+' − '+V('r','#2F6FE0'),V('r','#2F6FE0'))}${V('t','#9A5BFF')})</div></div>
`)}
    if(mode==='tree'){const q=S.tree;ex.innerHTML=`<button class="pbtn small" id="less" aria-label="Fewer branches">➖</button><span class="lvl">${q.depth} levels</span><button class="pbtn small" id="more" aria-label="More branches">➕</button><button class="pbtn small" id="grow">🌱 New tree</button>`;
      set(`
        <div class="fx big hot"><span class="tag">Leaf tips</span><div class="row">2<sup>${V('n','#1FA463')} − 1</sup> = 2<sup>${q.depth-1}</sup> = <span class="num">${2**(q.depth-1)}</span></div><div class="row note">The trunk is level 1, then every level doubles.</div></div>
        <div class="fx"><span class="tag">All the branches</span><div class="row">2<sup>${V('n','#1FA463')}</sup> − 1 = 2<sup>${q.depth}</sup> − 1 = <span class="num">${2**q.depth-1}</span></div></div>
        <div class="fx"><span class="tag">Each branch is shorter</span><div class="row">length × ${V('k','#2F6FE0')} = length × <span class="num">${fmt(q.ratio,2)}</span></div><div class="row note">A shape made of smaller copies of itself is a fractal.</div></div>`)}
    if(mode==='mand'){const q=S.mand;ex.innerHTML=`<button class="pbtn small" id="zout">🔍 Zoom out</button><button class="pbtn small" id="home2">🏠 Whole thing</button>`;
      const orb=q.tap?orbit(q.tap[0],q.tap[1]):null;
      set(`<div class="fx big hot"><span class="tag">The whole rule</span><div class="row">${V('z','#9A5BFF')} → ${V('z','#9A5BFF')}² + ${V('c','#E8384F')}</div></div>
        <div class="fx"><span class="tag">Tap the picture</span><div class="row">${orb?`${V('c','#E8384F')} = <span class="num">${fmt(q.tap[0],3)} ${q.tap[1]<0?'−':'+'} ${fmt(Math.abs(q.tap[1]),3)}i</span>`:'Tap to zoom in. Pinch, scroll or drag to explore.'}</div>
          ${orb?`<div class="row note">${orb.esc?`Escapes after <b>${orb.n}</b> steps, so it is outside (colored).`:'Stays close forever, so it is inside (dark).'}</div>`:''}</div>
        <div class="fx"><span class="tag">Zoom</span><div class="row num">× ${fmt(3.2/q.span,0)}</div><div class="row note">The edge never runs out of detail.</div></div>`)}}
  function orbit(cx,cy){let x=0,y=0,pts=[[0,0]];for(let n=1;n<=200;n++){[x,y]=[x*x-y*y+cx,2*x*y+cy];pts.push([x,y]);if(x*x+y*y>4)return{esc:true,n,pts}}return{esc:false,n:200,pts}}
  /* No sliders: you change the art by dragging on it. The numbers you are changing show up on the picture while you drag. */
  let showVals=0;
  const goldCheck=()=>{if(Math.abs(S.sun.a-137.5)<.15&&!S.sun.won){S.sun.won=true;win(stage,null,null,'Golden angle!')}};
  function sunUI(){const av=panel.querySelector('#av');if(av)av.textContent=fmt(S.sun.a,1)+'°'}
  function valTag(lines){if(!showVals)return;showVals--;ctx.save();ctx.font='900 16px Nunito';const w=Math.max(...lines.map(l=>ctx.measureText(l[0]).width))+28,h=lines.length*24+14;
    ctx.fillStyle='rgba(255,255,255,.92)';ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(12,12,w,h,14);ctx.fill();ctx.stroke();
    lines.forEach(([t,c],i)=>{ctx.fillStyle=c;ctx.textAlign='left';ctx.fillText(t,26,36+i*24)});ctx.restore()}
  let tick=0;const tk=f=>{if(++tick%3===0)tone(f,.03,'sine',.04)};
  stage.querySelector('#ex').addEventListener('click',e=>{const id=e.target.closest('button')?.id;if(!id)return;tone(560,.07,'triangle');
    if(id==='gold'){const q=S.sun,from=q.a,t0=performance.now();const anim=()=>{const u=Math.min(1,(performance.now()-t0)/1500);q.a=from+(137.508-from)*(1-(1-u)**3);
        sunUI();showVals=40;if(u<1&&g.alive)requestAnimationFrame(anim);else goldCheck()};anim()}
    if(id==='clr'){S.spiro.t=0;ictx.clearRect(0,0,ink.width,ink.height)}
    if(id==='grow'){S.tree.seed=Math.random()*1000}
    if(id==='less'||id==='more'){const q=S.tree;q.depth=clamp(q.depth+(id==='more'?1:-1),1,12);panelFor();showVals=90}
    if(id==='ring'){popMenu(e.target.closest('button'),`<div class="popgrid">${[['Small',60],['Medium',96],['Big',130]].map(([n,v])=>`<button class="popitem ${S.spiro.R===v?'on':''}" data-r="${v}"><span class="pe">⭕</span>${n}</button>`).join('')}</div>`,b=>{const q=S.spiro;q.R=+b.dataset.r;q.r=Math.min(q.r,q.R-4);q.t=0;ictx.clearRect(0,0,ink.width,ink.height);panelFor()});return}
    if(id==='zout'){S.mand.span=Math.min(3.2,S.mand.span*2);S.mand.it=clamp(Math.round(80+45*Math.log2(3.2/S.mand.span)),80,700);S.mand.dirty=true;panelFor()}
    if(id==='home2'){Object.assign(S.mand,{cx:-.6,cy:0,span:3.2,it:80,dirty:true,tap:null});panelFor()}});
  function setMode(m){mode=m;if(m==='spiro'){S.spiro.t=0;ictx.clearRect(0,0,ink.width,ink.height)}if(m==='mand')S.mand.dirty=true;panelFor();showVals=m==='mand'?0:150;ui.hint({sun:'Slide sideways to turn each seed. Slide up for more seeds. Or press Golden angle!',spiro:'Drag sideways to change the gear. Drag up or down to move the pen.',tree:'Drag sideways to spread the branches. Drag up or down to make them longer.',mand:'Tap to zoom in. Drag to look around. Pinch or scroll to zoom.'}[m],4500,true)}
  bindChips(ui.top,'am',setMode);
  const toC=(px,py)=>{const q=S.mand,sc=q.span/Math.min(dims.w,dims.h);return[q.cx+(px-dims.w/2)*sc,q.cy-(py-dims.h/2)*sc]};
  function zoomAt(px,py,k){const q=S.mand,[x,y]=toC(px,py);q.span=clamp(q.span/k,1e-9,4);q.it=clamp(Math.round(80+45*Math.log2(3.2/q.span)),80,700);const sc=q.span/Math.min(dims.w,dims.h);q.cx=x-(px-dims.w/2)*sc;q.cy=y+(py-dims.h/2)*sc;q.dirty=true}
  const fm=fingers(cv,{wheel(w){if(mode==='mand'){zoomAt(w.x,w.y,Math.pow(1.25,-w.dy));panelFor()}},
    down(f){if(mode==='mand'){f.data.mv=0}
    f.data.lx=f.x;f.data.ly=f.y;showVals=90},
    move(f){if(mode==='mand'){const tf=twoFinger(fm);if(tf){if(!tf.start){zoomAt(tf.cx,tf.cy,tf.scale);const q=S.mand,sc=q.span/Math.min(dims.w,dims.h);q.cx-=tf.dx*sc;q.cy+=tf.dy*sc}f.data.mv=99;return}
        const q=S.mand,sc=q.span/Math.min(dims.w,dims.h),dx=f.vx,dy=f.vy;f.data.mv+=Math.abs(dx)+Math.abs(dy);if(f.data.mv>8){q.cx-=(f.x-(f.data.lx??f.sx))*sc;q.cy+=(f.y-(f.data.ly??f.sy))*sc;q.dirty=true}f.data.lx=f.x;f.data.ly=f.y;return}
      const dx=f.x-f.data.lx,dy=f.y-f.data.ly;f.data.lx=f.x;f.data.ly=f.y;showVals=90;
      if(mode==='sun'){const q=S.sun;q.a=clamp(q.a+dx*.02,0,360);q.n=clamp(Math.round(q.n-dy*3),20,1500);sunUI();goldCheck();tk(300+q.a*2)}
      if(mode==='spiro'){const q=S.spiro,or=q.r,od=q.d;q.r=clamp(Math.round(q.r+dx*.15),8,q.R-4);q.d=clamp(Math.round(q.d-dy*.3),0,120);if(q.r!==or||q.d!==od){q.t=0;ictx.clearRect(0,0,ink.width,ink.height);panelFor(true);tk(200+q.r*8)}}
      if(mode==='tree'){const q=S.tree,oa=q.ang,ok=q.ratio;q.ang=clamp(Math.round(q.ang+dx*.15),0,90);q.ratio=clamp(Math.round((q.ratio-dy*.0015)*100)/100,.5,.85);if(q.ang!==oa||q.ratio!==ok){panelFor(true);tk(300+q.ang*8)}}},
    up(f){if(mode==='mand'&&f.data.mv<=8&&fm.size===0){const q=S.mand,[x,y]=toC(f.x,f.y);q.tap=[x,y];zoomAt(f.x,f.y,2);tone(700,.1,'triangle')}if(mode==='mand')panelFor()}});
  /* ---------- renderers ---------- */
  function drawSun(){const W=dims.w,H=dims.h,q=S.sun,R=Math.min(W,H)*.46,c=R/Math.sqrt(q.n);ctx.fillStyle='#14102E';ctx.fillRect(0,0,W,H);const a=q.a*Math.PI/180;
    for(let n=1;n<=q.n;n++){const r=c*Math.sqrt(n),t=n*a,x=W/2+r*Math.cos(t),y=H/2+r*Math.sin(t),hue=(n*.5+frame*.3)%360;ctx.fillStyle=n<q.n*.35?`hsl(${30+n%20},85%,${35+n%3*8}%)`:`hsl(${45+hue%25},95%,58%)`;
      ctx.beginPath();ctx.arc(x,y,Math.max(1.5,c*.42),0,7);ctx.fill()}}
  function drawSpiro(){const W=dims.w,H=dims.h,q=S.spiro;if(ink.width!==cv.width||ink.height!==cv.height){ink.width=cv.width;ink.height=cv.height;ictx=ink.getContext('2d');q.t=0}
    const sc=Math.min(W,H)/2/(Math.abs(q.R-q.r)+q.d+4),cx=W/2,cy=H/2,k=(q.R-q.r)/q.r,P=t=>[cx+((q.R-q.r)*Math.cos(t)+q.d*Math.cos(k*t))*sc,cy+((q.R-q.r)*Math.sin(t)-q.d*Math.sin(k*t))*sc];
    const loops=q.r/gcd(q.R,q.r),tmax=2*Math.PI*loops;ictx.setTransform(dims.d,0,0,dims.d,0,0);ictx.lineWidth=2.4;ictx.lineCap='round';
    for(let s=0;s<14&&q.t<tmax;s++){const a=P(q.t),nt=q.t+.03,b=P(nt);ictx.strokeStyle=`hsl(${q.t*12%360},85%,58%)`;ictx.beginPath();ictx.moveTo(...a);ictx.lineTo(...b);ictx.stroke();q.t=nt}
    ctx.fillStyle='#14102E';ctx.fillRect(0,0,W,H);ctx.drawImage(ink,0,0,W,H);
    if(q.t<tmax){const gx=cx+(q.R-q.r)*Math.cos(q.t)*sc,gy=cy+(q.R-q.r)*Math.sin(q.t)*sc;ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,q.R*sc,0,7);ctx.stroke();
      ctx.beginPath();ctx.arc(gx,gy,q.r*sc,0,7);ctx.stroke();const p=P(q.t);ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(...p);ctx.stroke();ctx.fillStyle='#FFC83D';ctx.beginPath();ctx.arc(...p,5,0,7);ctx.fill()}}
  function drawTree(){const W=dims.w,H=dims.h,q=S.tree;ctx.fillStyle='#14102E';ctx.fillRect(0,0,W,H);ctx.fillStyle='#24543A';ctx.fillRect(0,H*.92,W,H*.08);
    let rs=q.seed;const rnd=()=>{rs=(rs*9301+49297)%233280;return rs/233280};const wind=Math.sin(frame*.03)*.04+(q.lean||0)*.6;
    const br=(x,y,len,ang,d)=>{const x2=x+Math.cos(ang)*len,y2=y-Math.sin(ang)*len;ctx.strokeStyle=d>q.depth-2?`hsl(${100+d*8},60%,${45+d*3}%)`:'#8B5A2B';ctx.lineWidth=Math.max(1,(q.depth-d+1)*1.4);
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();if(d>=q.depth){ctx.fillStyle=`hsl(${330+rnd()*40},85%,70%)`;ctx.beginPath();ctx.arc(x2,y2,2.5,0,7);ctx.fill();return}
      const j=(rnd()-.5)*.25,th=q.ang*Math.PI/180;br(x2,y2,len*q.ratio*(.9+rnd()*.2),ang+th+j+wind,d+1);br(x2,y2,len*q.ratio*(.9+rnd()*.2),ang-th+j+wind,d+1)};
    ctx.lineCap='round';br(W/2,H*.92,H*.24,Math.PI/2,1)}
  const mcv=document.createElement('canvas');let mrow=0,mres=4;const mctx=mcv.getContext('2d',{willReadFrequently:true});
  function drawMand(){const W=dims.w,H=dims.h,q=S.mand;
    if(q.dirty){mres=6;mrow=0;q.dirty=false;mcv.width=Math.ceil(W/mres);mcv.height=Math.ceil(H/mres)}
    const mc=mctx,w=mcv.width,h=mcv.height,sc=q.span/Math.min(W,H),t0=performance.now();
    if(mrow<h){const img=mc.getImageData(0,0,w,h),d=img.data;
      while(mrow<h&&performance.now()-t0<12){const cy=q.cy-(mrow*mres-H/2)*sc;for(let x=0;x<w;x++){const cx=q.cx+(x*mres-W/2)*sc;let zx=0,zy=0,n=0;while(n<q.it&&zx*zx+zy*zy<4){const t=zx*zx-zy*zy+cx;zy=2*zx*zy+cy;zx=t;n++}
          const o=(mrow*w+x)*4;if(n>=q.it){d[o]=20;d[o+1]=16;d[o+2]=46}else{const v=n+1-Math.log2(Math.log2(zx*zx+zy*zy)||1),h2=(v*9+200)%360,[r,g2,b]=hsl(h2,.85,.55+.15*Math.sin(v*.3));d[o]=r;d[o+1]=g2;d[o+2]=b}d[o+3]=255}mrow++}
      mc.putImageData(img,0,0);if(mrow>=h&&mres>2){mres=mres===6?3:2;if(mres<=3){const old=document.createElement('canvas');old.width=w;old.height=h;old.getContext('2d').drawImage(mcv,0,0);mcv.width=Math.ceil(W/mres);mcv.height=Math.ceil(H/mres);mcv.getContext('2d').drawImage(old,0,0,mcv.width,mcv.height);mrow=0}}}
    ctx.imageSmoothingEnabled=true;ctx.drawImage(mcv,0,0,W,H);
    if(q.tap){const orb=orbit(q.tap[0],q.tap[1]);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=2;ctx.beginPath();orb.pts.slice(0,40).forEach(([x,y],i)=>{const px=W/2+(x-q.cx)/sc,py=H/2-(y-q.cy)/sc;i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.stroke();
      ctx.fillStyle='#FFC83D';ctx.beginPath();ctx.arc(W/2+(q.tap[0]-q.cx)/sc,H/2-(q.tap[1]-q.cy)/sc,6,0,7);ctx.fill()}}
  function hsl(h,s,l){const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));return[f(0)*255,f(8)*255,f(4)*255]}
  function resize(){dims=fitCanvas(cv);S.mand.dirty=true;S.spiro.t=0}const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  setMode('sun');
  g.key(e=>{const k=e.key;if(/^[1-4]$/.test(k)){ui.top.querySelectorAll('[data-am]')[+k-1].click();return true}
    if(mode!=='mand'&&/^Arrow/.test(k)){const side=k==='ArrowLeft'||k==='ArrowRight',dir=(k==='ArrowRight'||k==='ArrowUp')?1:-1,big=e.shiftKey?5:1;showVals=90;
      if(mode==='sun'){const q=S.sun;if(side)q.a=clamp(Math.round((q.a+dir*.1*big)*10)/10,0,360);else q.n=clamp(q.n+dir*20*big,20,1500);sunUI();goldCheck()}
      if(mode==='spiro'){const q=S.spiro;if(side)q.r=clamp(q.r+dir*big,8,q.R-4);else q.d=clamp(q.d+dir*2*big,0,120);q.t=0;ictx.clearRect(0,0,ink.width,ink.height);panelFor(true)}
      if(mode==='tree'){const q=S.tree;if(side)q.ang=clamp(q.ang+dir*big,0,90);else q.ratio=clamp(Math.round((q.ratio+dir*.01*big)*100)/100,.5,.85);panelFor(true)}
      return true}
    if(mode==='mand'){const q=S.mand,sc=q.span*.08;if(k==='+'||k==='='){zoomAt(dims.w/2,dims.h/2,1.5);panelFor();return true}if(k==='-'||k==='_'){zoomAt(dims.w/2,dims.h/2,1/1.5);panelFor();return true}
      const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[k];if(d){q.cx+=d[0]*sc;q.cy+=d[1]*sc;q.dirty=true;return true}}
    if((k===' '||k==='Enter')&&mode==='sun'){stage.querySelector('#gold').click();return true}if((k===' '||k==='Enter')&&mode==='tree'){stage.querySelector('#grow').click();return true}return false});
  g.loop(()=>{frame++;ctx.setTransform(dims.d,0,0,dims.d,0,0);({sun:drawSun,spiro:drawSpiro,tree:drawTree,mand:drawMand})[mode]();
    const q=S[mode];if(mode==='sun')valTag([[`α = ${fmt(q.a,1)}°  (slide sideways)`,'#E8384F'],[`n = ${q.n} seeds  (slide up or down)`,'#2F6FE0']]);
    if(mode==='spiro')valTag([[`r = ${q.r}  gear size (sideways)`,'#2F6FE0'],[`d = ${q.d}  pen spot (up or down)`,'#1FA463']]);
    if(mode==='tree')valTag([[`θ = ${q.ang}°  spread (sideways)`,'#E8384F'],[`k = ${fmt(q.ratio,2)}  branch length (up or down)`,'#2F6FE0']])});
  GAMES.art._debug={S,setMode,orbit,get mode(){return mode}};
}}});
