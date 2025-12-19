// app/search/results/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import CustomScrollbar from '@/components/CustomScrollbar';
import SearchResults from '@/components/SearchResults';
import ThreadCardSkeleton from '@/components/Skeletons/ThreadCardSkeleton';
import UserCardSkeleton from '@/components/Skeletons/UserCardSkeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import styles from './SearchResults.module.css';

type TabType = 'posts' | 'profiles';

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  const { data, isLoading } = useQuery({
    queryKey: ['search-v2', query, user.id],
    queryFn: async () => {
      if (!query.trim() || query.trim().length < 1) {
        return { threads: [], users: [] };
      }
      
      const res = await fetch(
        `/api/search/v2?q=${encodeURIComponent(query)}&user_id=${user.id}`
      );
      
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: query.trim().length >= 1,
    staleTime: 30000,
  });

  const { threads = [], users = [] } = data || {};

  const recentThreads = useMemo(() => {
    return [...threads].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [threads]);

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
      {/* ✅ TABS LUÔN HIỂN THỊ */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'posts' ? styles.active : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Bài viết
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'profiles' ? styles.active : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          Trang cá nhân
        </button>
      </div>

      {/* ✅ CONTENT DỰA VÀO LOADING STATE */}
      {isLoading ? (
        <div>
          {activeTab === 'posts' ? (
            <div>
              <ThreadCardSkeleton />
              <ThreadCardSkeleton hasImage />
              <ThreadCardSkeleton />
            </div>
          ) : (
            <div>
              <UserCardSkeleton />
              <UserCardSkeleton />
              <UserCardSkeleton />
            </div>
          )}
        </div>
      ) : (
        <SearchResults
          recentThreads={recentThreads}
          profileUsers={users}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </CustomScrollbar>
  );
}