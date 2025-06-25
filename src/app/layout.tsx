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
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider>
          <AccountProvider>
            <div className="flex flex-col min-h-screen">
              {/* Mobile Navigation includes desktop header */}
              <MobileNavigation />
              
              {/* Main content area */}
              <main className="flex-1 pb-16 md:pb-0">
                {children}
              </main>
            </div>
          </AccountProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
