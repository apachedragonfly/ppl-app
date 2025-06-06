export interface User {
  id: string
  email: string
}

export interface Profile {
  id: string
  user_id: string
  avatar_url?: string
  height_cm?: number
  weight_kg?: number
  age?: number
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  date: string
  type: 'Push' | 'Pull' | 'Legs'
  routine_id?: string
  created_at: string
}

export interface WorkoutLog {
  id: string
  workout_id: string
  exercise: string
  sets: number
  reps: number
  weight_kg: number
}

export interface Routine {
  id: string
  user_id: string
  name: string
  type: 'Push' | 'Pull' | 'Legs'
  created_at: string
}

export interface RoutineExercise {
  id: string
  routine_id: string
  exercise: string
  sets: number
  reps: number
  weight_kg?: number
  order_index: number
} 