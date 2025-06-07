'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from '@/contexts/AccountContext'
import WorkoutHeatmap from '@/components/CalendarHeatmap'
import ChartProgress from '@/components/ChartProgress'
import GradientMenu from '@/components/GradientMenu'
import AccountSwitcher from '@/components/AccountSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-lg p-6 mb-6 border border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-4">
              <AccountSwitcher />
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  PPL Tracker Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Welcome back, {currentProfile?.name || currentUser.email}
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-4">
              <ThemeToggle />
              <GradientMenu />
            </div>
          </div>
        </div>

        {/* Visual Tracking Components */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Workout Heatmap - Wider */}
          <div className="lg:col-span-3 bg-card rounded-lg shadow-lg border border-border">
            <WorkoutHeatmap userId={currentUser.id} />
          </div>

          {/* Progress Chart - Narrower */}
          <div className="lg:col-span-2 bg-card rounded-lg shadow-lg border border-border">
            <ChartProgress userId={currentUser.id} />
          </div>
        </div>
      </div>
    </div>
  )
} 