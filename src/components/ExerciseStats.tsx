'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Exercise } from '@/types'

interface ExerciseStatsData {
  exercise_id: string
  exercise_name: string
  total_workouts: number
  total_sets: number
  total_reps: number
  total_weight: number
  avg_weight: number
  max_weight: number
  last_performed: string
  progress_trend: 'up' | 'down' | 'stable' | 'new'
}

interface ExerciseStatsProps {
  userId: string
}

export default function ExerciseStats({ userId }: ExerciseStatsProps) {
  const [stats, setStats] = useState<ExerciseStatsData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<'frequency' | 'recent' | 'progress'>('frequency')
  const [filterBy, setFilterBy] = useState<'all' | 'week' | 'month' | '3months'>('month')

  useEffect(() => {
    loadExerciseStats()
  }, [userId, filterBy])

  const loadExerciseStats = async () => {
    try {
      setLoading(true)
      
      // Calculate date filter
      const now = new Date()
      let dateFilter = new Date()
      switch (filterBy) {
        case 'week':
          dateFilter.setDate(now.getDate() - 7)
          break
        case 'month':
          dateFilter.setMonth(now.getMonth() - 1)
          break
        case '3months':
          dateFilter.setMonth(now.getMonth() - 3)
          break
        default:
          dateFilter = new Date('2020-01-01') // All time
      }

      // Get workout logs with exercise and workout information
      const { data: workoutLogs, error } = await supabase
        .from('workout_logs')
        .select(`
          sets,
          reps,
          weight_kg,
          workouts!inner(
            id,
            user_id,
            date,
            created_at
          ),
          exercises!inner(
            id,
            name
          )
        `)
        .eq('workouts.user_id', userId)
        .gte('workouts.created_at', dateFilter.toISOString())

      if (error) throw error

      // Process the data to calculate statistics
      const exerciseMap = new Map<string, {
        name: string
        workouts: Set<string>
        sets: number
        totalReps: number
        totalWeight: number
        weights: number[]
        lastPerformed: string
        firstPerformed: string
      }>()

      workoutLogs?.forEach(log => {
        const exercise = (log as any).exercises
        const workout = (log as any).workouts
        const key = exercise.id
        
        if (!exerciseMap.has(key)) {
          exerciseMap.set(key, {
            name: exercise.name,
            workouts: new Set(),
            sets: 0,
            totalReps: 0,
            totalWeight: 0,
            weights: [],
            lastPerformed: workout.created_at,
            firstPerformed: workout.created_at
          })
        }

        const exerciseStats = exerciseMap.get(key)!
        exerciseStats.workouts.add(workout.id)
        exerciseStats.sets += log.sets || 0
        exerciseStats.totalReps += log.reps || 0
        exerciseStats.totalWeight += log.weight_kg || 0
        
        if (log.weight_kg) {
          exerciseStats.weights.push(log.weight_kg)
        }

        // Update dates
        if (new Date(workout.created_at) > new Date(exerciseStats.lastPerformed)) {
          exerciseStats.lastPerformed = workout.created_at
        }
        if (new Date(workout.created_at) < new Date(exerciseStats.firstPerformed)) {
          exerciseStats.firstPerformed = workout.created_at
        }
      })

      // Convert to stats format
      const statsData: ExerciseStatsData[] = Array.from(exerciseMap.entries()).map(([id, data]) => {
        const avgWeight = data.weights.length > 0 ? data.totalWeight / data.weights.length : 0
        const maxWeight = data.weights.length > 0 ? Math.max(...data.weights) : 0
        
        // Calculate progress trend (simplified)
        let progressTrend: 'up' | 'down' | 'stable' | 'new' = 'new'
        if (data.weights.length > 1) {
          const recentWeights = data.weights.slice(-3) // Last 3 workouts
          const earlierWeights = data.weights.slice(0, -3)
          
          if (earlierWeights.length > 0) {
            const recentAvg = recentWeights.reduce((a, b) => a + b, 0) / recentWeights.length
            const earlierAvg = earlierWeights.reduce((a, b) => a + b, 0) / earlierWeights.length
            
            if (recentAvg > earlierAvg * 1.05) progressTrend = 'up'
            else if (recentAvg < earlierAvg * 0.95) progressTrend = 'down'
            else progressTrend = 'stable'
          }
        }

        return {
          exercise_id: id,
          exercise_name: data.name,
          total_workouts: data.workouts.size,
          total_sets: data.sets,
          total_reps: data.totalReps,
          total_weight: data.totalWeight,
          avg_weight: avgWeight,
          max_weight: maxWeight,
          last_performed: data.lastPerformed,
          progress_trend: progressTrend
        }
      })

      setStats(statsData)
    } catch (error) {
      console.error('Error loading exercise stats:', error)
      setError('Failed to load exercise statistics')
    } finally {
      setLoading(false)
    }
  }

  const getSortedStats = () => {
    const sorted = [...stats]
    switch (sortBy) {
      case 'frequency':
        return sorted.sort((a, b) => b.total_workouts - a.total_workouts)
      case 'recent':
        return sorted.sort((a, b) => new Date(b.last_performed).getTime() - new Date(a.last_performed).getTime())
      case 'progress':
        return sorted.sort((a, b) => {
          const trendOrder = { up: 3, stable: 2, down: 1, new: 0 }
          return trendOrder[b.progress_trend] - trendOrder[a.progress_trend]
        })
      default:
        return sorted
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return ''
      case 'down': return ''
      case 'stable': return ''
      case 'new': return ''
      default: return ''
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400'
      case 'down': return 'text-red-600 dark:text-red-400'
      case 'stable': return 'text-blue-600 dark:text-blue-400'
      case 'new': return 'text-purple-600 dark:text-purple-400'
      default: return 'text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-lg border border-border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg shadow-lg border border-border p-6">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg shadow-lg border border-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 sm:mb-0">Exercise Statistics</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Time Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="px-3 py-1 border border-border bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-ring focus:border-ring"
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="3months">Last 3 Months</option>
          </select>

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border border-border bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-ring focus:border-ring"
          >
            <option value="frequency">Most Frequent</option>
            <option value="recent">Most Recent</option>
            <option value="progress">Best Progress</option>
          </select>
        </div>
      </div>

      {stats.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No exercise data found for the selected time period.</p>
          <p className="text-sm mt-2">Start logging workouts to see statistics!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.length}</div>
              <div className="text-xs text-muted-foreground">Exercises</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.reduce((sum, stat) => sum + stat.total_workouts, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Workouts</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.reduce((sum, stat) => sum + stat.total_sets, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Sets</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">
                {Math.round(stats.reduce((sum, stat) => sum + stat.total_weight, 0)).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Weight (lbs)</div>
            </div>
          </div>

          {/* Exercise List */}
          <div className="space-y-3">
            {getSortedStats().slice(0, 10).map((stat) => (
              <div key={stat.exercise_id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-foreground">{stat.exercise_name}</h3>
                    <span className={'text-sm ' + getTrendColor(stat.progress_trend)}>
                      {getTrendIcon(stat.progress_trend)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>{stat.total_workouts} workouts</span>
                    <span>{stat.total_sets} sets</span>
                    <span>{stat.total_reps.toLocaleString()} reps</span>
                    {stat.max_weight > 0 && <span>Max: {stat.max_weight}lbs</span>}
                    <span>Last: {formatDate(stat.last_performed)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {stats.length > 10 && (
            <div className="text-center text-sm text-muted-foreground mt-4">
              Showing top 10 exercises. Total: {stats.length} exercises tracked.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
