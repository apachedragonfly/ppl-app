-- Standardize Exercise List to Match Target Format
-- This will create/update/merge exercises to match the exact list provided

-- ========== CREATE ALL TARGET EXERCISES ==========

-- First, create all the target exercises (only if they don't exist)
-- PUSH exercises
INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Barbell Bench Press', 'Push', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Bench Press');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Dumbbell Bench Press (Flat)', 'Push', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Bench Press (Flat)');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Incline Dumbbell Press', 'Push', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Incline Dumbbell Press');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Overhead Shoulder Press (Seated Dumbbell)', 'Push', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Overhead Shoulder Press (Seated Dumbbell)');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Overhead Shoulder Press (Machine)', 'Push', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Overhead Shoulder Press (Machine)');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Dumbbell Lateral Raise', 'Push', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Lateral Raise');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Cable Lateral Raise', 'Push', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Lateral Raise');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Cable Chest Fly', 'Push', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Chest Fly');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Pec-Deck Fly', 'Push', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Pec-Deck Fly');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Cable Triceps Pushdown (Straight-Bar)', 'Push', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Triceps Pushdown (Straight-Bar)');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Cable Overhead Triceps Extension', 'Push', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Overhead Triceps Extension');

-- PULL exercises
INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Chest-Supported Row (T-Bar)', 'Pull', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chest-Supported Row (T-Bar)');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Chest-Supported Row (Machine)', 'Pull', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chest-Supported Row (Machine)');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Seal Row', 'Pull', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Seal Row');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Bent-Over Barbell Row', 'Pull', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bent-Over Barbell Row');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'One-Arm Dumbbell Row', 'Pull', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'One-Arm Dumbbell Row');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Lat Pulldown', 'Pull', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Lat Pulldown');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Weighted Pull-Up', 'Pull', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Weighted Pull-Up');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Cable Rear-Delt Fly (Cross-Over)', 'Pull', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Rear-Delt Fly (Cross-Over)');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Reverse Pec-Deck Fly', 'Pull', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Reverse Pec-Deck Fly');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Face Pull (Rope Cable)', 'Pull', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Face Pull (Rope Cable)');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), '45° EZ-Bar Preacher Curl', 'Pull', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = '45° EZ-Bar Preacher Curl');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Hammer Curl', 'Pull', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hammer Curl');

-- LEGS exercises
INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Barbell Back Squat (High-Bar)', 'Legs', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Back Squat (High-Bar)');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Barbell Front Squat', 'Legs', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Front Squat');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Barbell Hip Thrust', 'Legs', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Hip Thrust');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Machine Hip Thrust', 'Legs', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Machine Hip Thrust');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Bulgarian Split Squat (Rear-Foot Elevated)', 'Legs', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bulgarian Split Squat (Rear-Foot Elevated)');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Hack Squat (45° Sled)', 'Legs', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hack Squat (45° Sled)');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Pendulum Squat', 'Legs', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Pendulum Squat');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Leg Press (45° Sled)', 'Legs', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Leg Press (45° Sled)');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Leg Extension (Machine)', 'Legs', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Leg Extension (Machine)');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Romanian Deadlift (Barbell)', 'Legs', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Romanian Deadlift (Barbell)');

INSERT INTO exercises (id, name, muscle_group, user_id) 
SELECT gen_random_uuid(), 'Romanian Deadlift (Dumbbell)', 'Legs', NULL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Romanian Deadlift (Dumbbell)');

-- ========== MIGRATE EXISTING DATA ==========

