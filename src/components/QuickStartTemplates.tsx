'use client'

import { useState } from 'react'
import { Play, Clock, Target, Flame } from 'lucide-react'

interface QuickTemplate {
  id: string
  name: string
  duration: string
  type: 'Push' | 'Pull' | 'Legs'
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  exercises: {
    name: string
    sets: number
    reps: string
    weight?: string
  }[]
  color: string
}

interface QuickStartTemplatesProps {
  onStartWorkout: (template: QuickTemplate) => void
}

const quickTemplates: QuickTemplate[] = [
  {
    id: 'push-beginner',
    name: 'Quick Push Day',
    duration: '30-45 min',
    type: 'Push',
    difficulty: 'Beginner',
    color: 'bg-gradient-to-r from-blue-500 to-purple-600',
    exercises: [
      { name: 'Push-ups', sets: 3, reps: '8-12' },
      { name: 'Overhead Press', sets: 3, reps: '8-10', weight: 'Start light' },
      { name: 'Bench Press', sets: 3, reps: '8-10', weight: 'Moderate' },
      { name: 'Dips', sets: 3, reps: '6-10' },
      { name: 'Lateral Raises', sets: 3, reps: '12-15', weight: 'Light' }
    ]
  },
  {
    id: 'pull-beginner',
    name: 'Quick Pull Day',
    duration: '30-45 min',
    type: 'Pull',
    difficulty: 'Beginner',
    color: 'bg-gradient-to-r from-green-500 to-teal-600',
    exercises: [
      { name: 'Pull-ups/Assisted', sets: 3, reps: '5-10' },
      { name: 'Bent-over Rows', sets: 3, reps: '8-10', weight: 'Moderate' },
      { name: 'Lat Pulldowns', sets: 3, reps: '10-12', weight: 'Moderate' },
      { name: 'Bicep Curls', sets: 3, reps: '10-12', weight: 'Light-Moderate' },
      { name: 'Face Pulls', sets: 3, reps: '12-15', weight: 'Light' }
    ]
  },
  {
    id: 'legs-beginner',
    name: 'Quick Leg Day',
    duration: '40-50 min',
    type: 'Legs',
    difficulty: 'Beginner',
    color: 'bg-gradient-to-r from-orange-500 to-red-600',
    exercises: [
      { name: 'Squats', sets: 3, reps: '8-12', weight: 'Bodyweight/Light' },
      { name: 'Romanian Deadlifts', sets: 3, reps: '8-10', weight: 'Moderate' },
      { name: 'Lunges', sets: 3, reps: '10-12 each leg' },
      { name: 'Calf Raises', sets: 3, reps: '15-20' },
      { name: 'Leg Curls', sets: 3, reps: '10-12', weight: 'Light-Moderate' }
    ]
  },
  {
    id: 'push-intermediate',
    name: 'Power Push',
    duration: '45-60 min',
    type: 'Push',
    difficulty: 'Intermediate',
    color: 'bg-gradient-to-r from-purple-600 to-pink-600',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '6-8', weight: 'Heavy' },
      { name: 'Overhead Press', sets: 4, reps: '6-8', weight: 'Heavy' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', weight: 'Moderate-Heavy' },
      { name: 'Dips', sets: 3, reps: '8-12' },
      { name: 'Lateral Raises', sets: 4, reps: '12-15', weight: 'Light-Moderate' },
      { name: 'Tricep Extensions', sets: 3, reps: '10-12', weight: 'Moderate' }
    ]
  },
  {
    id: 'pull-intermediate',
    name: 'Power Pull',
    duration: '45-60 min',
    type: 'Pull',
    difficulty: 'Intermediate',
    color: 'bg-gradient-to-r from-teal-600 to-blue-600',
    exercises: [
      { name: 'Deadlifts', sets: 4, reps: '5-6', weight: 'Heavy' },
      { name: 'Pull-ups', sets: 4, reps: '6-10' },
      { name: 'Barbell Rows', sets: 4, reps: '6-8', weight: 'Heavy' },
      { name: 'T-Bar Rows', sets: 3, reps: '8-10', weight: 'Moderate-Heavy' },
      { name: 'Barbell Curls', sets: 3, reps: '8-10', weight: 'Moderate' },
      { name: 'Hammer Curls', sets: 3, reps: '10-12', weight: 'Moderate' }
    ]
  }
]

export default function QuickStartTemplates({ onStartWorkout }: QuickStartTemplatesProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner')

  const filteredTemplates = quickTemplates.filter(template => template.difficulty === selectedDifficulty)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Quick Start Templates</h2>
        <p className="text-muted-foreground">Jump into your workout with pre-made routines</p>
      </div>

      {/* Difficulty Selector */}
      <div className="flex justify-center">
        <div className="flex bg-muted rounded-lg p-1">
          {(['Beginner', 'Intermediate', 'Advanced'] as const).map((difficulty) => (
            <button
              key={difficulty}
              onClick={() => setSelectedDifficulty(difficulty)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedDifficulty === difficulty
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {difficulty}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            {/* Header with gradient */}
            <div className={`${template.color} p-4 text-white`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">{template.name}</h3>
                <div className="flex items-center space-x-2 text-sm opacity-90">
                  <Clock className="w-4 h-4" />
                  <span>{template.duration}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm opacity-90">
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span>{template.type}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Flame className="w-4 h-4" />
                  <span>{template.difficulty}</span>
                </div>
              </div>
            </div>

            {/* Exercise List */}
            <div className="p-4">
              <div className="space-y-2 mb-4">
                {template.exercises.slice(0, 3).map((exercise, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-foreground">{exercise.name}</span>
                    <span className="text-muted-foreground">
                      {exercise.sets}x{exercise.reps}
                    </span>
                  </div>
                ))}
                {template.exercises.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{template.exercises.length - 3} more exercises
                  </div>
                )}
              </div>

              {/* Start Button */}
              <button
                onClick={() => onStartWorkout(template)}
                className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-lg font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Start Workout</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">🏗️</div>
          <p>More {selectedDifficulty.toLowerCase()} templates coming soon!</p>
        </div>
      )}
    </div>
  )
} 