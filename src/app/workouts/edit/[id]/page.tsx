'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Exercise, WorkoutType } from '@/types'

interface WorkoutLog {
  id: string
  exercise_id: string
  exercise_name: string
  sets: number
  reps: number
  weight_kg: number
}

interface EditWorkout {
  id: string
  date: string
  type: WorkoutType
  workout_logs: WorkoutLog[]
}

export default function EditWorkoutPage() {
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [workout, setWorkout] = useState<EditWorkout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const params = useParams()
  const workoutId = params.id as string

  useEffect(() => {
    checkUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user && workoutId) {
      loadWorkout()
      loadExercises()
    }
  }, [user, workoutId]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const loadWorkout = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          date,
          type,
          workout_logs (
            id,
            exercise_id,
            sets,
            reps,
            weight_kg,
            exercise:exercises (
              name
            )
          )
        `)
        .eq('id', workoutId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      const workoutData: EditWorkout = {
        id: data.id,
        date: data.date,
        type: data.type,
        workout_logs: data.workout_logs.map((log: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          id: log.id,
          exercise_id: log.exercise_id,
          exercise_name: log.exercise?.name || 'Unknown Exercise',
          sets: log.sets,
          reps: log.reps,
          weight_kg: log.weight_kg
        }))
      }

      setWorkout(workoutData)
    } catch (error) {
      console.error('Error loading workout:', error)
      setError('Failed to load workout')
    }
  }

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name')

      if (error) throw error
      setExercises(data || [])
    } catch (error) {
      console.error('Error loading exercises:', error)
    }
  }

  const getFilteredExercises = () => {
    if (!workout) return []
    
    const typeMapping: Record<WorkoutType, string[]> = {
      'Push': ['Chest', 'Shoulders', 'Triceps'],
      'Pull': ['Back', 'Biceps'],
      'Legs': ['Legs']
    }
    
    const targetMuscles = typeMapping[workout.type] || []
    const filtered = exercises.filter(ex => 
      targetMuscles.includes(ex.muscle_group || '')
    )
    
    // Remove duplicates by name
    const unique = filtered.reduce((acc, current) => {
      const existing = acc.find(item => item.name === current.name)
      if (!existing) {
        acc.push(current)
      }
      return acc
    }, [] as typeof exercises)
    
    return unique.sort((a, b) => a.name.localeCompare(b.name))
  }

  const updateWorkoutLog = (index: number, field: keyof WorkoutLog, value: string | number) => {
    if (!workout) return

    const updated = [...workout.workout_logs]
    if (field === 'exercise_id') {
      const exercise = exercises.find(e => e.id === value)
      updated[index].exercise_id = value as string
      updated[index].exercise_name = exercise?.name || ''
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    
    setWorkout({ ...workout, workout_logs: updated })
  }

  const addExerciseLog = () => {
    if (!workout) return

    const filteredExercises = getFilteredExercises()
    const newLog: WorkoutLog = {
      id: `new-${Date.now()}`,
      exercise_id: filteredExercises[0]?.id || '',
      exercise_name: filteredExercises[0]?.name || '',
      sets: 3,
      reps: 10,
      weight_kg: 0
    }
    
    setWorkout({
      ...workout,
      workout_logs: [...workout.workout_logs, newLog]
    })
  }

  const removeExerciseLog = (index: number) => {
    if (!workout) return
    
    setWorkout({
      ...workout,
      workout_logs: workout.workout_logs.filter((_, i) => i !== index)
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workout || workout.workout_logs.length === 0) return

    setSaving(true)
    setError('')
    setMessage('')

    try {
      // Update workout basic info
      const { error: workoutError } = await supabase
        .from('workouts')
        .update({
          date: workout.date,
          type: workout.type
        })
        .eq('id', workout.id)

      if (workoutError) throw workoutError

      // Delete existing workout logs
      const { error: deleteError } = await supabase
        .from('workout_logs')
        .delete()
        .eq('workout_id', workout.id)

      if (deleteError) throw deleteError

      // Insert updated workout logs
      const logs = workout.workout_logs.map(log => ({
        workout_id: workout.id,
        exercise_id: log.exercise_id,
        sets: log.sets,
        reps: log.reps,
        weight_kg: log.weight_kg
      }))

      const { error: logsError } = await supabase
        .from('workout_logs')
        .insert(logs)

      if (logsError) throw logsError

      setMessage('Workout updated successfully!')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Error updating workout:', error)
      setError('Failed to update workout')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !workout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Workout not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 font-medium mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Workout</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={workout.date}
                  onChange={(e) => setWorkout({ ...workout, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={workout.type}
                  onChange={(e) => setWorkout({ ...workout, type: e.target.value as WorkoutType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="Push">Push</option>
                  <option value="Pull">Pull</option>
                  <option value="Legs">Legs</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Exercises</h3>
                <button
                  type="button"
                  onClick={addExerciseLog}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-1 px-3 rounded-md transition-colors"
                >
                  + Add Exercise
                </button>
              </div>

              {workout.workout_logs.map((log, index) => (
                <div key={log.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exercise
                      </label>
                      <select
                        value={log.exercise_id}
                        onChange={(e) => updateWorkoutLog(index, 'exercise_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        required
                      >
                        <option value="">Select exercise...</option>
                        {getFilteredExercises().map(exercise => (
                          <option key={exercise.id} value={exercise.id}>
                            {exercise.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Sets
                        </label>
                        <input
                          type="number"
                          value={log.sets}
                          onChange={(e) => updateWorkoutLog(index, 'sets', parseInt(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Reps
                        </label>
                        <input
                          type="number"
                          value={log.reps}
                          onChange={(e) => updateWorkoutLog(index, 'reps', parseInt(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          value={log.weight_kg}
                          onChange={(e) => updateWorkoutLog(index, 'weight_kg', parseFloat(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          min="0"
                          step="0.5"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeExerciseLog(index)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium self-start"
                    >
                      Remove Exercise
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            {message && (
              <div className="text-green-600 text-sm">{message}</div>
            )}

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || workout.workout_logs.length === 0}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
              >
                {saving ? 'Updating...' : 'Update Workout'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 