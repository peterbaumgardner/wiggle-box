/* Magic Paint's picture book: every finished picture, oldest to newest, kept on this device, plus the picture that is on
   the paper right now (so a drawing is still there the next time the game opens). Used only by games/paint/paint.js.

   Storage is IndexedDB (much more room than localStorage, and it holds image files). Every call is safe without it
   (a private window, blocked storage): the book just keeps nothing. Writes run one at a time in the order they were
   asked for, so "add this picture, then remove it again" can never happen the other way round.

   Records: {id, t (ms), ink (PNG of the paint layer), thumb (small JPEG of the whole picture), paper, page, letterI,
   numN, filled, doneTold, w, h}. */
var PAINT_BOOK=(function(){
  const NAME='wiggle-box-paint',VERSION=1;
  let dbp=null,queue=Promise.resolve();
  function db(){
    if(!dbp)dbp=new Promise(ok=>{
      try{
        const r=indexedDB.open(NAME,VERSION);
        r.onupgradeneeded=()=>{const d=r.result;
          if(!d.objectStoreNames.contains('pictures'))d.createObjectStore('pictures',{keyPath:'id'});
          if(!d.objectStoreNames.contains('now'))d.createObjectStore('now')};
        r.onsuccess=()=>ok(r.result);r.onerror=()=>ok(null);r.onblocked=()=>ok(null);
      }catch(e){ok(null)}
      /* ask the browser not to clear the book when the device runs low on space (granted silently for installed apps) */
      try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{})}catch(e){}
    });
    return dbp}
  /* one transaction; resolves with the request's result once it is safely written */
  function tx(store,mode,fn){return db().then(d=>{if(!d)return null;
    return new Promise((ok,no)=>{const t=d.transaction(store,mode),r=fn(t.objectStore(store));
      t.oncomplete=()=>ok(r&&'result' in r?r.result:null);t.onerror=t.onabort=()=>no(t.error)})})}
  /* run writes one after another; a write may be given a promise of its record (pictures are encoded asynchronously) */
  function serial(fn){const p=queue.then(fn);queue=p.catch(()=>{});return p}
  return{
    add:rec=>serial(()=>Promise.resolve(rec).then(r=>r&&tx('pictures','readwrite',s=>s.put(r)))),
    remove:id=>serial(()=>tx('pictures','readwrite',s=>s.delete(id))),
    list:()=>queue.then(()=>tx('pictures','readonly',s=>s.getAll())).then(a=>(a||[]).sort((x,y)=>x.t-y.t)),
    get:id=>queue.then(()=>tx('pictures','readonly',s=>s.get(id))),
    saveNow:rec=>serial(()=>Promise.resolve(rec).then(r=>tx('now','readwrite',s=>s.put(r||null,'now')))),
    loadNow:()=>queue.then(()=>tx('now','readonly',s=>s.get('now'))),
    /* resolves when every write asked for so far is done */
    idle:()=>queue};
})();
