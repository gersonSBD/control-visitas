const CACHE_NAME = "control-visitas-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./styles/main.css",
  "./assets/icons/icon-192.svg",
  "./assets/icons/icon-512.svg",
  "./scripts/core/db.js",
  "./scripts/core/utils.js",
  "./scripts/core/ui.js",
  "./scripts/features/settings/settings.ui.js",
  "./scripts/features/branches/branches.ui.js",
  "./scripts/features/events/events.service.js",
  "./scripts/features/tracking/geofence.engine.js",
  "./scripts/features/history/history.ui.js",
  "./scripts/features/reports/reports.service.js",
  "./scripts/features/dashboard/dashboard.ui.js",
  "./scripts/app/init.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
