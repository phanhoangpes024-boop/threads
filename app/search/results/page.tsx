// app/search/results/page.tsx
'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import CustomScrollbar from '@/components/CustomScrollbar';
import SearchResults from '@/components/SearchResults';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import styles from './SearchResults.module.css';

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { user } = useCurrentUser();

  const { data, isLoading } = useQuery({
    queryKey: ['search-v2', query, user.id],
    queryFn: async () => {
      // ✅ Đổi từ 2 → 1
      if (!query.trim() || query.trim().length < 1) {
        return { threads: [], users: [] };
      }
      
      const res = await fetch(
        `/api/search/v2?q=${encodeURIComponent(query)}&user_id=${user.id}`
      );
      
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: query.trim().length >= 1,  // ✅ Đổi từ 2 → 1
    staleTime: 30000,
  });

  const { threads = [], users = [] } = data || {};

  const recentThreads = useMemo(() => {
    return [...threads].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [threads]);

  // ✅ Đổi từ 2 → 1
  if (query.trim().length < 1) {
    return (
      <CustomScrollbar className={styles.container}>
        <div className={styles.empty}>
          Nhập từ khóa để tìm kiếm
        </div>
      </CustomScrollbar>
    );
  }

  return (
    <CustomScrollbar className={styles.container}>
      {isLoading ? (
        <div className={styles.loading}>Đang tìm kiếm...</div>
      ) : (
        <SearchResults
          recentThreads={recentThreads}
          profileUsers={users}
        />
      )}
    </CustomScrollbar>
  );
}