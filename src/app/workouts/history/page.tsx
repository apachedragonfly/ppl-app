'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface WorkoutHistoryItem {
  id: string
  date: string
  type: 'Push' | 'Pull' | 'Legs'
  exercises_count: number
  total_sets: number
}

export default function WorkoutHistoryPage() {
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      fetchWorkouts()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const fetchWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          date,
          type,
          workout_logs (
            id,
            sets
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error

      const workoutHistory: WorkoutHistoryItem[] = (data || []).map((workout: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        id: workout.id,
        date: workout.date,
        type: workout.type,
        exercises_count: workout.workout_logs.length,
        total_sets: workout.workout_logs.reduce((total: number, log: any) => total + log.sets, 0) // eslint-disable-line @typescript-eslint/no-explicit-any
      }))

      setWorkouts(workoutHistory)
    } catch (error) {
      console.error('Error fetching workouts:', error)
    }
  }

  const handleEditWorkout = (workoutId: string) => {
    router.push(`/workouts/edit/${workoutId}`)
  }

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return

    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)

      if (error) throw error

      // Refresh the list
      fetchWorkouts()
    } catch (error) {
      console.error('Error deleting workout:', error)
      alert('Failed to delete workout')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Push': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'Pull': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'Legs': return 'bg-green-500/20 text-green-300 border-green-500/30'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const filteredWorkouts = selectedType === 'all' 
    ? workouts 
    : workouts.filter(w => w.type === selectedType)

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
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 px-3 py-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors self-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Workout History</h1>
          </div>
          <button
            onClick={() => router.push('/workouts/new')}
            className="w-full sm:w-auto px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base"
          >
            Log New Workout
          </button>
        </div>

        <div className="mb-4 sm:mb-6">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
          >
            <option value="all">All Workouts</option>
            <option value="Push">Push</option>
            <option value="Pull">Pull</option>
            <option value="Legs">Legs</option>
          </select>
        </div>

        {filteredWorkouts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg mb-4">No workouts found</div>
            <p className="text-muted-foreground/70">Start logging your workouts to see them here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkouts.map((workout) => (
              <div key={workout.id} className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-start">
                  <div className="flex-1">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-card-foreground">
                        {new Date(workout.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border self-start ${getTypeColor(workout.type)}`}>
                        {workout.type}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{workout.exercises_count} exercise{workout.exercises_count !== 1 ? 's' : ''}</p>
                      <p>{workout.total_sets} total sets</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleEditWorkout(workout.id)}
                      className="flex-1 sm:flex-none px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteWorkout(workout.id)}
                      className="flex-1 sm:flex-none px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 