const CACHE_PREFIX = "url-workbench";
const CACHE_VERSION = "2026-06-01-1";
const STATIC_CACHE = `${CACHE_PREFIX}-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  "./",
  "./favicon.svg",
  "./logo.svg",
  "./manifest.webmanifest",
  "./apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./og/url-workbench-og.png",
];

function scopedUrl(path) {
  return new URL(path, self.registration.scope).toString();
}

function isCacheableResponse(response) {
  return response && response.ok && response.type !== "opaque";
}

async function collectPrecacheUrls() {
  const appShell = scopedUrl("./");
  const urls = new Set(STATIC_ASSETS.map(scopedUrl));

  try {
    const response = await fetch(appShell, { cache: "reload" });
    if (!isCacheableResponse(response)) return [...urls];

    const html = await response.clone().text();
    const assetPattern = /\b(?:href|src)="([^"]+)"/g;
    const scope = new URL(self.registration.scope);

    for (const match of html.matchAll(assetPattern)) {
      const assetUrl = new URL(match[1], scope);

      if (assetUrl.origin === scope.origin && assetUrl.pathname.startsWith(scope.pathname)) {
        urls.add(assetUrl.toString());
      }
    }
  } catch {
    return [...urls];
  }

  return [...urls];
}

async function refreshCache(request, response) {
  if (!isCacheableResponse(response)) return;

  const cache = await caches.open(STATIC_CACHE);
  await cache.put(request, response.clone());
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(async (cache) => cache.addAll(await collectPrecacheUrls()))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);

  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(handleAsset(request));
});

async function handleNavigation(request) {
  const appShell = scopedUrl("./");

  try {
    const response = await fetch(request);

    await refreshCache(appShell, response);
    return response;
  } catch {
    const cachedShell = await caches.match(appShell);

    if (cachedShell) return cachedShell;

    const cachedRequest = await caches.match(request);
    return cachedRequest || Response.error();
  }
}

async function handleAsset(request) {
  const cachedResponse = await caches.match(request);
  const networkResponsePromise = fetch(request)
    .then(async (response) => {
      await refreshCache(request, response);
      return response;
    })
    .catch(() => undefined);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await networkResponsePromise;
  return networkResponse || Response.error();
}
