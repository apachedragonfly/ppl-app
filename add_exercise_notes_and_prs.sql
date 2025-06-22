-- Migration: Add exercise notes and personal records
-- Task 28: Add exercise notes and personal records (PRs) functionality

-- Add notes column to exercises table
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create exercise_personal_records table for tracking PRs
CREATE TABLE IF NOT EXISTS exercise_personal_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('1rm', '3rm', '5rm', 'max_volume', 'max_reps', 'endurance')),
  weight_kg FLOAT,
  reps INTEGER,
  sets INTEGER,
  total_volume FLOAT, -- sets * reps * weight
  duration_seconds INTEGER, -- for endurance records
  notes TEXT,
  achieved_date DATE NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate record types per user/exercise
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercise_prs_unique 
ON exercise_personal_records(user_id, exercise_id, record_type);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_exercise_prs_user_id ON exercise_personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_prs_exercise_id ON exercise_personal_records(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_prs_achieved_date ON exercise_personal_records(achieved_date);
CREATE INDEX IF NOT EXISTS idx_exercises_notes ON exercises(notes) WHERE notes IS NOT NULL;

-- Enable Row Level Security for exercise_personal_records
ALTER TABLE exercise_personal_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exercise_personal_records
CREATE POLICY "Users can view own exercise PRs" ON exercise_personal_records 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise PRs" ON exercise_personal_records 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise PRs" ON exercise_personal_records 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise PRs" ON exercise_personal_records 
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_exercise_prs_updated_at ON exercise_personal_records;
CREATE TRIGGER update_exercise_prs_updated_at
    BEFORE UPDATE ON exercise_personal_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE exercise_personal_records IS 'User personal records for exercises';
COMMENT ON COLUMN exercise_personal_records.record_type IS 'Type of PR: 1rm, 3rm, 5rm, max_volume, max_reps, endurance';
COMMENT ON COLUMN exercise_personal_records.weight_kg IS 'Weight used for the PR (null for bodyweight exercises)';
COMMENT ON COLUMN exercise_personal_records.reps IS 'Number of reps for the PR';
COMMENT ON COLUMN exercise_personal_records.sets IS 'Number of sets for volume-based PRs';
COMMENT ON COLUMN exercise_personal_records.total_volume IS 'Total volume (sets * reps * weight) for volume PRs';
COMMENT ON COLUMN exercise_personal_records.duration_seconds IS 'Duration for endurance-based PRs (planks, etc)';
COMMENT ON COLUMN exercise_personal_records.achieved_date IS 'Date when the PR was achieved';
COMMENT ON COLUMN exercise_personal_records.workout_id IS 'Reference to the workout where PR was achieved';
COMMENT ON COLUMN exercises.notes IS 'Personal notes about the exercise (form cues, tips, etc)';

-- Insert some example PRs for testing (these would be created by users in practice)
-- Note: These are commented out as they require actual user IDs and exercise IDs
/*
INSERT INTO exercise_personal_records (user_id, exercise_id, record_type, weight_kg, reps, achieved_date, notes) VALUES
  ('user-id-here', 'exercise-id-here', '1rm', 100.0, 1, CURRENT_DATE, 'New PR! Felt strong today'),
  ('user-id-here', 'exercise-id-here', '5rm', 85.0, 5, CURRENT_DATE - INTERVAL '7 days', 'Good form throughout');
*/

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'exercises' AND column_name = 'notes';

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'exercise_personal_records' 
ORDER BY ordinal_position; 