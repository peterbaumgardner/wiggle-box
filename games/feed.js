/* Hungry Monster: an always-open shared toy. No players, turns, or round locks. */
Object.assign(GAMES, {
feed: {
  order: 4, title: 'Hungry Monster', icon: '🍎', c: 'var(--grape)', age: '3+',
  blurb: 'Feed Munch, mix silly snacks, and make discoveries together.',
  init(stage, g) {
    const INGREDIENTS = [
      { id:'apple', icon:'🍎', name:'Apple', color:'#FF5965', effect:'crunch' },
      { id:'banana', icon:'🍌', name:'Banana', color:'#FFD65E', effect:'bounce' },
      { id:'berry', icon:'🍓', name:'Berry', color:'#F94E8B', effect:'giggle' },
      { id:'lemon', icon:'🍋', name:'Lemon', color:'#FFF06D', effect:'sour' },
      { id:'carrot', icon:'🥕', name:'Carrot', color:'#FF964D', effect:'crunch' },
      { id:'grape', icon:'🍇', name:'Grapes', color:'#A274FF', effect:'bubble' },
      { id:'melon', icon:'🍉', name:'Watermelon', color:'#62D48C', effect:'bounce' },
      { id:'cookie', icon:'🍪', name:'Cookie', color:'#D8A46D', effect:'giggle' },
      { id:'cherry', icon:'🍒', name:'Cherries', color:'#E45378', effect:'bubble' },
      { id:'orange', icon:'🍊', name:'Orange', color:'#FFAD53', effect:'sour' },
      { id:'corn', icon:'🌽', name:'Corn', color:'#F2DB68', effect:'crunch' },
      { id:'cake', icon:'🧁', name:'Cupcake', color:'#D69CF9', effect:'giggle' }
    ];
    const BY_ID = new Map(INGREDIENTS.map(food => [food.id, food]));
    stage.innerHTML = '<div class="feed feed-v2">' +
      '<div class="feed-head"><div class="feed-name">Meet Munch!</div><div class="feed-caption" id="feed-caption" aria-live="polite">What should Munch try?</div></div>' +
      '<div class="feed-world" id="feed-world">' +
        '<div class="feed-sky" aria-hidden="true"><span class="feed-cloud">☁️</span><span class="feed-sun">☀️</span></div>' +
        '<div class="feed-monster-area"><div class="monster" id="mon" role="button" tabindex="0" aria-label="Tickle Munch">' +
          '<div class="horn l"></div><div class="horn r"></div><div class="mbody"></div>' +
          '<div class="eye l"><div class="pupil"></div></div><div class="eye r"><div class="pupil"></div></div>' +
          '<div class="mouth"><div class="teeth"></div><div class="tongue"></div></div>' +
          '<div class="feed-cheeks" aria-hidden="true">✨</div></div></div>' +
        '<div class="feed-worktop"><div class="feed-station feed-bowl" id="feed-bowl" role="button" tabindex="0" aria-label="Mixing bowl, tap to stir">' +
          '<span class="feed-station-label">MIX</span><span class="feed-bowl-icon">🥣</span><span id="feed-bowl-count" class="feed-count"></span></div>' +
        '<div class="feed-station feed-garden" id="feed-garden" role="button" tabindex="0" aria-label="Garden, tap to grow">' +
          '<span class="feed-station-label">GROW</span><span class="feed-garden-icon">🌱</span><span class="feed-garden-count" id="feed-garden-count"></span></div></div>' +
        '<div class="feed-items" id="feed-items" aria-label="Food in play"></div>' +
        '<div class="feed-sparks" id="feed-sparks" aria-hidden="true"></div>' +
      '</div>' +
      '<div class="feed-shelf" aria-label="Pick food to feed or combine">' +
        INGREDIENTS.map(food => '<button type="button" class="feed-source" data-ingredient="' + food.id + '" aria-label="Pick ' + food.name + '" title="' + food.name + '">' + food.icon + '</button>').join('') +
      '</div><div class="feed-foot"><span id="feed-discoveries" aria-live="polite">Try mixing two foods!</span><span id="feed-total" aria-label="Foods eaten">🍽️ 0</span></div>' +
    '</div>';

    const mon = stage.querySelector('#mon');
    const mouth = mon.querySelector('.mouth');
    const eyes = [...mon.querySelectorAll('.eye')];
    const world = stage.querySelector('#feed-world');
    const bowl = stage.querySelector('#feed-bowl');
    const garden = stage.querySelector('#feed-garden');
    const itemsRoot = stage.querySelector('#feed-items');
    const sparks = stage.querySelector('#feed-sparks');
    const caption = stage.querySelector('#feed-caption');
    const discoveryLabel = stage.querySelector('#feed-discoveries');
    const totalLabel = stage.querySelector('#feed-total');
    const bowlCount = stage.querySelector('#feed-bowl-count');
    const gardenCount = stage.querySelector('#feed-garden-count');
    const pointerActions = new Map();
    const items = new Map();
    const heldItems = new Set();
    const discoveries = new Set();
    const bowlContents = [];
    const stats = { fed:0, mixed:0, planted:0, pats:0, simultaneous:0 };
    let serial = 0, sprouts = 0, monsterMood = 'happy', reactionSerial = 0;
    let lastAttention = 0;
    const maxLooseItems = 22;
    const bounds = () => stage.getBoundingClientRect();
    const local = e => { const r = bounds(); return { x:e.clientX-r.left, y:e.clientY-r.top }; };
    const clampToStage = p => {
      const r = bounds();
      return { x:clamp(p.x,25,Math.max(25,r.width-25)), y:clamp(p.y,25,Math.max(25,r.height-25)) };
    };
    const setCaption = (message) => { caption.textContent=message; };
    const pause = (fn,ms) => g.later(fn,ms);

    function look(x,y) {
      const now = performance.now();
      if (now-lastAttention<16) return;
      lastAttention=now;
      eyes.forEach(eye => {
        const c=center(eye), dx=x-c.x, dy=y-c.y, d=Math.hypot(dx,dy)||1;
        const m=Math.min(d/12,eye.clientWidth*.18);
        eye.firstElementChild.style.transform='translate('+(dx/d*m)+'px,'+(dy/d*m)+'px)';
      });
    }
    function setMood(mood, duration=650) {
      const id=++reactionSerial;
      monsterMood=mood;
      mon.dataset.mood=mood;
      mon.classList.add('feed-reacting');
      pause(() => {
        if (id!==reactionSerial) return;
        monsterMood='happy';
        mon.dataset.mood='happy';
        mon.classList.remove('feed-reacting','hungry','chomp');
      },duration);
    }
    function sparkle(symbol,origin,count=4) {
      const r=bounds();
      const p={x:clamp(origin.x,24,r.width-24),y:clamp(origin.y,24,r.height-24)};
      for(let i=0;i<count;i++){
        const s=document.createElement('span');
        s.className='feed-spark';s.textContent=symbol;
        s.style.left=p.x+'px';s.style.top=p.y+'px';
        s.style.setProperty('--sx',((i-(count-1)/2)*30)+'px');
        s.style.setProperty('--sy',(-45-(i%3)*15)+'px');
        sparks.appendChild(s);pause(()=>s.remove(),780);
      }
    }
    function monsterCenter() { const r=center(mon),s=bounds();return {x:r.x-s.left,y:r.y-s.top}; }
    function reaction(item) {
      const moods={
        crunch:['crunch','CRUNCH!','✨',220],
        bounce:['bounce','BOING!','⭐',390],
        giggle:['giggle','HEE HEE!','💗',540],
        sour:['sour','OOOH! SOUR!','⚡',510],
        bubble:['bubble','BUBBLES!','🫧',620],
        magic:['magic','RAINBOW BURP!','🌈',760]
      };
      const [mood,label,symbol,freq]=moods[item.effect]||moods.magic;
      setMood(mood,850);
      setCaption(label);
      mon.classList.remove('chomp');void mon.offsetWidth;mon.classList.add('chomp');
      sparkle(symbol,monsterCenter(),4);
      tone(freq,.14,'triangle',.15);
      tone(freq*1.5,.16,'sine',.08,.07);
      pause(()=>mon.classList.remove('chomp'),360);
    }
    function position(item,p) {
      const v=clampToStage(p);item.x=v.x;item.y=v.y;
      item.el.style.left=v.x+'px';item.el.style.top=v.y+'px';
    }
    function retireOverflow() {
      if(items.size<maxLooseItems)return;
      const old=[...items.values()].find(item=>item.state==='ready'&&!heldItems.has(item.id));
      if(old)removeItem(old);
    }
    function createItem(spec,p) {
      retireOverflow();
      const id=++serial;
      const el=document.createElement('button');
      el.type='button';el.className='feed-food';
      el.textContent=spec.icon;el.setAttribute('aria-label','Feed or move '+spec.name);
      el.dataset.foodId=String(id);
      itemsRoot.appendChild(el);
      const item={id,el,name:spec.name,icon:spec.icon,effect:spec.effect,color:spec.color,state:'ready',x:0,y:0,owner:null};
      items.set(id,item);position(item,p);return item;
    }
    function removeItem(item) {
      if(item.state==='consumed')return false;
      item.state='consumed';heldItems.delete(item.id);
      items.delete(item.id);item.el.remove();return true;
    }
    function feed(item) {
      if(!item || !removeItem(item))return false;
      stats.fed++;
      totalLabel.textContent='🍽️ '+stats.fed;
      totalLabel.setAttribute('aria-label',stats.fed+' foods eaten');
      reaction(item);
      if(stats.fed%6===0) {
        const mc=monsterCenter();sparkle('🎉',mc,7);
        addStar();
      }
      return true;
    }
    function mixFood(item) {
      if(!item || !removeItem(item))return false;
      bowlContents.push(item);
      bowl.classList.add('feed-active');
      bowlCount.textContent=bowlContents.length+' inside';
      setCaption('Stir the bowl!');
      tone(490,.12,'triangle',.1);
      if(bowlContents.length>=2)makeRecipe();
      return true;
    }
    function makeRecipe() {
      if(bowlContents.length<2)return;
      const a=bowlContents.shift(),b=bowlContents.shift();
      const sorted=[a.name,b.name].sort();
      const key=sorted.join('+');
      const colorA=a.color, colorB=b.color;
      const name=sorted.join(' + ')+' surprise';
      const isNew=!discoveries.has(key);
      discoveries.add(key);
      stats.mixed++;
      const y=bounds().height*.56;
      const bp=center(bowl), sr=bounds();
      const item=createItem({name,icon: a.icon===b.icon?'🍡':'🍧',effect:'magic',color:colorA||colorB||'#FF4F7B'},
        {x:bp.x-sr.left,y:Math.max(80,y)});
      item.el.classList.add('feed-recipe');
      item.el.style.setProperty('--recipe-color',colorB||colorA);
      bowlCount.textContent=bowlContents.length?bowlContents.length+' inside':'';
      bowl.classList.remove('feed-active');
      setCaption(isNew?'A NEW RECIPE!':'YOU MADE IT AGAIN!');
      discoveryLabel.textContent=discoveries.size+' silly recipes found';
      sparkle('✨',{x:item.x,y:item.y},6);
      tone(523,.15,'sine',.14);tone(784,.2,'sine',.1,.12);
      if(isNew) saveDiscoveries();
    }
    function plantFood(item) {
      if(!item || !removeItem(item))return false;
      sprouts++;stats.planted++;
      gardenCount.textContent=String(sprouts);
      garden.classList.remove('feed-grow');
      void garden.offsetWidth;garden.classList.add('feed-grow');
      setCaption('LOOK! IT GREW!');
      const r=center(garden),b=bounds();
      sparkle('🌸',{x:r.x-b.left,y:r.y-b.top},4);
      tone(550,.2,'sine',.12);
      if(sprouts%3===0){
        const f=INGREDIENTS[(sprouts/3-1)%INGREDIENTS.length];
        const p={x:r.x-b.left-55,y:r.y-b.top-65};
        createItem(f,p);
        setCaption('A SNACK GREW!');
      }
      return true;
    }
    function pat(e) {
      stats.pats++;
      const p=local(e);
      const localR=bounds();
      sparkle(stats.pats%2?'💗':'✨',{x:p.x,y:p.y},3);
      setMood(stats.pats%3===0?'giggle':'bounce',600);
      setCaption(stats.pats%3===0?'MUNCH IS TICKLISH!':'HELLO, MUNCH!');
      tone(460+(stats.pats%4)*70,.11,'sine',.08);
      look(e.clientX,e.clientY);
    }
    function stir() {
      bowl.classList.remove('feed-stirring');void bowl.offsetWidth;
      bowl.classList.add('feed-stirring');
      pause(()=>bowl.classList.remove('feed-stirring'),480);
      if(bowlContents.length>=2){makeRecipe();return}
      setCaption(bowlContents.length?'ADD ONE MORE TREAT!':'DROP TWO TREATS HERE!');
      tone(390,.1,'triangle',.09);
    }
    function grow() {
      const r=center(garden),s=bounds();
      garden.classList.remove('feed-grow');void garden.offsetWidth;garden.classList.add('feed-grow');
      sparkle('🌱',{x:r.x-s.left,y:r.y-s.top},3);
      setCaption('PLANT A SNACK HERE!');
      tone(340,.1,'sine',.08);
    }
    function saveDiscoveries() {
      try {localStorage.setItem('wb-feed-recipes-v2',JSON.stringify([...discoveries].slice(0,200)))}catch(err){console.warn('Hungry Monster: cannot save discoveries',err)}
    }
    try {
      const prior=JSON.parse(localStorage.getItem('wb-feed-recipes-v2')||'[]');
      if(Array.isArray(prior))prior.filter(x=>typeof x==='string'&&x.length<120).slice(0,200).forEach(x=>discoveries.add(x));
    } catch(err){console.warn('Hungry Monster: invalid saved discoveries',err)}
    if(discoveries.size)discoveryLabel.textContent=discoveries.size+' silly recipes found';

    function startDrag(e,item,fromSource) {
      if(!item||item.state!=='ready'||item.owner!==null)return;
      e.preventDefault();
      const point=local(e);
      item.owner=e.pointerId;item.state='held';heldItems.add(item.id);
      item.el.classList.add('feed-held');
      const offset=fromSource?{x:0,y:0}:{x:item.x-point.x,y:item.y-point.y};
      const gesture={id:e.pointerId,item,start:point,last:point,offset,moved:false};
      pointerActions.set(e.pointerId,gesture);
      if(pointerActions.size>stats.simultaneous)stats.simultaneous=pointerActions.size;
      try {stage.setPointerCapture(e.pointerId)} catch(err){console.warn('Hungry Monster: pointer capture failed',err)}
      look(e.clientX,e.clientY);
      mon.classList.add('hungry');
    }
    function finishDrag(e,cancelled) {
      const action=pointerActions.get(e.pointerId);
      if(!action)return;
      pointerActions.delete(e.pointerId);
      const item=action.item;
      if(item.state!=='held'||item.owner!==e.pointerId)return;
      item.owner=null;item.el.classList.remove('feed-held');
      heldItems.delete(item.id);
      const p=action.last;
      item.state='ready';
      if(cancelled){position(item,action.start);return}
      if(!action.moved){feed(item);return}
      const r=bounds(),abs={x:p.x+r.left,y:p.y+r.top};
      if(inRect(abs.x,abs.y,bowl,8)){mixFood(item);return}
      if(inRect(abs.x,abs.y,garden,8)){plantFood(item);return}
      if(inRect(abs.x,abs.y,mon,16)){feed(item);return}
      position(item,p);
      tone(370,.1,'sine',.07);
      setCaption('TOSS IT TO MUNCH OR MIX IT!');
      if(!pointerActions.size)mon.classList.remove('hungry');
    }
    g.listen(stage,'pointerdown',e=>{
      if(e.button!==undefined&&e.button!==0)return;
      const source=e.target.closest('.feed-source');
      if(source){
        const spec=BY_ID.get(source.dataset.ingredient);
        if(!spec)return;
        const r=center(source),s=bounds();
        const item=createItem(spec,{x:r.x-s.left,y:r.y-s.top});
        startDrag(e,item,true);
        return;
      }
      const food=e.target.closest('.feed-food');
      if(food){
        const item=items.get(Number(food.dataset.foodId));
        if(item)startDrag(e,item,false);
        return;
      }
      if(e.target.closest('#mon')){e.preventDefault();pat(e);return}
      if(e.target.closest('#feed-bowl')){e.preventDefault();stir();return}
      if(e.target.closest('#feed-garden')){e.preventDefault();grow()}
    });
    g.listen(stage,'pointermove',e=>{
      const a=pointerActions.get(e.pointerId);
      if(!a)return;
      const p=local(e);
      if(Math.hypot(p.x-a.start.x,p.y-a.start.y)>9)a.moved=true;
      a.last=p;
      const at={x:p.x+a.offset.x,y:p.y+a.offset.y};
      position(a.item,at);
      look(e.clientX,e.clientY);
    });
    g.listen(stage,'pointerup',e=>finishDrag(e,false));
    g.listen(stage,'pointercancel',e=>finishDrag(e,true));
    g.listen(stage,'lostpointercapture',e=>finishDrag(e,true));
    g.listen(stage,'click',e=>{
      if(e.detail!==0)return;
      const source=e.target.closest('.feed-source');
      if(source){
        const spec=BY_ID.get(source.dataset.ingredient);
        if(spec)feed(createItem(spec,monsterCenter()));
      } else if(e.target.closest('.feed-food')){
        const item=items.get(Number(e.target.closest('.feed-food').dataset.foodId));
        if(item)feed(item);
      } else if(e.target.closest('#mon')){pat({clientX:center(mon).x,clientY:center(mon).y})}
      else if(e.target.closest('#feed-bowl'))stir();
      else if(e.target.closest('#feed-garden'))grow();
    });
    g.listen(stage,'keydown',e=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      const food=e.target.closest('.feed-food');
      if(food){e.preventDefault();const item=items.get(Number(food.dataset.foodId));if(item)feed(item)}
    });
    g.listen(stage,'pointermove',e=>{
      if(pointerActions.size===0&&e.target.closest('#feed-world'))look(e.clientX,e.clientY);
    });
    g.listen(window,'resize',()=>{
      for(const item of items.values())position(item,{x:item.x,y:item.y});
    });
    g.onEnd(()=>{
      pointerActions.clear();heldItems.clear();
      for(const item of items.values()){item.owner=null;item.el.remove()}
      items.clear();bowlContents.length=0;
      if(GAMES.feed._debug)delete GAMES.feed._debug;
    });
    GAMES.feed._debug={
      get fed(){return stats.fed},
      get mixed(){return stats.mixed},
      get planted(){return stats.planted},
      get pats(){return stats.pats},
      get simultaneous(){return stats.simultaneous},
      get activePointers(){return pointerActions.size},
      get looseFood(){return items.size},
      get recipes(){return discoveries.size},
      get bowlItems(){return bowlContents.length},
      get mood(){return monsterMood}
    };
  }
}
});
