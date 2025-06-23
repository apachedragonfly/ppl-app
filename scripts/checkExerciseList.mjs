import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Target exercise list organized by muscle group
const targetExercises = {
  'PUSH': [
    'Barbell Bench Press',
    'Cable Lateral Raise',
    'Chest Fly (Cable / Pec-Deck)',
    'Dumbbell Bench Press (flat or incline)',
    'Lateral Dumbbell Raise',
    'Overhead Cable Triceps Extension',
    'Overhead Shoulder Press (machine or seated dumbbell)',
    'Triceps Pushdown (straight-bar cable)'
  ],
  'PULL': [
    '45° EZ-Bar Preacher Curl',
    'Bent-Over Barbell Row',
    'Cable Rear-Delt Fly (cross-over)',
    'Chest-Supported Row (T-bar, seal row, machine, etc.)',
    'Face Pull (rope cable)',
    'Hammer Curl',
    'Lat Pulldown (or strict Weighted Pull-Up)',
    'One-Arm Dumbbell Row',
    'Reverse Pec-Deck Fly'
  ],
  'LEGS': [
    'Barbell Back Squat (high-bar)',
    'Barbell Front Squat',
    'Barbell Hip Thrust (or machine hip thrust)',
    'Bulgarian Split Squat (rear-foot elevated)',
    'Hack Squat (45° sled or pendulum)',
    'Leg Extension (machine)',
    'Leg Press (45° sled)',
    'Romanian Deadlift'
  ]
}

// Function to normalize exercise names for comparison
function normalizeExerciseName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special chars and spaces
    .replace(/s$/, '') // Remove trailing 's'
}

// Function to find potential matches
function findPotentialMatches(targetName, dbExercises) {
  const normalizedTarget = normalizeExerciseName(targetName)
  
  return dbExercises.filter(ex => {
    const normalizedDb = normalizeExerciseName(ex.name)
    
    // Exact match after normalization
    if (normalizedDb === normalizedTarget) return true
    
    // Check if one contains the other (for variations)
    if (normalizedDb.includes(normalizedTarget) || normalizedTarget.includes(normalizedDb)) {
      return true
    }
    
    // Special cases for common variations
    const variations = {
      'barbellbenchpres': ['benchpres', 'barbellbench'],
      'dumbbellbenchpres': ['dumbbellbench', 'inclinedumbbellpres'],
      'lateraldumbbellraise': ['lateralraise', 'shoulderraise'],
      'tricepspushdown': ['triceppushdown', 'cabletriceprxtension'],
      'overheadshoulderpresmachine': ['shoulderpres', 'overheadpres'],
      'hammercurl': ['hammer'],
      'latpulldown': ['pulldown', 'latpull'],
      'bulgariansplitsquat': ['bulgariansplit', 'splitsquat'],
      'legextensionmachine': ['legextension'],
      'legpres': ['legpres'],
      'romaniandeadlift': ['rdl', 'romaniandeadlift'],
      'facepullropecable': ['facepull'],
      'bentoverbarbelrow': ['bentrow', 'barbellrow']
    }
    
    for (const [key, alts] of Object.entries(variations)) {
      if (normalizedTarget.includes(key) || key.includes(normalizedTarget)) {
        return alts.some(alt => normalizedDb.includes(alt) || alt.includes(normalizedDb))
      }
    }
    
    return false
  })
}

async function checkExerciseList() {
  console.log('🔍 Comparing database exercises with target list...\n')
  
  // Get all exercises from database
  const { data: dbExercises, error } = await supabase
    .from('exercises')
    .select('id, name, muscle_group, user_id')
    .order('name')
    
  if (error) {
    console.error('Error fetching exercises:', error)
    return
  }
  
  console.log(`Found ${dbExercises.length} exercises in database\n`)
  
  const matches = []
  const missing = []
  const potentialDuplicates = []
  
  // Check each target exercise
  for (const [category, exercises] of Object.entries(targetExercises)) {
    console.log(`\n📋 ${category} EXERCISES:`)
    
    for (const targetExercise of exercises) {
      const potentialMatches = findPotentialMatches(targetExercise, dbExercises)
      
      if (potentialMatches.length === 0) {
        console.log(`  ❌ MISSING: "${targetExercise}"`)
        missing.push({ category, name: targetExercise })
      } else if (potentialMatches.length === 1) {
        console.log(`  ✅ FOUND: "${targetExercise}" → "${potentialMatches[0].name}"`)
        matches.push({ 
          target: targetExercise, 
          db: potentialMatches[0], 
          category 
        })
      } else {
        console.log(`  🔍 MULTIPLE MATCHES for "${targetExercise}":`)
        potentialMatches.forEach(match => {
          console.log(`    - "${match.name}" (ID: ${match.id}, Muscle: ${match.muscle_group})`)
        })
        potentialDuplicates.push({
          target: targetExercise,
          matches: potentialMatches,
          category
        })
      }
    }
  }
  
  // Summary
  console.log('\n\n📊 SUMMARY:')
  console.log(`✅ Found matches: ${matches.length}`)
  console.log(`❌ Missing exercises: ${missing.length}`)
  console.log(`🔍 Potential duplicates: ${potentialDuplicates.length}`)
  
  if (potentialDuplicates.length > 0) {
    console.log('\n🚨 POTENTIAL DUPLICATES TO REVIEW:')
    potentialDuplicates.forEach(dup => {
      console.log(`\n"${dup.target}" has ${dup.matches.length} potential matches:`)
      dup.matches.forEach(match => {
        console.log(`  - "${match.name}" (${match.muscle_group})`)
      })
    })
  }
  
  if (missing.length > 0) {
    console.log('\n📝 MISSING EXERCISES:')
    missing.forEach(miss => {
      console.log(`  - [${miss.category}] ${miss.name}`)
    })
  }
}

checkExerciseList().catch(console.error) 