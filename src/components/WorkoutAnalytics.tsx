'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Workout, Exercise } from '@/types'
import { formatDateForDB } from '@/lib/utils'

interface WorkoutAnalyticsProps {
  userId?: string
}

interface AnalyticsData {
  totalWorkouts: number
  totalSets: number
  totalReps: number
  totalVolume: number
  averageWorkoutDuration: number
  workoutFrequency: number
  currentStreak: number
  longestStreak: number
  favoriteExercises: Array<{
    name: string
    count: number
    totalVolume: number
    averageWeight: number
  }>
  weeklyProgress: Array<{
    week: string
    workouts: number
    volume: number
    duration: number
  }>
  exerciseProgress: Array<{
    exerciseName: string
    dates: string[]
    weights: number[]
    volumes: number[]
    trend: 'improving' | 'declining' | 'stable'
    improvement: number
  }>
  muscleGroupDistribution: Array<{
    muscleGroup: string
    count: number
    percentage: number
  }>
  workoutTypeDistribution: Array<{
    type: string
    count: number
    percentage: number
  }>
  personalRecords: Array<{
    exerciseName: string
    maxWeight: number
    maxVolume: number
    maxReps: number
    achievedDate: string
  }>
}

export default function WorkoutAnalytics({ userId }: WorkoutAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '6m' | '1y' | 'all'>('90d')
  const [selectedMetric, setSelectedMetric] = useState<'volume' | 'frequency' | 'strength'>('volume')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange, userId])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id

      if (!targetUserId) {
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

      // Fetch workouts with logs
      let workoutsQuery = supabase
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
        .eq('user_id', targetUserId)
        .order('date', { ascending: false })

      if (startDate) {
        workoutsQuery = workoutsQuery.gte('date', formatDateForDB(startDate))
      }

      const { data: workouts, error: workoutsError } = await workoutsQuery

      if (workoutsError) throw workoutsError

      const analytics = calculateAnalytics(workouts || [])
      setAnalyticsData(analytics)

    } catch (error) {
      console.error('Error loading analytics:', error)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (workouts: any[]): AnalyticsData => {
    const totalWorkouts = workouts.length
    const totalSets = workouts.reduce((sum, w) => sum + (w.workout_logs?.reduce((s: number, l: any) => s + l.sets, 0) || 0), 0)
    const totalReps = workouts.reduce((sum, w) => sum + (w.workout_logs?.reduce((s: number, l: any) => s + (l.sets * l.reps), 0) || 0), 0)
    const totalVolume = workouts.reduce((sum, w) => sum + (w.workout_logs?.reduce((s: number, l: any) => s + (l.sets * l.reps * l.weight_kg), 0) || 0), 0)

    // Calculate average workout duration (field doesn't exist in current schema, return 0)
    const averageWorkoutDuration = 0

    // Calculate workout frequency (workouts per week)
    const oldestWorkout = workouts[workouts.length - 1]
    const daysSinceStart = oldestWorkout 
      ? Math.max(1, Math.floor((Date.now() - new Date(oldestWorkout.date).getTime()) / (1000 * 60 * 60 * 24)))
      : 1
    const workoutFrequency = (totalWorkouts / daysSinceStart) * 7

    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreaks(workouts)

    // Calculate favorite exercises
    const exerciseStats: Record<string, { count: number; totalVolume: number; totalWeight: number; weightCount: number }> = {}
    
    workouts.forEach(workout => {
      workout.workout_logs?.forEach((log: any) => {
        const exerciseName = log.exercises?.name || 'Unknown Exercise'
        if (!exerciseStats[exerciseName]) {
          exerciseStats[exerciseName] = { count: 0, totalVolume: 0, totalWeight: 0, weightCount: 0 }
        }
        exerciseStats[exerciseName].count += log.sets
        exerciseStats[exerciseName].totalVolume += log.sets * log.reps * log.weight_kg
        if (log.weight_kg > 0) {
          exerciseStats[exerciseName].totalWeight += log.weight_kg
          exerciseStats[exerciseName].weightCount += 1
        }
      })
    })

    const favoriteExercises = Object.entries(exerciseStats)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        totalVolume: stats.totalVolume,
        averageWeight: stats.weightCount > 0 ? stats.totalWeight / stats.weightCount : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Calculate weekly progress
    const weeklyProgress = calculateWeeklyProgress(workouts)

    // Calculate exercise progress and trends
    const exerciseProgress = calculateExerciseProgress(workouts)

    // Calculate muscle group distribution
    const muscleGroupStats: Record<string, number> = {}
    workouts.forEach(workout => {
      workout.workout_logs?.forEach((log: any) => {
        const muscleGroup = log.exercises?.muscle_group || 'Unknown'
        muscleGroupStats[muscleGroup] = (muscleGroupStats[muscleGroup] || 0) + log.sets
      })
    })

    const totalMuscleGroupSets = Object.values(muscleGroupStats).reduce((sum, count) => sum + count, 0)
    const muscleGroupDistribution = Object.entries(muscleGroupStats)
      .map(([muscleGroup, count]) => ({
        muscleGroup,
        count,
        percentage: (count / totalMuscleGroupSets) * 100
      }))
      .sort((a, b) => b.count - a.count)

    // Calculate workout type distribution
    const workoutTypeStats: Record<string, number> = {}
    workouts.forEach(workout => {
      const type = workout.type || 'Unknown'
      workoutTypeStats[type] = (workoutTypeStats[type] || 0) + 1
    })

    const workoutTypeDistribution = Object.entries(workoutTypeStats)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / totalWorkouts) * 100
      }))
      .sort((a, b) => b.count - a.count)

    // Calculate personal records
    const personalRecords = calculatePersonalRecords(workouts)

    return {
      totalWorkouts,
      totalSets,
      totalReps,
      totalVolume,
      averageWorkoutDuration,
      workoutFrequency,
      currentStreak,
      longestStreak,
      favoriteExercises,
      weeklyProgress,
      exerciseProgress,
      muscleGroupDistribution,
      workoutTypeDistribution,
      personalRecords
    }
  }

  const calculateStreaks = (workouts: any[]) => {
    if (workouts.length === 0) return { currentStreak: 0, longestStreak: 0 }

    const workoutDates = workouts
      .map(w => new Date(w.date).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()

    // Calculate current streak
    if (workoutDates.includes(today) || workoutDates.includes(yesterday)) {
      let streakDate = new Date()
      if (!workoutDates.includes(today)) {
        streakDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
      }

      while (workoutDates.includes(streakDate.toDateString())) {
        currentStreak++
        streakDate = new Date(streakDate.getTime() - 24 * 60 * 60 * 1000)
      }
    }

    // Calculate longest streak
    for (let i = 0; i < workoutDates.length; i++) {
      const currentDate = new Date(workoutDates[i])
      const nextDate = i < workoutDates.length - 1 ? new Date(workoutDates[i + 1]) : null
      
      tempStreak = 1

      if (nextDate) {
        const dayDiff = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24))
        if (dayDiff === 1) {
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else {
          tempStreak = 1
        }
      }
      
      longestStreak = Math.max(longestStreak, tempStreak)
    }

    return { currentStreak, longestStreak }
  }

  const calculateWeeklyProgress = (workouts: any[]) => {
    const weeklyData: Record<string, { workouts: number; volume: number; duration: number }> = {}

    workouts.forEach(workout => {
      const workoutDate = new Date(workout.date)
      const weekStart = new Date(workoutDate)
      weekStart.setDate(workoutDate.getDate() - workoutDate.getDay())
      const weekKey = formatDateForDB(weekStart)

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { workouts: 0, volume: 0, duration: 0 }
      }

      weeklyData[weekKey].workouts += 1
      weeklyData[weekKey].volume += workout.workout_logs?.reduce((sum: number, log: any) => 
        sum + (log.sets * log.reps * log.weight_kg), 0) || 0
      weeklyData[weekKey].duration += 0 // duration_minutes field doesn't exist in current schema
    })

    return Object.entries(weeklyData)
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12) // Last 12 weeks
  }

  const calculateExerciseProgress = (workouts: any[]) => {
    const exerciseData: Record<string, Array<{ date: string; weight: number; volume: number }>> = {}

    workouts.forEach(workout => {
      workout.workout_logs?.forEach((log: any) => {
        const exerciseName = log.exercises?.name || 'Unknown Exercise'
        if (!exerciseData[exerciseName]) {
          exerciseData[exerciseName] = []
        }

        exerciseData[exerciseName].push({
          date: workout.date,
          weight: log.weight_kg,
          volume: log.sets * log.reps * log.weight_kg
        })
      })
    })

    return Object.entries(exerciseData)
      .filter(([_, data]) => data.length >= 3) // Only exercises with at least 3 data points
      .map(([exerciseName, data]) => {
        const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        const dates = sortedData.map(d => d.date)
        const weights = sortedData.map(d => d.weight)
        const volumes = sortedData.map(d => d.volume)

        // Calculate trend
        const firstHalf = weights.slice(0, Math.floor(weights.length / 2))
        const secondHalf = weights.slice(Math.floor(weights.length / 2))
        const firstAvg = firstHalf.reduce((sum, w) => sum + w, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, w) => sum + w, 0) / secondHalf.length
        const improvement = ((secondAvg - firstAvg) / firstAvg) * 100

        let trend: 'improving' | 'declining' | 'stable' = 'stable'
        if (improvement > 5) trend = 'improving'
        else if (improvement < -5) trend = 'declining'

        return {
          exerciseName,
          dates,
          weights,
          volumes,
          trend,
          improvement
        }
      })
      .sort((a, b) => Math.abs(b.improvement) - Math.abs(a.improvement))
      .slice(0, 10)
  }

  const calculatePersonalRecords = (workouts: any[]) => {
    const exerciseRecords: Record<string, { maxWeight: number; maxVolume: number; maxReps: number; achievedDate: string }> = {}

    workouts.forEach(workout => {
      workout.workout_logs?.forEach((log: any) => {
        const exerciseName = log.exercises?.name || 'Unknown Exercise'
        const volume = log.sets * log.reps * log.weight_kg

        if (!exerciseRecords[exerciseName]) {
          exerciseRecords[exerciseName] = {
            maxWeight: log.weight_kg,
            maxVolume: volume,
            maxReps: log.reps,
            achievedDate: workout.date
          }
        } else {
          const record = exerciseRecords[exerciseName]
          if (log.weight_kg > record.maxWeight) {
            record.maxWeight = log.weight_kg
            record.achievedDate = workout.date
          }
          if (volume > record.maxVolume) {
            record.maxVolume = volume
          }
          if (log.reps > record.maxReps) {
            record.maxReps = log.reps
          }
        }
      })
    })

    return Object.entries(exerciseRecords)
      .map(([exerciseName, record]) => ({ exerciseName, ...record }))
      .sort((a, b) => b.maxWeight - a.maxWeight)
      .slice(0, 10)
  }

  const formatNumber = (num: number, decimals: number = 0) => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
        {error}
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg">No workout data available</div>
        <p className="text-sm text-muted-foreground mt-2">
          Start logging workouts to see your analytics and progress.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workout Analytics</h1>
          <p className="text-muted-foreground">Track your progress and performance over time</p>
        </div>
        
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
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Workouts</p>
              <p className="text-2xl font-bold text-foreground">{formatNumber(analyticsData.totalWorkouts)}</p>
            </div>
            <div className="text-2xl">🏋️</div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">
              {formatNumber(analyticsData.workoutFrequency, 1)} per week
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
              <p className="text-2xl font-bold text-foreground">{formatVolume(analyticsData.totalVolume)}</p>
            </div>
            <div className="text-2xl">💪</div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">
              {formatNumber(analyticsData.totalSets)} sets • {formatNumber(analyticsData.totalReps)} reps
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold text-foreground">{analyticsData.currentStreak}</p>
            </div>
            <div className="text-2xl">🔥</div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">
              Longest: {analyticsData.longestStreak} days
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
              <p className="text-2xl font-bold text-foreground">
                {formatNumber(analyticsData.averageWorkoutDuration)}m
              </p>
            </div>
            <div className="text-2xl">⏱️</div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">
              Per workout
            </p>
          </div>
        </div>
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Progress</h3>
          <div className="space-y-3">
            {analyticsData.weeklyProgress.slice(-8).map((week, index) => (
              <div key={week.week} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-muted-foreground w-20">
                    Week {index + 1}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (week.workouts / Math.max(...analyticsData.weeklyProgress.map(w => w.workouts))) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm font-medium text-foreground">
                  {week.workouts} workouts
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exercise Progress */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Exercise Progress</h3>
          <div className="space-y-3">
            {analyticsData.exerciseProgress.slice(0, 6).map((exercise) => (
              <div key={exercise.exerciseName} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {exercise.exerciseName}
                    </span>
                    <span className="text-lg">
                      {getTrendIcon(exercise.trend)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.abs(exercise.improvement).toFixed(1)}% {exercise.improvement >= 0 ? 'increase' : 'decrease'}
                  </div>
                </div>
                <div className={`text-sm font-medium ${getTrendColor(exercise.trend)}`}>
                  {formatWeight(exercise.weights[exercise.weights.length - 1])}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Favorite Exercises */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Most Performed</h3>
          <div className="space-y-3">
            {analyticsData.favoriteExercises.slice(0, 8).map((exercise, index) => (
              <div key={exercise.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-muted-foreground w-6">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {exercise.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatVolume(exercise.totalVolume)} total
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-foreground">
                  {exercise.count} sets
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Muscle Group Distribution */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Muscle Groups</h3>
          <div className="space-y-3">
            {analyticsData.muscleGroupDistribution.slice(0, 8).map((group) => (
              <div key={group.muscleGroup} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all duration-300"
                      style={{ width: `${group.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  <span className="text-sm font-medium text-foreground">
                    {group.muscleGroup}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {group.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Records */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Personal Records</h3>
          <div className="space-y-3">
            {analyticsData.personalRecords.slice(0, 8).map((record, index) => (
              <div key={record.exerciseName} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-lg">
                    {index < 3 ? '🏆' : '🥇'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {record.exerciseName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(record.achievedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-foreground">
                  {formatWeight(record.maxWeight)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workout Type Distribution */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Workout Type Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analyticsData.workoutTypeDistribution.map((type) => (
            <div key={type.type} className="text-center">
              <div className="text-2xl mb-2">
                {type.type === 'Push' ? '🚀' : 
                 type.type === 'Pull' ? '🪝' : 
                 type.type === 'Legs' ? '🦵' : 
                 type.type === 'Upper' ? '💪' :
                 type.type === 'Lower' ? '🏃' :
                 type.type === 'Full Body' ? '🏋️' : '💯'}
              </div>
              <div className="text-sm font-medium text-foreground">{type.type}</div>
              <div className="text-2xl font-bold text-primary">{type.count}</div>
              <div className="text-xs text-muted-foreground">{type.percentage.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 