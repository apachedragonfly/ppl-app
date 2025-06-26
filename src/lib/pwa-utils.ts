// PWA utilities for handling authentication and cache management

export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return (window.navigator as any).standalone === true || 
         window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches
}

export const clearAuthCache = async (): Promise<void> => {
  if ('serviceWorker' in navigator && 'caches' in window) {
    try {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.includes('auth') || cacheName.includes('session')) {
            return caches.delete(cacheName)
          }
        })
      )
    } catch (error) {
      console.error('Failed to clear auth cache:', error)
    }
  }
}

export const refreshPWA = (): void => {
  if (isPWA()) {
    // For PWA, use location.href for hard refresh
    window.location.href = window.location.pathname
  } else {
    // For regular browser, use router or reload
    window.location.reload()
  }
}

export const navigateInPWA = (path: string): void => {
  if (isPWA()) {
    // For PWA, use location.href for proper navigation
    window.location.href = path
  } else {
    // For regular browser, this should be handled by router
    window.location.href = path
  }
}

export const handlePWAAuthRedirect = async (path: string): Promise<void> => {
  // Clear any cached auth data
  await clearAuthCache()
  
  // Small delay to ensure cache is cleared
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Navigate to the desired path
  navigateInPWA(path)
}

export const registerPWAUpdateHandler = (): void => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Service worker has been updated, refresh to get new content
      window.location.reload()
    })
  }
}

export const checkForPWAUpdate = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.update()
      return registration.waiting !== null
    } catch (error) {
      console.error('Error checking for PWA update:', error)
      return false
    }
  }
  return false
} 