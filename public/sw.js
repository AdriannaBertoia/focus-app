// Service Worker for Focus PWA
const CACHE_NAME = "focus-v1";

// Cache the shell on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/now", "/today", "/meetings", "/tasks", "/inbox"]);
    })
  );
  self.skipWaiting();
});

// Serve from cache, fall back to network
self.addEventListener("fetch", (event) => {
  // Skip API calls — always go to network
  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});

// Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});
