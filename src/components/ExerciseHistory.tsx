'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Exercise } from '@/types'

interface ExerciseHistoryData {
  date: string
  workout_type: string
  sets: number
  reps: number
  weight_kg: number
  workout_id: string
}

interface ExerciseUsageStats {
  total_workouts: number
  total_sets: number
  total_reps: number
  total_volume: number
  avg_weight: number
  max_weight: number
  last_performed: string
  first_performed: string
  recent_trend: 'improving' | 'declining' | 'stable' | 'insufficient_data'
  usage_frequency: number // workouts per week
}

interface ExerciseHistoryProps {
  exercise: Exercise
  userId: string
  onClose: () => void
}

export default function ExerciseHistory({ exercise, userId, onClose }: ExerciseHistoryProps) {
  const [history, setHistory] = useState<ExerciseHistoryData[]>([])
  const [stats, setStats] = useState<ExerciseUsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '6m' | 'all'>('90d')

  useEffect(() => {
    loadExerciseHistory()
  }, [exercise.id, userId, timeRange])

  const loadExerciseHistory = async () => {
    try {
      setLoading(true)
      
      // Calculate date filter
      const now = new Date()
      let dateFilter = new Date()
      switch (timeRange) {
        case '30d':
          dateFilter.setDate(now.getDate() - 30)
          break
        case '90d':
          dateFilter.setDate(now.getDate() - 90)
          break
        case '6m':
          dateFilter.setMonth(now.getMonth() - 6)
          break
        default:
          dateFilter = new Date('2020-01-01') // All time
      }

      // Get workout logs for this exercise
      const { data: workoutLogs, error } = await supabase
        .from('workout_logs')
        .select(`
          sets,
          reps,
          weight_kg,
          workout_id,
          workouts!inner(
            date,
            type,
            user_id
          )
        `)
        .eq('exercise_id', exercise.id)
        .eq('workouts.user_id', userId)
        .gte('workouts.date', dateFilter.toISOString().split('T')[0])
        .order('workouts.date', { ascending: false })

      if (error) throw error

      // Transform data
      const historyData: ExerciseHistoryData[] = workoutLogs?.map(log => ({
        date: (log as any).workouts.date,
        workout_type: (log as any).workouts.type,
        sets: log.sets,
        reps: log.reps,
        weight_kg: log.weight_kg,
        workout_id: log.workout_id
      })) || []

      setHistory(historyData)

      // Calculate statistics
      if (historyData.length > 0) {
        const weights = historyData.map(h => h.weight_kg).filter(w => w > 0)
        const totalSets = historyData.reduce((sum, h) => sum + h.sets, 0)
        const totalReps = historyData.reduce((sum, h) => sum + h.reps, 0)
        const totalVolume = historyData.reduce((sum, h) => sum + (h.sets * h.reps * h.weight_kg), 0)
        
        // Group by date to count unique workout days
        const uniqueDates = new Set(historyData.map(h => h.date))
        const totalWorkouts = uniqueDates.size

        // Calculate frequency (workouts per week)
        const firstDate = new Date(Math.min(...historyData.map(h => new Date(h.date).getTime())))
        const lastDate = new Date(Math.max(...historyData.map(h => new Date(h.date).getTime())))
        const daysDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
        const frequency = (totalWorkouts / daysDiff) * 7

        // Calculate recent trend (last 3 vs previous 3 workouts)
        let recentTrend: 'improving' | 'declining' | 'stable' | 'insufficient_data' = 'insufficient_data'
        if (weights.length >= 6) {
          const recent3 = weights.slice(0, 3)
          const previous3 = weights.slice(3, 6)
          const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length
          const previousAvg = previous3.reduce((a, b) => a + b, 0) / previous3.length
          
          if (recentAvg > previousAvg * 1.05) recentTrend = 'improving'
          else if (recentAvg < previousAvg * 0.95) recentTrend = 'declining'
          else recentTrend = 'stable'
        }

        const statsData: ExerciseUsageStats = {
          total_workouts: totalWorkouts,
          total_sets: totalSets,
          total_reps: totalReps,
          total_volume: totalVolume,
          avg_weight: weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0,
          max_weight: weights.length > 0 ? Math.max(...weights) : 0,
          last_performed: historyData[0].date,
          first_performed: historyData[historyData.length - 1].date,
          recent_trend: recentTrend,
          usage_frequency: frequency
        }

        setStats(statsData)
      } else {
        setStats(null)
      }
    } catch (error) {
      console.error('Error loading exercise history:', error)
      setError('Failed to load exercise history')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈'
      case 'declining': return '📉'
      case 'stable': return '➡️'
      default: return '❓'
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 dark:text-green-400'
      case 'declining': return 'text-red-600 dark:text-red-400'
      case 'stable': return 'text-blue-600 dark:text-blue-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getFrequencyText = (frequency: number) => {
    if (frequency >= 2) return `${frequency.toFixed(1)}x per week (High)`
    if (frequency >= 1) return `${frequency.toFixed(1)}x per week (Moderate)`
    if (frequency >= 0.5) return `${frequency.toFixed(1)}x per week (Low)`
    return `${frequency.toFixed(1)}x per week (Very Low)`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{exercise.name} - Usage History</h2>
            <p className="text-sm text-muted-foreground">{exercise.muscle_group}</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-1 border border-border bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-ring focus:border-ring"
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="6m">Last 6 Months</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-foreground">Loading exercise history...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : !stats ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg mb-2">No workout history found</p>
              <p className="text-sm">This exercise hasn't been used in any workouts yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Statistics Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-secondary/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.total_workouts}</div>
                  <div className="text-xs text-muted-foreground">Workouts</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.total_sets}</div>
                  <div className="text-xs text-muted-foreground">Total Sets</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.max_weight.toFixed(1)}kg</div>
                  <div className="text-xs text-muted-foreground">Max Weight</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{Math.round(stats.total_volume).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Total Volume</div>
                </div>
              </div>

              {/* Trend and Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-2">Recent Trend</h3>
                  <div className={`flex items-center space-x-2 ${getTrendColor(stats.recent_trend)}`}>
                    <span className="text-lg">{getTrendIcon(stats.recent_trend)}</span>
                    <span className="font-medium capitalize">{stats.recent_trend.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on last 6 workouts
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-2">Usage Frequency</h3>
                  <div className="text-sm text-foreground">
                    {getFrequencyText(stats.usage_frequency)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(stats.first_performed)} - {formatDate(stats.last_performed)}
                  </p>
                </div>
              </div>

              {/* Workout History */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-4">Workout History</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {history.map((entry, index) => (
                    <div key={`${entry.workout_id}-${index}`} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium text-foreground">
                          {formatDate(entry.date)}
                        </div>
                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {entry.workout_type}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{entry.sets} sets</span>
                        <span>{entry.reps} reps</span>
                        <span className="font-medium text-foreground">{entry.weight_kg}kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {history.length > 10 && (
                <div className="text-center text-sm text-muted-foreground">
                  Showing recent workout history. Total: {stats.total_workouts} workouts
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 