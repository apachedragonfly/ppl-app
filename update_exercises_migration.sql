-- PPL Tracker - Add New Exercises Migration
-- Run this in your Supabase SQL Editor after the main database-setup.sql
-- This adds 28 new exercises while avoiding duplicates

-- Create a temporary table to track what we're adding
CREATE TEMP TABLE new_exercises_to_add (
    name TEXT,
    muscle_group TEXT,
    category TEXT,
    equipment TEXT,
    is_compound BOOLEAN
);

-- Insert all new exercises into temp table
INSERT INTO new_exercises_to_add (name, muscle_group, category, equipment, is_compound) VALUES
    -- PUSH EXERCISES
    ('Barbell Bench Press', 'Chest', 'Push', 'barbell', true),
    ('Cable Lateral Raise', 'Shoulders', 'Push', 'cable', false),
    ('Chest Fly (Cable)', 'Chest', 'Push', 'cable', false),
    ('Chest Fly (Pec-Deck)', 'Chest', 'Push', 'machine', false),
    ('Dumbbell Bench Press (Flat)', 'Chest', 'Push', 'dumbbell', true),
    ('Dumbbell Bench Press (Incline)', 'Chest', 'Push', 'dumbbell', true),
    ('Lateral Dumbbell Raise', 'Shoulders', 'Push', 'dumbbell', false),
    ('Overhead Cable Triceps Extension', 'Triceps', 'Push', 'cable', false),
    ('Overhead Shoulder Press (Machine)', 'Shoulders', 'Push', 'machine', true),
    ('Overhead Shoulder Press (Seated Dumbbell)', 'Shoulders', 'Push', 'dumbbell', true),
    ('Triceps Pushdown (Straight-Bar Cable)', 'Triceps', 'Push', 'cable', false),
    
    -- PULL EXERCISES
    ('45° EZ-Bar Preacher Curl', 'Biceps', 'Pull', 'barbell', false),
    ('Bent-Over Barbell Row', 'Back', 'Pull', 'barbell', true),
    ('Cable Rear-Delt Fly', 'Shoulders', 'Pull', 'cable', false),
    ('Chest-Supported Row (T-Bar)', 'Back', 'Pull', 'barbell', true),
    ('Chest-Supported Row (Seal Row)', 'Back', 'Pull', 'barbell', true),
    ('Chest-Supported Row (Machine)', 'Back', 'Pull', 'machine', true),
    ('Face Pull (Rope Cable)', 'Shoulders', 'Pull', 'cable', false),
    ('Lat Pulldown', 'Back', 'Pull', 'cable', true),
    ('Weighted Pull-Up', 'Back', 'Pull', 'bodyweight', true),
    ('One-Arm Dumbbell Row', 'Back', 'Pull', 'dumbbell', true),
    ('Reverse Pec-Deck Fly', 'Shoulders', 'Pull', 'machine', false),
    
    -- LEGS EXERCISES
    ('Barbell Back Squat (High-Bar)', 'Legs', 'Legs', 'barbell', true),
    ('Barbell Front Squat', 'Legs', 'Legs', 'barbell', true),
    ('Barbell Hip Thrust', 'Legs', 'Legs', 'barbell', true),
    ('Machine Hip Thrust', 'Legs', 'Legs', 'machine', true),
    ('Bulgarian Split Squat', 'Legs', 'Legs', 'dumbbell', true),
    ('Hack Squat (45° Sled)', 'Legs', 'Legs', 'machine', true),
    ('Hack Squat (Pendulum)', 'Legs', 'Legs', 'machine', true),
    ('Leg Press (45° Sled)', 'Legs', 'Legs', 'machine', true),
    ('Romanian Deadlift', 'Legs', 'Legs', 'barbell', true);

-- Show what we're about to add
SELECT 'NEW EXERCISES TO ADD:' as status;
SELECT category, COUNT(*) as count FROM new_exercises_to_add GROUP BY category ORDER BY category;

-- Check for potential duplicates (case-insensitive, ignoring parentheses)
SELECT 'POTENTIAL DUPLICATES:' as status;
SELECT 
    n.name as new_name,
    e.name as existing_name,
    n.muscle_group as new_group,
    e.muscle_group as existing_group
FROM new_exercises_to_add n
JOIN exercises e ON (
    LOWER(REGEXP_REPLACE(n.name, '\s*\([^)]*\)\s*', '', 'g')) = 
    LOWER(REGEXP_REPLACE(e.name, '\s*\([^)]*\)\s*', '', 'g'))
    OR LOWER(n.name) = LOWER(e.name)
)
WHERE e.user_id IS NULL;

-- Insert new exercises (only those that don't already exist)
INSERT INTO exercises (user_id, name, muscle_group)
SELECT 
    NULL,
    n.name,
    n.muscle_group
FROM new_exercises_to_add n
WHERE NOT EXISTS (
    SELECT 1 FROM exercises e 
    WHERE e.user_id IS NULL 
    AND (
        LOWER(REGEXP_REPLACE(n.name, '\s*\([^)]*\)\s*', '', 'g')) = 
        LOWER(REGEXP_REPLACE(e.name, '\s*\([^)]*\)\s*', '', 'g'))
        OR LOWER(n.name) = LOWER(e.name)
    )
);

-- Show final summary
SELECT 'FINAL EXERCISE COUNT BY MUSCLE GROUP:' as status;
SELECT 
    muscle_group,
    COUNT(*) as total_exercises
FROM exercises 
WHERE user_id IS NULL 
GROUP BY muscle_group
ORDER BY muscle_group;

-- Show all exercises by category for verification
SELECT 'ALL EXERCISES BY CATEGORY:' as status;
SELECT 
    CASE 
        WHEN muscle_group IN ('Chest', 'Shoulders', 'Triceps') THEN 'PUSH'
        WHEN muscle_group IN ('Back', 'Biceps') THEN 'PULL'
        WHEN muscle_group IN ('Legs') THEN 'LEGS'
        ELSE 'OTHER'
    END as category,
    muscle_group,
    name
FROM exercises 
WHERE user_id IS NULL 
ORDER BY 
    CASE 
        WHEN muscle_group IN ('Chest', 'Shoulders', 'Triceps') THEN 1
        WHEN muscle_group IN ('Back', 'Biceps') THEN 2
        WHEN muscle_group IN ('Legs') THEN 3
        ELSE 4
    END,
    muscle_group,
    name; 