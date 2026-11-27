/* ============================================================
   ATOM BUILDER — science model (no drawing, no DOM)
   Everything Atom Builder claims about atoms, molecules and reactions comes from here, so it can be checked on its
   own (tests/31-atoms-science.spec.mjs runs this exact file in Node). The game file only draws it and handles input.
   Sources for the numbers are listed next to each table; intentional simplifications are listed in
   docs/ATOM_BUILDER_SCIENCE.md.
   ============================================================ */
var ATOM_SCI=(function(){
'use strict';
const R=8.314462618;            /* gas constant, J/(mol·K) */

/* ---------- elements 1-20 ----------
   [symbol, name, standard atomic weight (IUPAC 2021 abridged), CPK colour, family, a free singly-charged negative ion is bound]
   The last column is the sign of the electron affinity (NIST/CRC): He, Be, N, Ne, Mg and Ar cannot hold an extra electron. */
const ELEMENTS=[null,
  ['H','Hydrogen',1.008,'#FFFFFF','hydrogen',true],['He','Helium',4.0026,'#D9FFFF','noble',false],
  ['Li','Lithium',6.94,'#CC80FF','alkali',true],['Be','Beryllium',9.0122,'#C2FF00','alkaline',false],
  ['B','Boron',10.81,'#FFB5B5','metalloid',true],['C','Carbon',12.011,'#7A7A7A','carbon',true],
  ['N','Nitrogen',14.007,'#3050F8','pnictogen',false],['O','Oxygen',15.999,'#FF0D0D','chalcogen',true],
  ['F','Fluorine',18.998,'#90E050','halogen',true],['Ne','Neon',20.180,'#B3E3F5','noble',false],
  ['Na','Sodium',22.990,'#AB5CF2','alkali',true],['Mg','Magnesium',24.305,'#8AFF00','alkaline',false],
  ['Al','Aluminium',26.982,'#BFA6A6','metal',true],['Si','Silicon',28.085,'#F0C8A0','metalloid',true],
  ['P','Phosphorus',30.974,'#FF8000','pnictogen',true],['S','Sulfur',32.06,'#FFFF30','chalcogen',true],
  ['Cl','Chlorine',35.45,'#1FF01F','halogen',true],['Ar','Argon',39.95,'#80D1E3','noble',false],
  ['K','Potassium',39.098,'#8F40D4','alkali',true],['Ca','Calcium',40.078,'#3DFF00','alkaline',true]];
const MAXZ=20;
const zOf=s=>ELEMENTS.findIndex(e=>e&&e[0]===s);

/* ---------- nuclides ----------
   Stable isotopes: neutron count -> natural abundance in atom % (IUPAC representative isotopic composition).
   Radioactive: a selection of well-known radioactive isotopes, [neutrons, half-life text, how it decays, natural?]
   (NUBASE2020 half-lives, rounded). Anything not listed falls apart very quickly or cannot form at all. */
const STABLE={1:{0:99.9885,1:0.0115},2:{1:0.000134,2:99.999866},3:{3:7.59,4:92.41},4:{5:100},5:{5:19.9,6:80.1},
  6:{6:98.93,7:1.07},7:{7:99.636,8:0.364},8:{8:99.757,9:0.038,10:0.205},9:{10:100},10:{10:90.48,11:0.27,12:9.25},
  11:{12:100},12:{12:78.99,13:10.00,14:11.01},13:{14:100},14:{14:92.223,15:4.685,16:3.092},15:{16:100},
  16:{16:94.99,17:0.75,18:4.25,20:0.01},17:{18:75.76,20:24.24},18:{18:0.3336,20:0.0629,22:99.6035},
  19:{20:93.2581,22:6.7302},20:{20:96.941,22:0.647,23:0.135,24:2.086,26:0.004}};
const RADIO={1:[[2,'12.3 years','beta decay (a neutron turns into a proton)']],
  2:[[4,'0.8 seconds','beta decay']],3:[[5,'0.84 seconds','beta decay']],
  4:[[3,'53 days','electron capture'],[4,'about 10⁻¹⁶ seconds','splitting into two helium-4 nuclei'],[6,'1.4 million years','beta decay']],
  5:[[3,'0.77 seconds','positron decay (a proton turns into a neutron)'],[7,'0.02 seconds','beta decay']],
  6:[[4,'19 seconds','positron decay'],[5,'20 minutes','positron decay'],[8,'5,700 years','beta decay (used for carbon dating)'],[9,'2.4 seconds','beta decay']],
  7:[[6,'10 minutes','positron decay'],[9,'7.1 seconds','beta decay']],
  8:[[6,'71 seconds','positron decay'],[7,'2 minutes','positron decay'],[11,'27 seconds','beta decay']],
  9:[[9,'110 minutes','positron decay (used in PET scans)'],[11,'11 seconds','beta decay']],
  10:[[9,'17 seconds','positron decay'],[13,'37 seconds','beta decay']],
  11:[[11,'2.6 years','positron decay'],[13,'15 hours','beta decay']],
  12:[[15,'9.5 minutes','beta decay'],[16,'21 hours','beta decay']],
  13:[[13,'717,000 years','positron decay'],[15,'2.2 minutes','beta decay']],
  14:[[17,'2.6 hours','beta decay'],[18,'about 150 years','beta decay']],
  15:[[17,'14 days','beta decay'],[18,'25 days','beta decay']],
  16:[[19,'87 days','beta decay']],
  17:[[19,'301,000 years','beta decay'],[21,'37 minutes','beta decay']],
  18:[[19,'35 days','electron capture'],[21,'269 years','beta decay'],[23,'1.8 hours','beta decay']],
  19:[[21,'1.25 billion years','beta decay (mostly)',0.0117],[23,'12 hours','beta decay']],
  20:[[21,'99,000 years','electron capture'],[25,'163 days','beta decay'],[27,'4.5 days','beta decay'],[28,'about 6 × 10¹⁹ years','double beta decay',0.187]]};
function nuclide(z,n){
  const name=ELEMENTS[z][1].toLowerCase()+'-'+(z+n);
  const st=STABLE[z]||{};
  if(n in st)return{z,n,A:z+n,name,stable:true,abundance:st[n]};
  const r=(RADIO[z]||[]).find(x=>x[0]===n);
  if(r)return{z,n,A:z+n,name,stable:false,known:true,halfLife:r[1],decay:r[2],abundance:r[3]||0};
  return{z,n,A:z+n,name,stable:false,known:false};
}
const stableNeutrons=z=>Object.keys(STABLE[z]||{}).map(Number);
const isStable=(z,n)=>n in (STABLE[z]||{});

/* ---------- electrons ----------
   Ground-state filling order (Aufbau / Madelung rule). It is exact for every neutral atom 1-20, and for the
   simple ions of these elements (they reach the same electron counts as a neighbouring element). */
const SUBSHELLS=[[1,'s',2],[2,'s',2],[2,'p',6],[3,'s',2],[3,'p',6],[4,'s',2],[3,'d',10]];
const SUP=s=>String(s).replace(/[0-9]/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
function configuration(ne){const out=[];let r=ne;for(const[n,l,c]of SUBSHELLS){if(r<=0)break;const k=Math.min(c,r);out.push({n,l,k});r-=k}return out}
const configText=ne=>configuration(ne).map(o=>o.n+o.l+SUP(o.k)).join(' ')||'(no electrons)';
/* electrons per shell (principal quantum number) */
function shells(ne){const by=[];for(const o of configuration(ne))by[o.n-1]=(by[o.n-1]||0)+o.k;return by.map(x=>x||0)}
const NOBLE=[0,2,10,18];
const valenceElectrons=ne=>{const sh=shells(ne);return sh.length?sh[sh.length-1]:0};

/* Common ions in everyday chemistry (CRC / any general chemistry text). Hydrogen also forms hydride, H⁻, in salts like NaH. */
const COMMON_IONS={1:[1,-1],3:[1],4:[2],7:[-3],8:[-2],9:[-1],11:[1],12:[2],13:[3],15:[-3],16:[-2],17:[-1],19:[1],20:[2]};
const ONLY_IN_SOLIDS={7:-3,8:-2,15:-3,16:-2};   /* these anions exist only inside crystals or solutions, never alone */
function ionInfo(z,e){
  const q=z-e,E=ELEMENTS[z];
  if(q===0)return{q,kind:'neutral',text:'Neutral atom: protons and electrons balance.'};
  if(e===0)return{q,kind:z===1?'common':'extreme',text:z===1?'A hydrogen ion, H⁺, is just a bare proton. Acids are full of them (stuck to water molecules).':`Every electron is gone: a bare ${E[1].toLowerCase()} nucleus. That only happens somewhere as hot as the inside of a star.`};
  const common=(COMMON_IONS[z]||[]).includes(q),s=E[0]+(Math.abs(q)>1?SUP(Math.abs(q)):'')+(q>0?'⁺':'⁻');
  if(q>0)return{q,kind:common?'common':'extreme',ion:s,text:common?`${s} is a common ion. ${noble(e)?'It has the same electron arrangement as a noble gas, which is why it is so common.':''}`
    :`${s} can be made, but pulling off that many electrons takes a lot of energy (flames, lightning, stars). It grabs electrons back as soon as it can.`};
  if(q===-1&&E[5])return{q,kind:common?'common':'possible',ion:s,text:common?`${s} is a common ion. ${noble(e)?'It has the same electron arrangement as a noble gas.':''}`:`${s} can exist on its own, but only just: ${E[1].toLowerCase()} holds the extra electron weakly.`};
  if(q<0&&ONLY_IN_SOLIDS[z]===q)return{q,kind:'solid',ion:s,text:`${s} exists only held in place inside a compound (like oxide in rust or sulfide in rocks). A lone ${s} would throw an electron away.`};
  return{q,kind:'impossible',ion:s,text:`${E[1]} can't hold ${-q===1?'an extra electron':'that many extra electrons'}. ${-q===1?'It':'The extras'} would fly straight off.`};
}
const noble=ne=>NOBLE.includes(ne)&&ne>0;
/* chemical behaviour of the neutral element: depends only on its electrons, never on its neutrons */
const REACTIVITY={hydrogen:'Has 1 electron and shares it to make one bond (H₂, H₂O, CH₄). Reactive.',
  noble:'Its outer shell is already full, so it almost never reacts with anything.',
  alkali:'Has 1 outer electron that it gives away very easily. A very reactive metal: it reacts with water.',
  alkaline:'Has 2 outer electrons that it gives away. A reactive metal, calmer than the ones in column 1.',
  metalloid:'Sits between metals and non-metals and usually shares electrons.',
  carbon:'Has 4 outer electrons and shares them to make 4 bonds. That is why carbon builds so many different molecules.',
  pnictogen:'Has 5 outer electrons and usually makes 3 bonds.',
  chalcogen:'Has 6 outer electrons and usually makes 2 bonds, or takes 2 electrons.',
  halogen:'Has 7 outer electrons and grabs 1 more very eagerly. Very reactive non-metal.',
  metal:'A metal with 3 outer electrons that it gives away.'};
function chemistry(z,e){const E=ELEMENTS[z];let t=REACTIVITY[E[4]];
  if(z===7)t+=' Nitrogen gas (N₂) is very unreactive because of its strong triple bond.';
  if(z===8)t+=' Very reactive: it is what makes things burn and rust.';
  return{family:E[4],text:t,valence:valenceElectrons(z),nobleLike:noble(e)};}

/* ---------- molecules ---------- */
const VALENCE={H:1,C:4,N:3,O:2,Cl:1};           /* bonds each neutral atom makes (no formal charges in this model) */
const VALENCE_E={H:1,C:4,N:5,O:6,Cl:7};          /* outer-shell electrons */
const BUILD=['H','C','N','O','Cl'];
/* known structures: [key, name, atoms, bonds [i,j,order], target?]. Targets are the 12 molecules of the discovery list,
   in their original order. The others are recognised so that a correct structure is named, but they are not targets. */
const LIB=[
  ['H₂O','Water',['O','H','H'],[[0,1,1],[0,2,1]],1],
  ['CO₂','Carbon dioxide',['C','O','O'],[[0,1,2],[0,2,2]],1],
  ['CH₄','Methane',['C','H','H','H','H'],[[0,1,1],[0,2,1],[0,3,1],[0,4,1]],1],
  ['NH₃','Ammonia',['N','H','H','H'],[[0,1,1],[0,2,1],[0,3,1]],1],
  ['O₂','Oxygen gas',['O','O'],[[0,1,2]],1],
  ['H₂','Hydrogen gas',['H','H'],[[0,1,1]],1],
  ['N₂','Nitrogen gas',['N','N'],[[0,1,3]],1],
  ['HCl','Hydrochloric acid',['H','Cl'],[[0,1,1]],1],
  ['H₂O₂','Hydrogen peroxide',['H','O','O','H'],[[0,1,1],[1,2,1],[2,3,1]],1],
  ['C₂H₆','Ethane',['C','C','H','H','H','H','H','H'],[[0,1,1],[0,2,1],[0,3,1],[0,4,1],[1,5,1],[1,6,1],[1,7,1]],1],
  ['CH₃OH','Methanol',['C','O','H','H','H','H'],[[0,1,1],[1,2,1],[0,3,1],[0,4,1],[0,5,1]],1],
  ['C₂H₄','Ethylene',['C','C','H','H','H','H'],[[0,1,2],[0,2,1],[0,3,1],[1,4,1],[1,5,1]],1],
  ['Cl₂','Chlorine gas',['Cl','Cl'],[[0,1,1]],0],
  ['HCN','Hydrogen cyanide',['H','C','N'],[[0,1,1],[1,2,3]],0],
  ['H₂CO','Formaldehyde',['C','O','H','H'],[[0,1,2],[0,2,1],[0,3,1]],0],
  ['C₂H₂','Acetylene',['H','C','C','H'],[[0,1,1],[1,2,3],[2,3,1]],0],
  ['C₂H₅OH','Ethanol',['C','C','O','H','H','H','H','H','H'],[[0,1,1],[1,2,1],[2,3,1],[0,4,1],[0,5,1],[0,6,1],[1,7,1],[1,8,1]],0],
  ['CH₃OCH₃','Dimethyl ether',['C','O','C','H','H','H','H','H','H'],[[0,1,1],[1,2,1],[0,3,1],[0,4,1],[0,5,1],[2,6,1],[2,7,1],[2,8,1]],0],
  ['CH₃Cl','Chloromethane',['C','Cl','H','H','H'],[[0,1,1],[0,2,1],[0,3,1],[0,4,1]],0],
  ['N₂H₄','Hydrazine',['N','N','H','H','H','H'],[[0,1,1],[0,2,1],[0,3,1],[1,4,1],[1,5,1]],0],
  ['CH₃NH₂','Methylamine',['C','N','H','H','H','H','H'],[[0,1,1],[0,2,1],[0,3,1],[0,4,1],[1,5,1],[1,6,1]],0],
  ['HOCl','Hypochlorous acid',['H','O','Cl'],[[0,1,1],[1,2,1]],0],
  ['HCOOH','Formic acid',['C','O','O','H','H'],[[0,1,2],[0,2,1],[2,3,1],[0,4,1]],0],
  ['C₃H₈','Propane',['C','C','C','H','H','H','H','H','H','H','H'],[[0,1,1],[1,2,1],[0,3,1],[0,4,1],[0,5,1],[1,6,1],[1,7,1],[2,8,1],[2,9,1],[2,10,1]],0],
].map(([key,name,atoms,bonds,target])=>({key,name,atoms,bonds,target:!!target}));
const TARGETS=LIB.filter(m=>m.target);

const SUB=s=>String(s).replace(/[0-9]/g,d=>'₀₁₂₃₄₅₆₇₈₉'[d]);
/* Hill order: C first, then H, then the rest alphabetically; with no carbon, everything alphabetically */
function formula(counts,html){const ks=Object.keys(counts).filter(k=>counts[k]>0);const hasC=!!counts.C;
  ks.sort((a,b)=>hasC?(a==='C'?-1:b==='C'?1:a==='H'?-1:b==='H'?1:a.localeCompare(b)):a.localeCompare(b));
  return ks.map(k=>k+(counts[k]>1?(html?`<sub>${counts[k]}</sub>`:SUB(counts[k])):'')).join('')}
const countOf=atoms=>{const c={};for(const s of atoms)c[s]=(c[s]||0)+1;return c};

/* Is structure (atoms, bonds as [i,j,order]) the same molecule as lib entry m? Same elements joined in the same way
   with the same bond orders (graph isomorphism; the molecules are tiny so a plain backtracking search is enough). */
function sameStructure(atoms,bonds,m){
  if(atoms.length!==m.atoms.length||bonds.length!==m.bonds.length)return false;
  const adj=(n,bs)=>{const a=Array.from({length:n},()=>new Map());for(const[i,j,o]of bs){a[i].set(j,o);a[j].set(i,o)}return a};
  const A=adj(atoms.length,bonds),B=adj(m.atoms.length,m.bonds);
  const sig=(sy,ad,i)=>sy[i]+'|'+[...ad[i].values()].sort().join(',');
  const sa=atoms.map((_,i)=>sig(atoms,A,i)),sb=m.atoms.map((_,i)=>sig(m.atoms,B,i));
  if(sa.slice().sort().join(';')!==sb.slice().sort().join(';'))return false;
  const map=new Array(atoms.length).fill(-1),used=new Array(atoms.length).fill(false);
  const go=i=>{if(i===atoms.length)return true;
    for(let j=0;j<atoms.length;j++){if(used[j]||sa[i]!==sb[j])continue;let ok=true;
      for(const[k,o]of A[i])if(map[k]>=0&&B[j].get(map[k])!==o){ok=false;break}
      if(!ok)continue;map[i]=j;used[j]=true;if(go(i+1))return true;map[i]=-1;used[j]=false}
    return false};
  return go(0);
}
/* VSEPR: the electron groups around an atom (bonded neighbours + lone pairs) spread out as far as possible */
function vsepr(sym,neighbours,bondSum){const lp=Math.max(0,Math.round((VALENCE_E[sym]-bondSum)/2)),sn=neighbours+lp;
  let shape='',angle=null;
  if(neighbours>=2){
    if(sn===2){shape='linear';angle=180}
    else if(sn===3){shape=lp?'bent':'flat triangle';angle=lp?117:120}
    else if(sn===4){shape=lp===0?'tetrahedral':lp===1?'pyramid':'bent';angle=lp===0?109.5:lp===1?107:104.5}}
  return{lonePairs:lp,steric:sn,shape,angle};
}
/* typical bond lengths in picometres (CRC Handbook / standard tables) */
const BOND_PM={'H-H1':74,'C-H1':109,'H-N1':101,'H-O1':96,'Cl-H1':127,'C-C1':154,'C-C2':134,'C-C3':120,'C-N1':147,'C-N2':128,'C-N3':116,
  'C-O1':143,'C-O2':120,'C-Cl1':177,'N-N1':145,'N-N2':125,'N-N3':110,'O-O1':148,'O-O2':121,'Cl-Cl1':199,'Cl-N1':175,'Cl-O1':170,'N-O1':140,'N-O2':121};
const COV={H:[32,0,0],C:[75,67,60],N:[71,60,54],O:[63,57,53],Cl:[99,95,93]};   /* Pyykkö covalent radii, fallback only */
function bondPm(a,b,o){const k=[a,b].sort().join('-')+o;return BOND_PM[k]||((COV[a][o-1]||COV[a][0])+(COV[b][o-1]||COV[b][0]))}

/* Look at a structure the child has built. atoms: ['C','H',...]; bonds: [[i,j,order]] */
function analyze(atoms,bonds){
  const n=atoms.length,sum=new Array(n).fill(0),deg=new Array(n).fill(0),nb=Array.from({length:n},()=>[]);
  for(const[i,j,o]of bonds){sum[i]+=o;sum[j]+=o;deg[i]++;deg[j]++;nb[i].push(j);nb[j].push(i)}
  const seen=new Set(n?[0]:[]),st=n?[0]:[];while(st.length){const x=st.pop();for(const y of nb[x])if(!seen.has(y)){seen.add(y);st.push(y)}}
  const connected=n>0&&seen.size===n,counts=countOf(atoms),open=atoms.reduce((s,a,i)=>s+Math.max(0,VALENCE[a]-sum[i]),0);
  const over=atoms.map((a,i)=>sum[i]>VALENCE[a]?i:-1).filter(i=>i>=0);
  const complete=n>0&&connected&&open===0&&!over.length;
  const match=complete?LIB.find(m=>sameStructure(atoms,bonds,m))||null:null;
  const f=formula(counts),isomers=complete&&!match?[]:LIB.filter(m=>m!==match&&formula(countOf(m.atoms))===f);
  const nominal=atoms.reduce((s,a)=>s+Math.round(ELEMENTS[zOf(a)][2]),0),molar=atoms.reduce((s,a)=>s+ELEMENTS[zOf(a)][2],0);
  const geo=atoms.map((a,i)=>Object.assign({atom:i,sym:a,neighbours:deg[i]},vsepr(a,deg[i],sum[i])));
  return{n,counts,formula:f,formulaHtml:formula(counts,true),connected,open,over,complete,match,known:!!match,isomers,nominal,molar,geo,bondSums:sum,
    pieces:n?countPieces(n,nb):0};
}
function countPieces(n,nb){const seen=new Array(n).fill(false);let k=0;for(let i=0;i<n;i++){if(seen[i])continue;k++;const st=[i];seen[i]=true;while(st.length){const x=st.pop();for(const y of nb[x])if(!seen[y]){seen[y]=true;st.push(y)}}}return k}

/* Distance constraints that give a structure its real 3-D shape: bond lengths, VSEPR angles (as 1-3 distances) and,
   across double bonds, the cis/trans distances that keep both ends flat in one plane. Lengths in pm. */
function shapeConstraints(atoms,bonds){
  const n=atoms.length,sum=new Array(n).fill(0),nb=Array.from({length:n},()=>[]),len=new Map();const out=[];
  for(const[i,j,o]of bonds){sum[i]+=o;sum[j]+=o;nb[i].push(j);nb[j].push(i);const L=bondPm(atoms[i],atoms[j],o);len.set(i+','+j,L);len.set(j+','+i,L);out.push({i,j,d:L,k:1})}
  for(let c=0;c<n;c++){const v=vsepr(atoms[c],nb[c].length,sum[c]);if(!v.angle||nb[c].length>4)continue;const th=v.angle*Math.PI/180;
    for(let p=0;p<nb[c].length;p++)for(let q=p+1;q<nb[c].length;q++){const a=nb[c][p],b=nb[c][q],la=len.get(c+','+a),lb=len.get(c+','+b);
      out.push({i:a,j:b,d:Math.sqrt(la*la+lb*lb-2*la*lb*Math.cos(th)),k:.6})}}
  const planar=[];
  for(const[i,j,o]of bonds){if(o!==2)continue;const sa=nb[i].filter(x=>x!==j),sb=nb[j].filter(x=>x!==i);if(!sa.length||!sb.length)continue;
    const L=len.get(i+','+j),pa=sa.map((a,k)=>{const l=len.get(i+','+a);return[-l*.5,(k?-1:1)*l*Math.sqrt(3)/2]}),
      pb=sb.map(b=>{const l=len.get(j+','+b);return[L+l*.5,l*Math.sqrt(3)/2]});
    /* same side (cis) and opposite sides (trans) of the double bond, for every substituent pair */
    planar.push({i,j,sa,sb,cis:sa.map((a,k)=>sb.map((b,m)=>Math.hypot(pa[k][0]-pb[m][0],Math.abs(pa[k][1])-pb[m][1]))),
      trans:sa.map((a,k)=>sb.map((b,m)=>Math.hypot(pa[k][0]-pb[m][0],Math.abs(pa[k][1])+pb[m][1])))})}
  return{dist:out,planar};
}
/* One round of shape relaxation (position-based): pts = [{x,y,z,fixed}], scale = screen units per pm. */
function relax(pts,cons,scale,iters=4){
  const fix=p=>p.fixed;
  /* an atom held by a finger pulls its neighbours along but never shoves them away, so the atom you are aiming at stays put */
  const pull=(a,b,d,k)=>{const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=Math.hypot(dx,dy,dz)||1e-6,wa=fix(a)?0:1,wb=fix(b)?0:1;if(!wa&&!wb)return;if((!wa||!wb)&&l<d)return;
    const s=(l-d)/l*k/(wa+wb);a.x+=dx*s*wa;a.y+=dy*s*wa;a.z+=dz*s*wa;b.x-=dx*s*wb;b.y-=dy*s*wb;b.z-=dz*s*wb};
  for(let it=0;it<iters;it++){
    for(const c of cons.dist)pull(pts[c.i],pts[c.j],c.d*scale,c.k*.8);
    for(const P of cons.planar){/* decide which neighbours are on the same side right now, then hold those distances */
      const a0=pts[P.sa[0]],side=b=>{const B=pts[b];return Math.hypot(B.x-a0.x,B.y-a0.y,B.z-a0.z)};
      const order=P.sb.map((b,m)=>m);if(P.sb.length===2&&side(P.sb[1])<side(P.sb[0]))order.reverse();
      P.sa.forEach((a,k)=>P.sb.forEach((b,m)=>{const cis=(order[m]===0)===(k===0);pull(pts[a],pts[b],(cis?P.cis[k][m]:P.trans[k][m])*scale,.3)}))}}
}

/* ---------- species that can go into the reaction chamber ----------
   ΔfH° at 298 K in kJ/mol, gas phase unless marked (NIST Chemistry WebBook / CODATA). Ammonium chloride is a solid made
   of NH₄⁺ and Cl⁻ ions; every other species is a neutral molecule. */
const SPECIES={
  H2:{lib:'H₂',dHf:0,r:14},O2:{lib:'O₂',dHf:0,r:18},N2:{lib:'N₂',dHf:0,r:18},Cl2:{lib:'Cl₂',dHf:0,r:21},
  H2O:{lib:'H₂O',dHf:-241.826,r:17},CO2:{lib:'CO₂',dHf:-393.51,r:21},CH4:{lib:'CH₄',dHf:-74.87,r:19},NH3:{lib:'NH₃',dHf:-45.94,r:18},
  HCl:{lib:'HCl',dHf:-92.31,r:18},H2O2:{lib:'H₂O₂',dHf:-136.11,r:20},C2H6:{lib:'C₂H₆',dHf:-83.85,r:23},CH3OH:{lib:'CH₃OH',dHf:-201.0,r:22},
  C2H4:{lib:'C₂H₄',dHf:52.47,r:22},
  NH4Cl:{f:'NH₄Cl',name:'Ammonium chloride (solid)',dHf:-314.43,r:13,solid:true,comp:{N:1,H:4,Cl:1},ions:[['NH₄⁺',1],['Cl⁻',-1]]}};
for(const[k,s]of Object.entries(SPECIES)){s.key=k;
  if(s.lib){const m=LIB.find(x=>x.key===s.lib);s.f=m.key;s.name=m.name;s.comp=countOf(m.atoms);s.lm=m}
  s.charge=(s.ions||[]).reduce((t,i)=>t+i[1],0);
  s.M=Object.entries(s.comp).reduce((t,[e,c])=>t+c*ELEMENTS[zOf(e)][2],0)/1000;   /* kg/mol */
}
const speciesOfLib=key=>Object.values(SPECIES).find(s=>s.lib===key)||null;

/* ---------- reactions ----------
   Overall equations with whole-number coefficients. ΔH is not typed in: it is worked out from the ΔfH table above
   (Hess's law), so every energy number follows from the same data. meet = the two molecules whose collision starts the
   reaction in this model. Ea = model energy barrier in kJ/mol, see docs/ATOM_BUILDER_SCIENCE.md for why these are model
   values and not the (much larger, multi-step) real ones. Tmin = for fuels, the real autoignition temperature in K
   (hydrogen 585 °C, methane 580 °C, methanol 464 °C, ethylene 490 °C): below it the gas does not burn at all. */
const REACTIONS=[
  {id:'h2burn',name:'Hydrogen burns',re:{H2:2,O2:1},pr:{H2O:2},meet:['H2','O2'],Ea:28,Tmin:858,how:'heat',
    real:'Hydrogen and oxygen can sit together forever until a spark or flame starts them. Then they burn very fast.'},
  {id:'ch4burn',name:'Methane burns',re:{CH4:1,O2:2},pr:{CO2:1,H2O:2},meet:['CH4','O2'],Ea:30,Tmin:853,how:'heat',
    real:'This is a gas stove flame. It needs a spark to start, then its own heat keeps it going.'},
  {id:'meohburn',name:'Methanol burns',re:{CH3OH:2,O2:3},pr:{CO2:2,H2O:4},meet:['CH3OH','O2'],Ea:28,Tmin:737,how:'heat',
    real:'Methanol burns with an almost invisible flame.'},
  {id:'c2h4burn',name:'Ethylene burns',re:{C2H4:1,O2:3},pr:{CO2:2,H2O:2},meet:['C2H4','O2'],Ea:28,Tmin:763,how:'heat',
    real:'Ethylene burns like other fuels once it is lit.'},
  {id:'peroxide',name:'Hydrogen peroxide breaks down',re:{H2O2:2},pr:{H2O:2,O2:1},meet:['H2O2','H2O2'],Ea:40,EaCat:8,how:'catalyst',
    real:'Peroxide slowly breaks down by itself. A catalyst (like manganese dioxide, or the catalase in a potato) makes it fizz out oxygen fast.'},
  {id:'haber',name:'Making ammonia (Haber process)',re:{N2:1,H2:3},pr:{NH3:2},meet:['N2','H2'],Ea:150,EaCat:18,how:'catalyst',
    real:'Factories make ammonia for fertiliser this way, with an iron catalyst, at high temperature and pressure.'},
  {id:'hydrog',name:'Adding hydrogen to ethylene',re:{C2H4:1,H2:1},pr:{C2H6:1},meet:['C2H4','H2'],Ea:120,EaCat:25,how:'catalyst',
    real:'This only goes with a metal catalyst like nickel or platinum.'},
  {id:'smoke',name:'Ammonia meets hydrogen chloride',re:{NH3:1,HCl:1},pr:{NH4Cl:1},meet:['NH3','HCl'],Ea:2,how:'none',
    real:'The two gases react the moment they meet, making a white smoke of tiny salt crystals.'},
  {id:'hcl',name:'Hydrogen and chlorine',re:{H2:1,Cl2:1},pr:{HCl:2},meet:['H2','Cl2'],Ea:60,EaLight:6,how:'light',
    real:'In the dark nothing happens. Light breaks chlorine molecules apart and the mixture reacts (it can even explode).'},
];
const dH=rx=>Object.entries(rx.pr).reduce((t,[k,c])=>t+c*SPECIES[k].dHf,0)-Object.entries(rx.re).reduce((t,[k,c])=>t+c*SPECIES[k].dHf,0);
for(const rx of REACTIONS)rx.dH=dH(rx);
function atomTally(side){const t={};for(const[k,c]of Object.entries(side))for(const[e,n]of Object.entries(SPECIES[k].comp))t[e]=(t[e]||0)+c*n;return t}
const chargeTally=side=>Object.entries(side).reduce((t,[k,c])=>t+c*SPECIES[k].charge,0);
const equation=(rx,html)=>{const side=s=>Object.entries(s).map(([k,c])=>(c>1?c+' ':'')+SPECIES[k].f).join(' + ');return side(rx.re)+' → '+side(rx.pr)};

/* ---------- random numbers: seeded, so an experiment replays the same way every time ---------- */
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---------- the reaction chamber ----------
   A well-stirred 2-D box of molecules. Each drawn molecule stands for 1 millimole, so a reaction event moves
   (ΔH in kJ/mol) joules. "Well-stirred" means the gas has one temperature everywhere, like a real lab reactor with a fan.
   Energy lives in three places, and the chamber keeps an exact account of all of them:
     - chemical energy: the sum of ΔfH over every molecule;
     - kinetic energy of the drawn molecules (½·M·v² per mole, scaled to 1 mmol);
     - heat in the unseen gas (nitrogen) that fills the chamber, which trades heat with the walls.
   Each molecule keeps bumping into the unseen gas: now and then its velocity is redrawn from the Maxwell-Boltzmann
   distribution at the gas temperature, and the energy it gains or loses comes out of, or goes into, the gas.
   Molecules bounce off each other as hard disks (perfectly elastic). A collision starts a reaction only if the energy
   along the line of impact clears the barrier; in 2-D the share of collisions that do is exactly exp(-E/RT).
   A burning mixture takes off when it makes heat faster than the walls take it away (Semenov's thermal explosion).
   Everything advances in fixed steps of H seconds, whatever the screen's frame rate. */
const BOX={w:800,h:500};
const H=1/360,KAPPA=0.7;             /* time step (s); drawing scale for speed: px/s per m/s */
const C_GAS=3;                       /* J/K: the chamber's unseen gas (about 0.14 mol of N₂) */
const WALL=0.3,THERMO=8;              /* wall heat transfer (W/K), molecule–gas bumps per molecule per second */
const HOT=0.5;                       /* share of a reaction's heat that goes first into its products' motion */
const SPARK_J=3000;                  /* a spark (a small flame) adds 3 kJ of heat */
const GATHER=260;                    /* how far (px) a reaction looks for the other molecules it needs */
const MAXN=90;
function chamber(opt={}){
  const rand=rng(opt.seed??1);
  const st={t:0,Tset:opt.T??298,T:opt.T??298,catalyst:!!opt.catalyst,light:!!opt.light,parts:[],
    ledger:{wallOut:0,sparkIn:0},stats:{collisions:0,rx:{}},events:[],nextId:1,acc:0,startCounts:{},startAtoms:{},startCharge:0,startEnergy:0,history:[]};
  for(const rx of REACTIONS)st.stats.rx[rx.id]={meet:0,hard:0,cold:0,fired:0,missing:0,maxE:0};
  const gauss=()=>{let u=0,v=0;while(!u)u=rand();while(!v)v=rand();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
  const KE=p=>.5*SPECIES[p.s].M*((p.vx/KAPPA)**2+(p.vy/KAPPA)**2)/1000;      /* J for 1 mmol */
  const draw=(p,T)=>{const s=Math.sqrt(R*T/SPECIES[p.s].M)*KAPPA;p.vx=gauss()*s;p.vy=gauss()*s};
  /* the molecule bumps the unseen gas: new Maxwell-Boltzmann velocity, energy traded with the gas */
  function thermal(p){const e0=KE(p),vx=p.vx,vy=p.vy;draw(p,st.T);const dq=(KE(p)-e0)/C_GAS;if(st.T-dq<20){p.vx=vx;p.vy=vy;return}st.T-=dq}
  function make(s,x,y){const p={id:st.nextId++,s,x,y,vx:0,vy:0,r:SPECIES[s].r,stuck:false,ang:rand()*6.283,spin:(rand()-.5)*2,born:st.t};draw(p,st.T);return p}
  function place(s,region){const r=SPECIES[s].r,[x0,y0,x1,y1]=region||[0,0,BOX.w,BOX.h];
    for(let tries=0;tries<400;tries++){const x=x0+r+rand()*(x1-x0-2*r),y=y0+r+rand()*(y1-y0-2*r);
      if(st.parts.every(q=>Math.hypot(q.x-x,q.y-y)>q.r+r+2))return make(s,x,y)}
    return null}
  const api={state:st,box:BOX,
    /* add molecules from outside (they arrive at the chamber's temperature) */
    add(s,n=1,region){let k=0;for(let i=0;i<n&&st.parts.length<MAXN;i++){const p=place(s,region);if(p){st.parts.push(p);k++}}api.mark();return k},
    /* remember what is in the chamber now: the ledger and the "atoms in = atoms out" check count from here */
    mark(){st.startCounts=api.counts();st.startAtoms=api.atoms();st.startCharge=api.charge();st.ledger.wallOut=0;st.ledger.sparkIn=0;st.startEnergy=api.energyTotal()},
    counts(){const c={};for(const p of st.parts)c[p.s]=(c[p.s]||0)+1;return c},
    atoms(){const t={};for(const p of st.parts)for(const[e,n]of Object.entries(SPECIES[p.s].comp))t[e]=(t[e]||0)+n;return t},
    charge(){return st.parts.reduce((t,p)=>t+SPECIES[p.s].charge,0)},
    chemEnergy(){return st.parts.reduce((t,p)=>t+SPECIES[p.s].dHf,0)},   /* J (1 mmol × kJ/mol) */
    kinetic(){return st.parts.reduce((t,p)=>t+KE(p),0)},
    heat(){return C_GAS*st.T},                                             /* J held by the unseen gas */
    /* chemical + motion + heat + heat that left through the walls - energy added by sparks: never changes */
    energyTotal(){return api.chemEnergy()+api.kinetic()+api.heat()+st.ledger.wallOut-st.ledger.sparkIn},
    temperature(){return st.T},
    /* temperature read from the molecules' own motion (2-D: average kinetic energy = RT) */
    kineticT(){const P=st.parts.filter(p=>!p.stuck);return P.length?P.reduce((t,p)=>t+KE(p),0)/P.length/(R/1000):st.T},
    set(o){if('T' in o)st.Tset=Math.max(100,Math.min(1500,o.T));if('catalyst' in o)st.catalyst=!!o.catalyst;if('light' in o)st.light=!!o.light},
    /* a spark: adds SPARK_J of heat to the gas; the molecules there pick it up as they bump the gas */
    spark(x,y){st.T+=SPARK_J/C_GAS;st.ledger.sparkIn+=SPARK_J;st.events.push({k:'spark',x,y,t:st.t});return SPARK_J},
    barrier(rx){return rx.how==='catalyst'&&st.catalyst?rx.EaCat:rx.how==='light'&&st.light?rx.EaLight:rx.Ea},
    /* advance by dt seconds in whole fixed steps. Time is counted in millionths of a step, so 60, 120 or 144 frames per
       second add up to exactly the same number of steps (and the same result). At most 0.25 s per call. */
    step(dt){st.acc+=Math.round(Math.min(dt,.25)/H*1e6);while(st.acc>=1e6){st.acc-=1e6;tick()}},
    tick,
  };
  const grid=new Map();
  function tick(){st.t+=H;
    const qw=WALL*(st.T-st.Tset)*H;st.T-=qw/C_GAS;st.ledger.wallOut+=qw;
    const P=st.parts;
    for(const p of P){if(p.stuck)continue;
      if(rand()<THERMO*H)thermal(p);
      p.x+=p.vx*H;p.y+=p.vy*H;p.ang+=p.spin*H;
      if(p.x<p.r){p.x=p.r;wall(p,1,0)}else if(p.x>BOX.w-p.r){p.x=BOX.w-p.r;wall(p,-1,0)}
      if(p.y<p.r){p.y=p.r;wall(p,0,1)}else if(p.y>BOX.h-p.r){p.y=BOX.h-p.r;wall(p,0,-1)}}
    /* collisions: grid broad phase, exact elastic bounce between hard disks (stuck salt specks act as fixed walls) */
    grid.clear();const G=48;for(const p of P){const k=Math.floor(p.x/G)+','+Math.floor(p.y/G);let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(p)}
    const gone=new Set();
    for(const p of P){if(gone.has(p))continue;const gx=Math.floor(p.x/G),gy=Math.floor(p.y/G);
      for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const a=grid.get((gx+i)+','+(gy+j));if(!a)continue;
        for(const q of a){if(q.id<=p.id||gone.has(q)||gone.has(p)||(p.stuck&&q.stuck))continue;const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy),rr=p.r+q.r;if(d>=rr||d===0)continue;
          /* use the line of centres at the moment they touched, not after they've sunk into each other during the step:
             a late normal would understate how hard they hit */
          const wx=q.vx-p.vx,wy=q.vy-p.vy,w2=wx*wx+wy*wy,dw=dx*wx+dy*wy;let nx=dx/d,ny=dy/d;
          if(w2>0&&dw<0){const tau=Math.min(2*H,(dw+Math.sqrt(dw*dw-w2*(d*d-rr*rr)))/w2);const cx=dx-wx*tau,cy=dy-wy*tau,cl=Math.hypot(cx,cy)||1;nx=cx/cl;ny=cy/cl}
          const vn=(p.vx-q.vx)*nx+(p.vy-q.vy)*ny;
          if(vn>0){st.stats.collisions++;
            if(!p.stuck&&!q.stuck&&collide(p,q,vn,gone))continue;
            const ip=p.stuck?0:1/SPECIES[p.s].M,iq=q.stuck?0:1/SPECIES[q.s].M,J=2*vn/(ip+iq);
            p.vx-=J*ip*nx;p.vy-=J*ip*ny;q.vx+=J*iq*nx;q.vy+=J*iq*ny}
          const ws=(p.stuck?0:1)+(q.stuck?0:1),push=(rr-d+.02)/ws;if(!p.stuck){p.x-=nx*push;p.y-=ny*push}if(!q.stuck){q.x+=nx*push;q.y+=ny*push}}}}
    if(gone.size)st.parts=st.parts.filter(p=>!gone.has(p));
    if(st.events.length>60)st.events.splice(0,st.events.length-60);
    if(st.t-(st.history.length?st.history[st.history.length-1][0]:-1)>=.25){st.history.push([st.t,st.T]);if(st.history.length>240)st.history.shift()}}
  /* A molecule leaves a wall at the gas temperature (a "thermal wall"). The speed away from the wall follows the
     Rayleigh distribution, not a plain bell curve, because fast molecules hit walls more often; drawing it any other
     way would quietly cool the gas. Salt smoke sticks where it lands (its motion becomes heat). */
  function wall(p,nx,ny){const e0=KE(p);
    if(p.s==='NH4Cl'){st.T+=e0/C_GAS;p.stuck=true;p.vx=p.vy=0;return}
    const sg=Math.sqrt(R*st.T/SPECIES[p.s].M)*KAPPA;let u=0;while(!u)u=rand();const vn=sg*Math.sqrt(-2*Math.log(u)),vt=sg*gauss();
    const vx=p.vx,vy=p.vy;p.vx=nx*vn-ny*vt;p.vy=ny*vn+nx*vt;const dq=(KE(p)-e0)/C_GAS;if(st.T-dq<20){p.vx=nx?Math.abs(vx)*nx:vx;p.vy=ny?Math.abs(vy)*ny:vy;return}st.T-=dq}
  /* does this collision start a reaction? returns true if p and q were used up */
  function collide(p,q,vn,gone){
    const mp=SPECIES[p.s].M,mq=SPECIES[q.s].M,mu=mp*mq/(mp+mq),E=.5*mu*(vn/KAPPA)**2/1000;   /* kJ/mol along the line of centres */
    if(opt.probe)opt.probe(E,p.s,q.s);   /* tests use this to check the collision-energy distribution */
    for(const rx of REACTIONS){const meet=rx.meet;
      if(!((p.s===meet[0]&&q.s===meet[1])||(p.s===meet[1]&&q.s===meet[0])))continue;
      const S=st.stats.rx[rx.id],Ea=api.barrier(rx);S.meet++;if(E>S.maxE)S.maxE=E;
      if(E<Ea)continue;
      if(rx.Tmin&&st.T<rx.Tmin){S.cold++;continue}
      S.hard++;
      const mx=(p.x+q.x)/2,my=(p.y+q.y)/2,need=Object.assign({},rx.re),used=[p,q];need[p.s]--;need[q.s]--;
      for(const[s,c]of Object.entries(need)){for(let k=0;k<c;k++){let best=null,bd=GATHER;
        for(const o of st.parts){if(o.s!==s||o.stuck||gone.has(o)||used.includes(o))continue;const d=Math.hypot(o.x-mx,o.y-my);if(d<bd){bd=d;best=o}}
        if(!best){S.missing++;return false}used.push(best)}}
      const nOut=Object.values(rx.pr).reduce((a,b)=>a+b,0);
      if(st.parts.length-used.length+nOut>MAXN)return false;
      /* energy: reactants' motion + heat released = products' motion + heat into the gas */
      const q0=-rx.dH,ein=used.reduce((t,u)=>t+KE(u),0);
      let k=0;const out=[];
      for(const[s,c]of Object.entries(rx.pr))for(let i=0;i<c;i++){const src=used[k%used.length],a=k/nOut*6.283,sp=nOut>used.length?SPECIES[s].r*1.2:0,r=SPECIES[s].r;
        out.push(make(s,clamp(src.x+Math.cos(a)*sp,r,BOX.w-r),clamp(src.y+Math.sin(a)*sp,r,BOX.h-r)));k++}
      const e0=out.reduce((t,o)=>t+KE(o),0),want=Math.max(1e-6,ein+HOT*Math.max(0,q0)),f=Math.sqrt(want/e0);
      for(const o of out){o.vx*=f;o.vy*=f}
      for(const u of used)gone.add(u);
      st.T+=(ein+q0-want)/C_GAS;
      st.parts.push(...out);
      S.fired++;
      st.events.push({k:'rx',id:rx.id,x:mx,y:my,t:st.t,heat:q0,from:used.map(u=>({s:u.s,x:u.x,y:u.y})),to:out.map(o=>o.id)});
      return true}
    return false}
  return api;
}
const clamp=(v,a,b)=>v<a?a:v>b?b:v,clampI=(v,a,b)=>v<a?a:v>b?b:v;

/* ---------- experiments: fixed starting conditions and seeds, so each one replays exactly ---------- */
const EXPERIMENTS=[
  {id:'pop',name:'💥 Hydrogen pop',seed:11,T:298,mix:[['H2',24],['O2',12]],goal:'Hydrogen and oxygen are mixed. Will they react? Wait, then tap the chamber to make a spark.',focus:'h2burn'},
  {id:'flame',name:'🔥 Methane flame',seed:12,T:298,mix:[['CH4',10],['O2',20]],goal:'Gas-stove fuel and oxygen. Spark it and watch the temperature.',focus:'ch4burn'},
  {id:'lean',name:'🫁 Not enough oxygen',seed:13,T:298,mix:[['CH4',12],['O2',12]],goal:'The same fuel with too little oxygen. Spark it: what is left over?',focus:'ch4burn'},
  {id:'fizz',name:'🫧 Peroxide fizz',seed:14,T:330,mix:[['H2O2',20]],goal:'Hydrogen peroxide. Watch for a while, then switch the catalyst on and compare.',focus:'peroxide'},
  {id:'smoke',name:'🌫️ White smoke',seed:15,T:298,mix:[['NH3',10,[0,0,330,500]],['HCl',10,[470,0,800,500]]],goal:'Ammonia on the left, hydrogen chloride on the right. No spark needed: watch where they meet.',focus:'smoke'},
  {id:'light',name:'💡 Light switch',seed:16,T:298,mix:[['H2',10],['Cl2',10]],goal:'Hydrogen and chlorine in the dark. Then turn the light on.',focus:'hcl'},
  {id:'haber',name:'🌱 Make ammonia',seed:17,T:700,catalyst:true,mix:[['N2',8],['H2',24]],goal:'Nitrogen and hydrogen with a hot iron catalyst. Then try it with the catalyst switched off.',focus:'haber'},
];
function setup(exp){const c=chamber({seed:exp.seed,T:exp.T,catalyst:exp.catalyst,light:exp.light});for(const[s,n,reg]of exp.mix)c.add(s,n,reg);c.mark();return c}

/* What happened, worked out from the run itself (the counters the chamber kept), not from a script. */
function explain(c){
  const st=c.state,now=c.counts(),start=st.startCounts,lines=[];const present=s=>(start[s]||0)>0||(now[s]||0)>0;
  for(const rx of REACTIONS){const S=st.stats.rx[rx.id];if(!present(rx.meet[0])||!present(rx.meet[1]))continue;
    const a=SPECIES[rx.meet[0]].f,b=SPECIES[rx.meet[1]].f,Ea=c.barrier(rx),pair=rx.meet[0]===rx.meet[1]?`${a} molecules bumped into each other`:`${a} and ${b} bumped into each other`;
    if(S.fired){lines.push(`${rx.name}: it happened ${S.fired} time${S.fired>1?'s':''}. Each time ${fmt0(-rx.dH)} J of heat came out.`);
      /* which reactant ran short, worked out from what was put in and the equation */
      const ks=Object.keys(rx.re),runs=ks.map(k=>(start[k]||0)/rx.re[k]),lim=ks[runs.indexOf(Math.min(...runs))];
      const others=ks.filter(k=>k!==lim&&(now[k]||0)>0);
      if(ks.length>1&&!(now[lim]||0)&&others.length)lines.push(`It stopped because the ${SPECIES[lim].f} ran out. The equation needs ${ks.map(k=>`${rx.re[k]} ${SPECIES[k].f}`).join(' for every ')}, and you started with ${ks.map(k=>`${start[k]||0} ${SPECIES[k].f}`).join(' and ')}, so ${others.map(k=>`${now[k]} ${SPECIES[k].f}`).join(' and ')} ${others.reduce((t,k)=>t+now[k],0)>1?'are':'is'} left over.`);
      else if(ks.every(k=>(now[k]||0)>0))lines.push(`Some of each reactant is still there. ${rx.Tmin&&st.T<rx.Tmin?`The gas has cooled below ${fmt0(rx.Tmin)} K, so it stopped burning.`:'It may keep going if you wait.'}`)}
    else if(S.meet){
      if(S.cold)lines.push(`${pair} ${S.meet} times and ${S.cold} of those bumps had enough energy, but the gas was colder than ${fmt0(rx.Tmin)} K (the temperature this fuel needs before it can burn). No reaction.`);
      else{const hint=rx.how==='heat'?'A spark or more heat would give some bumps enough energy.':rx.how==='catalyst'?(st.catalyst?'More heat would help.':'A catalyst lowers the energy they need.'):rx.how==='light'?(st.light?'Give it time.':'Light breaks chlorine apart so they can react.'):'';
        lines.push(`${pair} ${S.meet} time${S.meet>1?'s':''}, but the hardest bump had ${fmt0(S.maxE)} kJ/mol and they need at least ${fmt0(Ea)}. No reaction. ${hint}`)}}
    if(S.missing&&!S.fired)lines.push(`${S.missing} bump${S.missing>1?'s were':' was'} hard enough, but the other molecules it needed were too far away.`)}
  const stuck=st.parts.filter(p=>p.stuck).length;if(stuck)lines.push(`${stuck} speck${stuck>1?'s':''} of solid salt stuck to the walls: that is the white smoke.`);
  return lines;
}
const fmt0=v=>Math.round(v).toLocaleString('en-US');

return{R,ELEMENTS,MAXZ,zOf,STABLE,RADIO,nuclide,isStable,stableNeutrons,configuration,configText,shells,valenceElectrons,ionInfo,chemistry,
  VALENCE,VALENCE_E,BUILD,LIB,TARGETS,formula,countOf,sameStructure,analyze,vsepr,bondPm,shapeConstraints,relax,
  SPECIES,speciesOfLib,REACTIONS,atomTally,chargeTally,equation,rng,chamber,BOX,H,KAPPA,C_GAS,WALL,SPARK_J,EXPERIMENTS,setup,explain};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=ATOM_SCI;
