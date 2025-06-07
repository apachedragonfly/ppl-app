import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  IoPencilOutline, 
  IoBookOutline, 
  IoTimeOutline, 
  IoPersonOutline, 
  IoLogOutOutline 
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
    { 
      title: 'Routines', 
      icon: <IoBookOutline />, 
      gradientFrom: '#3b82f6', 
      gradientTo: '#1d4ed8',
      action: () => router.push('/routines')
    },
    { 
      title: 'History', 
      icon: <IoTimeOutline />, 
      gradientFrom: '#f59e0b', 
      gradientTo: '#d97706',
      action: () => router.push('/workouts/history')
    },
    { 
      title: 'Profile', 
      icon: <IoPersonOutline />, 
      gradientFrom: '#10b981', 
      gradientTo: '#059669',
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
      <ul className="flex gap-6">
        {menuItems.map(({ title, icon, gradientFrom, gradientTo, action }, idx) => (
          <li
            key={idx}
            onClick={action}
            style={{ '--gradient-from': gradientFrom, '--gradient-to': gradientTo } as React.CSSProperties}
            className="relative w-[60px] h-[60px] bg-card border border-border shadow-lg rounded-full flex items-center justify-center transition-all duration-500 hover:w-[180px] hover:shadow-none group cursor-pointer"
          >
            {/* Gradient background on hover */}
            <span className="absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] opacity-0 transition-all duration-500 group-hover:opacity-100"></span>
            {/* Blur glow */}
            <span className="absolute top-[10px] inset-x-0 h-full rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] blur-[15px] opacity-0 -z-10 transition-all duration-500 group-hover:opacity-60"></span>

            {/* Icon */}
            <span className="relative z-10 transition-all duration-500 group-hover:scale-0 delay-0">
              <span className="text-2xl text-muted-foreground group-hover:text-white">{icon}</span>
            </span>

            {/* Title */}
            <span className="absolute text-white font-medium uppercase tracking-wide text-sm transition-all duration-500 scale-0 group-hover:scale-100 delay-150">
              {title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
} 