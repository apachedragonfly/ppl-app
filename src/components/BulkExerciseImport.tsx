'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface BulkExerciseData {
  name: string
  muscle_group: string
  description?: string
  video_url?: string
  video_title?: string
  video_author?: string
}

interface BulkExerciseImportProps {
  onImportComplete: () => void
  onClose: () => void
}

const PREDEFINED_EXERCISES: BulkExerciseData[] = [
  // Push Exercises
  { name: 'Barbell Bench Press', muscle_group: 'Chest', description: 'Primary chest exercise using a barbell' },
  { name: 'Incline Dumbbell Press', muscle_group: 'Chest', description: 'Upper chest focus with dumbbells' },
  { name: 'Dips', muscle_group: 'Chest', description: 'Bodyweight exercise for chest and triceps' },
  { name: 'Push-ups', muscle_group: 'Chest', description: 'Classic bodyweight chest exercise' },
  { name: 'Overhead Press', muscle_group: 'Shoulders', description: 'Standing barbell shoulder press' },
  { name: 'Lateral Raises', muscle_group: 'Shoulders', description: 'Dumbbell side raises for lateral delts' },
  { name: 'Front Raises', muscle_group: 'Shoulders', description: 'Dumbbell front raises for anterior delts' },
  { name: 'Tricep Dips', muscle_group: 'Triceps', description: 'Bodyweight tricep exercise' },
  { name: 'Close-Grip Bench Press', muscle_group: 'Triceps', description: 'Bench press variation for triceps' },
  { name: 'Tricep Pushdowns', muscle_group: 'Triceps', description: 'Cable tricep isolation exercise' },
  
  // Pull Exercises
  { name: 'Pull-ups', muscle_group: 'Back', description: 'Bodyweight back exercise' },
  { name: 'Chin-ups', muscle_group: 'Back', description: 'Underhand grip pull-ups' },
  { name: 'Barbell Rows', muscle_group: 'Back', description: 'Bent-over barbell rowing' },
  { name: 'T-Bar Rows', muscle_group: 'Back', description: 'T-bar rowing exercise' },
  { name: 'Lat Pulldowns', muscle_group: 'Back', description: 'Cable lat pulldown exercise' },
  { name: 'Seated Cable Rows', muscle_group: 'Back', description: 'Seated cable rowing' },
  { name: 'Face Pulls', muscle_group: 'Back', description: 'Cable face pulls for rear delts' },
  { name: 'Barbell Curls', muscle_group: 'Biceps', description: 'Standing barbell bicep curls' },
  { name: 'Dumbbell Curls', muscle_group: 'Biceps', description: 'Alternating dumbbell curls' },
  { name: 'Hammer Curls', muscle_group: 'Biceps', description: 'Neutral grip dumbbell curls' },
  
  // Leg Exercises
  { name: 'Barbell Back Squats', muscle_group: 'Legs', description: 'Primary leg exercise with barbell' },
  { name: 'Front Squats', muscle_group: 'Legs', description: 'Front-loaded squat variation' },
  { name: 'Romanian Deadlifts', muscle_group: 'Legs', description: 'Hip-hinge movement for hamstrings' },
  { name: 'Bulgarian Split Squats', muscle_group: 'Legs', description: 'Single-leg squat variation' },
  { name: 'Leg Press', muscle_group: 'Legs', description: 'Machine-based leg exercise' },
  { name: 'Leg Curls', muscle_group: 'Legs', description: 'Hamstring isolation exercise' },
  { name: 'Leg Extensions', muscle_group: 'Legs', description: 'Quadriceps isolation exercise' },
  { name: 'Calf Raises', muscle_group: 'Legs', description: 'Standing calf raise exercise' },
  { name: 'Lunges', muscle_group: 'Legs', description: 'Forward or reverse lunges' },
  { name: 'Hip Thrusts', muscle_group: 'Legs', description: 'Glute-focused hip extension' },
  
  // Core
  { name: 'Planks', muscle_group: 'Core', description: 'Isometric core strengthening' },
  { name: 'Dead Bug', muscle_group: 'Core', description: 'Core stability exercise' },
  { name: 'Russian Twists', muscle_group: 'Core', description: 'Rotational core exercise' },
  { name: 'Mountain Climbers', muscle_group: 'Core', description: 'Dynamic core and cardio exercise' }
]

