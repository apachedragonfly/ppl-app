'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WorkoutTemplates from '@/components/WorkoutTemplates'
import { WorkoutTemplate, WorkoutTemplateExercise, QuickStartRoutine, QuickStartRoutineExercise } from '@/types'

export default function TemplatesPage() {
  const router = useRouter()

  const handleStartWorkout = (
    template: WorkoutTemplate | QuickStartRoutine, 
    exercises: (WorkoutTemplateExercise | QuickStartRoutineExercise)[]
  ) => {
    // Store template data in sessionStorage for the new workout
    const workoutData = {
      template,
      exercises,
      timestamp: Date.now()
    }
    
    sessionStorage.setItem('templateWorkout', JSON.stringify(workoutData))
    
    // Navigate to new workout page
    router.push('/workouts/new?from=template')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <WorkoutTemplates onStartWorkout={handleStartWorkout} />
    </div>
  )
} 