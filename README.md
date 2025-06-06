# 💪 PPL Tracker - Push/Pull/Legs Workout Tracker

A modern, mobile-first workout tracking app built with Next.js and Supabase.

## ⚡ Quick Setup

### 1. Clone and Install
```bash
git clone <repo-url>
cd ppl-app
npm install
```

### 2. Environment Setup
Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `database-setup.sql`
4. Run the script

This will create:
- All required tables (profiles, exercises, workouts, etc.)
- Row Level Security policies
- Default exercises

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── (auth)/         # Auth pages (login/register)
│   ├── dashboard/      # Main app pages
│   └── layout.tsx      # Root layout
├── components/         # Reusable components
│   ├── ui/            # shadcn/ui components
│   ├── WorkoutForm.tsx
│   ├── CalendarHeatmap.tsx
│   └── ChartProgress.tsx
├── lib/               # Utilities
│   └── supabase.ts    # Supabase client
└── types/             # TypeScript types
    └── index.ts
```

## 🚀 Features

- **User Authentication** - Email/password login with Supabase Auth
- **Profile Management** - Track height, weight, age
- **Workout Logging** - Log Push/Pull/Legs workouts with exercises
- **Visual Progress** - Calendar heatmap and progress charts
- **Responsive Design** - Mobile-first, works on all devices

## 🔧 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Charts**: Recharts, React Calendar Heatmap
- **UI Components**: shadcn/ui

## 📱 Mobile PWA Ready

This app is designed mobile-first and can be installed as a PWA on mobile devices.

## 🤝 Contributing

This project follows a task-based development approach. See `tasks.md` for the build plan and current progress.

## 📄 License

MIT License
