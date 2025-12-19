// components/UserGrid/index.tsx
'use client';

import React from 'react';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useIsFollowing } from '@/hooks/useIsFollowing';
import styles from './UserGrid.module.css';

interface User {
  id: string;
  username: string;
  bio?: string;
  avatarText: string;
  avatar_bg?: string;
  gradient?: string;
}

interface UserGridProps {
  users: User[];
  onUserClick?: (username: string) => void; // ✅ THÊM
}

function UserGridItem({ 
  user, 
  onUserClick 
}: { 
  user: User;
  onUserClick?: (username: string) => void; // ✅ THÊM
}) {
  const { data: isFollowing = false, isLoading } = useIsFollowing(user.id);
  const followMutation = useFollowUser();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation(); // ← Quan trọng: không trigger onClick của card
    followMutation.mutate(user.id);
  };

  const handleCardClick = () => {
    onUserClick?.(user.username);
  };

  return (
    <div className={styles.userCard} onClick={handleCardClick}> {/* ✅ THÊM onClick */}
      <div className={styles.avatarWrapper}>
        <div
          className={styles.avatar}
          style={{ background: user.avatar_bg || user.gradient || '#0077B6' }}
        >
          {user.avatarText}
        </div>
        <div
          className={`${styles.addButton} ${isFollowing ? styles.added : ''}`}
          onClick={handleAdd}
        >
          {isLoading ? '...' : isFollowing ? '✓' : '+'}
        </div>
      </div>
      <div className={styles.username}>{user.username}</div>
      <div className={styles.name}>{user.bio || ''}</div>
    </div>
  );
}

export default function UserGrid({ users, onUserClick }: UserGridProps) {
  return (
    <div className={styles.userGrid}>
      {users.map((user) => (
        <UserGridItem 
          key={user.id} 
          user={user}
          onUserClick={onUserClick} // ✅ PASS PROP
        />
      ))}
    </div>
  );
}