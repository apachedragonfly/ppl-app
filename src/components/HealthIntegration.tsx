'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from '@/components/ui/badge'

interface HealthData {
  steps: number
  heartRate: number
  caloriesBurned: number
  activeMinutes: number
  lastSync: number
}

interface HealthIntegrationProps {
  userId: string
}

export default function HealthIntegration({ userId }: HealthIntegrationProps) {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      checkHealthIntegration()
    }
  }, [userId, mounted])

  const checkHealthIntegration = () => {
    if (!mounted) return
    
    // Check if we're on iOS and HealthKit is available
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    
    setIsConnected(false) // Start disconnected for demo
  }

  const loadMockHealthData = () => {
    setHealthData({
      steps: 8432,
      heartRate: 72,
      caloriesBurned: 345,
      activeMinutes: 45,
      lastSync: Date.now() - 300000 // 5 minutes ago
    })
  }

  const connectToAppleHealth = async () => {
    if (!mounted) return
    
    setLoading(true)
    setError('')

    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      
      if (!isIOS) {
        throw new Error('Apple Health is only available on iOS devices')
      }

      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIsConnected(true)
      loadMockHealthData()
      
    } catch (err: any) {
      setError('Failed to connect to Apple Health. Please try again.')
      console.error('Apple Health connection error:', err)
    } finally {
      setLoading(false)
    }
  }

  const connectToGoogleFit = async () => {
    if (!mounted) return
    
    setLoading(true)
    setError('')

    try {
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIsConnected(true)
      loadMockHealthData()
      
    } catch (err: any) {
      setError('Failed to connect to Google Fit. Please try again.')
      console.error('Google Fit connection error:', err)
    } finally {
      setLoading(false)
    }
  }

  const syncHealthData = async () => {
    if (!isConnected) return

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setHealthData(prev => prev ? {
        ...prev,
        steps: prev.steps + Math.floor(Math.random() * 100),
        caloriesBurned: prev.caloriesBurned + Math.floor(Math.random() * 20),
        lastSync: Date.now()
      } : null)
      
    } catch (err) {
      setError('Failed to sync health data')
    } finally {
      setLoading(false)
    }
  }

  const disconnect = () => {
    setIsConnected(false)
    setHealthData(null)
  }

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return `${Math.floor(diff / 3600000)}h ago`
  }

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            ❤️ Health Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading health integration...</div>
        </CardContent>
      </Card>
    )
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          ❤️ Health Integration
        </CardTitle>
        <p className="text-sm text-gray-600">
          Connect with Apple Health or Google Fit to track comprehensive fitness data
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!isConnected ? (
          <div className="space-y-3">
            {/* Connection Options */}
            <div className="grid gap-2">
              {isIOS && (
                <Button 
                  onClick={connectToAppleHealth}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  🍎 Connect to Apple Health
                  {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                </Button>
              )}
              <Button 
                onClick={connectToGoogleFit}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                🏃‍♂️ Connect to Google Fit
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
              </Button>
            </div>

            {/* Benefits */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-sm mb-2">🎯 What you'll get:</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Daily step count and active minutes</li>
                <li>• Heart rate data during workouts</li>
                <li>• Calories burned tracking</li>
                <li>• Recovery insights based on sleep data</li>
                <li>• Comprehensive fitness dashboard</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">
                  Connected to {isIOS ? 'Apple Health' : 'Google Fit'}
                </span>
              </div>
              <Button 
                onClick={disconnect}
                variant="ghost"
                size="sm"
                className="text-red-600"
              >
                Disconnect
              </Button>
            </div>

            {/* Health Data Dashboard */}
            {healthData && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">📊 Today's Health Data</h4>
                  <Button 
                    onClick={syncHealthData}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    {loading ? '⏳' : '🔄'} Sync
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{healthData.steps.toLocaleString()}</div>
                    <div className="text-sm text-blue-700">Steps</div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{healthData.heartRate}</div>
                    <div className="text-sm text-red-700">BPM</div>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{healthData.caloriesBurned}</div>
                    <div className="text-sm text-orange-700">Calories</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{healthData.activeMinutes}</div>
                    <div className="text-sm text-green-700">Active Min</div>
                  </div>
                </div>

                <div className="text-center text-xs text-gray-500">
                  Last synced: {formatTime(healthData.lastSync)}
                </div>
              </div>
            )}

            {/* Insights Preview */}
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium text-sm mb-2 text-purple-700">🧠 Health Insights</h4>
              <div className="text-sm text-purple-600 space-y-1">
                <p>• Your heart rate recovery is improving! 📈</p>
                <p>• Consider a rest day - your HRV is lower today 😴</p>
                <p>• Great job hitting 10k+ steps 3 days in a row! 🎉</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 