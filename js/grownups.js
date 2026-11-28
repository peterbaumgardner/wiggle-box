/* The grown-ups view: what the children practised on this device, the spoken-words and "Talk about it" switches,
   export and reset. Opens with a two-second press on the ⭐ counter on the home screen (or Shift+G there), so a child
   tapping around won't open it by accident. Data comes from js/learn.js and never leaves the device. */
(()=>{
  const pill=document.querySelector('#home .hud .pill:not(.btn)');
  if(!pill)return;
  let holdT=0;
  const cancel=()=>{clearTimeout(holdT);pill.classList.remove('holding')};
  pill.addEventListener('pointerdown',()=>{cancel();pill.classList.add('holding');holdT=setTimeout(()=>{pill.classList.remove('holding');open()},2000)});
  for(const t of ['pointerup','pointercancel','pointerleave'])pill.addEventListener(t,cancel);
  pill.addEventListener('contextmenu',e=>e.preventDefault());
  addEventListener('keydown',e=>{if(e.key==='G'&&e.shiftKey&&!document.getElementById('home').hidden&&!document.querySelector('.grown'))open()});

  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function open(){
    const S=learn.summary(),max=Math.max(1,...S.map(a=>a.total)),set=learn.settings;let armed=false;
    const el=document.createElement('div');el.className='grown';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','grown-h');
    const toggle=(k,icon,label,help)=>`<button class="grown-t${set[k]?' on':''}" data-set="${k}" aria-pressed="${!!set[k]}"><span>${icon}</span><b>${label}</b><em>${set[k]?'On':'Off'}</em><small>${help}</small></button>`;
    el.innerHTML=`<div class="grown-in">
      <h2 id="grown-h">For grown-ups</h2>
      <p>What the children practised while playing on this device. It is kept only here: no names, no voices, nothing sent anywhere.</p>
      <div class="grown-areas">${S.map(a=>`<div class="grown-a"><div class="grown-ah"><span>${a.icon}</span><b>${a.name}</b><span class="grown-n">${a.total}</span></div>
        <span class="grown-bar"><i style="width:${Math.round(a.total/max*100)}%"></i></span>
        <small>${a.skills.length?a.skills.slice(0,4).map(s=>`${esc(s.name)} ${s.seen+s.tries}${s.tries?` <span class="grown-ok">(${Math.round(s.ok/s.tries*100)}% right${s.level?`, level ${s.level+1}`:''})</span>`:''}`).join(' · '):'nothing yet'}</small></div>`).join('')}</div>
      <h3>Settings</h3>
      <div class="grown-ts">${toggle('voice','🗣️','Spoken words','Games say letters, numbers and names out loud.')}${toggle('talk','💬','Talk about it','Now and then a game shows one open question to talk about together.')}</div>
      <p class="grown-tip">The best way to use Wiggle Box: play alongside, and ask the "Talk about it" questions out loud.</p>
      <div class="grown-row"><button data-g="export">⬇️ Save learning data</button><button data-g="reset">🗑️ Start fresh</button><button data-g="close" class="grown-close">Done</button></div>
    </div>`;
    document.body.appendChild(el);
    const close=()=>{el.remove();try{pill.focus({preventScroll:true})}catch(e){}};
    el.addEventListener('click',e=>{
      if(e.target===el){close();return}
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.set){const k=b.dataset.set,v=!learn.settings[k];learn.set(k,v);b.classList.toggle('on',v);b.setAttribute('aria-pressed',v);b.querySelector('em').textContent=v?'On':'Off';
        if(k==='voice'&&v)learn.say('Spoken words are on');tone(v?660:440,.1,'triangle')}
      else if(b.dataset.g==='export')learn.export();
      else if(b.dataset.g==='reset'){if(!armed){armed=true;b.textContent='Tap again to wipe it';setTimeout(()=>{armed=false;if(b.isConnected)b.textContent='🗑️ Start fresh'},3000)}else{learn.reset();close();open()}}
      else if(b.dataset.g==='close')close()});
    el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close()}});
    el.querySelector('.grown-close').focus({preventScroll:true});
  }
  window.WiggleBoxGrownups={open};
})();
