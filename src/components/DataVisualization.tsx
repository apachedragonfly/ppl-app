'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Award,
  Zap,
  Download,
  Brain,
  Shield,
  AlertTriangle
} from 'lucide-react'

// Progressive Overload Analysis Interface
interface ProgressiveOverloadData {
  exercise: string
  dates: string[]
  weights: number[]
  percentageIncrease: number
  isPlateaued: boolean
  weeksSinceIncrease: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

// Muscle Group Volume Analysis Interface
interface MuscleGroupVolume {
  group: string
  weeklyVolume: number
  percentage: number
  sessions: number
  isOverloaded: boolean
  isNeglected: boolean
}

interface DataVisualizationProps {
  userId: string
}

export default function DataVisualization({ userId }: DataVisualizationProps) {
  const [timeRange, setTimeRange] = useState('3months')
  const [activeTab, setActiveTab] = useState('overload')
  const [loading, setLoading] = useState(true)
  
  // Progressive Overload State
  const [progressiveOverload, setProgressiveOverload] = useState<ProgressiveOverloadData[]>([])
  
  // Volume Analysis State
  const [muscleGroupVolumes, setMuscleGroupVolumes] = useState<MuscleGroupVolume[]>([])

  useEffect(() => {
    if (userId) {
      loadAdvancedMetrics()
    }
  }, [userId, timeRange])

  const getDateRange = () => {
    const now = new Date()
    const ranges = {
      '1month': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '3months': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '6months': new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      '1year': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      'all': new Date('2020-01-01')
    }
    return ranges[timeRange as keyof typeof ranges] || ranges['3months']
  }

  const loadAdvancedMetrics = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadProgressiveOverloadData(),
        loadMuscleGroupVolumeData()
      ])
    } catch (error) {
      console.error('Error loading advanced metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Progressive Overload Analysis Implementation
  const loadProgressiveOverloadData = async () => {
    try {
      const startDate = getDateRange().toISOString().split('T')[0]
      
      const { data: logs, error } = await supabase
        .from('workout_logs')
        .select(`
          weight_kg,
          exercises (name),
          workouts!inner (date, user_id)
        `)
        .eq('workouts.user_id', userId)
        .gte('workouts.date', startDate)
        .order('workouts.date')

      if (error) throw error

      // Group by exercise and analyze progression
      const exerciseMap: { [key: string]: { dates: string[], weights: number[] } } = {}
      
      logs?.forEach(log => {
        const exercise = Array.isArray(log.exercises) ? log.exercises[0] : log.exercises
        const exerciseName = exercise?.name
        const workoutDate = Array.isArray(log.workouts) ? log.workouts[0]?.date : log.workouts?.date
        
        if (!exerciseName || !workoutDate) return

        if (!exerciseMap[exerciseName]) {
          exerciseMap[exerciseName] = { dates: [], weights: [] }
        }
        
        exerciseMap[exerciseName].dates.push(workoutDate)
        exerciseMap[exerciseName].weights.push(log.weight_kg)
      })

      const overloadData: ProgressiveOverloadData[] = Object.entries(exerciseMap)
        .map(([exercise, data]) => {
          const weights = data.weights
          const firstWeight = weights[0] || 0
          const lastWeight = weights[weights.length - 1] || 0
          const percentageIncrease = firstWeight > 0 ? ((lastWeight - firstWeight) / firstWeight) * 100 : 0
          
          // Check for plateau (no increase in last 4 weeks)
          const recentWeights = weights.slice(-4)
          const maxRecent = Math.max(...recentWeights)
          const isPlateaued = recentWeights.length >= 3 && recentWeights.every(w => w <= maxRecent * 0.95)
          
          // Determine trend
          let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
          if (weights.length >= 3) {
            const firstHalf = weights.slice(0, Math.floor(weights.length / 2))
            const secondHalf = weights.slice(-Math.floor(weights.length / 2))
            const firstAvg = firstHalf.reduce((sum, w) => sum + w, 0) / firstHalf.length
            const secondAvg = secondHalf.reduce((sum, w) => sum + w, 0) / secondHalf.length
            
            if (secondAvg > firstAvg * 1.05) trend = 'increasing'
            else if (secondAvg < firstAvg * 0.95) trend = 'decreasing'
          }
          
          return {
            exercise,
            dates: data.dates,
            weights,
            percentageIncrease: Math.round(percentageIncrease * 100) / 100,
            isPlateaued,
            weeksSinceIncrease: isPlateaued ? 4 : 0,
            trend
          }
        })
        .filter(data => data.weights.length >= 3)
        .sort((a, b) => b.percentageIncrease - a.percentageIncrease)

      setProgressiveOverload(overloadData)
    } catch (error) {
      console.error('Error loading progressive overload data:', error)
      setProgressiveOverload([])
    }
  }

  // Muscle Group Volume Analysis Implementation
  const loadMuscleGroupVolumeData = async () => {
    try {
      const startDate = getDateRange().toISOString().split('T')[0]
      
      const { data: logs, error } = await supabase
        .from('workout_logs')
        .select(`
          sets,
          reps,
          weight_kg,
          exercises (name, muscle_group),
          workouts!inner (date, user_id)
        `)
        .eq('workouts.user_id', userId)
        .gte('workouts.date', startDate)

      if (error) throw error

      const muscleGroupMap: { [key: string]: { volume: number, sessions: Set<string> } } = {}
      
      logs?.forEach(log => {
        const exercise = Array.isArray(log.exercises) ? log.exercises[0] : log.exercises
        const muscleGroup = exercise?.muscle_group || 'Other'
        const volume = log.sets * log.reps * log.weight_kg
        
        if (!muscleGroupMap[muscleGroup]) {
          muscleGroupMap[muscleGroup] = { volume: 0, sessions: new Set() }
        }
        
        muscleGroupMap[muscleGroup].volume += volume
        muscleGroupMap[muscleGroup].sessions.add(exercise?.name || '')
      })

      const totalVolume = Object.values(muscleGroupMap).reduce((sum, data) => sum + data.volume, 0)
      const weeklyMultiplier = timeRange === '1month' ? 4 : timeRange === '3months' ? 12 : timeRange === '6months' ? 24 : timeRange === '1year' ? 52 : 100
      
      const volumeData: MuscleGroupVolume[] = Object.entries(muscleGroupMap)
        .map(([group, data]) => {
          const weeklyVolume = Math.round(data.volume / weeklyMultiplier)
          const percentage = Math.round((data.volume / totalVolume) * 100)
          
          return {
            group,
            weeklyVolume,
            percentage,
            sessions: data.sessions.size,
            isOverloaded: weeklyVolume > 15000, // High volume threshold
            isNeglected: weeklyVolume < 2000    // Low volume threshold
          }
        })
        .sort((a, b) => b.weeklyVolume - a.weeklyVolume)

      setMuscleGroupVolumes(volumeData)
    } catch (error) {
      console.error('Error loading muscle group data:', error)
      setMuscleGroupVolumes([])
    }
  }

  const exportData = () => {
    alert('Advanced analytics export coming soon! This will generate comprehensive PDF reports with all metrics.')
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Advanced Training Analytics</h1>
            <p className="text-muted-foreground">Evidence-based metrics for optimal programming and performance</p>
          </div>
          <div className="flex items-center gap-4">
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
            <Button onClick={exportData} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overload" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Overload
          </TabsTrigger>
          <TabsTrigger value="volume" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Volume
          </TabsTrigger>
          <TabsTrigger value="sfr" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            SFR
          </TabsTrigger>
          <TabsTrigger value="effort" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Effort
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Quality
          </TabsTrigger>
          <TabsTrigger value="efficiency" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Efficiency
          </TabsTrigger>
          <TabsTrigger value="recovery" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Recovery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Progressive Overload Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progressiveOverload.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No progressive overload data available. Log more workouts to see strength trends.
                </div>
              ) : (
                <div className="space-y-4">
                  {progressiveOverload.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{data.exercise}</h3>
                        <p className="text-sm text-muted-foreground">
                          {data.weights.length} sessions tracked • {data.weights[0]}kg → {data.weights[data.weights.length - 1]}kg
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {data.percentageIncrease > 0 ? '+' : ''}{data.percentageIncrease}%
                          </div>
                          <div className="text-sm text-muted-foreground">strength gain</div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant={data.isPlateaued ? "destructive" : data.percentageIncrease > 10 ? "default" : "secondary"}>
                            {data.isPlateaued ? (
                              <>
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Plateaued
                              </>
                            ) : (
                              <>
                                {data.trend === 'increasing' ? <TrendingUp className="w-3 h-3 mr-1" /> : 
                                 data.trend === 'decreasing' ? <TrendingDown className="w-3 h-3 mr-1" /> : 
                                 <TrendingUp className="w-3 h-3 mr-1" />}
                                {data.trend === 'increasing' ? 'Progressing' : 
                                 data.trend === 'decreasing' ? 'Declining' : 'Stable'}
                              </>
                            )}
                          </Badge>
                          {data.isPlateaued && (
                            <div className="text-xs text-muted-foreground">
                              {data.weeksSinceIncrease} weeks stalled
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Muscle Group Volume Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {muscleGroupVolumes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No volume data available. Complete workouts to see muscle group analysis.
                </div>
              ) : (
                <div className="space-y-4">
                  {muscleGroupVolumes.map((data, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{data.group}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {data.weeklyVolume.toLocaleString()}kg/week
                          </span>
                          <Badge variant={data.isOverloaded ? "destructive" : data.isNeglected ? "secondary" : "default"}>
                            {data.isOverloaded ? 'High Volume' : data.isNeglected ? 'Low Volume' : 'Optimal'}
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            data.isOverloaded ? 'bg-red-500' : data.isNeglected ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(data.percentage * 2, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {data.sessions} different exercises • {data.percentage}% of total volume
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sfr" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Stimulus-to-Fatigue Ratio Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                SFR analysis coming soon! This will help optimize exercise selection for maximum efficiency.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effort" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Effort & RPE Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                RPE tracking and effort analysis coming soon! This will monitor training intensity and burnout risk.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Set Quality & RIR Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Set quality analysis coming soon! This will track RIR and fatigue patterns across sets.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Lift Efficiency Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Exercise efficiency and ROI analysis coming soon! This will identify your most productive lifts.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Recovery & Load Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Recovery tracking and load management coming soon! This will monitor overreaching and optimize training loads.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
