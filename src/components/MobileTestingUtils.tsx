'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from '@/components/ui/badge'

type TestResult = {
  name: string
  status: 'pass' | 'fail' | 'pending'
  details: string
}

export default function MobileTestingUtils() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      runMobileTests()
    }
  }, [mounted])

  const runMobileTests = async () => {
    if (!mounted) return
    
    setIsRunning(true)
    const results: TestResult[] = []

    // Test 1: Touch Detection
    results.push({
      name: 'Touch Support',
      status: 'ontouchstart' in window ? 'pass' : 'fail',
      details: 'ontouchstart' in window ? 'Touch events supported' : 'Touch not detected'
    })

    // Test 2: PWA Features
    results.push({
      name: 'PWA Manifest',
      status: document.querySelector('link[rel="manifest"]') ? 'pass' : 'fail',
      details: document.querySelector('link[rel="manifest"]') ? 'Manifest linked' : 'No manifest found'
    })

    // Test 3: Service Worker
    results.push({
      name: 'Service Worker',
      status: 'serviceWorker' in navigator ? 'pass' : 'fail',
      details: 'serviceWorker' in navigator ? 'Service Worker API available' : 'Service Worker not supported'
    })

    // Test 4: Notification API
    results.push({
      name: 'Notifications',
      status: 'Notification' in window ? 'pass' : 'fail',
      details: 'Notification' in window ? 'Notification API available' : 'Notifications not supported'
    })

    // Test 5: Offline Detection
    results.push({
      name: 'Network Status',
      status: 'onLine' in navigator ? 'pass' : 'fail',
      details: navigator.onLine ? 'Currently online' : 'Currently offline'
    })

    // Test 6: Local Storage
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      results.push({
        name: 'Local Storage',
        status: 'pass',
        details: 'Local storage working'
      })
    } catch {
      results.push({
        name: 'Local Storage',
        status: 'fail',
        details: 'Local storage not available'
      })
    }

    // Test 7: Device Type Detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    results.push({
      name: 'Mobile Detection',
      status: isMobile ? 'pass' : 'pending',
      details: isMobile ? 'Mobile device detected' : 'Desktop device'
    })

    // Test 8: Viewport Meta Tag
    const viewport = document.querySelector('meta[name="viewport"]')
    results.push({
      name: 'Mobile Viewport',
      status: viewport ? 'pass' : 'fail',
      details: viewport ? 'Viewport meta tag present' : 'No viewport meta tag'
    })

    setTestResults(results)
    setIsRunning(false)
  }

  const testPushNotifications = async () => {
    if (!mounted || !('Notification' in window)) {
      alert('Notifications not supported')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      new Notification('PPL Tracker Test', {
        body: 'Push notifications working! 🎉',
        icon: '/icon-192x192.png'
      })
    }
  }

  const testOfflineMode = () => {
    if (!mounted) return
    
    if ('serviceWorker' in navigator) {
      alert('Try disconnecting your internet and using the app!')
    } else {
      alert('Service worker not supported in this browser')
    }
  }

  const testInstallPrompt = () => {
    alert('On mobile Chrome, look for "Add to Home Screen" in the browser menu')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-500'
      case 'fail': return 'bg-red-500'
      case 'pending': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅'
      case 'fail': return '❌'
      case 'pending': return '⏳'
      default: return '🔍'
    }
  }

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-center">
            🔧 Mobile Testing Suite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading tests...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-center">
          🔧 Mobile Testing Suite
        </CardTitle>
        <p className="text-sm text-gray-600 text-center">
          Test mobile features and PWA capabilities
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Results */}
        <div className="space-y-2">
          {isRunning ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Running mobile tests...</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStatusIcon(result.status)}</span>
                    <span className="font-medium">{result.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{result.details}</span>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(result.status)}`}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={testPushNotifications}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            🔔 Test Notifications
          </Button>
          <Button 
            onClick={testOfflineMode}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            📶 Test Offline
          </Button>
          <Button 
            onClick={testInstallPrompt}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            📱 Test Install
          </Button>
          <Button 
            onClick={() => mounted && runMobileTests()}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            🔄 Re-run Tests
          </Button>
        </div>

        {/* Summary */}
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {testResults.filter(r => r.status === 'pass').length} of {testResults.length} tests passing
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 