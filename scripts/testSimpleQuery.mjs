import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQueries() {
  console.log('🧪 Testing different query variations...\n');
  
  try {
    // Test 1: Simple query without joins
    console.log('1️⃣ Testing simple exercises query...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('exercises')
      .select('*')
      .limit(5);
    
    if (simpleError) {
      console.error('❌ Simple query failed:', simpleError);
    } else {
      console.log('✅ Simple query succeeded:', simpleData?.length, 'exercises found');
    }
    
    // Test 2: Check if exercise_favorites table exists
    console.log('\n2️⃣ Testing exercise_favorites table...');
    const { data: favData, error: favError } = await supabase
      .from('exercise_favorites')
      .select('*')
      .limit(1);
    
    if (favError) {
      console.error('❌ exercise_favorites query failed:', favError);
      console.log('   This table might not exist yet.');
    } else {
      console.log('✅ exercise_favorites table exists');
    }
    
    // Test 3: Query with user filter
    console.log('\n3️⃣ Testing user-filtered query...');
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: userFilteredData, error: userFilteredError } = await supabase
      .from('exercises')
      .select('*')
      .or(`user_id.eq.${user?.id},user_id.is.null`)
      .limit(5);
    
    if (userFilteredError) {
      console.error('❌ User-filtered query failed:', userFilteredError);
    } else {
      console.log('✅ User-filtered query succeeded:', userFilteredData?.length, 'exercises found');
    }
    
    // Test 4: Query with left join (the problematic one)
    console.log('\n4️⃣ Testing query with left join...');
    const { data: joinData, error: joinError } = await supabase
      .from('exercises')
      .select(`
        *,
        exercise_favorites!left(id)
      `)
      .or(`user_id.eq.${user?.id},user_id.is.null`)
      .limit(5);
    
    if (joinError) {
      console.error('❌ Left join query failed:', joinError);
      console.log('   This is likely the source of the error.');
    } else {
      console.log('✅ Left join query succeeded:', joinData?.length, 'exercises found');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testQueries(); 