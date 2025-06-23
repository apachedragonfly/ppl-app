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

interface DataVisualizationProps {
  userId: string
}

export default function DataVisualization({ userId }: DataVisualizationProps) {
  const [timeRange, setTimeRange] = useState('3months')
  const [activeTab, setActiveTab] = useState('overload')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      setLoading(false)
    }
  }, [userId, timeRange])

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
              <div className="text-center py-8 text-muted-foreground">
                Advanced progressive overload analysis coming soon! This will track strength gains and plateau detection.
              </div>
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
              <div className="text-center py-8 text-muted-foreground">
                Volume analysis by muscle group coming soon! This will show weekly volume distribution and identify imbalances.
              </div>
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
