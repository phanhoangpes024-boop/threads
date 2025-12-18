// app/search/page.tsx - CẬP NHẬT
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomScrollbar from '@/components/CustomScrollbar';
import SearchBar from '@/components/SearchBar';
import UserCard from '@/components/UserCard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import styles from './Search.module.css';
import UserCardSkeleton from '@/components/Skeletons/UserCardSkeleton'


interface User {
  id: string;
  username: string;
  bio?: string;
  avatar_text: string;
  avatar_bg?: string;
  verified?: boolean;
  followers_count?: number;
}

export default function SearchPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [matchingUsers, setMatchingUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (user.id) {
      fetchSuggestedUsers();
    }
  }, [user.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        searchMatchingUsers();
      } else {
        setMatchingUsers([]);
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSuggestedUsers = async () => {
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
    }
  };

  const searchMatchingUsers = async () => {
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/search/users?q=${encodeURIComponent(searchQuery)}`
      );
      
      if (!res.ok) throw new Error('Search failed');
      
      const users = await res.json();
      setMatchingUsers(users);
      
    } catch (error) {
      console.error('Error searching users:', error);
      setMatchingUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserClick = (username: string) => {
    router.push(`/profile/${username}`);
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/search/results?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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
          onChange={setSearchQuery}
          onKeyDown={handleSearch}
        />
      </div>

      {isSearching ? (
  <div className={styles.resultsSection}>
    <h2 className={styles.sectionTitle}>Đang tìm kiếm...</h2>
    <div className={styles.userList}>
      <UserCardSkeleton />
      <UserCardSkeleton />
      <UserCardSkeleton />
      <UserCardSkeleton />
      <UserCardSkeleton />
    </div>
  </div>
      ) : matchingUsers.length > 0 ? (
        <div className={styles.resultsSection}>
          <h2 className={styles.sectionTitle}>Kết quả tìm kiếm</h2>
          <div className={styles.userList}>
            {matchingUsers.map((user) => (
              <div key={user.id} onClick={() => handleUserClick(user.username)}>
                <UserCard
                  id={user.id}
                  username={user.username}
                  bio={user.bio}
                  avatarText={user.avatar_text}
                  gradient={user.avatar_bg || '#0077B6'}
                />
              </div>
            ))}
          </div>
        </div>
      ) : searchQuery.trim() ? (
        <div className={styles.empty}>Không tìm thấy kết quả</div>
      ) : (
        <div className={styles.suggestionsSection}>
          <h2 className={styles.sectionTitle}>Gợi ý theo dõi</h2>
          <div className={styles.userList}>
            {suggestedUsers.map((user) => (
              <div key={user.id} onClick={() => handleUserClick(user.username)}>
                <UserCard
                  id={user.id}
                  username={user.username}
                  bio={user.bio}
                  avatarText={user.avatar_text}
                  gradient={user.avatar_bg || '#0077B6'}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </CustomScrollbar>
  );
}