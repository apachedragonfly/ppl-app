-- Add New Exercises to PPL Tracker
-- This script adds exercises while avoiding duplicates

-- First, let's see what exercises already exist
-- SELECT name, muscle_group FROM exercises WHERE user_id IS NULL ORDER BY muscle_group, name;

-- Add new PUSH exercises (avoiding duplicates)
INSERT INTO exercises (user_id, name, muscle_group) VALUES
  -- Push exercises
  (NULL, 'Barbell Bench Press', 'Chest'),  -- Similar to existing "Bench Press" but more specific
  (NULL, 'Cable Lateral Raise', 'Shoulders'),  -- Different from "Lateral Raises" (specifies cable)
  (NULL, 'Chest Fly (Cable)', 'Chest'),  -- New exercise
  (NULL, 'Chest Fly (Pec-Deck)', 'Chest'),  -- New exercise  
  (NULL, 'Dumbbell Bench Press (Flat)', 'Chest'),  -- Different from "Incline Dumbbell Press"
  (NULL, 'Dumbbell Bench Press (Incline)', 'Chest'),  -- Similar to existing but more specific
  (NULL, 'Lateral Dumbbell Raise', 'Shoulders'),  -- Different from "Lateral Raises" (specifies dumbbell)
  (NULL, 'Overhead Cable Triceps Extension', 'Triceps'),  -- New exercise
  (NULL, 'Overhead Shoulder Press (Machine)', 'Shoulders'),  -- Different from "Overhead Press" (specifies machine)
  (NULL, 'Overhead Shoulder Press (Seated Dumbbell)', 'Shoulders'),  -- Different from "Overhead Press" (specifies seated dumbbell)
  (NULL, 'Triceps Pushdown (Straight-Bar Cable)', 'Triceps'),  -- New exercise
  
  -- Pull exercises  
  (NULL, '45° EZ-Bar Preacher Curl', 'Biceps'),  -- Different from "Bicep Curls"
  (NULL, 'Bent-Over Barbell Row', 'Back'),  -- Different from "Rows" (more specific)
  (NULL, 'Cable Rear-Delt Fly', 'Shoulders'),  -- New exercise
  (NULL, 'Chest-Supported Row (T-Bar)', 'Back'),  -- Different from "Rows"
  (NULL, 'Chest-Supported Row (Seal Row)', 'Back'),  -- Different from "Rows"
  (NULL, 'Chest-Supported Row (Machine)', 'Back'),  -- Different from "Rows"
  (NULL, 'Face Pull (Rope Cable)', 'Shoulders'),  -- New exercise
  -- Skip "Hammer Curl" as "Hammer Curls" already exists
  (NULL, 'Lat Pulldown', 'Back'),  -- Similar to "Lat Pulldowns" but singular
  (NULL, 'Weighted Pull-Up', 'Back'),  -- Different from "Pull-ups" (weighted)
  (NULL, 'One-Arm Dumbbell Row', 'Back'),  -- Different from "Rows"
  (NULL, 'Reverse Pec-Deck Fly', 'Shoulders'),  -- New exercise
  
  -- Legs exercises
  (NULL, 'Barbell Back Squat (High-Bar)', 'Legs'),  -- Different from "Squats" (more specific)
  (NULL, 'Barbell Front Squat', 'Legs'),  -- Different from "Squats"
  (NULL, 'Barbell Hip Thrust', 'Legs'),  -- New exercise
  (NULL, 'Machine Hip Thrust', 'Legs'),  -- New exercise
  (NULL, 'Bulgarian Split Squat', 'Legs'),  -- Different from "Lunges"
  (NULL, 'Hack Squat (45° Sled)', 'Legs'),  -- New exercise
  (NULL, 'Hack Squat (Pendulum)', 'Legs'),  -- New exercise
  -- Skip "Leg Extension" as "Leg Extensions" already exists (plural vs singular)
  (NULL, 'Leg Press (45° Sled)', 'Legs'),  -- Different from "Leg Press" (more specific)
  (NULL, 'Romanian Deadlift', 'Legs')  -- Different from "Romanian Deadlifts" (singular vs plural)
ON CONFLICT DO NOTHING;

-- Summary of what was added vs skipped:
-- 
-- SKIPPED (already exist or very similar):
-- - "Hammer Curl" (exists as "Hammer Curls")
-- - "Leg Extension" (exists as "Leg Extensions") 
-- - Basic "Leg Press" (exists, but we added more specific variant)
-- - Basic "Romanian Deadlifts" (exists, but we added singular variant)
--
-- ADDED (28 new exercises):
-- Push (11): Barbell Bench Press, Cable Lateral Raise, Chest Fly variants, 
--           Dumbbell Bench Press variants, Lateral Dumbbell Raise, 
--           Overhead Cable Triceps Extension, Overhead Shoulder Press variants,
--           Triceps Pushdown
-- Pull (10): 45° EZ-Bar Preacher Curl, Bent-Over Barbell Row, Cable Rear-Delt Fly,
--           Chest-Supported Row variants, Face Pull, Lat Pulldown, Weighted Pull-Up,
--           One-Arm Dumbbell Row, Reverse Pec-Deck Fly  
-- Legs (7): Barbell Back Squat, Barbell Front Squat, Hip Thrust variants,
--          Bulgarian Split Squat, Hack Squat variants, Leg Press (45° Sled),
--          Romanian Deadlift

-- Verify additions
SELECT 
  muscle_group,
  COUNT(*) as exercise_count,
  STRING_AGG(name, ', ' ORDER BY name) as exercises
FROM exercises 
WHERE user_id IS NULL 
GROUP BY muscle_group
ORDER BY muscle_group; 