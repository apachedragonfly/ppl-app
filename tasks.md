🧱 MVP Build Plan — Push/Pull/Legs Tracker
Format: Each task is one concern, clear entry/exit criteria.

✅ PHASE 1: Project Scaffolding
1. Initialize Next.js app with TypeScript and Tailwind
Start: No codebase exists

End: npm run dev loads a Tailwind-styled homepage

2. Install Supabase client & initialize project
Start: Tailwind/Next working

End: Supabase client available from /lib/supabase.ts

3. Set up file structure with folders: /app, /components, /lib, /types
Start: Only default Next files

End: Project structure matches architecture layout

4. Create and test Supabase connection
Start: Supabase client added

End: Console logs authenticated user or null on homepage

🔐 PHASE 2: Authentication + Profile
5. Add login and register pages using Supabase Auth (email + password)
Start: Blank auth pages

End: Working login/register with redirection on success

6. Create a profile table in Supabase
sql
Copy
Edit
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  avatar_url TEXT,
  height_cm INT,
  weight_kg INT,
  age INT,
  created_at TIMESTAMP DEFAULT NOW()
);
End: Table exists and RLS is enforced for user_id = auth.uid()

7. Build profile page (edit height, weight, age, upload avatar)
Start: Auth working

End: Profile info persists to Supabase and is loaded on visit

🏋️ PHASE 3: Workout Logging (Core MVP)
8. Create workouts and workout_logs tables
sql
Copy
Edit
-- workouts
CREATE TABLE workouts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  date DATE,
  type TEXT CHECK (type IN ('Push', 'Pull', 'Legs')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- workout_logs
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id),
  exercise TEXT,
  sets INT,
  reps INT,
  weight_kg FLOAT
);
9. Build a form to create a workout (WorkoutForm.tsx)
Inputs: Date, Type, Exercises (manually entered for now)

Save to: workouts + workout_logs

10. Display previous workouts (WorkoutCard)
Start: Workouts exist

End: WorkoutCard shows date, type, and summary of sets

11. Add validation and error handling to workout logging
Start: Basic form works

End: Can't submit without sets/reps/weight; shows errors

📅 PHASE 4: Visual Tracking
12. Integrate CalendarHeatmap for daily activity
Use react-calendar-heatmap

Show color-coded squares for each day with workouts

13. Build ChartProgress component
Pull from workout_logs

Display volume progression per lift or per muscle group

🧩 PHASE 5: Routines (Templates)
14. Create routines and routine_exercises tables
sql
Copy
Edit
CREATE TABLE routines (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT,
  type TEXT CHECK (type IN ('Push', 'Pull', 'Legs')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE routine_exercises (
  id UUID PRIMARY KEY,
  routine_id UUID REFERENCES routines,
  exercise TEXT,
  sets INT,
  reps INT,
  weight_kg FLOAT,
  order_index INT
);
15. Build RoutineEditor component
CRUD interface for routines

Use drag-to-reorder

Save to Supabase on submit

16. Add RoutineList page
Lists saved routines

Can delete, edit, or "Load into workout"

17. Allow loading a routine into WorkoutForm
Button on RoutineCard

Prefill WorkoutForm with routine data

📦 PHASE 6: Extras & Polish
18. Build mobile nav bar (Navigation.tsx)
Fixed bottom bar with 4 tabs: Dashboard, Workouts, Routines, Profile

19. Style with shadcn/ui components
Apply consistent UI across forms, modals, buttons

20. Deploy to Vercel
Supabase keys secured in .env

Mobile-first testing on real device

🧪 Testing Between Tasks

At the end of each step, you should be able to:

| Phase | Feature              | Test Result                  |
| ----- | -------------------- | ---------------------------- |
| 1     | Homepage loads       | ✅ Local dev runs             |
| 2     | Connects to Supabase | ✅ User logs show in console  |
| 3     | Auth flow            | ✅ Login/register works       |
| 4     | Profile page         | ✅ Info saves and loads       |
| 5     | Log workout          | ✅ Workout shows in dashboard |
| 6     | Heatmap/chart        | ✅ Activity visualized        |
| 7     | Routines             | ✅ Templates load into log    |
| 8     | Deployed             | ✅ Live, mobile-friendly app  |
