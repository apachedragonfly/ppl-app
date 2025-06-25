'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, X, Volume2, VolumeX } from 'lucide-react'

interface RestTimerProps {
  onClose?: () => void
  defaultDuration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export default function RestTimer({ 
  onClose, 
  defaultDuration = 180, // 3 minutes default
  position = 'top-right' 
}: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(defaultDuration)
  const [isRunning, setIsRunning] = useState(false)
  const [duration, setDuration] = useState(defaultDuration)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Position classes
  const getPositionClasses = () => {
    if (isDragging) return ''
    
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-20 md:bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-20 md:bottom-4 left-4'
      default:
        return 'top-4 right-4'
    }
  }

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            playSound()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  // Sound effect
  useEffect(() => {
    if (soundEnabled && typeof window !== 'undefined') {
      // Create a simple beep sound using Web Audio API
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMhBz2a3+++fyMGU5zl9LV7JQl...')
    }
  }, [soundEnabled])

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Fallback: use system notification
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200])
        }
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const start = () => setIsRunning(true)
  const pause = () => setIsRunning(false)
  const reset = () => {
    setIsRunning(false)
    setTimeLeft(duration)
  }

  const presetTimes = [60, 90, 120, 180, 240, 300] // 1-5 minutes

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    const newX = e.clientX - dragPosition.x
    const newY = e.clientY - dragPosition.y
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 200
    const maxY = window.innerHeight - 150
    
    const element = document.getElementById('rest-timer')
    if (element) {
      element.style.left = `${Math.max(0, Math.min(newX, maxX))}px`
      element.style.top = `${Math.max(0, Math.min(newY, maxY))}px`
      element.style.right = 'auto'
      element.style.bottom = 'auto'
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragPosition])

  const progress = ((duration - timeLeft) / duration) * 100

  return (
    <div
      id="rest-timer"
      className={`fixed z-50 bg-card border-2 border-border rounded-xl shadow-2xl p-4 w-48 select-none ${
        isDragging ? '' : getPositionClasses()
      } ${timeLeft === 0 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}
      style={isDragging ? { cursor: 'grabbing' } : {}}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span className="text-xs font-medium text-muted-foreground">REST</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-4">
        <div className={`text-3xl font-mono font-bold ${
          timeLeft <= 10 && timeLeft > 0 ? 'text-orange-500 animate-pulse' : 
          timeLeft === 0 ? 'text-green-500' : 'text-foreground'
        }`}>
          {formatTime(timeLeft)}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
          <div 
            className={`h-1.5 rounded-full transition-all duration-1000 ${
              timeLeft === 0 ? 'bg-green-500' : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-2 mb-3">
        <button
          onClick={isRunning ? pause : start}
          disabled={timeLeft === 0}
          className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50"
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        
        <button
          onClick={reset}
          className="flex items-center justify-center w-8 h-8 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-3 gap-1">
        {presetTimes.map((time) => (
          <button
            key={time}
            onClick={() => {
              setDuration(time)
              setTimeLeft(time)
              setIsRunning(false)
            }}
            className={`px-2 py-1 text-xs rounded ${
              duration === time 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {time < 60 ? `${time}s` : `${time / 60}m`}
          </button>
        ))}
      </div>

      {timeLeft === 0 && (
        <div className="mt-3 text-center">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            Rest Complete! 💪
          </p>
        </div>
      )}
    </div>
  )
} 