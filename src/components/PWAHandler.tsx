'use client'

import { useEffect } from 'react'
import { registerPWAUpdateHandler } from '@/lib/pwa-utils'

export default function PWAHandler() {
  useEffect(() => {
    // Register PWA update handler
    registerPWAUpdateHandler()
    
    // Handle visibility changes (important for PWA)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // App became visible, check for auth state changes
        console.log('PWA became visible - checking auth state')
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // This component doesn't render anything
  return null
} 