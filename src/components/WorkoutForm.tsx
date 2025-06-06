'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Exercise, WorkoutType } from '@/types'

interface WorkoutLog {
  exercise_id: string
  exercise_name: string
  sets: number
  reps: number
  weight_kg: number
}

interface WorkoutFormProps {
  onWorkoutSaved?: () => void
}

export default function WorkoutForm({ onWorkoutSaved }: WorkoutFormProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workoutType, setWorkoutType] = useState<WorkoutType>('Push')
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadExercises()
  }, [])

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
      setError('Failed to load exercises')
    }
  }

  const addExerciseLog = () => {
    setWorkoutLogs([...workoutLogs, {
      exercise_id: '',
      exercise_name: '',
      sets: 3,
      reps: 10,
      weight_kg: 0
    }])
  }

  const updateExerciseLog = (index: number, field: keyof WorkoutLog, value: string | number) => {
    const updated = [...workoutLogs]
    if (field === 'exercise_id') {
      const exercise = exercises.find(e => e.id === value)
      updated[index].exercise_id = value as string
      updated[index].exercise_name = exercise?.name || ''
    } else if (field === 'exercise_name') {
      updated[index].exercise_name = value as string
    } else if (field === 'sets') {
      updated[index].sets = value as number
    } else if (field === 'reps') {
      updated[index].reps = value as number
    } else if (field === 'weight_kg') {
      updated[index].weight_kg = value as number
    }
    setWorkoutLogs(updated)
  }

  const removeExerciseLog = (index: number) => {
    setWorkoutLogs(workoutLogs.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (workoutLogs.length === 0) {
      setError('Please add at least one exercise')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create workout
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          date: workoutDate,
          type: workoutType
        })
        .select()
        .single()

      if (workoutError) throw workoutError

      // Create workout logs
      const logs = workoutLogs.map(log => ({
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

      setMessage('Workout saved successfully!')
      setWorkoutLogs([])
      onWorkoutSaved?.()
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving workout:', error)
      setError('Failed to save workout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Log Workout</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value as WorkoutType)}
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

          {workoutLogs.map((log, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exercise
                  </label>
                  <select
                    value={log.exercise_id}
                    onChange={(e) => updateExerciseLog(index, 'exercise_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    required
                  >
                    <option value="">Select exercise...</option>
                    {exercises.filter(e => e.muscle_group === workoutType).map(exercise => (
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
                      onChange={(e) => updateExerciseLog(index, 'sets', parseInt(e.target.value))}
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
                      onChange={(e) => updateExerciseLog(index, 'reps', parseInt(e.target.value))}
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
                      onChange={(e) => updateExerciseLog(index, 'weight_kg', parseFloat(e.target.value))}
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

        <button
          type="submit"
          disabled={loading || workoutLogs.length === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Workout'}
        </button>
      </form>
    </div>
  )
} 