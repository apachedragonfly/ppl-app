export const WORKOUT_TYPES = ['Push', 'Pull', 'Legs'] as const
export type WorkoutType = typeof WORKOUT_TYPES[number]

export const MUSCLE_GROUPS = [
  'Chest',
  'Back', 
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Core'
] as const

export const DEFAULT_EXERCISES = {
  Push: ['Bench Press', 'Overhead Press', 'Dips', 'Push-ups'],
  Pull: ['Pull-ups', 'Rows', 'Lat Pulldown', 'Face Pulls'], 
  Legs: ['Squats', 'Deadlifts', 'Lunges', 'Calf Raises']
} as const 