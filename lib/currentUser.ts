// lib/currentUser.ts
export interface User {
  id: string;
  username: string;
  email: string;
  avatar_text: string;
  avatar_bg: string; // ← MỚI
  verified?: boolean;
  bio?: string;
}

const DEFAULT_USER: User = {
  id: '05b1fe95-71bb-49df-a7ad-dccaf1d016f4',
  username: 'daniel_dev',
  email: 'daniel@threads.com',
  avatar_text: 'D',
  avatar_bg: '#0077B6', // ← MỚI
  verified: true,
};

export function getCurrentUser(): User {
  if (typeof window === 'undefined') {
    return DEFAULT_USER;
  }

  try {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      const user = JSON.parse(stored);
      // ✅ Fallback cho user cũ chưa có avatar_bg
      if (!user.avatar_bg) {
        user.avatar_bg = '#0077B6';
      }
      return user;
    }
  } catch (error) {
    console.error('Error loading user:', error);
  }

  return DEFAULT_USER;
}

export function setCurrentUser(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
    window.location.href = '/auth/login';
  }
}

export const MOCK_USER = getCurrentUser();