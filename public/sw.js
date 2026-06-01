const CACHE_PREFIX = "url-workbench";
const CACHE_VERSION = "2026-06-02-3";
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
  return Boolean(response && response.ok && response.type !== "opaque");
}

function isAppShellResponse(response) {
  if (!isCacheableResponse(response)) return false;

  const contentType = response.headers.get("content-type");
  return contentType ? contentType.includes("text/html") : false;
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
      try {
        const assetUrl = new URL(match[1], scope);

        if (assetUrl.origin === scope.origin && assetUrl.pathname.startsWith(scope.pathname)) {
          urls.add(assetUrl.toString());
        }
      } catch {
        // Ignore malformed asset references without aborting the rest of the precache list.
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

async function precacheUrls(cache, urls) {
  await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "reload" });

        if (isCacheableResponse(response)) {
          await cache.put(url, response);
        }
      } catch {
        // Non-critical assets should not prevent the service worker from installing.
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(async (cache) => precacheUrls(cache, await collectPrecacheUrls()))
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

    if (isAppShellResponse(response)) {
      await refreshCache(appShell, response);
    }

    return response;
  } catch {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) return cachedResponse;

    const cachedShell = await caches.match(appShell);
    return cachedShell || Response.error();
  }
}

async function handleAsset(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    await refreshCache(request, networkResponse);
    return networkResponse;
  } catch {
    return Response.error();
  }
}
