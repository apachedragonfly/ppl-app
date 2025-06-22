-- Migration: Add goals table for user fitness goal tracking
-- Run this in your Supabase SQL Editor

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  target_date DATE NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('strength', 'volume', 'frequency', 'endurance')),
  achieved BOOLEAN DEFAULT FALSE,
  achieved_date DATE NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_achieved ON goals(achieved);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);

-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for goals
CREATE POLICY "Users can view own goals" ON goals 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON goals 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON goals 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON goals 
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_goals_updated_at();

-- Add some example goals (optional - remove these if you don't want sample data)
-- These will be inserted for the first user that runs this migration
INSERT INTO goals (user_id, title, description, target_value, current_value, unit, target_date, category) VALUES
  ((SELECT id FROM auth.users LIMIT 1), 'Bench Press 100kg', 'Achieve a 100kg bench press for 1 rep max', 100, 85, 'kg', '2024-12-31', 'strength'),
  ((SELECT id FROM auth.users LIMIT 1), 'Workout 4x per week', 'Maintain consistent workout frequency of 4 times per week', 4, 3.2, 'workouts/week', '2024-12-31', 'frequency'),
  ((SELECT id FROM auth.users LIMIT 1), 'Deadlift 150kg', 'Achieve a 150kg deadlift for 1 rep max', 150, 120, 'kg', '2024-12-31', 'strength'),
  ((SELECT id FROM auth.users LIMIT 1), 'Total Volume 50k kg/month', 'Reach 50,000kg total monthly training volume', 50000, 38500, 'kg/month', '2024-12-31', 'volume')
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE goals IS 'User fitness goals with tracking and progress monitoring';
COMMENT ON COLUMN goals.target_value IS 'Numeric target to achieve (weight, reps, frequency, etc.)';
COMMENT ON COLUMN goals.current_value IS 'Current progress towards the target';
COMMENT ON COLUMN goals.unit IS 'Unit of measurement (kg, reps, workouts/week, etc.)';
COMMENT ON COLUMN goals.category IS 'Type of goal: strength, volume, frequency, or endurance';
COMMENT ON COLUMN goals.achieved IS 'Whether the goal has been completed';
COMMENT ON COLUMN goals.achieved_date IS 'Date when the goal was achieved (if applicable)';

-- Verify the changes
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'goals'
ORDER BY ordinal_position; 