'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Activity,
  Zap,
  Clock,
  Weight,
  BarChart3,
  PieChart,
  Award,
  Calendar,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

interface AdvancedMetricsProps {
  userId: string
}

export default function AdvancedMetrics({ userId }: AdvancedMetricsProps) {
  const [timeframe, setTimeframe] = useState('30days')
  const [metricCategory, setMetricCategory] = useState('performance')

  // Mock advanced metrics data
  const mockAdvancedData = {
    performance: {
      strengthEnduranceRatio: 0.75,
      volumeIntensityIndex: 82.5,
      progressVelocity: 1.8,
      trainingLoad: 385,
      recoveryScore: 78,
      workoutEfficiency: 88.5,
      strengthGainRate: 2.3,
      muscleBalanceScore: 91
    },
    physiological: {
      estimatedVO2Max: 45.2,
      anaerobicThreshold: 78,
      fatigueFactor: 0.15,
      adaptationRate: 1.6,
      neuromuscularFatigue: 0.22,
      metabolicStress: 0.68,
      mechanicalTension: 0.85,
      muscleActivation: 0.92
    },
    biomechanical: {
      movementQuality: 87,
      rangeOfMotion: 94,
      stabilityIndex: 82,
      coordinationScore: 89,
      powerOutput: 425,
      forceProduction: 0.78,
      velocityProfile: 1.25,
      symmetryIndex: 0.95
    },
    periodization: {
      peakingIndex: 0.72,
      deloadEffectiveness: 85,
      adaptationPhase: 'Accumulation',
      trainingStress: 145,
      fitnessLevel: 78,
      fatigueLevel: 32,
      formLevel: 85,
      readinessScore: 82
    }
  }

  const mockTrendData = [
    { date: '2024-01-01', value: 75 },
    { date: '2024-01-08', value: 78 },
    { date: '2024-01-15', value: 82 },
    { date: '2024-01-22', value: 79 },
    { date: '2024-01-29', value: 85 },
    { date: '2024-02-05', value: 88 },
    { date: '2024-02-12', value: 86 },
    { date: '2024-02-19', value: 91 },
    { date: '2024-02-26', value: 89 },
    { date: '2024-03-05', value: 94 },
    { date: '2024-03-12', value: 92 },
    { date: '2024-03-19', value: 96 }
  ]

  const getScoreColor = (score: number, isInverted = false) => {
    if (isInverted) {
      if (score <= 30) return 'text-green-600'
      if (score <= 60) return 'text-yellow-600'
      return 'text-red-600'
    }
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number, isInverted = false) => {
    if (isInverted) {
      if (score <= 30) return 'bg-green-100 text-green-800'
      if (score <= 60) return 'bg-yellow-100 text-yellow-800'
      return 'bg-red-100 text-red-800'
    }
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUpRight className="w-4 h-4 text-green-500" />
    if (current < previous) return <ArrowDownRight className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const renderPerformanceMetrics = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            Training Load
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-3xl font-bold">{mockAdvancedData.performance.trainingLoad}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                style={{ width: `${(mockAdvancedData.performance.trainingLoad / 500) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Optimal range: 300-400</span>
              <Badge className={getScoreBadge(77)}>Moderate</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Workout Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-3xl font-bold">{mockAdvancedData.performance.workoutEfficiency}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                style={{ width: `${mockAdvancedData.performance.workoutEfficiency}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Time vs. Results ratio</span>
              <Badge className={getScoreBadge(mockAdvancedData.performance.workoutEfficiency)}>Excellent</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Recovery Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-3xl font-bold">{mockAdvancedData.performance.recoveryScore}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full"
                style={{ width: `${mockAdvancedData.performance.recoveryScore}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Readiness to train</span>
              <Badge className={getScoreBadge(mockAdvancedData.performance.recoveryScore)}>Good</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progress Velocity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-3xl font-bold">{mockAdvancedData.performance.progressVelocity}x</div>
            <div className="text-sm text-muted-foreground">
              Rate of improvement compared to baseline
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(1.8, 1.5)}
              <span className="text-sm">+20% vs last period</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Weight className="w-5 h-5" />
            Volume Intensity Index
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-3xl font-bold">{mockAdvancedData.performance.volumeIntensityIndex}</div>
            <div className="text-sm text-muted-foreground">
              Balance between volume and intensity
            </div>
            <Badge className={getScoreBadge(82.5)}>Optimal</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5" />
            Muscle Balance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-3xl font-bold">{mockAdvancedData.performance.muscleBalanceScore}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full"
                style={{ width: `${mockAdvancedData.performance.muscleBalanceScore}%` }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Symmetry across muscle groups
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderPhysiologicalMetrics = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Cardiovascular Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Estimated VO2 Max</span>
            <div className="text-right">
              <div className="font-bold">{mockAdvancedData.physiological.estimatedVO2Max} ml/kg/min</div>
              <Badge className="text-xs">Above Average</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Anaerobic Threshold</span>
            <div className="text-right">
              <div className="font-bold">{mockAdvancedData.physiological.anaerobicThreshold}%</div>
              <Badge className="text-xs">Good</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metabolic Indicators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Metabolic Stress</span>
            <div className="text-right">
              <div className="font-bold">{(mockAdvancedData.physiological.metabolicStress * 100).toFixed(0)}%</div>
              <Badge className={getScoreBadge(68)}>Moderate</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Mechanical Tension</span>
            <div className="text-right">
              <div className="font-bold">{(mockAdvancedData.physiological.mechanicalTension * 100).toFixed(0)}%</div>
              <Badge className={getScoreBadge(85)}>High</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fatigue Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Fatigue Factor</span>
            <div className="text-right">
              <div className="font-bold">{(mockAdvancedData.physiological.fatigueFactor * 100).toFixed(0)}%</div>
              <Badge className={getScoreBadge(15, true)}>Low</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Neuromuscular Fatigue</span>
            <div className="text-right">
              <div className="font-bold">{(mockAdvancedData.physiological.neuromuscularFatigue * 100).toFixed(0)}%</div>
              <Badge className={getScoreBadge(22, true)}>Low</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adaptation Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Adaptation Rate</span>
            <div className="text-right">
              <div className="font-bold">{mockAdvancedData.physiological.adaptationRate}x</div>
              <Badge className="text-xs">Fast</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Muscle Activation</span>
            <div className="text-right">
              <div className="font-bold">{(mockAdvancedData.physiological.muscleActivation * 100).toFixed(0)}%</div>
              <Badge className={getScoreBadge(92)}>Excellent</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderBiomechanicalMetrics = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Movement Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{mockAdvancedData.biomechanical.movementQuality}</div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full"
                style={{ width: `${mockAdvancedData.biomechanical.movementQuality}%` }}
              />
            </div>
            <Badge className={getScoreBadge(87)}>Good</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Range of Motion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{mockAdvancedData.biomechanical.rangeOfMotion}%</div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full"
                style={{ width: `${mockAdvancedData.biomechanical.rangeOfMotion}%` }}
              />
            </div>
            <Badge className={getScoreBadge(94)}>Excellent</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Power Output</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{mockAdvancedData.biomechanical.powerOutput}W</div>
            <div className="text-sm text-muted-foreground mb-2">Peak power production</div>
            <Badge className="bg-purple-100 text-purple-800">High</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Stability Index</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{mockAdvancedData.biomechanical.stabilityIndex}</div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full"
                style={{ width: `${mockAdvancedData.biomechanical.stabilityIndex}%` }}
              />
            </div>
            <Badge className={getScoreBadge(82)}>Good</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Coordination Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{mockAdvancedData.biomechanical.coordinationScore}</div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-3 rounded-full"
                style={{ width: `${mockAdvancedData.biomechanical.coordinationScore}%` }}
              />
            </div>
            <Badge className={getScoreBadge(89)}>Excellent</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Symmetry Index</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{(mockAdvancedData.biomechanical.symmetryIndex * 100).toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground mb-2">Left/Right balance</div>
            <Badge className={getScoreBadge(95)}>Excellent</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderPeriodizationMetrics = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Fitness Level</div>
              <div className="text-3xl font-bold mb-2">{mockAdvancedData.periodization.fitnessLevel}</div>
              <Badge className={getScoreBadge(78)}>Good</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Fatigue Level</div>
              <div className="text-3xl font-bold mb-2">{mockAdvancedData.periodization.fatigueLevel}</div>
              <Badge className={getScoreBadge(32, true)}>Low</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Form Level</div>
              <div className="text-3xl font-bold mb-2">{mockAdvancedData.periodization.formLevel}</div>
              <Badge className={getScoreBadge(85)}>Excellent</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Readiness Score</div>
              <div className="text-3xl font-bold mb-2">{mockAdvancedData.periodization.readinessScore}</div>
              <Badge className={getScoreBadge(82)}>Good</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Phase Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-3">Current Phase</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Phase Type</span>
                  <Badge className="bg-blue-100 text-blue-800">{mockAdvancedData.periodization.adaptationPhase}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Training Stress</span>
                  <span className="font-semibold">{mockAdvancedData.periodization.trainingStress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Peaking Index</span>
                  <span className="font-semibold">{(mockAdvancedData.periodization.peakingIndex * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Recommendations</h4>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-green-50 rounded">
                  ✅ Continue current volume progression
                </div>
                <div className="p-2 bg-yellow-50 rounded">
                  ⚠️ Monitor fatigue levels closely
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  💡 Consider deload in 2-3 weeks
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Advanced Metrics</h1>
        <p className="text-muted-foreground">Deep performance analytics and physiological insights</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={metricCategory} onValueChange={setMetricCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Metric category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="physiological">Physiological</SelectItem>
            <SelectItem value="biomechanical">Biomechanical</SelectItem>
            <SelectItem value="periodization">Periodization</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Content */}
      <div className="space-y-6">
        {metricCategory === 'performance' && renderPerformanceMetrics()}
        {metricCategory === 'physiological' && renderPhysiologicalMetrics()}
        {metricCategory === 'biomechanical' && renderBiomechanicalMetrics()}
        {metricCategory === 'periodization' && renderPeriodizationMetrics()}
      </div>
    </div>
  )
} 