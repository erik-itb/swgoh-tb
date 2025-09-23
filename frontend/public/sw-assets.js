/**
 * Service Worker for Asset Caching
 * Implements advanced caching strategies for SWGoH assets
 */

const CACHE_NAME = 'swgoh-assets-v1';
const CACHE_VERSION = '1.0.0';

// Asset URL patterns to cache
const ASSET_PATTERNS = [
  /\/api\/assets\/unit\/.+\/portrait/,
  /\/api\/assets\/unit\/.+\/icon/,
  /\/api\/assets\/unit\/.+\/assets/,
  /\/assets\/units\/.+\.(webp|png|jpg)/,
  /\/assets\/planets\/.+\.(webp|png|jpg)/,
  /\/assets\/fallback\/.+\.(webp|png|jpg)/
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only'
};

// Strategy mapping for different asset types
const STRATEGY_MAP = {
  portrait: CACHE_STRATEGIES.CACHE_FIRST,
  icon: CACHE_STRATEGIES.CACHE_FIRST,
  assets: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  fallback: CACHE_STRATEGIES.CACHE_FIRST,
  static: CACHE_STRATEGIES.CACHE_FIRST
};

// Cache TTL settings (in milliseconds)
const CACHE_TTL = {
  portrait: 24 * 60 * 60 * 1000, // 24 hours
  icon: 24 * 60 * 60 * 1000,     // 24 hours
  assets: 60 * 60 * 1000,        // 1 hour
  fallback: 7 * 24 * 60 * 60 * 1000, // 1 week
  static: 30 * 24 * 60 * 60 * 1000   // 30 days
};

// Install event - preload critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing asset service worker');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Preload fallback assets
      return cache.addAll([
        '/assets/fallback/character-portrait.png',
        '/assets/fallback/character-icon.png'
      ]);
    })
  );

  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating asset service worker');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle asset requests
  if (!isAssetRequest(url)) {
    return;
  }

  const assetType = getAssetType(url);
  const strategy = STRATEGY_MAP[assetType] || CACHE_STRATEGIES.NETWORK_FIRST;

  event.respondWith(
    handleRequest(request, strategy, assetType)
  );
});

// Message handling for cache management
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'CACHE_ASSETS':
      handleCacheAssets(data.urls);
      break;
    case 'CLEAR_CACHE':
      handleClearCache(data.pattern);
      break;
    case 'GET_CACHE_INFO':
      handleGetCacheInfo().then(info => {
        event.ports[0].postMessage(info);
      });
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Check if request is for assets
 */
function isAssetRequest(url) {
  return ASSET_PATTERNS.some(pattern => pattern.test(url.pathname));
}

/**
 * Determine asset type from URL
 */
function getAssetType(url) {
  const path = url.pathname;

  if (path.includes('/portrait')) return 'portrait';
  if (path.includes('/icon')) return 'icon';
  if (path.includes('/assets')) return 'assets';
  if (path.includes('/fallback')) return 'fallback';

  return 'static';
}

/**
 * Handle request with specified strategy
 */
async function handleRequest(request, strategy, assetType) {
  const cache = await caches.open(CACHE_NAME);

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cache, assetType);

    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cache, assetType);

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cache, assetType);

    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);

    default:
      return networkFirst(request, cache, assetType);
  }
}

/**
 * Cache-first strategy
 */
async function cacheFirst(request, cache, assetType) {
  const cacheKey = getCacheKey(request);
  const cachedResponse = await cache.match(cacheKey);

  if (cachedResponse && !isExpired(cachedResponse, assetType)) {
    console.log('[SW] Cache hit:', request.url);
    return cachedResponse;
  }

  try {
    console.log('[SW] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const responseToCache = addCacheMetadata(networkResponse.clone());
      await cache.put(cacheKey, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, returning cached version:', error);
    return cachedResponse || createFallbackResponse(request);
  }
}

/**
 * Network-first strategy
 */
async function networkFirst(request, cache, assetType) {
  const cacheKey = getCacheKey(request);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const responseToCache = addCacheMetadata(networkResponse.clone());
      await cache.put(cacheKey, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      return cachedResponse;
    }

    return createFallbackResponse(request);
  }
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(request, cache, assetType) {
  const cacheKey = getCacheKey(request);
  const cachedResponse = await cache.match(cacheKey);

  // Start network request in background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      const responseToCache = addCacheMetadata(response.clone());
      cache.put(cacheKey, responseToCache);
    }
    return response;
  }).catch(error => {
    console.log('[SW] Background update failed:', error);
  });

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Wait for network if no cache
  return networkPromise || createFallbackResponse(request);
}

/**
 * Generate cache key for request
 */
function getCacheKey(request) {
  const url = new URL(request.url);
  // Include query parameters in cache key for assets
  return url.pathname + url.search;
}

/**
 * Check if cached response is expired
 */
function isExpired(response, assetType) {
  const cacheDate = response.headers.get('sw-cached-date');
  if (!cacheDate) return false;

  const cachedTime = new Date(cacheDate).getTime();
  const ttl = CACHE_TTL[assetType] || CACHE_TTL.static;

  return Date.now() - cachedTime > ttl;
}

/**
 * Add cache metadata to response
 */
function addCacheMetadata(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-date', new Date().toISOString());
  headers.set('sw-cache-version', CACHE_VERSION);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

/**
 * Create fallback response for failed requests
 */
function createFallbackResponse(request) {
  const url = new URL(request.url);

  if (url.pathname.includes('portrait')) {
    return Response.redirect('/assets/fallback/character-portrait.png');
  }

  if (url.pathname.includes('icon')) {
    return Response.redirect('/assets/fallback/character-icon.png');
  }

  return new Response('Asset not available', {
    status: 404,
    statusText: 'Not Found'
  });
}

/**
 * Handle cache assets message
 */
async function handleCacheAssets(urls) {
  const cache = await caches.open(CACHE_NAME);

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const responseToCache = addCacheMetadata(response);
        await cache.put(url, responseToCache);
        console.log('[SW] Cached asset:', url);
      }
    } catch (error) {
      console.log('[SW] Failed to cache asset:', url, error);
    }
  }
}

/**
 * Handle clear cache message
 */
async function handleClearCache(pattern) {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  for (const request of keys) {
    const url = new URL(request.url);
    if (!pattern || url.pathname.includes(pattern)) {
      await cache.delete(request);
      console.log('[SW] Deleted from cache:', request.url);
    }
  }
}

/**
 * Get cache information
 */
async function handleGetCacheInfo() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  const info = {
    version: CACHE_VERSION,
    name: CACHE_NAME,
    size: keys.length,
    assets: []
  };

  for (const request of keys) {
    const response = await cache.match(request);
    const cachedDate = response.headers.get('sw-cached-date');

    info.assets.push({
      url: request.url,
      cachedDate: cachedDate,
      size: response.headers.get('content-length') || 'unknown'
    });
  }

  return info;
}