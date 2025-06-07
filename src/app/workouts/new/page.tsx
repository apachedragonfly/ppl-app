'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import WorkoutForm from '@/components/WorkoutForm'

export default function NewWorkoutPage() {
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">New Workout</h1>
        </div>

        <WorkoutForm onWorkoutSaved={handleWorkoutSaved} />
      </div>
    </div>
  )
} 