-- Migration: Add social features and community integration
-- Task 32: Add social features and community integration

-- Create user_follows table for following other users
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create workout_shares table for sharing workouts
CREATE TABLE IF NOT EXISTS workout_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  caption TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  share_type VARCHAR(20) DEFAULT 'workout' CHECK (share_type IN ('workout', 'achievement', 'progress')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create workout_likes table for liking shared workouts
CREATE TABLE IF NOT EXISTS workout_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID REFERENCES workout_shares(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(share_id, user_id)
);

-- Create workout_comments table for commenting on shared workouts
CREATE TABLE IF NOT EXISTS workout_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID REFERENCES workout_shares(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment_text TEXT NOT NULL,
  parent_comment_id UUID REFERENCES workout_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create challenges table for fitness challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  challenge_type VARCHAR(50) NOT NULL CHECK (challenge_type IN ('volume', 'frequency', 'streak', 'exercise_specific', 'custom')),
  target_value FLOAT NOT NULL,
  target_unit VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  max_participants INTEGER,
  prize_description TEXT,
  rules TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create challenge_participants table for users joining challenges
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  current_progress FLOAT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  rank INTEGER,
  UNIQUE(challenge_id, user_id)
);

-- Create leaderboards table for various fitness metrics
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('total_volume', 'workout_frequency', 'streak', 'exercise_max', 'custom')),
  time_period VARCHAR(20) NOT NULL CHECK (time_period IN ('daily', 'weekly', 'monthly', 'yearly', 'all_time')),
  exercise_filter VARCHAR(255), -- For exercise-specific leaderboards
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create leaderboard_entries table for user rankings
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leaderboard_id UUID REFERENCES leaderboards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score FLOAT NOT NULL,
  rank INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(leaderboard_id, user_id, period_start)
);

-- Create user_achievements table for tracking achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  achieved_date TIMESTAMP DEFAULT NOW(),
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
  metadata JSONB
);

-- Create social_feed table for activity feed
CREATE TABLE IF NOT EXISTS social_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('workout_share', 'achievement', 'challenge_join', 'challenge_complete', 'follow', 'like', 'comment')),
  reference_id UUID, -- Can reference workout_shares, challenges, etc.
  content TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_settings table for privacy and notification settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  workout_sharing VARCHAR(20) DEFAULT 'public' CHECK (workout_sharing IN ('public', 'friends', 'private')),
  allow_follow_requests BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  challenge_invites BOOLEAN DEFAULT TRUE,
  achievement_sharing BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created_at ON user_follows(created_at);

