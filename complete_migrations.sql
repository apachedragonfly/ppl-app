-- Complete Migrations for PPL Tracker
-- Run this AFTER the main database-setup.sql script
-- Copy and paste this entire script into Supabase SQL Editor

-- 1. Add profile name column (required for dashboard)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Add exercise metadata columns (required for exercise info)
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_title TEXT,
ADD COLUMN IF NOT EXISTS video_author TEXT,
ADD COLUMN IF NOT EXISTS muscles_worked JSONB;

-- 3. Add advanced metrics fields (required for workout logging)
ALTER TABLE workout_logs 
ADD COLUMN IF NOT EXISTS rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
ADD COLUMN IF NOT EXISTS rir INTEGER CHECK (rir >= 0 AND rir <= 5),
ADD COLUMN IF NOT EXISTS estimated_1rm FLOAT,
ADD COLUMN IF NOT EXISTS rest_seconds INTEGER;

-- 4. Add workout enhancements
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS recovery_score INTEGER CHECK (recovery_score >= 1 AND recovery_score <= 10),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. Add exercise classifications (required for analytics)
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS exercise_type TEXT CHECK (exercise_type IN ('compound', 'isolation', 'accessory')),
ADD COLUMN IF NOT EXISTS sfr_tier INTEGER CHECK (sfr_tier >= 1 AND sfr_tier <= 5);

-- 6. Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Set up storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar." ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar." ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar." ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 8. Update existing exercises with metadata
UPDATE exercises SET 
  exercise_type = CASE 
    WHEN name IN ('Bench Press', 'Squats', 'Deadlifts', 'Overhead Press', 'Pull-ups', 'Rows') THEN 'compound'
    WHEN name IN ('Bicep Curls', 'Tricep Dips', 'Lateral Raises', 'Calf Raises', 'Leg Curls', 'Leg Extensions') THEN 'isolation'
    ELSE 'accessory'
  END,
  sfr_tier = CASE 
    WHEN name IN ('Squats', 'Deadlifts', 'Bench Press') THEN 1
    WHEN name IN ('Overhead Press', 'Pull-ups', 'Rows') THEN 2
    WHEN name IN ('Incline Dumbbell Press', 'Romanian Deadlifts', 'Leg Press') THEN 3
    WHEN name IN ('Push-ups', 'Lunges', 'Lat Pulldowns') THEN 4
    ELSE 5
  END,
  muscles_worked = CASE 
    WHEN name = 'Bench Press' THEN '{"primary": ["Chest"], "secondary": ["Triceps", "Shoulders"]}'::jsonb
    WHEN name = 'Pull-ups' THEN '{"primary": ["Back"], "secondary": ["Biceps", "Shoulders"]}'::jsonb
    WHEN name = 'Squats' THEN '{"primary": ["Legs"], "secondary": ["Core", "Back"]}'::jsonb
    WHEN name = 'Deadlifts' THEN '{"primary": ["Back", "Legs"], "secondary": ["Core", "Shoulders"]}'::jsonb
    WHEN name = 'Overhead Press' THEN '{"primary": ["Shoulders"], "secondary": ["Triceps", "Core"]}'::jsonb
    WHEN name = 'Incline Dumbbell Press' THEN '{"primary": ["Chest"], "secondary": ["Shoulders", "Triceps"]}'::jsonb
    WHEN name = 'Push-ups' THEN '{"primary": ["Chest"], "secondary": ["Triceps", "Shoulders"]}'::jsonb
    WHEN name = 'Lateral Raises' THEN '{"primary": ["Shoulders"], "secondary": []}'::jsonb
    WHEN name = 'Tricep Dips' THEN '{"primary": ["Triceps"], "secondary": ["Chest", "Shoulders"]}'::jsonb
    WHEN name = 'Close-Grip Bench Press' THEN '{"primary": ["Triceps"], "secondary": ["Chest", "Shoulders"]}'::jsonb
    WHEN name = 'Rows' THEN '{"primary": ["Back"], "secondary": ["Biceps", "Shoulders"]}'::jsonb
    WHEN name = 'Lat Pulldowns' THEN '{"primary": ["Back"], "secondary": ["Biceps"]}'::jsonb
    WHEN name = 'Bicep Curls' THEN '{"primary": ["Biceps"], "secondary": []}'::jsonb
    WHEN name = 'Hammer Curls' THEN '{"primary": ["Biceps"], "secondary": ["Forearms"]}'::jsonb
    WHEN name = 'Romanian Deadlifts' THEN '{"primary": ["Legs"], "secondary": ["Back", "Core"]}'::jsonb
    WHEN name = 'Leg Press' THEN '{"primary": ["Legs"], "secondary": []}'::jsonb
    WHEN name = 'Lunges' THEN '{"primary": ["Legs"], "secondary": ["Core"]}'::jsonb
    WHEN name = 'Calf Raises' THEN '{"primary": ["Legs"], "secondary": []}'::jsonb
    WHEN name = 'Leg Curls' THEN '{"primary": ["Legs"], "secondary": []}'::jsonb
    WHEN name = 'Leg Extensions' THEN '{"primary": ["Legs"], "secondary": []}'::jsonb
    ELSE '{"primary": ["General"], "secondary": []}'::jsonb
  END
WHERE user_id IS NULL;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);
CREATE INDEX IF NOT EXISTS idx_workout_logs_rpe ON workout_logs(rpe);
CREATE INDEX IF NOT EXISTS idx_workout_logs_rir ON workout_logs(rir);
CREATE INDEX IF NOT EXISTS idx_exercises_exercise_type ON exercises(exercise_type);
CREATE INDEX IF NOT EXISTS idx_workouts_date_user ON workouts(date, user_id);

-- Success message
SELECT 'All migrations completed successfully!' as status; 