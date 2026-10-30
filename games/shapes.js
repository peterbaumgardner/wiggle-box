/* ---------------- Shape Sorter ---------------- */
Object.assign(GAMES,{
shapes:{order:5,title:'Shape Sorter',icon:'🔺',c:'var(--leaf)',age:'2+',blurb:'Drag each shape to its home',
init(stage,g){
  const star=(()=>{let p='';for(let i=0;i<10;i++){const r=i%2?20:47,a=-Math.PI/2+i*Math.PI/5;p+=(i?'L':'M')+(50+r*Math.cos(a)).toFixed(1)+' '+(54+r*Math.sin(a)).toFixed(1)}return p+'Z'})();
  const SH={circle:'<circle cx="50" cy="50" r="44"/>',square:'<rect x="8" y="8" width="84" height="84" rx="8"/>',triangle:'<path d="M50 6 L94 90 L6 90Z"/>',
    star:`<path d="${star}"/>`,heart:'<path d="M50 90 C20 68 6 50 6 31 C6 16 18 6 31 6 C40 6 46 11 50 19 C54 11 60 6 69 6 C82 6 94 16 94 31 C94 50 80 68 50 90Z"/>',
    diamond:'<path d="M50 4 L92 50 L50 96 L8 50Z"/>'};
  const COL=[['red','#FF4F5E'],['blue','#3D7BFF'],['yellow','#FFC83D'],['green','#24C786'],['purple','#9A5BFF'],['orange','#FF8A2B'],['pink','#FF7FC8']];
  stage.innerHTML=`<div class="shapes"><div class="holes" id="holes"></div><p class="hint">Drag each shape to its home.</p><div class="pile" id="pile"></div></div>`;
  const holesEl=stage.querySelector('#holes'),pile=stage.querySelector('#pile');let done=0,count=0,rid=0;
  function round(){
    done=0;rid++;const my=rid;const names=shuffle(Object.keys(SH)).slice(0,4);count=names.length;
    holesEl.innerHTML=names.map(n=>`<div class="hole" data-s="${n}" tabindex="0" role="button" aria-label="${n} home"><svg viewBox="0 0 100 100">${SH[n]}</svg></div>`).join('');
    pile.innerHTML='';const cols=shuffle(COL);
    shuffle(names).forEach((n,i)=>{const c=cols[i];const p=document.createElement('div');p.className='piece';p.dataset.s=n;p.tabIndex=0;p.setAttribute('role','button');p.setAttribute('aria-label',c[0]+' '+n);
      p.innerHTML=`<div class="rot" style="transform:rotate(${rint(-25,25)}deg)"><svg viewBox="0 0 100 100" style="fill:${c[1]}">${SH[n]}</svg></div>`;pile.appendChild(p);
      p._place=h=>{if(h.dataset.s!==n||h.dataset.f){buzz();shakeEl(h);return false}h.dataset.f=1;p.style.transform='';p.tabIndex=-1;h.appendChild(p);const cc=center(h);burst(cc.x,cc.y,30,[c[1],'#fff','#FFC83D'],6);
          tone(523,.15,'triangle',.18);tone(784,.2,'triangle',.18,.1);floaty(stage,cc.x,cc.y-40,`${c[0]} ${n}`);
          if(++done===count){g.later(()=>{cheer();party();addStar()},900);g.later(()=>{if(my===rid)round()},3300)}return true};
      draggable(p,{onTap:()=>{tone(600,.12,'triangle');p.classList.remove('wig');void p.offsetWidth;p.classList.add('wig');const cc=center(p);floaty(stage,cc.x,cc.y-50,`${c[0]} ${n}`)},
        onDrop:(x,y)=>{const h=[...holesEl.children].find(h=>inRect(x,y,h,24));if(!h)return false;return p._place(h);
}})});
  }
  round();
  /* keyboard: Tab to a shape, Enter to pick it up, Tab to a home, Enter to drop */
  let held=null;
  g.key(e=>{if(e.key!=='Enter'&&e.key!==' ')return false;const t=document.activeElement;
    if(t&&t.classList.contains('piece')&&t.parentElement===pile){held&&held.classList.remove('held');held=t;t.classList.add('held');tone(600,.08,'triangle');holesEl.querySelector('.hole:not([data-f])')?.focus();return true}
    if(t&&t.classList.contains('hole')&&held){const ok=held._place(t);held.classList.remove('held');if(ok){held=null;pile.querySelector('.piece')?.focus()}return true}
    if(!held){pile.querySelector('.piece')?.focus();return true}return false});
}}
});
