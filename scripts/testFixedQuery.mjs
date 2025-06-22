import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedQuery() {
  console.log('🧪 Testing the fixed query...\n');
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Current user:', user ? `${user.id}` : 'Not authenticated');
    
    // Test the fixed query (same as in the app)
    console.log('\n📊 Testing fixed exercises query...');
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .or(user?.id ? `user_id.eq.${user.id},user_id.is.null` : `user_id.is.null`)
      .order('name');
    
    if (error) {
      console.error('❌ Query failed:', error);
    } else {
      console.log('✅ Query succeeded!');
      console.log(`📈 Found ${data?.length} exercises`);
      
      if (data && data.length > 0) {
        console.log('\n📋 Sample exercises:');
        data.slice(0, 3).forEach((exercise, index) => {
          console.log(`${index + 1}. ${exercise.name}`);
          console.log(`   - Muscle Group: ${exercise.muscle_group}`);
          console.log(`   - User ID: ${exercise.user_id || 'Global'}`);
          console.log(`   - Has Video: ${exercise.video ? 'Yes' : 'No'}`);
          console.log(`   - Has Description: ${exercise.description ? 'Yes' : 'No'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testFixedQuery(); 