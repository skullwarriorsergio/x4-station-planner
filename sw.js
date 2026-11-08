// Offline support: the app opens instantly from the cache, then refreshes itself in the background.
// CACHE changes with every published index.html (tools/deploy_planner.py stamps it).
const CACHE = 'x4planner-18ad667b1d';
const ASSETS = [
 "./",
 "./index.html",
 "./manifest.webmanifest",
 "./icon-180.png",
 "./icon-192.png",
 "./icon-512.png"
];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache (GitHub Pages allows 10 min), so a new version
  // always stores the files that were just published
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, {cache: 'reload'}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(key);
    const fresh = fetch(req).then(res => {
      if (res.ok) cache.put(key, res.clone());
      return res;
    }).catch(() => hit);
    return hit || fresh;
  }));
});