-- Get the new exercise IDs for migration
WITH exercise_mapping AS (
  SELECT 
    old.id as old_id,
    new.id as new_id,
    old.name as old_name,
    new.name as new_name
  FROM exercises old
  CROSS JOIN exercises new
  WHERE 
    -- Map old names to new names
    (old.name = 'Barbell Bench Press' AND new.name = 'Barbell Bench Press') OR
    (old.name = 'Dumbbell Bench Press (Flat)' AND new.name = 'Dumbbell Bench Press (Flat)') OR
    (old.name = 'Incline Dumbbell Press' AND new.name = 'Incline Dumbbell Press') OR
    (old.name = 'Dumbbell Lateral Raise' AND new.name = 'Dumbbell Lateral Raise') OR
    (old.name = 'Cable Lateral Raise' AND new.name = 'Cable Lateral Raise') OR
    (old.name = 'Tricep Pushdown' AND new.name = 'Cable Triceps Pushdown (Straight-Bar)') OR
    (old.name = 'Tricep Pushdowns' AND new.name = 'Cable Triceps Pushdown (Straight-Bar)') OR
    (old.name = 'Overhead Cable Triceps Extension' AND new.name = 'Cable Overhead Triceps Extension') OR
    (old.name = 'Bent-Over Barbell Row' AND new.name = 'Bent-Over Barbell Row') OR
    (old.name = 'Barbell Rows' AND new.name = 'Bent-Over Barbell Row') OR
    (old.name = 'Lat Pulldown' AND new.name = 'Lat Pulldown') OR
    (old.name = 'Pull-ups' AND new.name = 'Weighted Pull-Up') OR
    (old.name = 'Weighted Pull-ups' AND new.name = 'Weighted Pull-Up') OR
    (old.name = 'Face Pulls' AND new.name = 'Face Pull (Rope Cable)') OR
    (old.name = '45° EZ-Bar Preacher Curl' AND new.name = '45° EZ-Bar Preacher Curl') OR
    (old.name = 'Hammer Curls' AND new.name = 'Hammer Curl') OR
    (old.name = 'Barbell Back Squat (High-Bar)' AND new.name = 'Barbell Back Squat (High-Bar)') OR
    (old.name = 'Barbell Back Squats' AND new.name = 'Barbell Back Squat (High-Bar)') OR
    (old.name = 'Barbell Front Squat' AND new.name = 'Barbell Front Squat') OR
    (old.name = 'Front Squats' AND new.name = 'Barbell Front Squat') OR
    (old.name = 'Barbell Hip Thrust' AND new.name = 'Barbell Hip Thrust') OR
    (old.name = 'Hip Thrusts' AND new.name = 'Barbell Hip Thrust') OR
    (old.name = 'Machine Hip Thrust' AND new.name = 'Machine Hip Thrust') OR
    (old.name = 'Bulgarian Split Squats' AND new.name = 'Bulgarian Split Squat (Rear-Foot Elevated)') OR
    (old.name = 'Hack Squat (45° Sled)' AND new.name = 'Hack Squat (45° Sled)') OR
    (old.name = 'Leg Press' AND new.name = 'Leg Press (45° Sled)') OR
    (old.name = 'Leg Extensions' AND new.name = 'Leg Extension (Machine)') OR
    (old.name = 'Romanian Deadlifts' AND new.name = 'Romanian Deadlift (Barbell)')
)
-- Update workout_logs
UPDATE workout_logs 
SET exercise_id = exercise_mapping.new_id
FROM exercise_mapping 
WHERE workout_logs.exercise_id = exercise_mapping.old_id;

