-- Migration: Add workout templates and quick-start routines
-- Task 30: Add workout templates and quick-start routines functionality

-- Create workout_templates table for reusable workout templates
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  workout_type VARCHAR(20) NOT NULL CHECK (workout_type IN ('Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Cardio', 'Custom')),
  is_public BOOLEAN DEFAULT FALSE,
  estimated_duration_minutes INTEGER,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
  tags TEXT[], -- Array of tags for categorization
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

-- Create workout_template_exercises table for exercises in templates
CREATE TABLE IF NOT EXISTS workout_template_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps_min INTEGER,
  target_reps_max INTEGER,
  target_weight_kg FLOAT,
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  is_superset BOOLEAN DEFAULT FALSE,
  superset_group INTEGER, -- Group exercises together for supersets
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create quick_start_routines table for predefined routines
CREATE TABLE IF NOT EXISTS quick_start_routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  workout_type VARCHAR(20) NOT NULL,
  difficulty_level VARCHAR(20) NOT NULL,
  estimated_duration_minutes INTEGER NOT NULL,
  target_audience VARCHAR(50), -- e.g., 'Beginner', 'Home Workout', 'Gym'
  equipment_needed TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(100) DEFAULT 'System',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create quick_start_routine_exercises table
CREATE TABLE IF NOT EXISTS quick_start_routine_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID REFERENCES quick_start_routines(id) ON DELETE CASCADE NOT NULL,
  exercise_name VARCHAR(255) NOT NULL, -- Store exercise name instead of ID for global routines
  muscle_group VARCHAR(100) NOT NULL,
  order_index INTEGER NOT NULL,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps_min INTEGER,
  target_reps_max INTEGER,
  target_weight_percentage FLOAT, -- Percentage of bodyweight or 1RM
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  is_superset BOOLEAN DEFAULT FALSE,
  superset_group INTEGER
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_id ON workout_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_type ON workout_templates(workout_type);
CREATE INDEX IF NOT EXISTS idx_workout_templates_public ON workout_templates(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_workout_templates_difficulty ON workout_templates(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_workout_templates_tags ON workout_templates USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_template_exercises_template_id ON workout_template_exercises(template_id);
CREATE INDEX IF NOT EXISTS idx_template_exercises_order ON workout_template_exercises(template_id, order_index);
CREATE INDEX IF NOT EXISTS idx_template_exercises_superset ON workout_template_exercises(template_id, superset_group) WHERE superset_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quick_routines_type ON quick_start_routines(workout_type);
CREATE INDEX IF NOT EXISTS idx_quick_routines_difficulty ON quick_start_routines(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_quick_routines_featured ON quick_start_routines(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_quick_routine_exercises_routine_id ON quick_start_routine_exercises(routine_id);

-- Enable Row Level Security
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_templates
CREATE POLICY "Users can view own templates and public templates" ON workout_templates 
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can insert own templates" ON workout_templates 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON workout_templates 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON workout_templates 
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workout_template_exercises
CREATE POLICY "Users can view template exercises for accessible templates" ON workout_template_exercises 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_templates 
      WHERE id = template_id 
      AND (user_id = auth.uid() OR is_public = TRUE)
    )
  );

CREATE POLICY "Users can insert exercises for own templates" ON workout_template_exercises 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_templates 
      WHERE id = template_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises for own templates" ON workout_template_exercises 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_templates 
      WHERE id = template_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises for own templates" ON workout_template_exercises 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_templates 
      WHERE id = template_id 
      AND user_id = auth.uid()
    )
  );

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_workout_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workout_templates_updated_at
    BEFORE UPDATE ON workout_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_template_updated_at();

-- Insert some example quick-start routines
INSERT INTO quick_start_routines (name, description, workout_type, difficulty_level, estimated_duration_minutes, target_audience, equipment_needed, is_featured) VALUES
  ('Push Day Beginner', 'Basic push workout focusing on chest, shoulders, and triceps', 'Push', 'Beginner', 45, 'Gym Beginner', ARRAY['Barbell', 'Dumbbells', 'Bench'], TRUE),
  ('Pull Day Beginner', 'Basic pull workout focusing on back and biceps', 'Pull', 'Beginner', 45, 'Gym Beginner', ARRAY['Barbell', 'Dumbbells', 'Pull-up Bar'], TRUE),
  ('Leg Day Beginner', 'Basic leg workout focusing on quads, hamstrings, and glutes', 'Legs', 'Beginner', 50, 'Gym Beginner', ARRAY['Barbell', 'Dumbbells', 'Leg Press'], TRUE),
  ('Home Push Workout', 'Push workout using minimal equipment for home training', 'Push', 'Intermediate', 35, 'Home Workout', ARRAY['Dumbbells', 'Push-up Handles'], TRUE),
  ('Advanced Push Power', 'High-intensity push workout for experienced lifters', 'Push', 'Advanced', 60, 'Advanced Lifter', ARRAY['Barbell', 'Dumbbells', 'Cable Machine'], FALSE);

