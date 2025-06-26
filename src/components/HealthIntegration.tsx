// HEALTH INTEGRATION COMPONENT - CURRENTLY DISABLED
// This component was showing demo/mock data for Apple Health and Google Fit integration.
// Real integration requires native iOS app for HealthKit or complex OAuth setup for Google Fit.
// Keeping this code for potential future iOS app conversion.

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

interface HealthData {
  heartRate?: number
  steps?: number
  calories?: number
  activeMinutes?: number
  sleep?: {
    duration: number
    quality: 'poor' | 'fair' | 'good' | 'excellent'
  }
  weight?: number
  bodyFat?: number
}

interface HealthIntegrationProps {
  userId: string
}

export default function HealthIntegration({ userId }: HealthIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [platform, setPlatform] = useState<'apple' | 'google' | null>(null)
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [permissions, setPermissions] = useState({
    heartRate: false,
    steps: false,
    calories: false,
    sleep: false,
    weight: false,
    workouts: false
  })

  useEffect(() => {
    checkHealthIntegration()
    detectPlatform()
  }, [])

  const detectPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('mac')) {
      setPlatform('apple')
    } else if (userAgent.includes('android')) {
      setPlatform('google')
    }
  }

  const checkHealthIntegration = async () => {
    try {
      const { data } = await supabase
        .from('health_integrations')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (data) {
        setIsConnected(true)
        setLastSync(new Date(data.last_sync))
        setPermissions(data.permissions || {})
        loadHealthData()
      }
    } catch (error) {
      console.error('Error checking health integration:', error)
    }
  }

  const connectHealthApp = async () => {
    setSyncStatus('syncing')
    
    try {
      if (platform === 'apple' && 'webkit' in window) {
        // Apple HealthKit integration
        await requestAppleHealthPermissions()
      } else if (platform === 'google') {
        // Google Fit integration
        await requestGoogleFitPermissions()
      } else {
        // Fallback for web demo
        await simulateHealthConnection()
      }
      
      setIsConnected(true)
      setSyncStatus('success')
      setLastSync(new Date())
      
      // Store integration in database
      await supabase
        .from('health_integrations')
        .upsert({
          user_id: userId,
          platform: platform || 'web',
          connected_at: new Date().toISOString(),
          last_sync: new Date().toISOString(),
          permissions: permissions
        })
        
    } catch (error) {
      console.error('Error connecting health app:', error)
      setSyncStatus('error')
    }
  }

  const requestAppleHealthPermissions = async () => {
    // Apple HealthKit integration would go here
    // For now, simulate the connection
    return new Promise((resolve) => {
      setTimeout(() => {
        setPermissions({
          heartRate: true,
          steps: true,
          calories: true,
          sleep: true,
          weight: true,
          workouts: true
        })
        resolve(true)
      }, 2000)
    })
  }

  const requestGoogleFitPermissions = async () => {
    // Google Fit API integration would go here
    // For now, simulate the connection
    return new Promise((resolve) => {
      setTimeout(() => {
        setPermissions({
          heartRate: true,
          steps: true,
          calories: true,
          sleep: false, // Google Fit has limited sleep data
          weight: true,
          workouts: true
        })
        resolve(true)
      }, 2000)
    })
  }

  const simulateHealthConnection = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setPermissions({
          heartRate: true,
          steps: true,
          calories: true,
          sleep: true,
          weight: true,
          workouts: true
        })
        resolve(true)
      }, 1000)
    })
  }

  const loadHealthData = async () => {
    try {
      // Use seed based on user ID for consistent data
      const seed = userId ? parseInt(userId.slice(-4), 16) : 1234
      const seededRandom = (multiplier: number = 1) => {
        return ((seed * 9301 + 49297) % 233280) / 233280 * multiplier
      }
      
      // Simulate loading health data with consistent values
      const mockData: HealthData = {
        heartRate: 72 + Math.floor(seededRandom(20)),
        steps: 8500 + Math.floor(seededRandom(3000)),
        calories: 2200 + Math.floor(seededRandom(500)),
        activeMinutes: 45 + Math.floor(seededRandom(30)),
        sleep: {
          duration: 7.5 + seededRandom(1.5),
          quality: ['poor', 'fair', 'good', 'excellent'][Math.floor(seededRandom(4))] as any
        },
        weight: 70 + seededRandom(20),
        bodyFat: 12 + seededRandom(8)
      }
      
      setHealthData(mockData)
    } catch (error) {
      console.error('Error loading health data:', error)
    }
  }

  const syncHealthData = async () => {
    setSyncStatus('syncing')
    
    try {
      await loadHealthData()
      
      // Update last sync time
      await supabase
        .from('health_integrations')
        .update({ last_sync: new Date().toISOString() })
        .eq('user_id', userId)
      
      setLastSync(new Date())
      setSyncStatus('success')
      
      // Auto-hide success status after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000)
    } catch (error) {
      console.error('Error syncing health data:', error)
      setSyncStatus('error')
    }
  }

  const exportWorkoutData = async () => {
    try {
      // Get user's workout data
      const { data: workouts } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            exercises (name, muscle_group)
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30)

      if (!workouts) return

      // Format for health app export
      const healthExportData = workouts.map(workout => ({
        date: workout.date,
        duration: workout.duration || 60, // Default 60 minutes if not tracked
        calories: estimateCaloriesBurned(workout),
        exercises: workout.workout_exercises?.length || 0,
        volume: calculateWorkoutVolume(workout)
      }))

      // Export to health app (simulated)
      console.log('Exporting to health app:', healthExportData)
      
      alert(`✅ Exported ${workouts.length} workouts to ${platform === 'apple' ? 'Apple Health' : 'Google Fit'}`)
    } catch (error) {
      console.error('Error exporting workout data:', error)
      alert('❌ Failed to export workout data')
    }
  }

  const estimateCaloriesBurned = (workout: any) => {
    // Simple estimation based on workout duration and exercises
    const baseCalories = 300 // Base calories for 60 minutes
    const exerciseCount = workout.workout_exercises?.length || 0
    return Math.round(baseCalories + (exerciseCount * 15))
  }

  const calculateWorkoutVolume = (workout: any) => {
    if (!workout.workout_exercises) return 0
    
    return workout.workout_exercises.reduce((total: number, exercise: any) => {
      return total + (exercise.weight || 0) * (exercise.reps || 0) * (exercise.sets || 0)
    }, 0)
  }

  const disconnectHealthApp = async () => {
    try {
      await supabase
        .from('health_integrations')
        .delete()
        .eq('user_id', userId)
      
      setIsConnected(false)
      setHealthData(null)
      setPlatform(null)
      setPermissions({
        heartRate: false,
        steps: false,
        calories: false,
        sleep: false,
        weight: false,
        workouts: false
      })
    } catch (error) {
      console.error('Error disconnecting health app:', error)
    }
  }

  const getPlatformName = () => {
    switch (platform) {
      case 'apple': return 'Apple Health'
      case 'google': return 'Google Fit'
      default: return 'Health App'
    }
  }

  const getPlatformIcon = () => {
    switch (platform) {
      case 'apple': return '🍎'
      case 'google': return '🎯'
      default: return '💊'
    }
  }

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
        {syncStatus === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">Error: {syncStatus}</p>
          </div>
        )}

        {!isConnected ? (
          <div className="space-y-3">
            {/* Connection Options */}
            <div className="grid gap-2">
              {platform === 'apple' && (
                <Button 
                  onClick={connectHealthApp}
                  disabled={syncStatus === 'syncing'}
                  className="flex items-center gap-2"
                >
                  🍎 Connect to Apple Health
                  {syncStatus === 'syncing' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                </Button>
              )}
              {platform === 'google' && (
                <Button 
                  onClick={connectHealthApp}
                  disabled={syncStatus === 'syncing'}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  🏃‍♂️ Connect to Google Fit
                  {syncStatus === 'syncing' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
                </Button>
              )}
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
                  Connected to {getPlatformName()}
                </span>
              </div>
              <Button 
                onClick={disconnectHealthApp}
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
                    disabled={syncStatus === 'syncing'}
                    variant="outline"
                    size="sm"
                  >
                    {syncStatus === 'syncing' ? '⏳' : '🔄'} Sync
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {permissions.heartRate && healthData.heartRate && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{healthData.heartRate}</div>
                      <div className="text-sm text-blue-700">BPM</div>
                    </div>
                  )}
                  {permissions.steps && healthData.steps && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{healthData.steps.toLocaleString()}</div>
                      <div className="text-sm text-red-700">Steps</div>
                    </div>
                  )}
                  {permissions.calories && healthData.calories && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{healthData.calories}</div>
                      <div className="text-sm text-orange-700">Calories</div>
                    </div>
                  )}
                  {permissions.weight && healthData.weight && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{healthData.weight.toFixed(1)}</div>
                      <div className="text-sm text-green-700">kg</div>
                    </div>
                  )}
                </div>

                <div className="text-center text-xs text-gray-500">
                  Last synced: {lastSync?.toLocaleString()}
                </div>
              </div>
            )}

            {/* Sync Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={syncHealthData}
                disabled={syncStatus === 'syncing'}
                variant="outline"
                className="flex-1"
              >
                {syncStatus === 'syncing' ? '🔄 Syncing...' : '🔄 Sync Now'}
              </Button>
              
              <Button 
                onClick={exportWorkoutData}
                variant="outline"
                className="flex-1"
              >
                📤 Export Workouts
              </Button>
            </div>

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