-- Migration: Add exercise metadata columns
-- Task 24: Add database columns for video, description, and muscles_worked

-- Add new columns to exercises table
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_title TEXT,
ADD COLUMN IF NOT EXISTS video_author TEXT,
ADD COLUMN IF NOT EXISTS muscles_worked JSONB;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);

-- Add some comments for documentation
COMMENT ON COLUMN exercises.description IS 'Exercise description and instructions';
COMMENT ON COLUMN exercises.video_url IS 'YouTube or other video URL for exercise demonstration';
COMMENT ON COLUMN exercises.video_title IS 'Title of the instructional video';
COMMENT ON COLUMN exercises.video_author IS 'Author/channel name of the video';
COMMENT ON COLUMN exercises.muscles_worked IS 'JSON object with primary and secondary muscle groups: {"primary": ["Chest"], "secondary": ["Triceps", "Shoulders"]}';

-- Update some existing exercises with metadata
UPDATE exercises SET 
  description = 'Primary chest exercise using a barbell on a bench',
  video_url = 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  video_title = 'How to Bench Press with Proper Form',
  video_author = 'Athlean-X',
  muscles_worked = '{"primary": ["Chest"], "secondary": ["Triceps", "Shoulders"]}'::jsonb
WHERE name = 'Bench Press' AND user_id IS NULL;

UPDATE exercises SET 
  description = 'Bodyweight back exercise, excellent for building upper body strength',
  video_url = 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
  video_title = 'How to Do a Pull Up | Proper Form',
  video_author = 'Athlean-X',
  muscles_worked = '{"primary": ["Back"], "secondary": ["Biceps", "Shoulders"]}'::jsonb
WHERE name = 'Pull-ups' AND user_id IS NULL;

UPDATE exercises SET 
  description = 'Primary leg exercise targeting quadriceps, glutes, and hamstrings',
  video_url = 'https://www.youtube.com/watch?v=ultWZbUMPL8',
  video_title = 'How to Squat with Proper Form',
  video_author = 'Athlean-X',
  muscles_worked = '{"primary": ["Legs"], "secondary": ["Core", "Back"]}'::jsonb
WHERE name = 'Squats' AND user_id IS NULL;

UPDATE exercises SET 
  description = 'Hip-hinge movement pattern, excellent for posterior chain development',
  video_url = 'https://www.youtube.com/watch?v=1ZXobu7JvvE',
  video_title = 'How to Deadlift with Proper Form',
  video_author = 'Athlean-X',
  muscles_worked = '{"primary": ["Back", "Legs"], "secondary": ["Core", "Shoulders"]}'::jsonb
WHERE name = 'Deadlifts' AND user_id IS NULL;

UPDATE exercises SET 
  description = 'Standing shoulder press for building overhead strength',
  video_url = 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
  video_title = 'How to Overhead Press with Perfect Form',
  video_author = 'Athlean-X',
  muscles_worked = '{"primary": ["Shoulders"], "secondary": ["Triceps", "Core"]}'::jsonb
WHERE name = 'Overhead Press' AND user_id IS NULL;

-- Verify the changes
SELECT 
  name, 
  muscle_group, 
  description IS NOT NULL as has_description,
  video_url IS NOT NULL as has_video,
  muscles_worked IS NOT NULL as has_muscles_worked
FROM exercises 
WHERE user_id IS NULL 
ORDER BY name;

-- Show column information
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'exercises' 
ORDER BY ordinal_position; 