'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    // Check if there's a saved theme preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDark(savedTheme === 'dark')
      document.documentElement.className = savedTheme
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    document.documentElement.className = newTheme
    localStorage.setItem('theme', newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-foreground" />
      ) : (
        <Moon className="h-5 w-5 text-foreground" />
      )}
    </button>
  )
} 