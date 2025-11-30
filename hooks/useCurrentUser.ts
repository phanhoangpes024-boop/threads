// hooks/useCurrentUser.ts
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_text: string;
  verified?: boolean;
  bio?: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Chỉ chạy trên client
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      // KHÔNG redirect nếu đang ở trang auth
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
      verified: false 
    }, 
    loading 
  };
}