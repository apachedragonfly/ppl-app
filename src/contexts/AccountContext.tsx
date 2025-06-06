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
  addAccount: (email: string, password: string) => Promise<void>
  removeAccount: (accountId: string) => void
  isLoading: boolean
}

const AccountContext = createContext<AccountContextType | undefined>(undefined)

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStoredAccounts()
    loadCurrentSession()
  }, [])

  const loadStoredAccounts = () => {
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
    try {
      localStorage.setItem('ppl-accounts', JSON.stringify(accountsToSave))
    } catch (error) {
      console.error('Error saving accounts:', error)
    }
  }

  const loadCurrentSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        await loadUserProfile(user.id)
      }
    } catch (error) {
      console.error('Error loading current session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      
      if (profileData) {
        setCurrentProfile(profileData)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const switchToAccount = async (accountId: string) => {
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

      if (error) throw error

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

  const addAccount = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      
      // Sign in with the new account
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user && data.session) {
        // Load the profile for this user
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle()

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
    const updatedAccounts = accounts.filter(acc => acc.user.id !== accountId)
    setAccounts(updatedAccounts)
    saveAccountsToStorage(updatedAccounts)

    // If removing current account, switch to first available or logout
    if (currentUser?.id === accountId) {
      if (updatedAccounts.length > 0) {
        switchToAccount(updatedAccounts[0].user.id)
      } else {
        supabase.auth.signOut()
        setCurrentUser(null)
        setCurrentProfile(null)
      }
    }
  }

  const value = {
    currentUser,
    currentProfile,
    accounts,
    switchToAccount,
    addAccount,
    removeAccount,
    isLoading
  }

  return (
    <AccountContext.Provider value={value}>
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