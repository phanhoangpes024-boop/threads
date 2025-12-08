// app/search/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomScrollbar from '@/components/CustomScrollbar';
import SearchBar from '@/components/SearchBar';
import UserCard from '@/components/UserCard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import styles from './Search.module.css';

interface User {
  id: string;
  username: string;
  bio?: string;
  avatar_text: string;
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

  // ✅ SỬA HÀM NÀY - Gọi API riêng cho users
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

  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    try {
      await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
    } catch (error) {
      console.error('Error toggling follow:', error);
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
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
          Loading...
        </div>
      </div>
    );
  }

  const isEmpty = searchQuery === '';

  return (
    <CustomScrollbar className={styles.container}>
      <SearchBar 
        value={searchQuery} 
        onChange={setSearchQuery}
        onKeyDown={handleSearch}
      />

      <div className={styles.content}>
        {isEmpty && (
          <div className={styles.state}>
            <div className={styles.sectionHeader}>Gợi ý theo dõi</div>
            {suggestedUsers.map((u) => (
              <div key={u.id} onClick={() => handleUserClick(u.username)}>
                <UserCard
                  id={u.id}
                  username={u.username}
                  bio={u.bio}
                  avatarText={u.avatar_text}
                  onFollowToggle={handleFollowToggle}
                />
              </div>
            ))}
          </div>
        )}

        {!isEmpty && (
          <div className={styles.state}>
            {isSearching ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                Đang tìm...
              </div>
            ) : matchingUsers.length > 0 ? (
              matchingUsers.map((u) => (
                <div key={u.id} onClick={() => handleUserClick(u.username)}>
                  <UserCard
                    id={u.id}
                    username={u.username}
                    bio={u.bio}
                    avatarText={u.avatar_text}
                    onFollowToggle={handleFollowToggle}
                  />
                </div>
              ))
            ) : (
              <div className={styles.empty}>
                Không tìm thấy người dùng "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>
    </CustomScrollbar>
  );
}