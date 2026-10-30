/* ============================================================
   ELEMENT BOX — falling-sand chemistry with discoveries
   ============================================================ */
Object.assign(GAMES,{sand:{title:'Element Box',icon:'🌋',c:'var(--tang)',age:'3+',section:'lab',order:3,blurb:'Sand, lava, fire and seeds. Discover what they make!',
init(stage,g){
  const EMPTY=0,SAND=1,WATER=2,STONE=3,WOOD=4,FIRE=5,LAVA=6,STEAM=7,PLANT=8,SEED=9,FLOWER=10,ICE=11,SNOW=12,OIL=13,SMOKE=14,CLOUD=15,GLASS=16,FISH=17,BUG=18,STEM=19,EMBER=20,ERASE=99;
  const PALETTE=[[SAND,'Sand','#F2C86B'],[WATER,'Water','#3D7BFF'],[STONE,'Stone','#8A8FA8'],[WOOD,'Wood','#A8693A'],[FIRE,'Fire','#FF8A2B'],[LAVA,'Lava','#FF4F1F'],
    [ICE,'Ice','#BDEFFF'],[SNOW,'Snow','#FFFFFF'],[OIL,'Oil','#4A3420'],[SEED,'Seeds','#8B5A2B'],[PLANT,'Plant','#2FBF5B'],[CLOUD,'Rain cloud','#E9EDFF'],[STEAM,'Steam','#C9D6FF'],
    [FISH,'Fish','🐟'],[BUG,'Ladybug','🐞'],[ERASE,'Eraser','🧽']];
  const DISC=[
    ['stone','Lava + Water = Stone','Lava and water make stone!','What happens when lava touches water?'],
    ['steam','Fire + Water = Steam','Water puts out fire and makes steam!','Can water stop fire?'],
    ['glass','Sand + Lava = Glass','Hot lava melts sand into glass!','What does lava do to sand?'],
    ['flower','Seed + Water = Flower','Seeds need water to grow into flowers!','How do you make a seed grow?'],
    ['grow','Plant + Water = Bigger plant','Plants drink water and grow!','What do plants need?'],
    ['melt','Ice + Heat = Water','Heat melts ice into water!','What melts ice?'],
    ['freeze','Ice + Water = More ice','Ice is so cold it freezes water!','What does ice do to water?'],
    ['rain','Steam = Rain','Steam floats up, cools down and turns into rain. That is the water cycle!','Where does steam go?'],
    ['burn','Wood + Fire = Ash and smoke','Wood burns!','What burns?'],
    ['oil','Oil + Fire = Big flames','Oil burns really fast!','Try fire on oil.'],
    ['float','Oil floats on water','Oil is lighter than water, so it floats on top!','What floats on water?']];
  const SCENES=[['volcano','🌋','Volcano'],['garden','🌻','Garden'],['winter','⛄','Winter'],['tank','🐠','Fish tank'],['empty','🧹','Empty']];
  stage.innerHTML=`<div class="simwrap"><div class="simarea"><canvas class="simcv" aria-label="Element sandbox"></canvas><div class="simhint" id="hint"></div>
      <button class="discbtn" id="discbtn">🔬 <span id="dcount">0</span>/${DISC.length}</button><div class="discpanel" id="disc" hidden></div></div>
    <div class="dock"><div class="drow wrap els" id="els">${PALETTE.map(p=>`<button class="opt" data-e="${p[0]}">${p[2].startsWith('#')?`<span class="odot" style="background:${p[2]}"></span>`:`<span class="oe">${p[2]}</span>`}${p[1]}</button>`).join('')}</div>
      <div class="drow" id="tools"><button class="tool" data-b="1"><span class="ti"><span class="dot" style="width:10px;height:10px"></span></span>Small</button><button class="tool" data-b="2"><span class="ti"><span class="dot" style="width:18px;height:18px"></span></span>Medium</button><button class="tool" data-b="3"><span class="ti"><span class="dot" style="width:26px;height:26px"></span></span>Big</button>
      <span class="sep"></span><button class="tool" id="pause"><span class="ti">⏸️</span>Freeze</button><span class="sep"></span>
      <button class="tool scene" id="scenes" aria-haspopup="menu"><span class="ti">🎬</span>Scenes<span class="caret">▾</span></button></div></div></div>`;
  const cv=stage.querySelector('canvas'),ctx=cv.getContext('2d'),hintEl=stage.querySelector('#hint'),discEl=stage.querySelector('#disc');
  const EQ={stone:['Lava cools','lava + H₂O → rock + steam','Melted rock is 1,200 °C. Water cools it so fast it turns solid.'],
    steam:['Boiling','H₂O (liquid) → H₂O (gas)','Water boils at 100 °C.'],
    glass:['Making glass','SiO₂ (sand) + heat → glass','Sand melts at about 1,700 °C.'],
    flower:['Photosynthesis','6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂','Plants make sugar from air, water and sunlight, and give us oxygen.'],
    grow:['Plants drink','roots pull up H₂O','Water travels up the stem to every leaf.'],
    melt:['Melting','H₂O (solid) → H₂O (liquid)','Ice melts at 0 °C.'],
    freeze:['Freezing','H₂O (liquid) → H₂O (solid)','Below 0 °C water freezes. Ice takes up more room than water.'],
    rain:['The water cycle','evaporate → condense → rain','Steam cools high up and falls back down as rain.'],
    burn:['Burning wood','C₆H₁₀O₅ + 6O₂ → 6CO₂ + 5H₂O','Burning needs fuel, heat and oxygen. Take one away and the fire goes out.'],
    oil:['Burning oil','oil (C and H) + O₂ → CO₂ + H₂O + heat','Oil is made of hydrogen and carbon. It holds lots of stored energy, so it burns fast and hot.'],
    float:['Floating','oil ρ = 0.9 &lt; water ρ = 1.0','The lighter liquid always ends up on top.']};
  const eqLog=[];
  const ov=fxOverlay(stage.querySelector('.simarea'));
  function ovUpdate(){ov.set((eqLog.length?eqLog.slice(-3).reverse().map(k=>{const e=EQ[k];return `<div class="fx ${k===eqLog[eqLog.length-1]?'hot':''}"><span class="tag">${e[0]}</span><div class="row">${e[1]}</div><div class="row note">${e[2]}</div></div>`}).join('')
      :'<div class="fx hot"><span class="tag">Chemistry</span><div class="row">Mix things and watch for a reaction. Its equation shows up here.</div></div>')+
      '<div class="fx"><span class="tag">Reading an equation</span><div class="row">what you start with → what you get</div><div class="row note">Atoms never disappear. They just swap partners.</div></div>')}
  ovUpdate();
  const hint=makeHint(hintEl);
  let dims=fitCanvas(cv),cs,cols,rows,N,T,Sh,L,C,img,buf,gcv,gctx,glowImg,glowBuf,glowCv,glowCtx;
  let cur=SAND,brush=2,paused=false,tick=1,frame=0;
  const found=new Set();
  function grid(){
    cs=clamp(Math.round(Math.sqrt(dims.w*dims.h/42000)),3,7);const nc=Math.ceil(dims.w/cs),nr=Math.ceil(dims.h/cs);
    const old=T?{T,Sh,L,cols,rows}:null;cols=nc;rows=nr;N=cols*rows;
    T=new Uint8Array(N);Sh=new Uint8Array(N);L=new Uint8Array(N);C=new Uint8Array(N);
    if(old){for(let y=0;y<Math.min(rows,old.rows);y++)for(let x=0;x<Math.min(cols,old.cols);x++){const a=(old.rows-1-y)*old.cols+x,b=(rows-1-y)*cols+x;T[b]=old.T[a];Sh[b]=old.Sh[a];L[b]=old.L[a]}}
    gcv=document.createElement('canvas');gcv.width=cols;gcv.height=rows;gctx=gcv.getContext('2d');img=gctx.createImageData(cols,rows);buf=new Uint32Array(img.data.buffer);
    glowCv=document.createElement('canvas');glowCv.width=cols;glowCv.height=rows;glowCtx=glowCv.getContext('2d');glowImg=glowCtx.createImageData(cols,rows);glowBuf=new Uint32Array(glowImg.data.buffer);
  }
  grid();
  const rnd=Math.random;
  const set=(i,t,l)=>{T[i]=t;L[i]=l||0;if(t!==FLOWER&&t!==STEM)Sh[i]=(rnd()*255)|0;C[i]=tick};
  const GAS=t=>t===STEAM||t===SMOKE||t===FIRE;
  const DENS=[0,4,2,9,9,0,3,0,9,4,9,9,1.5,1,0,9,9,2.5,4,9,9];
  const canSink=(t,d)=>t===EMPTY||GAS(t)||((t===WATER||t===OIL||t===LAVA)&&DENS[t]<d);
  function mv(i,j){const t=T[j],s=Sh[j],l=L[j];T[j]=T[i];Sh[j]=Sh[i];L[j]=L[i];T[i]=t;Sh[i]=s;L[i]=l;C[j]=tick;
    if(T[j]===WATER&&t===OIL)discover('float',j)}
  function powder(i,x,y,d){
    if(y>=rows-1)return false;const b=i+cols;if(canSink(T[b],d)){mv(i,b);return true}
    const s=rnd()<.5?-1:1;for(const dx of [s,-s]){const nx=x+dx;if(nx<0||nx>=cols)continue;if(canSink(T[b+dx],d)&&canSink(T[i+dx],d)){mv(i,b+dx);return true}}
    return false}
  function liquid(i,x,y,d,disp){
    if(y<rows-1){const b=i+cols;if(canSink(T[b],d)){mv(i,b);return true}
      const s=rnd()<.5?-1:1;for(const dx of [s,-s]){const nx=x+dx;if(nx<0||nx>=cols)continue;if(canSink(T[b+dx],d)){mv(i,b+dx);return true}}}
    const s=rnd()<.5?-1:1;for(const dx of [s,-s]){let j=i;for(let k=1;k<=disp;k++){const nx=x+dx*k;if(nx<0||nx>=cols)break;const q=i+dx*k;if(T[q]===EMPTY||GAS(T[q]))j=q;else break}if(j!==i){mv(i,j);return true}}
    return false}
  function gas(i,x,y){
    if(y>0){const r=rnd(),dx=r<.3?-1:r<.6?1:0,nx=x+dx;if(nx>=0&&nx<cols){const j=i-cols+dx,t=T[j];if(t===EMPTY||((t===WATER||t===OIL)&&rnd()<.2)){mv(i,j);return true}}}
    const dx=rnd()<.5?-1:1,nx=x+dx;if(nx>=0&&nx<cols&&T[i+dx]===EMPTY&&rnd()<.5){mv(i,i+dx);return true}return false}
  const NB=[0,0,0,0];
  function nbrs(i,x,y){NB[0]=y>0?i-cols:-1;NB[1]=y<rows-1?i+cols:-1;NB[2]=x>0?i-1:-1;NB[3]=x<cols-1?i+1:-1;return NB}
  /* discoveries */
  const sx=x=>x*cs,sy=y=>y*cs;
  function discover(k,i){if(found.has(k))return;found.add(k);eqLog.push(k);ovUpdate();const d=DISC.find(q=>q[0]===k);if(!d)return;
    const r=cv.getBoundingClientRect(),x=(i%cols)*cs,y=((i/cols)|0)*cs;floaty(stage,r.left+x,r.top+y-30,d[1]);say(d[2]);addStar();
    tone(660,.15,'triangle');tone(990,.25,'triangle',.18,.12);stage.querySelector('#dcount').textContent=found.size;drawDisc();
    if(found.size===DISC.length)g.later(()=>{cheer();party();say('You found every discovery! You are a real scientist!')},2500)}
  function drawDisc(){discEl.innerHTML=`<h3>Discoveries</h3><ul>${DISC.map(d=>`<li class="${found.has(d[0])?'got':''}">${found.has(d[0])?'✅ '+d[1]:'❓ '+d[3]}</li>`).join('')}</ul><button class="pbtn" id="dclose">Close</button>`}
  drawDisc();
  stage.querySelector('#discbtn').addEventListener('click',()=>{discEl.hidden=!discEl.hidden;tone(600,.08,'triangle')});
  discEl.addEventListener('click',e=>{if(e.target.id==='dclose'){discEl.hidden=true}});
  /* the discoveries list closes when you tap anywhere else */
  g.listen(stage,'pointerdown',e=>{if(!discEl.hidden&&!discEl.contains(e.target)&&!e.target.closest('#discbtn'))discEl.hidden=true},true);

  /* ---------- one step ---------- */
  function step(){
    tick=tick%255+1;frame++;
    for(let y=rows-1;y>=0;y--){const ltr=(y+frame)&1;
      for(let k=0;k<cols;k++){const x=ltr?k:cols-1-k,i=y*cols+x,t=T[i];if(!t||C[i]===tick)continue;
        switch(t){
          case SAND:powder(i,x,y,4);break;
          case SEED:{if(powder(i,x,y,4))break;const n=nbrs(i,x,y);let w=-1;for(const j of n)if(j>=0&&T[j]===WATER){w=j;break}
            if(w<0&&y<rows-2){const b2=i+cols*2;if(T[b2]===WATER)w=b2}
            if(w>=0&&rnd()<.06){set(w,EMPTY);T[i]=STEM;L[i]=8+(rnd()*16|0);Sh[i]=(rnd()*255)|0;C[i]=tick;discover('flower',i)}break}
          case SNOW:{if(rnd()<.55){if(!powder(i,x,y,1.5)&&rnd()<.1){const dx=rnd()<.5?-1:1;if(x+dx>=0&&x+dx<cols&&T[i+dx]===EMPTY)mv(i,i+dx)}}
            const n=nbrs(i,x,y);for(const j of n)if(j>=0&&T[j]===WATER&&rnd()<.004){set(i,WATER);break}break}
          case WATER:liquid(i,x,y,2,4);break;
          case OIL:{if(!liquid(i,x,y,1,3)&&y<rows-1&&T[i+cols]===WATER&&rnd()<.02)discover('float',i);break}
          case LAVA:{const n=nbrs(i,x,y);let done=false;
            for(const j of n){if(j<0)continue;const q=T[j];
              if(q===WATER){set(i,STONE);set(j,STEAM,60+(rnd()*60|0));discover('stone',i);done=true;break}
              if(q===WOOD||q===PLANT||q===STEM||q===FLOWER||q===SEED||q===OIL){if(rnd()<.1){if(q===WOOD){set(j,EMBER,160+(rnd()*90|0));discover('burn',j)}else set(j,FIRE,30+(rnd()*30|0))}}
              else if(q===SAND&&rnd()<.004){set(j,GLASS);discover('glass',j)}
              else if((q===ICE||q===SNOW)&&rnd()<.08){set(j,WATER);discover('melt',j)}}
            if(done)break;if(y>0&&T[i-cols]===EMPTY&&rnd()<.0015)set(i-cols,SMOKE,40);
            if(frame&1)liquid(i,x,y,3,1);break}
          case FIRE:{if(L[i]>0)L[i]--;if(L[i]===0){if(rnd()<.35)set(i,SMOKE,30+(rnd()*30|0));else set(i,EMPTY);break}
            const n=nbrs(i,x,y);let out=false;
            for(const j of n){if(j<0)continue;const q=T[j];
              if(q===WATER){set(i,STEAM,70);if(rnd()<.5)set(j,STEAM,70);discover('steam',i);out=true;break}
              if(q===WOOD&&rnd()<.05){set(j,EMBER,160+(rnd()*90|0));discover('burn',j)}
              else if((q===PLANT||q===STEM||q===FLOWER||q===SEED)&&rnd()<.1)set(j,FIRE,25+(rnd()*20|0));
              else if(q===OIL&&rnd()<.45){set(j,FIRE,25+(rnd()*25|0));discover('oil',j)}
              else if((q===ICE||q===SNOW)&&rnd()<.15){set(j,WATER);discover('melt',j)}}
            if(out)break;
            if(rnd()<.55)gas(i,x,y);break}
          case EMBER:{if(L[i]>0)L[i]--;if(L[i]===0){set(i,rnd()<.5?SMOKE:EMPTY,40);break}
            if(y>0&&T[i-cols]===EMPTY&&rnd()<.35)set(i-cols,FIRE,10+(rnd()*25|0));
            const n=nbrs(i,x,y);for(const j of n){if(j<0)continue;const q=T[j];
              if(q===WATER){set(i,STEAM,60);set(j,STEAM,60);discover('steam',i);break}
              if(q===WOOD&&rnd()<.006)set(j,EMBER,160+(rnd()*90|0));
              else if((q===ICE||q===SNOW)&&rnd()<.08){set(j,WATER);discover('melt',j)}
              else if((q===PLANT||q===OIL||q===SEED)&&rnd()<.1)set(j,FIRE,30)}
            break}
          case STEAM:{if(L[i]>0)L[i]--;if(L[i]===0||(y<2&&rnd()<.02)){if(rnd()<.5){set(i,WATER);if(y<rows*.5)discover('rain',i)}else set(i,EMPTY);break}gas(i,x,y);break}
          case SMOKE:{if(L[i]>0)L[i]--;if(L[i]===0){set(i,EMPTY);break}if(rnd()<.8)gas(i,x,y);break}
          case PLANT:{if(rnd()<.03){const n=nbrs(i,x,y),j=n[(rnd()*4)|0];if(j>=0&&T[j]===WATER){const jx=j%cols;let pn=0;for(const o of [j-cols,j+cols,jx>0?j-1:-1,jx<cols-1?j+1:-1])if(o>=0&&o<N&&T[o]===PLANT)pn++;if(pn<=1){set(j,PLANT);discover('grow',j)}}}break}
          case STEM:{if(rnd()<.2){const h=L[i],hue=Sh[i];
              if(h>0&&y>1){let j=i-cols;const r=rnd();if(r<.2&&x>0)j--;else if(r<.4&&x<cols-1)j++;
                if(T[j]===EMPTY||T[j]===WATER){T[j]=STEM;L[j]=h-1;Sh[j]=hue;C[j]=tick;T[i]=PLANT;L[i]=0;
                  if(rnd()<.18){const sd=rnd()<.5?-1:1;if(x+sd>=0&&x+sd<cols&&T[i+sd]===EMPTY)set(i+sd,PLANT)}}
                else L[i]=0}
              else{T[i]=FLOWER;L[i]=1;
                for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){if(Math.abs(dx)+Math.abs(dy)>2||(!dx&&!dy))continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;const j=ny*cols+nx;
                  if(T[j]===EMPTY||T[j]===WATER){T[j]=FLOWER;Sh[j]=hue;L[j]=Math.abs(dx)+Math.abs(dy)===1?2:3;C[j]=tick}}}}break}
          case ICE:{if(rnd()<.01){const n=nbrs(i,x,y),j=n[(rnd()*4)|0];if(j>=0&&T[j]===WATER&&rnd()<.25){const up=j>=cols?T[j-cols]:EMPTY;/* ponds freeze from the top down */if(up===EMPTY||up===ICE||up===SNOW){set(j,ICE);discover('freeze',j)}}}break}
          case CLOUD:{if(y<rows-1&&T[i+cols]===EMPTY&&rnd()<.012)set(i+cols,WATER);break}
          case FISH:{const n=nbrs(i,x,y);let wet=0;for(const j of n)if(j>=0&&T[j]===WATER)wet++;
            if(wet){if(rnd()<.35){const dir=L[i]&1?1:-1,opts=[i+dir,i+dir,i-cols,i+cols,i-cols+dir,i+cols+dir];const j=opts[(rnd()*opts.length)|0];
                const jx=j%cols;if(j>=0&&j<N&&Math.abs(jx-x)<=1&&T[j]===WATER){mv(i,j)}else if(rnd()<.3)L[i]^=1}}
            else if(!powder(i,x,y,4)&&rnd()<.03&&y>1){const dx=rnd()<.5?-1:1;const j=i-cols+dx;if(x+dx>=0&&x+dx<cols&&T[j]===EMPTY)mv(i,j)}break}
          case BUG:{if(y<rows-1){const b=i+cols;if(T[b]===EMPTY||GAS(T[b])){mv(i,b);break}if(T[b]===WATER||T[b]===OIL){if(y>0&&(T[i-cols]===WATER||T[i-cols]===OIL)){mv(i,i-cols);break}}}
            if(rnd()<.25){const dir=L[i]&1?1:-1,nx=x+dir;if(nx<0||nx>=cols){L[i]^=1;break}const j=i+dir;
              if(T[j]===EMPTY)mv(i,j);else if(y>0&&T[j-cols]===EMPTY&&T[i-cols]===EMPTY)mv(i,j-cols);else L[i]^=1}break}
        }
      }}
  }

  /* ---------- colors ---------- */
  const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const pack=(r,g2,b,a=255)=>(a<<24)|(clamp(b|0,0,255)<<16)|(clamp(g2|0,0,255)<<8)|clamp(r|0,0,255);
  const BASE={[SAND]:'#F2C86B',[WATER]:'#3D7BFF',[STONE]:'#8A8FA8',[WOOD]:'#A8693A',[STEAM]:'#C9D6FF',[PLANT]:'#2FBF5B',[SEED]:'#8B5A2B',[ICE]:'#BDEFFF',[SNOW]:'#FFFFFF',
    [OIL]:'#4A3420',[SMOKE]:'#6B6B80',[CLOUD]:'#E9EDFF',[GLASS]:'#9FE8F0',[FISH]:'#FF8A2B',[BUG]:'#FF4F5E',[STEM]:'#249E48'};
  const VAR={[SAND]:28,[STONE]:26,[WOOD]:22,[PLANT]:30,[SEED]:20,[ICE]:14,[SNOW]:6,[OIL]:12,[CLOUD]:10,[GLASS]:20,[STEAM]:14,[SMOKE]:20,[WATER]:5,[STEM]:16};
  const PAL={};for(const k in BASE){const c=hex(BASE[k]),v=VAR[k]||0;PAL[k]=new Uint32Array(16);for(let s=0;s<16;s++){const f=(s/15-.5)*v;PAL[k][s]=pack(c[0]+f,c[1]+f,c[2]+f,k==STEAM?190:k==SMOKE?150:255)}}
  PAL[WOOD]=PAL[WOOD].map((c,s)=>s%5===0?pack(140,82,40):c);
  const FLOWERC=[];for(let h=0;h<64;h++){const a=h/64*6.283;FLOWERC.push([pack(200+55*Math.cos(a),120+100*Math.cos(a+2.1),160+95*Math.cos(a+4.2)),pack(255,220,80)])}
  const FIREC=[pack(255,240,150),pack(255,200,60),pack(255,140,40),pack(255,90,30),pack(220,50,30)];
  function render(){
    const cr=[];
    for(let i=0;i<N;i++){const t=T[i];if(!t){buf[i]=0;glowBuf[i]=0;continue}let c;glowBuf[i]=0;
      switch(t){
        case FIRE:c=FIREC[clamp((4-L[i]/16+rnd()*1.6)|0,0,4)];glowBuf[i]=c;break;
        case LAVA:{const w=Math.sin(frame*.06+(i%cols)*.3+((i/cols)|0)*.2)*.5+.5;c=pack(255,70+w*120+(Sh[i]&31),20+w*30);glowBuf[i]=pack(255,90,20);break}
        case WATER:{const w=Math.sin(frame*.07+(i%cols)*.21+((i/cols)|0)*.13+Sh[i]*.03);c=w>.985?pack(150,200,255):PAL[WATER][Sh[i]>>4];break}
        case EMBER:{const w=Math.sin(frame*.15+i)*.5+.5;c=pack(200+w*55,60+w*70+(Sh[i]&15),20);glowBuf[i]=pack(255,80,20);break}
        case FLOWER:c=FLOWERC[Sh[i]>>2][L[i]===1?1:0];if(L[i]===3)c=FLOWERC[(Sh[i]>>2)][0];break;
        case FISH:case BUG:c=0;cr.push(i);break;
        case GLASS:c=PAL[GLASS][(Sh[i]+frame)>>4&15];break;
        default:c=PAL[t][Sh[i]>>4]}
      buf[i]=c}
    gctx.putImageData(img,0,0);glowCtx.putImageData(glowImg,0,0);
    ctx.setTransform(dims.d,0,0,dims.d,0,0);ctx.drawImage(bg,0,0,dims.w,dims.h);
    ctx.imageSmoothingEnabled=false;ctx.drawImage(gcv,0,0,cols*cs,rows*cs);
    {const sm=glowSm,sw=Math.max(1,cols>>2),sh=Math.max(1,rows>>2);if(sm.width!==sw||sm.height!==sh){sm.width=sw;sm.height=sh}const sx=sm.getContext('2d');sx.clearRect(0,0,sw,sh);sx.imageSmoothingEnabled=true;sx.drawImage(glowCv,0,0,sw,sh);
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.6;ctx.imageSmoothingEnabled=true;ctx.drawImage(sm,0,0,cols*cs,rows*cs);ctx.restore()}
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${Math.max(26,cs*6)}px serif`;
    for(const i of cr){const x=(i%cols+.5)*cs,y=((i/cols|0)+.5)*cs;ctx.save();ctx.translate(x,y-cs*1.2);if(T[i]===FISH&&(L[i]&1))ctx.scale(-1,1);ctx.fillText(T[i]===FISH?'🐟':'🐞',0,0);ctx.restore()}
    for(const f of fmap.values()){ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(f.x,f.y,radius()*cs,0,7);ctx.stroke();ctx.setLineDash([])}
  }
  const bg=document.createElement('canvas'),glowSm=document.createElement('canvas');
  function drawBg(){bg.width=cv.width;bg.height=cv.height;const b=bg.getContext('2d');b.setTransform(dims.d,0,0,dims.d,0,0);const gr=b.createLinearGradient(0,0,0,dims.h);
    gr.addColorStop(0,'#241D5C');gr.addColorStop(1,'#3B2F86');b.fillStyle=gr;b.fillRect(0,0,dims.w,dims.h);
    for(let i=0;i<60;i++){b.fillStyle=`rgba(255,255,255,${.15+(i%5)*.08})`;const x=(i*157)%dims.w,y=(i*97)%(dims.h*.7);b.fillRect(x,y,2,2)}}
  drawBg();

  /* ---------- painting ---------- */
  const radius=()=>[0,1.6,3.6,6.5][brush]*Math.max(1,6/cs*.8);
  let critterTick=0;
  function paintAt(px,py){const cx=px/cs,cy=py/cs,r=radius();
    if(cur===FISH||cur===BUG){if(critterTick>0)return;critterTick=8;const x=cx|0,y=cy|0;if(x<0||y<0||x>=cols||y>=rows)return;const i=y*cols+x;
      let count=0;for(let k=0;k<N;k++)if(T[k]===FISH||T[k]===BUG)count++;if(count>=40)return;
      if(T[i]===EMPTY||T[i]===WATER){set(i,cur,rnd()<.5?1:0);pop(1.3)}return}
    const dense=(cur===SAND||cur===SNOW||cur===SEED||cur===WATER||cur===OIL)?(cur===SEED?.04:.45):1;
    for(let y=Math.max(0,(cy-r)|0);y<=Math.min(rows-1,(cy+r)|0);y++)for(let x=Math.max(0,(cx-r)|0);x<=Math.min(cols-1,(cx+r)|0);x++){
      if((x-cx)**2+(y-cy)**2>r*r)continue;const i=y*cols+x;
      if(cur===ERASE){T[i]=EMPTY;continue}
      if(T[i]!==EMPTY&&!(cur===STONE||cur===WOOD||cur===ICE||cur===CLOUD||cur===GLASS))continue;
      if(T[i]!==EMPTY&&(T[i]===FISH||T[i]===BUG))continue;
      if(rnd()>dense)continue;
      set(i,cur,cur===FIRE?30+(rnd()*40|0):cur===STEAM?80+(rnd()*80|0):0)}
  }
  let sndT=0;
  const fmap=fingers(cv,{down(f){f.data.lx=f.x;f.data.ly=f.y;paintAt(f.x,f.y);elSound()},move(f){
    const dx=f.x-f.data.lx,dy=f.y-f.data.ly,d=Math.hypot(dx,dy),st=Math.max(1,Math.ceil(d/(cs*2)));for(let k=1;k<=st;k++)paintAt(f.data.lx+dx*k/st,f.data.ly+dy*k/st);f.data.lx=f.x;f.data.ly=f.y}});
  function elSound(){if(sndT>0)return;sndT=5;
    const s={[SAND]:()=>noise(.1,3000,1,.06),[WATER]:()=>noise(.12,900+rnd()*900,2,.08),[FIRE]:()=>noise(.15,400,.6,.12),[LAVA]:()=>{noise(.2,200,.8,.12);tone(60,.2,'sine',.08)},
      [STONE]:()=>noise(.06,600,3,.08),[WOOD]:()=>tone(200,.06,'triangle',.08),[ICE]:()=>tone(2200,.06,'sine',.05),[SNOW]:()=>noise(.1,5000,1,.04),[OIL]:()=>noise(.12,400,3,.06),
      [SEED]:()=>tone(900,.05,'sine',.06),[PLANT]:()=>tone(500,.08,'sine',.06,0,700),[CLOUD]:()=>noise(.2,1200,.5,.05),[STEAM]:()=>noise(.2,2500,.5,.05),[ERASE]:()=>noise(.1,1800,1,.06,0,400)}[cur];
    s&&s()}

  /* ---------- UI ---------- */
  function syncUI(){stage.querySelectorAll('[data-e]').forEach(b=>b.classList.toggle('on',+b.dataset.e===cur));stage.querySelectorAll('[data-b]').forEach(b=>b.classList.toggle('on',+b.dataset.b===brush))}
  stage.querySelector('#els').addEventListener('click',e=>{const b=e.target.closest('[data-e]');if(!b)return;cur=+b.dataset.e;syncUI();say(PALETTE.find(p=>p[0]===cur)[1]);tone(600,.08,'triangle')});
  stage.querySelector('#tools').addEventListener('click',e=>{const b=e.target.closest('.tool');if(!b)return;
    if(b.dataset.b){brush=+b.dataset.b;syncUI();tone(300+brush*150,.08,'triangle');return}
    if(b.id==='pause'){paused=!paused;b.classList.toggle('on',paused);b.innerHTML=paused?'<span class="ti">▶️</span>Play':'<span class="ti">⏸️</span>Freeze';return}
    if(b.id==='scenes'){popMenu(b,`<div class="popgrid">${SCENES.map(t=>`<button class="popitem" data-s="${t[0]}"><span class="pe">${t[1]}</span>${t[2]}</button>`).join('')}</div>`,x=>scene(x.dataset.s));return}});
  syncUI();

  /* ---------- scenes ---------- */
  function fillShape(test,t,density=1,life=0){for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){if(test(x/cols,y/rows,x,y)&&rnd()<density)set(y*cols+x,t,life)}}
  let sceneId=0;
  function scene(k){
    T.fill(0);L.fill(0);const my=++sceneId;
    if(k==='volcano'){fillShape((x,y)=>y>.9,SAND);fillShape((x,y)=>y>.4&&Math.abs(x-.6)<(y-.32)*.55&&y<=.9,STONE);fillShape((x,y)=>Math.abs(x-.6)<.035&&y>.45&&y<.86,LAVA);
      fillShape((x,y)=>y>.34&&y<.46&&Math.abs(x-.6)<.06,LAVA);fillShape((x,y)=>x<.28&&y>.7&&y<=.9,WATER);fillShape((x,y)=>x>.9&&y>.75&&y<=.9,WOOD);
      hint('Lava flows down to the water. Watch!');say('A volcano! What happens when lava touches water?')}
    if(k==='garden'){fillShape((x,y)=>y>.82,SAND);fillShape((x,y)=>y>.8&&y<=.82&&rnd()<.5,SEED,.08);const asp=cols/rows,puff=(cx,cy,r)=>(x,y)=>((x-cx)*asp)**2+(y-cy)**2<r*r;for(const [cx0,w] of [[.12,.24],[.56,.3]])for(let k=0;k<6;k++){const cx=cx0+w*k/5,r=.035+.03*Math.sin(k*1.7+1)**2;fillShape(puff(cx,.1-(k%2)*.02,r),CLOUD)}
      for(let i=0;i<4;i++){const x=(.15+i*.22)*cols|0;set((rows-1-((rows*.18)|0))*cols+x,BUG,i&1)}
      hint('The clouds make rain. Watch the seeds grow!');say('A garden! Rain helps the seeds grow into flowers.')}
    if(k==='winter'){const pond=(x,y)=>x>.33&&x<.67&&y>.76&&y<.9;fillShape((x,y)=>y>.9,STONE);fillShape((x,y)=>pond(x,y)&&!(x>.35&&x<.65&&y<.88),STONE);
      fillShape((x,y)=>x>.35&&x<.65&&y>.8&&y<.88,WATER);fillShape((x,y)=>x>.35&&x<.65&&y>.77&&y<=.8,ICE);
      fillShape((x,y)=>y>.8-.05*Math.sin(x*9+1)&&y<=.9&&!pond(x,y),SNOW);
      fillShape((x,y)=>x>.78&&x<.88&&y>.74&&y<.79&&(y>.765||Math.abs(x-.83)<.03),WOOD);fillShape((x,y)=>x>.79&&x<.87&&y>.71&&y<.76,EMBER,.5,200);
      let n=0;const snow=()=>{if(!g.alive||my!==sceneId||n++>200)return;for(let i=0;i<cols/14;i++){const x=(rnd()*cols)|0;if(T[x]===EMPTY)set(x,SNOW)}g.later(snow,60)};snow();
      hint('Snow is falling. Can fire melt it?');say('Brr! Snow and ice. What melts ice?')}
    if(k==='tank'){fillShape((x,y)=>y>.25,WATER);fillShape((x,y)=>y>.88-.04*Math.sin(x*12),SAND);fillShape((x,y)=>y>.7&&y<.88&&(Math.abs(x-.2)<.012||Math.abs(x-.75)<.012||Math.abs(x-.5)<.01),PLANT);
      for(let i=0;i<6;i++){const x=(.1+i*.15)*cols|0,y=(.45+(i%3)*.1)*rows|0;set(y*cols+x,FISH,i&1)}
      hint('Fish swim in water. Add oil and see where it goes!');say('A fish tank! Fish need water.')}
    if(k==='empty'){hint('Pick something and draw with your finger!');say('All clean!')}
    tone(440,.1,'triangle');tone(660,.14,'triangle',.18,.08);
  }
  function resize(){const nd=fitCanvas(cv);if(Math.abs(nd.w-dims.w)<2&&Math.abs(nd.h-dims.h)<2&&nd.d===dims.d)return;dims=nd;grid();drawBg()}
  const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  scene('volcano');
  kbPointer(g,cv);
  g.key(e=>{const k=e.key;if(/^[0-9]$/.test(k)){const i=k==='0'?9:+k-1,b=stage.querySelectorAll('[data-e]')[i];if(b){b.click();return true}}
    if(k==='['||k==='-'){brush=Math.max(1,brush-1);syncUI();return true}if(k===']'||k==='='){brush=Math.min(3,brush+1);syncUI();return true}
    if(k.toLowerCase()==='f'){stage.querySelector('#pause').click();return true}return false});
  g.loop(()=>{if(critterTick>0)critterTick--;if(sndT>0)sndT--;
    for(const f of fmap.values()){paintAt(f.x,f.y);if(frame%6===0)elSound()}
    if(!paused){step();step()}else frame++;
    render()});
  GAMES.sand._debug={get T(){return T},get found(){return found},scene,get cols(){return cols},get rows(){return rows},get cs(){return cs},get paused(){return paused},get brush(){return brush},get frame(){return frame},DISC};
}}});
