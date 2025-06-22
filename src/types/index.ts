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
  is_favorite?: boolean
  notes?: string
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

export interface PersonalRecord {
  id: string
  user_id: string
  exercise_id: string
  record_type: '1rm' | '3rm' | '5rm' | 'max_volume' | 'max_reps' | 'endurance'
  weight_kg?: number
  reps?: number
  sets?: number
  total_volume?: number
  duration_seconds?: number
  notes?: string
  achieved_date: string
  workout_id?: string
  created_at: string
  updated_at: string
}

export interface WorkoutTemplate {
  id: string
  user_id: string
  name: string
  description?: string
  workout_type: 'Push' | 'Pull' | 'Legs' | 'Upper' | 'Lower' | 'Full Body' | 'Cardio' | 'Custom'
  is_public: boolean
  estimated_duration_minutes?: number
  difficulty_level?: 'Beginner' | 'Intermediate' | 'Advanced'
  tags?: string[]
  created_at: string
  updated_at: string
  last_used_at?: string
}

export interface WorkoutTemplateExercise {
  id: string
  template_id: string
  exercise_id: string
  exercise?: Exercise
  order_index: number
  target_sets: number
  target_reps_min?: number
  target_reps_max?: number
  target_weight_kg?: number
  rest_seconds: number
  notes?: string
  is_superset: boolean
  superset_group?: number
  created_at: string
}

export interface QuickStartRoutine {
  id: string
  name: string
  description?: string
  workout_type: string
  difficulty_level: string
  estimated_duration_minutes: number
  target_audience?: string
  equipment_needed?: string[]
  is_featured: boolean
  created_by: string
  created_at: string
}

export interface QuickStartRoutineExercise {
  id: string
  routine_id: string
  exercise_name: string
  muscle_group: string
  order_index: number
  target_sets: number
  target_reps_min?: number
  target_reps_max?: number
  target_weight_percentage?: number
  rest_seconds: number
  notes?: string
  is_superset: boolean
  superset_group?: number
}

export interface UserFollow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface WorkoutShare {
  id: string
  workout_id: string
  user_id: string
  caption?: string
  is_public: boolean
  share_type: 'workout' | 'achievement' | 'progress'
  created_at: string
  workout?: Workout
  user?: { name?: string; avatar_url?: string }
  likes_count?: number
  comments_count?: number
  is_liked?: boolean
}

export interface WorkoutLike {
  id: string
  share_id: string
  user_id: string
  created_at: string
}

export interface WorkoutComment {
  id: string
  share_id: string
  user_id: string
  comment_text: string
  parent_comment_id?: string
  created_at: string
  user?: { name?: string; avatar_url?: string }
  replies?: WorkoutComment[]
}

export interface Challenge {
  id: string
  created_by: string
  title: string
  description?: string
  challenge_type: 'volume' | 'frequency' | 'streak' | 'exercise_specific' | 'custom'
  target_value: number
  target_unit: string
  start_date: string
  end_date: string
  is_public: boolean
  max_participants?: number
  prize_description?: string
  rules?: string
  created_at: string
  updated_at: string
  creator?: { name?: string; avatar_url?: string }
  participants_count?: number
  is_participating?: boolean
  current_progress?: number
}

export interface ChallengeParticipant {
  id: string
  challenge_id: string
  user_id: string
  joined_at: string
  current_progress: number
  is_completed: boolean
  completed_at?: string
  rank?: number
  user?: { name?: string; avatar_url?: string }
}

export interface Leaderboard {
  id: string
  name: string
  description?: string
  metric_type: 'total_volume' | 'workout_frequency' | 'streak' | 'exercise_max' | 'custom'
  time_period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time'
  exercise_filter?: string
  is_active: boolean
  created_at: string
}

export interface LeaderboardEntry {
  id: string
  leaderboard_id: string
  user_id: string
  score: number
  rank: number
  period_start: string
  period_end: string
  created_at: string
  updated_at: string
  user?: { name?: string; avatar_url?: string }
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_type: string
  achievement_name: string
  description?: string
  icon?: string
  achieved_date: string
  workout_id?: string
  challenge_id?: string
  metadata?: any
}

export interface SocialFeed {
  id: string
  user_id: string
  activity_type: 'workout_share' | 'achievement' | 'challenge_join' | 'challenge_complete' | 'follow' | 'like' | 'comment'
  reference_id?: string
  content?: string
  is_public: boolean
  created_at: string
  user?: { name?: string; avatar_url?: string }
  reference_data?: any
}

export interface UserSettings {
  id: string
  user_id: string
  profile_visibility: 'public' | 'friends' | 'private'
  workout_sharing: 'public' | 'friends' | 'private'
  allow_follow_requests: boolean
  email_notifications: boolean
  push_notifications: boolean
  challenge_invites: boolean
  achievement_sharing: boolean
  created_at: string
  updated_at: string
}

export type WorkoutType = 'Push' | 'Pull' | 'Legs' 