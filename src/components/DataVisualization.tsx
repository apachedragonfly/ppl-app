'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  Award,
  Activity,
  Zap,
  Clock,
  Weight,
  Download,
  Filter,
  Eye,
  PieChart,
  LineChart
} from 'lucide-react'

interface DataVisualizationProps {
  userId: string
}

export default function DataVisualization({ userId }: DataVisualizationProps) {
  const [timeRange, setTimeRange] = useState('3months')
  const [selectedMetric, setSelectedMetric] = useState('volume')
  const [chartType, setChartType] = useState('line')
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data for demonstration
  const mockWorkoutData = [
    { date: '2024-01-01', volume: 2400, workouts: 3, duration: 180, exercises: 12 },
    { date: '2024-01-08', volume: 2800, workouts: 4, duration: 210, exercises: 15 },
    { date: '2024-01-15', volume: 3200, workouts: 4, duration: 240, exercises: 16 },
    { date: '2024-01-22', volume: 2900, workouts: 3, duration: 195, exercises: 14 },
    { date: '2024-01-29', volume: 3400, workouts: 5, duration: 275, exercises: 18 },
    { date: '2024-02-05', volume: 3600, workouts: 4, duration: 250, exercises: 17 },
    { date: '2024-02-12', volume: 3100, workouts: 3, duration: 185, exercises: 13 },
    { date: '2024-02-19', volume: 3800, workouts: 5, duration: 290, exercises: 19 },
    { date: '2024-02-26', volume: 3500, workouts: 4, duration: 235, exercises: 16 },
    { date: '2024-03-05', volume: 4000, workouts: 5, duration: 310, exercises: 20 },
    { date: '2024-03-12', volume: 3700, workouts: 4, duration: 260, exercises: 17 },
    { date: '2024-03-19', volume: 4200, workouts: 5, duration: 325, exercises: 21 }
  ]

  const mockExerciseProgress = [
    { exercise: 'Barbell Bench Press', current: 85, previous: 80, change: 6.25, sessions: 15 },
    { exercise: 'Barbell Back Squat', current: 110, previous: 105, change: 4.76, sessions: 18 },
    { exercise: 'Deadlifts', current: 140, previous: 135, change: 3.70, sessions: 12 },
    { exercise: 'Overhead Press', current: 60, previous: 57.5, change: 4.35, sessions: 14 },
    { exercise: 'Barbell Rows', current: 75, previous: 70, change: 7.14, sessions: 16 },
    { exercise: 'Incline Dumbbell Press', current: 32.5, previous: 30, change: 8.33, sessions: 13 }
  ]

  const mockMuscleGroupData = [
    { group: 'Chest', volume: 8500, percentage: 22, sessions: 24 },
    { group: 'Back', volume: 9200, percentage: 24, sessions: 26 },
    { group: 'Legs', volume: 12800, percentage: 33, sessions: 20 },
    { group: 'Shoulders', volume: 4200, percentage: 11, sessions: 18 },
    { group: 'Arms', volume: 3800, percentage: 10, sessions: 22 }
  ]

  const mockPersonalRecords = [
    { exercise: 'Bench Press', weight: 95, date: '2024-03-15', type: '1RM' },
    { exercise: 'Squat', weight: 125, date: '2024-03-10', type: '1RM' },
    { exercise: 'Deadlift', weight: 155, date: '2024-03-05', type: '1RM' },
    { exercise: 'Overhead Press', weight: 65, date: '2024-03-12', type: '1RM' },
    { exercise: 'Pull-ups', reps: 15, date: '2024-03-18', type: 'Max Reps' }
  ]

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalVolume = mockWorkoutData.reduce((sum, week) => sum + week.volume, 0)
    const totalWorkouts = mockWorkoutData.reduce((sum, week) => sum + week.workouts, 0)
    const totalDuration = mockWorkoutData.reduce((sum, week) => sum + week.duration, 0)
    const avgVolumePerWorkout = totalVolume / totalWorkouts
    const avgDuration = totalDuration / totalWorkouts

    const currentWeek = mockWorkoutData[mockWorkoutData.length - 1]
    const previousWeek = mockWorkoutData[mockWorkoutData.length - 2]
    
    const volumeChange = ((currentWeek.volume - previousWeek.volume) / previousWeek.volume) * 100
    const workoutChange = ((currentWeek.workouts - previousWeek.workouts) / previousWeek.workouts) * 100

    return {
      totalVolume,
      totalWorkouts,
      totalDuration,
      avgVolumePerWorkout: Math.round(avgVolumePerWorkout),
      avgDuration: Math.round(avgDuration),
      volumeChange: Math.round(volumeChange * 10) / 10,
      workoutChange: Math.round(workoutChange * 10) / 10
    }
  }, [mockWorkoutData])

  const renderChart = () => {
    const maxValue = Math.max(...mockWorkoutData.map(d => d[selectedMetric as keyof typeof d] as number))
    const minValue = Math.min(...mockWorkoutData.map(d => d[selectedMetric as keyof typeof d] as number))
    
    return (
      <div className="h-64 relative">
        <div className="absolute inset-0 flex items-end justify-between px-4 pb-8">
          {mockWorkoutData.map((data, index) => {
            const value = data[selectedMetric as keyof typeof data] as number
            const height = ((value - minValue) / (maxValue - minValue)) * 200 + 20
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-sm w-8 transition-all duration-300 hover:from-blue-600 hover:to-blue-400"
                  style={{ height: `${height}px` }}
                />
                <span className="text-xs text-muted-foreground mt-2 rotate-45 origin-left">
                  {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )
          })}
        </div>
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-muted-foreground">
          <span>{maxValue}</span>
          <span>{Math.round((maxValue + minValue) / 2)}</span>
          <span>{minValue}</span>
        </div>
      </div>
    )
  }

  const renderProgressChart = () => {
    return (
      <div className="space-y-4">
        {mockExerciseProgress.map((exercise, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{exercise.exercise}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{exercise.current}kg</span>
                <Badge variant={exercise.change > 0 ? "default" : "secondary"} className="text-xs">
                  {exercise.change > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {exercise.change > 0 ? '+' : ''}{exercise.change}%
                </Badge>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((exercise.current / 200) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{exercise.sessions} sessions</span>
              <span>Previous: {exercise.previous}kg</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderMuscleGroupChart = () => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    
    return (
      <div className="space-y-4">
        {mockMuscleGroupData.map((group, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{group.group}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{group.volume.toLocaleString()}kg</span>
                <Badge variant="outline">{group.percentage}%</Badge>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${group.percentage * 3}%`,
                  backgroundColor: colors[index % colors.length]
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {group.sessions} sessions this period
            </div>
          </div>
        ))}
      </div>
    )
  }

  const getMetricUnit = (metric: string) => {
    switch (metric) {
      case 'volume': return 'kg'
      case 'workouts': return 'sessions'
      case 'duration': return 'minutes'
      case 'exercises': return 'exercises'
      default: return ''
    }
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'volume': return <Weight className="w-4 h-4" />
      case 'workouts': return <Activity className="w-4 h-4" />
      case 'duration': return <Clock className="w-4 h-4" />
      case 'exercises': return <Target className="w-4 h-4" />
      default: return <BarChart3 className="w-4 h-4" />
    }
  }

  const exportData = () => {
    alert('Export functionality coming soon! This will generate PDF/CSV reports.')
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Data Visualization & Reports</h1>
            <p className="text-muted-foreground">Comprehensive analytics and insights into your fitness journey</p>
          </div>
          <Button onClick={exportData} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="volume">Total Volume</SelectItem>
            <SelectItem value="workouts">Workout Count</SelectItem>
            <SelectItem value="duration">Duration</SelectItem>
            <SelectItem value="exercises">Exercise Count</SelectItem>
          </SelectContent>
        </Select>

        <Select value={chartType} onValueChange={setChartType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Chart type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="line">Line Chart</SelectItem>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="area">Area Chart</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Breakdown
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <Weight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalVolume.toLocaleString()}kg</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {summaryStats.volumeChange > 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                  )}
                  {summaryStats.volumeChange > 0 ? '+' : ''}{summaryStats.volumeChange}% from last week
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalWorkouts}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {summaryStats.workoutChange > 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                  )}
                  {summaryStats.workoutChange > 0 ? '+' : ''}{summaryStats.workoutChange}% from last week
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Volume/Workout</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.avgVolumePerWorkout}kg</div>
                <p className="text-xs text-muted-foreground">
                  Across {summaryStats.totalWorkouts} sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.avgDuration}min</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(summaryStats.totalDuration / 60)}h total time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getMetricIcon(selectedMetric)}
                {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderChart()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Weekly Volume Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 relative">
                  <div className="absolute inset-0 flex items-end justify-between px-2">
                    {mockWorkoutData.slice(-8).map((data, index) => {
                      const height = (data.volume / 4500) * 160 + 20
                      return (
                        <div key={index} className="flex flex-col items-center">
                          <div 
                            className="bg-gradient-to-t from-green-500 to-green-300 rounded-t-sm w-6"
                            style={{ height: `${height}px` }}
                          />
                          <span className="text-xs text-muted-foreground mt-1 rotate-45 origin-left">
                            {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Workout Frequency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 relative">
                  <div className="absolute inset-0 flex items-end justify-between px-2">
                    {mockWorkoutData.slice(-8).map((data, index) => {
                      const height = (data.workouts / 6) * 160 + 20
                      return (
                        <div key={index} className="flex flex-col items-center">
                          <div 
                            className="bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-sm w-6"
                            style={{ height: `${height}px` }}
                          />
                          <span className="text-xs text-muted-foreground mt-1 rotate-45 origin-left">
                            {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">+18%</div>
                  <div className="text-sm text-green-700">Volume increase</div>
                  <div className="text-xs text-muted-foreground">vs. last period</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">4.2</div>
                  <div className="text-sm text-blue-700">Avg workouts/week</div>
                  <div className="text-xs text-muted-foreground">Consistent routine</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">65min</div>
                  <div className="text-sm text-purple-700">Avg session time</div>
                  <div className="text-xs text-muted-foreground">Optimal duration</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Exercise Progress Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderProgressChart()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Muscle Group Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderMuscleGroupChart()}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Workout Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: 'Push', count: 15, percentage: 38 },
                    { type: 'Pull', count: 14, percentage: 35 },
                    { type: 'Legs', count: 11, percentage: 27 }
                  ].map((type, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{type.type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-2 rounded-full"
                            style={{ width: `${type.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12">{type.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Training Intensity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { intensity: 'High (80-100%)', sessions: 8, color: 'red' },
                    { intensity: 'Medium (60-80%)', sessions: 22, color: 'yellow' },
                    { intensity: 'Low (40-60%)', sessions: 10, color: 'green' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{item.intensity}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-${item.color}-500`}
                            style={{ width: `${(item.sessions / 40) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12">{item.sessions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Personal Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {mockPersonalRecords.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                    <div>
                      <div className="font-semibold">{record.exercise}</div>
                      <div className="text-sm text-muted-foreground">{record.type}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-600">
                        {record.weight ? `${record.weight}kg` : `${record.reps} reps`}
                      </div>
                      <Trophy className="w-5 h-5 text-yellow-500 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Achievement Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { date: '2024-03-18', achievement: 'First 15 Pull-ups!', type: 'milestone' },
                  { date: '2024-03-15', achievement: 'Bench Press 95kg PR', type: 'pr' },
                  { date: '2024-03-10', achievement: 'Squat 125kg PR', type: 'pr' },
                  { date: '2024-03-05', achievement: 'Deadlift 155kg PR', type: 'pr' },
                  { date: '2024-03-01', achievement: '30-day workout streak!', type: 'streak' }
                ].map((achievement, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      achievement.type === 'pr' ? 'bg-red-500' :
                      achievement.type === 'milestone' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium">{achievement.achievement}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(achievement.date).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {achievement.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 