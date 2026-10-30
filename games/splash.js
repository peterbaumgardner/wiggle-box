/* ============================================================
   FluidSim — 2D particle fluid (double-density relaxation,
   Clavet et al. 2005) with RYB paint mixing, capsule walls,
   floating/sinking rigid toys and finger obstacles.
   Units: interaction radius h = 1. One call to step() = one substep.
   ============================================================ */
class FluidSim{
  constructor(cap){
    this.cap=cap;this.n=0;
    const F=()=>new Float32Array(cap);
    this.x=F();this.y=F();this.px=F();this.py=F();this.vx=F();this.vy=F();
    this.cr=F();this.cyl=F();this.cb=F();          // RYB paint amounts
    this.rho=F();                                  // last density (for rendering foam)
    this.age=new Uint16Array(cap);
    // tuning
    this.rho0=2.4;this.k=0.06;this.kn=0.35;this.sigma=0.1;this.beta=0.2;
    this.g=0.0045;this.vmax=0.42;this.pr=0.28;this.mix=0.02;this.pmin=-0.05;
    this.W=10;this.H=10;
    this.walls=[];this.wallR=0.42;
    this.bodies=[];
    this.pushers=[];   // finger obstacles {x,y,vx,vy,r}
    this.drains=[];    // {x,y,r}
    this.onRemove=null;
    // neighbor scratch
    this.nbJ=new Int32Array(256);this.nbQ=new Float32Array(256);this.nbX=new Float32Array(256);this.nbY=new Float32Array(256);
    this.resize(10,10);
  }
  resize(W,H){
    this.W=W;this.H=H;this.gw=Math.ceil(W)+3;this.gh=Math.ceil(H)+3;
    const cells=this.gw*this.gh;
    this.cellStart=new Int32Array(cells+1);this.cellCount=new Int32Array(cells);this.sorted=new Int32Array(this.cap);this.pcell=new Int32Array(this.cap);
    this.rebuildWallGrid();
    for(let i=0;i<this.n;i++){this.x[i]=Math.min(Math.max(this.x[i],this.pr),W-this.pr);this.y[i]=Math.min(Math.max(this.y[i],this.pr),H-this.pr);this.px[i]=this.x[i];this.py[i]=this.y[i]}
  }
  cellOf(x,y){let cx=(x|0)+1,cy=(y|0)+1;if(cx<0)cx=0;else if(cx>=this.gw)cx=this.gw-1;if(cy<0)cy=0;else if(cy>=this.gh)cy=this.gh-1;return cy*this.gw+cx}
  add(x,y,vx,vy,r,yl,b){
    if(this.n>=this.cap)return -1;const i=this.n++;
    this.x[i]=x;this.y[i]=y;this.px[i]=x-vx;this.py[i]=y-vy;this.vx[i]=vx;this.vy[i]=vy;
    this.cr[i]=r;this.cyl[i]=yl;this.cb[i]=b;this.rho[i]=this.rho0;this.age[i]=0;return i;
  }
  remove(i){
    const l=--this.n;if(this.onRemove)this.onRemove(i);
    if(i!==l){for(const a of [this.x,this.y,this.px,this.py,this.vx,this.vy,this.cr,this.cyl,this.cb,this.rho,this.age])a[i]=a[l]}
  }
  /* ---------- walls (capsules) ---------- */
  addWall(x1,y1,x2,y2,r){const w={x1,y1,x2,y2,r:r||this.wallR};this.walls.push(w);this.gridWall(this.walls.length-1);return w}
  rebuildWallGrid(){this.wgrid=new Array(this.gw*this.gh);for(let i=0;i<this.walls.length;i++)this.gridWall(i)}
  gridWall(i){
    const w=this.walls[i],m=w.r+this.pr+0.6;
    const x0=Math.floor(Math.min(w.x1,w.x2)-m),x1=Math.floor(Math.max(w.x1,w.x2)+m),y0=Math.floor(Math.min(w.y1,w.y2)-m),y1=Math.floor(Math.max(w.y1,w.y2)+m);
    for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){
      if(cx<-1||cy<-1||cx>this.gw-2||cy>this.gh-2)continue;
      // only cells actually near the segment
      const d=FluidSim.segDist(cx+.5,cy+.5,w);if(d.d>m+0.75)continue;
      const k=(cy+1)*this.gw+(cx+1);(this.wgrid[k]||(this.wgrid[k]=[])).push(i);
    }
  }
  removeWallsNear(x,y,r){const before=this.walls.length;this.walls=this.walls.filter(w=>FluidSim.segDist(x,y,w).d>r+w.r);if(this.walls.length!==before){this.rebuildWallGrid();return true}return false}
  static segDist(px,py,w){
    const ax=w.x1,ay=w.y1,bx=w.x2-ax,by=w.y2-ay,l2=bx*bx+by*by;let t=l2?((px-ax)*bx+(py-ay)*by)/l2:0;t=t<0?0:t>1?1:t;
    const cx=ax+bx*t,cy=ay+by*t,dx=px-cx,dy=py-cy;return{d:Math.sqrt(dx*dx+dy*dy),dx,dy,cx,cy};
  }
  /* ---------- the step ---------- */
  buildGrid(){
    const n=this.n,cc=this.cellCount,cs=this.cellStart,pc=this.pcell,so=this.sorted;cc.fill(0);
    for(let i=0;i<n;i++){const c=this.cellOf(this.x[i],this.y[i]);pc[i]=c;cc[c]++}
    let s=0;for(let c=0;c<cc.length;c++){cs[c]=s;s+=cc[c]}cs[cc.length]=s;
    const fill=this._fill||(this._fill=new Int32Array(cc.length));if(fill.length!==cc.length)this._fill=new Int32Array(cc.length);
    const f=this._fill;f.set(cs.subarray(0,cc.length));
    for(let i=0;i<n;i++){so[f[pc[i]]++]=i}
  }
  step(){
    const n=this.n,x=this.x,y=this.y,px=this.px,py=this.py,vx=this.vx,vy=this.vy,g=this.g;
    // gravity + predict
    for(let i=0;i<n;i++){vy[i]+=g;px[i]=x[i];py[i]=y[i];x[i]+=vx[i];y[i]+=vy[i];if(this.age[i]<65535)this.age[i]++}
    for(const b of this.bodies){b.wet=0;if(b.held)continue;b.vy+=g*(b.gscale??1);b.vx*=0.995;b.vy*=0.995;b.px=b.x;b.py=b.y;b.x+=b.vx;b.y+=b.vy}
    this.buildGrid();
    this.buoyancy();
    this.relax();
    this.collide();
    // velocities
    const vm=this.vmax,vm2=vm*vm;
    for(let i=0;i<n;i++){
      let ux=x[i]-px[i],uy=y[i]-py[i];const s2=ux*ux+uy*uy;
      if(s2>vm2){const s=vm/Math.sqrt(s2);ux*=s;uy*=s}
      if(ux!==ux||uy!==uy){x[i]=px[i];y[i]=py[i];ux=0;uy=0} // NaN guard
      vx[i]=ux;vy[i]=uy;
    }
    for(const b of this.bodies){if(b.held){continue}b.vx=b.x-b.px;b.vy=b.y-b.py;const s=Math.hypot(b.vx,b.vy);if(s>0.6){b.vx*=0.6/s;b.vy*=0.6/s}
      // gentle water drag when wet so toys settle instead of bobbing forever
      if(b.wet>2){b.vx*=0.985;b.vy*=0.97}
      b.spin=(b.spin||0)*0.96+b.vx*0.08;b.ang=(b.ang||0)+b.spin*0.25;b.ang*=b.wet>2?0.96:0.995}
    // drains
    if(this.drains.length){for(let i=this.n-1;i>=0;i--){for(const d of this.drains){const dx=x[i]-d.x,dy=y[i]-d.y;if(dx*dx+dy*dy<d.r*d.r){this.remove(i);break}}}}
  }
  /* Archimedes: measure how much of each body is under water, push up by the weight of that water */
  /* water level right beside a body (ignores a couple of stray splash drops) */
  levelNear(b){const r=b.r,BW=.5,G0=.9,NB=Math.ceil((3.4-G0)/BW),tops=new Array(NB*2).fill(1e9);let vx=0,vy=0,n=0;
    const x0=b.x-r-3.4,x1=b.x+r+3.4,y0=b.y-r-6,y1=b.y+r+1;
    for(let cy=Math.floor(y0);cy<=Math.floor(y1);cy++)for(let cx=Math.floor(x0);cx<=Math.floor(x1);cx++){const c=this.cellOf(cx+.5,cy+.5);
      for(let s=this.cellStart[c],e=this.cellStart[c+1];s<e;s++){const j=this.sorted[s],dx=this.x[j]-b.x,ad=Math.abs(dx);
        if(ad<=r+G0||ad>=r+3.4||this.y[j]<y0||this.y[j]>y1)continue;const bin=(dx<0?0:NB)+Math.min(NB-1,Math.floor((ad-r-G0)/BW));
        if(this.y[j]<tops[bin])tops[bin]=this.y[j];vx+=this.vx[j];vy+=this.vy[j];n++}}
    const t=tops.filter(v=>v<1e9);if(t.length<3)return null;t.sort((a,b2)=>a-b2);return{level:t[t.length>>1]-this.pr*.5,vx:vx/n,vy:vy/n-this.g}}   /* particle vy already includes this step's gravity */
  buoyancy(){const g=this.g;for(const b of this.bodies){if(b.d==null)continue;const L=this.levelNear(b);let f=0;
      if(L){/* area of a circle below a straight water line (circular segment) */const r=b.r,h=clamp(b.y+r-L.level,0,2*r),A=r*r*Math.acos((r-h)/r)-(r-h)*Math.sqrt(Math.max(0,2*r*h-h*h));f=A/(Math.PI*r*r)}
      b.sub=f;if(b.held)continue;
      /* buoyant force / mass = g x (area under water) / (density x area); applied to velocity and this step's position */
      let dvx=0,dvy=-this.g*(b.gscale??1)*f/b.d;
      if(L&&f>0){const k=.05*f,kv=Math.min(.35,.05/b.d)*f;dvx+=(L.vx-b.vx)*k;dvy+=(L.vy-b.vy)*kv}   /* drag toward the water's flow; light things are damped more (they must push water aside) */
      b.vx+=dvx;b.vy+=dvy;b.x+=dvx;b.y+=dvy}}  /* drag toward the water's flow */
  relax(){
    const n=this.n,x=this.x,y=this.y,vx=this.vx,vy=this.vy,gw=this.gw,cs=this.cellStart,so=this.sorted,pc=this.pcell;
    const J=this.nbJ,Q=this.nbQ,NX=this.nbX,NY=this.nbY,k=this.k,kn=this.kn,r0=this.rho0,sg=this.sigma,bt=this.beta,mix=this.mix;
    const cr=this.cr,cy=this.cyl,cb=this.cb,rhoA=this.rho;
    for(let i=0;i<n;i++){
      const xi=x[i],yi=y[i],c=pc[i];let cnt=0,rho=0,rhon=0,sr=0,sy=0,sb=0,sw=0;
      for(let oy=-gw;oy<=gw;oy+=gw)for(let ox=-1;ox<=1;ox++){
        const cell=c+oy+ox;if(cell<0||cell>=cs.length-1)continue;
        for(let s=cs[cell],e=cs[cell+1];s<e;s++){
          const j=so[s];if(j===i)continue;
          const dx=x[j]-xi,dy=y[j]-yi,d2=dx*dx+dy*dy;
          if(d2<1&&cnt<256){
            let r=Math.sqrt(d2),ux,uy;
            if(r<1e-5){r=1e-5;const a=Math.random()*6.283;ux=Math.cos(a);uy=Math.sin(a)}else{ux=dx/r;uy=dy/r}
            const om=1-r;rho+=om*om;rhon+=om*om*om;J[cnt]=j;Q[cnt]=r;NX[cnt]=ux;NY[cnt]=uy;cnt++;
            const w=om;sr+=cr[j]*w;sy+=cy[j]*w;sb+=cb[j]*w;sw+=w;
          }
        }
      }
      rhoA[i]=rho;
      let P=k*(rho-r0);if(P<this.pmin)P=this.pmin;const Pn=kn*rhon;let ddx=0,ddy=0;
      const ivx=vx[i],ivy=vy[i];
      for(let m=0;m<cnt;m++){
        const j=J[m],om=1-Q[m],ux=NX[m],uy=NY[m];
        let D=(P*om+Pn*om*om)*0.5;
        // viscosity (inward relative velocity)
        const u=(ivx-vx[j])*ux+(ivy-vy[j])*uy;
        if(u>0)D+=om*(sg*u+bt*u*u)*0.5;
        x[j]+=D*ux;y[j]+=D*uy;ddx-=D*ux;ddy-=D*uy;
      }
      x[i]+=ddx;y[i]+=ddy;
      if(sw>0&&mix>0){const t=mix*Math.min(sw,3);cr[i]+=(sr/sw-cr[i])*t;cy[i]+=(sy/sw-cy[i])*t;cb[i]+=(sb/sw-cb[i])*t}
    }
  }
  collide(){
    const n=this.n,x=this.x,y=this.y,px=this.px,py=this.py,pr=this.pr,W=this.W,H=this.H,wg=this.wgrid,walls=this.walls,bodies=this.bodies,push=this.pushers;
    for(let i=0;i<n;i++){
      let xi=x[i],yi=y[i];
      // finger pushers
      for(let p=0;p<push.length;p++){const f=push[p];const dx=xi-f.x,dy=yi-f.y,d2=dx*dx+dy*dy,R=f.r+pr;
        if(d2<R*R){const d=Math.sqrt(d2)||1e-4,o=R-d;xi+=dx/d*o;yi+=dy/d*o;
          // drag the water along with the finger
          xi+=f.vx*0.55;yi+=f.vy*0.55;}}
      // bodies
      for(let b=0;b<bodies.length;b++){const B=bodies[b];const dx=xi-B.x,dy=yi-B.y,R=B.r+pr,d2=dx*dx+dy*dy;
        if(d2<R*R){const d=Math.sqrt(d2)||1e-4,o=R-d,nx=dx/d,ny=dy/d;
          const wb=B.held||B.d!=null?0:1/(1+B.m),wp=1-wb;
          xi+=nx*o*wp;yi+=ny*o*wp;B.x-=nx*o*wb;B.y-=ny*o*wb;B.wet++;
          // friction along the surface so toys drift with currents
          const tvx=(xi-px[i])-(B.x-B.px),tvy=(yi-py[i])-(B.y-B.py);const tn=tvx*-ny+tvy*nx;
          if(!B.held){B.x+=-ny*tn*0.02*wb*8;B.y+=nx*tn*0.02*wb*8}
        }}
      // walls
      const c=this.cellOf(xi,yi),list=wg[c];
      if(list){for(let w=0;w<list.length;w++){const S=walls[list[w]];if(!S)continue;const q=FluidSim.segDist(xi,yi,S),R=S.r+pr;
        if(q.d<R){const d=q.d||1e-4,o=R-d,nx=q.dx/d,ny=q.dy/d;xi+=nx*o;yi+=ny*o;
          // friction: damp tangential motion a bit
          const vxx=xi-px[i],vyy=yi-py[i],vn=vxx*nx+vyy*ny,tx=vxx-vn*nx,ty=vyy-vn*ny;px[i]+=tx*0.08;py[i]+=ty*0.08;
          if(vn<0){px[i]+=vn*nx*0.3;py[i]+=vn*ny*0.3}}}}
      // box
      if(xi<pr)xi=pr;else if(xi>W-pr)xi=W-pr;
      if(yi>H-pr){yi=H-pr;px[i]+=(xi-px[i])*0.15}else if(yi<pr-6)yi=pr-6;
      x[i]=xi;y[i]=yi;
    }
    // bodies vs walls / box / each other
    for(let b=0;b<bodies.length;b++){const B=bodies[b];
      if(!B.held){
        for(const S of walls){const q=FluidSim.segDist(B.x,B.y,S),R=S.r+B.r;if(q.d<R){const d=q.d||1e-4,o=R-d,nx=q.dx/d,ny=q.dy/d;B.x+=nx*o;B.y+=ny*o;
          const vx=B.x-B.px,vy=B.y-B.py,vn=vx*nx+vy*ny;B.px+=(vx-vn*nx)*0.12;B.py+=(vy-vn*ny)*0.12}}
        if(B.x<B.r)B.x=B.r;if(B.x>W-B.r)B.x=W-B.r;if(B.y>H-B.r){B.y=H-B.r;B.px+=(B.x-B.px)*0.2}if(B.y<B.r-8)B.y=B.r-8;
      }
      for(let o=b+1;o<bodies.length;o++){const C=bodies[o];const dx=C.x-B.x,dy=C.y-B.y,R=B.r+C.r,d2=dx*dx+dy*dy;
        if(d2<R*R){const d=Math.sqrt(d2)||1e-4,ov=R-d,nx=dx/d,ny=dy/d;
          const ib=B.held?0:1/B.m,ic=C.held?0:1/C.m,s=ib+ic;if(!s)continue;
          B.x-=nx*ov*ib/s;B.y-=ny*ov*ib/s;C.x+=nx*ov*ic/s;C.y+=ny*ov*ic/s}}
    }
  }
}

