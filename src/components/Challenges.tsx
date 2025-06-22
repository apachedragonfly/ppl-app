'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Trophy, 
  Target, 
  Calendar,
  Users,
  TrendingUp,
  Award,
  Clock,
  Plus,
  Filter,
  Medal,
  Zap,
  Flag
} from 'lucide-react'

interface ChallengesProps {
  userId: string
}

export default function Challenges({ userId }: ChallengesProps) {
  const [activeTab, setActiveTab] = useState('active')
  const [filterType, setFilterType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    type: 'volume' as 'volume' | 'frequency' | 'streak' | 'exercise_specific' | 'custom',
    target_value: '',
    target_unit: '',
    duration: '7',
    max_participants: '',
    prize_description: ''
  })

  // Mock data for demonstration
  const mockActiveChallenges = [
    {
      id: '1',
      title: '30-Day Consistency Challenge',
      description: 'Workout at least 20 times in 30 days',
      challenge_type: 'frequency',
      target_value: 20,
      target_unit: 'workouts',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      participants_count: 45,
      is_participating: true,
      current_progress: 12,
      creator: { name: 'Fitness Coach Mike', avatar_url: '' },
      prize_description: 'Winner gets a free protein supplement!',
      days_left: 18
    },
    {
      id: '2',
      title: 'Volume Beast Challenge',
      description: 'Lift 50,000kg total volume this month',
      challenge_type: 'volume',
      target_value: 50000,
      target_unit: 'kg',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      participants_count: 23,
      is_participating: false,
      current_progress: 0,
      creator: { name: 'Iron Lady Sarah', avatar_url: '' },
      prize_description: 'Custom workout plan from a certified trainer',
      days_left: 18
    },
    {
      id: '3',
      title: 'Push-Up Power Week',
      description: 'Complete 1000 push-ups this week',
      challenge_type: 'exercise_specific',
      target_value: 1000,
      target_unit: 'reps',
      start_date: '2024-01-15',
      end_date: '2024-01-22',
      participants_count: 67,
      is_participating: true,
      current_progress: 350,
      creator: { name: 'Bodyweight Beast', avatar_url: '' },
      prize_description: 'Featured on our social media!',
      days_left: 5
    }
  ]

  const mockCompletedChallenges = [
    {
      id: '4',
      title: 'December Deadlift Challenge',
      description: 'Increase your deadlift 1RM by 10kg',
      challenge_type: 'exercise_specific',
      target_value: 10,
      target_unit: 'kg increase',
      completed_at: '2023-12-31',
      final_progress: 12,
      rank: 3,
      total_participants: 28,
      prize_won: 'Bronze Medal 🥉'
    }
  ]

  const mockLeaderboard = [
    { rank: 1, user: { name: 'Alex Thunder', avatar_url: '' }, progress: 18, percentage: 90 },
    { rank: 2, user: { name: 'Maria Strong', avatar_url: '' }, progress: 16, percentage: 80 },
    { rank: 3, user: { name: 'You', avatar_url: '' }, progress: 12, percentage: 60 },
    { rank: 4, user: { name: 'John Fit', avatar_url: '' }, progress: 11, percentage: 55 },
    { rank: 5, user: { name: 'Lisa Power', avatar_url: '' }, progress: 9, percentage: 45 }
  ]

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'volume': return <TrendingUp className="w-4 h-4" />
      case 'frequency': return <Calendar className="w-4 h-4" />
      case 'streak': return <Zap className="w-4 h-4" />
      case 'exercise_specific': return <Target className="w-4 h-4" />
      default: return <Trophy className="w-4 h-4" />
    }
  }

  const getChallengeTypeBadge = (type: string) => {
    switch (type) {
      case 'volume': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">📊 Volume</Badge>
      case 'frequency': return <Badge variant="secondary" className="bg-green-100 text-green-800">📅 Frequency</Badge>
      case 'streak': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⚡ Streak</Badge>
      case 'exercise_specific': return <Badge variant="secondary" className="bg-purple-100 text-purple-800">🎯 Exercise</Badge>
      default: return <Badge variant="secondary" className="bg-gray-100 text-gray-800">🏆 Custom</Badge>
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    if (percentage >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const formatDaysLeft = (days: number) => {
    if (days === 0) return 'Ends today'
    if (days === 1) return '1 day left'
    return `${days} days left`
  }

  const handleCreateChallenge = () => {
    alert('Challenge creation functionality coming soon!')
  }

  const handleJoinChallenge = (challengeId: string) => {
    alert(`Join challenge ${challengeId} functionality coming soon!`)
  }

  const handleLeaveChallenge = (challengeId: string) => {
    alert(`Leave challenge ${challengeId} functionality coming soon!`)
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Fitness Challenges</h1>
        <p className="text-muted-foreground">Compete, achieve, and push your limits</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Active ({mockActiveChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Completed ({mockCompletedChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Medal className="w-4 h-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="frequency">Frequency</SelectItem>
                <SelectItem value="streak">Streak</SelectItem>
                <SelectItem value="exercise_specific">Exercise Specific</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Challenges */}
          <div className="grid gap-4 md:grid-cols-2">
            {mockActiveChallenges.map((challenge) => (
              <Card key={challenge.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getChallengeTypeIcon(challenge.challenge_type)}
                        <h3 className="font-semibold">{challenge.title}</h3>
                        {getChallengeTypeBadge(challenge.challenge_type)}
                      </div>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    </div>
                    <Badge variant={challenge.is_participating ? "default" : "outline"}>
                      {challenge.is_participating ? 'Joined' : 'Available'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Challenge Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span>{challenge.target_value} {challenge.target_unit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{challenge.participants_count} participants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDaysLeft(challenge.days_left)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{challenge.prize_description}</span>
                    </div>
                  </div>

                  {/* Progress Bar (if participating) */}
                  {challenge.is_participating && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Your Progress</span>
                        <span>{challenge.current_progress} / {challenge.target_value}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor((challenge.current_progress / challenge.target_value) * 100)}`}
                          style={{ width: `${Math.min((challenge.current_progress / challenge.target_value) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((challenge.current_progress / challenge.target_value) * 100)}% complete
                      </p>
                    </div>
                  )}

                  {/* Creator */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={challenge.creator.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {challenge.creator.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">by {challenge.creator.name}</span>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full"
                    variant={challenge.is_participating ? "outline" : "default"}
                    onClick={() => challenge.is_participating 
                      ? handleLeaveChallenge(challenge.id) 
                      : handleJoinChallenge(challenge.id)
                    }
                  >
                    {challenge.is_participating ? (
                      <>
                        <Flag className="w-4 h-4 mr-2" />
                        Leave Challenge
                      </>
                    ) : (
                      <>
                        <Trophy className="w-4 h-4 mr-2" />
                        Join Challenge
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {mockCompletedChallenges.map((challenge) => (
              <Card key={challenge.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <h3 className="font-semibold">{challenge.title}</h3>
                        {getChallengeTypeBadge(challenge.challenge_type)}
                      </div>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Completed: {new Date(challenge.completed_at).toLocaleDateString()}</span>
                        <span>Rank: #{challenge.rank} of {challenge.total_participants}</span>
                        <span>Progress: {challenge.final_progress} {challenge.target_unit}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">{challenge.prize_won}</div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="w-5 h-5" />
                30-Day Consistency Challenge Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockLeaderboard.map((entry) => (
                  <div key={entry.rank} className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {entry.rank}
                    </div>
                    <Avatar>
                      <AvatarImage src={entry.user.avatar_url} />
                      <AvatarFallback>
                        {entry.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${entry.user.name === 'You' ? 'text-primary' : ''}`}>
                          {entry.user.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {entry.progress}/20 workouts
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(entry.percentage)}`}
                          style={{ width: `${entry.percentage}%` }}
                        />
                      </div>
                    </div>
                    {entry.rank <= 3 && (
                      <div className="text-2xl">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Challenge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Challenge Title</label>
                  <Input
                    placeholder="e.g., 30-Day Push-Up Challenge"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Challenge Type</label>
                  <Select 
                    value={newChallenge.type} 
                    onValueChange={(value: any) => setNewChallenge({ ...newChallenge, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select challenge type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volume">📊 Volume Challenge</SelectItem>
                      <SelectItem value="frequency">📅 Frequency Challenge</SelectItem>
                      <SelectItem value="streak">⚡ Streak Challenge</SelectItem>
                      <SelectItem value="exercise_specific">🎯 Exercise Specific</SelectItem>
                      <SelectItem value="custom">🏆 Custom Challenge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Value</label>
                  <Input
                    type="number"
                    placeholder="e.g., 1000"
                    value={newChallenge.target_value}
                    onChange={(e) => setNewChallenge({ ...newChallenge, target_value: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Unit</label>
                  <Input
                    placeholder="e.g., reps, kg, workouts"
                    value={newChallenge.target_unit}
                    onChange={(e) => setNewChallenge({ ...newChallenge, target_unit: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (days)</label>
                  <Select 
                    value={newChallenge.duration} 
                    onValueChange={(value) => setNewChallenge({ ...newChallenge, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">1 Week</SelectItem>
                      <SelectItem value="14">2 Weeks</SelectItem>
                      <SelectItem value="21">3 Weeks</SelectItem>
                      <SelectItem value="30">1 Month</SelectItem>
                      <SelectItem value="60">2 Months</SelectItem>
                      <SelectItem value="90">3 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Participants (optional)</label>
                  <Input
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={newChallenge.max_participants}
                    onChange={(e) => setNewChallenge({ ...newChallenge, max_participants: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe your challenge, rules, and what participants need to do..."
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prize Description (optional)</label>
                <Input
                  placeholder="e.g., Winner gets a free supplement!"
                  value={newChallenge.prize_description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, prize_description: e.target.value })}
                />
              </div>

              <Button className="w-full" onClick={handleCreateChallenge}>
                <Trophy className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 