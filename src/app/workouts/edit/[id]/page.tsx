'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/lib/supabase'
import { Exercise, WorkoutType } from '@/types'

interface WorkoutLog {
  id: string
  tempId: string
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

  // Set loading to false once we have both user and workout data
  useEffect(() => {
    if (user && workout) {
      setLoading(false)
    }
  }, [user, workout])

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
          tempId: log.id, // Use existing id as tempId for loaded exercises
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
      setLoading(false) // Ensure loading is set to false on error
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
    
    // Filter exercises by workout category (Push/Pull/Legs)
    const filtered = exercises.filter(ex => 
      ex.workout_category === workout.type
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

  const updateWorkoutLog = (tempId: string, field: keyof WorkoutLog, value: string | number) => {
    if (!workout) return

    const updated = workout.workout_logs.map(log => {
      if (log.tempId !== tempId) return log
      
      if (field === 'exercise_id') {
        const exercise = exercises.find(e => e.id === value)
        return {
          ...log,
          exercise_id: value as string,
          exercise_name: exercise?.name || ''
        }
      } else {
        return { ...log, [field]: value }
      }
    })
    
    setWorkout({ ...workout, workout_logs: updated })
  }

  const addExerciseLog = () => {
    if (!workout) return

    const filteredExercises = getFilteredExercises()
    const newLog: WorkoutLog = {
      id: `new-${Date.now()}`,
      tempId: `new-${Date.now()}`,
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

  const removeExerciseLog = (tempId: string) => {
    if (!workout) return
    
    setWorkout({
      ...workout,
      workout_logs: workout.workout_logs.filter(log => log.tempId !== tempId)
    })
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !workout) return

    const items = Array.from(workout.workout_logs)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setWorkout({ ...workout, workout_logs: items })
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !workout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Workout not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="text-primary hover:text-primary/80 font-medium mb-3 sm:mb-4 text-sm sm:text-base"
          >
            ← Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Edit Workout</h1>
        </div>

        <div className="bg-card border border-border rounded-lg shadow p-4 sm:p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={workout.date}
                  onChange={(e) => setWorkout({ ...workout, date: e.target.value })}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Type
                </label>
                <select
                  value={workout.type}
                  onChange={(e) => setWorkout({ ...workout, type: e.target.value as WorkoutType })}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
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
                <h3 className="text-lg font-medium text-card-foreground">Exercises</h3>
                <button
                  type="button"
                  onClick={addExerciseLog}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium py-1 px-3 rounded-md transition-colors"
                >
                  + Add Exercise
                </button>
              </div>

              {workout.workout_logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No exercises added yet. Click &quot;+ Add Exercise&quot; to get started.
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="edit-workout-exercises">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {workout.workout_logs.map((log, index) => (
                          <Draggable key={log.tempId} draggableId={log.tempId} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-4 rounded-lg border border-border ${
                                  snapshot.isDragging ? 'shadow-lg bg-accent' : 'bg-secondary/20'
                                }`}
                              >
                                <div className="flex items-start space-x-3">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="text-muted-foreground cursor-move hover:text-foreground mt-2"
                                  >
                                    ⋮⋮
                                  </div>

                                  <div className="flex-1 grid grid-cols-1 gap-3">
                                    <div>
                                      <label className="block text-sm font-medium text-card-foreground mb-1">
                                        Exercise
                                      </label>
                                      <select
                                        value={log.exercise_id}
                                        onChange={(e) => updateWorkoutLog(log.tempId, 'exercise_id', e.target.value)}
                                        className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
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
                                        <label className="block text-xs font-medium text-card-foreground mb-1">
                                          Sets
                                        </label>
                                        <input
                                          type="number"
                                          value={log.sets}
                                          onChange={(e) => updateWorkoutLog(log.tempId, 'sets', parseInt(e.target.value))}
                                          className="w-full px-2 py-1 border border-border bg-input text-foreground rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                          min="1"
                                          required
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-card-foreground mb-1">
                                          Reps
                                        </label>
                                        <input
                                          type="number"
                                          value={log.reps}
                                          onChange={(e) => updateWorkoutLog(log.tempId, 'reps', parseInt(e.target.value))}
                                          className="w-full px-2 py-1 border border-border bg-input text-foreground rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                          min="1"
                                          required
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-card-foreground mb-1">
                                          Weight (kg)
                                        </label>
                                        <input
                                          type="number"
                                          value={log.weight_kg}
                                          onChange={(e) => updateWorkoutLog(log.tempId, 'weight_kg', parseFloat(e.target.value))}
                                          className="w-full px-2 py-1 border border-border bg-input text-foreground rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                          min="0"
                                          step="0.5"
                                          required
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeExerciseLog(log.tempId)}
                                    className="text-destructive hover:text-destructive/80 font-bold text-lg"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>

            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}

            {message && (
              <div className="text-green-600 text-sm">{message}</div>
            )}

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-border text-foreground rounded-md hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || workout.workout_logs.length === 0}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
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