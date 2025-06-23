-- Check current exercise list before standardization
SELECT 
  muscle_group,
  name,
  id,
  (SELECT COUNT(*) FROM workout_logs WHERE exercise_id = exercises.id) as workout_count,
  (SELECT COUNT(*) FROM routine_exercises WHERE exercise_id = exercises.id) as routine_count
FROM exercises 
ORDER BY muscle_group, name;

-- Summary by muscle group
SELECT 
  muscle_group, 
  COUNT(*) as exercise_count,
  SUM((SELECT COUNT(*) FROM workout_logs WHERE exercise_id = exercises.id)) as total_workouts,
  SUM((SELECT COUNT(*) FROM routine_exercises WHERE exercise_id = exercises.id)) as total_routine_uses
FROM exercises 
GROUP BY muscle_group 
ORDER BY muscle_group;

-- Total count
SELECT COUNT(*) as total_exercises FROM exercises;
