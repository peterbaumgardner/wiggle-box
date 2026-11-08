/* ---------------- Magic Paint ----------------
   One slim bar of category buttons (colours, brushes, stamps, magic, paper, eraser, undo, redo). Each category opens a
   pop-up menu over the paper, so the drawing space is the whole board.
   Layers, bottom to top: the paper colour (board background), ink (everything the child paints; the eraser cuts it
   back to the paper), outline pages (coloring pictures, letters, numbers; never erased), the mirror guide.
   Passive learning, on screen (spoken too if Talk is switched on in Magic):
   - "art talk": after each stroke the game describes it (colour + line kind: straight across, wavy, zigzag, loop,
     spiral, corners), the way early-years art teachers describe a child's marks instead of judging them
   - colour names on every pick, a mixing pot (red + yellow = orange; add white for light, black for dark)
   - stamps say what they are and count themselves (3 stars!); shape stamps tell their sides; ABC stamps give a word;
     123 stamps come with a ten-frame of dots
   - coloring pages built from named shapes (the roof is a triangle); a number page to count by coloring; letter pages
   - symmetry words for mirror and snowflake magic; size words for brushes */
Object.assign(GAMES,{
paint:{order:3,title:'Magic Paint',icon:'🎨',c:'var(--tang)',age:'2+',blurb:'Paint, stamp, mix colors and color in pictures',
init(stage,g){
  const INK='#1D1842';
  const COLS=[['rainbow','Rainbow'],['#FF4F5E','Red'],['#FF8A2B','Orange'],['#FFC83D','Yellow'],['#24C786','Green'],['#3D7BFF','Blue'],['#9A5BFF','Purple'],
    ['#FF7FC8','Pink'],['#9B6235','Brown'],['#1D1842','Black'],['#FFFFFF','White'],['#9A9AA8','Gray'],['#18BFD6','Teal']];
  const MIXIN=[['#FF4F5E','Red'],['#FFC83D','Yellow'],['#3D7BFF','Blue'],['#FFFFFF','White'],['#1D1842','Black']];
  const MIX={'Red+Yellow':['#FF8A2B','Orange'],'Blue+Yellow':['#24C786','Green'],'Blue+Red':['#9A5BFF','Purple'],'Red+White':['#FF9EC4','Pink'],
    'Blue+White':['#8EC9FF','Light blue'],'White+Yellow':['#FFE98A','Light yellow'],'Black+White':['#9A9AA8','Gray'],'Black+Red':['#A3202C','Dark red'],
    'Black+Blue':['#1E3A8A','Dark blue'],'Black+Yellow':['#8F8A1E','Olive green']};
  const BRUSHES=[['brush','🖌️','Paint brush'],['neon','💡','Glow pen'],['spray','💨','Spray paint'],['sparkle','✨','Sparkles'],['bubble','🫧','Bubbles'],['fill','🪣','Fill bucket']];
  const SIZES=[[8,'Small'],[18,'Medium'],[34,'Big'],[60,'Huge']];
  const SHAPES=[['circle','Circle','round, no corners'],['square','Square','4 sides the same'],['triangle','Triangle','3 sides'],['rectangle','Rectangle','4 sides'],
    ['star','Star','5 points'],['heart','Heart',''],['diamond','Diamond','4 sides'],['oval','Oval','like an egg'],['pentagon','Pentagon','5 sides'],['hexagon','Hexagon','6 sides']];
  const THINGS=[['🌸','Flower'],['🌻','Sunflower'],['🌳','Tree'],['🍄','Mushroom'],['🌈','Rainbow'],['☀️','Sun'],['🌙','Moon'],['⭐','Star'],['❄️','Snowflake'],['⚡','Lightning'],
    ['🚀','Rocket'],['🪐','Planet'],['🚗','Car'],['🚂','Train'],['🏠','House'],['🎈','Balloon'],['👑','Crown'],['💎','Gem'],['🍓','Strawberry'],['🍕','Pizza'],
    ['🧁','Cupcake'],['🎁','Present'],['🦖','Dinosaur'],['🦄','Unicorn'],['🎵','Music note'],['❤️','Heart']];
  const PAPERS=[['#FFFFFF','White'],['#FFF5D6','Cream'],['#FFE3EF','Pink'],['#E3F3FF','Sky blue'],['#E2F8EC','Mint'],['#1D1842','Night']];
  const PAGES=[['blank','⬜','Blank paper'],['house','🏠','House'],['snowman','⛄','Snowman'],['rocket','🚀','Rocket'],['fish','🐟','Fish'],['flower','🌼','Flower'],['abc','🔤','Letter'],['num','🔢','Number']];
  const EMOJI='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif',FONT='"Baloo 2","Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
  const word=n=>n<=10?NUMW[n]:String(n);
  const plural=(n,s)=>n===1?s:/fish|sheep|deer/i.test(s)?s:/[^aeiou]y$/i.test(s)?s.slice(0,-1)+'ies':/(s|x|ch|sh)$/i.test(s)?s+'es':s+'s';
  const lc=s=>s.toLowerCase();

  stage.innerHTML=`<div class="paint">
    <div class="pp-board">
      <canvas class="pp-ink" aria-label="Drawing paper"></canvas><canvas class="pp-lines" aria-hidden="true"></canvas><canvas class="pp-guide" aria-hidden="true"></canvas>
      <div class="pp-say" aria-live="polite"></div>
      <div class="pp-shade" hidden></div>
      <div class="pp-menu" hidden role="dialog"></div>
    </div>
    <div class="pp-bar">
      <button class="pp-b" data-cat="color" aria-label="Colors" title="Colors"><span class="pp-sw"></span></button>
      <button class="pp-b" data-cat="brush" aria-label="Brushes" title="Brushes"><span class="pp-bi">🖌️</span><span class="pp-dot"></span></button>
      <button class="pp-b" data-cat="stamp" aria-label="Stamps" title="Stamps"><span class="pp-bi">⭐</span></button>
      <button class="pp-b" data-cat="magic" aria-label="Magic" title="Magic">🪄</button>
      <button class="pp-b" data-cat="paper" aria-label="Paper and pictures" title="Paper and pictures">📄</button>
      <button class="pp-b" id="eraser" aria-pressed="false" aria-label="Eraser" title="Eraser">🧽</button>
      <span class="pp-gap"></span>
      <button class="pp-b" id="undo" aria-label="Undo" title="Undo">↩️</button>
      <button class="pp-b" id="redo" aria-label="Redo" title="Redo">↪️</button>
    </div></div>`;
  const $s=q=>stage.querySelector(q),board=$s('.pp-board'),cv=$s('.pp-ink'),lv=$s('.pp-lines'),gv=$s('.pp-guide'),menu=$s('.pp-menu'),shade=$s('.pp-shade'),sayEl=$s('.pp-say');
  const cx=cv.getContext('2d',{willReadFrequently:true}),lx=lv.getContext('2d',{willReadFrequently:true}),gx=gv.getContext('2d');
  let W=0,H=0,D=1;
  /* state */
  let color='rainbow',colorName='Rainbow',tool='brush',lastBrush='brush',size=18,stamp=null,mirror='off',hue=0,paper='#FFFFFF',page={id:'blank',arg:0};
  let words=true,talk=false,stampTab='shapes',openCat=null;
  try{talk=localStorage.getItem('wb-paint-talk')==='on';words=localStorage.getItem('wb-paint-words')!=='off'}catch(e){}
  let parts=[],filled=new Set(),doneTold=false,prevTool='brush',letterI=0,numN=0,mixA=null,mixB=null;const mixFound=new Set();
  let streak={key:'',n:0,t:0},dots={n:0,t:0},mirrorTold=false;
  const pts=new Map();

  /* ---------- talking: a caption over the paper, plus speech if Talk is on ---------- */
  let sayT=0,lastSpoke=0;
  function tell(html,spoken,col){
    if(words){sayEl.innerHTML=html;sayEl.style.setProperty('--sc',col&&col!=='#FFFFFF'?col:INK);sayEl.classList.remove('show');void sayEl.offsetWidth;sayEl.classList.add('show');
      clearTimeout(sayT);sayT=g.later(()=>sayEl.classList.remove('show'),2600)}
    if(talk&&soundOn&&spoken){const now=performance.now();if(now-lastSpoke<1200)return;lastSpoke=now;
      try{const s=window.speechSynthesis;if(!s)return;s.cancel();const u=new SpeechSynthesisUtterance(spoken);u.rate=.9;u.pitch=1.2;s.speak(u)}catch(e){}}
  }
  const cw=(name,col)=>`<b class="pp-cw" style="--c:${col==='rainbow'?INK:col}">${name}</b>`;
  const colorWord=()=>color==='rainbow'?'<b class="pp-rb">Rainbow</b>':cw(colorName,color);

  /* ---------- sizing ---------- */
  function resize(){const r=board.getBoundingClientRect();if(!r.width||!r.height)return;
    const d=Math.min(devicePixelRatio||1,2);if(r.width===W&&r.height===H&&d===D)return;
    const old=document.createElement('canvas');old.width=cv.width;old.height=cv.height;if(cv.width)old.getContext('2d').drawImage(cv,0,0);
    W=r.width;H=r.height;D=d;
    for(const c of [cv,lv,gv]){c.width=Math.round(W*D);c.height=Math.round(H*D)}
    for(const c of [cx,lx,gx]){c.setTransform(D,0,0,D,0,0);c.lineCap=c.lineJoin='round'}
    if(old.width){cx.save();cx.setTransform(1,0,0,1,0,0);cx.drawImage(old,0,0,old.width,old.height,0,0,cv.width,cv.height);cx.restore()}
    drawPage();drawGuide()}
  const ro=new ResizeObserver(resize);ro.observe(board);g.onEnd(()=>ro.disconnect());

  /* ---------- shapes (stamps and the pieces of coloring pages) ---------- */
  function poly(p,cx0,cy0,r,n,rot=-Math.PI/2){for(let i=0;i<n;i++){const a=rot+i*2*Math.PI/n;i?p.lineTo(cx0+r*Math.cos(a),cy0+r*Math.sin(a)):p.moveTo(cx0+r*Math.cos(a),cy0+r*Math.sin(a))}p.closePath()}
  function shapePath(k,x,y,w,h=w){const p=new Path2D();
    if(k==='circle')p.arc(x,y,w/2,0,Math.PI*2);
    else if(k==='oval')p.ellipse(x,y,w/2,h/2,0,0,Math.PI*2);
    else if(k==='square'||k==='rectangle'){const ww=k==='square'?w:w,hh=k==='square'?w:h;p.rect(x-ww/2,y-hh/2,ww,hh)}
    else if(k==='triangle'){p.moveTo(x,y-h/2);p.lineTo(x+w/2,y+h/2);p.lineTo(x-w/2,y+h/2);p.closePath()}
    else if(k==='tailtri'){p.moveTo(x-w/2,y);p.lineTo(x+w/2,y-h/2);p.lineTo(x+w/2,y+h/2);p.closePath()}
    else if(k==='diamond'){p.moveTo(x,y-h/2);p.lineTo(x+w/2,y);p.lineTo(x,y+h/2);p.lineTo(x-w/2,y);p.closePath()}
    else if(k==='pentagon')poly(p,x,y,w/2,5);
    else if(k==='hexagon')poly(p,x,y,w/2,6,0);
    else if(k==='star'){for(let i=0;i<10;i++){const r=i%2?w*.2:w/2,a=-Math.PI/2+i*Math.PI/5;i?p.lineTo(x+r*Math.cos(a),y+r*Math.sin(a)):p.moveTo(x+r*Math.cos(a),y+r*Math.sin(a))}p.closePath()}
    else if(k==='heart'){const s=w;p.moveTo(x,y+.38*s);p.bezierCurveTo(x-.62*s,y-.02*s,x-.38*s,y-.55*s,x,y-.2*s);p.bezierCurveTo(x+.38*s,y-.55*s,x+.62*s,y-.02*s,x,y+.38*s);p.closePath()}
    return p}

  /* ---------- coloring pages: each piece has a name and the shape it is ---------- */
  function pageParts(){const S=Math.min(W,H)*.86,ox=W/2,oy=H/2+S*.02,P=(k,name,sh,x,y,w,h,count=true)=>({path:shapePath(k,ox+x*S,oy+y*S,w*S,(h??w)*S),name,shape:sh,count,area:Math.abs(w*(h??w))});
    switch(page.id){
      case 'house':return[P('triangle','roof','a triangle',0,-.27,.7,.3),P('square','wall','a square',0,.13,.5),P('rectangle','door','a rectangle',0,.25,.12,.24),
        P('square','window','a square',-.14,.06,.11),P('square','window','a square',.14,.06,.11),P('rectangle','chimney','a rectangle',.21,-.32,.07,.1),P('circle','sun','a circle',-.38,-.38,.14)];
      case 'snowman':return[P('circle','bottom snowball','a big circle',0,.25,.4),P('circle','middle snowball','a medium circle',0,-.06,.3),P('circle','head','a small circle',0,-.29,.2),
        P('rectangle','hat','a rectangle',0,-.43,.14,.12),P('triangle','carrot nose','a triangle',0,-.28,.05,.06),P('circle','button','a circle',0,-.08,.05),P('circle','button','a circle',0,.02,.05)];
      case 'rocket':return[P('triangle','nose','a triangle',0,-.36,.24,.2),P('rectangle','body','a rectangle',0,-.02,.24,.48),P('circle','window','a circle',0,-.12,.11),
        P('triangle','fin','a triangle',-.17,.18,.12,.16),P('triangle','fin','a triangle',.17,.18,.12,.16),P('triangle','flame','a triangle',0,.32,.14,-.12),P('star','star','a star',.33,-.3,.12),P('star','star','a star',-.32,-.12,.09)];
      case 'fish':return[P('oval','body','an oval',-.06,0,.56,.34),P('tailtri','tail','a triangle',.32,0,.18,.3),P('circle','eye','a circle',-.2,-.05,.07),
        P('triangle','fin','a triangle',-.04,-.2,.14,.1),P('circle','bubble','a circle',-.4,-.25,.07),P('circle','bubble','a circle',-.33,-.36,.05)];
      case 'flower':{const L=[P('rectangle','stem','a rectangle',0,.27,.04,.42),P('oval','leaf','an oval',-.1,.3,.16,.07),P('oval','leaf','an oval',.1,.22,.16,.07)];
        for(let i=0;i<6;i++){const a=i*Math.PI/3;L.push(P('circle','petal','a circle',Math.cos(a)*.15,-.18+Math.sin(a)*.15,.15))}
        L.push(P('circle','middle','a circle',0,-.18,.13));return L}
      case 'num':{const n=numN,L=[];for(let i=0;i<n;i++){const col=i%5,row=Math.floor(i/5);L.push(P('circle','dot','a circle',-.32+col*.16,.18+row*.17,.13))}return L}
      default:return[]}}
  function drawPage(){lx.clearRect(0,0,W,H);parts=pageParts();
    const lineCol=paper==='#1D1842'?'#FFFFFF':INK;lx.save();lx.strokeStyle=lineCol;lx.lineWidth=Math.max(3,Math.min(W,H)/140);
    /* flower petals sit behind the middle: draw back to front so the pieces don't cross out each other */
    for(const p of parts)lx.stroke(p.path);
    const S=Math.min(W,H);
    if(page.id==='abc'||page.id==='num'){const ch=page.id==='abc'?LETTERS[letterI][0]:String(numN),fs=page.id==='abc'?S*.68:S*.42;
      lx.font=`900 ${fs}px ${FONT}`;lx.textAlign='center';lx.textBaseline='middle';lx.lineWidth=Math.max(4,S/110);
      lx.strokeText(ch,W/2,page.id==='abc'?H/2+S*.03:H/2-S*.2);
      if(page.id==='abc'){lx.font=`${S*.14}px ${EMOJI}`;lx.fillText(LETTERS[letterI][2],W/2+S*.36,H/2-S*.32)}}
    lx.restore()}

  /* ---------- mirror magic ---------- */
  function copies(x,y){
    if(mirror==='two')return[[x,y],[W-x,y]];
    if(mirror==='four')return[[x,y],[W-x,y],[x,H-y],[W-x,H-y]];
    if(mirror==='snow'){const c0=W/2,c1=H/2,dx=x-c0,dy=y-c1,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx),L=[];
      for(let k=0;k<6;k++){const b=k*Math.PI/3;L.push([c0+r*Math.cos(a+b),c1+r*Math.sin(a+b)]);L.push([c0+r*Math.cos(-a+b),c1+r*Math.sin(-a+b)])}return L}
    return[[x,y]]}
  const unique=L=>L.filter(([a,b],i)=>L.findIndex(([c,d])=>Math.abs(a-c)<1&&Math.abs(b-d)<1)===i);
  function drawGuide(){gx.clearRect(0,0,W,H);if(mirror==='off')return;
    gx.save();gx.setLineDash([10,10]);gx.lineWidth=2;gx.strokeStyle=paper==='#1D1842'?'rgba(255,255,255,.35)':'rgba(29,24,66,.22)';gx.beginPath();
    if(mirror==='two'||mirror==='four'){gx.moveTo(W/2,0);gx.lineTo(W/2,H)}
    if(mirror==='four'){gx.moveTo(0,H/2);gx.lineTo(W,H/2)}
    if(mirror==='snow'){const R=Math.hypot(W,H);for(let k=0;k<6;k++){const a=k*Math.PI/3+Math.PI/6;gx.moveTo(W/2,H/2);gx.lineTo(W/2+R*Math.cos(a),H/2+R*Math.sin(a))}}
    gx.stroke();gx.restore()}

  /* ---------- painting ---------- */
  const ink=()=>color==='rainbow'?`hsl(${hue},95%,52%)`:color;
  function dab(x,y){const c=ink();for(const [a,b] of copies(x,y)){cx.save();
    if(tool==='eraser'){cx.globalCompositeOperation='destination-out';cx.beginPath();cx.arc(a,b,size*.75,0,Math.PI*2);cx.fill()}
    else if(tool==='spray'){cx.fillStyle=c;for(let i=0;i<Math.max(8,size);i++){const an=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*size*1.8;cx.beginPath();cx.arc(a+Math.cos(an)*r,b+Math.sin(an)*r,Math.max(.6,size/20),0,Math.PI*2);cx.fill()}}
    else if(tool==='sparkle'){cx.fillStyle=c;for(let i=0;i<5;i++){const xx=a+(Math.random()-.5)*size*2,yy=b+(Math.random()-.5)*size*2,rr=2+Math.random()*size*.28;cx.beginPath();
      for(let p=0;p<8;p++){const an=p*Math.PI/4,rad=p%2?rr*.28:rr;p?cx.lineTo(xx+Math.cos(an)*rad,yy+Math.sin(an)*rad):cx.moveTo(xx+Math.cos(an)*rad,yy+Math.sin(an)*rad)}cx.closePath();cx.fill()}}
    else if(tool==='bubble'){cx.strokeStyle=c;cx.lineWidth=Math.max(1.5,size/9);cx.beginPath();cx.arc(a,b,Math.max(3,size*(.25+Math.random()*.4)),0,Math.PI*2);cx.stroke()}
    else if(tool==='neon'){cx.fillStyle=c;cx.shadowColor=c;cx.shadowBlur=size*1.5;cx.beginPath();cx.arc(a,b,Math.max(1,size*.325),0,Math.PI*2);cx.fill()}
    else{cx.fillStyle=c;cx.beginPath();cx.arc(a,b,size/2,0,Math.PI*2);cx.fill()}
    cx.restore()}}
  function segment(x0,y0,x1,y1){hue=(hue+2)%360;
    if(tool==='spray'||tool==='sparkle'||tool==='bubble'){const dist=Math.hypot(x1-x0,y1-y0),step=Math.max(3,size*.45),n=Math.min(200,Math.ceil(dist/step));
      for(let i=1;i<=n;i++)dab(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n);return}
    /* every copy is mapped the same way at both ends, so mirrored lines never jump across the paper */
    const a=copies(x0,y0),b=copies(x1,y1);
    cx.save();cx.lineCap=cx.lineJoin='round';
    if(tool==='eraser'){cx.globalCompositeOperation='destination-out';cx.lineWidth=size*1.5;cx.strokeStyle='#000'}
    else{cx.strokeStyle=ink();cx.lineWidth=size;if(tool==='neon'){cx.shadowColor=cx.strokeStyle;cx.shadowBlur=size*1.5;cx.lineWidth=Math.max(2,size*.65)}}
    for(let i=0;i<a.length;i++){cx.beginPath();cx.moveTo(a[i][0],a[i][1]);cx.lineTo(b[i][0],b[i][1]);cx.stroke()}
    cx.restore()}

  /* ---------- stamps ---------- */
  function stampInfo(){if(!stamp)return null;const [kind,v]=stamp;
    if(kind==='shape'){const s=SHAPES.find(x=>x[0]===v);return{key:'s'+v,name:s[1],extra:s[2]}}
    if(kind==='animal'){const a=ANIMALS.find(x=>x[0]===v);return{key:'a'+v,name:a[1]}}
    if(kind==='thing'){const t=THINGS.find(x=>x[0]===v);return{key:'t'+v,name:t[1]}}
    if(kind==='abc'){const l=LETTERS.find(x=>x[0]===v);return{key:'l'+v,name:v,letter:l}}
    return{key:'n'+v,name:String(v),num:+v}}
  function stampAt(x,y){const [kind,v]=stamp,s=size*2.6+24,c=ink();
    for(const [a,b] of unique(copies(x,y))){cx.save();cx.translate(a,b);
      if(kind==='shape'){const p=shapePath(v,0,0,s,v==='rectangle'?s*.62:v==='oval'?s*.68:v==='triangle'?s*.87:s);cx.fillStyle=c;cx.fill(p);cx.lineWidth=2;cx.strokeStyle='rgba(29,24,66,.35)';cx.stroke(p)}
      else if(kind==='abc'||kind==='num'){cx.font=`900 ${s}px ${FONT}`;cx.textAlign='center';cx.textBaseline='middle';cx.fillStyle=c;cx.lineWidth=3;cx.strokeStyle='rgba(29,24,66,.35)';
        cx.strokeText(v,0,kind==='num'?-s*.15:0);cx.fillText(v,0,kind==='num'?-s*.15:0);
        /* a ten-frame of dots under the number: count them */
        if(kind==='num'){const n=+v,r=Math.max(3,s*.06),gap=r*2.7;for(let i=0;i<n;i++){const col=i%5,row=Math.floor(i/5);cx.beginPath();cx.arc((col-2)*gap,s*.42+row*gap,r,0,Math.PI*2);cx.fill()}}}
      else{cx.rotate((Math.random()-.5)*.4);cx.font=`${s}px ${EMOJI}`;cx.textAlign='center';cx.textBaseline='middle';cx.fillText(v,0,0)}
      cx.restore()}
    hue=(hue+25)%360;tone(500+Math.random()*500,.08,'triangle',.12);
    const inf=stampInfo(),now=performance.now();
    if(streak.key===inf.key&&now-streak.t<15000)streak.n++;else streak={key:inf.key,n:1,t:now};streak.t=now;
    const n=streak.n;
    if(stamp[0]==='abc'){const l=inf.letter;tell(`<span class="pp-big">${l[0]}</span> ${l[0]} is for ${l[1]} ${l[2]}`,`${l[0]} is for ${l[1]}`,c)}
    else if(stamp[0]==='num'){tell(`<span class="pp-big">${v}</span> ${word(+v)}`,word(+v),c)}
    else{const nm=plural(n,inf.name);tell(`<span class="pp-big">${n}</span> ${n===1?(stamp[0]==='shape'?cw(inf.name,c):inf.name):nm}${n===1&&inf.extra?` <small>${inf.extra}</small>`:''}`,n===1?inf.name:`${word(n)} ${lc(nm)}`,stamp[0]==='shape'?c:null)}}

  /* ---------- fill bucket ---------- */
  function hexRGB(s){if(s.startsWith('hsl')){const [h,sa,l]=s.match(/[\d.]+/g).map(Number),S=sa/100,L=l/100,k=n=>(n+h/30)%12,a=S*Math.min(L,1-L),f=n=>L-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));return[f(0),f(8),f(4)].map(v=>Math.round(v*255))}
    return[1,3,5].map(i=>parseInt(s.slice(i,i+2),16))}
  function flood(x,y,rgb){const w=cv.width,h=cv.height,sx=Math.floor(x*D),sy=Math.floor(y*D);if(sx<0||sy<0||sx>=w||sy>=h)return 0;
    const im=cx.getImageData(0,0,w,h),d=im.data,ln=lx.getImageData(0,0,w,h).data,i0=(sy*w+sx)*4;
    if(ln[i0+3]>90)return 0;
    const r0=d[i0],g0=d[i0+1],b0=d[i0+2],a0=d[i0+3];
    if(a0>200&&Math.abs(r0-rgb[0])<6&&Math.abs(g0-rgb[1])<6&&Math.abs(b0-rgb[2])<6)return 0;
    const same=p=>{const i=p*4;if(ln[i+3]>90)return false;const a=d[i+3];if(a0<30)return a<30;return Math.abs(a-a0)<60&&Math.abs(d[i]-r0)<48&&Math.abs(d[i+1]-g0)<48&&Math.abs(d[i+2]-b0)<48};
    const m=new Uint8Array(w*h),st=[sy*w+sx];let n=0;
    while(st.length){let p=st.pop();if(m[p])continue;const y0=(p/w)|0;let l=p,r=p;const rowS=y0*w,rowE=rowS+w-1;
      while(l>rowS&&!m[l-1]&&same(l-1))l--;while(r<rowE&&!m[r+1]&&same(r+1))r++;
      for(let q=l;q<=r;q++){m[q]=1;n++;if(y0>0){const u=q-w;if(!m[u]&&same(u))st.push(u)}if(y0<h-1){const v=q+w;if(!m[v]&&same(v))st.push(v)}}}
    /* grow the fill under soft edges, so no white halo is left next to lines */
    const grow=Math.max(2,Math.round(D*2));for(let k=0;k<grow;k++){const add=[];for(let p=0;p<m.length;p++){if(m[p])continue;const xx=p%w;
      if((xx>0&&m[p-1]===1)||(xx<w-1&&m[p+1]===1)||(p>=w&&m[p-w]===1)||(p<m.length-w&&m[p+w]===1)){if(k===0||ln[p*4+3]>0)add.push(p)}}for(const p of add)m[p]=2;for(const p of add)m[p]=1}
    for(let p=0;p<m.length;p++)if(m[p]){const i=p*4;d[i]=rgb[0];d[i+1]=rgb[1];d[i+2]=rgb[2];d[i+3]=255}
    cx.putImageData(im,0,0);return n}
  function partAt(x,y){let best=-1;parts.forEach((p,i)=>{if(lx.isPointInPath(p.path,x*D,y*D)&&(best<0||p.area<parts[best].area))best=i});return best}
  function fillAt(x,y){const c=ink(),rgb=hexRGB(c);let any=0,hit=-1;
    for(const [a,b] of unique(copies(x,y))){const n=flood(a,b,rgb);if(n){any+=n;if(hit<0)hit=partAt(a,b)}}
    hue=(hue+40)%360;
    if(!any){buzz();return}
    tone(300,.25,'sine',.15,0,700);
    const name=color==='rainbow'?'Rainbow':colorName;
    if(hit>=0){filled.add(hit);const part=parts[hit];
      if(page.id==='num'){const k=filled.size;tell(`<span class="pp-big">${k}</span> ${word(k)}`,word(k),c);
        if(k===parts.length&&!doneTold){doneTold=true;g.later(()=>{tell(`🎉 You counted ${word(k)}!`,`You counted ${word(k)}!`);cheer();party();addStar()},700)}return}
      tell(`${cw(name,c)} ${part.name} — it's ${part.shape}!`,`${name} ${part.name}. It's ${part.shape}.`,c);
      if(!doneTold&&parts.every((p,i)=>!p.count||filled.has(i))){doneTold=true;{const pg=PAGES.find(p=>p[0]===page.id);g.later(()=>{tell(`🎉 You colored the whole ${lc(pg[2])}!`,`You colored the whole ${lc(pg[2])}!`);cheer();party();addStar()},900)}}}
    else if(page.id==='abc'){const l=LETTERS[letterI];tell(`<span class="pp-big">${l[0]}</span> ${l[0]} is for ${l[1]}`,`${l[0]} is for ${l[1]}`,c)}
    else tell(`Splash! ${cw(name,c)} fills the space`,`${name}!`,c)}

  /* ---------- art talk: describe the stroke the child just made ---------- */
  function describe(path){const now=performance.now(),name=color==='rainbow'?'Rainbow':colorName,C=color==='rainbow'?null:color,col=colorWord();
    let L=0;for(let i=1;i<path.length;i++)L+=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);
    if(L<10){dots.n=now-dots.t<5000?dots.n+1:1;dots.t=now;const n=dots.n;tell(sym(n===1?`${col} dot!`:`<span class="pp-big">${n}</span> ${word(n)} dots!`),n===1?`${name} dot`:`${word(n)} dots`,C);return}
    dots.n=0;
    /* resample to even steps, then look at how the direction turns */
    const step=Math.max(6,L/60),R=[path[0]];let acc=0;
    for(let i=1;i<path.length;i++){let [ax,ay]=path[i-1];const [bx,by]=path[i];let seg=Math.hypot(bx-ax,by-ay);
      while(acc+seg>=step){const t=(step-acc)/seg;ax+=(bx-ax)*t;ay+=(by-ay)*t;R.push([ax,ay]);seg=Math.hypot(bx-ax,by-ay);acc=0}acc+=seg}
    R.push(path[path.length-1]);
    const ang=[];for(let i=1;i<R.length;i++)ang.push(Math.atan2(R[i][1]-R[i-1][1],R[i][0]-R[i-1][0]));
    const dl=[];for(let i=1;i<ang.length;i++){let x=ang[i]-ang[i-1];while(x>Math.PI)x-=2*Math.PI;while(x<-Math.PI)x+=2*Math.PI;dl.push(x)}
    const turn=dl.reduce((a,b)=>a+b,0),absT=dl.reduce((a,b)=>a+Math.abs(b),0);
    /* corners: a sharp bend over a short window */
    let corners=0;for(let i=0;i<dl.length;){const w3=(dl[i]||0)+(dl[i+1]||0)+(dl[i+2]||0);if(Math.abs(w3)>.95){corners++;i+=4}else i++}
    let sign=0,flips=0;for(const x of dl){if(Math.abs(x)<.06)continue;const s=Math.sign(x);if(sign&&s!==sign)flips++;sign=s}
    const [fx0,fy0]=path[0],[lx0,ly0]=path[path.length-1],chord=Math.hypot(lx0-fx0,ly0-fy0);
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const [x,y] of path){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
    const diag=Math.hypot(x1-x0,y1-y0)||1,big=Math.hypot(W,H),sz=L>big*.55?'Long ':L<90?'Short ':'';
    const closed=chord<diag*.28&&L>60;
    let html,spk;
    if(absT>Math.PI*7&&Math.abs(turn)<absT*.5){html=`Scribble scrabble! Lots of ${col}`;spk=`Scribble scrabble! Lots of ${name}`}
    else if(Math.abs(turn)>Math.PI*3.4){html=`${col} spiral — round and round!`;spk=`${name} spiral, round and round`}
    else if(closed&&corners>=3&&corners<=5&&absT<Math.PI*2.8){const sh=corners===3?'triangle':corners===4?'square':'pentagon';html=`${col} shape with ${word(corners)} corners — like a ${sh}!`;spk=`${word(corners)} corners, like a ${sh}`}
    else if(closed&&Math.abs(turn)>Math.PI*1.4){html=`${col} loop — round like a circle!`;spk=`${name} loop, round like a circle`}
    else if(chord/L>.93){const dx=Math.abs(lx0-fx0),dy=Math.abs(ly0-fy0),dir=dx>dy*2.2?'going across':dy>dx*2.2?'going up and down':'going slanty';
      html=`${sz}straight ${col} line, ${dir}!`;spk=`${sz}straight line, ${dir}`}
    else if(corners>=3&&flips>=2){html=`${col} zigzag — up, down, up, down!`;spk=`${name} zigzag`}
    else if(flips>=2){html=`${sz}wavy ${col} line, like the sea!`;spk=`${sz}wavy line, like the sea`}
    else if(corners>=1){html=`${col} line with ${word(corners)} ${corners===1?'corner':'corners'}!`;spk=`a line with ${word(corners)} ${corners===1?'corner':'corners'}`}
    else{html=`${sz}curvy ${col} line!`;spk=`${sz}curvy ${name} line`}
    tell(sym(html.replace(/^(\w)/,m=>m.toUpperCase())),spk,C)}
  function sym(html){if(mirror==='off'||mirrorTold)return html;mirrorTold=true;return html+(mirror==='snow'?' <small>Six parts match — like a snowflake!</small>':' <small>Both sides match — that\'s symmetry!</small>')}

  /* ---------- undo / redo (ink, paper and picture together) ---------- */
  const hist=[],future=[],MAX=16;
  function snap(){const c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;c.getContext('2d').drawImage(cv,0,0);return{c,paper,page:{...page},letterI,numN,filled:new Set(filled),doneTold}}
  function remember(){hist.push(snap());if(hist.length>MAX)hist.shift();future.length=0}
  function restore(s){cx.save();cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,cv.width,cv.height);cx.drawImage(s.c,0,0,s.c.width,s.c.height,0,0,cv.width,cv.height);cx.restore();
    const pageChanged=s.page.id!==page.id||s.letterI!==letterI||s.numN!==numN||s.paper!==paper;
    paper=s.paper;page={...s.page};letterI=s.letterI;numN=s.numN;board.style.background=paper;
    if(pageChanged){drawPage();drawGuide()}filled=new Set(s.filled);doneTold=s.doneTold}
  function undo(){if(pts.size)return;const s=hist.pop();if(!s){buzz();return}future.push(snap());restore(s);tone(500,.1,'triangle')}
  function redo(){if(pts.size)return;const s=future.pop();if(!s){buzz();return}hist.push(snap());restore(s);tone(650,.1,'triangle')}

  /* ---------- choosing things ---------- */
  function setColor(c,n,quiet){color=c;colorName=n;if(tool==='eraser')setTool(prevTool,true);syncBar();
    if(!quiet){if(c==='rainbow')tell('<b class="pp-rb">Rainbow!</b> <small>red, orange, yellow, green, blue, purple</small>','Rainbow! Red, orange, yellow, green, blue, purple');
      else tell(`<span class="pp-chip" style="--c:${c}"></span>${cw(n,c)}`,n,c)}}
  function setTool(t,quiet){if(t==='eraser'&&tool!=='eraser')prevTool=tool;tool=t;if(t!=='eraser'&&t!=='stamp'){lastBrush=t;stamp=null}if(t==='stamp'&&!stamp)tool=lastBrush;syncBar();
    if(!quiet){if(t==='eraser')tell('🧽 Eraser','Eraser');else{const b=BRUSHES.find(x=>x[0]===t);if(b)tell(`${b[1]} ${b[2]}`,b[2])}}}
  function setSize(s){size=s;syncBar();const n=SIZES.find(x=>x[0]===s)[1];tell(`<span class="pp-chip dot" style="--d:${Math.min(40,s)}px"></span>${n} brush`,`${n} brush`);tone(900-s*10,.1)}
  function setStamp(k,v){stamp=[k,v];tool='stamp';streak={key:'',n:0,t:0};syncBar();const inf=stampInfo();
    tell(k==='abc'?`<span class="pp-big">${v}</span> ${v} is for ${inf.letter[1]} ${inf.letter[2]}`:k==='num'?`<span class="pp-big">${v}</span> ${word(+v)}`:`${k==='shape'?cw(inf.name,ink()):inf.name}${inf.extra?` <small>${inf.extra}</small>`:''}`,
      k==='abc'?`${v} is for ${inf.letter[1]}`:k==='num'?word(+v):inf.name,k==='shape'||k==='abc'||k==='num'?(color==='rainbow'?null:color):null);tone(880,.1,'triangle')}
  function setMirror(m){mirror=m;mirrorTold=false;drawGuide();syncBar();tone(m==='off'?500:990,.2,'triangle');
    tell(m==='off'?'Mirror off':m==='two'?'🪞 Two sides match — draw on one side!':m==='four'?'🪞 Four corners match!':'❄️ Snowflake — six parts match!',
      m==='off'?'Mirror off':m==='two'?'Two sides match':m==='four'?'Four corners match':'Snowflake. Six parts match.')}
  function setPaper(c,n){if(pts.size)return;remember();paper=c;board.style.background=c;drawPage();drawGuide();tone(720,.12,'triangle');
    tell(c==='#1D1842'?'🌙 Night paper — try the 💡 glow pen!':`${n} paper`,`${n} paper`)}
  function setPage(id){if(pts.size)return;remember();
    if(id==='abc'){letterI=page.id==='abc'?(letterI+1)%26:letterI}
    if(id==='num'){numN=page.id==='num'?numN%10+1:Math.max(1,numN||1)}
    page={id,arg:0};filled=new Set();doneTold=false;cx.save();cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,cv.width,cv.height);cx.restore();drawPage();
    if(tool!=='fill'&&id!=='blank'){lastBrush='fill';setTool('fill',true)}
    tone(1200,.3,'sine',.12,0,200);
    const intro={blank:['Fresh paper!','Fresh paper!'],house:['🏠 A house made of a triangle, squares and rectangles. Tap a part with 🪣 to color it!','A house made of shapes'],
      snowman:['⛄ A snowman made of big, medium and small circles!','A snowman made of circles'],rocket:['🚀 A rocket: a rectangle, triangles and a circle!','A rocket made of shapes'],
      fish:['🐟 A fish: an oval and triangles!','A fish made of shapes'],flower:['🌼 A flower: circles, ovals and a rectangle!','A flower made of shapes']};
    if(id==='abc'){const l=LETTERS[letterI];tell(`<span class="pp-big">${l[0]}</span> ${l[0]} is for ${l[1]} ${l[2]} <small>tap 🔤 again for the next letter</small>`,`${l[0]} is for ${l[1]}`)}
    else if(id==='num')tell(`<span class="pp-big">${numN}</span> Color ${word(numN)} ${numN===1?'dot':'dots'} and count! <small>tap 🔢 again for the next number</small>`,`Color ${word(numN)} dots and count`);
    else tell(...intro[id])}
  function clearPaper(){if(pts.size)return;remember();cx.save();cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,cv.width,cv.height);cx.restore();filled=new Set();doneTold=false;tone(1200,.3,'sine',.12,0,200);tell('✨ Fresh paper!','Fresh paper!')}
  function save(){const c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;const k=c.getContext('2d');k.fillStyle=paper;k.fillRect(0,0,c.width,c.height);k.drawImage(cv,0,0);k.drawImage(lv,0,0);
    const a=document.createElement('a');a.download='wiggle-box-art-'+Date.now()+'.png';a.href=c.toDataURL('image/png');a.click();tone(920,.15,'triangle');tell('💾 Saved your picture!','Saved!')}
  function mixPick(c,n){if(!mixA||mixB){mixA=[c,n];mixB=null}else mixB=[c,n];tone(440+MIXIN.findIndex(x=>x[1]===n)*80,.12,'triangle');
    if(mixB){const key=[mixA[1],mixB[1]].sort().join('+'),res=mixA[1]===mixB[1]?[mixA[0],mixA[1]]:MIX[key];
      setColor(res[0],res[1],true);
      tell(`${cw(mixA[1],mixA[0])} + ${cw(mixB[1],mixB[0])} = ${cw(res[1],res[0])}`,mixA[1]===mixB[1]?`Still ${lc(res[1])}`:`${mixA[1]} and ${lc(mixB[1])} make ${lc(res[1])}`,res[0]);
      if(mixA[1]!==mixB[1]&&!mixFound.has(res[1])){mixFound.add(res[1]);addStar();cheer();const r=menu.getBoundingClientRect();burst(r.left+r.width/2,r.top+40,30,[res[0]])}
      renderMenu();g.later(()=>{if(openCat==='color'&&mixB)closeMenu()},1500)}
    else renderMenu()}

  /* ---------- the bar and the pop-up menus ---------- */
  function syncBar(){const sw=$s('.pp-sw');sw.classList.toggle('rainbow',color==='rainbow');sw.style.setProperty('--c',color==='rainbow'?'transparent':color);
    const bb=$s('[data-cat="brush"]');bb.querySelector('.pp-bi').textContent=(BRUSHES.find(b=>b[0]===(tool==='eraser'||tool==='stamp'?lastBrush:tool))||BRUSHES[0])[1];
    bb.querySelector('.pp-dot').style.setProperty('--d',Math.max(5,Math.min(20,size*.45))+'px');
    const si=$s('[data-cat="stamp"] .pp-bi');si.textContent=stamp?(stamp[0]==='shape'?({circle:'⚪',square:'⬛',triangle:'🔺',rectangle:'▬',star:'⭐',heart:'❤️',diamond:'🔷',oval:'🥚',pentagon:'⬟',hexagon:'⬢'}[stamp[1]]):stamp[1]):'⭐';
    $s('[data-cat="brush"]').classList.toggle('on',tool!=='eraser'&&tool!=='stamp');$s('[data-cat="stamp"]').classList.toggle('on',tool==='stamp');
    $s('[data-cat="magic"]').classList.toggle('on',mirror!=='off');
    const er=$s('#eraser');er.classList.toggle('on',tool==='eraser');er.setAttribute('aria-pressed',tool==='eraser');
    stage.querySelectorAll('.pp-bar [data-cat]').forEach(b=>b.classList.toggle('open',b.dataset.cat===openCat))}
  const opt=(attrs,inner,on,label)=>`<button class="pp-o${on?' on':''}" ${attrs} aria-label="${label}" title="${label}">${inner}</button>`;
  function renderMenu(){const c=openCat;let h='';
    if(c==='color'){h=`<h3>🖍️ Colors</h3><div class="pp-grid">${COLS.map(([v,n])=>opt(`data-col="${v}" data-n="${n}"`,`<span class="pp-swatch${v==='rainbow'?' rainbow':''}" style="--c:${v}"></span><span class="pp-ol">${n}</span>`,color===v,n)).join('')}</div>
      <h3>🥣 Mixing pot <small>tap two colors</small></h3><div class="pp-mix"><div class="pp-grid mixin">${MIXIN.map(([v,n])=>opt(`data-mix="${v}" data-n="${n}"`,`<span class="pp-swatch" style="--c:${v}"></span><span class="pp-ol">${n}</span>`,false,'Mix '+n)).join('')}</div>
      <div class="pp-eq"><span class="pp-swatch${mixA?'':' empty'}" style="--c:${mixA?mixA[0]:'transparent'}"></span>+<span class="pp-swatch${mixB?'':' empty'}" style="--c:${mixB?mixB[0]:'transparent'}"></span>=<span class="pp-swatch big${mixB?'':' empty'}" style="--c:${mixB?color:'transparent'}">${mixB?'':'?'}</span>
      <span class="pp-res">${mixB?cw(colorName,color):''}</span></div></div>`}
    else if(c==='brush'){h=`<h3>🖌️ Brushes</h3><div class="pp-grid">${BRUSHES.map(([k,i,n])=>opt(`data-tool="${k}"`,`<span class="pp-oi">${i}</span><span class="pp-ol">${n}</span>`,tool===k,n)).join('')}</div>
      <h3>📏 Size</h3><div class="pp-grid">${SIZES.map(([s,n])=>opt(`data-size="${s}"`,`<span class="pp-sdot" style="--d:${Math.min(44,s)}px"></span><span class="pp-ol">${n}</span>`,size===s,n+' brush')).join('')}</div>`}
    else if(c==='stamp'){const tabs=[['shapes','🔺','Shapes'],['animals','🐶','Animals'],['things','🌸','Things'],['abc','🔤','ABC'],['num','🔢','123']];
      h=`<h3>⭐ Stamps</h3><div class="pp-tabs">${tabs.map(([k,i,n])=>`<button class="pp-tab${stampTab===k?' on':''}" data-tab="${k}">${i} ${n}</button>`).join('')}</div><div class="pp-grid">`;
      const sv=stamp&&stamp[1];
      if(stampTab==='shapes')h+=SHAPES.map(([k,n])=>opt(`data-st="shape" data-v="${k}"`,`<svg viewBox="-50 -50 100 100" class="pp-shp"><path d="${shapeSVG(k)}"/></svg><span class="pp-ol">${n}</span>`,sv===k,n)).join('');
      if(stampTab==='animals')h+=ANIMALS.map(([e,n])=>opt(`data-st="animal" data-v="${e}"`,`<span class="pp-oi">${e}</span><span class="pp-ol">${n}</span>`,sv===e,n)).join('');
      if(stampTab==='things')h+=THINGS.map(([e,n])=>opt(`data-st="thing" data-v="${e}"`,`<span class="pp-oi">${e}</span><span class="pp-ol">${n}</span>`,sv===e,n)).join('');
      if(stampTab==='abc')h+=LETTERS.map(([l,w,e])=>opt(`data-st="abc" data-v="${l}"`,`<span class="pp-oi pp-let">${l}</span><span class="pp-ol">${e} ${w}</span>`,sv===l,`${l} is for ${w}`)).join('');
      if(stampTab==='num')h+=Array.from({length:11},(_,i)=>opt(`data-st="num" data-v="${i}"`,`<span class="pp-oi pp-let">${i}</span><span class="pp-ol">${NUMW[i]}</span>`,sv===String(i),NUMW[i])).join('');
      h+='</div>'}
    else if(c==='magic'){const M=[['off','🚫','No mirror'],['two','🪞','Two sides'],['four','✚','Four corners'],['snow','❄️','Snowflake']];
      h=`<h3>🪄 Mirror magic</h3><div class="pp-grid">${M.map(([k,i,n])=>opt(`data-mir="${k}"`,`<span class="pp-oi">${i}</span><span class="pp-ol">${n}</span>`,mirror===k,n)).join('')}</div>
      <h3>💬 Helpers</h3><div class="pp-grid">${opt('data-words',`<span class="pp-oi">💬</span><span class="pp-ol">Words ${words?'on':'off'}</span>`,words,'Words on screen')}
      ${opt('data-talk',`<span class="pp-oi">🗣️</span><span class="pp-ol">Talk ${talk?'on':'off'}</span>`,talk,'Talk out loud')}</div>`}
    else if(c==='paper'){h=`<h3>🖼️ Pictures to color</h3><div class="pp-grid">${PAGES.map(([k,i,n])=>opt(`data-page="${k}"`,`<span class="pp-oi">${i}</span><span class="pp-ol">${k==='abc'&&page.id==='abc'?'Next letter':k==='num'&&page.id==='num'?'Next number':n}</span>`,page.id===k,n)).join('')}</div>
      <h3>📄 Paper color</h3><div class="pp-grid">${PAPERS.map(([v,n])=>opt(`data-paper="${v}" data-n="${n}"`,`<span class="pp-swatch sq" style="--c:${v}"></span><span class="pp-ol">${n}</span>`,paper===v,n+' paper')).join('')}</div>
      <div class="pp-grid">${opt('id="clr"',`<span class="pp-oi">🗑️</span><span class="pp-ol">${clrArm?'Tap again!':'New paper'}</span>`,clrArm,'New paper')}${opt('id="save"','<span class="pp-oi">💾</span><span class="pp-ol">Save</span>',false,'Save picture')}</div>`}
    menu.innerHTML=h}
  function shapeSVG(k){const p={circle:'M0-40A40 40 0 1 1 0 40A40 40 0 1 1 0-40Z',square:'M-36-36H36V36H-36Z',triangle:'M0-38L42 36H-42Z',rectangle:'M-44-26H44V26H-44Z',
    diamond:'M0-44L36 0L0 44L-36 0Z',oval:'M0-28A44 28 0 1 1 0 28A44 28 0 1 1 0-28Z',heart:'M0 34C-56 0-36-48 0-18C36-48 56 0 0 34Z',
    star:Array.from({length:10},(_,i)=>{const r=i%2?17:44,a=-Math.PI/2+i*Math.PI/5;return(i?'L':'M')+(r*Math.cos(a)).toFixed(1)+' '+(r*Math.sin(a)).toFixed(1)}).join('')+'Z',
    pentagon:Array.from({length:5},(_,i)=>{const a=-Math.PI/2+i*2*Math.PI/5;return(i?'L':'M')+(42*Math.cos(a)).toFixed(1)+' '+(42*Math.sin(a)).toFixed(1)}).join('')+'Z',
    hexagon:Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return(i?'L':'M')+(42*Math.cos(a)).toFixed(1)+' '+(42*Math.sin(a)).toFixed(1)}).join('')+'Z'};return p[k]}
  let clrArm=false,clrT=0;
  function openMenu(c){if(openCat===c){closeMenu();return}openCat=c;if(c==='color'){mixA=mixB=null}clrArm=false;renderMenu();menu.hidden=false;shade.hidden=false;menu.scrollTop=0;syncBar();tone(620,.08,'triangle')}
  function closeMenu(){openCat=null;menu.hidden=true;shade.hidden=true;clrArm=false;syncBar()}
  /* Buttons act when the finger lifts on the same button, however long it was held. A toddler's slow press is a
     long press, and browsers send no click after a long press, so click alone made buttons feel broken.
     A finger that slides off (or scrolls the menu) picks nothing. Keyboard Enter/Space still works through click. */
  function presses(root,fn){let down=null;
    root.addEventListener('pointerdown',e=>{down=e.target.closest('button')});
    root.addEventListener('pointerup',e=>{const b=e.target.closest('button');if(b&&b===down&&root.contains(b))fn(b);down=null});
    root.addEventListener('pointercancel',()=>{down=null});
    root.addEventListener('click',e=>{if(e.detail===0){const b=e.target.closest('button');if(b)fn(b)}});
    root.addEventListener('contextmenu',e=>e.preventDefault())}
  presses($s('.pp-bar'),b=>{if(b.dataset.cat)openMenu(b.dataset.cat);else if(b.id==='eraser'){closeMenu();setTool(tool==='eraser'?prevTool:'eraser');tone(tool==='eraser'?380:620,.1,'triangle')}
    else if(b.id==='undo')undo();else if(b.id==='redo')redo()});
  shade.addEventListener('pointerdown',e=>{e.preventDefault();closeMenu()});
  presses(menu,b=>{const D_=b.dataset;
    if(D_.col){setColor(D_.col,D_.n);tone(330+COLS.findIndex(x=>x[0]===D_.col)*45,.15,'triangle');closeMenu()}
    else if(D_.mix)mixPick(D_.mix,D_.n);
    else if(D_.tool){setTool(D_.tool);tone(620,.1,'triangle');closeMenu()}
    else if(D_.size){setSize(+D_.size);closeMenu()}
    else if(D_.tab){stampTab=D_.tab;renderMenu();tone(700,.06,'triangle')}
    else if(D_.st){setStamp(D_.st,D_.v);closeMenu()}
    else if(D_.mir){setMirror(D_.mir);closeMenu()}
    else if('words' in D_){words=!words;if(!words)sayEl.classList.remove('show');try{localStorage.setItem('wb-paint-words',words?'on':'off')}catch(e){}renderMenu();tone(700,.08,'triangle');if(words)tell('💬 Words on')}
    else if('talk' in D_){talk=!talk;try{localStorage.setItem('wb-paint-talk',talk?'on':'off')}catch(e){};if(!talk)try{speechSynthesis.cancel()}catch(e){};renderMenu();tone(700,.08,'triangle');tell(talk?'🗣️ Talking on':'Talking off',talk?'Talking on':null)}
    else if(D_.page){setPage(D_.page);closeMenu()}
    else if(D_.paper){setPaper(D_.paper,D_.n);closeMenu()}
    else if(b.id==='clr'){if(!clrArm){clrArm=true;renderMenu();tone(500,.1,'triangle');clearTimeout(clrT);clrT=g.later(()=>{clrArm=false;if(openCat==='paper')renderMenu()},3000)}else{clrArm=false;clearPaper();closeMenu()}}
    else if(b.id==='save'){save();closeMenu()}});

  /* ---------- touch input ---------- */
  const pos=e=>{const r=board.getBoundingClientRect();return[Math.max(0,Math.min(W,e.clientX-r.left)),Math.max(0,Math.min(H,e.clientY-r.top))]};
  function movePoint(e){const p=pts.get(e.pointerId);if(!p||p.kind==='fill')return;
    const evs=typeof e.getCoalescedEvents==='function'?e.getCoalescedEvents():[];
    for(const s of evs.length?evs:[e]){const [x,y]=pos(s);
      if(p.kind==='stamp'){const dist=Math.hypot(x-p.x,y-p.y),stepD=size*2.4+24;if(dist>=stepD){const n=Math.min(100,Math.floor(dist/stepD));for(let j=1;j<=n;j++)stampAt(p.x+(x-p.x)*j/n,p.y+(y-p.y)*j/n);p.x=x;p.y=y}}
      else{segment(p.x,p.y,x,y);p.x=x;p.y=y;if(p.path.length<4000)p.path.push([x,y])}}}
  cv.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();
    if(openCat){closeMenu();return}
    try{cv.setPointerCapture(e.pointerId)}catch(err){}
    const [x,y]=pos(e);
    if(tool==='fill'){if(pts.size)return;remember();pts.set(e.pointerId,{kind:'fill'});fillAt(x,y);return}
    if(!pts.size)remember();
    const kind=tool==='stamp'&&stamp?'stamp':'draw';pts.set(e.pointerId,{x,y,kind,path:[[x,y]]});
    if(kind==='stamp')stampAt(x,y);else dab(x,y)});
  cv.addEventListener('pointermove',e=>{if(pts.has(e.pointerId)){e.preventDefault();movePoint(e)}});
  const end=e=>{const p=pts.get(e.pointerId);if(!p)return;if(e.type==='pointerup')movePoint(e);pts.delete(e.pointerId);
    if(p.kind==='draw'&&tool!=='eraser'&&e.type!=='pointercancel')describe(p.path)};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);cv.addEventListener('lostpointercapture',end);
  g.onEnd(()=>{pts.clear();try{speechSynthesis.cancel()}catch(e){}});

  /* ---------- keyboard ---------- */
  g.keyFirst(e=>{if(e.key==='Escape'&&openCat){closeMenu();return true}return false});
  g.key(e=>{const k=e.key.toLowerCase();
    if(/^[1-9]$/.test(k)){const c=COLS[+k-1];if(c){setColor(c[0],c[1]);return true}}
    if((e.ctrlKey||e.metaKey)&&k==='z'){e.shiftKey?redo():undo();return true}
    if(k==='z'||k==='backspace'||k==='u'){undo();return true}if(k==='y'){redo();return true}
    if(k==='m'){const M=['off','two','four','snow'];setMirror(M[(M.indexOf(mirror)+1)%4]);return true}
    if(k==='e'||k==='0'){setTool(tool==='eraser'?prevTool:'eraser');return true}if(k==='f'){setTool('fill');return true}
    const si=SIZES.findIndex(x=>x[0]===size);
    if(k==='['||k==='-'){setSize(SIZES[Math.max(0,si-1)][0]);return true}if(k===']'||k==='='||k==='+'){setSize(SIZES[Math.min(SIZES.length-1,si+1)][0]);return true}
    return false});

  board.style.background=paper;syncBar();resize();
  g.later(()=>tell('🎨 Draw anything! Tap the buttons below for colors, brushes and stamps.'),400);

  /* test hook: read the picture as the child sees it (paper + ink + outlines) */
  GAMES.paint._debug={
    pixel(x,y){const i=[Math.floor(x*D),Math.floor(y*D)],a=cx.getImageData(i[0],i[1],1,1).data,l=lx.getImageData(i[0],i[1],1,1).data,p=hexRGB(paper);
      const m=(u,v,t)=>u*(1-t)+v*t;let c=[0,1,2].map(j=>m(p[j],a[j],a[3]/255));c=[0,1,2].map(j=>Math.round(m(c[j],l[j],l[3]/255)));return c},
    get state(){return{color,colorName,tool,size,stamp,mirror,paper,page:{...page},letterI,numN,openCat,hist:hist.length,future:future.length,filled:filled.size,parts:parts.length,words,talk,mixFound:[...mixFound]}},
    get caption(){return sayEl.textContent},
    partCenters(){return parts.map((p,i)=>{const own=[];
      for(let y=2;y<H;y+=3)for(let x=2;x<W;x+=3){const k=partAt(x,y);if(k===i&&lx.getImageData(Math.floor(x*D),Math.floor(y*D),1,1).data[3]===0)own.push([x,y])}
      if(!own.length)return{name:p.name,count:p.count,pt:null};const mx=own.reduce((a,q)=>a+q[0],0)/own.length,my=own.reduce((a,q)=>a+q[1],0)/own.length;
      own.sort((a,b)=>Math.hypot(a[0]-mx,a[1]-my)-Math.hypot(b[0]-mx,b[1]-my));return{name:p.name,count:p.count,pt:own[0]}})},
    get W(){return W},get H(){return H}};
}}
});
