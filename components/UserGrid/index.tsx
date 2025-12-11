// components/UserGrid/index.tsx - CẬP NHẬT
'use client';

import React from 'react';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useIsFollowing } from '@/hooks/useIsFollowing';
import styles from './UserGrid.module.css';

interface User {
  id: string;
  username: string;
  name: string;
  avatarText: string;
  gradient?: string;
}

interface UserGridProps {
  users: User[];
}

function UserGridItem({ user }: { user: User }) {
  // ✅ Fetch trạng thái từ server
  const { data: isFollowing = false, isLoading } = useIsFollowing(user.id);
  const followMutation = useFollowUser();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    followMutation.mutate(user.id);
  };

  return (
    <div className={styles.userCard}>
      <div className={styles.avatarWrapper}>
        <div
          className={styles.avatar}
          style={{ background: user.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
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
      <div className={styles.name}>{user.name}</div>
    </div>
  );
}

export default function UserGrid({ users }: UserGridProps) {
  return (
    <div className={styles.userGrid}>
      {users.map((user) => (
        <UserGridItem key={user.id} user={user} />
      ))}
    </div>
  );
}