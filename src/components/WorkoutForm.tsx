'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/lib/supabase'
import { Exercise, WorkoutType } from '@/types'
import ExerciseInfoCard from '@/components/ExerciseInfoCard'
import ExerciseSearch from '@/components/ExerciseSearch'

interface WorkoutLog {
  tempId: string
  exercise_id: string
  exercise_name: string
  sets: number
  reps: number
  weight_kg: number
  last_weight?: number // Last logged weight for this exercise
  last_sets?: number // Last logged sets for this exercise
  last_reps?: number // Last logged reps for this exercise
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
    loadRoutineFromStorage()
  }, [])

  const loadRoutineFromStorage = async () => {
    try {
      const storedRoutine = localStorage.getItem('selectedRoutine')
      if (storedRoutine) {
        const routine = JSON.parse(storedRoutine)
        setWorkoutType(routine.type)
        
        // Convert routine exercises to workout logs
        const logs: WorkoutLog[] = routine.routine_exercises.map((re: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          tempId: `routine-${re.exercise_id}-${Date.now()}`,
          exercise_id: re.exercise_id,
          exercise_name: re.exercise?.name || '',
          sets: re.sets,
          reps: re.reps,
          weight_kg: re.weight_kg || 0
        }))
        
        console.log('Loading routine with logs:', logs)
        
        // Fetch last logged weights for each exercise
        await loadLastWeights(logs)
        
        localStorage.removeItem('selectedRoutine') // Clear after loading
      }
    } catch (error) {
      console.error('Error loading routine from storage:', error)
    }
  }

  const loadLastWeights = async (logs: WorkoutLog[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch exercises with last workout data for this user
      const exerciseIds = logs.map(log => log.exercise_id).filter(Boolean)
      if (exerciseIds.length === 0) return

      const { data: exercisesWithLastData, error } = await supabase
        .from('exercises')
        .select('id, last_weight_kg, last_sets, last_reps')
        .in('id', exerciseIds)

      if (error) {
        console.error('Error fetching exercise data (columns might not exist yet):', error)
        // If columns don't exist, just continue without last data
        setWorkoutLogs(logs)
        return
      }

      console.log('Fetched exercise data:', exercisesWithLastData)

      // Create lookup map
      const exerciseDataMap: Record<string, { weight?: number, sets?: number, reps?: number }> = {}
      exercisesWithLastData?.forEach(exercise => {
        exerciseDataMap[exercise.id] = {
          weight: exercise.last_weight_kg,
          sets: exercise.last_sets,
          reps: exercise.last_reps
        }
      })

      // Update logs with last values and set as defaults
      const updatedLogs = logs.map(log => {
        const lastValues = exerciseDataMap[log.exercise_id]
        console.log(`Exercise ${log.exercise_name} - Last values:`, lastValues)
        return {
          ...log,
          last_weight: lastValues?.weight,
          last_sets: lastValues?.sets,
          last_reps: lastValues?.reps,
          weight_kg: lastValues?.weight || log.weight_kg,
          sets: lastValues?.sets || log.sets,
          reps: lastValues?.reps || log.reps
        }
      })

      setWorkoutLogs(updatedLogs)
    } catch (error) {
      console.error('Error loading last weights:', error)
      // If error, just set the logs without last weights
      setWorkoutLogs(logs)
    }
  }

  const loadExercises = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(`user_id.eq.${user?.id},user_id.is.null`)
        .order('name')

      if (error) throw error

      // Deduplicate exercises by name, preferring user-specific ones
      const exerciseMap = new Map()
      data?.forEach(exercise => {
        const existing = exerciseMap.get(exercise.name)
        if (!existing || (!existing.user_id && exercise.user_id === user?.id)) {
          exerciseMap.set(exercise.name, exercise)
        }
      })

      const deduplicatedExercises = Array.from(exerciseMap.values()).sort((a, b) => a.name.localeCompare(b.name))
      setExercises(deduplicatedExercises)
    } catch (error) {
      console.error('Error loading exercises:', error)
      setError('Failed to load exercises')
    }
  }

  const addExerciseLog = () => {
    setWorkoutLogs([...workoutLogs, {
      tempId: `new-${Date.now()}`,
      exercise_id: '',
      exercise_name: '',
      sets: 3,
      reps: 10,
      weight_kg: 0
    }])
  }

  const updateExerciseLog = async (tempId: string, field: keyof WorkoutLog, value: string | number) => {
    const updated = workoutLogs.map(log => {
      if (log.tempId !== tempId) return log
      
      if (field === 'exercise_id') {
        const exercise = exercises.find(e => e.id === value)
        const updatedLog = { 
          ...log, 
          exercise_id: value as string,
          exercise_name: exercise?.name || ''
        }
        
        // Fetch last values for this exercise and update later
        getLastValuesForExercise(value as string).then(lastValues => {
          if (lastValues) {
            setWorkoutLogs(prevLogs => prevLogs.map(prevLog => 
              prevLog.tempId === tempId ? {
                ...prevLog,
                last_weight: lastValues.weight,
                last_sets: lastValues.sets,
                last_reps: lastValues.reps,
                weight_kg: lastValues.weight,
                sets: lastValues.sets,
                reps: lastValues.reps
              } : prevLog
            ))
          } else {
            setWorkoutLogs(prevLogs => prevLogs.map(prevLog => 
              prevLog.tempId === tempId ? {
                ...prevLog,
                last_weight: undefined,
                last_sets: undefined,
                last_reps: undefined,
                weight_kg: 0,
                sets: 3,
                reps: 8
              } : prevLog
            ))
          }
        })
        
        return updatedLog
      } else {
        return { ...log, [field]: value }
      }
    })
    setWorkoutLogs(updated)
  }

  const getLastValuesForExercise = async (exerciseId: string): Promise<{ weight: number, sets: number, reps: number } | null> => {
    try {
      const { data: exercise, error } = await supabase
        .from('exercises')
        .select('last_weight_kg, last_sets, last_reps')
        .eq('id', exerciseId)
        .maybeSingle()

      console.log('Fetched individual exercise data:', exercise)

      if (error) {
        console.error('Error fetching individual exercise (columns might not exist yet):', error)
        return null
      }
      if (!exercise || (!exercise.last_weight_kg && !exercise.last_sets && !exercise.last_reps)) {
        console.log('No last workout data found for exercise')
        return null
      }
      
      return {
        weight: exercise.last_weight_kg || 0,
        sets: exercise.last_sets || 3,
        reps: exercise.last_reps || 10
      }
    } catch (error) {
      console.error('Error fetching last values:', error)
      return null
    }
  }

  const updateExerciseLastValues = async (logs: WorkoutLog[], date: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update each exercise with the latest workout data
      for (const log of logs) {
        const { error: updateError } = await supabase
          .from('exercises')
          .update({
            last_weight_kg: log.weight_kg,
            last_sets: log.sets,
            last_reps: log.reps,
            last_workout_date: date,
            user_id: user.id // Associate with current user
          })
          .eq('id', log.exercise_id)
          
        if (updateError) {
          console.error(`Error updating exercise ${log.exercise_name}:`, updateError)
        } else {
          console.log(`Updated ${log.exercise_name} with last values: ${log.sets}x${log.reps} @ ${log.weight_kg}kg`)
        }
      }
    } catch (error) {
      console.error('Error updating exercise last values:', error)
      // Don't throw - workout was already saved successfully
    }
  }

  const removeExerciseLog = (tempId: string) => {
    setWorkoutLogs(workoutLogs.filter(log => log.tempId !== tempId))
  }

  const createNewExercise = async (name: string, muscleGroup: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('exercises')
        .insert([{
          name,
          muscle_group: muscleGroup,
          user_id: user.id
        }])
        .select()
        .single()

      if (error) throw error

      // Add to local exercises list
      setExercises(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      
      setMessage(`Created new exercise: ${name}`)
      setTimeout(() => setMessage(''), 3000)

      return data
    } catch (error) {
      console.error('Error creating exercise:', error)
      setError('Failed to create exercise')
      setTimeout(() => setError(''), 3000)
      return null
    }
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(workoutLogs)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setWorkoutLogs(items)
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

      // Update last workout data on exercises
      await updateExerciseLastValues(workoutLogs, workoutDate)

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
          <div className="bg-card border border-border rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Log Workout</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Date
            </label>
            <input
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Type
            </label>
            <select
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value as WorkoutType)}
              className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
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
            <h3 className="text-lg font-medium text-foreground">Exercises</h3>
            <button
              type="button"
              onClick={addExerciseLog}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium py-1 px-3 rounded-md transition-colors"
            >
              + Add Exercise
            </button>
          </div>

          {workoutLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No exercises added yet. Click &quot;+ Add Exercise&quot; to get started.
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="workout-exercises">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {workoutLogs.map((log, index) => (
                      <Draggable key={log.tempId} draggableId={log.tempId} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-4 rounded-lg border border-border ${
                              snapshot.isDragging ? 'shadow-lg bg-accent' : 'bg-secondary'
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
                                  <label className="block text-sm font-medium text-foreground mb-1">
                                    Exercise
                                  </label>
                                  <ExerciseSearch
                                    exercises={exercises.filter(e => {
                                      const typeMapping: Record<WorkoutType, string[]> = {
                                        'Push': ['Chest', 'Shoulders', 'Triceps', 'Push'],
                                        'Pull': ['Back', 'Biceps', 'Pull'],
                                        'Legs': ['Legs']
                                      }
                                      const targetMuscles = typeMapping[workoutType] || []
                                      const matches = targetMuscles.includes(e.muscle_group || '')
                                      
                                      return matches
                                    }).reduce((acc, current) => {
                                      // Remove duplicates by name
                                      const existing = acc.find(item => item.name === current.name)
                                      if (!existing) {
                                        acc.push(current)
                                      }
                                      return acc
                                    }, [] as typeof exercises).sort((a, b) => a.name.localeCompare(b.name))}
                                    onSelectExercise={(exercise) => updateExerciseLog(log.tempId, 'exercise_id', exercise.id)}
                                    onCreateExercise={async (name, muscleGroup) => {
                                      const newExercise = await createNewExercise(name, muscleGroup)
                                      if (newExercise) {
                                        updateExerciseLog(log.tempId, 'exercise_id', newExercise.id)
                                      }
                                    }}
                                    placeholder="Search exercises..."
                                  />
                                  {log.exercise_id && (
                                    <div className="mt-1 text-sm text-muted-foreground">
                                      Selected: {exercises.find(e => e.id === log.exercise_id)?.name}
                                    </div>
                                  )}
                                </div>

                                {/* Exercise Info Card */}
                                {log.exercise_id && (() => {
                                  const selectedExercise = exercises.find(e => e.id === log.exercise_id);
                                  return selectedExercise?.video && (
                                    <div className="mt-3">
                                      <ExerciseInfoCard
                                        exerciseName={selectedExercise.name}
                                        video={selectedExercise.video}
                                        description={selectedExercise.description}
                                        musclesWorked={(selectedExercise as any).muscles_worked}
                                      />
                                    </div>
                                  );
                                })()}

                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">
                                      Sets
                                      {log.last_sets && (
                                        <span className="text-xs text-muted-foreground ml-1">
                                          (Last: {log.last_sets})
                                        </span>
                                      )}
                                    </label>
                                    <input
                                      type="number"
                                      value={log.sets || ''}
                                      onChange={(e) => {
                                        const value = e.target.value === '' ? 1 : parseInt(e.target.value)
                                        updateExerciseLog(log.tempId, 'sets', value)
                                      }}
                                      className="w-full px-2 py-1 border border-border bg-input text-foreground rounded text-sm focus:outline-none focus:ring-ring focus:border-ring"
                                      min="1"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">
                                      Reps
                                      {log.last_reps && (
                                        <span className="text-xs text-muted-foreground ml-1">
                                          (Last: {log.last_reps})
                                        </span>
                                      )}
                                    </label>
                                    <input
                                      type="number"
                                      value={log.reps || ''}
                                      onChange={(e) => {
                                        const value = e.target.value === '' ? 1 : parseInt(e.target.value)
                                        updateExerciseLog(log.tempId, 'reps', value)
                                      }}
                                      className="w-full px-2 py-1 border border-border bg-input text-foreground rounded text-sm focus:outline-none focus:ring-ring focus:border-ring"
                                      min="1"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">
                                      Weight (kg)
                                      {log.last_weight && (
                                        <span className="text-xs text-muted-foreground ml-1">
                                          (Last: {log.last_weight}kg)
                                        </span>
                                      )}
                                    </label>
                                    <input
                                      type="number"
                                      value={log.weight_kg || ''}
                                      onChange={(e) => {
                                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                                        updateExerciseLog(log.tempId, 'weight_kg', value)
                                      }}
                                      className="w-full px-2 py-1 border border-border bg-input text-foreground rounded text-sm focus:outline-none focus:ring-ring focus:border-ring"
                                      min="0"
                                      step="0.5"
                                      required
                                    />
                                    {log.last_weight && log.weight_kg !== log.last_weight && (
                                      <div className="text-xs mt-1">
                                        {log.weight_kg > log.last_weight ? (
                                          <span className="text-green-400">
                                            +{(log.weight_kg - log.last_weight).toFixed(1)}kg from last time 💪
                                          </span>
                                        ) : log.weight_kg < log.last_weight ? (
                                          <span className="text-orange-400">
                                            -{(log.last_weight - log.weight_kg).toFixed(1)}kg from last time
                                          </span>
                                        ) : null}
                                      </div>
                                    )}
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
          <div className="text-green-400 text-sm">{message}</div>
        )}

        <button
          type="submit"
          disabled={loading || workoutLogs.length === 0}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Workout'}
        </button>
      </form>
    </div>
  )
} 