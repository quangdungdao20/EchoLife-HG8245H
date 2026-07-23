// EchoLife HG8245H - Service Worker for PWA
// Version: 1.0.0
const CACHE_NAME = 'hg8245h-cache-v1';

// Các tài nguyên tĩnh cần cache ngay khi cài đặt
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icons/icon-72x72.svg',
  '/pwa-icons/icon-96x96.svg',
  '/pwa-icons/icon-128x128.svg',
  '/pwa-icons/icon-192x192.svg',
  '/pwa-icons/icon-512x512.svg'
];

// API endpoints được phép cache (GET requests)
const API_CACHE_ENDPOINTS = [
  '/api/status',
  '/api/settings',
  '/api/devices',
  '/api/macfilter',
  '/api/users'
];

// Install event - Precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Helper: kiểm tra URL có phải API endpoint được phép cache không
function isApiCacheable(url) {
  const pathname = new URL(url).pathname;
  return API_CACHE_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
}

// Helper: kiểm tra có phải tài nguyên tĩnh không
function isStaticAsset(url) {
  const pathname = new URL(url).pathname;
  // CSS/JS inline trong index.html nên không cần cache riêng
  // Chỉ cache các file tĩnh đã định nghĩa
  return PRECACHE_URLS.some(asset => pathname === asset || pathname === '/');
}

// Fetch event - Network first, cache fallback strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Chỉ xử lý requests cùng origin (không cache Cloudflare Tunnel API)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Strategy cho API endpoints: Network First, cache fallback
  if (isApiCacheable(request.url) && request.method === 'GET') {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Strategy cho static assets: Cache First, network fallback
  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Mọi thứ khác: Network only
  event.respondWith(fetch(request));
});

// Network First Strategy: ưu tiên lấy từ network, fallback về cache
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not OK');
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    // Nếu không có cache, trả về response lỗi
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Không thể kết nối tới server. Vui lòng kiểm tra kết nối mạng.',
        offline: true
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Cache First Strategy: ưu tiên lấy từ cache, fallback về network
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response(
      'Tài nguyên không khả dụng khi offline.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }
}

// Xử lý message từ client (ví dụ: clear cache)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
      event.ports[0].postMessage({ success: true });
    });
  }
});