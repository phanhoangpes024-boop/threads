// contexts/ThreadsContext.tsx - OPTIMIZED
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MOCK_USER } from '@/lib/currentUser';

interface Thread {
  id: string;
  username: string | null;
  avatar_text: string | null;
  verified: boolean;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
  user_id: string;
  _optimistic?: boolean;
}

interface ThreadsContextType {
  threads: Thread[];
  loading: boolean;
  createThread: (content: string, imageUrl?: string) => Promise<boolean>;
  toggleLike: (threadId: string) => Promise<void>;
  refreshThreads: () => Promise<void>;
  checkIfLiked: (threadId: string) => Promise<boolean>;
}

const ThreadsContext = createContext<ThreadsContextType | undefined>(undefined);

export function ThreadsProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedThreads, setLikedThreads] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const fetchThreads = async () => {
    try {
      const res = await fetch('/api/threads');
      const data = await res.json();
      setThreads(data.threads || data || []); // Support both formats
    } catch (error) {
      console.error('Error fetching threads:', error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const createThread = async (content: string, imageUrl?: string): Promise<boolean> => {
    if (!content.trim() || isCreating) return false;
    
    setIsCreating(true);
    
    const optimisticId = 'optimistic-' + crypto.randomUUID();
    const optimisticThread: Thread = {
      id: optimisticId,
      user_id: MOCK_USER.id,
      username: MOCK_USER.username,
      avatar_text: MOCK_USER.avatar_text,
      verified: false,
      content: content.trim(),
      image_url: imageUrl,
      likes_count: 0,
      comments_count: 0,
      reposts_count: 0,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    
    // 1️⃣ Optimistic update
    setThreads(prev => [optimisticThread, ...prev]);
    
    try {
      // 2️⃣ Send to API
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: MOCK_USER.id,
          content: content.trim(),
          image_url: imageUrl,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create thread');
      }
      
      const newThread = await res.json();
      
      // 3️⃣ Replace optimistic với real data
      setThreads(prev => 
        prev.map(t => t.id === optimisticId ? {
          ...newThread,
          username: MOCK_USER.username,
          avatar_text: MOCK_USER.avatar_text,
          verified: false,
        } : t)
      );
      
      return true;
    } catch (error) {
      console.error('Error creating thread:', error);
      
      // 4️⃣ Revert on failure
      setThreads(prev => prev.filter(t => t.id !== optimisticId));
      
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const toggleLike = async (threadId: string) => {
    const isCurrentlyLiked = likedThreads.has(threadId);
    
    // Optimistic update
    setLikedThreads(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
    
    setThreads(prevThreads =>
      prevThreads.map(thread =>
        thread.id === threadId
          ? {
              ...thread,
              likes_count: isCurrentlyLiked 
                ? Math.max(0, thread.likes_count - 1)
                : thread.likes_count + 1
            }
          : thread
      )
    );

    try {
      const res = await fetch(`/api/threads/${threadId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: MOCK_USER.id }),
      });
      
      if (!res.ok) {
        // Revert on error
        setLikedThreads(prev => {
          const newSet = new Set(prev);
          if (isCurrentlyLiked) {
            newSet.add(threadId);
          } else {
            newSet.delete(threadId);
          }
          return newSet;
        });
        
        setThreads(prevThreads =>
          prevThreads.map(thread =>
            thread.id === threadId
              ? {
                  ...thread,
                  likes_count: isCurrentlyLiked 
                    ? thread.likes_count + 1
                    : Math.max(0, thread.likes_count - 1)
                }
              : thread
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const checkIfLiked = async (threadId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/threads/${threadId}/like?user_id=${MOCK_USER.id}`);
      const data = await res.json();
      
      if (data.isLiked) {
        setLikedThreads(prev => new Set(prev).add(threadId));
      }
      
      return data.isLiked;
    } catch (error) {
      console.error('Error checking like:', error);
      return false;
    }
  };

  return (
    <ThreadsContext.Provider
      value={{
        threads,
        loading,
        createThread,
        toggleLike,
        refreshThreads: fetchThreads,
        checkIfLiked,
      }}
    >
      {children}
    </ThreadsContext.Provider>
  );
}

export function useThreads() {
  const context = useContext(ThreadsContext);
  if (!context) {
    throw new Error('useThreads must be used within ThreadsProvider');
  }
  return context;
}