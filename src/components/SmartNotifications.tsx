'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AppNotification {
  id: string
  type: 'reminder' | 'achievement' | 'milestone' | 'motivation'
  title: string
  message: string
  timestamp: number
  read: boolean
  icon: string
}

interface NotificationSettings {
  workoutReminders: boolean
  achievements: boolean
  milestones: boolean
  dailyMotivation: boolean
}

export default function SmartNotifications({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({
    workoutReminders: true,
    achievements: true,
    milestones: true,
    dailyMotivation: false
  })
  const [pushEnabled, setPushEnabled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    loadNotifications()
    loadSettings()
    checkPushPermission()
    generateSmartNotifications()
  }, [mounted, userId])

  const loadNotifications = () => {
    if (!mounted) return
    
    try {
      const stored = localStorage.getItem(`notifications_${userId}`)
      if (stored) {
        const data = JSON.parse(stored)
        setNotifications(data.sort((a: AppNotification, b: AppNotification) => b.timestamp - a.timestamp))
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const loadSettings = () => {
    if (!mounted) return
    
    try {
      const stored = localStorage.getItem(`notification_settings_${userId}`)
      if (stored) {
        setSettings(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveSettings = (newSettings: NotificationSettings) => {
    if (!mounted) return
    
    try {
      localStorage.setItem(`notification_settings_${userId}`, JSON.stringify(newSettings))
      setSettings(newSettings)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const saveNotifications = (newNotifications: AppNotification[]) => {
    if (!mounted) return
    
    try {
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(newNotifications))
      setNotifications(newNotifications)
    } catch (error) {
      console.error('Error saving notifications:', error)
    }
  }

  const checkPushPermission = () => {
    if (!mounted || !('Notification' in window)) return
    
    setPushEnabled(Notification.permission === 'granted')
  }

  const requestPushPermission = async () => {
    if (!mounted || !('Notification' in window)) {
      alert('Push notifications are not supported in this browser')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPushEnabled(permission === 'granted')
      
      if (permission === 'granted') {
        new Notification('PPL Tracker', {
          body: 'Smart notifications enabled! You\'ll receive workout reminders and achievements.',
          icon: '/icon.svg'
        })
      }
    } catch (error) {
      console.error('Error requesting push permission:', error)
    }
  }

  const generateSmartNotifications = async () => {
    if (!mounted) return
    
    try {
      const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('workout_date', { ascending: false })
        .limit(10)

      if (!workouts) return

      const newNotifications: AppNotification[] = []
      const now = Date.now()

      // Check for workout reminders
      if (settings.workoutReminders) {
        const lastWorkout = workouts[0]
        const daysSinceLastWorkout = lastWorkout 
          ? Math.floor((now - new Date(lastWorkout.workout_date).getTime()) / (1000 * 60 * 60 * 24))
          : 7

        if (daysSinceLastWorkout >= 2) {
          newNotifications.push({
            id: `reminder_${now}`,
            type: 'reminder',
            title: '💪 Time to Train!',
            message: `It's been ${daysSinceLastWorkout} days since your last workout. Ready to crush it?`,
            timestamp: now,
            read: false,
            icon: '💪'
          })
        }
      }

      // Check for milestones
      if (settings.milestones) {
        const totalWorkouts = workouts.length
        const milestones = [5, 10, 25, 50, 100]
        
        if (milestones.includes(totalWorkouts)) {
          newNotifications.push({
            id: `milestone_${now}`,
            type: 'milestone',
            title: '🏆 Milestone Achieved!',
            message: `Amazing! You've completed ${totalWorkouts} workouts. Keep up the great work!`,
            timestamp: now,
            read: false,
            icon: '🏆'
          })
        }
      }

      // Daily motivation
      if (settings.dailyMotivation) {
        const motivationalMessages = [
          'Every rep counts towards your goals! 💪',
          'Consistency beats perfection every time! 🔥',
          'Your future self will thank you for today\'s effort! ⭐'
        ]
        
        // Use date as seed for consistent daily message
        const today = new Date().toDateString()
        const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const messageIndex = seed % motivationalMessages.length
        const randomMessage = motivationalMessages[messageIndex]
        
        newNotifications.push({
          id: `motivation_${Date.now()}`,
          type: 'motivation',
          title: '✨ Daily Motivation',
          message: randomMessage,
          timestamp: now,
          read: false,
          icon: '✨'
        })
      }

      // Only add truly new notifications (avoid duplicates)
      const existingIds = new Set(notifications.map(n => n.id))
      const uniqueNewNotifications = newNotifications.filter(n => !existingIds.has(n.id))
      
      if (uniqueNewNotifications.length > 0) {
        const updatedNotifications = [...uniqueNewNotifications, ...notifications].slice(0, 20)
        saveNotifications(updatedNotifications)
        
        // Send push notifications if enabled
        if (pushEnabled) {
          uniqueNewNotifications.forEach(notification => {
            sendPushNotification(notification)
          })
        }
      }
    } catch (error) {
      console.error('Error generating notifications:', error)
    }
  }

  const sendPushNotification = (notification: AppNotification) => {
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon.svg'
      })
    }
  }

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    )
    saveNotifications(updated)
  }

  const clearAllNotifications = () => {
    saveNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder': return '💪'
      case 'achievement': return '🎉'
      case 'milestone': return '🏆'
      case 'motivation': return '✨'
      default: return '🔔'
    }
  }

  const formatTime = (timestamp: number) => {
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
            🔔 Smart Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading notifications...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            🔔 Smart Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </CardTitle>
          <span className={`text-sm text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Stay motivated with intelligent workout reminders and achievements
        </p>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Push Notification Setup */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">📱</span>
              <span className="text-sm font-medium text-blue-700">
                Push Notifications {pushEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {!pushEnabled && (
              <Button 
                onClick={requestPushPermission}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Enable
              </Button>
            )}
          </div>

          {/* Notification Settings */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">⚙️ Notification Settings</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(settings).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => saveSettings({
                      ...settings,
                      [key]: e.target.checked
                    })}
                    className="rounded"
                  />
                  <span className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">📬 Recent Notifications</h4>
              {notifications.length > 0 && (
                <Button 
                  onClick={clearAllNotifications}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500"
                >
                  Clear All
                </Button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs">Complete a workout to see smart suggestions!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-opacity ${
                      notification.read ? 'opacity-60' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <span className="font-medium text-sm">{notification.title}</span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm opacity-90">{notification.message}</p>
                      </div>
                      <span className="text-xs opacity-70 ml-2">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Smart Features Preview */}
          <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
            <h4 className="font-medium text-sm mb-2 text-purple-700">🧠 Smart Features</h4>
            <div className="text-sm text-purple-600 space-y-1">
              <p>• Adaptive workout reminders based on your schedule</p>
              <p>• Instant achievement notifications for new PRs</p>
              <p>• Milestone celebrations for consistency streaks</p>
              <p>• Personalized motivation based on your progress</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
} 