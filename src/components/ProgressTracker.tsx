'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Exercise } from '@/types'

interface ProgressData {
  date: string
  weight: number
  sets: number
  reps: number
  volume: number
  oneRepMax: number
}

interface ProgressTrackerProps {
  exercise: Exercise
  onClose: () => void
}

export default function ProgressTracker({ exercise, onClose }: ProgressTrackerProps) {
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '6m' | '1y' | 'all'>('90d')
  const [chartType, setChartType] = useState<'weight' | 'volume' | '1rm'>('weight')

  useEffect(() => {
    loadProgressData()
  }, [exercise.id, timeRange])

  const loadProgressData = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Calculate date range
      const now = new Date()
      let startDate: Date | null = null

      switch (timeRange) {
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case '6m':
          startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
          break
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        case 'all':
          startDate = null
          break
      }

      // Fetch workout logs for this exercise
      let query = supabase
        .from('workout_logs')
        .select(`
          *,
          workouts!inner (
            workout_date,
            user_id
          )
        `)
        .eq('exercise_id', exercise.id)
        .eq('workouts.user_id', user.id)
        .order('workouts(workout_date)', { ascending: true })

      if (startDate) {
        query = query.gte('workouts.workout_date', startDate.toISOString().split('T')[0])
      }

      const { data: logs, error: logsError } = await query

      if (logsError) throw logsError

      // Process data for charting
      const processedData: ProgressData[] = logs?.map(log => {
        const volume = log.sets * log.reps * log.weight_kg
        // Estimate 1RM using Epley formula: weight * (1 + reps/30)
        const oneRepMax = log.weight_kg * (1 + log.reps / 30)

        return {
          date: log.workouts.workout_date,
          weight: log.weight_kg,
          sets: log.sets,
          reps: log.reps,
          volume,
          oneRepMax
        }
      }) || []

      setProgressData(processedData)
    } catch (error) {
      console.error('Error loading progress data:', error)
      setError('Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    if (progressData.length === 0) {
      return {
        totalWorkouts: 0,
        maxWeight: 0,
        maxVolume: 0,
        max1RM: 0,
        avgWeight: 0,
        avgVolume: 0,
        totalSets: 0,
        totalReps: 0,
        improvement: 0,
        trend: 'stable' as 'improving' | 'declining' | 'stable'
      }
    }

    const totalWorkouts = progressData.length
    const maxWeight = Math.max(...progressData.map(d => d.weight))
    const maxVolume = Math.max(...progressData.map(d => d.volume))
    const max1RM = Math.max(...progressData.map(d => d.oneRepMax))
    const avgWeight = progressData.reduce((sum, d) => sum + d.weight, 0) / totalWorkouts
    const avgVolume = progressData.reduce((sum, d) => sum + d.volume, 0) / totalWorkouts
    const totalSets = progressData.reduce((sum, d) => sum + d.sets, 0)
    const totalReps = progressData.reduce((sum, d) => sum + d.reps, 0)

    // Calculate improvement trend
    const firstHalf = progressData.slice(0, Math.floor(progressData.length / 2))
    const secondHalf = progressData.slice(Math.floor(progressData.length / 2))
    
    if (firstHalf.length === 0 || secondHalf.length === 0) {
      return {
        totalWorkouts,
        maxWeight,
        maxVolume,
        max1RM,
        avgWeight,
        avgVolume,
        totalSets,
        totalReps,
        improvement: 0,
        trend: 'stable' as const
      }
    }

    const firstAvgWeight = firstHalf.reduce((sum, d) => sum + d.weight, 0) / firstHalf.length
    const secondAvgWeight = secondHalf.reduce((sum, d) => sum + d.weight, 0) / secondHalf.length
    const improvement = ((secondAvgWeight - firstAvgWeight) / firstAvgWeight) * 100

    let trend: 'improving' | 'declining' | 'stable' = 'stable'
    if (improvement > 5) trend = 'improving'
    else if (improvement < -5) trend = 'declining'

    return {
      totalWorkouts,
      maxWeight,
      maxVolume,
      max1RM,
      avgWeight,
      avgVolume,
      totalSets,
      totalReps,
      improvement,
      trend
    }
  }

  const getChartData = () => {
    switch (chartType) {
      case 'weight':
        return progressData.map(d => d.weight)
      case 'volume':
        return progressData.map(d => d.volume)
      case '1rm':
        return progressData.map(d => d.oneRepMax)
      default:
        return progressData.map(d => d.weight)
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
      case 'stable': return 'text-yellow-600 dark:text-yellow-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const stats = calculateStats()
  const chartData = getChartData()
  const maxChartValue = Math.max(...chartData)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{exercise.name}</h2>
            <p className="text-sm text-muted-foreground">Progress Tracking</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md text-red-700 dark:text-red-400">
              {error}
            </div>
          ) : progressData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-4">No progress data available</div>
              <p className="text-sm text-muted-foreground">
                Start logging workouts with this exercise to see your progress.
              </p>
            </div>
          ) : (
            <>
              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                    className="px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring text-sm"
                  >
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 3 Months</option>
                    <option value="6m">Last 6 Months</option>
                    <option value="1y">Last Year</option>
                    <option value="all">All Time</option>
                  </select>

                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as typeof chartType)}
                    className="px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring text-sm"
                  >
                    <option value="weight">Weight</option>
                    <option value="volume">Volume</option>
                    <option value="1rm">Estimated 1RM</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getTrendIcon(stats.trend)}</span>
                  <span className={`text-sm font-medium ${getTrendColor(stats.trend)}`}>
                    {Math.abs(stats.improvement).toFixed(1)}% {stats.improvement >= 0 ? 'increase' : 'decrease'}
                  </span>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground">Total Workouts</div>
                  <div className="text-2xl font-bold text-foreground">{stats.totalWorkouts}</div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground">Max Weight</div>
                  <div className="text-2xl font-bold text-foreground">{formatWeight(stats.maxWeight)}</div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground">Max Volume</div>
                  <div className="text-2xl font-bold text-foreground">{formatVolume(stats.maxVolume)}</div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground">Est. 1RM</div>
                  <div className="text-2xl font-bold text-foreground">{formatWeight(stats.max1RM)}</div>
                </div>
              </div>

              {/* Progress Chart */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {chartType === 'weight' ? 'Weight Progress' : 
                   chartType === 'volume' ? 'Volume Progress' : 
                   'Estimated 1RM Progress'}
                </h3>
                
                <div className="relative h-64">
                  <div className="absolute inset-0 flex items-end justify-between space-x-1">
                    {chartData.map((value, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="bg-primary rounded-t transition-all duration-300 hover:opacity-80 w-full"
                          style={{
                            height: `${(value / maxChartValue) * 100}%`,
                            minHeight: '4px'
                          }}
                          title={`${progressData[index].date}: ${
                            chartType === 'weight' ? formatWeight(value) :
                            chartType === 'volume' ? formatVolume(value) :
                            formatWeight(value)
                          }`}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                  <span>{progressData[0]?.date}</span>
                  <span>{progressData[progressData.length - 1]?.date}</span>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Performance Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Average Weight:</span>
                      <span className="text-sm font-medium text-foreground">{formatWeight(stats.avgWeight)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Average Volume:</span>
                      <span className="text-sm font-medium text-foreground">{formatVolume(stats.avgVolume)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Sets:</span>
                      <span className="text-sm font-medium text-foreground">{stats.totalSets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Reps:</span>
                      <span className="text-sm font-medium text-foreground">{stats.totalReps}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Recent Sessions</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {progressData.slice(-5).reverse().map((session, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {new Date(session.date).toLocaleDateString()}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatWeight(session.weight)} × {session.sets}×{session.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Workout History Table */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Workout History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-muted-foreground">Date</th>
                        <th className="text-left py-2 text-muted-foreground">Weight</th>
                        <th className="text-left py-2 text-muted-foreground">Sets</th>
                        <th className="text-left py-2 text-muted-foreground">Reps</th>
                        <th className="text-left py-2 text-muted-foreground">Volume</th>
                        <th className="text-left py-2 text-muted-foreground">Est. 1RM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progressData.slice(-10).reverse().map((session, index) => (
                        <tr key={index} className="border-b border-border/50">
                          <td className="py-2 text-foreground">
                            {new Date(session.date).toLocaleDateString()}
                          </td>
                          <td className="py-2 text-foreground">{formatWeight(session.weight)}</td>
                          <td className="py-2 text-foreground">{session.sets}</td>
                          <td className="py-2 text-foreground">{session.reps}</td>
                          <td className="py-2 text-foreground">{formatVolume(session.volume)}</td>
                          <td className="py-2 text-foreground">{formatWeight(session.oneRepMax)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 