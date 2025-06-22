'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Exercise, PersonalRecord } from '@/types'

interface ExerciseStats {
  exercise: Exercise
  totalWorkouts: number
  totalSets: number
  totalReps: number
  totalVolume: number
  avgWeight: number
  maxWeight: number
  lastPerformed?: string
  firstPerformed?: string
  personalRecords: PersonalRecord[]
  recentTrend: 'improving' | 'declining' | 'stable' | 'insufficient_data'
  usageFrequency: number
}

interface ExerciseComparisonProps {
  exercises: Exercise[]
  userId: string
  onClose: () => void
}

export default function ExerciseComparison({ exercises, userId, onClose }: ExerciseComparisonProps) {
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '6m' | 'all'>('90d')
  const [sortBy, setSortBy] = useState<'name' | 'volume' | 'frequency' | 'max_weight' | 'workouts'>('volume')

  useEffect(() => {
    loadExerciseComparison()
  }, [exercises, userId, timeRange])

  const loadExerciseComparison = async () => {
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

      const stats: ExerciseStats[] = []

      for (const exercise of exercises) {
        // Get workout logs for this exercise
        const { data: workoutLogs, error: logsError } = await supabase
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

        if (logsError) throw logsError

        // Get personal records for this exercise
        const { data: personalRecords, error: prError } = await supabase
          .from('exercise_personal_records')
          .select('*')
          .eq('user_id', userId)
          .eq('exercise_id', exercise.id)
          .order('achieved_date', { ascending: false })

        if (prError) throw prError

        // Calculate statistics
        const historyData = workoutLogs?.map(log => ({
          date: (log as any).workouts.date,
          workout_type: (log as any).workouts.type,
          sets: log.sets,
          reps: log.reps,
          weight_kg: log.weight_kg,
          workout_id: log.workout_id
        })) || []

        let exerciseStat: ExerciseStats = {
          exercise,
          totalWorkouts: 0,
          totalSets: 0,
          totalReps: 0,
          totalVolume: 0,
          avgWeight: 0,
          maxWeight: 0,
          personalRecords: personalRecords || [],
          recentTrend: 'insufficient_data',
          usageFrequency: 0
        }

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

          exerciseStat = {
            ...exerciseStat,
            totalWorkouts,
            totalSets,
            totalReps,
            totalVolume,
            avgWeight: weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0,
            maxWeight: weights.length > 0 ? Math.max(...weights) : 0,
            lastPerformed: historyData[0]?.date,
            firstPerformed: historyData[historyData.length - 1]?.date,
            recentTrend,
            usageFrequency: frequency
          }
        }

        stats.push(exerciseStat)
      }

      // Sort stats
      stats.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.exercise.name.localeCompare(b.exercise.name)
          case 'volume':
            return b.totalVolume - a.totalVolume
          case 'frequency':
            return b.usageFrequency - a.usageFrequency
          case 'max_weight':
            return b.maxWeight - a.maxWeight
          case 'workouts':
            return b.totalWorkouts - a.totalWorkouts
          default:
            return 0
        }
      })

      setExerciseStats(stats)
    } catch (error) {
      console.error('Error loading exercise comparison:', error)
      setError('Failed to load exercise comparison data')
    } finally {
      setLoading(false)
    }
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

  const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'Never'
  }

  const getFrequencyText = (frequency: number) => {
    if (frequency >= 2) return `${frequency.toFixed(1)}x/week (High)`
    if (frequency >= 1) return `${frequency.toFixed(1)}x/week (Moderate)`
    if (frequency >= 0.5) return `${frequency.toFixed(1)}x/week (Low)`
    return `${frequency.toFixed(1)}x/week (Very Low)`
  }

  const getBestPR = (prs: PersonalRecord[], type: PersonalRecord['record_type']) => {
    const pr = prs.find(p => p.record_type === type)
    if (!pr) return null
    
    switch (type) {
      case '1rm':
      case '3rm':
      case '5rm':
        return `${pr.weight_kg}kg × ${pr.reps}`
      case 'max_volume':
        return `${pr.total_volume?.toFixed(1)}kg`
      case 'max_reps':
        return pr.weight_kg ? `${pr.reps} @ ${pr.weight_kg}kg` : `${pr.reps} reps`
      case 'endurance':
        const minutes = Math.floor((pr.duration_seconds || 0) / 60)
        const seconds = (pr.duration_seconds || 0) % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
      default:
        return 'N/A'
    }
  }

  const getTopPerformer = (metric: keyof ExerciseStats) => {
    if (exerciseStats.length === 0) return null
    return exerciseStats.reduce((top, current) => {
      const topValue = typeof top[metric] === 'number' ? top[metric] as number : 0
      const currentValue = typeof current[metric] === 'number' ? current[metric] as number : 0
      return currentValue > topValue ? current : top
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Exercise Comparison</h2>
            <p className="text-sm text-muted-foreground">
              Comparing {exercises.length} exercises across key performance metrics
            </p>
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
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-border bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-ring focus:border-ring"
            >
              <option value="name">Sort by Name</option>
              <option value="volume">Sort by Volume</option>
              <option value="frequency">Sort by Frequency</option>
              <option value="max_weight">Sort by Max Weight</option>
              <option value="workouts">Sort by Workouts</option>
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
              <div className="text-foreground">Loading comparison data...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : exerciseStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg mb-2">No data available</p>
              <p className="text-sm">No workout history found for the selected exercises in this time period.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-secondary/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {exerciseStats.reduce((sum, stat) => sum + stat.totalWorkouts, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Workouts</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {Math.round(exerciseStats.reduce((sum, stat) => sum + stat.totalVolume, 0)).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Volume (kg)</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {getTopPerformer('maxWeight')?.maxWeight.toFixed(1) || 0}kg
                  </div>
                  <div className="text-xs text-muted-foreground">Highest Weight</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {getTopPerformer('usageFrequency')?.usageFrequency.toFixed(1) || 0}x
                  </div>
                  <div className="text-xs text-muted-foreground">Peak Frequency/Week</div>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/20">
                      <tr>
                        <th className="text-left p-4 font-medium text-foreground">Exercise</th>
                        <th className="text-center p-4 font-medium text-foreground">Workouts</th>
                        <th className="text-center p-4 font-medium text-foreground">Volume (kg)</th>
                        <th className="text-center p-4 font-medium text-foreground">Max Weight</th>
                        <th className="text-center p-4 font-medium text-foreground">Frequency</th>
                        <th className="text-center p-4 font-medium text-foreground">Trend</th>
                        <th className="text-center p-4 font-medium text-foreground">1RM</th>
                        <th className="text-center p-4 font-medium text-foreground">Last Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exerciseStats.map((stat, index) => (
                        <tr key={stat.exercise.id} className={index % 2 === 0 ? 'bg-secondary/5' : ''}>
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-foreground">{stat.exercise.name}</div>
                              <div className="text-sm text-muted-foreground">{stat.exercise.muscle_group}</div>
                            </div>
                          </td>
                          <td className="text-center p-4 text-foreground">
                            {stat.totalWorkouts}
                          </td>
                          <td className="text-center p-4 text-foreground">
                            {Math.round(stat.totalVolume).toLocaleString()}
                          </td>
                          <td className="text-center p-4 text-foreground">
                            {stat.maxWeight > 0 ? `${stat.maxWeight.toFixed(1)}kg` : 'N/A'}
                          </td>
                          <td className="text-center p-4">
                            <div className="text-sm text-foreground">
                              {stat.usageFrequency.toFixed(1)}x/week
                            </div>
                            <div className={`text-xs ${
                              stat.usageFrequency >= 2 ? 'text-green-600 dark:text-green-400' :
                              stat.usageFrequency >= 1 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {stat.usageFrequency >= 2 ? 'High' :
                               stat.usageFrequency >= 1 ? 'Moderate' : 'Low'}
                            </div>
                          </td>
                          <td className="text-center p-4">
                            <div className={`flex items-center justify-center space-x-1 ${getTrendColor(stat.recentTrend)}`}>
                              <span>{getTrendIcon(stat.recentTrend)}</span>
                              <span className="text-xs capitalize">
                                {stat.recentTrend.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="text-center p-4 text-foreground">
                            {getBestPR(stat.personalRecords, '1rm') || 'N/A'}
                          </td>
                          <td className="text-center p-4 text-sm text-muted-foreground">
                            {formatDate(stat.lastPerformed)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-4">Top Performers</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Highest Volume', stat: getTopPerformer('totalVolume'), value: (s: ExerciseStats) => `${Math.round(s.totalVolume).toLocaleString()}kg` },
                      { label: 'Most Frequent', stat: getTopPerformer('usageFrequency'), value: (s: ExerciseStats) => `${s.usageFrequency.toFixed(1)}x/week` },
                      { label: 'Heaviest Weight', stat: getTopPerformer('maxWeight'), value: (s: ExerciseStats) => `${s.maxWeight.toFixed(1)}kg` },
                      { label: 'Most Workouts', stat: getTopPerformer('totalWorkouts'), value: (s: ExerciseStats) => `${s.totalWorkouts} workouts` }
                    ].map(({ label, stat, value }) => (
                      <div key={label} className="flex items-center justify-between p-2 bg-secondary/10 rounded">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-foreground">
                            {stat?.exercise.name || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stat ? value(stat) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-4">Performance Insights</h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                        Most Consistent
                      </div>
                      <div className="text-blue-700 dark:text-blue-400">
                        {exerciseStats.find(s => s.recentTrend === 'stable')?.exercise.name || 
                         exerciseStats.find(s => s.usageFrequency > 0)?.exercise.name || 'None'}
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="font-medium text-green-800 dark:text-green-300 mb-1">
                        Most Improved
                      </div>
                      <div className="text-green-700 dark:text-green-400">
                        {exerciseStats.find(s => s.recentTrend === 'improving')?.exercise.name || 'None'}
                      </div>
                    </div>

                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                        Needs Attention
                      </div>
                      <div className="text-yellow-700 dark:text-yellow-400">
                        {exerciseStats.find(s => s.usageFrequency < 0.5)?.exercise.name || 
                         exerciseStats.find(s => s.recentTrend === 'declining')?.exercise.name || 'None'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 