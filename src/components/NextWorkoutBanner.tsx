'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { WorkoutType } from '@/types'
import { cn } from '@/lib/utils'

interface NextWorkoutBannerProps {
  userId: string
}

export default function NextWorkoutBanner({ userId }: NextWorkoutBannerProps) {
  const [nextType, setNextType] = useState<WorkoutType>('Push')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    const fetchLastWorkout = async () => {
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select('type')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) throw error

        const lastType = data?.type as WorkoutType | undefined

        if (lastType === 'Push') setNextType('Pull')
        else if (lastType === 'Pull') setNextType('Legs')
        else if (lastType === 'Legs') setNextType('Push')
        else setNextType('Push') // default when no workouts
      } catch (err) {
        console.error('Error fetching last workout:', err)
        setNextType('Push')
      } finally {
        setLoading(false)
      }
    }

    fetchLastWorkout()
  }, [userId])

  if (loading) return null

  const bannerStyles: Record<WorkoutType, string> = {
    Push: 'bg-red-100 text-red-800 border-red-200',
    Pull: 'bg-blue-100 text-blue-800 border-blue-200',
    Legs: 'bg-green-100 text-green-800 border-green-200',
  }

  return (
    <div
      className={cn(
        'border-l-4 rounded-md px-4 py-3 mb-4 flex items-center space-x-2',
        bannerStyles[nextType]
      )}
    >
      <span className="font-medium">Next workout:</span>
      <span className="font-semibold tracking-wide">{nextType}</span>
    </div>
  )
} 