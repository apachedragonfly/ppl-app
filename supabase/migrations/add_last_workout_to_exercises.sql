-- Add last workout tracking to exercises table
ALTER TABLE exercises 
ADD COLUMN last_weight_kg DECIMAL(5,2),
ADD COLUMN last_sets INTEGER,
ADD COLUMN last_reps INTEGER,
ADD COLUMN last_workout_date DATE,
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index for user lookups
CREATE INDEX idx_exercises_user_id ON exercises(user_id);

-- Update RLS policy to allow users to see their own exercise data
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view exercises" ON exercises;
CREATE POLICY "Users can view exercises" ON exercises
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their exercise progress" ON exercises;
CREATE POLICY "Users can update their exercise progress" ON exercises
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL); 