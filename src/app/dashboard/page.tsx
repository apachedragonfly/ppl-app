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
import ExerciseInfoCard from '@/components/ExerciseInfoCard'
import { mockExerciseData } from '@/data/mockExerciseData'

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
      <div className="min-h-screen bg-background py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Header */}
          <div className="bg-card rounded-lg shadow-lg p-4 sm:p-5 lg:p-6 mb-4 sm:mb-5 lg:mb-6 border border-border">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex justify-center sm:justify-start">
                  <AccountSwitcher />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-xl lg:text-2xl font-bold text-foreground mb-1 sm:mb-2">
                    PPL Tracker Dashboard
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Welcome back, {currentProfile?.name || currentUser.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-4">
                <ThemeToggle />
                <GradientMenu />
              </div>
            </div>
          </div>

          {/* Next Workout Banner */}
          <NextWorkoutBanner userId={currentUser.id} />

          {/* Visual Tracking Components */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
            {/* Workout Heatmap - Wider */}
            <div className="lg:col-span-3 bg-card rounded-lg shadow-lg border border-border order-1">
              <WorkoutHeatmap userId={currentUser.id} />
            </div>

            {/* Progress Chart - Narrower */}
            <div className="lg:col-span-2 bg-card rounded-lg shadow-lg border border-border order-2">
              <ChartProgress userId={currentUser.id} />
            </div>
          </div>

          {/* TEST: ExerciseInfoCard - Remove when tasks complete */}
          <div className="mt-6 space-y-4">
            <ExerciseInfoCard
              exerciseName={mockExerciseData[0].name}
              video={mockExerciseData[0].video}
              description={mockExerciseData[0].description}
              musclesWorked={mockExerciseData[0].musclesWorked}
            />
            
            {/* Test with missing fields */}
            <ExerciseInfoCard
              exerciseName="Test Exercise (No Data)"
              // No video, description, or musclesWorked
            />
          </div>
        </div>
      </div>
    )
} 