'use client'
import { useState, useEffect, useRef } from 'react'
import CalendarHeatmap from 'react-calendar-heatmap'
import { supabase } from '@/lib/supabase'
import { Workout } from '@/types'
import 'react-calendar-heatmap/dist/styles.css'

interface HeatmapValue {
  date: string
  count: number
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [workoutDetails, setWorkoutDetails] = useState<WorkoutDetail[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchHeatmapData()
  }, [userId, selectedYear, selectedMonth])

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

      const { data: workouts, error } = await supabase
        .from('workouts')
        .select('date, type')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
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
        <h3 className="text-lg font-semibold text-gray-900">Workout Activity</h3>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={selectedMonth ?? ''}
            onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Full Year</option>
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="workout-heatmap" style={{ height: '200px', overflow: 'hidden' }}>
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

      {/* Workout Details Modal */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Workouts for {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {workoutDetails.map((workout, index) => (
                <div key={workout.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      workout.type === 'Push' ? 'bg-red-100 text-red-800' :
                      workout.type === 'Pull' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {workout.type}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditWorkout(workout.id)}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteWorkout(workout.id)}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {workout.exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700">{exercise.name}</span>
                        <span className="text-gray-600">
                          {exercise.sets} × {exercise.reps} @ {exercise.weight_kg}kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {workoutDetails.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No workout details found for this date.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .workout-heatmap .react-calendar-heatmap {
          width: 100%;
          height: 200px;
          max-height: 200px;
        }

        .workout-heatmap .react-calendar-heatmap svg {
          width: 100%;
          height: 200px;
          max-height: 200px;
        }

        .workout-heatmap .react-calendar-heatmap rect {
          max-width: 15px;
          max-height: 15px;
          rx: 2;
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

        .workout-heatmap .react-calendar-heatmap .color-scale-1,
        .workout-heatmap .react-calendar-heatmap .color-scale-2,
        .workout-heatmap .react-calendar-heatmap .color-scale-3,
        .workout-heatmap .react-calendar-heatmap .color-scale-4 {
          cursor: pointer;
        }

        .workout-heatmap .react-calendar-heatmap .color-scale-1:hover,
        .workout-heatmap .react-calendar-heatmap .color-scale-2:hover,
        .workout-heatmap .react-calendar-heatmap .color-scale-3:hover,
        .workout-heatmap .react-calendar-heatmap .color-scale-4:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  )
} 