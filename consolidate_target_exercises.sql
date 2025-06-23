-- Consolidate exercises to match target list
-- Merge same exercises with different equipment using bracket notation

-- 1. Bench Press consolidation
-- Keep "Barbell Bench Press" as the main one, merge generic "Bench Press" into it
UPDATE workout_logs 
SET exercise_id = '3535bdc9-f5a3-464d-bc7f-389e02dd0b26' 
WHERE exercise_id = '967134a6-0ef3-477e-a468-0f5a9db7ed7d';

UPDATE routine_exercises 
SET exercise_id = '3535bdc9-f5a3-464d-bc7f-389e02dd0b26' 
WHERE exercise_id = '967134a6-0ef3-477e-a468-0f5a9db7ed7d';

DELETE FROM exercises WHERE id = '967134a6-0ef3-477e-a468-0f5a9db7ed7d';

-- Update Dumbbell variations to use bracket notation
UPDATE exercises SET name = 'Bench Press (Dumbbell Flat)' WHERE id = '6b7c48b2-c839-4f40-aa19-64d45beaf55d';
UPDATE exercises SET name = 'Bench Press (Dumbbell Incline)' WHERE id = '41bd208a-04c5-4070-8dc5-573fbc11894f';

-- Merge "Incline Dumbbell Press" into "Bench Press (Dumbbell Incline)"
UPDATE workout_logs 
SET exercise_id = '41bd208a-04c5-4070-8dc5-573fbc11894f' 
WHERE exercise_id = '4b0f73ca-7319-4db1-833a-0721aebf0fbc';

UPDATE routine_exercises 
SET exercise_id = '41bd208a-04c5-4070-8dc5-573fbc11894f' 
WHERE exercise_id = '4b0f73ca-7319-4db1-833a-0721aebf0fbc';

DELETE FROM exercises WHERE id = '4b0f73ca-7319-4db1-833a-0721aebf0fbc';

-- 2. Lateral Raise consolidation
-- Keep "Lateral Dumbbell Raise" as main, merge others and update names
UPDATE exercises SET name = 'Lateral Raise (Dumbbell)' WHERE id = 'aa148db0-72b7-4b90-95de-7e9daf8d11a9';
UPDATE exercises SET name = 'Lateral Raise (Cable)' WHERE id = '9dc14eb0-83b1-4c98-bb5c-ddd43044ddee';

-- Merge "Lateral Raises" into "Lateral Raise (Dumbbell)"
UPDATE workout_logs 
SET exercise_id = 'aa148db0-72b7-4b90-95de-7e9daf8d11a9' 
WHERE exercise_id = 'be6c3be6-cd7b-442d-b401-a884df13746e';

UPDATE routine_exercises 
SET exercise_id = 'aa148db0-72b7-4b90-95de-7e9daf8d11a9' 
WHERE exercise_id = 'be6c3be6-cd7b-442d-b401-a884df13746e';

DELETE FROM exercises WHERE id = 'be6c3be6-cd7b-442d-b401-a884df13746e';

-- 3. Triceps Pushdown consolidation
-- Update to bracket notation and merge
UPDATE exercises SET name = 'Triceps Pushdown (Cable)' WHERE id = '98cff5d2-28c6-424a-bcaa-c57c1adb2be7';

-- Merge "Tricep Pushdowns" into main one
UPDATE workout_logs 
SET exercise_id = '98cff5d2-28c6-424a-bcaa-c57c1adb2be7' 
WHERE exercise_id = '7721c79f-b016-49a2-ba68-dbf1423efc87';

UPDATE routine_exercises 
SET exercise_id = '98cff5d2-28c6-424a-bcaa-c57c1adb2be7' 
WHERE exercise_id = '7721c79f-b016-49a2-ba68-dbf1423efc87';

DELETE FROM exercises WHERE id = '7721c79f-b016-49a2-ba68-dbf1423efc87';

-- 4. Barbell Row consolidation
-- Update to bracket notation and merge
UPDATE exercises SET name = 'Row (Barbell Bent-Over)' WHERE id = '9cde57da-e220-4d13-9de0-7ab8817a65c9';

-- Merge "Barbell Rows" into main one
UPDATE workout_logs 
SET exercise_id = '9cde57da-e220-4d13-9de0-7ab8817a65c9' 
WHERE exercise_id = '5d154d46-5195-4907-a06f-c4e56f8d5096';

UPDATE routine_exercises 
SET exercise_id = '9cde57da-e220-4d13-9de0-7ab8817a65c9' 
WHERE exercise_id = '5d154d46-5195-4907-a06f-c4e56f8d5096';

DELETE FROM exercises WHERE id = '5d154d46-5195-4907-a06f-c4e56f8d5096';

-- 5. Pulldown/Pull-up consolidation
-- Update to bracket notation
UPDATE exercises SET name = 'Pulldown/Pull-up (Lat Pulldown)' WHERE id = '4989fa9a-ed70-453a-ad74-e569f0115d0f';
UPDATE exercises SET name = 'Pulldown/Pull-up (Bodyweight)' WHERE id = '0f5fb28d-47cc-4359-bd04-b1379e88322e';

