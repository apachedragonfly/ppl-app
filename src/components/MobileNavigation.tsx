'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Dumbbell, BarChart3, Target, User, BookOpen, History } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  shortLabel: string
}

// Mobile navigation items (prioritized for bottom nav)
const mobileNavItems: NavItem[] = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Dashboard',
    shortLabel: 'Home'
  },
  {
    href: '/workouts/new',
    icon: Dumbbell,
    label: 'New Workout',
    shortLabel: 'Workout'
  },
  {
    href: '/workouts/history',
    icon: History,
    label: 'History',
    shortLabel: 'History'
  },
  {
    href: '/routines',
    icon: BookOpen,
    label: 'Routines',
    shortLabel: 'Routines'
  },
  {
    href: '/analytics',
    icon: BarChart3,
    label: 'Analytics',
    shortLabel: 'Stats'
  }
]

// Desktop navigation items (complete list)
const desktopNavItems: NavItem[] = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Dashboard',
    shortLabel: 'Home'
  },
  {
    href: '/workouts/new',
    icon: Dumbbell,
    label: 'New Workout',
    shortLabel: 'Workout'
  },
  {
    href: '/workouts/history',
    icon: History,
    label: 'History',
    shortLabel: 'History'
  },
  {
    href: '/routines',
    icon: BookOpen,
    label: 'Routines',
    shortLabel: 'Routines'
  },
  {
    href: '/exercises',
    icon: Target,
    label: 'Exercises',
    shortLabel: 'Library'
  },
  {
    href: '/analytics',
    icon: BarChart3,
    label: 'Analytics',
    shortLabel: 'Stats'
  },
  {
    href: '/dashboard/profile',
    icon: User,
    label: 'Profile',
    shortLabel: 'Profile'
  }
]

export default function MobileNavigation() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50 pb-safe-area-inset-bottom">
        <div className="grid grid-cols-5 h-16">
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  active
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
                <span className="text-xs font-medium">{item.shortLabel}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Floating Profile Button - Mobile Only */}
      <Link
        href="/dashboard/profile"
        className={`fixed top-4 right-4 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center md:hidden z-40 transition-colors ${
          isActive('/dashboard/profile')
            ? 'text-primary bg-primary/10 border-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
      >
        <User className="w-5 h-5" />
      </Link>

      {/* Desktop Navigation - Horizontal Header */}
      <nav className="hidden md:block bg-card/95 backdrop-blur-sm border-b border-border fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-foreground">
                PPL Tracker
              </Link>
              
              <div className="flex items-center space-x-6">
                {desktopNavItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                        active
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>


    </>
  )
} 