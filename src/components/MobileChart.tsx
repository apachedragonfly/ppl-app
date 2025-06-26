'use client'

import { useState, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MobileChartProps {
  data: any[]
  title: string
  dataKey: string
  color?: string
  type?: 'line' | 'bar'
  height?: number
  showControls?: boolean
}

interface TouchState {
  startX: number
  startTime: number
  moved: boolean
}

export default function MobileChart({ 
  data, 
  title, 
  dataKey, 
  color = '#3b82f6',
  type = 'line',
  height = 200,
  showControls = true
}: MobileChartProps) {
  // Ensure data is always an array and has valid content
  const safeData = Array.isArray(data) ? data : []
  
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(7, safeData.length) })
  const [touchState, setTouchState] = useState<TouchState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const visibleData = safeData.slice(visibleRange.start, visibleRange.end)
  const canScrollLeft = visibleRange.start > 0
  const canScrollRight = visibleRange.end < safeData.length
  
  // Calculate trend
  const trend = safeData.length >= 2 ? (
    safeData[safeData.length - 1]?.[dataKey] - safeData[safeData.length - 2]?.[dataKey]
  ) : 0

  const scrollLeft = () => {
    if (canScrollLeft) {
                const newStart = Math.max(0, visibleRange.start - 3)
          const range = visibleRange.end - visibleRange.start
          setVisibleRange({ start: newStart, end: newStart + range })
        }
      }

      const scrollRight = () => {
        if (canScrollRight) {
          const range = visibleRange.end - visibleRange.start
          const newStart = Math.min(safeData.length - range, visibleRange.start + 3)
          setVisibleRange({ start: newStart, end: newStart + range })
        }
      }

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchState({
      startX: touch.clientX,
      startTime: Date.now(),
      moved: false
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchState) return
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchState.startX)
    
    if (deltaX > 10) {
      setTouchState({ ...touchState, moved: true })
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchState) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchState.startX
    const deltaTime = Date.now() - touchState.startTime

    // If it's a quick swipe (not a slow drag)
    if (Math.abs(deltaX) > 50 && deltaTime < 300 && touchState.moved) {
      if (deltaX > 0) {
        scrollLeft()
      } else {
        scrollRight()
      }
    }

    setTouchState(null)
  }

  // Format values for display
  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return value % 1 === 0 ? value.toString() : value.toFixed(1)
    }
    return value?.toString() || '0'
  }

  // Get bar colors for progress visualization
  const getBarColors = () => {
    if (visibleData.length <= 1) return [color]
    
    return visibleData.map((_, index) => {
      if (index === 0) return color
      const current = visibleData[index][dataKey]
      const previous = visibleData[index - 1][dataKey]
      if (current > previous) return '#10b981' // green for improvement
      if (current < previous) return '#ef4444' // red for decline
      return '#6b7280' // gray for no change
    })
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {trend !== 0 && (
            <div className="flex items-center space-x-1 mt-1">
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : trend < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-gray-500" />
              )}
              <span className={`text-sm font-medium ${
                trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {trend > 0 ? '+' : ''}{formatValue(trend)}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        {showControls && safeData.length > 7 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full ${
                canScrollLeft 
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              } transition-colors`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`p-2 rounded-full ${
                canScrollRight 
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              } transition-colors`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div 
        ref={containerRef}
        className="relative touch-pan-y"
        style={{ height: `${height}px` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {visibleData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>No data available</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {type === 'line' ? (
              <LineChart data={visibleData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => {
                    if (typeof value === 'string' && value.includes('-')) {
                      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                    return value?.toString() || ''
                  }}
                />
                <YAxis hide />
                <Line 
                  type="monotone" 
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={3}
                  dot={{ 
                    fill: color, 
                    strokeWidth: 2, 
                    r: 6,
                    stroke: 'hsl(var(--background))'
                  }}
                  activeDot={{ 
                    r: 8, 
                    stroke: color, 
                    strokeWidth: 3, 
                    fill: 'hsl(var(--background))'
                  }}
                />
              </LineChart>
            ) : (
              <BarChart data={visibleData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => {
                    if (typeof value === 'string' && value.includes('-')) {
                      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                    return value?.toString() || ''
                  }}
                />
                <YAxis hide />
                <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
                  {visibleData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColors()[index]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Data Range Indicator */}
      {safeData.length > 7 && (
        <div className="flex items-center justify-center mt-3">
          <div className="flex space-x-1">
            {Array.from({ length: Math.ceil(safeData.length / 7) }, (_, i) => {
              const isActive = i === Math.floor(visibleRange.start / 7)
              return (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isActive ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Latest Value Display */}
      {visibleData.length > 0 && (
        <div className="mt-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {formatValue(visibleData[visibleData.length - 1][dataKey])}
            <span className="text-sm text-muted-foreground ml-1">
              {dataKey.includes('weight') || dataKey.includes('Weight') ? 'kg' : ''}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Latest</div>
        </div>
      )}
    </div>
  )
} 