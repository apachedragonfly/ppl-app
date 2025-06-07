'use client'
import { useState, useEffect, useRef } from 'react'
import CalendarHeatmap from 'react-calendar-heatmap'
import { supabase } from '@/lib/supabase'
import { Workout } from '@/types'
import 'react-calendar-heatmap/dist/styles.css'

interface HeatmapValue {
  date: string
  count: number
  type?: 'Push' | 'Pull' | 'Legs' | 'Mixed'
}

interface WorkoutDetail {
  id: string
  type: 'Push' | 'Pull' | 'Legs'
  exercises: {
    name: string
    sets: number
    reps: number
    weight_kg: number
  }[]
}

interface CalendarHeatmapProps {
  userId: string
  className?: string
}

export default function WorkoutHeatmap({ userId, className = '' }: CalendarHeatmapProps) {
  const heatmapRef = useRef<HTMLDivElement>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapValue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null) // null = full year
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string>('all') // all, Push, Pull, Legs
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [workoutDetails, setWorkoutDetails] = useState<WorkoutDetail[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchHeatmapData()
  }, [userId, selectedYear, selectedMonth, selectedWorkoutType])

  const fetchHeatmapData = async () => {
    try {
      let startDate, endDate
      
      if (selectedMonth !== null) {
        // Month view
        startDate = new Date(selectedYear, selectedMonth, 1)
        endDate = new Date(selectedYear, selectedMonth + 1, 0)
      } else {
        // Year view
        startDate = new Date(selectedYear, 0, 1)
        endDate = new Date(selectedYear, 11, 31)
      }

      let query = supabase
        .from('workouts')
        .select('date, type')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      // Apply workout type filter
      if (selectedWorkoutType !== 'all') {
        query = query.eq('type', selectedWorkoutType)
      }

      const { data: workouts, error } = await query.order('date', { ascending: true })

      if (error) throw error

      // Group workouts by date, count them, and determine type
      const workoutsByDate = (workouts as Workout[]).reduce((acc, workout) => {
        const date = workout.date
        if (!acc[date]) {
          acc[date] = { count: 0, types: new Set() }
        }
        acc[date].count += 1
        acc[date].types.add(workout.type)
        return acc
      }, {} as Record<string, { count: number; types: Set<string> }>)

      // Convert to heatmap format with type information
      const heatmapValues: HeatmapValue[] = Object.entries(workoutsByDate).map(([date, data]) => {
        let type: 'Push' | 'Pull' | 'Legs' | 'Mixed'
        
        if (data.types.size === 1) {
          type = Array.from(data.types)[0] as 'Push' | 'Pull' | 'Legs'
        } else {
          type = 'Mixed'
        }

        return {
          date,
          count: data.count,
          type
        }
      })

      setHeatmapData(heatmapValues)
    } catch (error) {
      console.error('Error fetching heatmap data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkoutDetails = async (date: string) => {
    try {
      const { data: workouts, error } = await supabase
        .from('workouts')
        .select(`
          id,
          type,
          workout_logs (
            sets,
            reps,
            weight_kg,
            exercise:exercises (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .eq('date', date)

      if (error) throw error

      const workoutDetails: WorkoutDetail[] = (workouts as any[]).map(workout => ({
        id: workout.id,
        type: workout.type,
        exercises: workout.workout_logs.map((log: any) => ({
          name: log.exercise?.name || 'Unknown Exercise',
          sets: log.sets,
          reps: log.reps,
          weight_kg: log.weight_kg
        }))
      }))

      setWorkoutDetails(workoutDetails)
      setSelectedDate(date)
      setShowModal(true)
    } catch (error) {
      console.error('Error fetching workout details:', error)
    }
  }

  const handleEditWorkout = (workoutId: string) => {
    // Store workout ID for editing and navigate to edit page
    localStorage.setItem('editWorkoutId', workoutId)
    window.location.href = `/workouts/edit/${workoutId}`
  }

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return

    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)

      if (error) throw error

      // Refresh heatmap data
      fetchHeatmapData()
      
      // Update the modal by refetching details for the same date
      if (selectedDate) {
        fetchWorkoutDetails(selectedDate)
      }
    } catch (error) {
      console.error('Error deleting workout:', error)
      alert('Failed to delete workout')
    }
  }



  const classForValue = (value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!value || !value.count) {
      return 'color-empty'
    }

    const type = value.type || 'Mixed'
    const intensity = Math.min(value.count, 4) // Cap at 4 levels

    // Return type-specific classes
    switch (type) {
      case 'Push':
        return `color-push-${intensity}`
      case 'Pull':
        return `color-pull-${intensity}`
      case 'Legs':
        return `color-legs-${intensity}`
      case 'Mixed':
        return `color-mixed-${intensity}`
      default:
        return 'color-empty'
    }
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

  let startDate, endDate
  
  if (selectedMonth !== null) {
    // Month view
    startDate = new Date(selectedYear, selectedMonth, 1)
    endDate = new Date(selectedYear, selectedMonth + 1, 0)
  } else {
    // Year view
    startDate = new Date(selectedYear, 0, 1)
    endDate = new Date(selectedYear, 11, 31)
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex flex-col space-y-4 mb-4">
        <h3 className="text-lg font-semibold text-foreground">Workout Activity</h3>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="appearance-none bg-input border border-border text-foreground px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={selectedMonth ?? ''}
            onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
            className="appearance-none bg-input border border-border text-foreground px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Full Year</option>
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>

          <select
            value={selectedWorkoutType}
            onChange={(e) => setSelectedWorkoutType(e.target.value)}
            className="appearance-none bg-input border border-border text-foreground px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Types</option>
            <option value="Push">Push</option>
            <option value="Pull">Pull</option>
            <option value="Legs">Legs</option>
          </select>
        </div>
      </div>

      <div className="workout-heatmap" style={{ height: '220px', overflow: 'hidden' }}>
        <div ref={heatmapRef} style={{ height: '100%' }}>
          <CalendarHeatmap
            startDate={startDate}
            endDate={endDate}
            values={heatmapData}
            classForValue={classForValue}
            onClick={(value) => {
              if (value && value.date && value.count > 0) {
                fetchWorkoutDetails(value.date)
              }
            }}
            showWeekdayLabels={false}
            showMonthLabels={true}
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <div className="flex items-center space-x-3">
          <span className="text-xs">Less</span>
          <div className="flex space-x-1">
            {/* GitHub-style intensity scale */}
            <div className="w-3 h-3 rounded-sm border border-border" 
                 style={{ 
                   backgroundColor: 'hsl(var(--muted) / 0.2)',
                   outline: '1px solid hsl(var(--border))'
                 }} 
                 title="No workouts">
            </div>
            {selectedWorkoutType === 'all' ? (
              <>
                <div className="w-3 h-3 rounded-sm border" 
                     style={{ backgroundColor: '#fecaca', borderColor: 'rgba(27, 31, 35, 0.06)' }} 
                     title="Push (Light)">
                </div>
                <div className="w-3 h-3 rounded-sm border" 
                     style={{ backgroundColor: '#bfdbfe', borderColor: 'rgba(27, 31, 35, 0.06)' }} 
                     title="Pull (Light)">
                </div>
                <div className="w-3 h-3 rounded-sm border" 
                     style={{ backgroundColor: '#bbf7d0', borderColor: 'rgba(27, 31, 35, 0.06)' }} 
                     title="Legs (Light)">
                </div>
                <div className="w-3 h-3 rounded-sm border" 
                     style={{ backgroundColor: '#ddd6fe', borderColor: 'rgba(27, 31, 35, 0.06)' }} 
                     title="Mixed (Light)">
                </div>
              </>
            ) : selectedWorkoutType === 'Push' ? (
              <>
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: '#fecaca', borderColor: 'rgba(27, 31, 35, 0.06)' }}></div>
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: '#f87171', borderColor: 'rgba(27, 31, 35, 0.06)' }}></div>
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: '#dc2626', borderColor: 'rgba(27, 31, 35, 0.06)' }}></div>
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: '#991b1b', borderColor: 'rgba(27, 31, 35, 0.06)' }}></div>
              </>
            ) : selectedWorkoutType === 'Pull' ? (
              <>
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: '#bfdbfe', borderColor: 'rgba(27, 31, 35, 0.06)' }}></div>
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: '#60a5fa', borderColor: 'rgba(27, 31, 35, 0.06)' }}></div>
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: '#2563eb', borderColor: 'rgba(27, 31, 35, 0.06)' }}></div>
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: '#1d4ed8', borderColor: 'rgba(27, 31, 35, 0.06)' }}></div>
              </>
            ) : selectedWorkoutType === 'Legs' ? (
              <>
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: '#bbf7d0', borderColor: 'rgba(27, 31, 35, 0.06)' }}></div>
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: '#4ade80', borderColor: 'rgba(27, 31, 35, 0.06)' }}></div>
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: '#16a34a', borderColor: 'rgba(27, 31, 35, 0.06)' }}></div>
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: '#15803d', borderColor: 'rgba(27, 31, 35, 0.06)' }}></div>
              </>
            ) : null}
          </div>
          <span className="text-xs">More</span>
        </div>
        
        {selectedWorkoutType === 'all' && (
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-sm"></div>
              <span>Push</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>
              <span>Pull</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
              <span>Legs</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-sm"></div>
              <span>Mixed</span>
            </div>
          </div>
        )}
      </div>

      {/* Workout Details Modal */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-card-foreground">
                Workouts for {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {workoutDetails.map((workout, index) => (
                <div key={workout.id} className="border border-border bg-secondary/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      workout.type === 'Push' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                      workout.type === 'Pull' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    }`}>
                      {workout.type}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditWorkout(workout.id)}
                        className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteWorkout(workout.id)}
                        className="px-2 py-1 bg-destructive text-destructive-foreground text-xs rounded hover:bg-destructive/90 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {workout.exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-card-foreground">{exercise.name}</span>
                        <span className="text-muted-foreground">
                          {exercise.sets} × {exercise.reps} @ {exercise.weight_kg}kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {workoutDetails.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No workout details found for this date.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        /* GitHub-style workout heatmap */
        .workout-heatmap .react-calendar-heatmap {
          width: 100%;
          height: 220px;
          max-height: 220px;
        }

        .workout-heatmap .react-calendar-heatmap svg {
          width: 100%;
          height: 220px;
          max-height: 220px;
        }

        /* GitHub-style square tiles */
        .workout-heatmap .react-calendar-heatmap rect {
          width: 11px;
          height: 11px;
          rx: 2px;
          ry: 2px;
          stroke: rgba(27, 31, 35, 0.06);
          stroke-width: 1px;
        }
        
        /* Dark mode border adjustments */
        html.dark .workout-heatmap .react-calendar-heatmap rect {
          stroke: rgba(240, 246, 252, 0.1);
        }
        
        /* Empty/No workout - GitHub style */
        .workout-heatmap .react-calendar-heatmap .color-empty {
          fill: #ebedf0;
        }
        
        /* Dark mode empty squares */
        html.dark .workout-heatmap .react-calendar-heatmap .color-empty {
          fill: #161b22;
        }
        
        /* Push workout colors (Red) - GitHub style intensity levels */
        .workout-heatmap .react-calendar-heatmap .color-push-1 {
          fill: #fecaca;
        }
        .workout-heatmap .react-calendar-heatmap .color-push-2 {
          fill: #f87171;
        }
        .workout-heatmap .react-calendar-heatmap .color-push-3 {
          fill: #dc2626;
        }
        .workout-heatmap .react-calendar-heatmap .color-push-4 {
          fill: #991b1b;
        }
        
        /* Dark mode Push colors */
        html.dark .workout-heatmap .react-calendar-heatmap .color-push-1 {
          fill: #450a0a;
        }
        html.dark .workout-heatmap .react-calendar-heatmap .color-push-2 {
          fill: #7f1d1d;
        }
        html.dark .workout-heatmap .react-calendar-heatmap .color-push-3 {
          fill: #dc2626;
        }
        html.dark .workout-heatmap .react-calendar-heatmap .color-push-4 {
          fill: #ef4444;
        }
        
        /* Pull workout colors (Blue) - GitHub style intensity levels */
        .workout-heatmap .react-calendar-heatmap .color-pull-1 {
          fill: #bfdbfe;
        }
        .workout-heatmap .react-calendar-heatmap .color-pull-2 {
          fill: #60a5fa;
        }
        .workout-heatmap .react-calendar-heatmap .color-pull-3 {
          fill: #2563eb;
        }
        .workout-heatmap .react-calendar-heatmap .color-pull-4 {
          fill: #1d4ed8;
        }
        
        /* Dark mode Pull colors */
        html.dark .workout-heatmap .react-calendar-heatmap .color-pull-1 {
          fill: #1e3a8a;
        }
        html.dark .workout-heatmap .react-calendar-heatmap .color-pull-2 {
          fill: #1e40af;
        }
        html.dark .workout-heatmap .react-calendar-heatmap .color-pull-3 {
          fill: #2563eb;
        }
        html.dark .workout-heatmap .react-calendar-heatmap .color-pull-4 {
          fill: #3b82f6;
        }
        
        /* Legs workout colors (Green) - GitHub style intensity levels */
        .workout-heatmap .react-calendar-heatmap .color-legs-1 {
          fill: #bbf7d0;
        }
        .workout-heatmap .react-calendar-heatmap .color-legs-2 {
          fill: #4ade80;
        }
        .workout-heatmap .react-calendar-heatmap .color-legs-3 {
          fill: #16a34a;
        }
        .workout-heatmap .react-calendar-heatmap .color-legs-4 {
          fill: #15803d;
        }
        
        /* Dark mode Legs colors */
        html.dark .workout-heatmap .react-calendar-heatmap .color-legs-1 {
          fill: #14532d;
        }
        html.dark .workout-heatmap .react-calendar-heatmap .color-legs-2 {
          fill: #166534;
        }
        html.dark .workout-heatmap .react-calendar-heatmap .color-legs-3 {
          fill: #16a34a;
        }
        html.dark .workout-heatmap .react-calendar-heatmap .color-legs-4 {
          fill: #22c55e;
        }
        
        /* Mixed workout colors (Purple) - GitHub style intensity levels */
        .workout-heatmap .react-calendar-heatmap .color-mixed-1 {
          fill: #ddd6fe;
        }
        .workout-heatmap .react-calendar-heatmap .color-mixed-2 {
          fill: #a78bfa;
        }
        .workout-heatmap .react-calendar-heatmap .color-mixed-3 {
          fill: #7c3aed;
        }
        .workout-heatmap .react-calendar-heatmap .color-mixed-4 {
          fill: #5b21b6;
        }
        
        /* Dark mode Mixed colors */
        html.dark .workout-heatmap .react-calendar-heatmap .color-mixed-1 {
          fill: #581c87;
        }
        html.dark .workout-heatmap .react-calendar-heatmap .color-mixed-2 {
          fill: #6b21a8;
        }
        html.dark .workout-heatmap .react-calendar-heatmap .color-mixed-3 {
          fill: #7c3aed;
        }
        html.dark .workout-heatmap .react-calendar-heatmap .color-mixed-4 {
          fill: #8b5cf6;
        }
        
        /* GitHub-style text labels */
        .workout-heatmap .react-calendar-heatmap text {
          font-size: 9px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
          fill: hsl(var(--muted-foreground));
        }

        /* Hover effects - GitHub style */
        .workout-heatmap .react-calendar-heatmap [class*="color-"]:not(.color-empty) {
          cursor: pointer;
        }

        .workout-heatmap .react-calendar-heatmap [class*="color-"]:not(.color-empty):hover {
          stroke: rgba(27, 31, 35, 0.15) !important;
          stroke-width: 1px;
        }

        /* Dark mode hover */
        html.dark .workout-heatmap .react-calendar-heatmap [class*="color-"]:not(.color-empty):hover {
          stroke: rgba(240, 246, 252, 0.3) !important;
        }
      `}</style>
    </div>
  )
} 