-- Update routine_exercises
WITH exercise_mapping AS (
  SELECT 
    old.id as old_id,
    new.id as new_id,
    old.name as old_name,
    new.name as new_name
  FROM exercises old
  CROSS JOIN exercises new
  WHERE 
    -- Same mapping as above
    (old.name = 'Barbell Bench Press' AND new.name = 'Barbell Bench Press') OR
    (old.name = 'Dumbbell Bench Press (Flat)' AND new.name = 'Dumbbell Bench Press (Flat)') OR
    (old.name = 'Incline Dumbbell Press' AND new.name = 'Incline Dumbbell Press') OR
    (old.name = 'Dumbbell Lateral Raise' AND new.name = 'Dumbbell Lateral Raise') OR
    (old.name = 'Cable Lateral Raise' AND new.name = 'Cable Lateral Raise') OR
    (old.name = 'Tricep Pushdown' AND new.name = 'Cable Triceps Pushdown (Straight-Bar)') OR
    (old.name = 'Tricep Pushdowns' AND new.name = 'Cable Triceps Pushdown (Straight-Bar)') OR
    (old.name = 'Overhead Cable Triceps Extension' AND new.name = 'Cable Overhead Triceps Extension') OR
    (old.name = 'Bent-Over Barbell Row' AND new.name = 'Bent-Over Barbell Row') OR
    (old.name = 'Barbell Rows' AND new.name = 'Bent-Over Barbell Row') OR
    (old.name = 'Lat Pulldown' AND new.name = 'Lat Pulldown') OR
    (old.name = 'Pull-ups' AND new.name = 'Weighted Pull-Up') OR
    (old.name = 'Weighted Pull-ups' AND new.name = 'Weighted Pull-Up') OR
    (old.name = 'Face Pulls' AND new.name = 'Face Pull (Rope Cable)') OR
    (old.name = '45° EZ-Bar Preacher Curl' AND new.name = '45° EZ-Bar Preacher Curl') OR
    (old.name = 'Hammer Curls' AND new.name = 'Hammer Curl') OR
    (old.name = 'Barbell Back Squat (High-Bar)' AND new.name = 'Barbell Back Squat (High-Bar)') OR
    (old.name = 'Barbell Back Squats' AND new.name = 'Barbell Back Squat (High-Bar)') OR
    (old.name = 'Barbell Front Squat' AND new.name = 'Barbell Front Squat') OR
    (old.name = 'Front Squats' AND new.name = 'Barbell Front Squat') OR
    (old.name = 'Barbell Hip Thrust' AND new.name = 'Barbell Hip Thrust') OR
    (old.name = 'Hip Thrusts' AND new.name = 'Barbell Hip Thrust') OR
    (old.name = 'Machine Hip Thrust' AND new.name = 'Machine Hip Thrust') OR
    (old.name = 'Bulgarian Split Squats' AND new.name = 'Bulgarian Split Squat (Rear-Foot Elevated)') OR
    (old.name = 'Hack Squat (45° Sled)' AND new.name = 'Hack Squat (45° Sled)') OR
    (old.name = 'Leg Press' AND new.name = 'Leg Press (45° Sled)') OR
    (old.name = 'Leg Extensions' AND new.name = 'Leg Extension (Machine)') OR
    (old.name = 'Romanian Deadlifts' AND new.name = 'Romanian Deadlift (Barbell)')
)
UPDATE routine_exercises 
SET exercise_id = exercise_mapping.new_id
FROM exercise_mapping 
WHERE routine_exercises.exercise_id = exercise_mapping.old_id;

-- ========== CLEANUP ==========

-- Delete old exercises that have been migrated
DELETE FROM exercises WHERE name NOT IN (
  'Barbell Bench Press', 'Dumbbell Bench Press (Flat)', 'Incline Dumbbell Press',
  'Overhead Shoulder Press (Seated Dumbbell)', 'Overhead Shoulder Press (Machine)',
  'Dumbbell Lateral Raise', 'Cable Lateral Raise', 'Cable Chest Fly', 'Pec-Deck Fly',
  'Cable Triceps Pushdown (Straight-Bar)', 'Cable Overhead Triceps Extension',
  'Chest-Supported Row (T-Bar)', 'Chest-Supported Row (Machine)', 'Seal Row',
  'Bent-Over Barbell Row', 'One-Arm Dumbbell Row', 'Lat Pulldown', 'Weighted Pull-Up',
  'Cable Rear-Delt Fly (Cross-Over)', 'Reverse Pec-Deck Fly', 'Face Pull (Rope Cable)',
  '45° EZ-Bar Preacher Curl', 'Hammer Curl',
  'Barbell Back Squat (High-Bar)', 'Barbell Front Squat', 'Barbell Hip Thrust', 'Machine Hip Thrust',
  'Bulgarian Split Squat (Rear-Foot Elevated)', 'Hack Squat (45° Sled)', 'Pendulum Squat',
  'Leg Press (45° Sled)', 'Leg Extension (Machine)', 'Romanian Deadlift (Barbell)', 'Romanian Deadlift (Dumbbell)'
);

-- Final verification
SELECT 'Standardization completed!' as message;
SELECT muscle_group, COUNT(*) as count FROM exercises GROUP BY muscle_group ORDER BY muscle_group;
SELECT COUNT(*) as total_exercises FROM exercises;
