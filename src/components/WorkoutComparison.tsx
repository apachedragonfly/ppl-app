'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Workout } from '@/types'

interface ComparisonData {
  workout1: Workout & { workout_logs: any[] }
  workout2: Workout & { workout_logs: any[] }
  metrics: {
    totalVolume: { workout1: number; workout2: number; change: number }
    totalSets: { workout1: number; workout2: number; change: number }
    totalReps: { workout1: number; workout2: number; change: number }
    duration: { workout1: number; workout2: number; change: number }
    averageWeight: { workout1: number; workout2: number; change: number }
    exerciseCount: { workout1: number; workout2: number; change: number }
  }
  exerciseComparisons: Array<{
    exerciseName: string
    workout1: { weight: number; sets: number; reps: number; volume: number } | null
    workout2: { weight: number; sets: number; reps: number; volume: number } | null
    improvement: number
  }>
}

interface WorkoutComparisonProps {
  onClose: () => void
}

export default function WorkoutComparison({ onClose }: WorkoutComparisonProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [selectedWorkout1, setSelectedWorkout1] = useState<string>('')
  const [selectedWorkout2, setSelectedWorkout2] = useState<string>('')
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadWorkouts()
  }, [])

  useEffect(() => {
    if (selectedWorkout1 && selectedWorkout2) {
      compareWorkouts()
    }
  }, [selectedWorkout1, selectedWorkout2])

  const loadWorkouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false })
        .limit(50)

      if (error) throw error

      setWorkouts(data || [])
    } catch (error) {
      console.error('Error loading workouts:', error)
      setError('Failed to load workouts')
    }
  }

  const compareWorkouts = async () => {
    if (!selectedWorkout1 || !selectedWorkout2) return

    try {
      setLoading(true)
      setError('')

      // Fetch detailed workout data
      const [workout1Response, workout2Response] = await Promise.all([
        supabase
          .from('workouts')
          .select(`
            *,
            workout_logs (
              *,
              exercises (
                name,
                muscle_group
              )
            )
          `)
          .eq('id', selectedWorkout1)
          .single(),
        supabase
          .from('workouts')
          .select(`
            *,
            workout_logs (
              *,
              exercises (
                name,
                muscle_group
              )
            )
          `)
          .eq('id', selectedWorkout2)
          .single()
      ])

      if (workout1Response.error) throw workout1Response.error
      if (workout2Response.error) throw workout2Response.error

      const workout1 = workout1Response.data
      const workout2 = workout2Response.data

      // Calculate metrics
      const calculateWorkoutMetrics = (workout: any) => {
        const logs = workout.workout_logs || []
        return {
          totalVolume: logs.reduce((sum: number, log: any) => sum + (log.sets * log.reps * log.weight_kg), 0),
          totalSets: logs.reduce((sum: number, log: any) => sum + log.sets, 0),
          totalReps: logs.reduce((sum: number, log: any) => sum + (log.sets * log.reps), 0),
          duration: workout.duration_minutes || 0,
          averageWeight: logs.length > 0 
            ? logs.reduce((sum: number, log: any) => sum + log.weight_kg, 0) / logs.length 
            : 0,
          exerciseCount: logs.length
        }
      }

      const metrics1 = calculateWorkoutMetrics(workout1)
      const metrics2 = calculateWorkoutMetrics(workout2)

      const metrics = {
        totalVolume: {
          workout1: metrics1.totalVolume,
          workout2: metrics2.totalVolume,
          change: metrics1.totalVolume > 0 ? ((metrics2.totalVolume - metrics1.totalVolume) / metrics1.totalVolume) * 100 : 0
        },
        totalSets: {
          workout1: metrics1.totalSets,
          workout2: metrics2.totalSets,
          change: metrics1.totalSets > 0 ? ((metrics2.totalSets - metrics1.totalSets) / metrics1.totalSets) * 100 : 0
        },
        totalReps: {
          workout1: metrics1.totalReps,
          workout2: metrics2.totalReps,
          change: metrics1.totalReps > 0 ? ((metrics2.totalReps - metrics1.totalReps) / metrics1.totalReps) * 100 : 0
        },
        duration: {
          workout1: metrics1.duration,
          workout2: metrics2.duration,
          change: metrics1.duration > 0 ? ((metrics2.duration - metrics1.duration) / metrics1.duration) * 100 : 0
        },
        averageWeight: {
          workout1: metrics1.averageWeight,
          workout2: metrics2.averageWeight,
          change: metrics1.averageWeight > 0 ? ((metrics2.averageWeight - metrics1.averageWeight) / metrics1.averageWeight) * 100 : 0
        },
        exerciseCount: {
          workout1: metrics1.exerciseCount,
          workout2: metrics2.exerciseCount,
          change: metrics1.exerciseCount > 0 ? ((metrics2.exerciseCount - metrics1.exerciseCount) / metrics1.exerciseCount) * 100 : 0
        }
      }

      // Compare exercises
      const exerciseMap1: Record<string, any> = {}
      const exerciseMap2: Record<string, any> = {}

      workout1.workout_logs?.forEach((log: any) => {
        const exerciseName = log.exercises?.name || 'Unknown Exercise'
        exerciseMap1[exerciseName] = {
          weight: log.weight_kg,
          sets: log.sets,
          reps: log.reps,
          volume: log.sets * log.reps * log.weight_kg
        }
      })

      workout2.workout_logs?.forEach((log: any) => {
        const exerciseName = log.exercises?.name || 'Unknown Exercise'
        exerciseMap2[exerciseName] = {
          weight: log.weight_kg,
          sets: log.sets,
          reps: log.reps,
          volume: log.sets * log.reps * log.weight_kg
        }
      })

      const allExercises = new Set([...Object.keys(exerciseMap1), ...Object.keys(exerciseMap2)])
      const exerciseComparisons = Array.from(allExercises).map(exerciseName => {
        const ex1 = exerciseMap1[exerciseName] || null
        const ex2 = exerciseMap2[exerciseName] || null
        
        let improvement = 0
        if (ex1 && ex2) {
          improvement = ex1.weight > 0 ? ((ex2.weight - ex1.weight) / ex1.weight) * 100 : 0
        }

        return {
          exerciseName,
          workout1: ex1,
          workout2: ex2,
          improvement
        }
      }).sort((a, b) => Math.abs(b.improvement) - Math.abs(a.improvement))

      setComparisonData({
        workout1,
        workout2,
        metrics,
        exerciseComparisons
      })

    } catch (error) {
      console.error('Error comparing workouts:', error)
      setError('Failed to compare workouts')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number, decimals: number = 1) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num)
  }

  const formatWeight = (weight: number) => {
    return `${formatNumber(weight, 1)} kg`
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${formatNumber(volume / 1000, 1)}k kg`
    }
    return `${formatNumber(volume)} kg`
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${formatNumber(change, 1)}%`
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400'
    if (change < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getChangeIcon = (change: number) => {
    if (change > 5) return '📈'
    if (change < -5) return '📉'
    return '➡️'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Workout Comparison</h2>
            <p className="text-sm text-muted-foreground">Compare two workout sessions</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Workout Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                First Workout
              </label>
                             <select
                 value={selectedWorkout1}
                 onChange={(e) => setSelectedWorkout1(e.target.value)}
                 className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
               >
                 <option value="">Select a workout...</option>
                 {workouts.map((workout: any) => (
                   <option key={workout.id} value={workout.id}>
                     {new Date(workout.workout_date || workout.date).toLocaleDateString()} - {workout.workout_type || workout.type}
                     {workout.duration_minutes && ` (${workout.duration_minutes}m)`}
                   </option>
                 ))}
               </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Second Workout
              </label>
                             <select
                 value={selectedWorkout2}
                 onChange={(e) => setSelectedWorkout2(e.target.value)}
                 className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
               >
                 <option value="">Select a workout...</option>
                 {workouts.map((workout: any) => (
                   <option key={workout.id} value={workout.id}>
                     {new Date(workout.workout_date || workout.date).toLocaleDateString()} - {workout.workout_type || workout.type}
                     {workout.duration_minutes && ` (${workout.duration_minutes}m)`}
                   </option>
                 ))}
               </select>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {comparisonData && !loading && (
            <>
              {/* Workout Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">Workout 1</h3>
                  <div className="space-y-1 text-sm">
                                         <div className="flex justify-between">
                       <span className="text-muted-foreground">Date:</span>
                       <span className="text-foreground">
                         {new Date((comparisonData.workout1 as any).workout_date || comparisonData.workout1.date).toLocaleDateString()}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Type:</span>
                       <span className="text-foreground">{(comparisonData.workout1 as any).workout_type || comparisonData.workout1.type}</span>
                     </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exercises:</span>
                      <span className="text-foreground">{comparisonData.workout1.workout_logs?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">Workout 2</h3>
                  <div className="space-y-1 text-sm">
                                         <div className="flex justify-between">
                       <span className="text-muted-foreground">Date:</span>
                       <span className="text-foreground">
                         {new Date((comparisonData.workout2 as any).workout_date || comparisonData.workout2.date).toLocaleDateString()}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Type:</span>
                       <span className="text-foreground">{(comparisonData.workout2 as any).workout_type || comparisonData.workout2.type}</span>
                     </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exercises:</span>
                      <span className="text-foreground">{comparisonData.workout2.workout_logs?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Comparison */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl mb-2">💪</div>
                    <div className="text-sm text-muted-foreground mb-1">Total Volume</div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        {formatVolume(comparisonData.metrics.totalVolume.workout1)} → {formatVolume(comparisonData.metrics.totalVolume.workout2)}
                      </div>
                      <div className={`font-semibold flex items-center justify-center space-x-1 ${getChangeColor(comparisonData.metrics.totalVolume.change)}`}>
                        <span>{getChangeIcon(comparisonData.metrics.totalVolume.change)}</span>
                        <span>{formatChange(comparisonData.metrics.totalVolume.change)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl mb-2">🏋️</div>
                    <div className="text-sm text-muted-foreground mb-1">Average Weight</div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        {formatWeight(comparisonData.metrics.averageWeight.workout1)} → {formatWeight(comparisonData.metrics.averageWeight.workout2)}
                      </div>
                      <div className={`font-semibold flex items-center justify-center space-x-1 ${getChangeColor(comparisonData.metrics.averageWeight.change)}`}>
                        <span>{getChangeIcon(comparisonData.metrics.averageWeight.change)}</span>
                        <span>{formatChange(comparisonData.metrics.averageWeight.change)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl mb-2">⏱️</div>
                    <div className="text-sm text-muted-foreground mb-1">Duration</div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        {comparisonData.metrics.duration.workout1}m → {comparisonData.metrics.duration.workout2}m
                      </div>
                      <div className={`font-semibold flex items-center justify-center space-x-1 ${getChangeColor(comparisonData.metrics.duration.change)}`}>
                        <span>{getChangeIcon(comparisonData.metrics.duration.change)}</span>
                        <span>{formatChange(comparisonData.metrics.duration.change)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔢</div>
                    <div className="text-sm text-muted-foreground mb-1">Total Sets</div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        {comparisonData.metrics.totalSets.workout1} → {comparisonData.metrics.totalSets.workout2}
                      </div>
                      <div className={`font-semibold flex items-center justify-center space-x-1 ${getChangeColor(comparisonData.metrics.totalSets.change)}`}>
                        <span>{getChangeIcon(comparisonData.metrics.totalSets.change)}</span>
                        <span>{formatChange(comparisonData.metrics.totalSets.change)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl mb-2">🔁</div>
                    <div className="text-sm text-muted-foreground mb-1">Total Reps</div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        {comparisonData.metrics.totalReps.workout1} → {comparisonData.metrics.totalReps.workout2}
                      </div>
                      <div className={`font-semibold flex items-center justify-center space-x-1 ${getChangeColor(comparisonData.metrics.totalReps.change)}`}>
                        <span>{getChangeIcon(comparisonData.metrics.totalReps.change)}</span>
                        <span>{formatChange(comparisonData.metrics.totalReps.change)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl mb-2">📋</div>
                    <div className="text-sm text-muted-foreground mb-1">Exercises</div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        {comparisonData.metrics.exerciseCount.workout1} → {comparisonData.metrics.exerciseCount.workout2}
                      </div>
                      <div className={`font-semibold flex items-center justify-center space-x-1 ${getChangeColor(comparisonData.metrics.exerciseCount.change)}`}>
                        <span>{getChangeIcon(comparisonData.metrics.exerciseCount.change)}</span>
                        <span>{formatChange(comparisonData.metrics.exerciseCount.change)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exercise Comparison */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Exercise Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-muted-foreground">Exercise</th>
                        <th className="text-left py-2 text-muted-foreground">Workout 1</th>
                        <th className="text-left py-2 text-muted-foreground">Workout 2</th>
                        <th className="text-left py-2 text-muted-foreground">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.exerciseComparisons.map((exercise, index) => (
                        <tr key={index} className="border-b border-border/50">
                          <td className="py-3 text-foreground font-medium">
                            {exercise.exerciseName}
                          </td>
                          <td className="py-3 text-foreground">
                            {exercise.workout1 ? (
                              <div>
                                <div>{formatWeight(exercise.workout1.weight)} × {exercise.workout1.sets}×{exercise.workout1.reps}</div>
                                <div className="text-xs text-muted-foreground">{formatVolume(exercise.workout1.volume)}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not performed</span>
                            )}
                          </td>
                          <td className="py-3 text-foreground">
                            {exercise.workout2 ? (
                              <div>
                                <div>{formatWeight(exercise.workout2.weight)} × {exercise.workout2.sets}×{exercise.workout2.reps}</div>
                                <div className="text-xs text-muted-foreground">{formatVolume(exercise.workout2.volume)}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not performed</span>
                            )}
                          </td>
                          <td className="py-3">
                            {exercise.workout1 && exercise.workout2 ? (
                              <div className={`flex items-center space-x-1 ${getChangeColor(exercise.improvement)}`}>
                                <span>{getChangeIcon(exercise.improvement)}</span>
                                <span className="font-medium">{formatChange(exercise.improvement)}</span>
                              </div>
                            ) : exercise.workout2 && !exercise.workout1 ? (
                              <span className="text-green-600 dark:text-green-400 font-medium">New exercise</span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400 font-medium">Dropped</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!selectedWorkout1 || !selectedWorkout2 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-4">Select two workouts to compare</div>
              <p className="text-sm text-muted-foreground">
                Choose workouts from the dropdowns above to see detailed comparisons.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
} 