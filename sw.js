/* Wiggle Box offline cache.
   - Install stores the whole app (fresh from the network, never from a stale browser cache) under one versioned name.
   - The page itself is network-first, so a connected device always gets the newest version; offline it gets the stored copy.
   - Everything else is cache-first. A new version replaces the old cache in one step, so files from two versions never mix.
   The version below is the content hash of the app files; `npm run stamp` updates it, and a test fails if it is stale. */
const VERSION='ae3d8c598774';
const CACHE='wigglebox-'+VERSION;
const SHELL=['./','index.html','css/app.css','js/core.js','js/data.js','games/art.js','games/atoms-sci.js','games/atoms.js','games/balance.js','games/bridge.js','games/bubbles.js','games/cannon.js','games/chance.js','games/circuit.js','games/feed.js','games/fireworks.js','games/forge.js','games/geo.js','games/graph.js','games/laser.js','games/music.js','games/paint.js','games/physics.js','games/potion.js','games/primes.js','games/puzzles.js','games/robo.js','games/sand.js','games/shapes.js','games/space.js','games/splash.js','games/trace.js','games/waves.js','games/words.js','js/app.js','matter.min.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('wigglebox-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
  if(r.mode==='navigate'){
    /* only a real page is stored: a 404 or a captive-portal error must never replace the app */
    e.respondWith(fetch(r).then(res=>{if(res.ok&&res.type==='basic'){const cp=res.clone();caches.open(CACHE).then(c=>c.put('index.html',cp))}return res})
      .catch(()=>caches.match('index.html',{cacheName:CACHE}).then(hit=>hit||caches.match('index.html'))));return}
  e.respondWith(caches.match(r,{cacheName:CACHE}).then(hit=>hit||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})))});
