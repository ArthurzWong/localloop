/* LocalLoop service worker — offline shell + runtime cache.
   Deliberately conservative: HTML and API responses are never cached stale,
   so a visitor never sees yesterday's opening hours. */

const VERSION = "localloop-v1";
const SHELL = ["/", "/discover", "/places", "/map", "/saved", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never serve stale API or HTML.
  if (url.pathname.startsWith("/api/") || request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(request).then((r) => r ?? caches.match("/"))));
    return;
  }

  if (url.origin !== self.location.origin && !/\.(png|jpg|jpeg|webp|svg|css|js|woff2?)$/.test(url.pathname)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        event.waitUntil(
          fetch(request)
            .then((fresh) => caches.open(VERSION).then((c) => c.put(request, fresh.clone())))
            .catch(() => undefined),
        );
        return cached;
      }
      return fetch(request)
        .then((response) => {
          if (response.ok && response.type !== "opaque") {
            const copy = response.clone();
            event.waitUntil(caches.open(VERSION).then((c) => c.put(request, copy)));
          }
          return response;
        })
        .catch(() => caches.match("/"));
    }),
  );
});