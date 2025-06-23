-- Check actual muscle_group values in exercises table
SELECT DISTINCT muscle_group, COUNT(*) as count 
FROM exercises 
GROUP BY muscle_group 
ORDER BY muscle_group;

-- Sample exercises to see the pattern
SELECT name, muscle_group 
FROM exercises 
ORDER BY muscle_group, name 
LIMIT 20;
