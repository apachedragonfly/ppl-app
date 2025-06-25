-- Fix routine editor exercise issues
-- This migration adds missing workout_category column and exercises

-- Add workout_category column if it doesn't exist
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS workout_category TEXT;

-- Update workout_category for existing exercises based on muscle_group
UPDATE exercises SET workout_category = 'Push' WHERE muscle_group IN ('Chest', 'Shoulders', 'Triceps');
UPDATE exercises SET workout_category = 'Pull' WHERE muscle_group IN ('Back', 'Biceps');
UPDATE exercises SET workout_category = 'Legs' WHERE muscle_group IN ('Legs', 'Quads', 'Hamstrings', 'Glutes');

-- Add missing Barbell Bench Press if it doesn't exist
INSERT INTO exercises (user_id, name, muscle_group, workout_category) 
SELECT NULL, 'Barbell Bench Press', 'Chest', 'Push'
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Bench Press');

-- Add other commonly expected exercises (only if they don't exist)
DO $$ 
BEGIN
  -- Insert exercises only if they don't already exist
  INSERT INTO exercises (user_id, name, muscle_group, workout_category) 
  SELECT NULL, 'Dumbbell Bench Press (Flat)', 'Chest', 'Push'
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Bench Press (Flat)');
  
  INSERT INTO exercises (user_id, name, muscle_group, workout_category) 
  SELECT NULL, 'Cable Lateral Raise', 'Shoulders', 'Push'
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Lateral Raise');
  
  INSERT INTO exercises (user_id, name, muscle_group, workout_category) 
  SELECT NULL, 'Cable Triceps Pushdown', 'Triceps', 'Push'
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Triceps Pushdown');
  
  INSERT INTO exercises (user_id, name, muscle_group, workout_category) 
  SELECT NULL, 'Chest-Supported Row', 'Back', 'Pull'
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chest-Supported Row');
  
  INSERT INTO exercises (user_id, name, muscle_group, workout_category) 
  SELECT NULL, 'Lat Pulldown', 'Back', 'Pull'
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Lat Pulldown');
  
  INSERT INTO exercises (user_id, name, muscle_group, workout_category) 
  SELECT NULL, 'Cable Rear-Delt Fly', 'Back', 'Pull'
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Rear-Delt Fly');
  
  INSERT INTO exercises (user_id, name, muscle_group, workout_category) 
  SELECT NULL, 'Barbell Back Squat', 'Legs', 'Legs'
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Back Squat');
  
  INSERT INTO exercises (user_id, name, muscle_group, workout_category) 
  SELECT NULL, 'Romanian Deadlift', 'Legs', 'Legs'
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Romanian Deadlift');
  
  INSERT INTO exercises (user_id, name, muscle_group, workout_category) 
  SELECT NULL, 'Bulgarian Split Squat', 'Legs', 'Legs'
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bulgarian Split Squat');
END $$;

-- Update muscle_group to more specific values where needed
UPDATE exercises SET muscle_group = 'Chest' WHERE name = 'Barbell Bench Press';
UPDATE exercises SET muscle_group = 'Chest' WHERE name = 'Dumbbell Bench Press (Flat)';
UPDATE exercises SET muscle_group = 'Shoulders' WHERE name = 'Cable Lateral Raise';
UPDATE exercises SET muscle_group = 'Triceps' WHERE name = 'Cable Triceps Pushdown';
UPDATE exercises SET muscle_group = 'Back' WHERE name = 'Chest-Supported Row';
UPDATE exercises SET muscle_group = 'Back' WHERE name = 'Lat Pulldown';
UPDATE exercises SET muscle_group = 'Back' WHERE name = 'Cable Rear-Delt Fly';
UPDATE exercises SET muscle_group = 'Legs' WHERE name = 'Barbell Back Squat';
UPDATE exercises SET muscle_group = 'Legs' WHERE name = 'Romanian Deadlift';
UPDATE exercises SET muscle_group = 'Legs' WHERE name = 'Bulgarian Split Squat';

-- Verify the results
SELECT 'Exercises by workout_category:' as message;
SELECT workout_category, COUNT(*) as count 
FROM exercises 
WHERE workout_category IS NOT NULL
GROUP BY workout_category 
ORDER BY workout_category;

SELECT 'Sample Push exercises:' as message;
SELECT name, muscle_group, workout_category 
FROM exercises 
WHERE workout_category = 'Push' 
ORDER BY name 
LIMIT 10; 