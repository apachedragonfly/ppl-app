import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  IoPencilOutline, 
  IoBookOutline, 
  IoFitnessOutline,
  IoTimeOutline, 
  IoPersonOutline, 
  IoLogOutOutline,
  IoDocumentTextOutline,
  IoStatsChartOutline
  // IoPeopleOutline - Hidden for now (social features)
} from 'react-icons/io5';

interface MenuItemType {
  title: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  action: () => void;
}

export default function GradientMenu() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems: MenuItemType[] = [
    { 
      title: 'Log Workout', 
      icon: <IoPencilOutline />, 
      gradientFrom: '#8b5cf6', 
      gradientTo: '#a855f7',
      action: () => router.push('/workouts/new')
    },
    // Templates - Hidden for now (uncomment when ready to enable)
    // { 
    //   title: 'Templates', 
    //   icon: <IoDocumentTextOutline />, 
    //   gradientFrom: '#3b82f6', 
    //   gradientTo: '#1d4ed8',
    //   action: () => router.push('/templates')
    // },
    { 
      title: 'Routines', 
      icon: <IoBookOutline />, 
      gradientFrom: '#10b981', 
      gradientTo: '#059669',
      action: () => router.push('/routines')
    },
    { 
      title: 'Exercises', 
      icon: <IoFitnessOutline />, 
      gradientFrom: '#06b6d4', 
      gradientTo: '#0891b2',
      action: () => router.push('/exercises')
    },
    { 
      title: 'History', 
      icon: <IoTimeOutline />, 
      gradientFrom: '#f59e0b', 
      gradientTo: '#d97706',
      action: () => router.push('/workouts/history')
    },
    { 
      title: 'Analytics', 
      icon: <IoStatsChartOutline />, 
      gradientFrom: '#ec4899', 
      gradientTo: '#be185d',
      action: () => router.push('/analytics')
    },
    // Social features - Hidden for now (personal use app)
    // { 
    //   title: 'Social', 
    //   icon: <IoPeopleOutline />, 
    //   gradientFrom: '#f97316', 
    //   gradientTo: '#ea580c',
    //   action: () => router.push('/social')
    // },
    { 
      title: 'Profile', 
      icon: <IoPersonOutline />, 
      gradientFrom: '#8b5cf6', 
      gradientTo: '#a855f7',
      action: () => router.push('/dashboard/profile')
    },
    { 
      title: 'Sign Out', 
      icon: <IoLogOutOutline />, 
      gradientFrom: '#ef4444', 
      gradientTo: '#dc2626',
      action: handleLogout
    }
  ];

  return (
    <div className="flex justify-center items-center">
      <ul className="flex gap-1.5 sm:gap-2 flex-wrap justify-center max-w-sm">
        {menuItems.map(({ title, icon, gradientFrom, gradientTo, action }, idx) => (
          <li
            key={idx}
            onClick={action}
            style={{ '--gradient-from': gradientFrom, '--gradient-to': gradientTo } as React.CSSProperties}
            className="relative w-10 h-10 sm:w-11 sm:h-11 bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] group cursor-pointer touch-manipulation"
            title={title}
          >
            {/* Subtle glow on hover */}
            <span className="absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-20 -z-10"></span>

            {/* Icon */}
            <span className="relative z-10 transition-all duration-300 group-hover:scale-110">
              <span className="text-base sm:text-lg text-muted-foreground group-hover:text-white transition-colors duration-300">{icon}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
} 