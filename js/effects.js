/* Rewards and effects: stars, confetti, floating labels, shake, and win() which does all of them at once. */
/* ---------- stars ---------- */
let stars=0;
try{stars=Math.max(0,parseInt(localStorage.getItem('wb-stars')||'0',10)||0)}catch(e){}
function drawStars(b){document.querySelectorAll('.starn').forEach(n=>{n.textContent=stars;if(b){const p=n.parentElement;p.classList.remove('bump');void p.offsetWidth;p.classList.add('bump')}})}
function addStar(){stars++;try{localStorage.setItem('wb-stars',stars)}catch(e){};drawStars(true)}
drawStars();

/* ---------- confetti ---------- */
const fx=$('#fx'), fctx=fx.getContext('2d'); let parts=[], fxOn=false;
const CONF=['#FF4F7B','#FFC83D','#24C786','#3E67F0','#9A5BFF','#FF8A2B','#18BFD6'];
function sizeFx(){const d=devicePixelRatio||1;fx.width=innerWidth*d;fx.height=innerHeight*d;fctx.setTransform(d,0,0,d,0,0)}
sizeFx(); addEventListener('resize',sizeFx);
function burst(x,y,n=40,cols=CONF,spd=9){
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=2+Math.random()*spd;
    parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-3,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:pick(cols),s:6+Math.random()*8,l:1,shape:Math.random()<.5})}
  if(!fxOn){fxOn=true;requestAnimationFrame(fxLoop)}
}
function party(){for(let i=0;i<5;i++)setTimeout(()=>burst(innerWidth*(.1+.2*i),innerHeight*.45,45),i*90)}
function fxLoop(){
  fctx.clearRect(0,0,innerWidth,innerHeight);
  parts=parts.filter(p=>p.l>0);
  for(const p of parts){p.vy+=.35;p.vx*=.985;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.l-=.012;
    fctx.save();fctx.globalAlpha=Math.max(p.l,0);fctx.translate(p.x,p.y);fctx.rotate(p.r);fctx.fillStyle=p.c;
    if(p.shape){fctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2)}else{fctx.beginPath();fctx.arc(0,0,p.s/2.4,0,7);fctx.fill()}fctx.restore()}
  if(parts.length)requestAnimationFrame(fxLoop);else{fxOn=false;fctx.clearRect(0,0,innerWidth,innerHeight)}
}
function floaty(stage,x,y,html){const r=stage.getBoundingClientRect();const d=document.createElement('div');d.className='floaty';d.innerHTML=html;
  d.style.maxWidth=(r.width-16)+'px';d.style.top=Math.max(y-r.top,70)+'px';d.style.left='0px';stage.appendChild(d);
  const hw=d.offsetWidth/2;d.style.left=Math.min(Math.max(x-r.left,hw+8),r.width-hw-8)+'px';setTimeout(()=>d.remove(),1650)}
function shakeEl(el){el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake')}

const win=(stage,x,y,label)=>{const r=stage.getBoundingClientRect();burst(x??r.left+r.width/2,y??r.top+r.height/2,60);cheer();addStar();if(label)floaty(stage,(x??r.left+r.width/2),(y??r.top+r.height/2)-40,label)};
