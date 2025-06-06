💪 Push/Pull/Legs Tracker: Fullstack Architecture (Next.js + Supabase)
🛠️ Updated Feature Set
Create/edit/delete exercises

Save workout routines (e.g., “Push A”, “Pull B”)

Load templates into daily log

Track per-day progress on heatmap

View progression graphs

Mobile-first, PWA-ready

Minimalist but aesthetic UI (shadcn/ui or 21st.dev)

📁 File & Folder Structure (Updated)
bash
Copy
Edit
/app
  ├─ layout.tsx
  ├─ page.tsx
  ├─ (auth)/
  │   ├─ login/page.tsx
  │   ├─ register/page.tsx
  ├─ dashboard/
  │   ├─ page.tsx
  │   ├─ profile.tsx
  │   └─ workouts.tsx
  ├─ routines/
  │   ├─ page.tsx
  │   ├─ new.tsx
  │   └─ [id]/edit.tsx
  ├─ api/
  │   └─ supabase.ts
/components
  ├─ AvatarUploader.tsx
  ├─ CalendarHeatmap.tsx
  ├─ ChartProgress.tsx
  ├─ WorkoutForm.tsx
  ├─ WorkoutCard.tsx
  ├─ RoutineEditor.tsx
  ├─ RoutineList.tsx
  ├─ ExercisePicker.tsx
  └─ Navigation.tsx
/lib
  ├─ supabase.ts
  ├─ utils.ts
  └─ constants.ts
/types
  └─ index.ts
/styles
  └─ globals.css
/public
  └─ avatar-placeholder.png
.env.local
tailwind.config.ts
next.config.js
🔌 Database Schema (Supabase SQL)
sql
Copy
Edit
-- exercises (global or user-defined)
id UUID PRIMARY KEY
user_id UUID NULL      -- NULL = global/shared
name TEXT
muscle_group TEXT
created_at TIMESTAMP

-- routines
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
name TEXT
type ENUM('Push', 'Pull', 'Legs')
created_at TIMESTAMP

-- routine_exercises (links routines to exercises)
id UUID PRIMARY KEY
routine_id UUID REFERENCES routines(id)
exercise_id UUID REFERENCES exercises(id)
order_index INT
sets INT
reps INT
weight_kg FLOAT NULL   -- Optional template value

-- workouts (daily log)
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
date DATE
type ENUM('Push', 'Pull', 'Legs')
routine_id UUID NULL REFERENCES routines(id)
created_at TIMESTAMP

-- workout_logs (actual entries for the day)
id UUID PRIMARY KEY
workout_id UUID REFERENCES workouts(id)
exercise_id UUID REFERENCES exercises(id)
sets INT
reps INT
weight_kg FLOAT
🧠 State Management & Flow
Feature	State Location	DB Interaction
Auth session	Supabase + context	Supabase Auth
Profile info	Supabase query	profiles table
Daily workouts	Local state → Supabase	workouts, logs
Custom routines	Local state → Supabase	routines, routine_exercises
Available exercises	Query from DB	exercises table
Graph/Heatmap	Derived from logs	workouts + logs

🔄 User Interaction Flow
mermaid
Copy
Edit
graph TD
  A[User logs in] --> B[Dashboard]
  B --> C[Load today's workout]
  C --> D[Load saved routine?]
  D --> E[Populate WorkoutForm with template]
  E --> F[User edits sets/reps/weight]
  F --> G[Save logs to DB]
  B --> H[Open Routines tab]
  H --> I[Create or edit a routine]
  I --> J[Select exercises from picker]
  J --> K[Save to routines table]
✨ Component Breakdown (Updated)
Component	Purpose
WorkoutForm.tsx	Daily log form (uses routine if selected)
ExercisePicker.tsx	Search/select exercises when building a routine
RoutineEditor.tsx	UI to create or edit a routine (select exercises, order, sets/reps)
RoutineList.tsx	Load/delete your saved routines
WorkoutCard.tsx	Shows past workout summaries
ChartProgress.tsx	Plots volume/load over time
CalendarHeatmap.tsx	Heatmap of workout frequency
AvatarUploader.tsx	Upload + store user profile avatar
Navigation.tsx	Mobile-friendly bottom nav bar

🧩 Suggested Screens
Route	Page Name	Description
/dashboard	Dashboard	See calendar, today's log, quick stats
/workouts	Workout Log	Create/view today's workout
/routines	Routine Manager	CRUD routines
/profile	Profile	Edit personal stats and avatar

📱 Mobile UX Enhancements
Bottom sticky nav (Dashboard | Workouts | Routines | Profile)

Large + clean inputs with one-hand control

Drag-and-drop reordering in routine editor

Option to "Copy previous workout" or "Use routine"

🧰 Dev Notes
Use useEffect + Supabase client for pulling in user-specific content

Enable Supabase RLS (Row-Level Security) for user-specific data access

Tailwind + shadcn/ui for clean responsive UI

Make WorkoutForm optionally hydrate from routine_id

Use UUIDs for all Supabase-generated IDs