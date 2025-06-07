'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Routine, RoutineExercise } from '@/types'

interface RoutineWithExercises extends Routine {
  routine_exercises: (RoutineExercise & { exercise: { name: string } })[]
}

interface RoutineListProps {
  userId: string
  onEdit: (routine: Routine) => void
  onLoadToWorkout: (routine: RoutineWithExercises) => void
}

export default function RoutineList({ userId, onEdit, onLoadToWorkout }: RoutineListProps) {
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoutines()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRoutines = async () => {
    try {
      const { data, error } = await supabase
        .from('routines')
        .select(`
          *,
          routine_exercises (
            *,
            exercise:exercises (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRoutines(data || [])
    } catch (error) {
      console.error('Error fetching routines:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteRoutine = async (routineId: string) => {
    if (!confirm('Are you sure you want to delete this routine?')) return

    try {
      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', routineId)

      if (error) throw error

      setRoutines(routines.filter(r => r.id !== routineId))
    } catch (error) {
      console.error('Error deleting routine:', error)
      alert('Failed to delete routine')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Push': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'Pull': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'Legs': return 'bg-green-500/20 text-green-300 border-green-500/30'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-muted rounded-lg h-32"></div>
        ))}
      </div>
    )
  }

  if (routines.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg mb-4">No routines created yet</div>
        <p className="text-muted-foreground/70">Create your first routine to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {routines.map((routine) => (
        <div key={routine.id} className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-card-foreground">{routine.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(routine.type)}`}>
                  {routine.type}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {routine.routine_exercises.length} exercise{routine.routine_exercises.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onLoadToWorkout(routine)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                Start Workout
              </button>
              <button
                onClick={() => onEdit(routine)}
                className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => deleteRoutine(routine.id)}
                className="px-3 py-1 bg-destructive text-destructive-foreground text-sm rounded-md hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground mb-2">Exercises:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {routine.routine_exercises
                .sort((a, b) => a.order_index - b.order_index)
                .map((re, index) => (
                  <div key={re.id} className="flex items-center justify-between bg-secondary rounded p-2">
                    <span className="text-sm text-secondary-foreground truncate">
                      {index + 1}. {re.exercise.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                      {re.sets} × {re.reps}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Created {new Date(routine.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
} 