-- Insert exercises for Push Day Beginner routine
INSERT INTO quick_start_routine_exercises (routine_id, exercise_name, muscle_group, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds, notes) VALUES
  ((SELECT id FROM quick_start_routines WHERE name = 'Push Day Beginner'), 'Barbell Bench Press', 'Chest', 1, 3, 8, 12, 120, 'Focus on controlled movement and full range of motion'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Push Day Beginner'), 'Overhead Press', 'Shoulders', 2, 3, 8, 10, 90, 'Keep core tight and avoid arching back'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Push Day Beginner'), 'Incline Dumbbell Press', 'Chest', 3, 3, 10, 12, 90, 'Set bench to 30-45 degree incline'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Push Day Beginner'), 'Lateral Raises', 'Shoulders', 4, 3, 12, 15, 60, 'Use light weight and focus on form'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Push Day Beginner'), 'Tricep Dips', 'Triceps', 5, 3, 8, 12, 60, 'Can use assisted dip machine if needed'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Push Day Beginner'), 'Push-ups', 'Chest', 6, 2, 10, 15, 45, 'Modify on knees if needed');

-- Insert exercises for Pull Day Beginner routine
INSERT INTO quick_start_routine_exercises (routine_id, exercise_name, muscle_group, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds, notes) VALUES
  ((SELECT id FROM quick_start_routines WHERE name = 'Pull Day Beginner'), 'Deadlifts', 'Back', 1, 3, 5, 8, 150, 'Focus on proper form over heavy weight'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Pull Day Beginner'), 'Pull-ups', 'Back', 2, 3, 5, 10, 120, 'Use assisted machine or bands if needed'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Pull Day Beginner'), 'Barbell Rows', 'Back', 3, 3, 8, 10, 90, 'Keep torso parallel to floor'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Pull Day Beginner'), 'Lat Pulldowns', 'Back', 4, 3, 10, 12, 75, 'Pull to upper chest, not behind neck'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Pull Day Beginner'), 'Barbell Curls', 'Biceps', 5, 3, 10, 12, 60, 'Avoid swinging and use controlled motion'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Pull Day Beginner'), 'Hammer Curls', 'Biceps', 6, 3, 12, 15, 45, 'Keep elbows at sides');

-- Insert exercises for Leg Day Beginner routine
INSERT INTO quick_start_routine_exercises (routine_id, exercise_name, muscle_group, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds, notes) VALUES
  ((SELECT id FROM quick_start_routines WHERE name = 'Leg Day Beginner'), 'Barbell Back Squat', 'Legs', 1, 3, 8, 12, 150, 'Go to parallel or slightly below'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Leg Day Beginner'), 'Romanian Deadlifts', 'Legs', 2, 3, 10, 12, 120, 'Focus on hip hinge movement'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Leg Day Beginner'), 'Leg Press', 'Legs', 3, 3, 12, 15, 90, 'Full range of motion, controlled tempo'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Leg Day Beginner'), 'Walking Lunges', 'Legs', 4, 3, 10, 12, 75, '10-12 reps per leg'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Leg Day Beginner'), 'Leg Curls', 'Legs', 5, 3, 12, 15, 60, 'Squeeze hamstrings at the top'),
  ((SELECT id FROM quick_start_routines WHERE name = 'Leg Day Beginner'), 'Calf Raises', 'Legs', 6, 3, 15, 20, 45, 'Full range of motion, pause at top');

-- Add comments for documentation
COMMENT ON TABLE workout_templates IS 'User-created workout templates for reusable routines';
COMMENT ON TABLE workout_template_exercises IS 'Exercises within workout templates with target parameters';
COMMENT ON TABLE quick_start_routines IS 'Predefined workout routines for quick workout starts';
COMMENT ON TABLE quick_start_routine_exercises IS 'Exercises within quick-start routines';

COMMENT ON COLUMN workout_templates.is_public IS 'Whether template can be viewed by other users';
COMMENT ON COLUMN workout_templates.estimated_duration_minutes IS 'Estimated workout duration in minutes';
COMMENT ON COLUMN workout_templates.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN workout_template_exercises.superset_group IS 'Group ID for superset exercises (same group = superset)';
COMMENT ON COLUMN quick_start_routine_exercises.target_weight_percentage IS 'Percentage of bodyweight or 1RM for weight recommendation';

-- Verify the changes
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('workout_templates', 'workout_template_exercises', 'quick_start_routines', 'quick_start_routine_exercises')
ORDER BY table_name, ordinal_position; 