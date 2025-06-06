'use client'
import { useState, useEffect } from 'react'
import CalendarHeatmap from 'react-calendar-heatmap'
import { supabase } from '@/lib/supabase'
import { Workout } from '@/types'
import 'react-calendar-heatmap/dist/styles.css'

interface HeatmapValue {
  date: string
  count: number
}

interface CalendarHeatmapProps {
  userId: string
  className?: string
}

export default function WorkoutHeatmap({ userId, className = '' }: CalendarHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapValue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHeatmapData()
  }, [userId])

  const fetchHeatmapData = async () => {
    try {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      const { data: workouts, error } = await supabase
        .from('workouts')
        .select('date, type')
        .eq('user_id', userId)
        .gte('date', oneYearAgo.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) throw error

      // Group workouts by date and count them
      const workoutsByDate = (workouts as Workout[]).reduce((acc, workout) => {
        const date = workout.date
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Convert to heatmap format
      const heatmapValues: HeatmapValue[] = Object.entries(workoutsByDate).map(([date, count]) => ({
        date,
        count
      }))

      setHeatmapData(heatmapValues)
    } catch (error) {
      console.error('Error fetching heatmap data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTooltipDataAttrs = (value: any) => {
    if (!value || !value.date) {
      return {
        'data-tip': 'No workouts'
      }
    }
    
    const date = new Date(value.date)
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
    
    return {
      'data-tip': `${formattedDate}: ${value.count || 0} workout(s)`
    }
  }

  const classForValue = (value: any) => {
    if (!value || !value.count) {
      return 'color-empty'
    }
    if (value.count >= 3) {
      return 'color-scale-4'
    }
    if (value.count >= 2) {
      return 'color-scale-3'
    }
    if (value.count >= 1) {
      return 'color-scale-2'
    }
    return 'color-scale-1'
  }

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const today = new Date()
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1)

  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Workout Activity</h3>
      <div className="workout-heatmap">
        <CalendarHeatmap
          startDate={startDate}
          endDate={today}
          values={heatmapData}
          classForValue={classForValue}
          showWeekdayLabels={true}
        />
      </div>
      <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
        <span>Less</span>
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-800 rounded-sm"></div>
        </div>
        <span>More</span>
      </div>
      
      <style jsx global>{`
        .workout-heatmap .react-calendar-heatmap {
          width: 100%;
        }
        
        .workout-heatmap .react-calendar-heatmap .color-empty {
          fill: #ebedf0;
        }
        
        .workout-heatmap .react-calendar-heatmap .color-scale-1 {
          fill: #c6e48b;
        }
        
        .workout-heatmap .react-calendar-heatmap .color-scale-2 {
          fill: #7bc96f;
        }
        
        .workout-heatmap .react-calendar-heatmap .color-scale-3 {
          fill: #239a3b;
        }
        
        .workout-heatmap .react-calendar-heatmap .color-scale-4 {
          fill: #196127;
        }
        
        .workout-heatmap .react-calendar-heatmap text {
          font-size: 10px;
          fill: #aaa;
        }
      `}</style>
    </div>
  )
} 