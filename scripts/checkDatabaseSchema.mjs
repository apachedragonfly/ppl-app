import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking exercises table schema...\n');
  
  try {
    // Try to get a sample exercise to see current structure
    const { data: sampleExercise, error: sampleError } = await supabase
      .from('exercises')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleError && sampleError.code !== 'PGRST116') {
      console.error('❌ Error querying exercises table:', sampleError);
      return;
    }
    
    if (sampleExercise) {
      console.log('📋 Current exercise table structure:');
      console.log('Columns found:', Object.keys(sampleExercise));
      console.log('\n📄 Sample exercise data:');
      console.log(JSON.stringify(sampleExercise, null, 2));
    } else {
      console.log('⚠️  No exercises found in database');
    }
    
    // Check what columns we expect vs what we have
    const expectedColumns = ['id', 'user_id', 'name', 'muscle_group', 'created_at', 'video', 'description', 'muscles_worked'];
    const actualColumns = sampleExercise ? Object.keys(sampleExercise) : [];
    
    console.log('\n🔍 Column Analysis:');
    expectedColumns.forEach(col => {
      const exists = actualColumns.includes(col);
      console.log(`${exists ? '✅' : '❌'} ${col} ${exists ? '(exists)' : '(missing)'}`);
    });
    
    // Check for old column structure
    const oldColumns = ['video_url', 'video_title', 'video_author'];
    const hasOldColumns = oldColumns.some(col => actualColumns.includes(col));
    
    if (hasOldColumns) {
      console.log('\n⚠️  Found old video column structure:');
      oldColumns.forEach(col => {
        if (actualColumns.includes(col)) {
          console.log(`   - ${col} (should be migrated to video JSONB)`);
        }
      });
    }
    
    // Provide migration instructions
    if (!actualColumns.includes('video') || !actualColumns.includes('description') || !actualColumns.includes('muscles_worked')) {
      console.log('\n🔧 MIGRATION NEEDED:');
      console.log('Run this SQL in your Supabase dashboard:\n');
      
      if (!actualColumns.includes('description')) {
        console.log('ALTER TABLE exercises ADD COLUMN IF NOT EXISTS description TEXT;');
      }
      if (!actualColumns.includes('video')) {
        console.log('ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video JSONB;');
      }
      if (!actualColumns.includes('muscles_worked')) {
        console.log('ALTER TABLE exercises ADD COLUMN IF NOT EXISTS muscles_worked JSONB;');
      }
      
      console.log('\n📝 After running the SQL, restart your app and try again.');
    } else {
      console.log('\n✅ Database schema looks correct!');
    }
    
  } catch (error) {
    console.error('💥 Error checking database schema:', error);
  }
}

checkDatabaseSchema(); 