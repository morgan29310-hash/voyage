// Service worker : garde l'appli en cache pour l'utiliser sans réseau.
const CACHE='budget-voyage-v10';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return; // taux de change et widget passent par le réseau
  // Réseau d'abord (3 s max, utile en roaming lent), sinon la copie en cache.
  const net=fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r});
  const cached=()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'));
  e.respondWith(new Promise(res=>{let done=false;
    const t=setTimeout(()=>cached().then(r=>{if(r&&!done){done=true;res(r)}}),3000);
    net.then(r=>{if(!done){done=true;clearTimeout(t);res(r)}}).catch(()=>cached().then(r=>{if(!done){done=true;clearTimeout(t);res(r||Response.error())}}))}));
});
