'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types'

interface StoredAccount {
  user: User
  profile: Profile | null
  accessToken: string
  refreshToken: string
}

interface AccountContextType {
  currentUser: User | null
  currentProfile: Profile | null
  accounts: StoredAccount[]
  switchToAccount: (accountId: string) => Promise<void>
  addAccount: (email: string, password: string, shouldRegister?: boolean) => Promise<void>
  removeAccount: (accountId: string) => void
  isLoading: boolean
}

const AccountContext = createContext<AccountContextType | undefined>(undefined)

// Error boundary for context provider
class AccountContextErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    // Only log in development mode to avoid console errors in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('AccountContext error:', error)
    }
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log in development mode to avoid console errors in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('AccountContext error caught:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Authentication Error</h2>
            <p className="text-sm text-gray-600 mb-4">
              There was an issue with the authentication system. Please refresh the page.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadStoredAccounts()
      loadCurrentSession()
      
      // Listen for auth state changes (important for PWA)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id)
          
          if (event === 'SIGNED_IN' && session?.user) {
            setCurrentUser(session.user)
            await loadUserProfile(session.user.id)
          } else if (event === 'SIGNED_OUT') {
            setCurrentUser(null)
            setCurrentProfile(null)
          }
        }
      )
      
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [mounted])

  const loadStoredAccounts = () => {
    if (!mounted) return
    
    try {
      const stored = localStorage.getItem('ppl-accounts')
      if (stored) {
        setAccounts(JSON.parse(stored))
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error loading stored accounts:', error)
      }
    }
  }

  const saveAccountsToStorage = (accountsToSave: StoredAccount[]) => {
    if (!mounted) return
    
    try {
      localStorage.setItem('ppl-accounts', JSON.stringify(accountsToSave))
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error saving accounts:', error)
      }
    }
  }

  const loadCurrentSession = async () => {
    if (!mounted) return
    
    try {
      // First try to get the current session instead of user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Session error in loadCurrentSession:', sessionError)
        }
        setCurrentUser(null)
        setCurrentProfile(null)
        setIsLoading(false)
        return
      }
      
      if (session?.user) {
        setCurrentUser(session.user)
        await loadUserProfile(session.user.id)
      } else {
        // No session, check if we have stored accounts
        setCurrentUser(null)
        setCurrentProfile(null)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error loading current session:', error)
      }
      setCurrentUser(null)
      setCurrentProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error loading user profile:', error)
        }
        return null
      }
      
      if (profileData) {
        setCurrentProfile(profileData)
      }
      return profileData
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error loading profile:', error)
      }
      return null
    }
  }

  const switchToAccount = async (accountId: string) => {
    if (!mounted) return
    
    try {
      setIsLoading(true)
      
      const account = accounts.find(acc => acc.user.id === accountId)
      if (!account) {
        throw new Error('Account not found')
      }

      // Set the session with the stored tokens
      const { data, error } = await supabase.auth.setSession({
        access_token: account.accessToken,
        refresh_token: account.refreshToken
      })

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error switching account:', error)
        }
        throw error
      }

      if (data.user) {
        setCurrentUser(data.user)
        setCurrentProfile(account.profile)
        
        // Update the account in storage with fresh tokens if they changed
        if (data.session) {
          const updatedAccounts = accounts.map(acc => 
            acc.user.id === accountId 
              ? { ...acc, accessToken: data.session!.access_token, refreshToken: data.session!.refresh_token }
              : acc
          )
          setAccounts(updatedAccounts)
          saveAccountsToStorage(updatedAccounts)
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error switching account:', error)
      }
      alert('Failed to switch account. You may need to re-add this account.')
    } finally {
      setIsLoading(false)
    }
  }

  const addAccount = async (email: string, password: string, shouldRegister = false) => {
    if (!mounted) return
    
    try {
      setIsLoading(true)
      
      // First, store the current account if it's not already stored
      if (currentUser) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error getting current session:', sessionError)
          }
        } else if (session) {
          const existingAccount = accounts.find(acc => acc.user.id === currentUser.id)
          if (!existingAccount) {
            const currentAccount = {
              user: currentUser,
              profile: currentProfile,
              accessToken: session.access_token,
              refreshToken: session.refresh_token
            }
            const updatedAccounts = [...accounts, currentAccount]
            setAccounts(updatedAccounts)
            saveAccountsToStorage(updatedAccounts)
          }
        }
      }
      
      let data, error
      
      if (shouldRegister) {
        // Register new account
        const signUpResult = await supabase.auth.signUp({
          email,
          password
        })
        data = signUpResult.data
        error = signUpResult.error
      } else {
        // Try to sign in first
        const signInResult = await supabase.auth.signInWithPassword({
          email,
          password
        })
        data = signInResult.data
        error = signInResult.error
      }

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Authentication error:', error)
        }
        throw error
      }

      if (data?.user && data?.session) {
        // Load the profile for this user
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle()

        if (profileError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error loading profile for new account:', profileError)
          }
        }

        const newAccount: StoredAccount = {
          user: data.user,
          profile: profileData,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        }

        // Check if account already exists
        const existingIndex = accounts.findIndex(acc => acc.user.id === data.user!.id)
        let updatedAccounts: StoredAccount[]

        if (existingIndex >= 0) {
          // Update existing account
          updatedAccounts = [...accounts]
          updatedAccounts[existingIndex] = newAccount
        } else {
          // Add new account
          updatedAccounts = [...accounts, newAccount]
        }

        setAccounts(updatedAccounts)
        saveAccountsToStorage(updatedAccounts)
        
        // Switch to the new account
        setCurrentUser(data.user)
        setCurrentProfile(profileData)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error adding account:', error)
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const removeAccount = (accountId: string) => {
    if (!mounted) return
    
    try {
      const updatedAccounts = accounts.filter(acc => acc.user.id !== accountId)
      setAccounts(updatedAccounts)
      saveAccountsToStorage(updatedAccounts)
      
      // If removing current account, sign out
      if (currentUser?.id === accountId) {
        supabase.auth.signOut()
        setCurrentUser(null)
        setCurrentProfile(null)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error removing account:', error)
      }
    }
  }

  // Don't provide context until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <AccountContext.Provider
        value={{
          currentUser: null,
          currentProfile: null,
          accounts: [],
          switchToAccount: async () => {},
          addAccount: async () => {},
          removeAccount: () => {},
          isLoading: true,
        }}
      >
        {children}
      </AccountContext.Provider>
    )
  }

  return (
    <AccountContextErrorBoundary>
      <AccountContext.Provider
        value={{
          currentUser,
          currentProfile,
          accounts,
          switchToAccount,
          addAccount,
          removeAccount,
          isLoading,
        }}
      >
        {children}
      </AccountContext.Provider>
    </AccountContextErrorBoundary>
  )
}

export function useAccount(): AccountContextType {
  try {
    const context = useContext(AccountContext)
    if (context === undefined) {
      // Only log in development mode to avoid console errors in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('useAccount called outside of AccountProvider')
      }
      // Return safe defaults instead of throwing
      return {
        currentUser: null,
        currentProfile: null,
        accounts: [],
        switchToAccount: async () => {},
        addAccount: async () => {},
        removeAccount: () => {},
        isLoading: false
      }
    }
    return context
  } catch (error) {
    // Only log in development mode to avoid console errors in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error in useAccount hook:', error)
    }
    // Return safe defaults
    return {
      currentUser: null,
      currentProfile: null,
      accounts: [],
      switchToAccount: async () => {},
      addAccount: async () => {},
      removeAccount: () => {},
      isLoading: false
    }
  }
} 