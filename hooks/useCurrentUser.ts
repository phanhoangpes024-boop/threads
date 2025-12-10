// hooks/useCurrentUser.ts
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_text: string;
  avatar_bg: string; // ← MỚI
  verified?: boolean;
  bio?: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      const parsedUser = JSON.parse(stored);
      // ✅ Fallback cho user cũ
      if (!parsedUser.avatar_bg) {
        parsedUser.avatar_bg = '#0077B6';
      }
      setUser(parsedUser);
    } else {
      if (!pathname?.startsWith('/auth')) {
        window.location.href = '/auth/login';
        return;
      }
    }
    setLoading(false);
  }, [pathname]);

  return { 
    user: user || { 
      id: '', 
      username: '', 
      email: '', 
      avatar_text: 'U',
      avatar_bg: '#0077B6', // ← MỚI
      verified: false 
    }, 
    loading 
  };
}