// Service Worker for PPL Tracker PWA
const CACHE_NAME = 'ppl-tracker-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/workouts/new',
  '/analytics',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icon.svg',
  '/icon-512x512.png'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  // Don't cache authentication or API requests
  const url = new URL(event.request.url)
  const isAuthRequest = url.pathname.includes('/auth/') || 
                       url.pathname.includes('/api/') ||
                       url.hostname.includes('supabase.co') ||
                       url.hostname.includes('supabase.in') ||
                       event.request.method !== 'GET'

  if (isAuthRequest) {
    // Always fetch from network for auth/API requests
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response
        }
        return fetch(event.request).then((response) => {
          // Don't cache if it's an error response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone the response for caching
          const responseToCache = response.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })

          return response
        })
      })
  )
})

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'workout-sync') {
    event.waitUntil(syncWorkoutData())
  }
})

// Push notification handler
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New workout reminder!',
          icon: '/icon.svg',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'start-workout',
        title: 'Start Workout',
        icon: '/icon.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon.svg'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('PPL Tracker', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'start-workout') {
    event.waitUntil(
      clients.openWindow('/workouts/new')
    )
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Helper function to sync workout data
async function syncWorkoutData() {
  try {
    // This would normally sync with your backend
    // For now, we'll just log that sync was attempted
    console.log('Background sync: Attempting to sync workout data')
    
    // In a real implementation, you would:
    // 1. Get offline data from IndexedDB
    // 2. Send to your API
    // 3. Mark as synced
    
    return Promise.resolve()
  } catch (error) {
    console.error('Background sync failed:', error)
    return Promise.reject(error)
  }
} 