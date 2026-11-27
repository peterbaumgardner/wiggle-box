/* The game registry and loader.

   games/registry.js lists every game (title, icon, home-screen section...) by calling registerGames(). That list is
   all the home screen needs. A game's own code lives in games/<key>/ and is loaded the first time a child opens it:

     games/<key>/<key>.js    calls defineGame('<key>', {init(stage, g){...}})   (always)
     games/<key>/<key>.css   styles for this game only                          (when the entry has css:true)

   Because each game loads on its own, a mistake in one game's file shows "Oops" in that game and nothing else breaks. */
const GAMES={};
let SECTIONS=[];

/* metadata fields a registry entry may have; anything else is a typo and gets a console warning */
const GAME_FIELDS=['key','title','icon','color','age','section','order','blurb','css','files','layout','stageClass'];

function registerSections(list){SECTIONS=list}

function registerGames(list){
  for(const m of list){
    if(!m.key||GAMES[m.key]){console.error('registry: missing or duplicate key',m.key);continue}
    for(const f of Object.keys(m))if(!GAME_FIELDS.includes(f))console.warn(`registry: ${m.key} has an unknown field "${f}"`);
    const dir=`games/${m.key}/`;
    GAMES[m.key]={section:'play',order:50,color:'var(--sky)',age:'',blurb:'',
      ...m,
      /* every file this game needs, in load order: extra files first, then the game's own script and stylesheet */
      files:[...(m.files||[]),dir+m.key+'.js',...(m.css?[dir+m.key+'.css']:[])],
      c:m.color||'var(--sky)'};
  }
}

/* Called by games/<key>/<key>.js. Adds the game's code (init, and anything else it wants to expose) to its registry entry. */
function defineGame(key,def){
  const G=GAMES[key];
  if(!G){console.error(`defineGame('${key}'): no such game in games/registry.js`);return}
  if(typeof def.init!=='function'){console.error(`defineGame('${key}'): init(stage, g) is missing`);return}
  Object.assign(G,def);
}

/* Load a game's files once. Scripts load in order; stylesheets load alongside. Resolves when the game can start. */
const loadedFiles=new Map();
function loadFile(src){
  if(loadedFiles.has(src))return loadedFiles.get(src);
  const p=new Promise((ok,fail)=>{
    const css=src.endsWith('.css'),el=document.createElement(css?'link':'script');
    if(css){el.rel='stylesheet';el.href=src}else{el.src=src;el.async=false}
    el.addEventListener('load',ok,{once:true});
    el.addEventListener('error',()=>{loadedFiles.delete(src);el.remove();fail(new Error('could not load '+src))},{once:true});
    document.head.appendChild(el)});
  loadedFiles.set(src,p);return p}
async function loadGame(key){
  const G=GAMES[key];if(!G)throw new Error('no game '+key);
  const css=G.files.filter(f=>f.endsWith('.css')).map(loadFile);
  for(const f of G.files)if(!f.endsWith('.css'))await loadFile(f);
  await Promise.all(css);
  if(typeof G.init!=='function')throw new Error(`games/${key}/${key}.js did not call defineGame('${key}', {init})`);
  return G}
