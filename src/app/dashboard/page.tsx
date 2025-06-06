'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from '@/contexts/AccountContext'
import WorkoutHeatmap from '@/components/CalendarHeatmap'
import ChartProgress from '@/components/ChartProgress'
import GradientMenu from '@/components/GradientMenu'
import AccountSwitcher from '@/components/AccountSwitcher'

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-4">
              <AccountSwitcher />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  PPL Tracker Dashboard
                </h1>
                <p className="text-gray-600">
                  Welcome back, {currentProfile?.name || currentUser.email}
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <GradientMenu />
            </div>
          </div>
        </div>

        {/* Visual Tracking Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workout Heatmap */}
          <div className="bg-white rounded-lg shadow">
            <WorkoutHeatmap userId={currentUser.id} />
          </div>

          {/* Progress Chart */}
          <div className="bg-white rounded-lg shadow">
            <ChartProgress userId={currentUser.id} />
          </div>
        </div>
      </div>
    </div>
  )
} 