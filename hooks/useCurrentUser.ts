// hooks/useCurrentUser.ts
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_text: string;
  avatar_bg: string;
  verified?: boolean;
  bio?: string;
}

const GUEST_USER: User = {
  id: '',
  username: 'Guest',
  email: '',
  avatar_text: 'G',
  avatar_bg: '#999999',
  verified: false,
  bio: ''
}

export function useCurrentUser() {
  const [user, setUser] = useState<User>(GUEST_USER);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    // ✅ THÊM /profile/ vào danh sách guest được phép vào
    const isGuestAllowed = pathname === '/' || pathname?.startsWith('/thread/') || pathname?.startsWith('/profile/');
    
    if (stored) {
      const parsedUser = JSON.parse(stored);
      if (!parsedUser.avatar_bg) {
        parsedUser.avatar_bg = '#0077B6';
      }
      setUser(parsedUser);
    } else if (!isGuestAllowed && !pathname?.startsWith('/auth')) {
      window.location.href = '/auth/login';
      return;
    }
    
    setLoading(false);
  }, [pathname]);

  return { 
    user,
    loading,
    isGuest: user.id === ''
  };
}