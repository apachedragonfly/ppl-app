'use client'

import { useState } from 'react'
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

interface SocialFeedProps {
  userId: string
}

export default function SocialFeed({ userId }: SocialFeedProps) {
  const [activeTab, setActiveTab] = useState('feed')
  const [shareCaption, setShareCaption] = useState('')
  const [shareType, setShareType] = useState<'workout' | 'achievement' | 'progress'>('workout')
  const [isPublic, setIsPublic] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data for demonstration
  const mockFeedItems = [
    {
      id: '1',
      user: { name: 'John Doe', avatar_url: '' },
      caption: 'Just crushed leg day! 💪',
      share_type: 'workout' as const,
      created_at: '2024-01-15T10:30:00Z',
      likes_count: 12,
      comments_count: 3,
      is_liked: false,
      workout: {
        name: 'Leg Day Beast Mode',
        type: 'Legs',
        duration: 75,
        total_volume: 2500
      }
    },
    {
      id: '2',
      user: { name: 'Sarah Smith', avatar_url: '' },
      caption: 'New PR on bench press! 225lbs 🏆',
      share_type: 'achievement' as const,
      created_at: '2024-01-14T15:45:00Z',
      likes_count: 25,
      comments_count: 8,
      is_liked: true,
      workout: {
        name: 'Upper Body Power',
        type: 'Push',
        duration: 60,
        total_volume: 1800
      }
    }
  ]

  const mockFollowing = [
    { id: '1', name: 'Mike Johnson', avatar_url: '', following_since: '2023-12-01' },
    { id: '2', name: 'Emma Wilson', avatar_url: '', following_since: '2023-11-15' }
  ]

  const mockFollowers = [
    { id: '3', name: 'Alex Brown', avatar_url: '', following_since: '2023-12-10' },
    { id: '4', name: 'Lisa Chen', avatar_url: '', following_since: '2023-12-05' }
  ]

  const formatWorkoutSummary = (workout: any) => {
    if (!workout) return 'Workout'
    
    const duration = workout.duration ? `${Math.round(workout.duration)} min` : ''
    const volume = workout.total_volume ? `${Math.round(workout.total_volume)}kg total` : ''
    
    return `${workout.type}${duration ? ` • ${duration}` : ''}${volume ? ` • ${volume}` : ''}`
  }

  const getShareTypeIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Trophy className="w-4 h-4" />
      case 'progress': return <TrendingUp className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  const getShareTypeBadge = (type: string) => {
    switch (type) {
      case 'achievement': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">🏆 Achievement</Badge>
      case 'progress': return <Badge variant="secondary" className="bg-green-100 text-green-800">📈 Progress</Badge>
      default: return <Badge variant="secondary" className="bg-blue-100 text-blue-600">💪 Workout</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Social Feed</h1>
        <p className="text-muted-foreground">Connect with the fitness community</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feed" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Feed
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Following ({mockFollowing.length})
          </TabsTrigger>
          <TabsTrigger value="followers" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Followers ({mockFollowers.length})
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          {/* Share Workout Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share Your Progress
              </Button>
            </DialogTrigger>
            <DialogContent className="p-6">
              <DialogHeader>
                <DialogTitle>Share Your Fitness Journey</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={shareType} onValueChange={(value: any) => setShareType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select share type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workout">💪 Workout Session</SelectItem>
                    <SelectItem value="achievement">🏆 Achievement</SelectItem>
                    <SelectItem value="progress">📈 Progress Update</SelectItem>
                  </SelectContent>
                </Select>
                
                <Textarea
                  placeholder="What's your fitness story today?"
                  value={shareCaption}
                  onChange={(e) => setShareCaption(e.target.value)}
                  rows={3}
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isPublic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsPublic(true)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Public
                    </Button>
                    <Button
                      variant={!isPublic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsPublic(false)}
                    >
                      <EyeOff className="w-4 h-4 mr-1" />
                      Private
                    </Button>
                  </div>
                  
                  <Button onClick={() => alert('Share functionality coming soon!')}>
                    <Send className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Feed Items */}
          <div className="space-y-4">
            {mockFeedItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={item.user?.avatar_url} />
                        <AvatarFallback>
                          {item.user?.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.user?.name || 'Unknown User'}</span>
                          {getShareTypeBadge(item.share_type)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {item.caption && (
                    <p className="text-sm">{item.caption}</p>
                  )}
                  
                  {item.workout && (
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {getShareTypeIcon(item.share_type)}
                        <span className="font-medium">{item.workout.name || 'Workout Session'}</span>
                        <Badge variant="outline">{item.workout.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatWorkoutSummary(item.workout)}
                      </p>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-4 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={item.is_liked ? 'text-red-500' : ''}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${item.is_liked ? 'fill-current' : ''}`} />
                      {item.likes_count || 0}
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {item.comments_count || 0}
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          <div className="flex items-center justify-between">
            <Input
              placeholder="Search following..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <div className="grid gap-4">
            {mockFollowing.map((user) => (
              <Card key={user.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">
                        Following since {new Date(user.following_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <UserMinus className="w-4 h-4 mr-1" />
                    Unfollow
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="followers" className="space-y-4">
          <div className="grid gap-4">
            {mockFollowers.map((user) => (
              <Card key={user.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">
                        Following you since {new Date(user.following_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <UserPlus className="w-4 h-4 mr-1" />
                    Follow Back
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Discover Athletes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Find and connect with other fitness enthusiasts in your area or with similar goals.</p>
              <Button>
                <Users className="w-4 h-4 mr-2" />
                Browse Community
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 