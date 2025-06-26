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
      console.error('Error loading stored accounts:', error)
    }
  }

  const saveAccountsToStorage = (accountsToSave: StoredAccount[]) => {
    if (!mounted) return
    
    try {
      localStorage.setItem('ppl-accounts', JSON.stringify(accountsToSave))
    } catch (error) {
      console.error('Error saving accounts:', error)
    }
  }

  const loadCurrentSession = async () => {
    if (!mounted) return
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Auth error in loadCurrentSession:', error)
        // If there's an auth error, clear any stored session
        await supabase.auth.signOut()
        return
      }
      
      if (user) {
        setCurrentUser(user)
        await loadUserProfile(user.id)
      }
    } catch (error) {
      console.error('Error loading current session:', error)
      // Handle network errors or other issues
      try {
        await supabase.auth.signOut()
      } catch (signOutError) {
        console.error('Error signing out after failed session load:', signOutError)
      }
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
        console.error('Error loading user profile:', error)
        return null
      }
      
      if (profileData) {
        setCurrentProfile(profileData)
      }
      return profileData
    } catch (error) {
      console.error('Error loading profile:', error)
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
        console.error('Error switching account:', error)
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
      console.error('Error switching account:', error)
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
          console.error('Error getting current session:', sessionError)
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
        console.error('Authentication error:', error)
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
          console.error('Error loading profile for new account:', profileError)
        }

        const newAccount: StoredAccount = {
          user: data.user,
          profile: profileData,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        }

        // Check if account already exists
        const existingIndex = accounts.findIndex(acc => acc.user.id === data.user.id)
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
      console.error('Error adding account:', error)
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
      console.error('Error removing account:', error)
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
  )
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider')
  }
  return context
} 