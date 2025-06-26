-- Enhanced Social Features Migration
-- This adds comprehensive social functionality to PPL Tracker

-- Workout Posts Table
CREATE TABLE IF NOT EXISTS workout_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  caption TEXT,
  workout_type VARCHAR(20) DEFAULT 'Custom',
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  achievements JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Post Likes Table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES workout_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicate likes
  UNIQUE(post_id, user_id)
);

-- Post Comments Table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES workout_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment_text TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User Follows Table
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent self-follows and duplicate follows
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_name VARCHAR(100) NOT NULL,
  achievement_description TEXT,
  achievement_data JSONB DEFAULT '{}',
  earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_featured BOOLEAN DEFAULT false
);

-- Challenges Table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  challenge_type VARCHAR(30) NOT NULL, -- 'weekly', 'monthly', 'custom'
  target_metric VARCHAR(30) NOT NULL, -- 'workouts', 'volume', 'streak', etc.
  target_value INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  participants_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Challenge Participants Table
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(challenge_id, user_id)
);

-- Leaderboard view for monthly stats
CREATE OR REPLACE VIEW monthly_leaderboard AS
WITH monthly_stats AS (
  SELECT 
    w.user_id,
    p.name as user_name,
    COUNT(*) as total_workouts,
    COALESCE(SUM(
      (SELECT SUM((we.weight * we.reps * we.sets))
       FROM workout_exercises we 
       WHERE we.workout_id = w.id)
    ), 0) as total_volume,
    COUNT(DISTINCT DATE(w.date)) as workout_days,
    -- Calculate streak (simplified)
    MAX(DATE(w.date)) as last_workout_date
  FROM workouts w
  LEFT JOIN profiles p ON p.user_id = w.user_id
  WHERE w.date >= DATE_TRUNC('month', CURRENT_DATE)
    AND w.date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  GROUP BY w.user_id, p.name
),
achievements_count AS (
  SELECT 
    user_id,
    COUNT(*) as achievements_count
  FROM user_achievements
  WHERE earned_at >= DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY user_id
)
SELECT 
  ROW_NUMBER() OVER (ORDER BY ms.total_volume DESC, ms.total_workouts DESC) as rank,
  ms.user_id,
  ms.user_name,
  ms.total_workouts,
  ms.total_volume,
  ms.workout_days as streak_days,
  COALESCE(ac.achievements_count, 0) as achievements_count,
  ms.last_workout_date
FROM monthly_stats ms
LEFT JOIN achievements_count ac ON ac.user_id = ms.user_id
ORDER BY ms.total_volume DESC, ms.total_workouts DESC;

-- Add RLS policies
ALTER TABLE workout_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

-- Workout Posts Policies
CREATE POLICY "Public posts are viewable by everyone" ON workout_posts
  FOR SELECT USING (is_public = true);

CREATE POLICY "Private posts viewable by author and followers" ON workout_posts
  FOR SELECT USING (
    is_public = false AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_follows uf 
        WHERE uf.following_id = user_id AND uf.follower_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own posts" ON workout_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON workout_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON workout_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Post Likes Policies
CREATE POLICY "Likes are viewable by everyone" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Post Comments Policies
CREATE POLICY "Comments are viewable by everyone" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can comment on posts" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- User Follows Policies
CREATE POLICY "Follows are viewable by everyone" ON user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- User Achievements Policies
CREATE POLICY "Achievements are viewable by everyone" ON user_achievements
  FOR SELECT USING (true);

CREATE POLICY "System can create achievements" ON user_achievements
  FOR INSERT WITH CHECK (true);

-- Challenges Policies
CREATE POLICY "Challenges are viewable by everyone" ON challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create challenges" ON challenges
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Challenge Participants Policies
CREATE POLICY "Participants are viewable by everyone" ON challenge_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join challenges" ON challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_workout_posts_user_id ON workout_posts(user_id);
CREATE INDEX idx_workout_posts_created_at ON workout_posts(created_at DESC);
CREATE INDEX idx_workout_posts_public ON workout_posts(is_public) WHERE is_public = true;

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned_at ON user_achievements(earned_at DESC);

CREATE INDEX idx_challenges_active ON challenges(is_active) WHERE is_active = true;
CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);

CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);

-- Functions to update counters
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE workout_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE workout_posts 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE workout_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE workout_posts 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_challenge_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE challenges 
    SET participants_count = participants_count + 1 
    WHERE id = NEW.challenge_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE challenges 
    SET participants_count = participants_count - 1 
    WHERE id = OLD.challenge_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

CREATE TRIGGER trigger_update_challenge_participants_count
  AFTER INSERT OR DELETE ON challenge_participants
  FOR EACH ROW EXECUTE FUNCTION update_challenge_participants_count();

-- Updated at triggers
CREATE TRIGGER update_workout_posts_updated_at 
  BEFORE UPDATE ON workout_posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at 
  BEFORE UPDATE ON post_comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample challenges
INSERT INTO challenges (title, description, challenge_type, target_metric, target_value, start_date, end_date) VALUES
('January Volume Challenge', 'Hit 50,000kg total volume this month!', 'monthly', 'volume', 50000, '2024-01-01', '2024-01-31'),
('Consistency Champion', 'Complete 20 workouts this month', 'monthly', 'workouts', 20, '2024-01-01', '2024-01-31'),
('Week of Power', 'Complete 5 workouts in 7 days', 'weekly', 'workouts', 5, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days');

-- Sample achievements for existing users
INSERT INTO user_achievements (user_id, achievement_type, achievement_name, achievement_description)
SELECT 
  id,
  'milestone',
  'Welcome to PPL!',
  'Completed your first workout'
FROM auth.users 
WHERE email IS NOT NULL
ON CONFLICT DO NOTHING; 