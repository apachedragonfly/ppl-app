-- Simple step-by-step migration
-- Run each section separately in Supabase SQL Editor

-- Step 1: Add columns to exercises table
ALTER TABLE exercises ADD COLUMN last_weight_kg DECIMAL(5,2);
ALTER TABLE exercises ADD COLUMN last_sets INTEGER;
ALTER TABLE exercises ADD COLUMN last_reps INTEGER;
ALTER TABLE exercises ADD COLUMN last_workout_date DATE;
ALTER TABLE exercises ADD COLUMN user_id UUID;

-- Step 2: Add foreign key constraint
ALTER TABLE exercises ADD CONSTRAINT fk_exercises_user FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Step 3: Create index
CREATE INDEX idx_exercises_user_id ON exercises(user_id);

-- Step 4: Check if columns were added (run this to verify)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'exercises' 
ORDER BY ordinal_position; 