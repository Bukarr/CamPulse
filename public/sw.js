/**
 * CamPulse Progressive Web App Service Worker
 * Powered by Workbox with robust native offline fail-safe fallback.
 */

const CACHE_VERSION = 'campulse-v4';
const STATIC_CACHE = `campulse-static-${CACHE_VERSION}`;
const PAGES_CACHE = `campulse-pages-${CACHE_VERSION}`;
const API_CACHE = `campulse-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `campulse-images-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://img.icons8.com/color/192/maintenance.png',
  'https://img.icons8.com/color/512/maintenance.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
];

// Try importing Workbox from Google CDN
try {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');
} catch (e) {
  console.warn('[Service Worker] Failed to load Workbox via importScripts. Initializing custom native engine.', e);
}

if (typeof workbox !== 'undefined') {
  console.log('[Service Worker] Workbox loaded successfully! Configuring declarative routing policies.');

  // Set up Workbox config
  workbox.setConfig({ debug: false });

  // Precache app shell
  workbox.precaching.precacheAndRoute(
    PRECACHE_ASSETS.map(url => ({ url, revision: CACHE_VERSION }))
  );

  // 1. Navigation requests (HTML / SPA core) - NetworkFirst with strict timeout
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: PAGES_CACHE,
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  // 2. API GET Requests - NetworkFirst with fallback
  workbox.routing.registerRoute(
    ({ url, request }) => url.pathname.includes('/api/') && request.method === 'GET',
    new workbox.strategies.NetworkFirst({
      cacheName: API_CACHE,
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // Cache for 1 day
          purgeOnQuotaError: true,
        })
      ]
    })
  );

  // 3. Static Hashed Assets (JS/CSS under assets) - CacheFirst
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.includes('/assets/'),
    new workbox.strategies.CacheFirst({
      cacheName: STATIC_CACHE,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days cache
        })
      ]
    })
  );

  // 4. Image requests - StaleWhileRevalidate
  workbox.routing.registerRoute(
    ({ request, url }) => request.destination === 'image' || 
                         url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i) ||
                         url.host.includes('icons8.com'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: IMAGE_CACHE,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days cache
          purgeOnQuotaError: true,
        })
      ]
    })
  );

  // Background Sync Event Listener to flush queues
  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-reports' || event.tag === 'campulse-sync') {
      console.log('[Service Worker Sync] Background Sync triggered. Posting event to clients.');
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_FLUSH' });
        });
      });
    }
  });

} else {
  // --- NATIVE RESILIENT FALLBACK ENGINE ---
  console.log('[Service Worker] Running in Native High-Resilience mode (Standard Cache APIs).');

  // Helper to trim cache
  async function trimCache(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      for (let i = 0; i < keys.length - maxItems; i++) {
        await cache.delete(keys[i]);
      }
    }
  }

  // Precache Shell on install
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      }).then(() => self.skipWaiting())
    );
  });

  // Clean old caches on activation
  self.addEventListener('activate', (event) => {
    const activeCaches = [STATIC_CACHE, PAGES_CACHE, API_CACHE, IMAGE_CACHE];
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (!activeCaches.includes(key)) {
              return caches.delete(key);
            }
          })
        );
      }).then(() => self.clients.claim())
    );
  });

  // Fetch interceptor with timeout constraints
  self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (!request.url.startsWith('http')) return;

    // 1. Navigation Pages
    if (request.mode === 'navigate') {
      event.respondWith(
        Promise.race([
          fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(PAGES_CACHE).then((cache) => cache.put('/', clone));
              return networkResponse;
            }
            return caches.match('/index.html');
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]).catch(() => caches.match('/index.html'))
      );
      return;
    }

    // 2. API GET Requests
    if (url.pathname.includes('/api/')) {
      if (request.method !== 'GET') {
        event.respondWith(
          fetch(request).catch(() => {
            return new Response(
              JSON.stringify({
                offline: true,
                error: 'Connection lost. Action queued locally.',
                data: []
              }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          })
        );
        return;
      }

      event.respondWith(
        Promise.race([
          fetch(request).then((networkResponse) => {
            if (networkResponse.ok && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(API_CACHE).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]).catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({
              offline: true,
              message: 'Offline mode. Showing cached information.',
              data: []
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
      );
      return;
    }

    // 3. Static Hashed Assets (CacheFirst)
    if (url.pathname.includes('/assets/')) {
      event.respondWith(
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          });
        })
      );
      return;
    }

    // 4. Images (StaleWhileRevalidate)
    const isImg = request.destination === 'image' || 
                  url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i) ||
                  request.url.includes('icons8.com');

    if (isImg) {
      event.respondWith(
        caches.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(IMAGE_CACHE).then((cache) => {
                cache.put(request, clone);
                trimCache(IMAGE_CACHE, 50);
              });
            }
            return networkResponse;
          }).catch(() => {});
          return cached || fetchPromise;
        })
      );
      return;
    }

    // Default: StaleWhileRevalidate
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => {});
        return cached || fetchPromise;
      })
    );
  });
}
