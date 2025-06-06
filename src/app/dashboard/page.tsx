'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import WorkoutHeatmap from '@/components/CalendarHeatmap'
import ChartProgress from '@/components/ChartProgress'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user) {
        router.push('/login')
        setLoading(false)
        return
      }

      // Fetch user profile
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (profileData) {
          setProfile(profileData)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center border-2 border-gray-200">
                  <span className="text-lg text-gray-600">👤</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  PPL Tracker Dashboard
                </h1>
                <p className="text-gray-600">
                  Welcome back, {profile?.name || user.email}
                </p>
              </div>
            </div>
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <a
                href="/workouts/new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Log Workout
              </a>
              <a
                href="/routines"
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Routines
              </a>
              <a
                href="/workouts/history"
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                History
              </a>
              <a
                href="/dashboard/profile"
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Profile
              </a>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Visual Tracking Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workout Heatmap */}
          <div className="bg-white rounded-lg shadow">
            <WorkoutHeatmap userId={user.id} />
          </div>

          {/* Progress Chart */}
          <div className="bg-white rounded-lg shadow">
            <ChartProgress userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
} 