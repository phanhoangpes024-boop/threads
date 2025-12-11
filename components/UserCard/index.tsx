// components/UserCard/index.tsx - CẬP NHẬT
'use client';

import React from 'react';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useIsFollowing } from '@/hooks/useIsFollowing';
import styles from './UserCard.module.css';

interface UserCardProps {
  id: string;
  username: string;
  bio?: string;
  avatarText: string;
  gradient?: string;
}

export default function UserCard({
  id,
  username,
  bio,
  avatarText,
  gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
}: UserCardProps) {
  // ✅ Fetch trạng thái từ server
  const { data: isFollowing = false, isLoading } = useIsFollowing(id);
  const followMutation = useFollowUser();

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    followMutation.mutate(id);
  };

  return (
    <div className={styles.userCard}>
      <div className={styles.avatar} style={{ background: gradient }}>
        {avatarText}
      </div>
      <div className={styles.userInfo}>
        <div className={styles.username}>{username}</div>
        {bio && <div className={styles.userBio}>{bio}</div>}
      </div>
      <button
        className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
        onClick={handleFollow}
        disabled={followMutation.isPending || isLoading}
      >
        {isLoading ? '...' : isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
      </button>
    </div>
  );
}