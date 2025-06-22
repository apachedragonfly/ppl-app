export interface User {
  id: string
  email: string
}

export interface Profile {
  id: string
  user_id: string
  name?: string
  avatar_url?: string
  height_cm?: number
  weight_kg?: number
  age?: number
  created_at: string
}

export interface Exercise {
  id: string
  user_id?: string // NULL for global exercises
  name: string
  muscle_group: string
  created_at: string
  video?: {
    title: string;
    url: string;
    author?: string;
  };
  description?: string;
  musclesWorked?: {
    primary: string[];
    secondary?: string[];
  };
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
  exercise_id: string
  sets: number
  reps: number
  weight_kg: number
  exercise?: Exercise
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
  exercise_id: string
  order_index: number
  sets: number
  reps: number
  weight_kg?: number
  exercise?: Exercise
}

export type WorkoutType = 'Push' | 'Pull' | 'Legs' 