'use client'

import { useState } from 'react'
import { useAccount } from '@/contexts/AccountContext'
import { IoChevronDownOutline, IoPersonAddOutline, IoCloseOutline } from 'react-icons/io5'

export default function AccountSwitcher() {
  const { currentUser, currentProfile, accounts, switchToAccount, addAccount, removeAccount } = useAccount()
  const [isOpen, setIsOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState('')
  const [showRegisterOption, setShowRegisterOption] = useState(false)

  const handleAddAccount = async (e: React.FormEvent, forceRegister = false) => {
    e.preventDefault()
    setIsAdding(true)
    setError('')

    try {
      await addAccount(email, password, forceRegister)
      setEmail('')
      setPassword('')
      setShowAddForm(false)
      setShowRegisterOption(false)
      setIsOpen(false)
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.log('Login error:', error) // Debug log to see exact error
      const errorMessage = error.message || error.toString()
      
      if ((errorMessage.includes('Invalid login credentials') || 
           errorMessage.includes('invalid_credentials') ||
           errorMessage.includes('Invalid') || 
           error.name === 'AuthApiError') && !forceRegister) {
        setShowRegisterOption(true)
        setError('Account not found. Would you like to create a new account with these credentials?')
      } else {
        setError(errorMessage || 'Failed to add account')
      }
    } finally {
      setIsAdding(false)
    }
  }

  const getInitials = (profile: any, email: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (profile?.name) {
      return profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const getDisplayName = (profile: any, email: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    return profile?.name || email
  }

  if (!currentUser) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary transition-colors"
      >
        {/* Current user avatar */}
        {currentProfile?.avatar_url ? (
          <img
            src={currentProfile.avatar_url}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {getInitials(currentProfile, currentUser.email || '')}
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-foreground">
            {getDisplayName(currentProfile, currentUser.email || '')}
          </span>
          <IoChevronDownOutline className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg min-w-[280px] z-50">
          {/* Current account header */}
          <div className="p-3 border-b border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Account</p>
            <div className="flex items-center space-x-3 mt-2">
              {currentProfile?.avatar_url ? (
                <img
                  src={currentProfile.avatar_url}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  {getInitials(currentProfile, currentUser.email || '')}
                </div>
              )}
              <div>
                <p className="font-medium text-card-foreground">{getDisplayName(currentProfile, currentUser.email || '')}</p>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>
          </div>

          {/* Other accounts */}
          {accounts.filter(acc => acc.user.id !== currentUser.id).length > 0 && (
            <div className="p-3 border-b border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Switch To</p>
              {accounts.filter(acc => acc.user.id !== currentUser.id).map((account) => (
                <div key={account.user.id} className="flex items-center justify-between group">
                  <button
                    onClick={() => {
                      switchToAccount(account.user.id)
                      setIsOpen(false)
                    }}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-secondary transition-colors flex-1"
                  >
                    {account.profile?.avatar_url ? (
                      <img
                        src={account.profile.avatar_url}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {getInitials(account.profile, account.user.email || '')}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-medium text-card-foreground">{getDisplayName(account.profile, account.user.email || '')}</p>
                      <p className="text-xs text-muted-foreground">{account.user.email}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => removeAccount(account.user.id)}
                    className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <IoCloseOutline className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add account section */}
          <div className="p-3">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 w-full p-2 text-left text-sm text-foreground hover:bg-secondary rounded-md transition-colors"
              >
                <IoPersonAddOutline className="h-4 w-4" />
                <span>Add another account</span>
              </button>
            ) : (
              <form onSubmit={handleAddAccount} className="space-y-3">
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground"
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground"
                    required
                  />
                </div>
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
                <div className="flex flex-col space-y-2">
                  {showRegisterOption ? (
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={(e) => handleAddAccount(e, true)}
                        disabled={isAdding}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded-md transition-colors disabled:opacity-50"
                      >
                        {isAdding ? 'Creating...' : 'Create Account'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRegisterOption(false)
                          setError('')
                        }}
                        className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Back
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        disabled={isAdding}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm px-3 py-2 rounded-md transition-colors disabled:opacity-50"
                      >
                        {isAdding ? 'Adding...' : 'Add Account'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false)
                          setShowRegisterOption(false)
                          setError('')
                          setEmail('')
                          setPassword('')
                        }}
                        className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 