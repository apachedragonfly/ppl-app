'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface WorkoutSuggestion {
  id: string
  exercise_name: string
  muscle_group: string
  reason: string
  confidence: number
  suggested_sets: number
  suggested_reps: number
  suggested_weight: number
  last_performed?: string
  progression_type: 'weight' | 'reps' | 'sets' | 'new'
}

interface AIWorkoutSuggestionsProps {
  userId: string
  workoutType: 'Push' | 'Pull' | 'Legs' | 'Upper' | 'Lower' | 'Full Body'
  onAddExercise: (exerciseId: string, exerciseName: string, sets: number, reps: number, weight: number) => void
  currentExercises: string[]
}

export default function AIWorkoutSuggestions({ 
  userId, 
  workoutType, 
  onAddExercise, 
  currentExercises 
}: AIWorkoutSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<string[]>([])

  useEffect(() => {
    generateSuggestions()
  }, [userId, workoutType, currentExercises])

  const generateSuggestions = async () => {
    setLoading(true)
    try {
      // Get user's workout history
      const { data: workoutHistory } = await supabase
        .from('workout_logs')
        .select(`
          *,
          exercises(name, muscle_group, equipment)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      // Get all available exercises
      const { data: allExercises } = await supabase
        .from('exercises')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('name')

      if (!allExercises) {
        console.warn('No exercises found')
        return
      }

      const suggestions = await analyzeAndSuggest(workoutHistory || [], allExercises, workoutType, currentExercises)
      setSuggestions(suggestions)
      
      const workoutInsights = generateWorkoutInsights(workoutHistory || [], workoutType)
      setInsights(workoutInsights)
    } catch (error) {
      console.error('Error generating suggestions:', error)
      // Set fallback suggestions for new users
      if (currentExercises.length === 0) {
        const fallbackSuggestions: WorkoutSuggestion[] = [
          {
            id: 'fallback-1',
            exercise_name: 'Bench Press',
            muscle_group: 'chest',
            reason: 'Great starter exercise for chest development',
            confidence: 70,
            suggested_sets: 3,
            suggested_reps: 10,
            suggested_weight: 20,
            progression_type: 'new'
          }
        ]
        setSuggestions(fallbackSuggestions)
      }
    } finally {
      setLoading(false)
    }
  }

  const analyzeAndSuggest = async (
    history: any[], 
    exercises: any[], 
    type: string, 
    current: string[]
  ): Promise<WorkoutSuggestion[]> => {
    const suggestions: WorkoutSuggestion[] = []
    
    // Define muscle groups for each workout type
    const muscleGroups: Record<string, string[]> = {
      'Push': ['chest', 'shoulders', 'triceps'],
      'Pull': ['back', 'biceps', 'rear_delts'],
      'Legs': ['quadriceps', 'hamstrings', 'glutes', 'calves'],
      'Upper': ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
      'Lower': ['quadriceps', 'hamstrings', 'glutes', 'calves'],
      'Full Body': ['chest', 'back', 'shoulders', 'quadriceps', 'hamstrings', 'glutes', 'biceps', 'triceps']
    }

    const targetMuscles = muscleGroups[type] || []
    
    // Get exercises for this workout type
    const relevantExercises = exercises.filter(ex => 
      targetMuscles.some((muscle: string) => 
        ex.muscle_group?.toLowerCase().includes(muscle) || 
        ex.name.toLowerCase().includes(muscle)
      )
    )

    // Analyze recent performance
    const exerciseStats = new Map()

    // Build exercise statistics
    history.forEach(log => {
      const key = log.exercise_id
      if (!exerciseStats.has(key)) {
        exerciseStats.set(key, {
          exercise: log.exercises,
          totalVolume: 0,
          lastPerformed: log.created_at,
          maxWeight: 0,
          avgReps: 0,
          totalSets: 0,
          frequency: 0
        })
      }
      
      const stats = exerciseStats.get(key)
      stats.totalVolume += (log.weight_kg || 0) * (log.reps || 0) * (log.sets || 0)
      stats.maxWeight = Math.max(stats.maxWeight, log.weight_kg || 0)
      stats.totalSets += log.sets || 0
      stats.frequency += 1
    })

    // 1. Suggest progression for frequently performed exercises
    for (const [exerciseId, stats] of exerciseStats) {
      if (current.includes(exerciseId)) continue
      
      const exercise = relevantExercises.find(ex => ex.id === exerciseId)
      if (!exercise) continue

      const daysSinceLastPerformed = Math.floor(
        (Date.now() - new Date(stats.lastPerformed).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceLastPerformed >= 3 && daysSinceLastPerformed <= 7) {
        // Suggest with progression
        const suggestedWeight = stats.maxWeight > 0 ? stats.maxWeight + 2.5 : 20
        const suggestedReps = Math.max(8, Math.min(12, stats.avgReps || 10))
        
        suggestions.push({
          id: exerciseId,
          exercise_name: exercise.name,
          muscle_group: exercise.muscle_group,
          reason: `Ready for progression - last performed ${daysSinceLastPerformed} days ago`,
          confidence: Math.min(95, 70 + (stats.frequency * 5)),
          suggested_sets: 3,
          suggested_reps: suggestedReps,
          suggested_weight: suggestedWeight,
          last_performed: stats.lastPerformed,
          progression_type: 'weight'
        })
      }
    }

    // 2. Suggest underworked muscle groups
    const recentWorkouts = history.slice(0, 10)
    const recentMuscles = new Set<string>()
    recentWorkouts.forEach(log => {
      if (log.exercises?.muscle_group) {
        recentMuscles.add(log.exercises.muscle_group.toLowerCase())
      }
    })

    const underworkedMuscles = targetMuscles.filter((muscle: string) => 
      !Array.from(recentMuscles).some((recent: string) => recent.includes(muscle))
    )

    underworkedMuscles.forEach((muscle: string) => {
      const muscleExercises = relevantExercises.filter(ex => 
        ex.muscle_group?.toLowerCase().includes(muscle) && 
        !current.includes(ex.id)
      )
      
      if (muscleExercises.length > 0) {
        const popularExercise = muscleExercises[Math.floor(Math.random() * Math.min(3, muscleExercises.length))]
        
        suggestions.push({
          id: popularExercise.id,
          exercise_name: popularExercise.name,
          muscle_group: popularExercise.muscle_group,
          reason: `${muscle} needs attention - not trained recently`,
          confidence: 80,
          suggested_sets: 3,
          suggested_reps: 10,
          suggested_weight: 20,
          progression_type: 'new'
        })
      }
    })

    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
  }

  const generateWorkoutInsights = (history: any[], workoutType: string): string[] => {
    const insights: string[] = []
    
    // Recent workout frequency
    const recentWorkouts = history.filter(log => {
      const logDate = new Date(log.created_at)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return logDate > weekAgo
    })

    if (recentWorkouts.length < 3) {
      insights.push('💪 Aim for 3-4 workouts this week for optimal progress')
    } else if (recentWorkouts.length > 6) {
      insights.push('🔥 Great consistency! Consider a rest day for recovery')
    }

    // Volume analysis
    const totalVolume = history.slice(0, 10).reduce((sum, log) => 
      sum + ((log.weight_kg || 0) * (log.reps || 0) * (log.sets || 0)), 0
    )

    if (totalVolume > 0) {
      if (totalVolume < 5000) {
        insights.push('📈 Consider increasing training volume gradually')
      } else if (totalVolume > 20000) {
        insights.push('⚡ High volume detected - ensure adequate recovery')
      }
    }

    return insights
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500'
    if (confidence >= 60) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const getProgressionIcon = (type: string) => {
    switch (type) {
      case 'weight': return '⬆️'
      case 'reps': return '🔄'
      case 'sets': return '📊'
      case 'new': return '✨'
      default: return '💪'
    }
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Workout Insights */}
      {insights.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <h3 className="font-semibold text-sm mb-2">💡 AI Insights</h3>
          <div className="space-y-1">
            {insights.map((insight, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {insight}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Exercise Suggestions */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">🤖 AI Exercise Suggestions</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generateSuggestions}
            disabled={loading}
          >
            🔄 Refresh
          </Button>
        </div>

        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No suggestions available. Add more exercises to get AI recommendations!
          </p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div 
                key={suggestion.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {getProgressionIcon(suggestion.progression_type)} {suggestion.exercise_name}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={`${getConfidenceColor(suggestion.confidence)} text-white text-xs`}
                    >
                      {suggestion.confidence}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {suggestion.reason}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{suggestion.suggested_sets} sets</span>
                    <span>{suggestion.suggested_reps} reps</span>
                    <span>{suggestion.suggested_weight}kg</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onAddExercise(
                    suggestion.id,
                    suggestion.exercise_name,
                    suggestion.suggested_sets,
                    suggestion.suggested_reps,
                    suggestion.suggested_weight
                  )}
                  className="ml-2"
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
} 