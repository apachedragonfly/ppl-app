export const exerciseVideoData: Record<string, {
  video: { title: string; url: string; author?: string };
  description: string;
  musclesWorked: {
    primary: string[];
    secondary?: string[];
  };
}> = {
  "Barbell Back Squat (high-bar)": {
    video: {
      title: "Perfect Squat Technique",
      url: "https://www.youtube.com/watch?v=bEv6CCg2BC8",
      author: "Jeff Nippard"
    },
    description: "A powerful compound movement that targets the quadriceps and glutes while building overall lower body strength and core stability.",
    musclesWorked: {
      primary: ["Quadriceps", "Glutes"],
      secondary: ["Hamstrings", "Core", "Lower Back"]
    }
  },
  "Barbell Bench Press": {
    video: {
      title: "How to Bench Press",
      url: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
      author: "AthleanX"
    },
    description: "The king of upper body exercises, building strength and mass in the chest, shoulders, and triceps.",
    musclesWorked: {
      primary: ["Chest", "Triceps"],
      secondary: ["Shoulders", "Core"]
    }
  },
  "Deadlifts": {
    video: {
      title: "How To Deadlift",
      url: "https://www.youtube.com/watch?v=VytMudkTXB4",
      author: "Alan Thrall"
    },
    description: "The ultimate posterior chain exercise that builds total body strength and power from the ground up.",
    musclesWorked: {
      primary: ["Hamstrings", "Glutes", "Lower Back"],
      secondary: ["Traps", "Lats", "Core", "Forearms"]
    }
  },
  "Pull-ups": {
    video: {
      title: "Perfect Pull-Up Form",
      url: "https://www.youtube.com/watch?v=eGo4IYlbE5g",
      author: "Calisthenic Movement"
    },
    description: "A fundamental bodyweight exercise that builds upper body pulling strength and develops a strong, wide back.",
    musclesWorked: {
      primary: ["Lats", "Rhomboids"],
      secondary: ["Biceps", "Middle Traps", "Rear Delts"]
    }
  },
  "Overhead Press": {
    video: {
      title: "How to Overhead Press",
      url: "https://www.youtube.com/watch?v=2yjwXTZQDDI",
      author: "Starting Strength"
    },
    description: "A strict vertical pressing movement that builds shoulder strength and stability while engaging the entire core.",
    musclesWorked: {
      primary: ["Shoulders", "Triceps"],
      secondary: ["Upper Chest", "Core", "Upper Back"]
    }
  }
} 