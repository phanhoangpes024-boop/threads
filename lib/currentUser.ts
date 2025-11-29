// lib/currentUser.ts
export interface User {
  id: string;
  username: string;
  email: string;
  avatar_text: string;
  verified?: boolean;
  bio?: string;
}

const DEFAULT_USER: User = {
  id: '05b1fe95-71bb-49df-a7ad-dccaf1d016f4',
  username: 'daniel_dev',
  email: 'daniel@threads.com',
  avatar_text: 'D',
  verified: true,
};

export function getCurrentUser(): User {
  if (typeof window === 'undefined') {
    return DEFAULT_USER;
  }

  try {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      return JSON.parse(stored);
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