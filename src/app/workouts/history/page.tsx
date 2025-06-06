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
        router.push('/auth/login')
        return
      }
      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth/login')
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
      case 'Push': return 'bg-red-100 text-red-800'
      case 'Pull': return 'bg-blue-100 text-blue-800'
      case 'Legs': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredWorkouts = selectedType === 'all' 
    ? workouts 
    : workouts.filter(w => w.type === selectedType)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Workout History</h1>
          <button
            onClick={() => router.push('/workouts/new')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Log New Workout
          </button>
        </div>

        <div className="mb-6">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Workouts</option>
            <option value="Push">Push</option>
            <option value="Pull">Pull</option>
            <option value="Legs">Legs</option>
          </select>
        </div>

        {filteredWorkouts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No workouts found</div>
            <p className="text-gray-400">Start logging your workouts to see them here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkouts.map((workout) => (
              <div key={workout.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {new Date(workout.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(workout.type)}`}>
                        {workout.type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{workout.exercises_count} exercise{workout.exercises_count !== 1 ? 's' : ''}</p>
                      <p>{workout.total_sets} total sets</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditWorkout(workout.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteWorkout(workout.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
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