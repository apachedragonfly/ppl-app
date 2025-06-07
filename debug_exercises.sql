-- Debug query to check exercise muscle groups
-- Run this in Supabase SQL Editor to see what muscle groups exist

-- Check all unique muscle groups
SELECT DISTINCT muscle_group, COUNT(*) as exercise_count
FROM exercises 
GROUP BY muscle_group 
ORDER BY muscle_group;

-- Check specific exercises that should be main lifts
SELECT name, muscle_group 
FROM exercises 
WHERE name ILIKE '%bench%' 
   OR name ILIKE '%press%' 
   OR name ILIKE '%squat%' 
   OR name ILIKE '%deadlift%' 
   OR name ILIKE '%row%' 
   OR name ILIKE '%pull%'
ORDER BY name;

-- Check all exercises to see the data
SELECT name, muscle_group 
FROM exercises 
ORDER BY muscle_group, name; 