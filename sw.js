/* 美白工作台 Service Worker：离线可开、秒开、可"安装到桌面" */
const CACHE = 'meibai-workbench-20260801_152129';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  // 预缓存时也强制绕过 HTTP 缓存，保证装进缓存的是最新资源
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  // 清掉旧版本缓存（缓存名含 BUILD_ID，每次部署自动失效旧缓存）
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // 页面导航：强制绕过 HTTP 缓存拿最新版（保证部署后用户立刻看到新内容）
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request, { cache: 'reload' }).catch(() => caches.match('./index.html')));
    return;
  }
  // 其它静态资源：缓存优先，失败回退；取回后刷新缓存
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request, { cache: 'reload' }).then((res) => {
      const cp = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
