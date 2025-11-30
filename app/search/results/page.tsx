// app/search/results/page.tsx - UPDATED
'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import CustomScrollbar from '@/components/CustomScrollbar';
import SearchResults from '@/components/SearchResults';
import { useThreads } from '@/hooks/useThreads';
import styles from './SearchResults.module.css';

interface User {
  id: string;
  username: string;
  bio?: string;
  avatar_text: string;
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { data: threads = [], isLoading } = useThreads();

  const searchResults = useMemo(() => {
    if (!query.trim()) return { relevant: [], recent: [] };

    const lowerQuery = query.toLowerCase();
    
    const matchedThreads = threads.filter(thread => {
      const contentMatch = thread.content.toLowerCase().includes(lowerQuery);
      const usernameMatch = thread.username?.toLowerCase().includes(lowerQuery);
      return contentMatch || usernameMatch;
    });

    const relevant = [...matchedThreads].sort((a, b) => {
      const aExact = a.content.toLowerCase().includes(query.toLowerCase());
      const bExact = b.content.toLowerCase().includes(query.toLowerCase());
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return b.likes_count - a.likes_count;
    });

    const recent = [...matchedThreads].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return { relevant, recent };
  }, [threads, query]);

  const profileUsers = useMemo(() => {
    const userMap = new Map<string, User>();
    
    searchResults.relevant.forEach(thread => {
      if (thread.user_id && !userMap.has(thread.user_id)) {
        userMap.set(thread.user_id, {
          id: thread.user_id,
          username: thread.username || 'Unknown',
          avatar_text: thread.avatar_text || 'U',
          bio: '',
        });
      }
    });

    return Array.from(userMap.values());
  }, [searchResults.relevant]);

  return (
    <CustomScrollbar className={styles.container}>
      {isLoading ? (
        <div className={styles.loading}>Đang tìm kiếm...</div>
      ) : (
        <SearchResults
          relevantThreads={searchResults.relevant as any}
          recentThreads={searchResults.recent as any}
          profileUsers={profileUsers}
        />
      )}
    </CustomScrollbar>
  );
}