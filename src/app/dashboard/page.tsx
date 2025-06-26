'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from '@/contexts/AccountContext'
import WorkoutHeatmap from '@/components/CalendarHeatmap'
import ChartProgress from '@/components/ChartProgress'
import GradientMenu from '@/components/GradientMenu'
import AccountSwitcher from '@/components/AccountSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import NextWorkoutBanner from '@/components/NextWorkoutBanner'
import OfflineSync from '@/components/OfflineSync'
import SmartNotifications from '@/components/SmartNotifications'
import HealthIntegration from '@/components/HealthIntegration'
import MobileTestingUtils from '@/components/MobileTestingUtils'
// import SimpleDebugger from '@/components/SimpleDebugger' // Commented out for now

export default function Dashboard() {
  const { currentUser, currentProfile, isLoading } = useAccount()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/login')
    }
  }, [currentUser, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header Skeleton */}
          <div className="bg-card rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-border animate-pulse">
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center">
              <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
                <div className="flex justify-center md:justify-start">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                </div>
                <div className="text-center md:text-left">
                  <div className="h-8 bg-muted rounded w-48 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-64"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Skeletons */}
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
              {/* Heatmap Skeleton */}
              <div className="xl:col-span-3 bg-card rounded-lg shadow-lg border border-border p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => (
                    <div key={i} className="w-full aspect-square bg-muted rounded-sm"></div>
                  ))}
                </div>
              </div>

              {/* Chart Skeleton */}
              <div className="xl:col-span-2 bg-card rounded-lg shadow-lg border border-border p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-2/3 mb-4"></div>
                <div className="flex items-end space-x-2 h-40">
                  {[65, 80, 45, 90, 55].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-muted rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Mobile-First Header */}
        <div className="bg-card rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-border">
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center">
            {/* Main header content */}
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
              <div className="flex justify-center md:justify-start">
                <AccountSwitcher />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  PPL Tracker
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Welcome back, {currentProfile?.name || currentUser.email}
                </p>
              </div>
            </div>

            {/* Desktop-only controls (hidden on mobile due to mobile nav) */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <GradientMenu />
            </div>
          </div>
        </div>

        {/* Next Workout Banner */}
        <NextWorkoutBanner userId={currentUser.id} />

        {/* Debug Component - COMMENTED OUT - Uncomment if needed for debugging date issues */}
        {/* <div className="mb-6">
          <SimpleDebugger userId={currentUser.id} />
        </div> */}

        {/* Mobile-Optimized Layout */}
        <div className="space-y-4 sm:space-y-6">
          {/* Mobile: Stack vertically, Desktop: Grid layout */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
            {/* Workout Heatmap - Full width on mobile, wider on desktop */}
            <div className="xl:col-span-3 bg-card rounded-lg shadow-lg border border-border">
              <WorkoutHeatmap userId={currentUser.id} />
            </div>

            {/* Progress Chart - Full width on mobile, narrower on desktop */}
            <div className="xl:col-span-2 bg-card rounded-lg shadow-lg border border-border">
              <ChartProgress userId={currentUser.id} />
            </div>
          </div>

          {/* Mobile Quick Actions */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            <button
              onClick={() => window.location.href = '/workouts/new'}
              className="flex flex-col items-center justify-center p-6 bg-primary text-primary-foreground rounded-lg shadow-lg"
            >
              <span className="text-2xl mb-2">💪</span>
              <span className="font-semibold">Start Workout</span>
            </button>

            <button
              onClick={() => window.location.href = '/analytics'}
              className="flex flex-col items-center justify-center p-6 bg-secondary text-secondary-foreground rounded-lg shadow-lg"
            >
              <span className="text-2xl mb-2">📊</span>
              <span className="font-semibold">View Stats</span>
            </button>
          </div>

          {/* Phase 4: Advanced Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Smart Notifications */}
            <div className="bg-card rounded-lg shadow-lg border border-border">
              <SmartNotifications userId={currentUser.id} />
            </div>

            {/* Offline Sync Status */}
            <div className="bg-card rounded-lg shadow-lg border border-border">
              <OfflineSync userId={currentUser.id} />
            </div>
          </div>

          {/* Health Integration */}
          <div className="bg-card rounded-lg shadow-lg border border-border">
            <HealthIntegration userId={currentUser.id} />
          </div>

          {/* Development Testing - Only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-card rounded-lg shadow-lg border border-border">
              <MobileTestingUtils />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 