export default function BulkExerciseImport({ onImportComplete, onClose }: BulkExerciseImportProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [csvText, setCsvText] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(new Set())
  const [importMode, setImportMode] = useState<'predefined' | 'csv'>('predefined')

  const handleSelectAll = () => {
    if (selectedExercises.size === PREDEFINED_EXERCISES.length) {
      setSelectedExercises(new Set())
    } else {
      setSelectedExercises(new Set(PREDEFINED_EXERCISES.map((_, index) => index)))
    }
  }

  const handleExerciseToggle = (index: number) => {
    const newSelected = new Set(selectedExercises)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedExercises(newSelected)
  }

  const parseCsvText = (text: string): BulkExerciseData[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const exercises: BulkExerciseData[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length < 2) continue

      const exercise: BulkExerciseData = {
        name: '',
        muscle_group: ''
      }

      headers.forEach((header, index) => {
        const value = values[index] || ''
        switch (header) {
          case 'name':
          case 'exercise_name':
          case 'exercise':
            exercise.name = value
            break
          case 'muscle_group':
          case 'muscle':
          case 'category':
            exercise.muscle_group = value
            break
          case 'description':
            exercise.description = value
            break
          case 'video_url':
          case 'video':
          case 'url':
            exercise.video_url = value
            break
          case 'video_title':
          case 'title':
            exercise.video_title = value
            break
          case 'video_author':
          case 'author':
          case 'channel':
            exercise.video_author = value
            break
        }
      })

      if (exercise.name && exercise.muscle_group) {
        exercises.push(exercise)
      }
    }

    return exercises
  }

  const handleImportPredefined = async () => {
    if (selectedExercises.size === 0) {
      setError('Please select at least one exercise to import')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const exercisesToImport = Array.from(selectedExercises).map(index => ({
        ...PREDEFINED_EXERCISES[index],
        user_id: user.id
      }))

      const { error } = await supabase
        .from('exercises')
        .insert(exercisesToImport)

      if (error) throw error

      onImportComplete()
    } catch (error) {
      console.error('Error importing exercises:', error)
      setError('Failed to import exercises')
    } finally {
      setLoading(false)
    }
  }

  const handleImportCsv = async () => {
    if (!csvText.trim()) {
      setError('Please enter CSV data')
      return
    }

    const exercises = parseCsvText(csvText)
    if (exercises.length === 0) {
      setError('No valid exercises found in CSV data')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const exercisesToImport = exercises.map(exercise => ({
        ...exercise,
        user_id: user.id
      }))

      const { error } = await supabase
        .from('exercises')
        .insert(exercisesToImport)

      if (error) throw error

      onImportComplete()
    } catch (error) {
      console.error('Error importing exercises:', error)
      setError('Failed to import exercises from CSV')
    } finally {
      setLoading(false)
    }
  }

  const csvTemplate = 'name,muscle_group,description,video_url,video_title,video_author\nBarbell Bench Press,Chest,Primary chest exercise,https://youtube.com/watch?v=example,Bench Press Tutorial,Fitness Channel\nPull-ups,Back,Bodyweight back exercise,,,\nSquats,Legs,Primary leg exercise,,,'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Bulk Import Exercises</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Import Mode Selection */}
          <div className="mb-6">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setImportMode('predefined')}
                className={'px-4 py-2 rounded-md transition-colors ' + (
                  importMode === 'predefined'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                Predefined Exercises
              </button>
              <button
                onClick={() => setImportMode('csv')}
                className={'px-4 py-2 rounded-md transition-colors ' + (
                  importMode === 'csv'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                CSV Import
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {importMode === 'predefined' ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-foreground">
                  Select Exercises to Import ({selectedExercises.size} of {PREDEFINED_EXERCISES.length} selected)
                </h3>
                <button
                  onClick={handleSelectAll}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  {selectedExercises.size === PREDEFINED_EXERCISES.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {PREDEFINED_EXERCISES.map((exercise, index) => (
                  <div
                    key={index}
                    className={'p-3 border rounded-lg cursor-pointer transition-colors ' + (
                      selectedExercises.has(index)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => handleExerciseToggle(index)}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedExercises.has(index)}
                        onChange={() => handleExerciseToggle(index)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground text-sm">{exercise.name}</h4>
                        <p className="text-xs text-muted-foreground">{exercise.muscle_group}</p>
                        {exercise.description && (
                          <p className="text-xs text-muted-foreground mt-1">{exercise.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleImportPredefined}
                disabled={loading || selectedExercises.size === 0}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-medium py-3 px-4 rounded-md transition-colors"
              >
                {loading ? 'Importing...' : 'Import ' + selectedExercises.size + ' Selected Exercises'}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-foreground mb-2">CSV Import</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Import exercises from CSV data. Required columns: name, muscle_group. Optional: description, video_url, video_title, video_author
                </p>
                
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80">
                    Show CSV Template
                  </summary>
                  <pre className="mt-2 p-3 bg-secondary rounded-md text-xs overflow-x-auto">
                    {csvTemplate}
                  </pre>
                </details>
              </div>

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste your CSV data here..."
                className="w-full h-64 px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring text-sm font-mono"
              />

              <button
                onClick={handleImportCsv}
                disabled={loading || !csvText.trim()}
                className="w-full mt-4 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-medium py-3 px-4 rounded-md transition-colors"
              >
                {loading ? 'Importing...' : 'Import from CSV'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
