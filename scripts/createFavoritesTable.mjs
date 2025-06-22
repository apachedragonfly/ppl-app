import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFavoritesTable() {
  console.log('🔧 Creating exercise_favorites table...\n');
  
  console.log('📝 You need to run this SQL in your Supabase dashboard:\n');
  
  const sql = `
-- Create exercise_favorites table
CREATE TABLE IF NOT EXISTS exercise_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercise_favorites_user_id ON exercise_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_favorites_exercise_id ON exercise_favorites(exercise_id);

-- Enable Row Level Security
ALTER TABLE exercise_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own favorites" 
  ON exercise_favorites FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
  ON exercise_favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
  ON exercise_favorites FOR DELETE 
  USING (auth.uid() = user_id);

-- Add some comments
COMMENT ON TABLE exercise_favorites IS 'User favorite exercises';
COMMENT ON COLUMN exercise_favorites.user_id IS 'User who favorited the exercise';
COMMENT ON COLUMN exercise_favorites.exercise_id IS 'Exercise that was favorited';
`;

  console.log(sql);
  console.log('\n📋 After running this SQL:');
  console.log('1. The exercise_favorites table will be created');
  console.log('2. Proper foreign key relationships will be established');
  console.log('3. RLS policies will protect user data');
  console.log('4. You can then update the app to re-enable favorites functionality');
  
  console.log('\n🔄 Once the table is created, run this to update the app:');
  console.log('npm run update:favorites-query');
}

createFavoritesTable(); 