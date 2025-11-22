// app/search/results/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchResults from '@/components/SearchResults';
import styles from './SearchResults.module.css';

interface Thread {
  id: string;
  username: string;
  avatar_text: string;
  verified: boolean;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
  user_id: string;
}

interface User {
  id: string;
  username: string;
  bio?: string;
  avatar_text: string;
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=all`);
      const data = await res.json();
      setThreads(data.threads || []);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {loading ? (
        <div className={styles.loading}>Đang tìm kiếm...</div>
      ) : (
        <SearchResults
          relevantThreads={threads}
          recentThreads={[...threads].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )}
          profileUsers={users}
        />
      )}
    </div>
  );
}