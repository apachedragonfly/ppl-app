-- Add advanced metrics fields to workout_logs table
-- Run this in your Supabase SQL Editor

-- Add RPE (Rate of Perceived Exertion) field
ALTER TABLE workout_logs 
ADD COLUMN IF NOT EXISTS rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10);

-- Add RIR (Reps in Reserve) field  
ALTER TABLE workout_logs 
ADD COLUMN IF NOT EXISTS rir INTEGER CHECK (rir >= 0 AND rir <= 5);

-- Add exercise type classification for SFR analysis
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS exercise_type TEXT CHECK (exercise_type IN ('compound', 'isolation', 'accessory'));

-- Add SFR tier for stimulus-to-fatigue ratio
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS sfr_tier INTEGER CHECK (sfr_tier >= 1 AND sfr_tier <= 5);

-- Add estimated 1RM field for strength tracking
ALTER TABLE workout_logs 
ADD COLUMN IF NOT EXISTS estimated_1rm FLOAT;

-- Add rest time between sets for recovery analysis
ALTER TABLE workout_logs 
ADD COLUMN IF NOT EXISTS rest_seconds INTEGER;

-- Add workout duration to workouts table
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Add subjective recovery score to workouts table for recovery tracking
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS recovery_score INTEGER CHECK (recovery_score >= 1 AND recovery_score <= 10);

-- Add workout notes for qualitative tracking
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing exercises with exercise types and SFR tiers
UPDATE exercises SET 
  exercise_type = CASE 
    WHEN name IN ('Bench Press', 'Squats', 'Deadlifts', 'Overhead Press', 'Pull-ups', 'Rows') THEN 'compound'
    WHEN name IN ('Bicep Curls', 'Tricep Dips', 'Lateral Raises', 'Calf Raises', 'Leg Curls', 'Leg Extensions') THEN 'isolation'
    ELSE 'accessory'
  END,
  sfr_tier = CASE 
    WHEN name IN ('Squats', 'Deadlifts', 'Bench Press') THEN 1  -- Highest SFR
    WHEN name IN ('Overhead Press', 'Pull-ups', 'Rows') THEN 2
    WHEN name IN ('Incline Dumbbell Press', 'Romanian Deadlifts', 'Leg Press') THEN 3
    WHEN name IN ('Push-ups', 'Lunges', 'Lat Pulldowns') THEN 4
    ELSE 5  -- Lowest SFR (isolation exercises)
  END
WHERE exercise_type IS NULL OR sfr_tier IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_rpe ON workout_logs(rpe);
CREATE INDEX IF NOT EXISTS idx_workout_logs_rir ON workout_logs(rir);
CREATE INDEX IF NOT EXISTS idx_workout_logs_estimated_1rm ON workout_logs(estimated_1rm);
CREATE INDEX IF NOT EXISTS idx_exercises_exercise_type ON exercises(exercise_type);
CREATE INDEX IF NOT EXISTS idx_exercises_sfr_tier ON exercises(sfr_tier);
CREATE INDEX IF NOT EXISTS idx_workouts_recovery_score ON workouts(recovery_score);
CREATE INDEX IF NOT EXISTS idx_workouts_date_user ON workouts(date, user_id); 