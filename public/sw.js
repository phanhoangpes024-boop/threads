// public/sw.js
const CACHE_NAME = 'threads-images-v1'
const IMAGE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  
  return self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  if (
    request.method === 'GET' &&
    url.hostname.includes('supabase.co') &&
    url.pathname.includes('/storage/v1/object/public/')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            const cachedDate = new Date(cachedResponse.headers.get('date'))
            const now = new Date()
            
            if (now - cachedDate < IMAGE_CACHE_MAX_AGE) {
              return cachedResponse
            }
          }
          
          return fetch(request).then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone())
            }
            return response
          })
        })
      })
    )
  }
})