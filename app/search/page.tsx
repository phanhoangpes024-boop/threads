// app/search/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CustomScrollbar from '@/components/CustomScrollbar';
import SearchBar from '@/components/SearchBar';
import UserCard from '@/components/UserCard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import styles from './Search.module.css';
import UserCardSkeleton from '@/components/Skeletons/UserCardSkeleton';

interface User {
  id: string;
  username: string;
  bio?: string;
  avatar_text: string;
  avatar_bg?: string;
  verified?: boolean;
  followers_count?: number;
  is_following?: boolean;
}

export default function SearchPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [matchingUsers, setMatchingUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (user.id) {
      fetchSuggestedUsers();
    }
  }, [user.id]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // ✅ BẬT SKELETON NGAY KHI CÓ TEXT
    if (searchQuery.trim().length >= 1) {
      setMatchingUsers([]);
      setIsSearching(true); // ← BẬT NGAY
    } else {
      setMatchingUsers([]);
      setIsSearching(false);
    }

    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        searchMatchingUsers();
      } else {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery]);

  const fetchSuggestedUsers = async () => {
    setIsLoadingSuggestions(true);
    try {
      const res = await fetch(
        `/api/users/suggestions?current_user_id=${user.id}&limit=8`
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestedUsers(data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const searchMatchingUsers = async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      const res = await fetch(
        `/api/search/users?q=${encodeURIComponent(searchQuery)}&current_user_id=${user.id}`,
        { signal: controller.signal }
      );
      
      if (!res.ok) throw new Error('Search failed');
      
      const users = await res.json();
      
      if (!controller.signal.aborted) {
        setMatchingUsers(users);
        setIsSearching(false); // ← TẮT SAU KHI CÓ DATA
      }
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error searching users:', error);
      }
      
      if (!controller.signal.aborted) {
        setMatchingUsers([]);
        setIsSearching(false);
      }
    }
  };

  const handleUserClick = useCallback((username: string) => {
    router.push(`/profile/${username}`);
  }, [router]);

  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/search/results?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery, router]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  if (userLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  return (
    <CustomScrollbar className={styles.container}>
      <div className={styles.searchWrapper}>
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearch}
        />
      </div>

      {isSearching ? (
        <div className={styles.resultsSection}>
          <div className={styles.sectionTitle}>Kết quả tìm kiếm</div>
          <UserCardSkeleton />
          <UserCardSkeleton />
          <UserCardSkeleton />
        </div>
      ) : searchQuery.trim() ? (
        <div className={styles.resultsSection}>
          <div className={styles.sectionTitle}>Kết quả tìm kiếm</div>
          {matchingUsers.length === 0 ? (
            <div className={styles.empty}>Không tìm thấy người dùng</div>
          ) : (
            <div className={styles.userList}>
              {matchingUsers.map((matchedUser) => (
                <UserCard
                  key={matchedUser.id}
                  id={matchedUser.id}
                  username={matchedUser.username}
                  bio={matchedUser.bio || ''}
                  avatarText={matchedUser.avatar_text}
                  gradient={matchedUser.avatar_bg}
                  initialFollowing={matchedUser.is_following || false}
                  onClick={() => handleUserClick(matchedUser.username)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.suggestionsSection}>
          <div className={styles.sectionHeader}>Gợi ý theo dõi</div>
          {isLoadingSuggestions ? (
            <div className={styles.userList}>
              <UserCardSkeleton />
              <UserCardSkeleton />
              <UserCardSkeleton />
            </div>
          ) : suggestedUsers.length === 0 ? (
            <div className={styles.empty}>Không có gợi ý</div>
          ) : (
            <div className={styles.userList}>
              {suggestedUsers.map((suggestedUser) => (
                <UserCard
                  key={suggestedUser.id}
                  id={suggestedUser.id}
                  username={suggestedUser.username}
                  bio={suggestedUser.bio || ''}
                  avatarText={suggestedUser.avatar_text}
                  gradient={suggestedUser.avatar_bg}
                  onClick={() => handleUserClick(suggestedUser.username)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </CustomScrollbar>
  );
}