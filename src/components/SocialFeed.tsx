'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  UserPlus, 
  UserMinus, 
  Trophy, 
  TrendingUp,
  Users,
  Target,
  Send,
  MoreHorizontal,
  Eye,
  EyeOff
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface WorkoutPost {
  id: string
  user_id: string
  user_name: string
  user_avatar?: string
  workout_date: string
  exercises_count: number
  total_volume: number
  duration: number
  workout_type: 'Push' | 'Pull' | 'Legs' | 'Custom'
  achievements: string[]
  notes?: string
  likes_count: number
  comments_count: number
  is_liked: boolean
  created_at: string
}

interface LeaderboardEntry {
  user_id: string
  user_name: string
  user_avatar?: string
  total_workouts: number
  total_volume: number
  streak_days: number
  achievements_count: number
  rank: number
}

interface SocialFeedProps {
  userId: string
}

export default function SocialFeed({ userId }: SocialFeedProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard' | 'challenges'>('feed')
  const [posts, setPosts] = useState<WorkoutPost[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null)

  useEffect(() => {
    loadSocialData()
  }, [activeTab])

  const loadSocialData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'feed') {
        await loadWorkoutFeed()
      } else if (activeTab === 'leaderboard') {
        await loadLeaderboard()
      }
    } catch (error) {
      console.error('Error loading social data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWorkoutFeed = async () => {
    // Simulate workout feed data
    const mockPosts: WorkoutPost[] = [
      {
        id: '1',
        user_id: 'user1',
        user_name: 'Alex Johnson',
        user_avatar: undefined,
        workout_date: '2024-01-15',
        exercises_count: 6,
        total_volume: 8500,
        duration: 75,
        workout_type: 'Push',
        achievements: ['Personal Record', 'Consistency Streak'],
        notes: 'Great push session today! Hit a new PR on bench press 💪',
        likes_count: 12,
        comments_count: 3,
        is_liked: false,
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        user_id: 'user2',
        user_name: 'Sarah Chen',
        user_avatar: undefined,
        workout_date: '2024-01-15',
        exercises_count: 8,
        total_volume: 6200,
        duration: 90,
        workout_type: 'Legs',
        achievements: ['Volume Goal'],
        notes: 'Leg day completed! Those squats were tough but worth it 🔥',
        likes_count: 8,
        comments_count: 1,
        is_liked: true,
        created_at: '2024-01-15T09:15:00Z'
      },
      {
        id: '3',
        user_id: 'user3',
        user_name: 'Mike Rodriguez',
        user_avatar: undefined,
        workout_date: '2024-01-14',
        exercises_count: 5,
        total_volume: 7800,
        duration: 60,
        workout_type: 'Pull',
        achievements: ['Efficient Workout'],
        notes: 'Quick but effective pull session before work',
        likes_count: 5,
        comments_count: 0,
        is_liked: false,
        created_at: '2024-01-14T07:00:00Z'
      }
    ]
    setPosts(mockPosts)
  }

  const loadLeaderboard = async () => {
    // Simulate leaderboard data
    const mockLeaderboard: LeaderboardEntry[] = [
      {
        user_id: 'user1',
        user_name: 'Alex Johnson',
        user_avatar: undefined,
        total_workouts: 28,
        total_volume: 125000,
        streak_days: 12,
        achievements_count: 8,
        rank: 1
      },
      {
        user_id: 'user2',
        user_name: 'Sarah Chen',
        user_avatar: undefined,
        total_workouts: 25,
        total_volume: 98000,
        streak_days: 8,
        achievements_count: 6,
        rank: 2
      },
      {
        user_id: 'user3',
        user_name: 'Mike Rodriguez',
        user_avatar: undefined,
        total_workouts: 22,
        total_volume: 87500,
        streak_days: 15,
        achievements_count: 5,
        rank: 3
      },
      {
        user_id: userId,
        user_name: 'You',
        user_avatar: undefined,
        total_workouts: 18,
        total_volume: 65000,
        streak_days: 5,
        achievements_count: 4,
        rank: 4
      }
    ]
    setLeaderboard(mockLeaderboard)
  }

  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            is_liked: !post.is_liked,
            likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
          }
        : post
    ))
  }

  const handleShare = async (post: WorkoutPost) => {
    if (navigator.share) {
      // Use native sharing on mobile
      try {
        await navigator.share({
          title: `${post.user_name}'s ${post.workout_type} Workout`,
          text: `Check out this awesome ${post.workout_type} workout: ${post.exercises_count} exercises, ${Math.round(post.total_volume / 1000)}k total volume!`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback for desktop
      const shareText = `Check out ${post.user_name}'s ${post.workout_type} workout: ${post.exercises_count} exercises, ${Math.round(post.total_volume / 1000)}k total volume! 💪`
      navigator.clipboard.writeText(shareText)
      alert('Workout details copied to clipboard!')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSocialData()
    setRefreshing(false)
  }

  const shareMyWorkout = async () => {
    try {
      // Get user's latest workout
      const { data: workout } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            exercises (name, muscle_group)
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (!workout) {
        alert('No workouts found to share')
        return
      }

      setSelectedWorkout(workout)
      setShareModalOpen(true)
    } catch (error) {
      console.error('Error loading workout to share:', error)
    }
  }

  const publishWorkout = async (notes: string) => {
    try {
      // Create social post (simulated)
      const newPost: WorkoutPost = {
        id: Date.now().toString(),
        user_id: userId,
        user_name: 'You',
        user_avatar: undefined,
        workout_date: selectedWorkout.date,
        exercises_count: selectedWorkout.workout_exercises?.length || 0,
        total_volume: calculateWorkoutVolume(selectedWorkout),
        duration: selectedWorkout.duration || 60,
        workout_type: detectWorkoutType(selectedWorkout),
        achievements: generateAchievements(selectedWorkout),
        notes: notes,
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
        created_at: new Date().toISOString()
      }

      setPosts(prev => [newPost, ...prev])
      setShareModalOpen(false)
      setSelectedWorkout(null)
      
      alert('🎉 Workout shared successfully!')
    } catch (error) {
      console.error('Error publishing workout:', error)
      alert('Failed to share workout')
    }
  }

  const calculateWorkoutVolume = (workout: any) => {
    if (!workout.workout_exercises) return 0
    return workout.workout_exercises.reduce((total: number, exercise: any) => {
      return total + (exercise.weight || 0) * (exercise.reps || 0) * (exercise.sets || 0)
    }, 0)
  }

  const detectWorkoutType = (workout: any): 'Push' | 'Pull' | 'Legs' | 'Custom' => {
    if (!workout.workout_exercises) return 'Custom'
    
    const muscleGroups = workout.workout_exercises.map((ex: any) => ex.exercises?.muscle_group).filter(Boolean)
    const pushMuscles = ['chest', 'shoulders', 'triceps']
    const pullMuscles = ['back', 'biceps']
    const legMuscles = ['quadriceps', 'hamstrings', 'glutes', 'calves']
    
    const isPush = muscleGroups.some((mg: string) => pushMuscles.includes(mg.toLowerCase()))
    const isPull = muscleGroups.some((mg: string) => pullMuscles.includes(mg.toLowerCase()))
    const isLegs = muscleGroups.some((mg: string) => legMuscles.includes(mg.toLowerCase()))
    
    if (isPush && !isPull && !isLegs) return 'Push'
    if (isPull && !isPush && !isLegs) return 'Pull'
    if (isLegs && !isPush && !isPull) return 'Legs'
    return 'Custom'
  }

  const generateAchievements = (workout: any): string[] => {
    const achievements = []
    const volume = calculateWorkoutVolume(workout)
    
    if (volume > 10000) achievements.push('High Volume')
    if (workout.workout_exercises?.length >= 8) achievements.push('Comprehensive')
    if (workout.duration && workout.duration <= 45) achievements.push('Efficient')
    
    return achievements
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Community Feed
          </h3>
          <p className="text-sm text-muted-foreground">
            Connect with other fitness enthusiasts
          </p>
        </div>
        <Button onClick={shareMyWorkout} size="sm">
          📤 Share Workout
        </Button>
      </div>

      {/* Mobile-Optimized Tabs */}
      <div className="flex bg-muted rounded-lg p-1 mb-6">
        {[
          { key: 'feed', label: '📰 Feed', icon: '📰' },
          { key: 'leaderboard', label: '🏆 Rankings', icon: '🏆' },
          { key: 'challenges', label: '🎯 Challenges', icon: '🎯' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="text-xs">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label.split(' ')[1]}</span>
            <span className="sm:hidden">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Pull to Refresh Indicator */}
      {refreshing && (
        <div className="text-center py-4 text-muted-foreground">
          <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
          Refreshing...
        </div>
      )}

      {/* Feed Tab */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 3 }, (_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-20 bg-muted rounded mb-3"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-muted rounded w-16"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
              </Card>
            ))
          ) : (
            posts.map(post => (
              <Card key={post.id} className="p-4">
                {/* Post Header */}
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="w-10 h-10">
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {post.user_name.charAt(0)}
                    </div>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm truncate">{post.user_name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {post.workout_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(post.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(post)}
                  >
                    📤
                  </Button>
                </div>

                {/* Workout Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{post.exercises_count}</div>
                    <div className="text-xs text-muted-foreground">Exercises</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">
                      {Math.round(post.total_volume / 1000)}k
                    </div>
                    <div className="text-xs text-muted-foreground">Volume</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{post.duration}m</div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                  </div>
                </div>

                {/* Achievements */}
                {post.achievements.length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {post.achievements.map(achievement => (
                      <Badge key={achievement} variant="outline" className="text-xs">
                        🏆 {achievement}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {post.notes && (
                  <p className="text-sm text-foreground mb-4 leading-relaxed">
                    {post.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 ${post.is_liked ? 'text-red-500' : ''}`}
                  >
                    {post.is_liked ? '❤️' : '🤍'} {post.likes_count}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    💬 {post.comments_count}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 5 }, (_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded"></div>
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            leaderboard.map(entry => (
              <Card key={entry.user_id} className={`p-4 ${entry.user_id === userId ? 'ring-2 ring-primary' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold min-w-[2rem] text-center">
                    {getRankEmoji(entry.rank)}
                  </div>
                  <Avatar className="w-10 h-10">
                    <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {entry.user_name.charAt(0)}
                    </div>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">
                      {entry.user_name} {entry.user_id === userId && '(You)'}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs text-muted-foreground">
                      <div>💪 {entry.total_workouts} workouts</div>
                      <div>📊 {Math.round(entry.total_volume / 1000)}k volume</div>
                      <div>🔥 {entry.streak_days} day streak</div>
                      <div>🏆 {entry.achievements_count} achievements</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h4 className="text-lg font-semibold mb-2">Challenges Coming Soon!</h4>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Weekly challenges, fitness competitions, and community goals are in development.
          </p>
          <Badge variant="secondary">🚧 Under Construction</Badge>
        </div>
      )}

      {/* Share Workout Modal */}
      {shareModalOpen && selectedWorkout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Share Your Workout</h3>
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">
                  {detectWorkoutType(selectedWorkout)} • {selectedWorkout.workout_exercises?.length || 0} exercises
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(calculateWorkoutVolume(selectedWorkout) / 1000)}k total volume
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Add a note (optional)</label>
                <textarea
                  className="w-full p-3 border border-border rounded-lg resize-none"
                  rows={3}
                  placeholder="How was your workout? Any achievements or thoughts to share?"
                  id="workout-notes"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShareModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const notes = (document.getElementById('workout-notes') as HTMLTextAreaElement)?.value || ''
                    publishWorkout(notes)
                  }}
                  className="flex-1"
                >
                  📤 Share
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
} 