// components/UserCard/index.tsx
'use client';

import React, { useState } from 'react';
import styles from './UserCard.module.css';

interface UserCardProps {
  id: string;
  username: string;
  bio?: string;
  avatarText: string;
  gradient?: string;
  onFollowToggle?: (userId: string, isFollowing: boolean) => void;
}

export default function UserCard({
  id,
  username,
  bio,
  avatarText,
  gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  onFollowToggle,
}: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isFollowing;
    setIsFollowing(newState);
    onFollowToggle?.(id, newState);
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
      >
        {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
      </button>
    </div>
  );
}