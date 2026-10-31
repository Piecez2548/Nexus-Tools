// Keeps pages and tools that were opened before available offline.
//  - Pages: network first, so a deploy is picked up at once; the cache is only a fallback.
//  - /assets/*: file names carry a content hash, so cache first is safe and fast.
//  - Everything else (API calls, media, OCR and PDF.js data, other origins) is left to the network.
// Bump VERSION to discard everything cached by an older worker.
const VERSION = "v1";
const PAGES = `nexus-pages-${VERSION}`;
const ASSETS = `nexus-assets-${VERSION}`;
const MAX_ASSETS = 160;

// Pages and files requested before this worker took control were never seen by it, so the home page
// and the files it loads are fetched once here. That is what makes the home page work offline.
async function precacheShell() {
  const response = await fetch("/", { cache: "reload" });
  if (!response.ok) return;
  const pages = await caches.open(PAGES);
  await pages.put("/", response.clone());
  const files = [...new Set((await response.text()).match(/\/assets\/[^"'\s)]+\.(?:js|css)/g) ?? [])];
  const assets = await caches.open(ASSETS);
  await Promise.all(files.map((file) => assets.add(file).catch(() => undefined)));
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // A failed precache (for example no network) must not stop the worker from installing.
  event.waitUntil(precacheShell().catch(() => undefined));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("nexus-") && name !== PAGES && name !== ASSETS) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

async function trim(cache) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_ASSETS))) await cache.delete(key);
}

async function cachedAsset(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    await cache.put(request, response.clone());
    await trim(cache);
  }
  return response;
}

async function page(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") await cache.put(request.url, response.clone());
    return response;
  } catch {
    // Offline: the page itself if it was visited, otherwise the home page, which opens any tool by its address.
    return (await cache.match(request.url)) || (await cache.match("/")) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    // A shared-media link carries ?media=..., and its content must always come from the network.
    if (url.searchParams.has("media")) return;
    event.respondWith(page(request));
  } else if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cachedAsset(request));
  }
});
