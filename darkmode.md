🌒 Dark Mode with Toggle – Step-by-Step (Next.js + Tailwind + shadcn/ui)

✅ 1. Install dependencies for theme management
Start: No theme handling
End: Packages installed

npm install next-themes
✅ 2. Add ThemeProvider to your layout
Start: Layout uses raw <html> and <body>
End: Layout wrapped in ThemeProvider

// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"; // You will create this
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
✅ 3. Create the ThemeProvider wrapper component
Start: Doesn’t exist
End: Lives at /components/theme-provider.tsx

// components/theme-provider.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
✅ 4. Enable Tailwind dark mode via class
Start: No dark support
End: Tailwind is set to use class for dark

// tailwind.config.ts
module.exports = {
  darkMode: "class",
  ...
};
✅ 5. Add dark variants in globals.css (optional)
/* styles/globals.css */

body {
  @apply bg-white text-black;
}

.dark body {
  @apply bg-black text-white;
}
✅ 6. Create a toggle button using shadcn/ui
Start: No switch
End: A toggle button switches theme

// components/ThemeToggle.tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">🌞</span>
      <Switch
        checked={theme === "dark"}
        onCheckedChange={(val) => setTheme(val ? "dark" : "light")}
      />
      <span className="text-sm">🌜</span>
    </div>
  );
}
✅ 7. Add toggle to the header or nav bar
// components/Header.tsx (or similar)
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Header() {
  return (
    <header className="flex justify-between px-4 py-2 border-b">
      <span className="text-xl font-bold">PPLForge</span>
      <ThemeToggle />
    </header>
  );
}

| Test                           | Expected Result         |
| ------------------------------ | ----------------------- |
| Load app on light system theme | App uses light theme    |
| Load app on dark system theme  | App uses dark theme     |
| Toggle switch                  | Instantly switches mode |
| Refresh page after switch      | Remembers preference    |