CREATE INDEX IF NOT EXISTS idx_workout_shares_user_id ON workout_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_shares_workout_id ON workout_shares(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_shares_public ON workout_shares(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_workout_shares_created_at ON workout_shares(created_at);

CREATE INDEX IF NOT EXISTS idx_workout_likes_share_id ON workout_likes(share_id);
CREATE INDEX IF NOT EXISTS idx_workout_likes_user_id ON workout_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_workout_comments_share_id ON workout_comments(share_id);
CREATE INDEX IF NOT EXISTS idx_workout_comments_user_id ON workout_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_comments_parent ON workout_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_challenges_public ON challenges(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenges_created_by ON challenges(created_by);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_progress ON challenge_participants(current_progress);

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_leaderboard ON leaderboard_entries(leaderboard_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user ON leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_rank ON leaderboard_entries(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_period ON leaderboard_entries(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_user_achievements_date ON user_achievements(achieved_date);

CREATE INDEX IF NOT EXISTS idx_social_feed_user ON social_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_social_feed_public ON social_feed(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_social_feed_created_at ON social_feed(created_at);
CREATE INDEX IF NOT EXISTS idx_social_feed_activity_type ON social_feed(activity_type);

-- Enable Row Level Security
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_follows
CREATE POLICY "Users can view follows involving them" ON user_follows 
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can follow others" ON user_follows 
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON user_follows 
  FOR DELETE USING (auth.uid() = follower_id);

-- Create RLS policies for workout_shares
CREATE POLICY "Users can view public shares and own shares" ON workout_shares 
  FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can create own shares" ON workout_shares 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shares" ON workout_shares 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shares" ON workout_shares 
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workout_likes
CREATE POLICY "Users can view all likes" ON workout_likes 
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can like shares" ON workout_likes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike shares" ON workout_likes 
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workout_comments
CREATE POLICY "Users can view all comments" ON workout_comments 
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can create comments" ON workout_comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON workout_comments 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON workout_comments 
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for challenges
CREATE POLICY "Users can view public challenges and own challenges" ON challenges 
  FOR SELECT USING (is_public = TRUE OR auth.uid() = created_by);

CREATE POLICY "Users can create challenges" ON challenges 
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own challenges" ON challenges 
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own challenges" ON challenges 
  FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for challenge_participants
CREATE POLICY "Users can view participants of accessible challenges" ON challenge_participants 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM challenges 
      WHERE id = challenge_id 
      AND (is_public = TRUE OR created_by = auth.uid())
    )
  );

CREATE POLICY "Users can join challenges" ON challenge_participants 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON challenge_participants 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges" ON challenge_participants 
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own achievements" ON user_achievements 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for social_feed
CREATE POLICY "Users can view public feed and own feed" ON social_feed 
  FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can create own feed entries" ON social_feed 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own settings" ON user_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_challenges_updated_at
    BEFORE UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_entries_updated_at
    BEFORE UPDATE ON leaderboard_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default leaderboards
INSERT INTO leaderboards (name, description, metric_type, time_period) VALUES
  ('Weekly Volume Leaders', 'Top users by total weekly training volume', 'total_volume', 'weekly'),
  ('Monthly Workout Frequency', 'Most consistent users by monthly workout count', 'workout_frequency', 'monthly'),
  ('Current Streaks', 'Longest current workout streaks', 'streak', 'all_time'),
  ('Bench Press Champions', 'Highest bench press weights', 'exercise_max', 'all_time'),
  ('Squat Masters', 'Highest squat weights', 'exercise_max', 'all_time'),
  ('Deadlift Legends', 'Highest deadlift weights', 'exercise_max', 'all_time');

-- Update exercise filter for exercise-specific leaderboards
UPDATE leaderboards SET exercise_filter = 'Barbell Bench Press' WHERE name = 'Bench Press Champions';
UPDATE leaderboards SET exercise_filter = 'Barbell Back Squat' WHERE name = 'Squat Masters';
UPDATE leaderboards SET exercise_filter = 'Deadlifts' WHERE name = 'Deadlift Legends';

-- Insert sample challenges
INSERT INTO challenges (created_by, title, description, challenge_type, target_value, target_unit, start_date, end_date, is_public, max_participants) VALUES
  ((SELECT id FROM auth.users LIMIT 1), '30-Day Consistency Challenge', 'Workout at least 20 times in 30 days', 'frequency', 20, 'workouts', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE, 100),
  ((SELECT id FROM auth.users LIMIT 1), 'Volume Beast Challenge', 'Lift 50,000kg total volume this month', 'volume', 50000, 'kg', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE, 50),
  ((SELECT id FROM auth.users LIMIT 1), 'Push-Up Power', 'Complete 1000 push-ups this week', 'exercise_specific', 1000, 'reps', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', TRUE, NULL);

-- Add comments for documentation
COMMENT ON TABLE user_follows IS 'User following relationships for social features';
COMMENT ON TABLE workout_shares IS 'Shared workouts with captions and visibility settings';
COMMENT ON TABLE workout_likes IS 'Likes on shared workouts';
COMMENT ON TABLE workout_comments IS 'Comments on shared workouts with threading support';
COMMENT ON TABLE challenges IS 'Fitness challenges users can create and join';
COMMENT ON TABLE challenge_participants IS 'User participation in challenges with progress tracking';
COMMENT ON TABLE leaderboards IS 'Various fitness metric leaderboards';
COMMENT ON TABLE leaderboard_entries IS 'User rankings on leaderboards by time period';
COMMENT ON TABLE user_achievements IS 'Achievement system for fitness milestones';
COMMENT ON TABLE social_feed IS 'Activity feed for social interactions';
COMMENT ON TABLE user_settings IS 'User privacy and notification preferences';

COMMENT ON COLUMN workout_shares.share_type IS 'Type of share: workout, achievement, or progress update';
COMMENT ON COLUMN challenges.challenge_type IS 'Type of challenge: volume, frequency, streak, exercise_specific, or custom';
COMMENT ON COLUMN leaderboards.metric_type IS 'Metric being tracked: total_volume, workout_frequency, streak, exercise_max, or custom';
COMMENT ON COLUMN user_settings.profile_visibility IS 'Who can view user profile: public, friends, or private';

-- Verify the changes
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_follows', 'workout_shares', 'workout_likes', 'workout_comments', 'challenges', 'challenge_participants', 'leaderboards', 'leaderboard_entries', 'user_achievements', 'social_feed', 'user_settings')
ORDER BY table_name, ordinal_position; 