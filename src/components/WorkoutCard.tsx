'use client'

import { Workout, WorkoutLog } from '@/types'

interface WorkoutCardProps {
  workout: Workout & {
    workout_logs: (WorkoutLog & {
      exercise: {
        name: string
      }
    })[]
  }
}

export default function WorkoutCard({ workout }: WorkoutCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTotalVolume = () => {
    return workout.workout_logs.reduce((total, log) => {
      return total + (log.sets * log.reps * log.weight_kg)
    }, 0)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Push':
        return 'bg-red-100 text-red-800'
      case 'Pull':
        return 'bg-blue-100 text-blue-800'
      case 'Legs':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(workout.type)}`}>
            {workout.type}
          </span>
          <span className="text-sm text-gray-600">
            {formatDate(workout.date)}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {getTotalVolume().toFixed(0)} kg total
        </div>
      </div>

      <div className="space-y-2">
        {workout.workout_logs.map((log, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-900">
              {log.exercise.name}
            </span>
            <span className="text-gray-600">
              {log.sets} × {log.reps} @ {log.weight_kg}kg
            </span>
          </div>
        ))}
      </div>

      {workout.workout_logs.length === 0 && (
        <div className="text-sm text-gray-500 italic">
          No exercises logged
        </div>
      )}
    </div>
  )
} 