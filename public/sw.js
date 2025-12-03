// public/sw.js - FIXED
const CACHE_NAME = 'threads-images-v2'
const IMAGE_CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 ngày

self.addEventListener('install', (event) => {
  console.log('[SW] Installing v2...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v2...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  
  return self.clients.claim()
})

// ✅ FIX 4: Stale-while-revalidate - Cache vĩnh viễn
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  const isImage = 
    request.method === 'GET' &&
    (
      (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/v1/object/public/')) ||
      (url.hostname.includes('unsplash.com'))
    )
  
  if (isImage) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone())
            }
            return response
          }).catch(() => cachedResponse)
          
          if (cachedResponse) {
            return cachedResponse
          }
          
          return fetchPromise
        })
      })
    )
  }
})