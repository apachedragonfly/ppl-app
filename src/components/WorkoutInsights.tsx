'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Goal {
  id: string
  title: string
  description: string
  target_value: number
  current_value: number
  unit: string
  target_date: string
  category: 'strength' | 'volume' | 'frequency' | 'endurance'
  created_at: string
  achieved: boolean
}

interface Insight {
  id: string
  type: 'achievement' | 'recommendation' | 'warning' | 'milestone'
  title: string
  description: string
  action?: string
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

interface WorkoutInsightsProps {
  userId?: string
}

export default function WorkoutInsights({ userId }: WorkoutInsightsProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_value: 0,
    unit: 'kg',
    target_date: '',
    category: 'strength' as Goal['category']
  })

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id

      if (!targetUserId) {
        throw new Error('User not authenticated')
      }

      // Load goals (for now we'll simulate this since we don't have the table yet)
      const mockGoals: Goal[] = [
        {
          id: '1',
          title: 'Bench Press 100kg',
          description: 'Achieve a 100kg bench press',
          target_value: 100,
          current_value: 85,
          unit: 'kg',
          target_date: '2024-12-31',
          category: 'strength',
          created_at: '2024-01-01',
          achieved: false
        },
        {
          id: '2',
          title: 'Workout 4x per week',
          description: 'Maintain consistent workout frequency',
          target_value: 4,
          current_value: 3.2,
          unit: 'workouts/week',
          target_date: '2024-12-31',
          category: 'frequency',
          created_at: '2024-01-01',
          achieved: false
        }
      ]

      // Generate insights based on recent workout data
      const insights = await generateInsights(targetUserId)

      setGoals(mockGoals)
      setInsights(insights)
    } catch (error) {
      console.error('Error loading insights data:', error)
      setError('Failed to load insights data')
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = async (targetUserId: string): Promise<Insight[]> => {
    try {
      // Fetch recent workout data
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const { data: workouts, error } = await supabase
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
        .gte('workout_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('workout_date', { ascending: false })

      if (error) throw error

      const insights: Insight[] = []

      // Analyze workout frequency
      const workoutCount = workouts?.length || 0
      const avgWorkoutsPerWeek = (workoutCount / 4.3) // ~4.3 weeks in 30 days

      if (avgWorkoutsPerWeek < 2) {
        insights.push({
          id: 'freq-low',
          type: 'warning',
          title: 'Low Workout Frequency',
          description: `You've averaged ${avgWorkoutsPerWeek.toFixed(1)} workouts per week. Consider increasing to 3-4 for optimal results.`,
          action: 'Schedule more workout sessions',
          priority: 'high',
          created_at: new Date().toISOString()
        })
      } else if (avgWorkoutsPerWeek >= 4) {
        insights.push({
          id: 'freq-high',
          type: 'achievement',
          title: 'Excellent Consistency!',
          description: `Great job maintaining ${avgWorkoutsPerWeek.toFixed(1)} workouts per week!`,
          priority: 'low',
          created_at: new Date().toISOString()
        })
      }

      // Analyze muscle group balance
      const muscleGroupCounts: Record<string, number> = {}
      workouts?.forEach(workout => {
        workout.workout_logs?.forEach((log: any) => {
          const muscleGroup = log.exercises?.muscle_group || 'Unknown'
          muscleGroupCounts[muscleGroup] = (muscleGroupCounts[muscleGroup] || 0) + log.sets
        })
      })

      const totalSets = Object.values(muscleGroupCounts).reduce((sum, count) => sum + count, 0)
      const imbalances = Object.entries(muscleGroupCounts)
        .map(([muscle, count]) => ({ muscle, percentage: (count / totalSets) * 100 }))
        .filter(({ percentage }) => percentage < 10 || percentage > 40)

      if (imbalances.length > 0) {
        const underworked = imbalances.filter(({ percentage }) => percentage < 10)
        const overworked = imbalances.filter(({ percentage }) => percentage > 40)

        if (underworked.length > 0) {
          insights.push({
            id: 'muscle-balance',
            type: 'recommendation',
            title: 'Muscle Group Imbalance',
            description: `Consider adding more ${underworked.map(m => m.muscle).join(', ')} exercises to your routine.`,
            action: 'Balance your training',
            priority: 'medium',
            created_at: new Date().toISOString()
          })
        }
      }

      // Analyze progress trends
      const exerciseProgress: Record<string, number[]> = {}
      workouts?.forEach(workout => {
        workout.workout_logs?.forEach((log: any) => {
          const exerciseName = log.exercises?.name
          if (exerciseName) {
            if (!exerciseProgress[exerciseName]) {
              exerciseProgress[exerciseName] = []
            }
            exerciseProgress[exerciseName].push(log.weight_kg)
          }
        })
      })

      Object.entries(exerciseProgress).forEach(([exerciseName, weights]) => {
        if (weights.length >= 3) {
          const firstHalf = weights.slice(0, Math.floor(weights.length / 2))
          const secondHalf = weights.slice(Math.floor(weights.length / 2))
          const firstAvg = firstHalf.reduce((sum, w) => sum + w, 0) / firstHalf.length
          const secondAvg = secondHalf.reduce((sum, w) => sum + w, 0) / secondHalf.length
          const improvement = ((secondAvg - firstAvg) / firstAvg) * 100

          if (improvement > 10) {
            insights.push({
              id: `progress-${exerciseName}`,
              type: 'achievement',
              title: 'Great Progress!',
              description: `Your ${exerciseName} has improved by ${improvement.toFixed(1)}% this month!`,
              priority: 'low',
              created_at: new Date().toISOString()
            })
          } else if (improvement < -5) {
            insights.push({
              id: `decline-${exerciseName}`,
              type: 'warning',
              title: 'Performance Decline',
              description: `Your ${exerciseName} performance has declined by ${Math.abs(improvement).toFixed(1)}%. Consider reviewing your form or recovery.`,
              action: 'Review technique and recovery',
              priority: 'medium',
              created_at: new Date().toISOString()
            })
          }
        }
      })

      // Check for milestones
      const totalVolume = workouts?.reduce((sum, workout) => {
        return sum + (workout.workout_logs?.reduce((logSum: number, log: any) => {
          return logSum + (log.sets * log.reps * log.weight_kg)
        }, 0) || 0)
      }, 0) || 0

      if (totalVolume > 50000) {
        insights.push({
          id: 'volume-milestone',
          type: 'milestone',
          title: 'Volume Milestone!',
          description: `You've lifted over ${Math.round(totalVolume / 1000)}k kg this month!`,
          priority: 'low',
          created_at: new Date().toISOString()
        })
      }

      // Rest day recommendations
      const lastWorkout = workouts?.[0]
      if (lastWorkout) {
        const daysSinceLastWorkout = Math.floor(
          (Date.now() - new Date(lastWorkout.workout_date).getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceLastWorkout >= 3) {
          insights.push({
            id: 'rest-long',
            type: 'recommendation',
            title: 'Time for a Workout',
            description: `It's been ${daysSinceLastWorkout} days since your last workout. Consider getting back to training!`,
            action: 'Schedule a workout',
            priority: 'medium',
            created_at: new Date().toISOString()
          })
        } else if (daysSinceLastWorkout === 0) {
          const workoutsToday = workouts.filter(w => 
            new Date(w.workout_date).toDateString() === new Date().toDateString()
          ).length

          if (workoutsToday >= 2) {
            insights.push({
              id: 'overtraining',
              type: 'warning',
              title: 'Consider Rest',
              description: 'You\'ve already worked out twice today. Make sure to allow adequate recovery time.',
              action: 'Take a rest day',
              priority: 'medium',
              created_at: new Date().toISOString()
            })
          }
        }
      }

      return insights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

    } catch (error) {
      console.error('Error generating insights:', error)
      return []
    }
  }

  const createGoal = async () => {
    if (!newGoal.title.trim()) return

    // For now, we'll just add to local state since we don't have the database table
    const goal: Goal = {
      id: Date.now().toString(),
      ...newGoal,
      current_value: 0,
      achieved: false,
      created_at: new Date().toISOString()
    }

    setGoals([...goals, goal])
    setNewGoal({
      title: '',
      description: '',
      target_value: 0,
      unit: 'kg',
      target_date: '',
      category: 'strength'
    })
    setShowCreateGoal(false)
  }

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'achievement': return '🏆'
      case 'recommendation': return '💡'
      case 'warning': return '⚠️'
      case 'milestone': return '🎯'
      default: return '📊'
    }
  }

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'achievement': return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
      case 'recommendation': return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
      case 'warning': return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
      case 'milestone': return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20'
      default: return 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getPriorityColor = (priority: Insight['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getCategoryIcon = (category: Goal['category']) => {
    switch (category) {
      case 'strength': return '💪'
      case 'volume': return '📊'
      case 'frequency': return '📅'
      case 'endurance': return '🏃'
      default: return '🎯'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Workout Insights</h2>
          <p className="text-muted-foreground">AI-powered recommendations and goal tracking</p>
        </div>
        <button
          onClick={() => setShowCreateGoal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
        >
          Add Goal
        </button>
      </div>

      {/* Goals */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Your Goals</h3>
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground text-lg mb-4">No goals set yet</div>
            <button
              onClick={() => setShowCreateGoal(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
            >
              Set Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const progress = (goal.current_value / goal.target_value) * 100
              const daysUntilTarget = Math.ceil(
                (new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              )
              
              return (
                <div key={goal.id} className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{getCategoryIcon(goal.category)}</span>
                      <div>
                        <h4 className="font-semibold text-foreground">{goal.title}</h4>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      </div>
                    </div>
                    {goal.achieved && (
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                        ✓ Achieved
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">
                        {goal.current_value} / {goal.target_value} {goal.unit}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress >= 100 ? 'bg-green-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progress.toFixed(1)}% complete</span>
                      <span>
                        {daysUntilTarget > 0 ? `${daysUntilTarget} days left` : 'Overdue'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Smart Insights</h3>
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground text-lg mb-4">No insights available</div>
            <p className="text-sm text-muted-foreground">
              Keep logging workouts to get personalized recommendations.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div 
                key={insight.id} 
                className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{insight.title}</h4>
                      <span className={`text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                        {insight.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                    {insight.action && (
                      <div className="text-xs font-medium text-primary">
                        💡 {insight.action}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {showCreateGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background border border-border rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Create Goal</h2>
              <button
                onClick={() => setShowCreateGoal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                  placeholder="e.g., Bench Press 100kg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                  rows={3}
                  placeholder="Describe your goal..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Target Value *
                  </label>
                  <input
                    type="number"
                    value={newGoal.target_value}
                    onChange={(e) => setNewGoal({ ...newGoal, target_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                    min="0"
                    step="0.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Unit
                  </label>
                  <select
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                    <option value="reps">reps</option>
                    <option value="minutes">minutes</option>
                    <option value="workouts/week">workouts/week</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as Goal['category'] })}
                    className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                  >
                    <option value="strength">Strength</option>
                    <option value="volume">Volume</option>
                    <option value="frequency">Frequency</option>
                    <option value="endurance">Endurance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={createGoal}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Create Goal
                </button>
                <button
                  onClick={() => setShowCreateGoal(false)}
                  className="px-4 py-2 border border-border text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 