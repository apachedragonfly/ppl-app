'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import RoutineList from '@/components/RoutineList'
import RoutineEditor from '@/components/RoutineEditor'
import { Routine } from '@/types'

interface RoutineWithExercises extends Routine {
  routine_exercises: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function RoutinesPage() {
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>()
  const [refreshList, setRefreshList] = useState(0)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleNewRoutine = () => {
    setEditingRoutine(undefined)
    setShowEditor(true)
  }

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine)
    setShowEditor(true)
  }

  const handleSaveRoutine = (routine: Routine) => {
    setShowEditor(false)
    setEditingRoutine(undefined)
    setRefreshList(prev => prev + 1) // Trigger refresh
  }

  const handleCancelEdit = () => {
    setShowEditor(false)
    setEditingRoutine(undefined)
  }

  const handleLoadToWorkout = (routine: RoutineWithExercises) => {
    // Store the routine in localStorage and navigate to workout form
    localStorage.setItem('selectedRoutine', JSON.stringify(routine))
    router.push('/workouts/new')
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
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 px-3 py-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors self-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Routines</h1>
          </div>
          <button
            onClick={handleNewRoutine}
            className="w-full sm:w-auto px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base"
          >
            Create New Routine
          </button>
        </div>

        {showEditor ? (
          <div className="mb-8">
            <RoutineEditor
              userId={user.id}
              routine={editingRoutine}
              onSave={handleSaveRoutine}
              onCancel={handleCancelEdit}
            />
          </div>
        ) : (
          <RoutineList
            key={refreshList} // Force refresh when this changes
            userId={user.id}
            onEdit={handleEditRoutine}
            onLoadToWorkout={handleLoadToWorkout}
          />
        )}
      </div>
    </div>
  )
} 