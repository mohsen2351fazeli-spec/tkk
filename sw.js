/* Service worker: faster repeat visits on a host that cannot set cache headers (GitHub Pages).
 *
 *  pages, css, js   network first, so a new deploy shows up at once; the saved copy
 *                   is only used when the network fails or takes longer than 4 s
 *  images, fonts    cache first, re-checked in the background once a week
 *  music, ranges    left alone, the browser handles audio streaming itself
 *
 * Change VERSION to throw away everything saved so far.
 */
const VERSION = "v1";
const PAGES = `tk-pages-${VERSION}`;
const MEDIA = `tk-media-${VERSION}`;
const WEEK = 7 * 24 * 60 * 60 * 1000;
const SLOW = 4000;

const SHELL = [
  "style/fonts/Estedad-VF.woff2",
  "style/fonts/Amiri-Bold-fa.woff",
  "style/base.min.css",
  "script/common.min.js",
  "poster/favicon-192.png",
  "poster/li.webp",
];

const MEDIA_FILE = /\.(?:webp|png|jpe?g|gif|avif|svg|ico|woff2?|ttf)$/i;
const PAGE_FILE = /\.(?:html|css|js|xml|json|txt)$/i;
const STREAMED = /\.(?:mp3|m4a|ogg|wav|mp4|webm)$/i;

/* a copy with the time it was saved, so old images can be re-checked */
async function store(cache, request, response) {
  const headers = new Headers(response.headers);
  headers.set("x-sw-saved-at", String(Date.now()));
  await cache.put(
    request,
    new Response(await response.blob(), { status: 200, statusText: response.statusText, headers }),
  );
}

async function networkFirst(event) {
  const request = event.request;
  const cache = await caches.open(PAGES);
  const saved = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response.ok) event.waitUntil(cache.put(request, response.clone()));
    return response;
  });
  if (!saved) return network;
  const slow = new Promise((resolve) => setTimeout(() => resolve(saved), SLOW));
  return Promise.race([network, slow]).catch(() => saved);
}

async function cacheFirst(event) {
  const request = event.request;
  const cache = await caches.open(MEDIA);
  const saved = await cache.match(request);
  if (saved) {
    const age = Date.now() - (Number(saved.headers.get("x-sw-saved-at")) || 0);
    if (age > WEEK) {
      event.waitUntil(
        fetch(request, { cache: "no-cache" })
          .then((fresh) => (fresh.status === 200 ? store(cache, request, fresh) : null))
          .catch(() => null),
      );
    }
    return saved;
  }
  const response = await fetch(request);
  if (response.status === 200) event.waitUntil(store(cache, request, response.clone()));
  return response;
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(MEDIA);
      await Promise.allSettled(
        SHELL.map(async (path) => {
          const request = new Request(new URL(path, self.registration.scope));
          const response = await fetch(request);
          if (response.status === 200) await store(cache, request, response);
        }),
      );
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("tk-") && name !== PAGES && name !== MEDIA) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("range")) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || STREAMED.test(url.pathname)) return;
  if (url.pathname.endsWith("/sw.js")) return;

  if (MEDIA_FILE.test(url.pathname)) {
    event.respondWith(cacheFirst(event));
  } else if (request.mode === "navigate" || PAGE_FILE.test(url.pathname)) {
    event.respondWith(networkFirst(event));
  }
});
