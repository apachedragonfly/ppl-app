import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AccountProvider } from "@/contexts/AccountContext";
import { ThemeProvider } from "@/components/theme-provider";
import MobileNavigation from "@/components/MobileNavigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PPL Tracker",
  description: "Track your Push, Pull, and Legs workouts with advanced analytics",
  manifest: "/manifest.json",
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PPL Tracker",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "PPL Tracker",
    description: "Track your Push, Pull, and Legs workouts with advanced analytics",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AccountProvider>
            <div className="relative min-h-screen bg-background">
              <MobileNavigation />
              <main className="pb-mobile-nav md:pb-0 pt-0 md:pt-16">
                {children}
              </main>
            </div>
          </AccountProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
