/* ============================================================
   SHAPE LAB — polygons, Pythagoras, circles and the unit circle
   ============================================================ */
Object.assign(GAMES,{geo:{title:'Shape Lab',icon:'📐',c:'var(--leaf)',age:'7+',section:'math',order:3,blurb:'Stretch shapes. Watch area, angles and π come alive.',
init(stage,g){
  const ui=labShell(stage,{label:'Geometry board',top:`${chips('m',[['poly','⬟ Polygon'],['pyth','📐 Pythagoras'],['circ','⭕ Circle'],['unit','🌀 Unit circle']],'poly')}<span class="sep"></span><span id="extra" class="pbar"></span>`,panel:'<div id="pn"></div>'});
  const {cv,panel}=ui,ctx=cv.getContext('2d');let dims=fitCanvas(cv),P,mode='poly',frame=0;
  const RED='#E8384F',BLUE='#2F6FE0',GRN='#1FA463',PUR='#9A5BFF',ORG='#FF8A2B';
  let poly=[[-3,-2],[3,-2],[2,3],[-2,3]],tri={a:3,b:4},circ={r:3,unroll:0,roll:false},unit={t:Math.PI/4,hist:[]},found=new Set(),unrolled=new Set(),view={pyth:null,circ:null};
  const area=pts=>{let s=0;for(let i=0;i<pts.length;i++){const[a,b]=pts[i],[c,d]=pts[(i+1)%pts.length];s+=a*d-b*c}return s/2};
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  function angles(pts){const n=pts.length,sg=Math.sign(area(pts))||1;return pts.map((p,i)=>{const a=pts[(i+n-1)%n],b=pts[(i+1)%n];
    let t=Math.atan2(a[1]-p[1],a[0]-p[0])-Math.atan2(b[1]-p[1],b[0]-p[0]);t*=sg;t=((t%(2*Math.PI))+2*Math.PI)%(2*Math.PI);return t*180/Math.PI})}
  function simple(pts){const n=pts.length,ix=(p1,p2,p3,p4)=>{const d=(p2[0]-p1[0])*(p4[1]-p3[1])-(p2[1]-p1[1])*(p4[0]-p3[0]);if(!d)return false;
      const u=((p3[0]-p1[0])*(p4[1]-p3[1])-(p3[1]-p1[1])*(p4[0]-p3[0]))/d,v=((p3[0]-p1[0])*(p2[1]-p1[1])-(p3[1]-p1[1])*(p2[0]-p1[0]))/d;return u>0&&u<1&&v>0&&v<1};
    for(let i=0;i<n;i++)for(let j=i+2;j<n;j++){if(i===0&&j===n-1)continue;if(ix(pts[i],pts[(i+1)%n],pts[j],pts[(j+1)%n]))return false}return true}
  function nameOf(pts){const n=pts.length,s=pts.map((p,i)=>dist(p,pts[(i+1)%n])),a=angles(pts),tol=1e-3*Math.max(...s,1),eq=(x,y)=>Math.abs(x-y)<tol,right=a.map(v=>Math.abs(v-90)<.5);
    if(n===3){const iso=eq(s[0],s[1])||eq(s[1],s[2])||eq(s[0],s[2]);if(eq(s[0],s[1])&&eq(s[1],s[2]))return'Equilateral triangle';if(right.some(Boolean))return iso?'Right isosceles triangle':'Right triangle';return iso?'Isosceles triangle':'Scalene triangle'}
    if(n===4){const allR=right.every(Boolean),allS=eq(s[0],s[1])&&eq(s[1],s[2])&&eq(s[2],s[3]);if(allR&&allS)return'Square';if(allR)return'Rectangle';if(allS)return'Rhombus';
      const par=(i,j)=>{const u=[pts[(i+1)%4][0]-pts[i][0],pts[(i+1)%4][1]-pts[i][1]],v=[pts[(j+1)%4][0]-pts[j][0],pts[(j+1)%4][1]-pts[j][1]];return Math.abs(u[0]*v[1]-u[1]*v[0])<1e-3*Math.hypot(...u)*Math.hypot(...v)};
      if(par(0,2)&&par(1,3))return'Parallelogram';if(par(0,2)||par(1,3))return'Trapezoid';if((eq(s[0],s[1])&&eq(s[2],s[3]))||(eq(s[1],s[2])&&eq(s[3],s[0])))return'Kite';return'Quadrilateral'}
    return['','','','','','Pentagon','Hexagon','Heptagon','Octagon'][n]}
  /* ---------- panels ---------- */
  function extraUI(){const ex=stage.querySelector('#extra');
    ex.innerHTML=mode==='poly'?`<button class="pbtn small" id="addc">➕ Corner</button><button class="pbtn small" id="subc">➖ Corner</button><button class="pbtn small" id="reg">✨ Make it perfect</button>`
      :mode==='circ'?`<button class="pbtn small go" id="unroll">🛞 Unroll it</button>`:mode==='unit'?`<button class="pbtn small" id="snap">🎯 Special angles</button>`:`<span class="note" id="trip">Find whole-number triangles: 0 found</span>`}
  stage.querySelector('#extra').addEventListener('click',e=>{const id=e.target.closest('button')?.id;if(!id)return;tone(560,.07,'triangle');
    if(id==='addc'&&poly.length<8){let bi=0,bl=0;for(let i=0;i<poly.length;i++){const l=dist(poly[i],poly[(i+1)%poly.length]);if(l>bl){bl=l;bi=i}}const a=poly[bi],b=poly[(bi+1)%poly.length];poly.splice(bi+1,0,[Math.round((a[0]+b[0])/2),Math.round((a[1]+b[1])/2)])}
    if(id==='subc'&&poly.length>3)poly.pop();
    if(id==='reg'){const n=poly.length,R=n===4?3*Math.SQRT2:3.5;poly=[...Array(n)].map((_,i)=>{const t=-Math.PI/2+i*2*Math.PI/n+(n===4?Math.PI/4:0);return[+(R*Math.cos(t)).toFixed(3),+(-R*Math.sin(t)).toFixed(3)]})}
    if(id==='unroll'){circ.roll=true;circ.unroll=0;noise(1.2,300,.5,.08)}
    if(id==='snap'){const S=[0,30,45,60,90,120,135,150,180,210,225,240,270,300,315,330];const d=((unit.t*180/Math.PI)%360+360)%360;const nx=S.find(v=>v>d+.5)??0;unit.t=nx*Math.PI/180}panelHTML()});
  const sqrtStr=v=>{const r=Math.round(v);if(Math.abs(Math.sqrt(r)-Math.round(Math.sqrt(r)))<1e-9)return `<span class="num">${Math.round(Math.sqrt(r))}</span>`;return `√<span class="num">${r}</span> ≈ <span class="num">${fmt(Math.sqrt(v),2)}</span>`};
  const EX={0:['1','0'],30:['√3/2','1/2'],45:['√2/2','√2/2'],60:['1/2','√3/2'],90:['0','1'],120:['−1/2','√3/2'],135:['−√2/2','√2/2'],150:['−√3/2','1/2'],180:['−1','0'],210:['−√3/2','−1/2'],225:['−√2/2','−√2/2'],240:['−1/2','−√3/2'],270:['0','−1'],300:['1/2','−√3/2'],315:['√2/2','−√2/2'],330:['√3/2','−1/2']};
  function panelHTML(){const pn=panel.querySelector('#pn');
    if(mode==='poly'){const n=poly.length,A=Math.abs(area(poly)),per=poly.reduce((s,p,i)=>s+dist(p,poly[(i+1)%n]),0),ok=simple(poly),an=angles(poly);
      pn.innerHTML=`<div class="fx big hot"><span class="tag">This shape is a</span><div class="row"><b>${ok?nameOf(poly):'Tangled shape!'}</b></div></div>
       <div class="fx"><span class="tag">Corners add up to</span><div class="row">(${V('n',PUR)} − 2) × 180° = (<span class="num" style="color:${PUR}">${n}</span> − 2) × 180° = <span class="num">${(n-2)*180}°</span></div>
         <div class="row note">${an.map(a=>Math.round(a)+'°').join(' + ')} = ${Math.round(an.reduce((s,a)=>s+a,0))}°</div></div>
       <div class="fx"><span class="tag">Area (squares inside)</span><div class="row"><span class="num" style="color:${GRN}">${fmt(A,2)}</span> square units</div>
         ${n===3?`<div class="row note">triangle: ${frac('1','2')} × base × height</div>`:''}${nameOf(poly)==='Rectangle'||nameOf(poly)==='Square'?`<div class="row note">length × width = ${fmt(dist(poly[0],poly[1]),2)} × ${fmt(dist(poly[1],poly[2]),2)}</div>`:''}</div>
       <div class="fx"><span class="tag">Perimeter (walk around)</span><div class="row"><span class="num" style="color:${ORG}">${fmt(per,2)}</span> units</div></div>
       <p class="note">Drag the corners. Twist two fingers to spin the shape. The angles and area stay the same!</p>`}
    if(mode==='pyth'){const{a,b}=tri,c2=a*a+b*b;
      pn.innerHTML=`<div class="fx big hot"><span class="tag">Pythagoras</span><div class="row">${V('a',RED)}² + ${V('b',BLUE)}² = ${V('c',GRN)}²</div>
         <div class="row"><span class="num" style="color:${RED}">${a}</span>² + <span class="num" style="color:${BLUE}">${b}</span>² = <span class="num" style="color:${GRN}">${c2}</span></div>
         <div class="row">${V('c',GRN)} = ${sqrtStr(c2)}</div></div>
       <div class="fx"><span class="tag">Squares on each side</span><div class="row"><span class="num" style="color:${RED}">${a*a}</span> + <span class="num" style="color:${BLUE}">${b*b}</span> = <span class="num" style="color:${GRN}">${c2}</span> little squares</div></div>
       <p class="note">The two small squares always fill the big square exactly. Drag the red and blue corners.</p>`}
    if(mode==='circ'){const r=circ.r;pn.innerHTML=`<div class="fx big hot"><span class="tag">Around the circle</span><div class="row">${V('C',ORG)} = 2${V('π',PUR)}${V('r',RED)} = 2 × 3.1416 × <span class="num" style="color:${RED}">${fmt(r,1)}</span> = <span class="num" style="color:${ORG}">${fmt(2*Math.PI*r,2)}</span></div></div>
       <div class="fx"><span class="tag">Inside the circle</span><div class="row">${V('A',GRN)} = ${V('π',PUR)}${V('r',RED)}² = 3.1416 × <span class="num" style="color:${RED}">${fmt(r,1)}</span>² = <span class="num" style="color:${GRN}">${fmt(Math.PI*r*r,2)}</span></div></div>
       <div class="fx"><span class="tag">The magic number</span><div class="row">${V('π',PUR)} = ${frac(V('C',ORG),'2'+V('r',RED))} = <span class="num" style="color:${PUR}">3.14159…</span></div><div class="row note">Every circle, big or small, goes around about 3.14 times its width.</div></div>
       <p class="note">Drag the red dot to change the radius. Press Unroll!</p>`}
    if(mode==='unit'){const d=((unit.t*180/Math.PI)%360+360)%360,dr=Math.round(d),ex=Math.abs(d-dr)<.01?EX[dr]:null,c=Math.cos(unit.t),s=Math.sin(unit.t);
      pn.innerHTML=`<div class="fx big hot"><span class="tag">Angle</span><div class="row">${V('θ',PUR)} = <span class="num" style="color:${PUR}">${fmt(d,1)}°</span> = <span class="num">${fmt(unit.t%(2*Math.PI)<0?unit.t%(2*Math.PI)+2*Math.PI:unit.t%(2*Math.PI),3)}</span> rad</div></div>
       <div class="fx"><span class="tag">Across (x)</span><div class="row">cos ${V('θ',PUR)} = <span class="num" style="color:${RED}">${fmt(c,3)}</span>${ex?` = <span class="num">${ex[0]}</span>`:''}</div></div>
       <div class="fx"><span class="tag">Up (y)</span><div class="row">sin ${V('θ',PUR)} = <span class="num" style="color:${BLUE}">${fmt(s,3)}</span>${ex?` = <span class="num">${ex[1]}</span>`:''}</div></div>
       <div class="fx"><span class="tag">Always true</span><div class="row">sin²${V('θ',PUR)} + cos²${V('θ',PUR)} = <span class="num">${fmt(s*s+c*c,3)}</span></div><div class="row">tan ${V('θ',PUR)} = ${frac('sin','cos')} = <span class="num">${Math.abs(c)<1e-9?'∞':fmt(s/c,3)}</span></div></div>
       <p class="note">Drag the dot around the circle. The wave draws itself!</p>`}
  }
  function setMode(m){mode=m;extraUI();if(m==='pyth')stage.querySelector('#trip').textContent=`Whole-number triangles found: ${found.size}`;panelHTML()}
  bindChips(ui.top,'m',setMode);
  /* ---------- dragging ---------- */
  const fm=fingers(cv,{down(f){let dragI=null;const wx=P.IX(f.x),wy=P.IY(f.y),near=(px,py,r=.7)=>Math.hypot(wx-px,wy-py)<r;
      if(mode==='poly'){dragI=poly.findIndex(p=>near(p[0],p[1]));if(dragI<0)dragI=null}
      if(mode==='pyth'){const o=tri.o||[-tri.a/2,-tri.b/2];dragI=near(o[0]+tri.a,o[1])?'a':near(o[0],o[1]+tri.b)?'b':null;if(dragI)tri.o=o}
      if(mode==='circ')dragI='r';if(mode==='unit')dragI='t';f.data.i=dragI;if(dragI!==null){tone(500,.05,'triangle');this.move(f)}},
    move(f){const dragI=f.data.i;
      if(dragI==null&&mode==='poly'){const tf=twoFinger(fm);if(tf&&!tf.start&&[...fm.values()].every(o=>o.data.i==null)){/* twist the whole shape around its middle */
        const cx=poly.reduce((s,p)=>s+p[0],0)/poly.length,cy=poly.reduce((s,p)=>s+p[1],0)/poly.length,c=Math.cos(-tf.rot),sn=Math.sin(-tf.rot);
        poly=poly.map(([x,y])=>[cx+(x-cx)*c-(y-cy)*sn,cy+(x-cx)*sn+(y-cy)*c]);if(frame%3===0)panelHTML();return}}
      if(dragI==null)return;const wx=P.IX(f.x),wy=P.IY(f.y);
      if(mode==='poly'){const nx=Math.round(wx*2)/2,ny=Math.round(wy*2)/2;const p=poly[dragI];if(p[0]!==nx||p[1]!==ny){p[0]=nx;p[1]=ny;tone(400+ny*20,.03,'sine',.04);panelHTML()}}
      if(mode==='pyth'){const o=tri.o||[-tri.a/2,-tri.b/2];if(dragI==='a'){const v=clamp(Math.round(wx-o[0]),1,10);if(v!==tri.a){tri.a=v;checkTrip()}}else{const v=clamp(Math.round(wy-o[1]),1,8);if(v!==tri.b){tri.b=v;checkTrip()}}}
      if(mode==='circ'){const r=clamp(Math.round(Math.hypot(wx-2*Math.PI*circ.r*circ.unroll,wy)*2)/2,.5,5);if(r!==circ.r){circ.r=r;circ.roll=false;circ.unroll=0;panelHTML();tone(300+r*60,.04,'sine',.05)}}
      if(mode==='unit'){let t=Math.atan2(wy,wx);const prev=unit.t%(2*Math.PI);let d=t-prev;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;unit.t+=d;
        const deg=((unit.t*180/Math.PI)%360+360)%360;for(const sp of [0,30,45,60,90,120,135,150,180,210,225,240,270,300,315,330,360])if(Math.abs(deg-sp)<2.2){unit.t+=(sp-deg)*Math.PI/180;break}panelHTML()}},
    up(){if(mode==='poly')panelHTML();if(!fm.size)tri.o=null},
    wheel(w){if(mode==='unit'){unit.t-=w.dy*Math.PI/36;panelHTML()}if(mode==='circ'){circ.r=clamp(circ.r-w.dy*.5,.5,5);circ.roll=false;circ.unroll=0;panelHTML()}}});
  function checkTrip(){panelHTML();const{a,b}=tri,c=Math.sqrt(a*a+b*b);tone(300+(a+b)*30,.05,'sine',.05);
    if(Math.abs(c-Math.round(c))<1e-9){const k=[a,b].sort((x,y)=>x-y).join('-');if(!found.has(k)){found.add(k);const r=cv.getBoundingClientRect();win(stage,r.left+P.X(0),r.top+P.Y(0),`${a}² + ${b}² = ${Math.round(c)}²`);
      stage.querySelector('#trip').textContent=`Whole-number triangles found: ${found.size}`}}}
  /* ---------- drawing ---------- */
  function poly2(pts,fill,stroke,w=4){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(P.X(p[0]),P.Y(p[1])):ctx.moveTo(P.X(p[0]),P.Y(p[1])));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.lineJoin='round';ctx.stroke()}}
  function handle(x,y,col,r=11){ctx.fillStyle=col;ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r+Math.sin(frame*.12)*1.5,0,7);ctx.fill();ctx.stroke()}
  function label(t,x,y,col='#1D1842',sz=15){ctx.font=`900 ${sz}px Nunito,system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';const w=ctx.measureText(t).width+10;ctx.fillStyle='rgba(255,255,255,.88)';ctx.fillRect(x-w/2,y-sz*.7,w,sz*1.4);ctx.fillStyle=col;ctx.fillText(t,x,y)}
  function draw(){
    const W=dims.w,H=dims.h;ctx.setTransform(dims.d,0,0,dims.d,0,0);ctx.fillStyle='#FDFDFF';ctx.fillRect(0,0,W,H);
    if(mode==='poly'){P=plane(ctx,W,H,[-7,7],[-6,6],{pad:10});const ok=simple(poly);
      // count squares: shade unit cells whose centre is inside
      poly2(poly,ok?'rgba(36,199,134,.22)':'rgba(232,56,79,.18)',null);
      ctx.save();poly2(poly,null,null);ctx.clip();ctx.strokeStyle='rgba(31,164,99,.35)';ctx.lineWidth=1.5;for(let x=-8;x<=8;x++){ctx.beginPath();ctx.moveTo(P.X(x),0);ctx.lineTo(P.X(x),H);ctx.stroke()}for(let y=-7;y<=7;y++){ctx.beginPath();ctx.moveTo(0,P.Y(y));ctx.lineTo(W,P.Y(y));ctx.stroke()}ctx.restore();
      poly2(poly,null,ok?GRN:RED,5);const an=angles(poly);
      poly.forEach((p,i)=>{const n=poly.length,a=poly[(i+n-1)%n],b=poly[(i+1)%n],x=P.X(p[0]),y=P.Y(p[1]);
        const m=dist(p,b);label(fmt(m,2),(x+P.X(b[0]))/2,(y+P.Y(b[1]))/2,ORG,13);
        const ua=[a[0]-p[0],a[1]-p[1]],ub=[b[0]-p[0],b[1]-p[1]],la=Math.hypot(...ua)||1,lb=Math.hypot(...ub)||1,bis=[ua[0]/la+ub[0]/lb,ua[1]/la+ub[1]/lb],bl=Math.hypot(...bis)||1;
        const inside=an[i]<180?1:-1;
        if(Math.abs(an[i]-90)<.5){ctx.strokeStyle=PUR;ctx.lineWidth=2.5;const s=14;ctx.beginPath();ctx.moveTo(x+ua[0]/la*s,y-ua[1]/la*s);ctx.lineTo(x+ua[0]/la*s+ub[0]/lb*s,y-ua[1]/la*s-ub[1]/lb*s);ctx.lineTo(x+ub[0]/lb*s,y-ub[1]/lb*s);ctx.stroke()}
        label(Math.round(an[i])+'°',x+bis[0]/bl*34*inside,y-bis[1]/bl*34*inside,PUR,14);handle(x,y,'#FFC83D')})}
    if(mode==='pyth'){const{a,b}=tri;if(!fm.size||view.pyth==null)view.pyth=Math.max(a+b,8);const R=view.pyth;P=plane(ctx,W,H,[-R*.95,R*.95],[-R*.75,R*.75],{pad:8});const o=tri.o||[-a/2,-b/2],A=[o[0]+a,o[1]],Bp=[o[0],o[1]+b];
      const sq=(p,q,col,lab)=>{const dx=q[0]-p[0],dy=q[1]-p[1];const pts=[p,q,[q[0]+dy,q[1]-dx],[p[0]+dy,p[1]-dx]];poly2(pts,col+'33',col,3);
        const L=Math.round(Math.hypot(dx,dy)*1000)/1000;ctx.save();poly2(pts,null,null);ctx.clip();ctx.strokeStyle=col+'55';ctx.lineWidth=1;
        for(let k=1;k<Math.ceil(L);k++){const t=k/L;ctx.beginPath();ctx.moveTo(P.X(p[0]+dx*t),P.Y(p[1]+dy*t));ctx.lineTo(P.X(p[0]+dx*t+dy),P.Y(p[1]+dy*t-dx));ctx.stroke();ctx.beginPath();ctx.moveTo(P.X(p[0]+dy*t),P.Y(p[1]-dx*t));ctx.lineTo(P.X(q[0]+dy*t),P.Y(q[1]-dx*t));ctx.stroke()}ctx.restore();
        const cx=(p[0]+q[0]+dy)/2,cy=(p[1]+q[1]-dx)/2;label(lab,P.X(cx),P.Y(cy),col,16)};
      sq(Bp,o,BLUE,`b² = ${b*b}`);sq(o,A,RED,`a² = ${a*a}`);sq(A,Bp,GRN,`c² = ${a*a+b*b}`);
      poly2([o,A,Bp],'#FFF3C4','#1D1842',4);ctx.strokeStyle=PUR;ctx.lineWidth=2.5;const s=14;ctx.strokeRect(P.X(o[0]),P.Y(o[1])-s,s,s);
      label(`a = ${a}`,P.X(o[0]+a/2),P.Y(o[1])+18,RED);label(`b = ${b}`,P.X(o[0])-26,P.Y(o[1]+b/2),BLUE);
      handle(P.X(A[0]),P.Y(A[1]),RED);handle(P.X(Bp[0]),P.Y(Bp[1]),BLUE)}
    if(mode==='circ'){const r=circ.r,C=2*Math.PI*r;if(!fm.size||view.circ==null)view.circ=r;const vr=view.circ,VC=2*Math.PI*vr;P=plane(ctx,W,H,[-vr-1.2,VC+vr+1.2],[-vr-1.6,vr+1.6],{pad:10});
      if(circ.roll===true){circ.unroll=Math.min(1,circ.unroll+.005);if(circ.unroll>=1){circ.roll='done';const key='r'+r;if(!unrolled.has(key)){unrolled.add(key);win(stage,null,null,`C ≈ ${fmt(C,2)}`)}else{cheer();floaty(stage,innerWidth/2,innerHeight/2,`C ≈ ${fmt(C,2)}`)}}}
      const u=circ.unroll,L=C*u,cx=L,rot=u*2*Math.PI;
      // the ground and the part already unrolled
      ctx.strokeStyle='#1D1842';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(P.X(-r-1),P.Y(-r));ctx.lineTo(P.X(C+r+1),P.Y(-r));ctx.stroke();
      if(u>0){ctx.strokeStyle=ORG;ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(P.X(0),P.Y(-r));ctx.lineTo(P.X(L),P.Y(-r));ctx.stroke();
        for(let k=1;k<=3;k++){if(2*r*k<=L+1e-9){const xx=P.X(2*r*k);ctx.fillStyle='#1D1842';ctx.fillRect(xx-1.5,P.Y(-r)-12,3,24);label(`${k} × width`,xx,P.Y(-r)+22,PUR,12)}}
        if(u>=1)label(`2πr = ${fmt(C,2)}`,P.X(C/2),P.Y(-r)-22,ORG,16)}
      // the circle rolling: still-wrapped part of the rim stays orange
      ctx.fillStyle='rgba(36,199,134,.2)';ctx.beginPath();ctx.arc(P.X(cx),P.Y(0),r*P.s,0,7);ctx.fill();
      ctx.strokeStyle='rgba(29,24,66,.25)';ctx.lineWidth=2;ctx.stroke();
      if(u<1){const a0=Math.PI/2,ar=(1-u)*2*Math.PI;ctx.strokeStyle=ORG;ctx.lineWidth=6;ctx.beginPath();ctx.arc(P.X(cx),P.Y(0),r*P.s,a0,a0+ar);ctx.stroke()}
      const ex=cx+Math.cos(-rot)*r,ey=Math.sin(-rot)*r;ctx.strokeStyle=RED;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(P.X(cx),P.Y(0));ctx.lineTo(P.X(cx+r),P.Y(0));ctx.stroke();label(`r = ${fmt(r,1)}`,P.X(cx+r/2),P.Y(0)-16,RED);
      ctx.setLineDash([6,6]);ctx.strokeStyle=PUR;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(P.X(cx-r),P.Y(0));ctx.lineTo(P.X(cx),P.Y(0));ctx.stroke();ctx.setLineDash([]);
      handle(P.X(cx+r),P.Y(0),RED)}
    if(mode==='unit'){const R=Math.min(W*.24,H*.38),ox=W*.28,oy=H/2,t=unit.t,c=Math.cos(t),s=Math.sin(t);P={X:x=>ox+x*R,Y:y=>oy-y*R,IX:px=>(px-ox)/R,IY:py=>(oy-py)/R,s:R};
      ctx.strokeStyle='rgba(62,103,240,.25)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ox-R*1.3,oy);ctx.lineTo(W-10,oy);ctx.moveTo(ox,oy-R*1.3);ctx.lineTo(ox,oy+R*1.3);ctx.stroke();
      ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ox,oy,R,0,7);ctx.stroke();
      ctx.fillStyle='rgba(154,91,255,.2)';ctx.beginPath();ctx.moveTo(ox,oy);ctx.arc(ox,oy,R*.25,0,-((t%(2*Math.PI))+2*Math.PI)%(2*Math.PI),true);ctx.closePath();ctx.fill();
      const px=ox+c*R,py=oy-s*R;ctx.lineWidth=5;ctx.strokeStyle=RED;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(px,oy);ctx.stroke();ctx.strokeStyle=BLUE;ctx.beginPath();ctx.moveTo(px,oy);ctx.lineTo(px,py);ctx.stroke();
      ctx.strokeStyle='#1D1842';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(px,py);ctx.stroke();
      // sine wave to the right
      const gx=ox+R*1.45,gw=W-gx-16,per=gw/(2*Math.PI);ctx.strokeStyle='rgba(47,111,224,.35)';ctx.lineWidth=2;ctx.beginPath();for(let k=0;k<=gw;k+=2){const a=k/per;k?ctx.lineTo(gx+k,oy-Math.sin(a)*R):ctx.moveTo(gx,oy)}ctx.stroke();
      ctx.strokeStyle='rgba(232,56,79,.3)';ctx.beginPath();for(let k=0;k<=gw;k+=2){const a=k/per;k?ctx.lineTo(gx+k,oy-Math.cos(a)*R):ctx.moveTo(gx,oy-R)}ctx.stroke();
      const tt=((t%(2*Math.PI))+2*Math.PI)%(2*Math.PI),wx=gx+tt*per;ctx.strokeStyle=BLUE;ctx.lineWidth=5;ctx.beginPath();for(let a=0;a<=tt;a+=.02){const X=gx+a*per,Y=oy-Math.sin(a)*R;a?ctx.lineTo(X,Y):ctx.moveTo(X,Y)}ctx.stroke();
      ctx.setLineDash([5,6]);ctx.strokeStyle='rgba(47,111,224,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(wx,py);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=BLUE;ctx.beginPath();ctx.arc(wx,py,7,0,7);ctx.fill();
      for(const [k,lab] of [[.5,'90°'],[1,'180°'],[1.5,'270°'],[2,'360°']]){ctx.fillStyle='#1D1842';ctx.font='800 12px Nunito,system-ui';ctx.textAlign='center';ctx.fillText(lab,gx+k*Math.PI*per,oy+R+18)}
      label(`cos = ${fmt(c,2)}`,(ox+px)/2,oy+(s>=0?18:-18),RED,13);label(`sin = ${fmt(s,2)}`,px+(c>=0?44:-44),(oy+py)/2,BLUE,13);handle(px,py,PUR,12)}
  }
  function resize(){dims=fitCanvas(cv)}const ro=new ResizeObserver(resize);ro.observe(cv);g.onEnd(()=>ro.disconnect());
  P=plane(ctx,dims.w,dims.h,[-7,7],[-6,6],{pad:10,draw:false});setMode('poly');ui.hint('Drag the yellow corners!',4000);
  kbPointer(g,cv,{enabled:()=>mode==='poly'});
  g.key(e=>{const k=e.key;if(/^[1-4]$/.test(k)){ui.top.querySelectorAll('[data-m]')[+k-1].click();return true}
    if(mode==='unit'&&(k==='ArrowLeft'||k==='ArrowRight'||k==='ArrowUp'||k==='ArrowDown')){unit.t+=(k==='ArrowLeft'||k==='ArrowUp'?1:-1)*(e.shiftKey?1:15)*Math.PI/180;panelHTML();return true}
    if(mode==='circ'&&/^(\+|=|-|_|ArrowUp|ArrowDown)$/.test(k)){circ.r=clamp(circ.r+(k==='-'||k==='_'||k==='ArrowDown'?-.5:.5),.5,5);circ.roll=false;circ.unroll=0;panelHTML();return true}
    if(mode==='circ'&&(k===' '||k==='Enter')){stage.querySelector('#unroll').click();return true}
    if(mode==='pyth'&&/^Arrow/.test(k)){if(k==='ArrowLeft'||k==='ArrowRight')tri.a=clamp(tri.a+(k==='ArrowRight'?1:-1),1,10);else tri.b=clamp(tri.b+(k==='ArrowUp'?1:-1),1,8);checkTrip();return true}
    if(mode==='poly'&&(k==='r'||k==='R')){const id='reg';stage.querySelector('#'+id).click();return true}return false});
  g.loop(()=>{frame++;draw();if(mode==='circ'&&circ.roll===true&&frame%10===0)panelHTML()});
  GAMES.geo._debug={setMode,get poly(){return poly},tri,unit,circ,found,panelHTML,toPx:(x,y)=>[P.X(x),P.Y(y)],get mode(){return mode},nameOf,area};
}}});