-- Merge "Weighted Pull-Up" into bodyweight version (they're the same exercise)
UPDATE workout_logs 
SET exercise_id = '0f5fb28d-47cc-4359-bd04-b1379e88322e' 
WHERE exercise_id = 'f2c50cdc-ff83-4726-88a8-e739662830bd';

UPDATE routine_exercises 
SET exercise_id = '0f5fb28d-47cc-4359-bd04-b1379e88322e' 
WHERE exercise_id = 'f2c50cdc-ff83-4726-88a8-e739662830bd';

DELETE FROM exercises WHERE id = 'f2c50cdc-ff83-4726-88a8-e739662830bd';

-- 6. Squat consolidation
-- Update to bracket notation
UPDATE exercises SET name = 'Squat (Barbell Back High-Bar)' WHERE id = 'a35d7af7-1777-4f46-b421-197a3ca5e1d0';
UPDATE exercises SET name = 'Squat (Barbell Front)' WHERE id = '25972230-8148-467a-a5a5-a7ad5f8146dd';
UPDATE exercises SET name = 'Squat (Hack 45° Sled)' WHERE id = 'c0189a7a-e739-4960-8c93-8d3645e12afd';

-- Merge "Barbell Back Squats" into main high-bar version
UPDATE workout_logs 
SET exercise_id = 'a35d7af7-1777-4f46-b421-197a3ca5e1d0' 
WHERE exercise_id = '5a368969-6746-4351-a90f-977e1c47d117';

UPDATE routine_exercises 
SET exercise_id = 'a35d7af7-1777-4f46-b421-197a3ca5e1d0' 
WHERE exercise_id = '5a368969-6746-4351-a90f-977e1c47d117';

DELETE FROM exercises WHERE id = '5a368969-6746-4351-a90f-977e1c47d117';

-- Merge "Front Squats" into main front squat version
UPDATE workout_logs 
SET exercise_id = '25972230-8148-467a-a5a5-a7ad5f8146dd' 
WHERE exercise_id = 'f1a7d139-87d9-40ca-8faa-0ceecb7b5e73';

UPDATE routine_exercises 
SET exercise_id = '25972230-8148-467a-a5a5-a7ad5f8146dd' 
WHERE exercise_id = 'f1a7d139-87d9-40ca-8faa-0ceecb7b5e73';

DELETE FROM exercises WHERE id = 'f1a7d139-87d9-40ca-8faa-0ceecb7b5e73';

-- 7. Hip Thrust consolidation
-- Update to bracket notation
UPDATE exercises SET name = 'Hip Thrust (Barbell)' WHERE id = 'eed07487-12c4-4275-96f2-4c7beb607cb6';
UPDATE exercises SET name = 'Hip Thrust (Machine)' WHERE id = 'af243004-ac5b-4403-830d-e905c564f0e7';

-- Merge "Hip Thrusts" into barbell version
UPDATE workout_logs 
SET exercise_id = 'eed07487-12c4-4275-96f2-4c7beb607cb6' 
WHERE exercise_id = 'ccfce94b-95ea-4fa1-83e8-be3cee916175';

UPDATE routine_exercises 
SET exercise_id = 'eed07487-12c4-4275-96f2-4c7beb607cb6' 
WHERE exercise_id = 'ccfce94b-95ea-4fa1-83e8-be3cee916175';

DELETE FROM exercises WHERE id = 'ccfce94b-95ea-4fa1-83e8-be3cee916175';

-- 8. Deadlift consolidation
-- Update to bracket notation (Romanian vs Regular are different exercises)
UPDATE exercises SET name = 'Deadlift (Romanian)' WHERE id = '7a3a06a4-7af3-4092-83dd-2a078efeabd4';
UPDATE exercises SET name = 'Deadlift (Conventional)' WHERE id = '21182434-aedc-4acf-add1-57ed94718650';

-- Update muscle groups to match target categories
UPDATE exercises SET muscle_group = 'Push' WHERE name LIKE 'Bench Press%';
UPDATE exercises SET muscle_group = 'Push' WHERE name LIKE 'Lateral Raise%';
UPDATE exercises SET muscle_group = 'Push' WHERE name LIKE 'Triceps Pushdown%';
UPDATE exercises SET muscle_group = 'Pull' WHERE name LIKE 'Row%';
UPDATE exercises SET muscle_group = 'Pull' WHERE name LIKE 'Pulldown%';
UPDATE exercises SET muscle_group = 'Legs' WHERE name LIKE 'Squat%';
UPDATE exercises SET muscle_group = 'Legs' WHERE name LIKE 'Hip Thrust%';
UPDATE exercises SET muscle_group = 'Legs' WHERE name LIKE 'Deadlift%';

-- Verify final count
SELECT 'Consolidation completed - remaining exercise count:' as message;
SELECT COUNT(*) as total_exercises FROM exercises; 