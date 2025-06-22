'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import WorkoutForm from '@/components/WorkoutForm'
import { WorkoutTemplate, WorkoutTemplateExercise, QuickStartRoutine, QuickStartRoutineExercise } from '@/types'

export default function NewWorkoutPage() {
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true)
  const [templateData, setTemplateData] = useState<{
    template: WorkoutTemplate | QuickStartRoutine
    exercises: (WorkoutTemplateExercise | QuickStartRoutineExercise)[]
  } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    checkUser()
    loadTemplateData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplateData = () => {
    const fromTemplate = searchParams.get('from') === 'template'
    if (fromTemplate) {
      const storedData = sessionStorage.getItem('templateWorkout')
      if (storedData) {
        try {
          const data = JSON.parse(storedData)
          setTemplateData(data)
          // Clear the stored data after loading
          sessionStorage.removeItem('templateWorkout')
        } catch (error) {
          console.error('Error parsing template data:', error)
        }
      }
    }
  }

  const handleWorkoutSaved = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="text-primary hover:text-primary/80 font-medium mb-3 sm:mb-4 text-sm sm:text-base"
          >
            ← Back
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {templateData ? `New Workout from ${templateData.template.name}` : 'New Workout'}
            </h1>
            {templateData && (
              <div className="text-sm text-muted-foreground">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                  Template: {templateData.template.name}
                </span>
              </div>
            )}
          </div>
        </div>

        <WorkoutForm 
          onWorkoutSaved={handleWorkoutSaved} 
          templateData={templateData}
        />
      </div>
    </div>
  )
} 