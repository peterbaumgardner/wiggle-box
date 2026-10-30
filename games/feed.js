/* ---------------- Hungry Monster ---------------- */
Object.assign(GAMES,{
feed:{order:4,title:'Hungry Monster',icon:'🍎',c:'var(--grape)',age:'3+',blurb:'Count and add by feeding Munch',
init(stage,g){
  const FRUIT=[['🍎','apples','apple'],['🍌','bananas','banana'],['🍓','strawberries','strawberry'],['🍪','cookies','cookie'],['🥕','carrots','carrot'],['🍊','oranges','orange'],['🧁','cupcakes','cupcake'],['🍉','watermelons','watermelon']];
  stage.innerHTML=`<div class="feed">
    <div class="chips"><button class="chip on" data-l="s">1 to 5</button><button class="chip" data-l="b">1 to 10</button><button class="chip" data-l="a">Adding +</button></div>
    <div class="ask" id="ask"></div>
    <div class="monwrap"><div class="monster" id="mon" role="img" aria-label="Munch the monster">
      <div class="horn l"></div><div class="horn r"></div><div class="mbody"></div>
      <div class="eye l"><div class="pupil"></div></div><div class="eye r"><div class="pupil"></div></div>
      <div class="mouth"><div class="teeth"></div><div class="tongue"></div></div></div></div>
    <div class="dots" id="dots"></div>
    <div class="tray" id="tray"></div></div>`;
  const ask=stage.querySelector('#ask'),mon=stage.querySelector('#mon'),dots=stage.querySelector('#dots'),tray=stage.querySelector('#tray'),mouth=mon.querySelector('.mouth');
  let level='s',target=0,a=0,b=0,eaten=0,fr,busy=false,rid=0;
  stage.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{level=c.dataset.l;stage.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===c));round()}));
  function look(x,y){mon.querySelectorAll('.eye').forEach(eye=>{const c=center(eye),dx=x-c.x,dy=y-c.y,d=Math.hypot(dx,dy)||1,m=Math.min(d/12,eye.clientWidth*.18);
    eye.firstElementChild.style.transform=`translate(${dx/d*m}px,${dy/d*m}px)`})}
  g.listen(stage,'pointermove',e=>look(e.clientX,e.clientY));
  function round(){
    busy=false;eaten=0;rid++;fr=pick(FRUIT);mon.classList.remove('happy');
    if(level==='a'){a=rint(1,5);b=rint(1,5);target=a+b;ask.innerHTML=`Feed me <b>${a}</b> ${fr[0]} + <b>${b}</b> ${fr[0]}`;say(`Feed me ${a} plus ${b} ${fr[1]}!`)}
    else{target=rint(1,level==='s'?5:10);ask.innerHTML=`Feed me <b>${target}</b> ${fr[0]}`;say(`Feed me ${target} ${target===1?fr[2]:fr[1]}!`)}
    dots.innerHTML=level==='a'?'<i class="ga"></i>'.repeat(a)+'<span class="plus">+</span>'+'<i class="gb"></i>'.repeat(b):'<i></i>'.repeat(target);
    tray.innerHTML='';const n=Math.min(target+3,13);
    for(let i=0;i<n;i++){const f=document.createElement('div');f.className='food';f.textContent=fr[0];tray.appendChild(f);
      draggable(f,{enabled:()=>!busy,onStart:()=>mon.classList.add('hungry'),onEnd:()=>mon.classList.remove('hungry'),
        onMove:(x,y)=>look(x,y),onTap:()=>fly(f),onDrop:(x,y)=>{if(inRect(x,y,mon,10)){eat(f);return true}tone(260,.12,'sine',.08);return false}})}
  }
  function fly(f){if(busy)return;const s=center(f),m=center(mouth);f.style.transition='transform .35s ease-in';f.style.transform=`translate(${m.x-s.x}px,${m.y-s.y}px) scale(.4)`;
    mon.classList.add('hungry');f.style.pointerEvents='none';g.later(()=>{mon.classList.remove('hungry');eat(f)},360)}
  function eat(f){
    if(busy||!f.isConnected)return;f.remove();eaten++;
    mon.classList.remove('chomp');void mon.offsetWidth;mon.classList.add('chomp');
    tone(140,.15,'square',.08,0,90);tone(300+eaten*40,.18,'triangle',.18,.08);
    dots.querySelectorAll('i')[eaten-1].classList.add('f');say(String(eaten));
    if(eaten===target){busy=true;const my=rid;g.later(()=>{if(my!==rid)return;const c=center(mon);burst(c.x,c.y,70);cheer();mon.classList.add('happy');addStar();
      if(level==='a'){ask.innerHTML=`${a} + ${b} = <b>${target}</b>`;say(`${a} plus ${b} is ${target}! Yum yum!`)}
      else{ask.innerHTML=`Yum! <b>${target}</b> ${fr[0]}`;say(`Yum! ${target} ${target===1?fr[2]:fr[1]}!`)}},450);g.later(()=>{if(my===rid)round()},3200)}
  }
  round();
  g.key(e=>{if(e.key===' '||e.key==='Enter'||e.key==='ArrowUp'){const f=tray.querySelector('.food:not([style*="pointer-events"])');if(f)fly(f);return true}return false});
  GAMES.feed._debug={get target(){return target},get eaten(){return eaten},get a(){return a},get b(){return b},get busy(){return busy}};
}}
});
