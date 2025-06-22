'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SocialFeed from '@/components/SocialFeed'
import Challenges from '@/components/Challenges'
import { Users, Trophy, TrendingUp, Medal } from 'lucide-react'

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState('feed')
  
  // Mock user ID - in real app, this would come from auth context
  const userId = 'current-user-id'

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Social & Challenges</h1>
          <p className="text-xl text-muted-foreground">
            Connect with the community and push your limits
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Social Feed
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="leaderboards" className="flex items-center gap-2">
              <Medal className="w-4 h-4" />
              Leaderboards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-0">
            <SocialFeed userId={userId} />
          </TabsContent>

          <TabsContent value="challenges" className="mt-0">
            <Challenges userId={userId} />
          </TabsContent>

          <TabsContent value="leaderboards" className="mt-0">
            <div className="max-w-4xl mx-auto p-4">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">Global Leaderboards</h2>
                <p className="text-muted-foreground">See how you rank against other athletes</p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Weekly Volume Leaders */}
                <div className="bg-card rounded-lg border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold">Weekly Volume Leaders</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { rank: 1, name: 'PowerLifter Pro', volume: '15,240kg', avatar: '' },
                      { rank: 2, name: 'Iron Beast', volume: '14,890kg', avatar: '' },
                      { rank: 3, name: 'Strength Queen', volume: '14,250kg', avatar: '' },
                      { rank: 4, name: 'You', volume: '12,840kg', avatar: '' },
                      { rank: 5, name: 'Muscle Builder', volume: '12,100kg', avatar: '' }
                    ].map((entry) => (
                      <div key={entry.rank} className="flex items-center gap-3 p-2 rounded">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {entry.rank}
                        </div>
                        <div className="flex-1">
                          <span className={`font-medium ${entry.name === 'You' ? 'text-primary' : ''}`}>
                            {entry.name}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">{entry.volume}</span>
                        {entry.rank <= 3 && (
                          <span className="text-lg">
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Workout Frequency */}
                <div className="bg-card rounded-lg border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold">Monthly Workout Frequency</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { rank: 1, name: 'Consistency King', workouts: '28 workouts', avatar: '' },
                      { rank: 2, name: 'Daily Grinder', workouts: '26 workouts', avatar: '' },
                      { rank: 3, name: 'Fitness Fanatic', workouts: '25 workouts', avatar: '' },
                      { rank: 4, name: 'Gym Regular', workouts: '22 workouts', avatar: '' },
                      { rank: 5, name: 'You', workouts: '20 workouts', avatar: '' }
                    ].map((entry) => (
                      <div key={entry.rank} className="flex items-center gap-3 p-2 rounded">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {entry.rank}
                        </div>
                        <div className="flex-1">
                          <span className={`font-medium ${entry.name === 'You' ? 'text-primary' : ''}`}>
                            {entry.name}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">{entry.workouts}</span>
                        {entry.rank <= 3 && (
                          <span className="text-lg">
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Streaks */}
                <div className="bg-card rounded-lg border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Medal className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold">Current Workout Streaks</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { rank: 1, name: 'Streak Master', streak: '47 days', avatar: '' },
                      { rank: 2, name: 'Never Miss', streak: '34 days', avatar: '' },
                      { rank: 3, name: 'Dedication Pro', streak: '28 days', avatar: '' },
                      { rank: 4, name: 'Consistent Joe', streak: '21 days', avatar: '' },
                      { rank: 5, name: 'You', streak: '14 days', avatar: '' }
                    ].map((entry) => (
                      <div key={entry.rank} className="flex items-center gap-3 p-2 rounded">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {entry.rank}
                        </div>
                        <div className="flex-1">
                          <span className={`font-medium ${entry.name === 'You' ? 'text-primary' : ''}`}>
                            {entry.name}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">{entry.streak}</span>
                        {entry.rank <= 3 && (
                          <span className="text-lg">
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exercise Max Leaderboard */}
                <div className="bg-card rounded-lg border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold">Bench Press Champions</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { rank: 1, name: 'Bench Beast', weight: '180kg', avatar: '' },
                      { rank: 2, name: 'Press Master', weight: '175kg', avatar: '' },
                      { rank: 3, name: 'Iron Chest', weight: '170kg', avatar: '' },
                      { rank: 4, name: 'Strong Arms', weight: '165kg', avatar: '' },
                      { rank: 5, name: 'You', weight: '140kg', avatar: '' }
                    ].map((entry) => (
                      <div key={entry.rank} className="flex items-center gap-3 p-2 rounded">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {entry.rank}
                        </div>
                        <div className="flex-1">
                          <span className={`font-medium ${entry.name === 'You' ? 'text-primary' : ''}`}>
                            {entry.name}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">{entry.weight}</span>
                        {entry.rank <= 3 && (
                          <span className="text-lg">
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 