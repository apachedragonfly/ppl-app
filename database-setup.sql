-- PPL Tracker Database Setup
-- Run this in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE UNIQUE,
  avatar_url TEXT,
  height_cm INT,
  weight_kg INT,
  age INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create exercises table (global and user-defined)
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE, -- NULL for global exercises
  name TEXT NOT NULL,
  muscle_group TEXT,
  workout_category TEXT, -- Push, Pull, or Legs
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create routines table
CREATE TABLE IF NOT EXISTS routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Push', 'Pull', 'Legs')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create routine_exercises table (links routines to exercises)  
CREATE TABLE IF NOT EXISTS routine_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INT,
  sets INT,
  reps INT,
  weight_kg FLOAT
);

-- Create workouts table (daily log)
CREATE TABLE IF NOT EXISTS workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('Push', 'Pull', 'Legs')),
  routine_id UUID REFERENCES routines(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create workout_logs table (actual entries for the day)
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  sets INT NOT NULL,
  reps INT NOT NULL,
  weight_kg FLOAT NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  -- Drop policies for profiles
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  
  -- Drop policies for exercises
  DROP POLICY IF EXISTS "Users can view all exercises" ON exercises;
  DROP POLICY IF EXISTS "Users can insert own exercises" ON exercises;
  DROP POLICY IF EXISTS "Users can update own exercises" ON exercises;
  DROP POLICY IF EXISTS "Users can delete own exercises" ON exercises;
  
  -- Drop policies for routines
  DROP POLICY IF EXISTS "Users can view own routines" ON routines;
  DROP POLICY IF EXISTS "Users can insert own routines" ON routines;
  DROP POLICY IF EXISTS "Users can update own routines" ON routines;
  DROP POLICY IF EXISTS "Users can delete own routines" ON routines;
  
  -- Drop policies for routine_exercises
  DROP POLICY IF EXISTS "Users can view own routine exercises" ON routine_exercises;
  DROP POLICY IF EXISTS "Users can insert own routine exercises" ON routine_exercises;
  DROP POLICY IF EXISTS "Users can update own routine exercises" ON routine_exercises;
  DROP POLICY IF EXISTS "Users can delete own routine exercises" ON routine_exercises;
  
  -- Drop policies for workouts
  DROP POLICY IF EXISTS "Users can view own workouts" ON workouts;
  DROP POLICY IF EXISTS "Users can insert own workouts" ON workouts;
  DROP POLICY IF EXISTS "Users can update own workouts" ON workouts;
  DROP POLICY IF EXISTS "Users can delete own workouts" ON workouts;
  
  -- Drop policies for workout_logs
  DROP POLICY IF EXISTS "Users can view own workout logs" ON workout_logs;
  DROP POLICY IF EXISTS "Users can insert own workout logs" ON workout_logs;
  DROP POLICY IF EXISTS "Users can update own workout logs" ON workout_logs;
  DROP POLICY IF EXISTS "Users can delete own workout logs" ON workout_logs;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for exercises  
CREATE POLICY "Users can view all exercises" ON exercises FOR SELECT USING (true);
CREATE POLICY "Users can insert own exercises" ON exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercises" ON exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercises" ON exercises FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for routines
CREATE POLICY "Users can view own routines" ON routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own routines" ON routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own routines" ON routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own routines" ON routines FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for routine_exercises
CREATE POLICY "Users can view own routine exercises" ON routine_exercises FOR SELECT USING (
  EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_exercises.routine_id AND routines.user_id = auth.uid())
);
CREATE POLICY "Users can insert own routine exercises" ON routine_exercises FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_exercises.routine_id AND routines.user_id = auth.uid())
);
CREATE POLICY "Users can update own routine exercises" ON routine_exercises FOR UPDATE USING (
  EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_exercises.routine_id AND routines.user_id = auth.uid())
);
CREATE POLICY "Users can delete own routine exercises" ON routine_exercises FOR DELETE USING (
  EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_exercises.routine_id AND routines.user_id = auth.uid())
);

-- Create RLS policies for workouts
CREATE POLICY "Users can view own workouts" ON workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workouts" ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" ON workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts" ON workouts FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workout_logs
CREATE POLICY "Users can view own workout logs" ON workout_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_logs.workout_id AND workouts.user_id = auth.uid())
);
CREATE POLICY "Users can insert own workout logs" ON workout_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_logs.workout_id AND workouts.user_id = auth.uid())
);
CREATE POLICY "Users can update own workout logs" ON workout_logs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_logs.workout_id AND workouts.user_id = auth.uid())
);
CREATE POLICY "Users can delete own workout logs" ON workout_logs FOR DELETE USING (
  EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_logs.workout_id AND workouts.user_id = auth.uid())
);

-- Insert some default exercises
INSERT INTO exercises (user_id, name, muscle_group, workout_category) VALUES
  (NULL, 'Bench Press', 'Chest', 'Push'),
  (NULL, 'Incline Dumbbell Press', 'Chest', 'Push'),
  (NULL, 'Push-ups', 'Chest', 'Push'),
  (NULL, 'Overhead Press', 'Shoulders', 'Push'),
  (NULL, 'Lateral Raises', 'Shoulders', 'Push'),
  (NULL, 'Tricep Dips', 'Triceps', 'Push'),
  (NULL, 'Close-Grip Bench Press', 'Triceps', 'Push'),
  (NULL, 'Pull-ups', 'Back', 'Pull'),
  (NULL, 'Rows', 'Back', 'Pull'),
  (NULL, 'Lat Pulldowns', 'Back', 'Pull'),
  (NULL, 'Deadlifts', 'Back', 'Pull'),
  (NULL, 'Bicep Curls', 'Biceps', 'Pull'),
  (NULL, 'Hammer Curls', 'Biceps', 'Pull'),
  (NULL, 'Squats', 'Legs', 'Legs'),
  (NULL, 'Romanian Deadlifts', 'Legs', 'Legs'),
  (NULL, 'Leg Press', 'Legs', 'Legs'),
  (NULL, 'Lunges', 'Legs', 'Legs'),
  (NULL, 'Calf Raises', 'Legs', 'Legs'),
  (NULL, 'Leg Curls', 'Legs', 'Legs'),
  (NULL, 'Leg Extensions', 'Legs', 'Legs')
ON CONFLICT DO NOTHING; 