'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import WorkoutAnalytics from '@/components/WorkoutAnalytics'
import WorkoutInsights from '@/components/WorkoutInsights'
import DataVisualization from '@/components/DataVisualization'
import Reports from '@/components/Reports'
import MobileAnalytics from '@/components/MobileAnalytics'

export default function AnalyticsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'analytics' | 'insights' | 'visualization' | 'reports'>('analytics')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header with Dashboard Link */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Tab Navigation - Desktop Only */}
        <div className="border-b border-border mb-6 hidden md:block">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              📊 Analytics
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'insights'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              💡 Insights
            </button>
            <button
              onClick={() => setActiveTab('visualization')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'visualization'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              📈 Visualization
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              📋 Reports
            </button>
          </nav>
        </div>

        {/* Mobile-First Analytics */}
        <div className="md:hidden">
          <MobileAnalytics userId={user.id} />
        </div>

        {/* Desktop Tab Content */}
        <div className="hidden md:block">
        {activeTab === 'analytics' && <WorkoutAnalytics userId={user.id} />}
        {activeTab === 'insights' && <WorkoutInsights userId={user.id} />}
        {activeTab === 'visualization' && <DataVisualization userId={user.id} />}
        {activeTab === 'reports' && <Reports userId={user.id} />}
        </div>
      </div>
    </div>
  )
} 