/* ============================================================
   SPLASH LAB — particle water with color mixing, sink or float
   ============================================================ */
Object.assign(GAMES,{splash:{title:'Splash Lab',icon:'💧',c:'var(--aqua)',age:'2+',section:'lab',order:1,blurb:'Pour water, mix colors, see what floats',
init(stage,g){
  const NPA=4.3,SUB=3;
  const TOOLS=[['pour','💧','Pour'],['push','✋','Push'],['wall','✏️','Build'],['sponge','🧽','Sponge'],['toys','🦆','Toys'],['spring','⛲','Fountain'],['drain','🕳️','Drain']];
  const SCENES=[['pool','🏊','Pool'],['dam','🧱','Dam'],['falls','🏞️','Waterfall'],['mix','🎨','Color Mix'],['empty','🧹','Empty']];
  const PAINT=[['blue','#2E7CF6',[0,0,1]],['red','#F0334A',[1,0,0]],['yellow','#FFD21F',[0,1,0]]];
  const TOYS=[
    {e:'🦆',n:'duck',d:.4,r:1.25,f:'The duck floats!'},
    {e:'⚽',n:'ball',d:.12,r:1.15,f:'The ball floats! It is full of air.'},
    {e:'🍎',n:'apple',d:.8,r:1.0,f:'The apple floats! Apples have air inside them.'},
    {e:'🧊',n:'ice cube',d:.92,r:1.0,f:'Ice floats, but only just! Most of it stays under water, like an iceberg.'},
    {e:'🪵',n:'log',d:.5,r:1.3,f:'Wood floats!'},
    {e:'⛵',n:'boat',d:.3,r:1.3,f:'The boat floats!'},
    {e:'🥚',n:'egg',d:1.08,r:.95,f:'The egg sinks slowly. A fresh egg is a tiny bit heavier than water.'},
    {e:'🪨',n:'rock',d:2.6,r:1.1,f:'The rock sinks! Rocks are heavy for their size.'},
    {e:'🔑',n:'key',d:8.5,r:.9,f:'The key sinks fast! Brass metal is heavy.'},
    {e:'⚓',n:'anchor',d:7.9,r:1.2,f:'The iron anchor sinks to the bottom!'},
    {e:'🐟',n:'fish',d:1,r:1.05,fish:1,f:'The fish swims! Fish can float in the middle.'},
    {e:'🐙',n:'octopus',d:1,r:1.15,fish:1,f:'The octopus swims!'}];
  stage.innerHTML=`<div class="simwrap"><div class="simarea"><canvas class="simcv" aria-label="Water play area"></canvas><div class="simhint" id="hint"></div></div>
    <div class="dock"><div class="drow wrap" id="tools">
      ${TOOLS.map(t=>`<button class="tool" data-t="${t[0]}"${t[0]==='toys'?' aria-haspopup="menu"':''}><span class="ti">${t[1]}</span>${t[2]}${t[0]==='toys'?'<span class="caret">▾</span>':''}</button>`).join('')}<span class="sep"></span>
      ${PAINT.map((p,i)=>`<button class="cdot ${i===0?'on':''}" data-p="${i}" style="--c:${p[1]}" aria-label="${p[0]} water"></button>`).join('')}<span class="sep"></span>
      <button class="tool scene" id="scenes" aria-haspopup="menu"><span class="ti">🎬</span>Scenes<span class="caret">▾</span></button></div></div></div>`;
  const cv=stage.querySelector('canvas'),ctx=cv.getContext('2d'),hintEl=stage.querySelector('#hint');
  const ov=fxOverlay(stage.querySelector('.simarea'));let focus=null;
  function ovUpdate(){const RHO='#2F6FE0',M='#E8384F',VV='#1FA463';
    let toy='';if(focus&&sim.bodies.includes(focus)){const t=focus.t,area=Math.PI*focus.r*focus.r,top=focus.y-focus.r;
      const sub=focus.sub||0;
      toy=t.fish?`<div class="fx hot"><span class="tag">${t.e} ${t.n}</span><div class="row">${V('ρ',RHO)} = <span class="num">1.0</span> g/cm³ = water</div><div class="row note">Fish fill a balloon inside them with just enough air to match water, so they hover.</div></div>`
       :`<div class="fx hot"><span class="tag">${t.e} ${t.n}</span><div class="row">${V('ρ',RHO)} = ${frac(V('m',M),V('V',VV))} = <span class="num" style="color:${RHO}">${fmt(t.d,2)}</span> g/cm³</div>
        <div class="row">${t.d<1?`<span class="num">${fmt(t.d,2)}</span> &lt; 1.0 → <b>floats</b>`:`<span class="num">${fmt(t.d,2)}</span> &gt; 1.0 → <b>sinks</b>`}</div>
        ${t.d<1?`<div class="row note">Should be ${frac(fmt(t.d,2),'1.0')} = ${Math.round(t.d*100)}% under water. Measured: ${Math.round((focus.sub||0)*100)}%</div>`:''}</div>`}
    ov.set(`${toy||'<div class="fx hot"><span class="tag">Sink or float?</span><div class="row">Drop a toy or grab one to measure it.</div></div>'}
      <div class="fx"><span class="tag">Density</span><div class="row">${V('ρ',RHO)} = ${frac(V('m',M),V('V',VV))}</div><div class="row note">water ${V('ρ',RHO)} = 1.0 g/cm³</div></div>
      <div class="fx"><span class="tag">Archimedes</span><div class="row">${V('F',M)}<sub>up</sub> = ${V('ρ',RHO)}<sub>water</sub> · ${V('V',VV)}<sub>under</sub> · ${V('g','#9A5BFF')}</div><div class="row note">Water pushes up as hard as the weight of the water you push aside.</div></div>`)}
  let dims=fitCanvas(cv);
  const cap=clamp(Math.round(dims.w*dims.h/300),900,3200);
  const S=clamp(Math.sqrt(dims.w*dims.h*0.42*5/cap),15,40);   // px per sim unit
  const sim=new FluidSim(cap);sim.resize(dims.w/S,dims.h/S);
  let tool='pour',paint=0,toyPick=0;const springs=[];
  const hint=makeHint(hintEl);

  /* ---------- color: RYB paint mixing -> RGB ---------- */
  const C={w:[1,1,1],r:[.94,.2,.27],y:[1,.8,.05],b:[.1,.42,.95],o:[1,.52,.1],p:[.6,.24,.86],gr:[.15,.76,.34],k:[.46,.3,.2]};
  const prR=new Uint8ClampedArray(cap),prG=new Uint8ClampedArray(cap),prB=new Uint8ClampedArray(cap);
  function ryb(r,y,b,o,i){const m=Math.max(r,y,b,1e-4);r/=m;y/=m;b/=m;const ir=1-r,iy=1-y,ib=1-b;
    for(let c=0;c<3;c++){const v=C.w[c]*ir*iy*ib+C.r[c]*r*iy*ib+C.y[c]*ir*y*ib+C.b[c]*ir*iy*b+C.o[c]*r*y*ib+C.p[c]*r*iy*b+C.gr[c]*ir*y*b+C.k[c]*r*y*b;o[c][i]=v*255}}
  const outs=[prR,prG,prB];

  /* ---------- background ---------- */
  const bg=document.createElement('canvas');
  function drawBg(){bg.width=cv.width;bg.height=cv.height;const b=bg.getContext('2d'),d=dims.d;b.setTransform(d,0,0,d,0,0);
    const gr=b.createLinearGradient(0,0,0,dims.h);gr.addColorStop(0,'#F4FBFF');gr.addColorStop(1,'#D7EEF8');b.fillStyle=gr;b.fillRect(0,0,dims.w,dims.h);
    const t=S*2.2;b.strokeStyle='rgba(62,103,240,.09)';b.lineWidth=2;
    for(let x=t;x<dims.w;x+=t){b.beginPath();b.moveTo(x,0);b.lineTo(x,dims.h);b.stroke()}
    for(let y=dims.h-t;y>0;y-=t){b.beginPath();b.moveTo(0,y);b.lineTo(dims.w,y);b.stroke()}
    b.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<14;i++){b.beginPath();b.arc((i*137)%dims.w,(i*89)%dims.h,3,0,7);b.fill()}}
  drawBg();

  /* ---------- metaball field ---------- */
  let fs,fw,fh,FD,FR,FG,FB,FF,img,fcv,fctx,K,KR,SURF;
  function setupField(){
    fs=clamp(Math.round(Math.sqrt(dims.w*dims.h/70000)),3,6);fw=Math.ceil(dims.w/fs)+1;fh=Math.ceil(dims.h/fs)+1;
    FD=new Float32Array(fw*fh);FR=new Float32Array(fw*fh);FG=new Float32Array(fw*fh);FB=new Float32Array(fw*fh);FF=new Float32Array(fw*fh);
    SURF=new Int16Array(fw);fcv=document.createElement('canvas');fcv.width=fw;fcv.height=fh;fctx=fcv.getContext('2d');img=fctx.createImageData(fw,fh);
    KR=Math.max(2,Math.round(0.85*S/fs));const n=2*KR+1;K=new Float32Array(n*n);
    for(let y=-KR;y<=KR;y++)for(let x=-KR;x<=KR;x++){const q=(x*x+y*y)/(KR*KR);K[(y+KR)*n+x+KR]=q<1?(1-q)*(1-q):0}
  }
  setupField();
  function renderWater(){
    FD.fill(0);FR.fill(0);FG.fill(0);FB.fill(0);FF.fill(0);
    const n=sim.n,x=sim.x,y=sim.y,vx=sim.vx,vy=sim.vy,kn=2*KR+1,sc=S/fs;
    for(let i=0;i<n;i++)ryb(sim.cr[i],sim.cyl[i],sim.cb[i],outs,i);
    for(let i=0;i<n;i++){
      const cx=Math.round(x[i]*sc),cy=Math.round(y[i]*sc),r=prR[i],gg=prG[i],b=prB[i];
      const sp=Math.min(1,(Math.abs(vx[i])+Math.abs(vy[i]))*4);
      const y0=Math.max(-KR,-cy),y1=Math.min(KR,fh-1-cy),x0=Math.max(-KR,-cx),x1=Math.min(KR,fw-1-cx);
      for(let ky=y0;ky<=y1;ky++){let p=(cy+ky)*fw+cx+x0,k=(ky+KR)*kn+x0+KR;
        for(let kx=x0;kx<=x1;kx++,p++,k++){const w=K[k];if(w>0){FD[p]+=w;FR[p]+=r*w;FG[p]+=gg*w;FB[p]+=b*w;FF[p]+=sp*w}}}
    }
    const D=img.data,T=0.38,surf=SURF,ph=frame*.05,dpx=fs/S;
    for(let xx=0;xx<fw;xx++)surf[xx]=-1;
    for(let yy=0,p=0;yy<fh;yy++){for(let xx=0;xx<fw;xx++,p++){const d=FD[p],o=p*4;
      if(d<T){D[o+3]=0;surf[xx]=-1;continue}
      if(surf[xx]<0)surf[xx]=yy;
      const below=(yy-surf[xx])*dpx;                          // sim units under this column's surface
      const inv=1/d;let r=FR[p]*inv,gg=FG[p]*inv,b=FB[p]*inv;
      const edge=1-Math.min(1,(d-T)/0.8);
      const foam=Math.min(1,FF[p]*inv*1.3);
      const rim=below<0.55?1-below/0.55:0;                     // bright surface line
      const wave=below>1.2?Math.sin(xx*.11+ph+Math.sin(yy*.09-ph*.7)*2.2)*Math.sin(yy*.07+ph*.6+Math.sin(xx*.05)*1.5):0;
      const lift=Math.min(.8,edge*.12+rim*.5+foam*.3+(wave>.55?(wave-.55)*.5:0));
      const deep=Math.min(.4,.06+below*.014);
      r=(r+(255-r)*lift)*(1-deep);gg=(gg+(255-gg)*lift)*(1-deep*.8);b=(b+(255-b)*lift)*(1-deep*.35);
      D[o]=r;D[o+1]=gg;D[o+2]=b;D[o+3]=Math.min(1,(d-T)*14)*Math.min(255,215+40*edge+90*rim+40*deep);
    }}
    fctx.putImageData(img,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(fcv,0,0,fw*fs,fh*fs);
  }

  /* ---------- toys ---------- */
  function addToy(t,x,y){
    if(sim.bodies.length>=14){const old=sim.bodies.shift();}
    const b={x,y,px:x,py:y,vx:0,vy:0,r:t.r,m:t.d*Math.PI*t.r*t.r*NPA,d:t.fish?1:t.d,t,wet:0,wetF:0,said:false,ang:0,face:1,born:performance.now()};
    if(t.fish){b.gscale=1;b.target={x:Math.random()*sim.W,y:sim.H*0.7}}
    sim.bodies.push(b);focus=b;return b;
  }
  function toyAt(x,y){for(let i=sim.bodies.length-1;i>=0;i--){const b=sim.bodies[i];if(Math.hypot(b.x-x,b.y-y)<b.r*1.35)return b}return null}

  /* ---------- particles in / out ---------- */
  function spawn(x,y,vx,vy,ci,exact){
    if(sim.n>=sim.cap){let o=0,a=-1;for(let i=0;i<sim.n;i++)if(sim.age[i]>a){a=sim.age[i];o=i}sim.remove(o)}
    const c=PAINT[ci][2];if(!exact){x+=(Math.random()-.5)*.5;y+=(Math.random()-.5)*.5}sim.add(x,y,vx,vy,c[0],c[1],c[2]);
  }
  /* nozzle: lays rows of particles at rest spacing so water leaves as a smooth stream */
  const SP=.46;
  function emit(e,x,y,dx,dy,speed,width,ci){
    const l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l,nx=-uy,ny=ux;
    e.acc=(e.acc||0)+speed*SUB;let rows=0;
    while(e.acc>=SP&&rows<4){e.acc-=SP;rows++;
      const k=Math.max(1,Math.round(width/SP)),back=e.acc+rows*0;
      for(let j=0;j<k;j++){const o=(j-(k-1)/2)*SP+(Math.random()-.5)*.06;spawn(x+nx*o-ux*e.acc,y+ny*o-uy*e.acc,ux*speed,uy*speed,ci,true)}}
  }
  function fillRect(x0,y0,x1,y1,ci){const c=PAINT[ci][2];for(let y=y1-.3;y>y0;y-=.47)for(let x=x0+.3;x<x1;x+=.47){if(sim.n>=sim.cap)return;sim.add(x+Math.random()*.05,y,0,0,c[0],c[1],c[2])}}
  function wallLine(pts){for(let i=1;i<pts.length;i++)sim.addWall(pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1])}

  /* ---------- scenes ---------- */
  const announced=new Set();
  function clearAll(){sim.n=0;sim.walls=[];sim.rebuildWallGrid();sim.bodies.length=0;sim.drains.length=0;springs.length=0;announced.clear()}
  function scene(k){
    clearAll();const W=sim.W,H=sim.H;tool='pour';
    if(k==='pool'){fillRect(0,H*.6,W,H,0);addToy(TOYS[0],W*.3,H*.45);addToy(TOYS[1],W*.6,H*.4);hint('Pour, push, and drop in toys!');say('Splash! Drop toys in to see what floats.')}
    if(k==='dam'){const dx=W*.42;sim.addWall(dx,H,dx,H*.28,0.7);fillRect(0,H*.32,dx-.8,H,0);addToy(TOYS[5],W*.2,H*.25);addToy(TOYS[7],W*.72,H-1.2);addToy(TOYS[0],W*.86,H-1.4);
      tool='sponge';syncTools();hint('Rub the brown wall with the sponge to break the dam!',6000);say('Use the sponge to break the dam!')}
    if(k==='falls'){wallLine([[0,H*.22],[W*.32,H*.32]]);wallLine([[W*.62,H*.38],[W*.3,H*.5]]);wallLine([[W*.4,H*.66],[W*.75,H*.76]]);
      springs.push({x:1.5,y:H*.08,vx:.13,vy:.02,ci:0,w:1.8});sim.drains.push({x:W-1.6,y:H-1.6,r:1.7});fillRect(0,H*.86,W*.5,H,0);addToy(TOYS[0],W*.2,H*.75);
      hint('Water runs downhill. Draw your own ramps!');say('A waterfall! Water always flows downhill.')}
    if(k==='mix'){wallLine([[W*.08,H*.3],[W*.5,H*.92],[W*.92,H*.3]]);
      const vol=Math.round(0.5*.84*W*.6*H*NPA*.42);springs.push({x:W*.2,y:H*.08,vx:0,vy:.14,ci:2,w:1.8,left:vol},{x:W*.8,y:H*.08,vx:0,vy:.14,ci:0,w:1.8,left:vol});
      hint('Yellow and blue are pouring in. What color will they make?',6000);say('Yellow and blue are pouring in. Watch what color they make!')}
    if(k==='empty'){hint('Empty! Pour some water.');say('All clean!')}
    syncTools();
  }

  /* ---------- color-mix detective ---------- */
  const MIXES=[['gr','y','b','Blue and yellow make green!','🟦 + 🟨 = 🟩'],['o','r','y','Red and yellow make orange!','🟥 + 🟨 = 🟧'],['p','r','b','Red and blue make purple!','🟥 + 🟦 = 🟪'],['k','r','y','All three colors make brown!','🟥 + 🟨 + 🟦 = 🟫']];
  function checkMix(){
    let cnt={gr:0,o:0,p:0,k:0},sx={gr:0,o:0,p:0,k:0},sy={gr:0,o:0,p:0,k:0};
    for(let i=0;i<sim.n;i+=2){const r=sim.cr[i],y=sim.cyl[i],b=sim.cb[i],m=Math.max(r,y,b);if(m<=0)continue;const R=r/m,Y=y/m,B=b/m;
      let k=null;if(R>.45&&Y>.45&&B>.45)k='k';else if(Y>.45&&B>.45&&R<.25)k='gr';else if(R>.45&&Y>.45&&B<.25)k='o';else if(R>.45&&B>.45&&Y<.25)k='p';
      if(k){cnt[k]++;sx[k]+=sim.x[i];sy[k]+=sim.y[i]}}
    for(const m of MIXES){const k=m[0];if(cnt[k]>14&&!announced.has(k)){announced.add(k);say(m[3]);const r=cv.getBoundingClientRect();
      floaty(stage,r.left+sx[k]/cnt[k]*S,r.top+sy[k]/cnt[k]*S-40,m[4]);tone(660,.15,'triangle');tone(990,.25,'triangle',.18,.12);addStar();break}}
  }

  /* ---------- input ---------- */
  const fingersMap=fingers(cv,{
    down(f){const x=f.x/S,y=f.y/S;const b=toyAt(x,y);
      if(b&&tool!=='sponge'){if(b.held)return;f.data.toy=b;b.held=true;b.tx=x;b.ty=y;focus=b;tone(500,.08,'triangle');return}
      if(tool==='toys'){const t=TOYS[toyPick];addToy(t,x,y);pop(.9);say(t.n);return}
      if(tool==='wall'){f.data.pts=[[x,y]];return}
      if(tool==='spring'){const i=springs.findIndex(s=>Math.hypot(s.x-x,s.y-y)<1.6);if(i>=0){springs.splice(i,1);tone(300,.12);return}
        if(springs.length>=4)springs.shift();const upward=y>sim.H*.55;springs.push({x,y,vx:0,vy:upward?-.36:.12,ci:paint,w:upward?.95:1.4});tone(700,.15,'triangle');
        say(upward?'A fountain!':'A faucet!');return}
      if(tool==='drain'){const i=sim.drains.findIndex(s=>Math.hypot(s.x-x,s.y-y)<1.8);if(i>=0){sim.drains.splice(i,1);tone(300,.12);return}
        if(sim.drains.length>=4)sim.drains.shift();sim.drains.push({x,y,r:1.6});noise(.5,600,2,.2,0,150);say('A drain! Water goes down the hole.');return}
      if(tool==='pour'){for(let a=0;a<3;a++)for(let c=0;c<3;c++)spawn(x+(c-1)*SP,y+(a-1)*SP,0,.05,paint,true);noise(.25,1400,1.5,.12,0,500)}
    },
    move(f){const b=f.data.toy;if(b)return;
      if(tool==='wall'&&f.data.pts){const p=f.data.pts,l=p[p.length-1],x=f.x/S,y=f.y/S;if(Math.hypot(x-l[0],y-l[1])>0.8&&sim.walls.length<700){sim.addWall(l[0],l[1],x,y);p.push([x,y]);tone(180+Math.random()*60,.04,'square',.03)}}},
    up(f){const b=f.data.toy;if(b){b.held=false;b.px=b.x-clamp(f.vx/S/SUB,-.5,.5);b.py=b.y-clamp(f.vy/S/SUB,-.5,.5);b.vx=b.x-b.px;b.vy=b.y-b.py}
      if(tool==='wall'&&f.data.pts&&f.data.pts.length===1){const[x,y]=f.data.pts[0];sim.addWall(x-.6,y,x+.6,y)}}
  });

  /* ---------- tools UI ---------- */
  const TIP={pour:'Touch and drag to pour water. Pick a color first!',push:'Swish the water around with your finger. You can grab toys too!',wall:'Draw walls, cups and ramps with your finger.',
    sponge:'Rub to soak up water and wipe away walls.',toys:'Tap the water to drop a toy in.',spring:'Tap the bottom for a fountain, the top for a faucet.',drain:'Tap to make a drain hole. Tap it again to close it.'};
  function syncTools(){stage.querySelectorAll('.tool[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===tool));stage.querySelectorAll('.cdot').forEach(b=>b.classList.toggle('on',+b.dataset.p===paint));
    const tb=stage.querySelector('.tool[data-t="toys"] .ti');if(tb)tb.textContent=TOYS[toyPick].e}
  function toyMenu(btn){popMenu(btn,`<div class="popgrid">${TOYS.map((t,i)=>`<button class="popitem ${i===toyPick?'on':''}" data-toy="${i}"><span class="pe">${t.e}</span>${t.n}</button>`).join('')}</div>`,b=>{
    toyPick=+b.dataset.toy;tool='toys';syncTools();hint('Tap the water to drop the '+TOYS[toyPick].n+'.',2600,true)})}
  stage.querySelector('#tools').addEventListener('click',e=>{const c=e.target.closest('.cdot');if(c){paint=+c.dataset.p;if(tool!=='pour'&&tool!=='spring')tool='pour';syncTools();tone(500+paint*120,.08,'triangle');return}
    const b=e.target.closest('.tool');if(!b)return;
    if(b.id==='scenes'){popMenu(b,`<div class="popgrid">${SCENES.map(t=>`<button class="popitem" data-s="${t[0]}"><span class="pe">${t[1]}</span>${t[2]}</button>`).join('')}</div>`,x=>{scene(x.dataset.s);tone(440,.1,'triangle');tone(660,.14,'triangle',.18,.08)});return}
    if(b.dataset.t==='toys'){tool='toys';syncTools();toyMenu(b);return}
    tool=b.dataset.t;syncTools();tone(520,.08,'triangle');hint(TIP[tool],2600)});
  syncTools();

  /* ---------- per-frame ---------- */
  let frame=0,pourTick=0,soundTick=0,perf=0;
  function update(){
    const W=sim.W,H=sim.H;sim.pushers.length=0;
    let pouring=false;
    for(const f of fingersMap.values()){const x=f.x/S,y=f.y/S;
      if(f.data.toy){const b=f.data.toy;b.tx=x;b.ty=y;continue}
      if(tool==='push')sim.pushers.push({x,y,vx:f.vx/S/SUB,vy:f.vy/S/SUB,r:1.7});
      if(tool==='pour'){pouring=true;emit(f.data,x,y,clamp(f.vx/S/SUB,-.15,.15),.16,.16,1.4,paint)}
      if(tool==='sponge'){let got=0;for(let i=sim.n-1;i>=0;i--){const dx=sim.x[i]-x,dy=sim.y[i]-y;if(dx*dx+dy*dy<4.4){sim.remove(i);got++}}
        const hadWall=sim.removeWallsNear(x,y,1.3);
        for(let i=0;i<springs.length;i++){if(Math.hypot(springs[i].x-x,springs[i].y-y)<1.5){springs.splice(i,1);i--}}
        for(let i=sim.drains.length-1;i>=0;i--)if(Math.hypot(sim.drains[i].x-x,sim.drains[i].y-y)<1.5)sim.drains.splice(i,1);
        for(let i=sim.bodies.length-1;i>=0;i--)if(Math.hypot(sim.bodies[i].x-x,sim.bodies[i].y-y)<sim.bodies[i].r+.6){sim.bodies.splice(i,1);pop(.6)}
        if((got>3||hadWall)&&soundTick<=0){noise(.18,hadWall?300:900,1,.16,0,hadWall?200:300);soundTick=6}}
    }
    // springs
    for(let k=springs.length-1;k>=0;k--){const s=springs[k],before=sim.n;const sp=Math.hypot(s.vx,s.vy)||.1;emit(s,s.x,s.y,s.vx||0,s.vy||.1,Math.max(sp,.1),s.w||1.4,s.ci);
      if(s.left!=null&&(s.left-=Math.max(1,sim.n-before))<=0){springs.splice(k,1);if(!springs.length)hint('Stir it with the Push tool!',4000)}}
    if(pouring&&soundTick<=0){noise(.12,800+Math.random()*1400,2,.07);if(Math.random()<.3)tone(500+Math.random()*700,.08,'sine',.05,0,1400);soundTick=4}
    soundTick--;
    // held toys + fish brains
    for(const b of sim.bodies){
      if(b.held){b.vx=0;b.vy=0}
      if(b.t.fish&&!b.held){
        if(b.wetF>4){b.gscale=.0;const T=b.target;const dx=T.x-b.x,dy=T.y-b.y,dd=Math.hypot(dx,dy);
          if(dd<1.5||Math.random()<.004){b.target={x:1+Math.random()*(W-2),y:clamp(b.y+(Math.random()-.5)*8,2,H-1)}}
          b.vx+=dx/dd*.004;b.vy+=dy/dd*.004;if(Math.abs(b.vx)>.02)b.face=b.vx>0?-1:1}
        else{b.gscale=1;if(b.y>H-b.r-.1&&Math.random()<.03){b.vy=-.25;b.vx=(Math.random()-.5)*.2;tone(300,.06,'sine',.05,0,600)}}
      }
    }
    for(let s=0;s<SUB;s++){
      for(const b of sim.bodies)if(b.held&&b.tx!=null){b.px=b.x;b.py=b.y;b.x=lerp(b.x,b.tx,.35);b.y=lerp(b.y,b.ty,.35)}
      sim.step();
      for(const b of sim.bodies){b.wetF=b.wet>3?b.wetF+1:Math.max(0,b.wetF-1)}
    }
    // splash + sink/float lesson
    for(const b of sim.bodies){
      if(b.wetF>0&&!b.splashed){b.splashed=true;const sp=Math.hypot(b.vx,b.vy);if(sp>.08){noise(.35,700,.8,Math.min(.35,sp),0,250);tone(220,.18,'sine',.12,0,90)}}
      if(b.wetF===0&&b.splashed&&!b.held&&b.wet===0)b.splashed=false;
      if(!b.said&&b.wetF>45&&!b.held){b.said=true;say(b.t.f);const r=cv.getBoundingClientRect();
        floaty(stage,r.left+b.x*S,r.top+b.y*S-b.r*S-30,b.t.fish?'Swims!':b.t.d<1?'Floats!':'Sinks!')}
    }
    if(++frame%45===0)checkMix();
  }
  function draw(){
    ctx.setTransform(dims.d,0,0,dims.d,0,0);ctx.drawImage(bg,0,0,dims.w,dims.h);
    // drains
    for(const d of sim.drains){const x=d.x*S,y=d.y*S,r=d.r*S;ctx.fillStyle='#1D1842';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
      ctx.strokeStyle='#7E8BB8';ctx.lineWidth=3;for(let a=0;a<3;a++){ctx.beginPath();ctx.arc(x,y,r*.55,frame*.12+a*2.1,frame*.12+a*2.1+1.2);ctx.stroke()}}
    // toys (behind the water so they look submerged)
    ctx.textAlign='center';ctx.textBaseline='middle';
    for(const b of sim.bodies){ctx.save();ctx.translate(b.x*S,b.y*S);ctx.rotate(b.ang||0);if(b.face===-1)ctx.scale(-1,1);
      ctx.font=`${b.r*S*2.25}px serif`;ctx.fillText(b.t.e,0,b.r*S*.08);ctx.restore()}
    renderWater();
    // walls
    if(sim.walls.length){ctx.lineCap='round';
      for(const pass of [0,1,2]){ctx.beginPath();for(const w of sim.walls){ctx.moveTo(w.x1*S,w.y1*S);ctx.lineTo(w.x2*S,w.y2*S)}
        const R=sim.walls[0].r*S;ctx.lineWidth=pass===0?R*2+6:pass===1?R*2:R*.5;ctx.strokeStyle=pass===0?'#1D1842':pass===1?'#C2834A':'rgba(255,255,255,.28)';ctx.stroke()}}
    // springs
    for(const s of springs){const x=s.x*S,y=s.y*S;ctx.fillStyle=PAINT[s.ci][1];ctx.strokeStyle='#1D1842';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(x,y,S*.75,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-S*.22,y-S*.22,S*.18,0,7);ctx.fill()}
    // finger cursors
    for(const f of fingersMap.values()){if(f.data.toy)continue;ctx.lineWidth=4;ctx.strokeStyle='rgba(29,24,66,.55)';ctx.setLineDash(tool==='sponge'?[6,6]:[]);
      const r=tool==='push'?1.7*S:tool==='sponge'?2.1*S:tool==='pour'?.9*S:0;if(r){ctx.beginPath();ctx.arc(f.x,f.y,r,0,7);ctx.stroke()}ctx.setLineDash([])
      if(tool==='sponge'){ctx.font=`${S*2}px serif`;ctx.fillText('🧽',f.x,f.y)}}
  }
  function resize(){const nd=fitCanvas(cv);if(Math.abs(nd.w-dims.w)<2&&Math.abs(nd.h-dims.h)<2&&nd.d===dims.d)return;dims=nd;sim.resize(dims.w/S,dims.h/S);drawBg();setupField()}
  const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  scene('pool');
  kbPointer(g,cv);
  const TK=TOOLS.map(t=>t[0]);
  g.key(e=>{if(/^[1-7]$/.test(e.key)){tool=TK[+e.key-1];syncTools();tone(520,.08,'triangle');return true}
    const sc={p:'pool',d:'dam',w:'falls',m:'mix',x:'empty'}[e.key.toLowerCase()];if(sc){scene(sc);return true}return false});
  g.loop(()=>{const t0=performance.now();update();draw();if(frame%12===0)ovUpdate();perf=lerp(perf,performance.now()-t0,.05);if(perf>30&&sim.cap>900&&frame>240&&frame%90===0){sim.cap=Math.max(900,Math.floor(sim.n*.9))}});
  GAMES.splash._debug={sim,get perf(){return perf},announced,scene,TOYS,get tool(){return tool},get springs(){return springs},get S(){return S},addToy};
}}});
