'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Clock,
  Weight,
  Filter,
  Search,
  Eye,
  Share,
  Settings
} from 'lucide-react'

interface ReportsProps {
  userId: string
}

export default function Reports({ userId }: ReportsProps) {
  const [reportType, setReportType] = useState('summary')
  const [timeRange, setTimeRange] = useState('monthly')
  const [selectedPeriod, setSelectedPeriod] = useState('2024-03')
  const [filterExercise, setFilterExercise] = useState('all')

  // Mock data for comprehensive reports
  const mockSummaryReport = {
    period: 'March 2024',
    totalWorkouts: 20,
    totalVolume: 42500,
    totalDuration: 1050,
    avgWorkoutDuration: 52.5,
    avgVolumePerWorkout: 2125,
    strengthGains: 8.5,
    consistencyScore: 85,
    topExercises: [
      { name: 'Barbell Back Squat', volume: 8500, sessions: 8 },
      { name: 'Barbell Bench Press', volume: 6200, sessions: 7 },
      { name: 'Deadlifts', volume: 5800, sessions: 6 }
    ],
    muscleGroupBreakdown: [
      { group: 'Legs', percentage: 35, volume: 14875 },
      { group: 'Chest', percentage: 25, volume: 10625 },
      { group: 'Back', percentage: 22, volume: 9350 },
      { group: 'Shoulders', percentage: 10, volume: 4250 },
      { group: 'Arms', percentage: 8, volume: 3400 }
    ],
    achievements: [
      'New Bench Press PR: 95kg',
      'Completed 20 workouts this month',
      'Increased total volume by 15%'
    ]
  }

  const mockProgressReport = {
    period: 'Last 3 Months',
    exerciseProgress: [
      {
        exercise: 'Barbell Bench Press',
        startWeight: 75,
        currentWeight: 95,
        improvement: 26.7,
        sessions: 21,
        volumeIncrease: 32.5,
        notes: 'Consistent progression with good form'
      },
      {
        exercise: 'Barbell Back Squat',
        startWeight: 95,
        currentWeight: 125,
        improvement: 31.6,
        sessions: 24,
        volumeIncrease: 28.8,
        notes: 'Excellent depth and stability improvement'
      },
      {
        exercise: 'Deadlifts',
        startWeight: 120,
        currentWeight: 155,
        improvement: 29.2,
        sessions: 18,
        volumeIncrease: 35.2,
        notes: 'Form refinement led to strength gains'
      }
    ],
    overallProgress: {
      totalVolumeIncrease: 28.5,
      averageSessionIncrease: 15.2,
      strengthGainRate: 9.8,
      consistencyImprovement: 12.3
    }
  }

  const mockComparisonReport = {
    currentPeriod: 'March 2024',
    previousPeriod: 'February 2024',
    comparisons: [
      { metric: 'Total Workouts', current: 20, previous: 16, change: 25 },
      { metric: 'Total Volume', current: 42500, previous: 38200, change: 11.3 },
      { metric: 'Avg Duration', current: 52.5, previous: 48.2, change: 8.9 },
      { metric: 'PR Count', current: 3, previous: 1, change: 200 },
      { metric: 'Consistency Score', current: 85, previous: 72, change: 18.1 }
    ],
    insights: [
      'Workout frequency increased significantly this month',
      'Volume progression is on track with goals',
      'Session duration optimized for better efficiency',
      'Multiple personal records achieved'
    ]
  }

  const renderSummaryReport = () => (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Workouts</p>
                <p className="text-2xl font-bold">{mockSummaryReport.totalWorkouts}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">{mockSummaryReport.totalVolume.toLocaleString()}kg</p>
              </div>
              <Weight className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Duration</p>
                <p className="text-2xl font-bold">{Math.round(mockSummaryReport.totalDuration / 60)}h</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consistency</p>
                <p className="text-2xl font-bold">{mockSummaryReport.consistencyScore}%</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Exercises by Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSummaryReport.topExercises.map((exercise, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-sm text-muted-foreground">{exercise.sessions} sessions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{exercise.volume.toLocaleString()}kg</p>
                    <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Muscle Group Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSummaryReport.muscleGroupBreakdown.map((group, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{group.group}</span>
                    <span className="text-sm text-muted-foreground">{group.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                      style={{ width: `${group.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{group.volume.toLocaleString()}kg total</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Monthly Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {mockSummaryReport.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="font-medium text-green-800">{achievement}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderProgressReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">+{mockProgressReport.overallProgress.totalVolumeIncrease}%</div>
              <div className="text-sm text-blue-700">Total Volume</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">+{mockProgressReport.overallProgress.averageSessionIncrease}%</div>
              <div className="text-sm text-green-700">Session Quality</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{mockProgressReport.overallProgress.strengthGainRate}%</div>
              <div className="text-sm text-purple-700">Strength Gain Rate</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">+{mockProgressReport.overallProgress.consistencyImprovement}%</div>
              <div className="text-sm text-orange-700">Consistency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exercise-Specific Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {mockProgressReport.exerciseProgress.map((exercise, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{exercise.exercise}</h3>
                  <Badge variant="default" className="bg-green-500">
                    +{exercise.improvement}%
                  </Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Weight Progress</p>
                    <p className="text-xl font-bold">{exercise.startWeight}kg → {exercise.currentWeight}kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sessions</p>
                    <p className="text-xl font-bold">{exercise.sessions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Volume Increase</p>
                    <p className="text-xl font-bold">+{exercise.volumeIncrease}%</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm font-medium mb-1">Progress Notes:</p>
                  <p className="text-sm text-muted-foreground">{exercise.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderComparisonReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Period Comparison: {mockComparisonReport.currentPeriod} vs {mockComparisonReport.previousPeriod}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockComparisonReport.comparisons.map((comparison, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{comparison.metric}</p>
                  <p className="text-sm text-muted-foreground">
                    {comparison.current} vs {comparison.previous}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${comparison.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison.change > 0 ? '+' : ''}{comparison.change}%
                  </div>
                  <div className="flex items-center">
                    {comparison.change > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockComparisonReport.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <p className="text-blue-800">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const exportReport = () => {
    alert(`Exporting ${reportType} report for ${selectedPeriod}...`)
  }

  const shareReport = () => {
    alert('Share functionality coming soon!')
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Comprehensive Reports</h1>
            <p className="text-muted-foreground">Detailed analytics and insights for your fitness journey</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={shareReport}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button onClick={exportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Report Controls */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-muted rounded-lg">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="summary">📊 Summary Report</SelectItem>
            <SelectItem value="progress">📈 Progress Report</SelectItem>
            <SelectItem value="comparison">🔄 Comparison Report</SelectItem>
            <SelectItem value="detailed">📋 Detailed Report</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024-03">March 2024</SelectItem>
            <SelectItem value="2024-02">February 2024</SelectItem>
            <SelectItem value="2024-01">January 2024</SelectItem>
            <SelectItem value="2023-12">December 2023</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterExercise} onValueChange={setFilterExercise}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter exercises" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exercises</SelectItem>
            <SelectItem value="compound">Compound Only</SelectItem>
            <SelectItem value="isolation">Isolation Only</SelectItem>
            <SelectItem value="upper">Upper Body</SelectItem>
            <SelectItem value="lower">Lower Body</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Report Content */}
      <div className="space-y-6">
        {reportType === 'summary' && renderSummaryReport()}
        {reportType === 'progress' && renderProgressReport()}
        {reportType === 'comparison' && renderComparisonReport()}
        {reportType === 'detailed' && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed report functionality coming soon! This will include:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-sm">
                <li>Exercise-by-exercise breakdown</li>
                <li>Set-by-set analysis</li>
                <li>Form and technique notes</li>
                <li>Recovery and rest day analysis</li>
                <li>Nutrition correlation (if tracked)</li>
                <li>Custom date range selection</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Report Footer */}
      <Card className="mt-8">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Report generated on {new Date().toLocaleDateString()} for user {userId}
            </div>
            <div className="flex items-center gap-4">
              <span>Data period: {selectedPeriod}</span>
              <span>Report type: {reportType}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 