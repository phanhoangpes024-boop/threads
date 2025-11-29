// hooks/useCurrentUser.ts
import { useState, useEffect } from 'react';

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

  useEffect(() => {
    // Chỉ chạy trên client
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      // Redirect về login nếu không có user
      window.location.href = '/auth/login';
    }
    setLoading(false);
  }, []);

  // Trả về dummy user khi loading để tránh null check
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