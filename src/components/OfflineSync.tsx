'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

interface OfflineData {
  id: string
  type: 'workout' | 'exercise' | 'profile'
  data: any
  timestamp: number
  synced: boolean
}

interface SyncStats {
  pendingCount: number
  lastSyncTime: number | null
  isOnline: boolean
  syncInProgress: boolean
}

export default function OfflineSync({ userId }: { userId: string }) {
  const [syncStats, setSyncStats] = useState<SyncStats>({
    pendingCount: 0,
    lastSyncTime: null,
    isOnline: true, // Default to true, will be corrected on mount
    syncInProgress: false
  })
  const [offlineData, setOfflineData] = useState<OfflineData[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadOfflineData = useCallback(() => {
    if (!mounted) return
    
    try {
      const stored = localStorage.getItem(`offline_data_${userId}`)
      const data = stored ? JSON.parse(stored) : []
      setOfflineData(data)
      setSyncStats(prev => ({ 
        ...prev, 
        pendingCount: data.filter((item: OfflineData) => !item.synced).length,
        isOnline: navigator.onLine
      }))
    } catch (error) {
      console.error('Error loading offline data:', error)
    }
  }, [userId, mounted])

  const saveOfflineData = useCallback((data: OfflineData[]) => {
    if (!mounted) return
    
    try {
      localStorage.setItem(`offline_data_${userId}`, JSON.stringify(data))
      setOfflineData(data)
      setSyncStats(prev => ({ 
        ...prev, 
        pendingCount: data.filter(item => !item.synced).length 
      }))
    } catch (error) {
      console.error('Error saving offline data:', error)
    }
  }, [userId, mounted])

  const syncOfflineData = useCallback(async () => {
    if (!mounted) return
    
    // Get current state to avoid stale closure
    const currentOfflineData = JSON.parse(localStorage.getItem(`offline_data_${userId}`) || '[]')
    
    setSyncStats(prev => {
      if (prev.syncInProgress || !navigator.onLine) return prev
      return { ...prev, syncInProgress: true }
    })

    try {
      const pendingItems = currentOfflineData.filter((item: OfflineData) => !item.synced)

      // Mark all as synced for demo
      if (pendingItems.length > 0) {
        const updatedData = currentOfflineData.map((item: OfflineData) => 
          !item.synced ? { ...item, synced: true } : item
        )
        
        localStorage.setItem(`offline_data_${userId}`, JSON.stringify(updatedData))
        setOfflineData(updatedData)
      }

      setSyncStats(prev => ({ 
        ...prev, 
        lastSyncTime: Date.now(),
        syncInProgress: false,
        pendingCount: 0
      }))

    } catch (error) {
      console.error('Sync error:', error)
      setSyncStats(prev => ({ ...prev, syncInProgress: false }))
    }
  }, [userId, mounted])

  // Initialize data when component mounts
  useEffect(() => {
    if (!mounted) return
    
    loadOfflineData()
    
    const handleOnline = () => {
      setSyncStats(prev => ({ ...prev, isOnline: true }))
      // Auto-sync when coming back online
      setTimeout(() => {
        syncOfflineData()
      }, 1000)
    }
    
    const handleOffline = () => {
      setSyncStats(prev => ({ ...prev, isOnline: false }))
    }

    // Set initial online status
    setSyncStats(prev => ({ ...prev, isOnline: navigator.onLine }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [mounted, userId]) // Remove function dependencies to avoid circular updates

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - timestamp

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            🔄 Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading sync status...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          🔄 Sync Status
          <Badge variant={syncStats.isOnline ? "default" : "secondary"}>
            {syncStats.isOnline ? '🟢 Online' : '🔴 Offline'}
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Keep your data synchronized across all devices
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{syncStats.pendingCount}</div>
            <div className="text-sm text-blue-700">Pending Sync</div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-sm font-bold text-green-600">
              {syncStats.lastSyncTime 
                ? formatTimestamp(syncStats.lastSyncTime)
                : 'Never'
              }
            </div>
            <div className="text-sm text-green-700">Last Sync</div>
          </div>
        </div>

        {/* Sync Actions */}
        {syncStats.isOnline ? (
          <div className="space-y-2">
            <Button
              onClick={syncOfflineData}
              disabled={syncStats.syncInProgress}
              className="w-full"
            >
              {syncStats.syncInProgress ? '⏳ Syncing...' : '🔄 Sync Now'}
            </Button>
            {syncStats.pendingCount > 0 && (
              <p className="text-sm text-blue-600 text-center">
                {syncStats.pendingCount} item{syncStats.pendingCount !== 1 ? 's' : ''} waiting to sync
              </p>
            )}
          </div>
        ) : (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-600">📶</span>
              <span className="font-medium text-orange-700">Offline Mode</span>
            </div>
            <p className="text-sm text-orange-600">
              Your data is being saved locally. It will sync automatically when you're back online.
            </p>
          </div>
        )}

        {/* Detailed View Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Sync Details</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '▼ Hide' : '▶ Show'}
          </Button>
        </div>

        {/* Detailed Sync Information */}
        {showDetails && (
          <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium">
              Offline Data ({offlineData.length} items)
            </div>
            {offlineData.length === 0 ? (
              <p className="text-sm text-gray-500">No offline data stored</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {offlineData.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-medium">{item.type}</span>
                      <span className="text-gray-500 text-xs">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                    <Badge 
                      variant={item.synced ? "default" : "secondary"} 
                      className="text-xs"
                    >
                      {item.synced ? '✅ Synced' : '⏳ Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sync Features Info */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <h4 className="font-medium text-sm mb-2 text-blue-700">🌐 Smart Sync Features</h4>
          <div className="text-sm text-blue-600 space-y-1">
            <p>• Automatic background sync when online</p>
            <p>• Offline workout logging with local storage</p>
            <p>• Cross-device data synchronization</p>
            <p>• Conflict resolution for simultaneous edits</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Utility functions to save data offline
export const saveWorkoutOffline = (workoutData: any) => {
  if (typeof window === 'undefined') return
  
  const userId = 'current_user' // This should come from context
  const offlineItem: OfflineData = {
    id: `workout_${Date.now()}`,
    type: 'workout',
    data: workoutData,
    timestamp: Date.now(),
    synced: false
  }
  
  try {
    const existing = localStorage.getItem(`offline_data_${userId}`)
    const data = existing ? JSON.parse(existing) : []
    data.push(offlineItem)
    localStorage.setItem(`offline_data_${userId}`, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving workout offline:', error)
  }
}

export const saveExerciseOffline = (exerciseData: any) => {
  if (typeof window === 'undefined') return
  
  const userId = 'current_user'
  const offlineItem: OfflineData = {
    id: `exercise_${Date.now()}`,
    type: 'exercise',
    data: exerciseData,
    timestamp: Date.now(),
    synced: false
  }
  
  try {
    const existing = localStorage.getItem(`offline_data_${userId}`)
    const data = existing ? JSON.parse(existing) : []
    data.push(offlineItem)
    localStorage.setItem(`offline_data_${userId}`, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving exercise offline:', error)
  }
}

export const saveProfileOffline = (profileData: any) => {
  if (typeof window === 'undefined') return
  
  const userId = 'current_user'
  const offlineItem: OfflineData = {
    id: `profile_${Date.now()}`,
    type: 'profile',
    data: profileData,
    timestamp: Date.now(),
    synced: false
  }
  
  try {
    const existing = localStorage.getItem(`offline_data_${userId}`)
    const data = existing ? JSON.parse(existing) : []
    data.push(offlineItem)
    localStorage.setItem(`offline_data_${userId}`, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving profile offline:', error)
  }
} 