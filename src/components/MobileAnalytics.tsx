'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MobileChart from './MobileChart'
import { Calendar, TrendingUp, Zap } from 'lucide-react'

interface MobileAnalyticsProps {
  userId: string
}

interface AnalyticsData {
  totalWorkouts: number
  totalVolume: number
  currentStreak: number
  weeklyProgress: { date: string; workouts: number; volume: number }[]
  exerciseProgress: { exercise: string; maxWeight: number; date: string }[]
  muscleGroups: { name: string; percentage: number; workouts: number }[]
}

export default function MobileAnalytics({ userId }: MobileAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchAnalyticsData()
    }
  }, [userId])

  const fetchAnalyticsData = async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      
      // Fetch workouts and logs
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          id, date, type, duration,
          workout_logs (
            sets, reps, weight_kg,
            exercise:exercises(name, muscle_group)
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (workoutsError) throw workoutsError

      // Process data
      const totalWorkouts = workouts?.length || 0
      const totalVolume = workouts?.reduce((sum, workout) => {
        return sum + (workout.workout_logs?.reduce((logSum: number, log: any) => {
          return logSum + (log.sets * log.reps * log.weight_kg)
        }, 0) || 0)
      }, 0) || 0

      // Calculate streak
      const sortedDates = workouts?.map(w => w.date).sort() || []
      let currentStreak = 0
      if (sortedDates.length > 0) {
        const today = new Date()
        let currentDate = new Date(today)
        currentDate.setDate(currentDate.getDate() - 1) // Start from yesterday
        
        for (let i = sortedDates.length - 1; i >= 0; i--) {
          const workoutDate = new Date(sortedDates[i])
          if (workoutDate.toDateString() === currentDate.toDateString()) {
            currentStreak++
            currentDate.setDate(currentDate.getDate() - 1)
          } else {
            break
          }
        }
      }

      // Weekly progress
      const weeklyProgress = generateWeeklyProgress(workouts || [])
      
      // Exercise progress (top 3 exercises by frequency)
      const exerciseFreq: Record<string, number> = {}
      const exerciseMaxWeight: Record<string, { weight: number; date: string }> = {}
      
      workouts?.forEach(workout => {
        workout.workout_logs?.forEach((log: any) => {
          const exerciseName = log.exercise?.name || 'Unknown'
          exerciseFreq[exerciseName] = (exerciseFreq[exerciseName] || 0) + 1
          
          if (!exerciseMaxWeight[exerciseName] || log.weight_kg > exerciseMaxWeight[exerciseName].weight) {
            exerciseMaxWeight[exerciseName] = { weight: log.weight_kg, date: workout.date }
          }
        })
      })

      const topExercises = Object.entries(exerciseFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([exercise, _]) => ({
          exercise,
          maxWeight: exerciseMaxWeight[exercise]?.weight || 0,
          date: exerciseMaxWeight[exercise]?.date || ''
        }))

      // Muscle groups
      const muscleGroups = calculateMuscleGroups(workouts || [])

      setData({
        totalWorkouts,
        totalVolume,
        currentStreak,
        weeklyProgress,
        exerciseProgress: topExercises,
        muscleGroups
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateWeeklyProgress = (workouts: any[]) => {
    const weeks: Record<string, { workouts: number; volume: number }> = {}
    
    workouts.forEach(workout => {
      const date = new Date(workout.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { workouts: 0, volume: 0 }
      }
      
      weeks[weekKey].workouts += 1
      weeks[weekKey].volume += workout.workout_logs?.reduce((sum: number, log: any) => {
        return sum + (log.sets * log.reps * log.weight_kg)
      }, 0) || 0
    })

    return Object.entries(weeks)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-8) // Last 8 weeks
  }

  const calculateMuscleGroups = (workouts: any[]) => {
    const groups: Record<string, number> = {}
    let totalSets = 0

    workouts.forEach(workout => {
      workout.workout_logs?.forEach((log: any) => {
        const muscleGroup = log.exercise?.muscle_group || 'Unknown'
        groups[muscleGroup] = (groups[muscleGroup] || 0) + log.sets
        totalSets += log.sets
      })
    })

    return Object.entries(groups)
      .map(([name, workouts]) => ({
        name,
        workouts,
        percentage: totalSets > 0 ? (workouts / totalSets) * 100 : 0
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)
  }

  const statsCards = [
    {
      title: 'Total Workouts',
      value: data?.totalWorkouts || 0,
      icon: Calendar,
      color: '#3b82f6',
      suffix: ''
    },
    {
      title: 'Total Volume',
      value: Math.round((data?.totalVolume || 0) / 1000),
      icon: TrendingUp,
      color: '#10b981',
      suffix: 'k kg'
    },
    {
      title: 'Current Streak',
      value: data?.currentStreak || 0,
      icon: Zap,
      color: '#f59e0b',
      suffix: 'days'
    }
  ]

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <div className="text-4xl mb-2">📊</div>
        <p>No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-card border border-border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                    <span className="text-sm text-muted-foreground ml-1">{stat.suffix}</span>
                  </p>
                </div>
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Weekly Progress Chart */}
      {data?.weeklyProgress && data.weeklyProgress.length > 0 && (
        <MobileChart
          data={data.weeklyProgress}
          title="Weekly Workouts"
          dataKey="workouts"
          color="#3b82f6"
          type="bar"
          height={180}
        />
      )}

      {/* Volume Progress Chart */}
      {data?.weeklyProgress && data.weeklyProgress.length > 0 && (
        <MobileChart
          data={data.weeklyProgress}
          title="Weekly Volume (kg)"
          dataKey="volume"
          color="#10b981"
          type="line"
          height={180}
        />
      )}

      {/* Top Exercises */}
      {data.exerciseProgress.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Exercises</h3>
          <div className="space-y-3">
            {data.exerciseProgress.map((exercise, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{exercise.exercise}</p>
                  <p className="text-sm text-muted-foreground">Max Weight</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{exercise.maxWeight}kg</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(exercise.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Muscle Groups */}
      {data.muscleGroups.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Muscle Group Focus</h3>
          <div className="space-y-3">
            {data.muscleGroups.map((group, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground">{group.name}</span>
                  <span className="text-muted-foreground">{group.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all duration-300"
                    style={{ width: `${group.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 