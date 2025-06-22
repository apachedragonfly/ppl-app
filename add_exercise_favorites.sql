-- Migration: Add exercise favorites system
-- Task 26: Add exercise favorites/bookmarking functionality

-- Add is_favorite column to exercises table
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Create exercise_favorites table for user-specific favorites
-- This allows users to favorite global exercises without modifying the global exercise
CREATE TABLE IF NOT EXISTS exercise_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_exercise_favorites_user_id ON exercise_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_favorites_exercise_id ON exercise_favorites(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercises_is_favorite ON exercises(is_favorite) WHERE is_favorite = TRUE;

-- Enable Row Level Security for exercise_favorites
ALTER TABLE exercise_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exercise_favorites
CREATE POLICY "Users can view own exercise favorites" ON exercise_favorites 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise favorites" ON exercise_favorites 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise favorites" ON exercise_favorites 
  FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE exercise_favorites IS 'User-specific exercise favorites/bookmarks';
COMMENT ON COLUMN exercise_favorites.user_id IS 'User who favorited the exercise';
COMMENT ON COLUMN exercise_favorites.exercise_id IS 'Exercise that was favorited';
COMMENT ON COLUMN exercises.is_favorite IS 'Quick favorite flag for user-owned exercises (deprecated in favor of exercise_favorites table)';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'exercises' AND column_name = 'is_favorite';

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'exercise_favorites' 
ORDER BY ordinal_position; 