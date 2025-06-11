'use client'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { supabase } from '@/lib/supabase'

interface ProgressData {
  date: string
  maxWeight: number
  max1RM: number
  exercise: string
}

interface ChartProgressProps {
  userId: string
  exerciseId?: string
  className?: string
}

export default function ChartProgress({ userId, exerciseId, className = '' }: ChartProgressProps) {
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [exercises, setExercises] = useState<any[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>(exerciseId || '')
  const [chartType, setChartType] = useState<'weight' | '1rm'>('weight')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExercises()
  }, [userId])

  useEffect(() => {
    if (selectedExercise) {
      fetchProgressData()
    }
  }, [selectedExercise, userId])

  const fetchExercises = async () => {
    try {
      const { data: exercises, error } = await supabase
        .from('exercises')
        .select('id, name, user_id')
        .or(`user_id.eq.${userId},user_id.is.null`)

      if (error) throw error

      // Deduplicate exercises by name, preferring user-specific ones
      const exerciseMap = new Map()
      exercises?.forEach(exercise => {
        const existing = exerciseMap.get(exercise.name)
        if (!existing || (!existing.user_id && exercise.user_id === userId)) {
          exerciseMap.set(exercise.name, exercise)
        }
      })

      const deduplicatedExercises = Array.from(exerciseMap.values()).sort((a, b) => a.name.localeCompare(b.name))
      setExercises(deduplicatedExercises)
      
      if (!selectedExercise && deduplicatedExercises && deduplicatedExercises.length > 0) {
        setSelectedExercise(deduplicatedExercises[0].id)
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

  const fetchProgressData = async () => {
    try {
      setLoading(true)
      
      const { data: workoutLogs, error } = await supabase
        .from('workout_logs')
        .select(`
          sets, reps, weight_kg,
          workout:workouts(date),
          exercise:exercises(name)
        `)
        .eq('exercise_id', selectedExercise)
        .order('workout(date)', { ascending: true })

      if (error) throw error

      // Group by date and calculate totals
      const dataByDate: Record<string, ProgressData> = {}
      
      workoutLogs?.forEach((log: any) => {
        const date = log.workout?.date
        if (!date) return

        if (!dataByDate[date]) {
          dataByDate[date] = {
            date,
            maxWeight: 0,
            max1RM: 0,
            exercise: log.exercise?.name || 'Unknown'
          }
        }

        // Calculate 1RM for this set: 1RM = Weight x (1 + (Reps / 30))
        const oneRM = log.weight_kg * (1 + (log.reps / 30))
        
        dataByDate[date].maxWeight = Math.max(dataByDate[date].maxWeight, log.weight_kg)
        dataByDate[date].max1RM = Math.max(dataByDate[date].max1RM, oneRM)
      })

      const chartData = Object.values(dataByDate).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      setProgressData(chartData)
    } catch (error) {
      console.error('Error fetching progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const selectedExerciseName = exercises.find(ex => ex.id === selectedExercise)?.name || 'Exercise'

  // Custom tooltip component for dark mode support
  const CustomTooltip = ({ active, payload, label }: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="text-card-foreground font-medium">
            {`Date: ${formatDate(label as string)}`}
          </p>
          {payload.map((entry: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
            <p key={index} className="text-card-foreground">
              <span className="font-medium">
                {entry.dataKey === 'maxWeight' ? 'Max Weight' : '1RM'}:
              </span>
              <span className="ml-1" style={{ color: entry.color }}>
                {entry.dataKey === 'max1RM' 
                  ? `${Math.round(entry.value)} kg`
                  : `${entry.value} kg`
                }
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  }

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-3 sm:p-4 ${className}`}>
      <div className="flex flex-col space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Progress Chart</h3>
        
        <div className="flex flex-col space-y-2">
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="appearance-none bg-input border border-border text-foreground px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
            disabled={exercises.length === 0}
          >
            {exercises.length === 0 ? (
              <option value="">No exercises available</option>
            ) : (
              exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))
            )}
          </select>

          <div className="flex space-x-2">
            <button
              onClick={() => setChartType('weight')}
              className={`px-3 py-2 text-sm rounded-md transition-colors flex-1 ${
                chartType === 'weight'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
              disabled={!progressData.length}
            >
              Weight
            </button>
            <button
              onClick={() => setChartType('1rm')}
              className={`px-3 py-2 text-sm rounded-md transition-colors flex-1 ${
                chartType === '1rm'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
              disabled={!progressData.length}
            >
              1RM
            </button>
          </div>
        </div>
      </div>

      {!progressData.length ? (
        <div className="text-center py-8 text-muted-foreground">
          {exercises.length === 0 
            ? "No exercises available. Start logging workouts to see your progress!"
            : "No workout data for this exercise. Start logging workouts to see your progress!"
          }
        </div>
      ) : (
        <>
          <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'weight' ? (
            <LineChart data={progressData} margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                angle={-45}
                textAnchor="end"
                height={50}
                tick={{ fontSize: 10, fill: 'white' }}
              />
              <YAxis tick={{ fontSize: 10, fill: 'white' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="maxWeight" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
                name="maxWeight"
              />
            </LineChart>
          ) : (
            <LineChart data={progressData} margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                angle={-45}
                textAnchor="end"
                height={50}
                tick={{ fontSize: 10, fill: 'white' }}
              />
              <YAxis tick={{ fontSize: 10, fill: 'white' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="max1RM" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444' }}
                name="max1RM"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

          <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
            <p>
              <strong>{selectedExerciseName}</strong> - {
                chartType === 'weight' 
                  ? 'Highest weight lifted per workout session'
                  : 'Estimated 1 Rep Max using formula: Weight × (1 + (Reps / 30))'
              }
            </p>
          </div>
        </>
      )}
    </div>
  )
} 