import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { exerciseMetadata } from '../src/data/exerciseMetadata.js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Exercise interface (for documentation):
// {
//   id: string;
//   name: string;
//   video?: object;
//   description?: string;
//   muscles_worked?: any;
// }

async function batchUpdateExerciseMetadata(force = false) {
  console.log('🚀 Starting batch update of exercise metadata...');
  console.log(`📊 Processing ${Object.keys(exerciseMetadata).length} exercises`);
  console.log(`🔄 Force update mode: ${force ? 'ON' : 'OFF'}`);
  console.log('');

  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const [name, metadata] of Object.entries(exerciseMetadata)) {
    try {
      // First, check if the exercise exists in the database
      const { data: existing, error: fetchError } = await supabase
        .from('exercises')
        .select('id, name, video, description, muscles_worked')
        .eq('name', name)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No rows found
          console.log(`⚠️  Skipped "${name}" - not found in database`);
          notFoundCount++;
          continue;
        } else {
          throw fetchError;
        }
      }

      // Check if update is needed (idempotency check)
      const needsUpdate = force || 
        !existing.video || 
        !existing.description || 
        !existing.muscles_worked;

      if (!needsUpdate) {
        console.log(`⏭️  Skipped "${name}" - already has complete metadata`);
        skippedCount++;
        continue;
      }

      // Perform the update
      const { error: updateError } = await supabase
        .from('exercises')
        .update({
          video: {
            title: metadata.video.title,
            url: metadata.video.url,
            author: metadata.video.author || null
          },
          description: metadata.description,
          muscles_worked: metadata.musclesWorked
        })
        .eq('id', existing.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ Updated "${name}"`);
      updatedCount++;

    } catch (error) {
      console.error(`❌ Failed to update "${name}":`, error);
      errorCount++;
    }
  }

  console.log('');
  console.log('📈 Batch update summary:');
  console.log(`✅ Updated: ${updatedCount}`);
  console.log(`⏭️  Skipped (already complete): ${skippedCount}`);
  console.log(`⚠️  Not found in database: ${notFoundCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('');

  if (notFoundCount > 0) {
    console.log('💡 Tip: Add missing exercises to your database first, then re-run this script');
  }

  if (errorCount > 0) {
    console.log('🔍 Check the error messages above for details on failed updates');
    process.exit(1);
  }

  console.log('🎉 Batch update completed successfully!');
}

// Parse command line arguments
const args = process.argv.slice(2);
const forceMode = args.includes('--force');

// Run the batch update
batchUpdateExerciseMetadata(forceMode)
  .catch((error) => {
    console.error('💥 Batch update failed:', error);
    process.exit(1);
  }); 