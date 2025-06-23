-- Update exercises with proper muscle groups based on musclegroups.md
-- This replaces the generic Push/Pull/Legs with actual muscle groups

-- Add a new column for workout category if it doesn't exist
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS workout_category TEXT;

-- Update workout categories first (these replace the current muscle_group values)
UPDATE exercises SET workout_category = 'Push' WHERE muscle_group = 'Push';
UPDATE exercises SET workout_category = 'Pull' WHERE muscle_group = 'Pull';
UPDATE exercises SET workout_category = 'Legs' WHERE muscle_group = 'Legs';

-- Now update muscle_group with actual primary muscle groups from musclegroups.md
-- PUSH exercises
UPDATE exercises SET muscle_group = 'Chest' WHERE name = 'Barbell Bench Press';
UPDATE exercises SET muscle_group = 'Chest' WHERE name = 'Dumbbell Bench Press (Flat)';
UPDATE exercises SET muscle_group = 'Upper Chest' WHERE name = 'Incline Dumbbell Press';
UPDATE exercises SET muscle_group = 'Front Delts' WHERE name = 'Overhead Shoulder Press (Seated Dumbbell)';
UPDATE exercises SET muscle_group = 'Front Delts' WHERE name = 'Overhead Shoulder Press (Machine)';
UPDATE exercises SET muscle_group = 'Side Delts' WHERE name = 'Dumbbell Lateral Raise';
UPDATE exercises SET muscle_group = 'Side Delts' WHERE name = 'Cable Lateral Raise';
UPDATE exercises SET muscle_group = 'Chest' WHERE name = 'Cable Chest Fly';
UPDATE exercises SET muscle_group = 'Chest' WHERE name = 'Pec-Deck Fly';
UPDATE exercises SET muscle_group = 'Triceps' WHERE name = 'Cable Triceps Pushdown (Straight-Bar)';
UPDATE exercises SET muscle_group = 'Triceps' WHERE name = 'Cable Overhead Triceps Extension';

-- PULL exercises
UPDATE exercises SET muscle_group = 'Lats' WHERE name = 'Chest-Supported Row (T-Bar)';
UPDATE exercises SET muscle_group = 'Lats' WHERE name = 'Chest-Supported Row (Machine)';
UPDATE exercises SET muscle_group = 'Lats' WHERE name = 'Seal Row';
UPDATE exercises SET muscle_group = 'Lats' WHERE name = 'Bent-Over Barbell Row';
UPDATE exercises SET muscle_group = 'Lats' WHERE name = 'One-Arm Dumbbell Row';
UPDATE exercises SET muscle_group = 'Lats' WHERE name = 'Lat Pulldown';
UPDATE exercises SET muscle_group = 'Lats' WHERE name = 'Weighted Pull-Up';
UPDATE exercises SET muscle_group = 'Rear Delts' WHERE name = 'Cable Rear-Delt Fly (Cross-Over)';
UPDATE exercises SET muscle_group = 'Rear Delts' WHERE name = 'Reverse Pec-Deck Fly';
UPDATE exercises SET muscle_group = 'Rear Delts' WHERE name = 'Face Pull (Rope Cable)';
UPDATE exercises SET muscle_group = 'Biceps' WHERE name = '45° EZ-Bar Preacher Curl';
UPDATE exercises SET muscle_group = 'Biceps' WHERE name = 'Hammer Curl';

-- LEGS exercises
UPDATE exercises SET muscle_group = 'Quads' WHERE name = 'Barbell Back Squat (High-Bar)';
UPDATE exercises SET muscle_group = 'Quads' WHERE name = 'Barbell Front Squat';
UPDATE exercises SET muscle_group = 'Glutes' WHERE name = 'Barbell Hip Thrust';
UPDATE exercises SET muscle_group = 'Glutes' WHERE name = 'Machine Hip Thrust';
UPDATE exercises SET muscle_group = 'Quads' WHERE name = 'Bulgarian Split Squat (Rear-Foot Elevated)';
UPDATE exercises SET muscle_group = 'Quads' WHERE name = 'Hack Squat (45° Sled)';
UPDATE exercises SET muscle_group = 'Quads' WHERE name = 'Pendulum Squat';
UPDATE exercises SET muscle_group = 'Quads' WHERE name = 'Leg Press (45° Sled)';
UPDATE exercises SET muscle_group = 'Quads' WHERE name = 'Leg Extension (Machine)';
UPDATE exercises SET muscle_group = 'Hamstrings' WHERE name = 'Romanian Deadlift (Barbell)';
UPDATE exercises SET muscle_group = 'Hamstrings' WHERE name = 'Romanian Deadlift (Dumbbell)';

-- Verification queries
SELECT 'Updated muscle groups:' as message;
SELECT workout_category, muscle_group, COUNT(*) as count 
FROM exercises 
GROUP BY workout_category, muscle_group 
ORDER BY workout_category, muscle_group;

SELECT 'Sample exercises by muscle group:' as message;
SELECT muscle_group, name 
FROM exercises 
ORDER BY muscle_group, name 
LIMIT 20; 