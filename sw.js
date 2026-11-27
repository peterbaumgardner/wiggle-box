/* Wiggle Box offline cache.
   - Install stores the whole app (fresh from the network, never from a stale browser cache) under one versioned name.
   - The page itself is network-first, so a connected device always gets the newest version; offline it gets the stored copy.
   - Everything else is cache-first. A new version replaces the old cache in one step, so files from two versions never mix.
   The version below is the content hash of the app files; `npm run stamp` updates it, and a test fails if it is stale. */
const VERSION='03c2b55d3172';
const CACHE='wigglebox-'+VERSION;
const SHELL=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/apple-touch-icon.png','css/app.css','js/util.js','js/sound.js','js/effects.js','js/input.js','js/ui.js','js/data.js','js/games.js','games/registry.js','js/app.js','games/splash/splash.js','games/physics/physics.js','games/sand/sand.js','games/sand/sand.css','games/space/space.js','games/cannon/cannon.js','games/circuit/circuit.js','games/laser/laser.js','games/atoms/atoms-sci.js','games/atoms/atoms.js','games/atoms/atoms.css','games/bridge/bridge.js','games/waves/waves.js','games/graph/graph.js','games/balance/balance.js','games/geo/geo.js','games/potion/potion.js','games/forge/forge.js','games/primes/primes.js','games/art/art.js','games/chance/chance.js','games/robo/robo.js','games/puzzles/puzzles.js','games/bubbles/bubbles.js','games/fireworks/fireworks.js','games/paint/paint.js','games/paint/paint.css','games/feed/feed.js','games/feed/feed.css','games/shapes/shapes.js','games/music/music.js','games/trace/trace.js','games/words/words.js','matter.min.js','icons/icon-512.png','icons/maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('wigglebox-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
  if(r.mode==='navigate'){
    /* only a real page is stored: a 404 or a captive-portal error must never replace the app */
    e.respondWith(fetch(r).then(res=>{if(res.ok&&res.type==='basic'){const cp=res.clone();caches.open(CACHE).then(c=>c.put('index.html',cp))}return res})
      .catch(()=>caches.match('index.html',{cacheName:CACHE}).then(hit=>hit||caches.match('index.html'))));return}
  e.respondWith(caches.match(r,{cacheName:CACHE}).then(hit=>hit||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})))});
