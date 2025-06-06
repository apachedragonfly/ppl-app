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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Routines</h1>
          <button
            onClick={handleNewRoutine}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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