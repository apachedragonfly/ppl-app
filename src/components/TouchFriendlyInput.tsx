'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  suffix?: string
  className?: string
}

export function TouchNumberInput({ 
  value, 
  onChange, 
  min = 0, 
  max = 999, 
  step = 1, 
  label, 
  suffix,
  className = "" 
}: NumberInputProps) {
  const [focused, setFocused] = useState(false)

  const increment = () => {
    const newValue = Math.min(max, value + step)
    onChange(newValue)
  }

  const decrement = () => {
    const newValue = Math.max(min, value - step)
    onChange(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0
    if (newValue >= min && newValue <= max) {
      onChange(newValue)
    }
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      <div className={`flex items-center bg-input border rounded-lg transition-colors ${
        focused ? 'border-ring ring-2 ring-ring/20' : 'border-border'
      }`}>
        {/* Decrement Button */}
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="flex items-center justify-center w-12 h-12 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Number Input */}
        <input
          type="number"
          value={value || ''}
          onChange={handleInputChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          min={min}
          max={max}
          step={step}
          className="flex-1 h-12 text-center text-lg font-semibold bg-transparent border-none outline-none text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          inputMode="numeric"
          pattern="[0-9]*"
        />

        {/* Increment Button */}
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="flex items-center justify-center w-12 h-12 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {suffix && (
        <div className="text-xs text-muted-foreground text-center">
          {suffix}
        </div>
      )}
    </div>
  )
}

interface QuickSelectProps {
  options: number[]
  value: number
  onChange: (value: number) => void
  label?: string
  className?: string
}

export function QuickSelect({ 
  options, 
  value, 
  onChange, 
  label, 
  className = "" 
}: QuickSelectProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              value === option
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

interface SwipeActionProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: {
    icon: React.ReactNode
    label: string
    color: 'red' | 'green' | 'blue' | 'orange'
  }
  rightAction?: {
    icon: React.ReactNode
    label: string
    color: 'red' | 'green' | 'blue' | 'orange'
  }
  className?: string
}

export function SwipeAction({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  leftAction, 
  rightAction,
  className = "" 
}: SwipeActionProps) {
  const [startX, setStartX] = useState<number | null>(null)
  const [currentX, setCurrentX] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX) return
    setCurrentX(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!startX || !currentX) {
      setStartX(null)
      setCurrentX(null)
      setIsDragging(false)
      return
    }

    const diff = currentX - startX
    const threshold = 50

    if (diff > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (diff < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }

    setStartX(null)
    setCurrentX(null)
    setIsDragging(false)
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500 text-white'
      case 'green': return 'bg-green-500 text-white'
      case 'blue': return 'bg-blue-500 text-white'
      case 'orange': return 'bg-orange-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const swipeDistance = startX && currentX ? currentX - startX : 0
  const showLeftAction = swipeDistance > 50 && leftAction
  const showRightAction = swipeDistance < -50 && rightAction

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Left Action */}
      {showLeftAction && (
        <div className={`absolute left-0 top-0 bottom-0 flex items-center px-4 ${getColorClasses(leftAction.color)}`}>
          <div className="flex items-center space-x-2">
            {leftAction.icon}
            <span className="font-medium">{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* Right Action */}
      {showRightAction && (
        <div className={`absolute right-0 top-0 bottom-0 flex items-center px-4 ${getColorClasses(rightAction.color)}`}>
          <div className="flex items-center space-x-2">
            {rightAction.icon}
            <span className="font-medium">{rightAction.label}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`transition-transform ${isDragging ? 'transition-none' : 'transition-transform duration-200'}`}
        style={{
          transform: isDragging ? `translateX(${Math.max(-100, Math.min(100, swipeDistance))}px)` : 'translateX(0)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
} 