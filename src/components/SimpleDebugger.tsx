'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SimpleDebugger({ userId }: { userId: string }) {
  const [workouts, setWorkouts] = useState<any[]>([])

  useEffect(() => {
    loadRecentWorkouts()
  }, [userId])

  const loadRecentWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('id, date, type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setWorkouts(data || [])
    } catch (error) {
      console.error('Error loading workouts:', error)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
      <h3 className="text-lg font-semibold mb-2">🐛 Recent Workouts Debug</h3>
      <div className="text-sm">
        <p className="mb-2"><strong>Your timezone offset:</strong> {new Date().getTimezoneOffset()} minutes</p>
        <p className="mb-2"><strong>Current local time:</strong> {new Date().toString()}</p>
        <p className="mb-4"><strong>Current UTC time:</strong> {new Date().toISOString()}</p>
        
        <h4 className="font-semibold mb-2">Recent workouts from database:</h4>
        {workouts.length === 0 ? (
          <p>No workouts found</p>
        ) : (
          <div className="space-y-2">
            {workouts.map((workout) => (
              <div key={workout.id} className="p-2 bg-white dark:bg-gray-800 rounded border">
                <p><strong>Date (raw from DB):</strong> {workout.date}</p>
                <p><strong>Type:</strong> {workout.type}</p>
                <p><strong>new Date(workout.date):</strong> {new Date(workout.date).toString()}</p>
                <p><strong>Created at:</strong> {new Date(workout.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
        <button 
          onClick={loadRecentWorkouts}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Refresh
        </button>
      </div>
    </div>
  )
} 