'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import WorkoutForm from '@/components/WorkoutForm'
import WorkoutCard from '@/components/WorkoutCard'
import { Workout, WorkoutLog } from '@/types'

type WorkoutWithLogs = Workout & {
  workout_logs: (WorkoutLog & {
    exercise: {
      name: string
    }
  })[]
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<WorkoutWithLogs[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadWorkouts()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }

  const loadWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_logs (
            *,
            exercise:exercises (
              name
            )
          )
        `)
        .order('date', { ascending: false })
        .limit(10)

      if (error) throw error
      setWorkouts(data || [])
    } catch (error) {
      console.error('Error loading workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWorkoutSaved = () => {
    loadWorkouts()
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
          <button
            onClick={handleBack}
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>

        <WorkoutForm onWorkoutSaved={handleWorkoutSaved} />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Workouts</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">Loading workouts...</div>
            </div>
          ) : workouts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-600">No workouts logged yet</div>
              <div className="text-sm text-gray-500 mt-1">Log your first workout above!</div>
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 