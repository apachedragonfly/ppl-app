'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Auth error:', error)
        }
        setUser(user)
        console.log('Authenticated user:', user)
      } catch (error) {
        console.error('Supabase connection error:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Push/Pull/Legs Tracker
          </h1>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Supabase Connection Test</h2>
            {loading ? (
              <p className="text-gray-600">Testing connection...</p>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Check console for full details
                </p>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <strong>User Status:</strong>{' '}
                  {user ? (
                    <span className="text-green-600">
                      Authenticated ({user.email})
                    </span>
                  ) : (
                    <span className="text-red-600">Not authenticated (null)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
