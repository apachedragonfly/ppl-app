'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        // First check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setUser(null)
          setLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          console.log('Authenticated user:', session.user)
          router.push('/dashboard')
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Supabase connection error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            💪 PPL Tracker
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Track your Push, Pull, and Legs workouts with ease
          </p>
          
          <div className="space-y-4">
            <Link
              href="/login"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition-colors block text-center"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="w-full bg-white hover:bg-gray-50 text-indigo-600 font-medium py-3 px-4 rounded-md border border-indigo-600 transition-colors block text-center"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>✓ Log your workouts</p>
            <p>✓ Track your progress</p>
            <p>✓ Save workout routines</p>
          </div>
        </div>
      </div>
    </div>
  )
}
