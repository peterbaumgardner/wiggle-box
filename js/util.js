/* Wiggle Box shared helpers: tiny maths and DOM shortcuts every game uses.
   The platform files load in this order (see index.html): util, sound, effects, input, ui, data, games, then
   games/registry.js and js/app.js. All are plain scripts (no modules) so the app runs from any static host. */
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const rint=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const inRect=(x,y,el,pad=0)=>{const r=el.getBoundingClientRect();return x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad};
const center=el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};
