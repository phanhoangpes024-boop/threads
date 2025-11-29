/// app/search/page.tsx
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
}

export default function SearchPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [matchingUsers, setMatchingUsers] = useState<User[]>([]);

  useEffect(() => {
    if (user.id) {
      fetchSuggestedUsers();
    }
  }, [user.id]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchMatchingUsers();
    } else {
      setMatchingUsers([]);
    }
  }, [searchQuery]);

  const fetchSuggestedUsers = async () => {
    try {
      const res = await fetch(`/api/users/suggestions?limit=5&user_id=${user.id}`);
      const data = await res.json();
      setSuggestedUsers(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const searchMatchingUsers = async () => {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=users`);
      const data = await res.json();
      setMatchingUsers(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
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

  const isEmpty = searchQuery === '';
  const hasInput = searchQuery.trim().length > 0;

  if (userLoading) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
          Loading...
        </div>
      </div>
    );
  }

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
            {suggestedUsers.map((user) => (
              <div key={user.id} onClick={() => handleUserClick(user.username)}>
                <UserCard
                  id={user.id}
                  username={user.username}
                  bio={user.bio}
                  avatarText={user.avatar_text}
                  onFollowToggle={handleFollowToggle}
                />
              </div>
            ))}
          </div>
        )}

        {hasInput && (
          <div className={styles.state}>
            {matchingUsers.length > 0 ? (
              matchingUsers.map((user) => (
                <div key={user.id} onClick={() => handleUserClick(user.username)}>
                  <UserCard
                    id={user.id}
                    username={user.username}
                    bio={user.bio}
                    avatarText={user.avatar_text}
                    onFollowToggle={handleFollowToggle}
                  />
                </div>
              ))
            ) : (
              <div className={styles.empty}>Không tìm thấy người dùng</div>
            )}
          </div>
        )}
      </div>
    </CustomScrollbar>
  );
}