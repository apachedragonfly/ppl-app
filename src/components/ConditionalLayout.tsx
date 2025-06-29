'use client'

import { usePathname } from 'next/navigation'
import MobileNavigation from '@/components/MobileNavigation'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Hide navigation on authentication pages and home page
  const hideNavigation = pathname === '/login' || 
                         pathname === '/register' || 
                         pathname === '/'
  
  return (
    <>
      {!hideNavigation && <MobileNavigation />}
      <main className={hideNavigation ? '' : 'pb-mobile-nav md:pb-0 pt-0 md:pt-16'}>
        {children}
      </main>
    </>
  )
} 