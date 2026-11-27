/* ---------------- __TITLE__ ----------------
   Made from games/_template. Replace this sample with your game; keep the shape:

     defineGame('__KEY__', { init(stage, g){ ... } })

   stage  the empty play area (a <div>). Build your game inside it.
   g      this play session. Start everything through it, and it all stops by itself when the child taps ←:
            g.loop(fn)               fn(dt, t) 60 times a second, same speed on every screen (dt in ms)
            g.later(fn, ms)          a timer
            g.listen(target, type, fn) an event listener on window/document (stage listeners need nothing)
            g.onEnd(fn)              your own clean-up (observers, audio nodes...)
            g.key(fn)                keyboard: return true when you used the key
   Shared helpers (see js/README.md): tone, pop, cheer, buzz, burst, win, addStar, fingers, fitCanvas, draggable,
   popMenu, clamp, lerp, rint, pick, shuffle, LETTERS, ANIMALS, NUMW...

   Several children play at once: every finger is its own player. Track fingers by pointerId (fingers() does this)
   and never assume there is only one touch.

   Keep helpers inside init (or inside this file's own block) so names never clash with other games.
   CSS classes for this game start with __KEY__- and live in games/__KEY__/__KEY__.css. */
defineGame('__KEY__',{
init(stage,g){
  stage.innerHTML=`<div class="__KEY__">
    <canvas class="__KEY__-cv" aria-label="__TITLE__ play area"></canvas>
    <div class="__KEY__-score" aria-live="polite">Touch with lots of fingers!</div>
    <button class="__KEY__-btn" aria-label="More stars">✨ More stars</button>
  </div>`;
  const cv=stage.querySelector('.__KEY__-cv'),ctx=cv.getContext('2d'),scoreEl=stage.querySelector('.__KEY__-score');

  /* keep the canvas sharp and the right size when the screen turns or resizes */
  let W=0,H=0;
  const resize=()=>{const d=fitCanvas(cv);W=d.w;H=d.h};
  const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());resize();

  /* every finger gets its own colour and its own trail, so two or five children can play together */
  const COLORS=['#FF4F7B','#FFC83D','#24C786','#3E67F0','#9A5BFF','#FF8A2B','#18BFD6'];
  let nextColor=0,popped=0;
  const stars=[];   /* things to touch */
  const add=()=>stars.push({x:rint(40,Math.max(41,W-40)),y:rint(40,Math.max(41,H-40)),r:rint(22,36),born:performance.now()});
  for(let i=0;i<5;i++)add();

  const touches=fingers(cv,{
    down(f){f.data.color=COLORS[nextColor++%COLORS.length];f.data.trail=[[f.x,f.y]];tone(440+rint(0,6)*60,.12,'triangle');hit(f)},
    move(f){f.data.trail.push([f.x,f.y]);if(f.data.trail.length>30)f.data.trail.shift();hit(f)},
    up(f){}
  });
  function hit(f){
    for(let i=stars.length-1;i>=0;i--){const s=stars[i];if(Math.hypot(f.x-s.x,f.y-s.y)<s.r+20){
      stars.splice(i,1);popped++;pop(1+popped%5*.1);
      const r=cv.getBoundingClientRect();burst(r.left+s.x,r.top+s.y,24,[f.data.color]);
      scoreEl.textContent=`${popped} popped!`;
      if(popped%10===0)win(stage,undefined,undefined,`⭐ ${popped}!`);
      g.later(add,600)}}
  }

  /* A button for little hands: act when the finger lifts on it, however long it was pressed (a toddler's slow press is a
     long press, and browsers send no click after one). Keyboard Enter/Space still arrive as a click with detail 0. */
  const btn=stage.querySelector('.__KEY__-btn');let downOn=null;
  btn.addEventListener('pointerdown',()=>{downOn=btn});
  btn.addEventListener('pointerup',()=>{if(downOn===btn)moreStars();downOn=null});
  btn.addEventListener('pointercancel',()=>{downOn=null});
  btn.addEventListener('click',e=>{if(e.detail===0)moreStars()});
  function moreStars(){for(let i=0;i<5;i++)add();tone(880,.12,'triangle');tone(1320,.12,'triangle',.15,.08)}

  /* draw every frame */
  g.loop(()=>{
    ctx.clearRect(0,0,W,H);
    const now=performance.now();
    for(const s of stars){const k=Math.min(1,(now-s.born)/300);ctx.font=`${s.r*2*k}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('⭐',s.x,s.y)}
    for(const f of touches.values()){const t=f.data.trail;if(!t)continue;
      ctx.strokeStyle=f.data.color;ctx.lineWidth=14;ctx.lineCap=ctx.lineJoin='round';ctx.beginPath();t.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
      ctx.fillStyle=f.data.color;ctx.beginPath();ctx.arc(f.x,f.y,22,0,Math.PI*2);ctx.fill()}
  });

  /* keyboard play: arrow keys move a cursor, Space presses it (sends real pointer events) */
  kbPointer(g,cv);

  /* read-only view for the tests in tests/games/__KEY__.spec.mjs */
  GAMES.__KEY__._debug={get popped(){return popped},get stars(){return stars.length},get fingers(){return touches.size}};
}});
